(function(){
  'use strict';

  // ============================================================
  // DOM references
  // ============================================================
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  const stage = document.getElementById('stage');
  const canvasScroll = document.getElementById('canvasScroll');
  const canvasWrap = document.getElementById('canvasWrap');
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const cropBox = document.getElementById('cropBox');
  const cropActions = document.getElementById('cropActions');
  const brushControls = document.getElementById('brushControls');

  const brushSizeInput = document.getElementById('brushSize');
  const maskPadInput = document.getElementById('maskPad');
  const featherRange = document.getElementById('featherRange');
  const featherVal = document.getElementById('featherVal');

  const fillBtn = document.getElementById('fillBtn');
  const undoBtn = document.getElementById('undoBtn');
  const undoActionBtn = document.getElementById('undoActionBtn');
  const compareBtn = document.getElementById('compareBtn');
  const clearBtn = document.getElementById('clearBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const downloadFormat = document.getElementById('downloadFormat');
  const stripMetadata = document.getElementById('stripMetadata');
  const previewModal = document.getElementById('previewModal');
  const previewCanvas = document.getElementById('previewCanvas');
  const previewClose = document.getElementById('previewClose');
  const previewCancel = document.getElementById('previewCancel');
  const previewDownload = document.getElementById('previewDownload');
  const previewNote = document.querySelector('.preview-note');
  const engineSelect = document.getElementById('engineSelect');
  const statusEl = document.getElementById('status');

  const zoomInBtn = document.getElementById('zoomIn');
  const zoomOutBtn = document.getElementById('zoomOut');
  const zoomLabel = document.getElementById('zoomLabel');

  const toolBrush = document.getElementById('toolBrush');
  const toolEraser = document.getElementById('toolEraser');
  const toolCrop = document.getElementById('toolCrop');
  const rotateCW = document.getElementById('rotateCW');
  const rotateCCW = document.getElementById('rotateCCW');
  const cropApply = document.getElementById('cropApply');
  const cropCancel = document.getElementById('cropCancel');

  const panelTabs = document.querySelectorAll('.panel-tab');
  const panels = { fillPanel: document.getElementById('fillPanel'), modelPanel: document.getElementById('modelPanel'), metaPanel: document.getElementById('metaPanel') };

  const modelBadge = document.getElementById('modelBadge');
  const chooseModelBtn = document.getElementById('chooseModelBtn');
  const modelFileInput = document.getElementById('modelFileInput');
  const forgetModelBtn = document.getElementById('forgetModelBtn');
  const modelUrlInput = document.getElementById('modelUrlInput');
  const modelUrlBtn = document.getElementById('modelUrlBtn');
  const modelProgress = document.getElementById('modelProgress');
  const modelStatus = document.getElementById('modelStatus');
  const metaContent = document.getElementById('metaContent');

  // ============================================================
  // App state
  // ============================================================
  let maskCanvas = document.createElement('canvas');
  let maskCtx = maskCanvas.getContext('2d');
  let maskHistory = [];      // in-progress brush stroke undo (ImageData of maskCanvas)
  let actionHistory = [];    // committed-action undo (crop / rotate / fill) — full canvas snapshots
  let compareSnapshot = null;
  let initialImageData = null;
  let originalImageData = null; // current canvas pixels *without* the live mask overlay
  let drawing = false;
  let hasMask = false;
  let tool = 'brush';
  let zoom = 1;
  let cropping = false;
  let sourceFile = null;

  function setStatus(msg){ statusEl.textContent = msg; }

  // ============================================================
  // Loading an image
  // ============================================================
  function isImageFile(file){
    if (!file) return false;
    return file.type.startsWith('image/') || /\.(avif|gif|jpe?g|png|webp|bmp|svg)$/i.test(file.name || '');
  }
  function loadImageFile(file){
    if (!isImageFile(file)){
      setStatus('Choose an image file such as JPG, PNG, or WEBP.');
      return;
    }
    const img = new Image();
    sourceFile = file;
    const url = URL.createObjectURL(file);
    img.onload = function(){
      const maxDim = 2200;
      let w = img.width, h = img.height;
      if (w > maxDim || h > maxDim){
        const scale = maxDim / Math.max(w,h);
        w = Math.round(w*scale); h = Math.round(h*scale);
      }
      canvas.width = w; canvas.height = h;
      canvas.style.width = '';
      maskCanvas.width = w; maskCanvas.height = h;
      ctx.clearRect(0,0,w,h);
      ctx.drawImage(img,0,0,w,h);
      originalImageData = ctx.getImageData(0,0,w,h);
      initialImageData = ctx.getImageData(0,0,w,h);
      maskCtx.clearRect(0,0,w,h);
      maskHistory = [];
      actionHistory = [];
      compareSnapshot = { w, h, data: initialImageData };
      hasMask = false;
      zoom = 1;
      updateZoomLabel();
      stage.classList.add('active');
      dropzone.style.display = 'none';
      fillBtn.disabled = true;
      downloadBtn.disabled = false;
      undoBtn.disabled = true;
      undoActionBtn.disabled = true;
      compareBtn.disabled = !compareSnapshot;
      setTool('brush');
      setStatus('Paint over the area to remove, then choose Fill.');
      URL.revokeObjectURL(url);

      readMetadata(file, w, h);
    };
    img.onerror = function(){ setStatus('Could not read that file as an image.'); URL.revokeObjectURL(url); };
    img.src = url;
  }

  dropzone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', e => loadImageFile(e.target.files[0]));
  let dragDepth = 0;
  dropzone.addEventListener('dragenter', e => {
    e.preventDefault();
    dragDepth++;
    dropzone.classList.add('drag');
  });
  dropzone.addEventListener('dragover', e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  });
  dropzone.addEventListener('dragleave', e => {
    e.preventDefault();
    dragDepth = Math.max(0, dragDepth - 1);
    if (!dragDepth) dropzone.classList.remove('drag');
  });
  dropzone.addEventListener('drop', e => {
    e.preventDefault();
    dragDepth = 0;
    dropzone.classList.remove('drag');
    loadImageFile(e.dataTransfer.files[0]);
  });
  document.addEventListener('dragover', e => {
    if (Array.from(e.dataTransfer?.types || []).includes('Files')) e.preventDefault();
  });
  document.addEventListener('drop', e => {
    if (Array.from(e.dataTransfer?.types || []).includes('Files')){
      e.preventDefault();
      if (!dropzone.contains(e.target)) setStatus('Drop the image in the highlighted upload area.');
    }
  });

  clearBtn.addEventListener('click', () => {
    stage.classList.remove('active');
    dropzone.style.display = '';
    originalImageData = null;
    initialImageData = null;
    compareSnapshot = null;
    sourceFile = null;
    fileInput.value = '';
    setStatus('Paint over the area to remove.');
    metaContent.innerHTML = '<p class="hint">Load a photo to see its embedded metadata here.</p>';
  });

  // ============================================================
  // Panel tabs
  // ============================================================
  panelTabs.forEach(tab => tab.addEventListener('click', () => {
    panelTabs.forEach(t => t.classList.remove('active'));
    Object.values(panels).forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    panels[tab.dataset.panel].classList.add('active');
  }));

  // ============================================================
  // Zoom
  // ============================================================
  function applyZoom(){
    if (zoom === 1){ canvas.style.width = ''; }
    else {
      const fitWidth = canvasScroll.clientWidth;
      canvas.style.width = Math.round(fitWidth * zoom) + 'px';
    }
    canvas.style.height = 'auto';
  }
  function updateZoomLabel(){ zoomLabel.textContent = Math.round(zoom*100) + '%'; }
  zoomInBtn.addEventListener('click', () => { zoom = Math.min(4, +(zoom+0.25).toFixed(2)); applyZoom(); updateZoomLabel(); });
  zoomOutBtn.addEventListener('click', () => { zoom = Math.max(0.25, +(zoom-0.25).toFixed(2)); applyZoom(); updateZoomLabel(); });

  // ============================================================
  // Tool selection
  // ============================================================
  function setTool(name){
    if (cropping && name !== 'crop') exitCropMode(false);
    tool = name;
    [toolBrush, toolEraser, toolCrop].forEach(b => b.classList.remove('active'));
    if (name === 'brush') toolBrush.classList.add('active');
    if (name === 'eraser') toolEraser.classList.add('active');
    if (name === 'crop') toolCrop.classList.add('active');
    if (name === 'crop'){
      brushControls.style.display = 'none';
      enterCropMode();
    } else {
      brushControls.style.display = '';
      cropActions.style.display = 'none';
      canvas.classList.remove('crop-mode');
    }
  }
  toolBrush.addEventListener('click', () => setTool('brush'));
  toolEraser.addEventListener('click', () => setTool('eraser'));
  toolCrop.addEventListener('click', () => setTool(tool === 'crop' ? 'brush' : 'crop'));

  // ============================================================
  // Brush painting
  // ============================================================
  function getPos(e){
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const point = e.touches ? e.touches[0] : e;
    return { x: (point.clientX - rect.left) * scaleX, y: (point.clientY - rect.top) * scaleY };
  }

  function paintDot(x,y){
    const r = parseInt(brushSizeInput.value,10);
    if (tool === 'eraser'){
      maskCtx.save();
      maskCtx.globalCompositeOperation = 'destination-out';
      maskCtx.beginPath(); maskCtx.arc(x,y,r,0,Math.PI*2); maskCtx.fill();
      maskCtx.restore();
    } else {
      maskCtx.fillStyle = 'rgba(255,60,60,0.55)';
      maskCtx.beginPath(); maskCtx.arc(x,y,r,0,Math.PI*2); maskCtx.fill();
    }
  }

  function paintLine(x0,y0,x1,y1){
    const r = parseInt(brushSizeInput.value,10);
    const dist = Math.hypot(x1-x0, y1-y0);
    const step = Math.max(1, r/3);
    const steps = Math.max(1, Math.ceil(dist/step));
    for (let i=0; i<=steps; i++){
      const t = i/steps;
      paintDot(x0 + (x1-x0)*t, y0 + (y1-y0)*t);
    }
  }

  function redrawWithMask(){
    if (!originalImageData) return;
    ctx.putImageData(originalImageData,0,0);
    ctx.drawImage(maskCanvas,0,0);
  }

  function maskHasContent(){
    const d = maskCtx.getImageData(0,0,maskCanvas.width,maskCanvas.height).data;
    for (let i=3; i<d.length; i+=4){ if (d[i] > 10) return true; }
    return false;
  }

  let lastX = 0, lastY = 0;
  function startDraw(e){
    if (!originalImageData || cropping) return;
    e.preventDefault();
    drawing = true;
    maskHistory.push(maskCtx.getImageData(0,0,maskCanvas.width,maskCanvas.height));
    if (maskHistory.length > 20) maskHistory.shift();
    const p = getPos(e);
    lastX = p.x; lastY = p.y;
    paintDot(p.x,p.y);
    redrawWithMask();
    setStatus('Selection marked. Click Remove selection to apply the fill.');
    undoBtn.disabled = false;
  }
  function moveDraw(e){
    if (!drawing) return;
    e.preventDefault();
    const p = getPos(e);
    paintLine(lastX,lastY,p.x,p.y);
    lastX = p.x; lastY = p.y;
    redrawWithMask();
  }
  function endDraw(){
    if (!drawing) return;
    drawing = false;
    hasMask = maskHasContent();
    fillBtn.disabled = !hasMask;
  }

  canvas.addEventListener('mousedown', startDraw);
  canvas.addEventListener('mousemove', moveDraw);
  window.addEventListener('mouseup', endDraw);
  canvas.addEventListener('touchstart', startDraw, {passive:false});
  canvas.addEventListener('touchmove', moveDraw, {passive:false});
  canvas.addEventListener('touchend', endDraw);
  canvas.addEventListener('touchcancel', endDraw);

  undoBtn.addEventListener('click', () => {
    if (!maskHistory.length) return;
    maskCtx.putImageData(maskHistory.pop(), 0, 0);
    redrawWithMask();
    hasMask = maskHasContent();
    fillBtn.disabled = !hasMask;
    if (!maskHistory.length) undoBtn.disabled = true;
  });

  // ============================================================
  // Committed-action history (crop / rotate / fill) + compare
  // ============================================================
  function pushActionSnapshot(){
    actionHistory.push({
      w: canvas.width,
      h: canvas.height,
      data: new ImageData(new Uint8ClampedArray(originalImageData.data), originalImageData.width, originalImageData.height),
      compare: compareSnapshot && { w: compareSnapshot.w, h: compareSnapshot.h, data: new ImageData(new Uint8ClampedArray(compareSnapshot.data.data), compareSnapshot.data.width, compareSnapshot.data.height) }
    });
    if (actionHistory.length > 8) actionHistory.shift();
    undoActionBtn.disabled = false;
  }
  undoActionBtn.addEventListener('click', () => {
    if (!actionHistory.length) return;
    const snap = actionHistory.pop();
    canvas.width = snap.w; canvas.height = snap.h;
    maskCanvas.width = snap.w; maskCanvas.height = snap.h;
    ctx.putImageData(snap.data, 0, 0);
    originalImageData = snap.data;
    compareSnapshot = snap.compare;
    maskCtx.clearRect(0,0,snap.w,snap.h);
    maskHistory = []; hasMask = false;
    fillBtn.disabled = true; undoBtn.disabled = true;
    applyZoom();
    if (!actionHistory.length) undoActionBtn.disabled = true;
    compareBtn.disabled = !compareSnapshot || compareSnapshot.w !== canvas.width || compareSnapshot.h !== canvas.height;
    setStatus('Reverted last action.');
  });
  compareBtn.addEventListener('mousedown', showCompare);
  compareBtn.addEventListener('touchstart', showCompare, {passive:true});
  compareBtn.addEventListener('mouseup', hideCompare);
  compareBtn.addEventListener('mouseleave', hideCompare);
  compareBtn.addEventListener('touchend', hideCompare);
  function showCompare(){
    if (!compareSnapshot || compareSnapshot.w !== canvas.width || compareSnapshot.h !== canvas.height) return;
    ctx.putImageData(compareSnapshot.data, 0, 0);
  }
  function hideCompare(){
    if (!originalImageData) return;
    redrawWithMask();
  }

  // ============================================================
  // Rotate
  // ============================================================
  function rotate(dir){
    if (!originalImageData) return;
    pushActionSnapshot();
    const w = canvas.width, h = canvas.height;
    const tmp = document.createElement('canvas');
    tmp.width = h; tmp.height = w;
    const tctx = tmp.getContext('2d');
    tctx.translate(dir === 1 ? h : 0, dir === 1 ? 0 : w);
    tctx.rotate(dir === 1 ? Math.PI/2 : -Math.PI/2);
    tctx.drawImage(canvas, 0, 0);
    canvas.width = h; canvas.height = w;
    ctx.drawImage(tmp, 0, 0);
    originalImageData = ctx.getImageData(0,0,canvas.width,canvas.height);
    if (compareSnapshot){ compareSnapshot = { w: canvas.width, h: canvas.height, data: rotateImageData(compareSnapshot.data, dir) }; }
    maskCanvas.width = canvas.width; maskCanvas.height = canvas.height;
    maskCtx.clearRect(0,0,canvas.width,canvas.height);
    maskHistory = []; hasMask = false; fillBtn.disabled = true; undoBtn.disabled = true;
    applyZoom();
    setStatus('Rotated. (Mask cleared.)');
  }
  rotateCW.addEventListener('click', () => rotate(1));
  rotateCCW.addEventListener('click', () => rotate(-1));

  function rotateImageData(imageData, dir){
    const source = document.createElement('canvas');
    source.width = imageData.width; source.height = imageData.height;
    source.getContext('2d').putImageData(imageData, 0, 0);
    const rotated = document.createElement('canvas');
    rotated.width = imageData.height; rotated.height = imageData.width;
    const rotatedContext = rotated.getContext('2d');
    rotatedContext.translate(dir === 1 ? rotated.width : 0, dir === 1 ? 0 : rotated.height);
    rotatedContext.rotate(dir === 1 ? Math.PI / 2 : -Math.PI / 2);
    rotatedContext.drawImage(source, 0, 0);
    return rotatedContext.getImageData(0, 0, rotated.width, rotated.height);
  }

  function cropImageData(imageData, sx, sy, sw, sh){
    const source = document.createElement('canvas');
    source.width = imageData.width; source.height = imageData.height;
    source.getContext('2d').putImageData(imageData, 0, 0);
    const cropped = document.createElement('canvas');
    cropped.width = sw; cropped.height = sh;
    cropped.getContext('2d').drawImage(source, sx, sy, sw, sh, 0, 0, sw, sh);
    return cropped.getContext('2d').getImageData(0, 0, sw, sh);
  }

  // ============================================================
  // Crop
  // ============================================================
  let cropDrag = null;
  function enterCropMode(){
    cropping = true;
    canvas.classList.add('crop-mode');
    cropActions.style.display = 'flex';
    const w = canvasWrap.clientWidth, h = canvasWrap.clientHeight;
    const bw = w*0.6, bh = h*0.6;
    cropBox.style.left = ((w-bw)/2) + 'px';
    cropBox.style.top = ((h-bh)/2) + 'px';
    cropBox.style.width = bw + 'px';
    cropBox.style.height = bh + 'px';
    cropBox.style.display = 'block';
    setStatus('Drag the box, or its corners, then Apply crop.');
  }
  function exitCropMode(){
    cropping = false;
    cropBox.style.display = 'none';
    cropActions.style.display = 'none';
    canvas.classList.remove('crop-mode');
  }
  cropCancel.addEventListener('click', () => { setTool('brush'); });

  function cropPointerDown(e){
    if (!cropping) return;
    const target = e.target;
    const isHandle = target.classList.contains('crop-handle');
    e.preventDefault();
    const p = e.touches ? e.touches[0] : e;
    cropDrag = {
      mode: isHandle ? [...target.classList].find(c=>c!=='crop-handle') : 'move',
      startX: p.clientX, startY: p.clientY,
      left: parseFloat(cropBox.style.left), top: parseFloat(cropBox.style.top),
      width: parseFloat(cropBox.style.width), height: parseFloat(cropBox.style.height)
    };
  }
  function cropPointerMove(e){
    if (!cropDrag) return;
    e.preventDefault();
    const p = e.touches ? e.touches[0] : e;
    const dx = p.clientX - cropDrag.startX, dy = p.clientY - cropDrag.startY;
    const maxW = canvasWrap.clientWidth, maxH = canvasWrap.clientHeight;
    let { left, top, width, height } = cropDrag;
    if (cropDrag.mode === 'move'){
      left = Math.min(Math.max(0,left+dx), maxW-width);
      top = Math.min(Math.max(0,top+dy), maxH-height);
    } else if (cropDrag.mode === 'se'){
      width = Math.min(Math.max(20,width+dx), maxW-left);
      height = Math.min(Math.max(20,height+dy), maxH-top);
    } else if (cropDrag.mode === 'ne'){
      width = Math.min(Math.max(20,width+dx), maxW-left);
      const newTop = Math.max(0, top+dy);
      height = Math.max(20, height + (top-newTop));
      top = newTop;
    } else if (cropDrag.mode === 'sw'){
      const newLeft = Math.max(0, left+dx);
      width = Math.max(20, width + (left-newLeft));
      left = newLeft;
      height = Math.min(Math.max(20,height+dy), maxH-top);
    } else if (cropDrag.mode === 'nw'){
      const newLeft = Math.max(0, left+dx);
      width = Math.max(20, width + (left-newLeft));
      left = newLeft;
      const newTop = Math.max(0, top+dy);
      height = Math.max(20, height + (top-newTop));
      top = newTop;
    }
    cropBox.style.left = left+'px'; cropBox.style.top = top+'px';
    cropBox.style.width = width+'px'; cropBox.style.height = height+'px';
  }
  function cropPointerUp(){ cropDrag = null; }
  cropBox.addEventListener('mousedown', cropPointerDown);
  window.addEventListener('mousemove', cropPointerMove);
  window.addEventListener('mouseup', cropPointerUp);
  cropBox.addEventListener('touchstart', cropPointerDown, {passive:false});
  window.addEventListener('touchmove', cropPointerMove, {passive:false});
  window.addEventListener('touchend', cropPointerUp);

  cropApply.addEventListener('click', () => {
    const canvasRect = canvas.getBoundingClientRect();
    const boxRect = cropBox.getBoundingClientRect();
    const scaleX = canvas.width / canvasRect.width;
    const scaleY = canvas.height / canvasRect.height;
    const sx = Math.max(0, Math.round((boxRect.left - canvasRect.left) * scaleX));
    const sy = Math.max(0, Math.round((boxRect.top - canvasRect.top) * scaleY));
    const sw = Math.min(canvas.width - sx, Math.round(boxRect.width * scaleX));
    const sh = Math.min(canvas.height - sy, Math.round(boxRect.height * scaleY));
    if (sw < 4 || sh < 4){ setStatus('Crop area too small.'); return; }

    pushActionSnapshot();
    const tmp = document.createElement('canvas');
    tmp.width = sw; tmp.height = sh;
    tmp.getContext('2d').drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
    canvas.width = sw; canvas.height = sh;
    ctx.drawImage(tmp, 0, 0);
    originalImageData = ctx.getImageData(0,0,sw,sh);
    if (compareSnapshot){ compareSnapshot = { w: sw, h: sh, data: cropImageData(compareSnapshot.data, sx, sy, sw, sh) }; }
    maskCanvas.width = sw; maskCanvas.height = sh;
    maskCtx.clearRect(0,0,sw,sh);
    maskHistory = []; hasMask = false; fillBtn.disabled = true; undoBtn.disabled = true;
    zoom = 1; applyZoom(); updateZoomLabel();
    setTool('brush');
    setStatus('Cropped.');
  });

  // ============================================================
  // Feather slider label
  // ============================================================
  featherRange.addEventListener('input', () => { featherVal.textContent = featherRange.value + 'px'; });

  // ============================================================
  // Mask geometry helpers (shared by both fill engines)
  // ============================================================
  function maskBoundingBox(pad){
    const w = maskCanvas.width, h = maskCanvas.height;
    const d = maskCtx.getImageData(0,0,w,h).data;
    let minX=w, minY=h, maxX=-1, maxY=-1;
    for (let y=0;y<h;y++){
      for (let x=0;x<w;x++){
        if (d[(y*w+x)*4+3] > 10){
          if (x<minX) minX=x; if (x>maxX) maxX=x;
          if (y<minY) minY=y; if (y>maxY) maxY=y;
        }
      }
    }
    if (maxX < 0) return null;
    minX = Math.max(0, minX-pad); minY = Math.max(0, minY-pad);
    maxX = Math.min(w-1, maxX+pad); maxY = Math.min(h-1, maxY+pad);
    return { x:minX, y:minY, w:(maxX-minX+1), h:(maxY-minY+1), minX, minY, maxX, maxY };
  }

  // ============================================================
  // Quick fill — exemplar-based patch-match inpainting
  // ============================================================
  async function quickFill(){
    const w = canvas.width, h = canvas.height;
    const data = new Uint8ClampedArray(originalImageData.data);
    const maskData = maskCtx.getImageData(0,0,w,h).data;
    const bbox = maskBoundingBox(0);
    if (!bbox) return null;
    const { minX, minY, maxX, maxY } = bbox;

    const filled = new Uint8Array(w*h);
    let maskCount = 0;
    for (let y=0;y<h;y++){
      for (let x=0;x<w;x++){
        const i = y*w+x;
        const isMasked = maskData[i*4+3] > 10;
        filled[i] = isMasked ? 0 : 1;
        if (isMasked) maskCount++;
      }
    }
    if (maskCount === 0) return null;

    const R = 4;
    const isKnown = (x,y) => x>=0 && y>=0 && x<w && y<h && filled[y*w+x] === 1;

    function collectCandidates(pad, stride, cap){
      const list = [];
      const x0 = Math.max(0, minX-pad), x1 = Math.min(w-1, maxX+pad);
      const y0 = Math.max(0, minY-pad), y1 = Math.min(h-1, maxY+pad);
      for (let y=y0+R; y<=y1-R; y+=stride){
        for (let x=x0+R; x<=x1-R; x+=stride){
          let ok = true;
          for (let dy=-R; dy<=R && ok; dy+=2){
            for (let dx=-R; dx<=R; dx+=2){ if (!isKnown(x+dx,y+dy)){ ok=false; break; } }
          }
          if (ok) list.push({x,y});
        }
      }
      if (list.length > cap){
        for (let i=list.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; [list[i],list[j]]=[list[j],list[i]]; }
        return list.slice(0,cap);
      }
      return list;
    }

    let candidates = collectCandidates(90, 3, 1400);
    if (candidates.length < 24) candidates = collectCandidates(Math.max(w,h), 3, 1400);
    if (candidates.length === 0){
      setStatus('Not enough surrounding texture to sample from — try a smaller brush or add more padding.');
      return null;
    }

    const front = new Set();
    const N8 = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
    for (let y=Math.max(0,minY-1); y<=Math.min(h-1,maxY+1); y++){
      for (let x=Math.max(0,minX-1); x<=Math.min(w-1,maxX+1); x++){
        const i = y*w+x;
        if (filled[i]) continue;
        for (const [dx,dy] of N8){ if (isKnown(x+dx,y+dy)){ front.add(i); break; } }
      }
    }

    function patchKnownCount(cx,cy){
      let c=0;
      for (let dy=-R; dy<=R; dy++) for (let dx=-R; dx<=R; dx++) if (isKnown(cx+dx,cy+dy)) c++;
      return c;
    }
    function pickBestFront(){
      let best=-1, bestScore=-1;
      for (const idx of front){
        const x=idx%w, y=(idx/w)|0;
        const s = patchKnownCount(x,y);
        if (s>bestScore){ bestScore=s; best=idx; }
      }
      return best;
    }
    function ssdAt(cx,cy,cand){
      let sum=0, count=0;
      for (let dy=-R; dy<=R; dy++){
        for (let dx=-R; dx<=R; dx++){
          const tx=cx+dx, ty=cy+dy;
          if (!isKnown(tx,ty)) continue;
          const sx=cand.x+dx, sy=cand.y+dy;
          const tI=(ty*w+tx)*4, sI=(sy*w+sx)*4;
          const dr=data[tI]-data[sI], dg=data[tI+1]-data[sI+1], db=data[tI+2]-data[sI+2];
          sum += dr*dr+dg*dg+db*db; count++;
        }
      }
      return count>0 ? sum/count : Infinity;
    }
    function fillFrom(cx,cy,cand){
      for (let dy=-R; dy<=R; dy++){
        for (let dx=-R; dx<=R; dx++){
          const tx=cx+dx, ty=cy+dy;
          if (tx<0||ty<0||tx>=w||ty>=h) continue;
          const tIdx = ty*w+tx;
          if (filled[tIdx]) continue;
          const sx=cand.x+dx, sy=cand.y+dy;
          if (sx<0||sy<0||sx>=w||sy>=h) continue;
          const sPix=(sy*w+sx)*4, tPix=tIdx*4;
          data[tPix]=data[sPix]; data[tPix+1]=data[sPix+1]; data[tPix+2]=data[sPix+2]; data[tPix+3]=255;
          filled[tIdx]=1; front.delete(tIdx);
          for (const [ddx,ddy] of N8){
            const nx=tx+ddx, ny=ty+ddy;
            if (nx<0||ny<0||nx>=w||ny>=h) continue;
            if (!filled[ny*w+nx]) front.add(ny*w+nx);
          }
        }
      }
    }

    let guard = 0;
    const maxIter = maskCount * 2 + 500;
    let stepsSinceYield = 0;
    while (front.size > 0 && guard < maxIter){
      guard++;
      const idx = pickBestFront();
      if (idx < 0) break;
      const cx = idx % w, cy = (idx / w) | 0;
      let bestCand = null, bestScore = Infinity;
      for (const cand of candidates){
        const s = ssdAt(cx,cy,cand);
        if (s < bestScore){ bestScore = s; bestCand = cand; }
      }
      if (bestCand) fillFrom(cx,cy,bestCand); else front.delete(idx);
      stepsSinceYield++;
      if (stepsSinceYield >= 12){
        stepsSinceYield = 0;
        setStatus('Filling… (' + Math.max(0, front.size) + ' px left)');
        await new Promise(r => setTimeout(r, 0));
      }
    }
    const out = ctx.createImageData(w,h);
    out.data.set(data);
    return out;
  }

  // ============================================================
  // AI fill — LaMa via ONNX Runtime Web
  // ============================================================
  const DB_NAME = 'lama-inpaint-cache', STORE = 'models';
  function idbOpen(){
    return new Promise((resolve,reject)=>{
      const req = indexedDB.open(DB_NAME,1);
      req.onupgradeneeded = () => { req.result.createObjectStore(STORE); };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  async function idbGet(key){
    const db = await idbOpen();
    return new Promise((resolve,reject)=>{
      const tx = db.transaction(STORE,'readonly');
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }
  async function idbSet(key,val){
    const db = await idbOpen();
    return new Promise((resolve,reject)=>{
      const tx = db.transaction(STORE,'readwrite');
      tx.objectStore(STORE).put(val,key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
  async function idbDelete(key){
    const db = await idbOpen();
    return new Promise((resolve,reject)=>{
      const tx = db.transaction(STORE,'readwrite');
      tx.objectStore(STORE).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  const Model = {
    session: null, inputNames: [], outputNames: [], imageInputName: null, maskInputName: null,
    inputWidth: null, inputHeight: null,
    async loadFromBytes(bytes){
      if (!window.ort) throw new Error('ONNX Runtime failed to load from the CDN — check your network connection.');
      modelStatus.textContent = 'Initializing runtime…';
      ort.env.wasm.numThreads = Math.min(4, navigator.hardwareConcurrency || 4);
      this.session = await ort.InferenceSession.create(bytes, { executionProviders: ['wasm'] });
      this.inputNames = this.session.inputNames;
      this.outputNames = this.session.outputNames;
      this.imageInputName = this.inputNames.find(n => /img|image|rgb/i.test(n)) || this.inputNames[0];
      this.maskInputName = this.inputNames.find(n => /mask/i.test(n)) || this.inputNames.find(n => n !== this.imageInputName) || this.inputNames[0];
      const imageMetadata = this.session.inputMetadata?.[this.imageInputName];
      const dimensions = imageMetadata?.dimensions || imageMetadata?.shape || [];
      this.inputHeight = Number(dimensions[2]) || null;
      this.inputWidth = Number(dimensions[3]) || null;
    }
  };

  function setModelReady(){
    modelBadge.textContent = 'Model ready';
    modelBadge.className = 'badge good';
    const inputSize = Model.inputWidth && Model.inputHeight ? ` (${Model.inputWidth} × ${Model.inputHeight})` : '';
    modelStatus.textContent = 'Inputs: ' + Model.inputNames.join(', ') + inputSize + '  →  output: ' + Model.outputNames[0];
    engineSelect.value = 'lama';
  }

  chooseModelBtn.addEventListener('click', () => modelFileInput.click());
  modelFileInput.addEventListener('change', async e => {
    const f = e.target.files[0];
    if (!f) return;
    try{
      modelBadge.textContent = 'Loading…'; modelBadge.className = 'badge';
      modelStatus.textContent = 'Reading ' + f.name + ' (' + (f.size/1e6).toFixed(0) + ' MB)…';
      const buf = await f.arrayBuffer();
      await Model.loadFromBytes(buf);
      await idbSet('lama', { name: f.name, bytes: buf });
      setModelReady();
    }catch(err){
      modelBadge.textContent = 'Load failed'; modelBadge.className = 'badge bad';
      modelStatus.textContent = 'Could not load model: ' + err.message;
    }
  });

  forgetModelBtn.addEventListener('click', async () => {
    try{ await idbDelete('lama'); }catch(e){}
    Model.session = null;
    modelBadge.textContent = 'No model loaded'; modelBadge.className = 'badge';
    modelStatus.textContent = 'Cached model cleared.';
  });

  function normalizeModelUrl(url){
    return url.trim().replace('/blob/', '/resolve/');
  }
  modelUrlBtn.addEventListener('click', async () => {
    let url = modelUrlInput.value.trim();
    if (!url) return;
    url = normalizeModelUrl(url);
    try{
      modelBadge.textContent = 'Downloading…'; modelBadge.className = 'badge';
      modelProgress.style.display = 'block'; modelProgress.value = 0;
      modelStatus.textContent = 'Requesting ' + url + ' …';
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const total = +res.headers.get('content-length') || 0;
      const reader = res.body.getReader();
      let received = 0;
      const chunks = [];
      while(true){
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value); received += value.length;
        if (total){ modelProgress.value = received/total*100; modelStatus.textContent = 'Downloading… ' + Math.round(received/total*100) + '%'; }
        else { modelStatus.textContent = 'Downloading… ' + (received/1e6).toFixed(0) + ' MB'; }
      }
      const buf = new Uint8Array(received);
      let offset = 0;
      for (const c of chunks){ buf.set(c, offset); offset += c.length; }
      await Model.loadFromBytes(buf.buffer);
      await idbSet('lama', { name: 'remote-model', bytes: buf.buffer });
      modelProgress.style.display = 'none';
      setModelReady();
    }catch(err){
      modelProgress.style.display = 'none';
      modelBadge.textContent = 'Load failed'; modelBadge.className = 'badge bad';
      modelStatus.textContent = 'Direct download failed (' + err.message + '). This is often a cross-origin restriction on large files — download the .onnx file yourself and use "Choose .onnx file" instead.';
    }
  });

  (async function tryRestoreModel(){
    try{
      const cached = await idbGet('lama');
      if (cached && cached.bytes){
        modelStatus.textContent = 'Restoring cached model (' + cached.name + ')…';
        await Model.loadFromBytes(cached.bytes);
        setModelReady();
      }
    }catch(e){ /* no cached model yet */ }
  })();

  function nextMultipleOf8(n){ return Math.max(8, Math.ceil(n/8)*8); }
  function clamp255(v){ return v<0?0:v>255?255:v>>0; }

  async function runLamaOnRegion(bbox){
    const MAXP = 768;
    let rw = bbox.w, rh = bbox.h;
    let pw8, ph8;
    if (Model.inputWidth && Model.inputHeight){
      rw = Model.inputWidth;
      rh = Model.inputHeight;
      pw8 = Model.inputWidth;
      ph8 = Model.inputHeight;
    } else if (Math.max(rw,rh) > MAXP){
      const scale = MAXP / Math.max(rw,rh);
      rw = Math.max(8, Math.round(rw*scale));
      rh = Math.max(8, Math.round(rh*scale));
      pw8 = nextMultipleOf8(rw);
      ph8 = nextMultipleOf8(rh);
    } else {
      pw8 = nextMultipleOf8(rw);
      ph8 = nextMultipleOf8(rh);
    }

    const patchCanvas = document.createElement('canvas');
    patchCanvas.width = pw8; patchCanvas.height = ph8;
    const pctx = patchCanvas.getContext('2d');
    pctx.drawImage(canvas, bbox.x, bbox.y, bbox.w, bbox.h, 0, 0, rw, rh);
    if (pw8>rw) pctx.drawImage(patchCanvas, rw-1,0,1,rh, rw,0,pw8-rw,rh);
    if (ph8>rh) pctx.drawImage(patchCanvas, 0,rh-1,pw8,1, 0,rh,pw8,ph8-rh);

    const maskPatchCanvas = document.createElement('canvas');
    maskPatchCanvas.width = pw8; maskPatchCanvas.height = ph8;
    const mctx = maskPatchCanvas.getContext('2d');
    mctx.drawImage(maskCanvas, bbox.x, bbox.y, bbox.w, bbox.h, 0, 0, rw, rh);
    if (pw8>rw) mctx.drawImage(maskPatchCanvas, rw-1,0,1,rh, rw,0,pw8-rw,rh);
    if (ph8>rh) mctx.drawImage(maskPatchCanvas, 0,rh-1,pw8,1, 0,rh,pw8,ph8-rh);

    // use the *unmasked* original pixels as the model's image input
    const srcClean = document.createElement('canvas');
    srcClean.width = pw8; srcClean.height = ph8;
    const scctx = srcClean.getContext('2d');
    const origTmp = document.createElement('canvas');
    origTmp.width = canvas.width; origTmp.height = canvas.height;
    origTmp.getContext('2d').putImageData(originalImageData, 0, 0);
    scctx.drawImage(origTmp, bbox.x, bbox.y, bbox.w, bbox.h, 0, 0, rw, rh);
    if (pw8>rw) scctx.drawImage(srcClean, rw-1,0,1,rh, rw,0,pw8-rw,rh);
    if (ph8>rh) scctx.drawImage(srcClean, 0,rh-1,pw8,1, 0,rh,pw8,ph8-rh);

    const imgData = scctx.getImageData(0,0,pw8,ph8).data;
    const maskData = mctx.getImageData(0,0,pw8,ph8).data;
    const plane = pw8*ph8;
    const imgTensorData = new Float32Array(3*plane);
    const maskTensorData = new Float32Array(plane);
    for (let i=0;i<plane;i++){
      const px = i*4;
      imgTensorData[i] = imgData[px]/255;
      imgTensorData[plane+i] = imgData[px+1]/255;
      imgTensorData[plane*2+i] = imgData[px+2]/255;
      maskTensorData[i] = maskData[px+3] > 10 ? 1 : 0;
    }
    const imageTensor = new ort.Tensor('float32', imgTensorData, [1,3,ph8,pw8]);
    const maskTensor = new ort.Tensor('float32', maskTensorData, [1,1,ph8,pw8]);
    const feeds = {};
    feeds[Model.imageInputName] = imageTensor;
    feeds[Model.maskInputName] = maskTensor;

    const results = await Model.session.run(feeds);
    const outTensor = results[Model.outputNames[0]];
    const outData = outTensor.data;
    let maxSample = 0;
    for (let i=0;i<Math.min(2000, outData.length); i++){ if (outData[i] > maxSample) maxSample = outData[i]; }
    const scaleOut = maxSample > 1.5 ? 1 : 255;

    const outCanvas = document.createElement('canvas');
    outCanvas.width = pw8; outCanvas.height = ph8;
    const octx = outCanvas.getContext('2d');
    const outImg = octx.createImageData(pw8,ph8);
    for (let i=0;i<plane;i++){
      const px = i*4;
      outImg.data[px]   = clamp255(outData[i]*scaleOut);
      outImg.data[px+1] = clamp255(outData[plane+i]*scaleOut);
      outImg.data[px+2] = clamp255(outData[plane*2+i]*scaleOut);
      outImg.data[px+3] = 255;
    }
    octx.putImageData(outImg,0,0);

    const resultCanvas = document.createElement('canvas');
    resultCanvas.width = bbox.w; resultCanvas.height = bbox.h;
    resultCanvas.getContext('2d').drawImage(outCanvas, 0,0,rw,rh, 0,0, bbox.w, bbox.h);
    return resultCanvas;
  }

  async function aiFill(){
    if (!Model.session){ setStatus('Load a LaMa model on the "AI model" tab first.'); return null; }
    const pad = parseInt(maskPadInput.value,10);
    const bbox = maskBoundingBox(pad);
    if (!bbox) return null;
    setStatus('Running LaMa on the masked region…');
    let patchResult;
    try{
      patchResult = await runLamaOnRegion(bbox);
    }catch(err){
      setStatus('AI fill failed: ' + err.message + ' — the model\'s expected input shape may differ from what was sent. Check the "AI model" tab for detected input/output names.');
      return null;
    }

    const feather = parseInt(featherRange.value,10);
    const alphaMask = document.createElement('canvas');
    alphaMask.width = bbox.w; alphaMask.height = bbox.h;
    const actx = alphaMask.getContext('2d');
    actx.filter = feather > 0 ? `blur(${feather}px)` : 'none';
    actx.drawImage(maskCanvas, bbox.x, bbox.y, bbox.w, bbox.h, 0, 0, bbox.w, bbox.h);
    actx.filter = 'none';
    actx.globalCompositeOperation = 'source-in';
    actx.fillStyle = '#000';
    actx.fillRect(0,0,bbox.w,bbox.h);

    const blended = document.createElement('canvas');
    blended.width = bbox.w; blended.height = bbox.h;
    const bctx = blended.getContext('2d');
    bctx.drawImage(patchResult, 0, 0);
    bctx.globalCompositeOperation = 'destination-in';
    bctx.drawImage(alphaMask, 0, 0);

    const out = ctx.createImageData(canvas.width, canvas.height);
    out.data.set(originalImageData.data);
    const base = document.createElement('canvas');
    base.width = canvas.width; base.height = canvas.height;
    const bsctx = base.getContext('2d');
    bsctx.putImageData(out, 0, 0);
    bsctx.drawImage(blended, bbox.x, bbox.y);
    return bsctx.getImageData(0,0,canvas.width,canvas.height);
  }

  // ============================================================
  // Fill button (dispatch to engine)
  // ============================================================
  fillBtn.addEventListener('click', async () => {
    if (!originalImageData || !hasMask) return;
    fillBtn.disabled = true;
    pushActionSnapshot();
    let result;
    try{
      if (engineSelect.value === 'lama') result = await aiFill();
      else result = await quickFill();
    }catch(err){
      setStatus('Fill failed: ' + err.message);
      actionHistory.pop();
      fillBtn.disabled = false;
      return;
    }
    if (!result){
      actionHistory.pop();
      fillBtn.disabled = !hasMask;
      return;
    }
    ctx.putImageData(result, 0, 0);
    originalImageData = result;
    maskCtx.clearRect(0,0,maskCanvas.width,maskCanvas.height);
    maskHistory = []; hasMask = false;
    fillBtn.disabled = true; undoBtn.disabled = true;
    setStatus('Selection removed. Inspect the result, then download.');
  });

  // ============================================================
  // Download
  // ============================================================
  function createCleanCanvas(){
    const cleanCanvas = document.createElement('canvas');
    cleanCanvas.width = canvas.width;
    cleanCanvas.height = canvas.height;
    cleanCanvas.getContext('2d').putImageData(originalImageData, 0, 0);
    return cleanCanvas;
  }
  async function openPreview(){
    if (!originalImageData) return;
    const format = downloadFormat.value;
    previewCanvas.width = canvas.width;
    previewCanvas.height = canvas.height;
    previewCanvas.getContext('2d').putImageData(originalImageData, 0, 0);
    previewNote.textContent = stripMetadata.checked || format !== 'jpeg'
      ? 'Metadata will be removed from this download.'
      : 'Original JPEG metadata will be kept where available.';
    previewModal.hidden = false;
    previewClose.focus();
  }
  downloadBtn.addEventListener('click', openPreview);
  async function readOriginalExifSegment(){
    if (!sourceFile || !(/jpe?g/i.test(sourceFile.type) || /\.jpe?g$/i.test(sourceFile.name || ''))) return null;
    const bytes = new Uint8Array(await sourceFile.arrayBuffer());
    if (bytes[0] !== 0xFF || bytes[1] !== 0xD8) return null;
    let offset = 2;
    while (offset + 4 < bytes.length && bytes[offset] === 0xFF){
      const marker = bytes[offset + 1];
      if (marker === 0xDA || marker === 0xD9) break;
      const segmentLength = (bytes[offset + 2] << 8) | bytes[offset + 3];
      if (marker === 0xE1 && bytes[offset + 4] === 0x45 && bytes[offset + 5] === 0x78 && bytes[offset + 6] === 0x69 && bytes[offset + 7] === 0x66){
        return bytes.slice(offset, offset + 2 + segmentLength);
      }
      offset += 2 + segmentLength;
    }
    return null;
  }
  async function createExportBlob(fmt){
    const mime = fmt === 'jpeg' ? 'image/jpeg' : 'image/png';
    const dataUrl = createCleanCanvas().toDataURL(mime, fmt === 'jpeg' ? 0.92 : undefined);
    const output = new Uint8Array(await (await fetch(dataUrl)).arrayBuffer());
    if (fmt !== 'jpeg' || stripMetadata.checked) return new Blob([output], {type:mime});
    const exif = await readOriginalExifSegment();
    return exif ? new Blob([output.slice(0,2), exif, output.slice(2)], {type:mime}) : new Blob([output], {type:mime});
  }
  function closePreview(){ previewModal.hidden = true; }
  previewClose.addEventListener('click', closePreview);
  previewCancel.addEventListener('click', closePreview);
  previewModal.addEventListener('click', e => { if (e.target === previewModal) closePreview(); });
  previewDownload.addEventListener('click', async () => {
    const fmt = downloadFormat.value;
    const ext = fmt === 'jpeg' ? 'jpg' : 'png';
    previewDownload.disabled = true;
    const blob = await createExportBlob(fmt);
    const link = document.createElement('a');
    link.download = 'inpainted.' + ext;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
    previewDownload.disabled = false;
    closePreview();
  });
  // ============================================================
  // Metadata (EXIF) viewer
  // ============================================================
  const EXIF_IFD0 = { 271:'Make', 272:'Model', 274:'Orientation', 305:'Software', 306:'DateTime', 315:'Artist', 33432:'Copyright', 34665:'ExifIFDPointer', 34853:'GPSInfoIFDPointer' };
  const EXIF_SUB  = { 33434:'ExposureTime', 33437:'FNumber', 34855:'ISO', 36867:'DateTimeOriginal', 37386:'FocalLength', 42036:'LensModel' };
  const EXIF_GPS  = { 1:'GPSLatitudeRef', 2:'GPSLatitude', 3:'GPSLongitudeRef', 4:'GPSLongitude' };

  function getStr(view, offset, len){
    let s = '';
    for (let i=0;i<len;i++){ const c = view.getUint8(offset+i); if (c===0) break; s += String.fromCharCode(c); }
    return s;
  }
  function readRational(view, offset, little){
    const num = view.getUint32(offset, little), den = view.getUint32(offset+4, little);
    return den ? num/den : 0;
  }
  function readIFD(view, tiffStart, dirStart, little, out, dict){
    const numEntries = view.getUint16(dirStart, little);
    for (let i=0;i<numEntries;i++){
      const entryOffset = dirStart + 2 + i*12;
      const tag = view.getUint16(entryOffset, little);
      const type = view.getUint16(entryOffset+2, little);
      const count = view.getUint32(entryOffset+4, little);
      const name = dict[tag];
      if (!name) continue;
      let valueOffsetField = entryOffset+8;
      const typeSizes = {1:1,2:1,3:2,4:4,5:8,9:4,10:8};
      const size = (typeSizes[type]||1) * count;
      const dataPos = size > 4 ? tiffStart + view.getUint32(valueOffsetField, little) : valueOffsetField;
      let value;
      if (type === 2){ value = getStr(view, dataPos, count); }
      else if (type === 3){ value = view.getUint16(dataPos, little); }
      else if (type === 4){ value = view.getUint32(dataPos, little); }
      else if (type === 5){
        if (count > 1){ value = []; for (let k=0;k<count;k++) value.push(readRational(view, dataPos+k*8, little)); }
        else value = readRational(view, dataPos, little);
      }
      else if (type === 1){ value = view.getUint8(dataPos); }
      else { value = null; }
      out[name] = value;
    }
  }
  function dmsToDecimal(dms, ref){
    if (!dms || dms.length < 3) return null;
    let dec = dms[0] + dms[1]/60 + dms[2]/3600;
    if (ref === 'S' || ref === 'W') dec = -dec;
    return dec;
  }
  function parseExif(buf){
    const view = new DataView(buf);
    if (view.getUint16(0,false) !== 0xFFD8) return null;
    let offset = 2;
    const length = view.byteLength;
    while (offset < length - 4){
      const marker = view.getUint16(offset,false);
      if (marker === 0xFFE1){
        const segLength = view.getUint16(offset+2,false);
        const exifStart = offset+4;
        if (getStr(view, exifStart, 4) !== 'Exif'){ offset += 2+segLength; continue; }
        const tiffStart = exifStart+6;
        const little = view.getUint16(tiffStart,false) === 0x4949;
        const firstIFDOffset = view.getUint32(tiffStart+4, little);
        const tags = {};
        readIFD(view, tiffStart, tiffStart+firstIFDOffset, little, tags, EXIF_IFD0);
        if (tags.ExifIFDPointer !== undefined) readIFD(view, tiffStart, tiffStart+tags.ExifIFDPointer, little, tags, EXIF_SUB);
        if (tags.GPSInfoIFDPointer !== undefined){
          readIFD(view, tiffStart, tiffStart+tags.GPSInfoIFDPointer, little, tags, EXIF_GPS);
          const lat = dmsToDecimal(tags.GPSLatitude, tags.GPSLatitudeRef);
          const lon = dmsToDecimal(tags.GPSLongitude, tags.GPSLongitudeRef);
          if (lat !== null && lon !== null) tags.GPSDecimal = lat.toFixed(6) + ', ' + lon.toFixed(6);
        }
        delete tags.ExifIFDPointer; delete tags.GPSInfoIFDPointer;
        return tags;
      } else if ((marker & 0xFF00) !== 0xFF00){
        break;
      } else {
        offset += 2 + view.getUint16(offset+2,false);
      }
    }
    return null;
  }

  function readMetadata(file, w, h){
    const rows = [];
    rows.push(['File name', file.name]);
    rows.push(['File size', (file.size/1024).toFixed(1) + ' KB']);
    rows.push(['Type', file.type || 'unknown']);
    rows.push(['Pixel dimensions', w + ' × ' + h]);
    if (file.lastModified) rows.push(['File modified', new Date(file.lastModified).toLocaleString()]);

    const reader = new FileReader();
    reader.onload = function(){
      let exif = null;
      try{ exif = parseExif(reader.result); }catch(e){ exif = null; }
      if (exif && Object.keys(exif).length){
        for (const [key,val] of Object.entries(exif)){
          if (val === null || val === undefined || val === '') continue;
          rows.push([key, String(val)]);
        }
      }
      renderMetaRows(rows, !!(exif && Object.keys(exif).length));
    };
    reader.onerror = function(){ renderMetaRows(rows, false); };
    reader.readAsArrayBuffer(file.slice(0, 262144)); // EXIF lives near the start of the file
  }

  function renderMetaRows(rows, hadExif){
    let html = '<table class="meta-table">';
    for (const [k,v] of rows) html += `<tr><td>${k}</td><td>${escapeHtml(v)}</td></tr>`;
    html += '</table>';
    if (!hadExif) html += '<p class="hint">No embedded EXIF data found (common for PNGs, screenshots, and already-stripped photos).</p>';
    metaContent.innerHTML = html;
  }
  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  applyZoom();
})();
