(function(){
  'use strict';

  // ============================================================
  // DOM references
  // ============================================================
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  const savedSession = document.getElementById('savedSession');
  const savedSessionPreview = document.getElementById('savedSessionPreview');
  const savedSessionName = document.getElementById('savedSessionName');
  const resumeBtn = document.getElementById('resumeBtn');
  const uploadTitle = document.getElementById('uploadTitle');
  const uploadHint = document.getElementById('uploadHint');
  const stage = document.getElementById('stage');
  const canvasScroll = document.getElementById('canvasScroll');
  const canvasWrap = document.getElementById('canvasWrap');
  const canvas = document.getElementById('canvas');
  const brandingOverlay = document.getElementById('brandingOverlay');
  const brandingUploadBtn = document.getElementById('brandingUploadBtn');
  const brandingFileInput = document.getElementById('brandingFileInput');
  const brandingSize = document.getElementById('brandingSize');
  const brandingSizeVal = document.getElementById('brandingSizeVal');
  const brandingOpacity = document.getElementById('brandingOpacity');
  const brandingOpacityVal = document.getElementById('brandingOpacityVal');
  const brandingRemoveBtn = document.getElementById('brandingRemoveBtn');
  const brandingStatus = document.getElementById('brandingStatus');
  const editorSections = document.querySelectorAll('.editor-section');
  const editorModeSections = document.getElementById('editorSections');
  const filtersTab = document.getElementById('filtersTab');
  const adjustTab = document.getElementById('adjustTab');
  const filtersPanel = document.getElementById('filtersPanel');
  const adjustPanel = document.getElementById('adjustPanel');
  const filterChoices = document.querySelectorAll('.filter-choice');
  const filterIntensity = document.getElementById('filterIntensity');
  const filterIntensityVal = document.getElementById('filterIntensityVal');
  const adjustmentInputs = document.querySelectorAll('[data-adjust]');
  const resetAdjustments = document.getElementById('resetAdjustments');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const cropBox = document.getElementById('cropBox');
  const cropActions = document.getElementById('cropActions');
  const brushControls = document.getElementById('brushControls');

  const brushSizeInput = document.getElementById('brushSize');
  const maskPadInput = document.getElementById('maskPad');
  const maskOpacityInput = document.getElementById('maskOpacity');
  const maskOpacityVal = document.getElementById('maskOpacityVal');
  const featherRange = document.getElementById('featherRange');
  const featherVal = document.getElementById('featherVal');

  const fillBtn = document.getElementById('fillBtn');
  const fillCancelBtn = document.getElementById('fillCancelBtn');
  const fillProgress = document.getElementById('fillProgress');
  const autoDetectBtn = document.getElementById('autoDetectBtn');
  const maskStatus = document.getElementById('maskStatus');
  const saveMaskBtn = document.getElementById('saveMaskBtn');
  const reuseMaskBtn = document.getElementById('reuseMaskBtn');
  const clearMaskBtn = document.getElementById('clearMaskBtn');
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
  const panels = { fillPanel: document.getElementById('fillPanel') };

  const modelBadge = document.getElementById('aiModelBadge');
  const chooseModelBtn = document.getElementById('chooseModelBtn');
  const modelFileInput = document.getElementById('modelFileInput');
  const forgetModelBtn = document.getElementById('forgetModelBtn');
  const modelUrlInput = document.getElementById('modelUrlInput');
  const modelUrlBtn = document.getElementById('modelUrlBtn');
  const modelProgress = document.getElementById('modelProgress');
  const modelStatus = document.getElementById('modelStatus');
  const metaContent = document.getElementById('metaContent');
  const sectionChoices = document.querySelectorAll('.section-choice');
  const sectionEditor = document.querySelectorAll('.section-editor');
  const sectionRemove = document.querySelectorAll('.section-remove');
  const sectionHome = document.getElementById('sectionHome');
  const changeImageBtn = document.getElementById('changeImageBtn');
  const sectionBack = document.getElementById('sectionBack');
  const metadataSection = document.getElementById('metadataSection');
  const resizeSection = document.getElementById('resizeSection');
  const metadataDownloadBtn = document.getElementById('metadataDownloadBtn');
  const resizeWidth = document.getElementById('resizeWidth');
  const resizeHeight = document.getElementById('resizeHeight');
  const resizeKeepRatio = document.getElementById('resizeKeepRatio');
  const resizeApply = document.getElementById('resizeApply');
  const resizeReset = document.getElementById('resizeReset');
  const aiEditorSection = document.getElementById('aiEditorSection');
  const aiModelBadge = document.getElementById('aiModelBadge');
  const aiModelRequirements = document.getElementById('aiModelRequirements');
  const aiCancelBtn = document.getElementById('aiCancelBtn');
  const aiRetryBtn = document.getElementById('aiRetryBtn');
  const aiDismissBtn = document.getElementById('aiDismissBtn');
  const aiDownloadBtn = document.getElementById('aiDownloadBtn');
  const aiStatus = document.getElementById('aiStatus');
  const aiPreviewFrame = document.getElementById('aiPreviewFrame');
  const aiPreviewCanvas = document.getElementById('aiPreviewCanvas');
  const downloadResolution = document.getElementById('downloadResolution');
  const exportCustomSize = document.getElementById('exportCustomSize');
  const exportWidth = document.getElementById('exportWidth');
  const exportHeight = document.getElementById('exportHeight');
  const exportQuality = document.getElementById('exportQuality');
  const exportQualityValue = document.getElementById('exportQualityValue');
  const exportQualityWrap = document.getElementById('exportQualityWrap');
  const exportQualityHint = document.getElementById('exportQualityHint');

  // ============================================================
  // App state
  // ============================================================
  let maskCanvas = document.createElement('canvas');
  let maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
  let maskHistory = [];      // in-progress brush stroke undo (ImageData of maskCanvas)
  let actionHistory = [];    // committed-action undo (crop / rotate / fill) — full canvas snapshots
  let compareSnapshot = null;
  let initialImageData = null;
  let originalImageData = null; // current canvas pixels *without* the live mask overlay
  let drawing = false;
  let panning = false;
  let hasMask = false;
  let tool = 'brush';
  let brushEnabled = true;
  let activeSection = 'home';
  let zoom = 1;
  let cropping = false;
  let sourceFile = null;
  let savedSessionUrl = null;
  let savedSessionFile = null;
  let imageGeneration = 0;
  let loadRequestId = 0;
  let aiResult = null;
  let sourceDimensions = null;
  let aiOperation = null;
  let fillCancelled = false;
  let savedMaskData = null;
  let ocrWorker = null;
  let brandingImage = null;
  let brandingUrl = null;
  let brandingPlacement = { x: 0.72, y: 0.72, width: 0.22, height: 0.22 };
  let brandingDragging = false;
  let brandingDragOffset = { x: 0, y: 0 };
  let selectedFilter = 'original';
  let filterStrength = 1;
  let editorMode = 'edit';
  const adjustments = {
    brightness: 0, contrast: 0, saturation: 0, warmth: 0,
    highlights: 0, shadows: 0, fade: 0, vignette: 0
  };
  let aiOperationId = 0;
  let exportNumber = 0;
  try{ exportNumber = Number(localStorage.getItem('pixelroomedit-download-number')) || 0; }catch(e){}

  const SESSION_DB = 'pixelroom-session';
  const SESSION_STORE = 'image';
  let sessionSaveTimer = null;

  function openSessionDb(){
    return new Promise((resolve,reject)=>{
      const req = indexedDB.open(SESSION_DB, 1);
      req.onupgradeneeded = () => { req.result.createObjectStore(SESSION_STORE); };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  function readSession(){
    return openSessionDb().then(db => new Promise((resolve,reject)=>{
      const req = db.transaction(SESSION_STORE, 'readonly').objectStore(SESSION_STORE).get('current');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    }));
  }
  function writeSession(record){
    return openSessionDb().then(db => new Promise((resolve,reject)=>{
      const tx = db.transaction(SESSION_STORE, 'readwrite');
      tx.objectStore(SESSION_STORE).put(record, 'current');
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    }));
  }
  function deleteSession(){
    return openSessionDb().then(db => new Promise((resolve,reject)=>{
      const tx = db.transaction(SESSION_STORE, 'readwrite');
      tx.objectStore(SESSION_STORE).delete('current');
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    }));
  }
  function saveSession(){
    if (!originalImageData) return;
    clearTimeout(sessionSaveTimer);
    sessionSaveTimer = setTimeout(() => {
      canvas.toBlob(blob => {
        if (!blob) return;
        savedSessionFile = new File([blob], sourceFile?.name || 'image.png', { type:'image/png' });
        const record = {
          blob,
          name: sourceFile?.name || 'image.png',
          type: blob.type || 'image/png',
          lastModified: sourceFile?.lastModified || Date.now(),
          section: activeSection,
          sourceWidth: sourceDimensions?.width || canvas.width,
          sourceHeight: sourceDimensions?.height || canvas.height,
          brandingPlacement: { ...brandingPlacement },
          brandingOpacity: brandingOpacity.value,
          brandingSize: brandingSize.value
        };
        const brandingPromise = brandingImage ? brandingImageToBlob().then(brandingBlob => { record.brandingBlob = brandingBlob; }) : Promise.resolve();
        brandingPromise.then(() => writeSession(record).catch(() => {}));
      }, 'image/png');
    }, 120);
  }

  function brandingImageToBlob(){
    return new Promise(resolve => {
      const imageCanvas = document.createElement('canvas');
      imageCanvas.width = brandingImage.width;
      imageCanvas.height = brandingImage.height;
      imageCanvas.getContext('2d').drawImage(brandingImage, 0, 0);
      imageCanvas.toBlob(resolve, 'image/png');
    });
  }

  function setStatus(msg){ statusEl.textContent = msg; }
  function nextExportFilename(extension){
    exportNumber++;
    try{ localStorage.setItem('pixelroomedit-download-number', String(exportNumber)); }catch(e){}
    return 'Pixelroomedit-' + exportNumber + '.' + extension;
  }
  function setAiStatus(msg){ aiStatus.textContent = msg; }
  function clearAiResult(){
    aiResult = null;
    aiPreviewFrame.hidden = true;
    aiPreviewCanvas.width = 1;
    aiPreviewCanvas.height = 1;
    aiDownloadBtn.disabled = true;
  }
  function updateAiModelInfo(){
    const ready = !!Model.session;
    aiModelBadge.textContent = ready ? 'Model ready' : 'No model loaded';
    aiModelBadge.className = ready ? 'badge good' : 'badge';
    aiModelRequirements.textContent = ready
      ? (Model.inputWidth && Model.inputHeight
        ? `Required input: ${Model.inputWidth} × ${Model.inputHeight}px (${Model.imageLayout.toUpperCase()})`
        : 'Required input: dynamic dimensions, rounded to the model stride')
      : 'Choose a compatible model below.';
    aiRunBtn.disabled = !sourceFile;
  }
  function updateAiActionState(){
    aiRunBtn.disabled = !sourceFile;
  }
  function isAiOperationCurrent(operation){
    return aiOperation === operation && !operation.cancelled && operation.generation === imageGeneration;
  }
  function resetAiOperationButtons(){
    aiCancelBtn.hidden = true;
    aiRetryBtn.hidden = true;
    aiDismissBtn.hidden = true;
    updateAiActionState();
  }
  function removeAiSnapshot(operation){
    if (actionHistory[actionHistory.length - 1] === operation.snapshot) actionHistory.pop();
  }

  function updateResizeFields(){
    if (!originalImageData) return;
    resizeWidth.value = canvas.width;
    resizeHeight.value = canvas.height;
  }
  function getBrandingHeight(){
    if (!brandingImage || !canvas.width || !canvas.height) return 0;
    return brandingPlacement.width * canvas.width / canvas.height / (brandingImage.width / brandingImage.height || 1);
  }
  function updateBrandingOverlay(){
    const visible = !!brandingImage && !!originalImageData;
    brandingOverlay.hidden = !visible;
    brandingRemoveBtn.disabled = !brandingImage;
    if (!visible) return;
    brandingPlacement.height = Math.min(1, getBrandingHeight());
    brandingOverlay.src = brandingUrl;
    brandingOverlay.style.left = (brandingPlacement.x * 100) + '%';
    brandingOverlay.style.top = (brandingPlacement.y * 100) + '%';
    brandingOverlay.style.width = (brandingPlacement.width * 100) + '%';
    brandingOverlay.style.opacity = Number(brandingOpacity.value) / 100;
    brandingStatus.textContent = 'Branding PNG ready. Drag it to place it on the image.';
  }
  function setBrandingImage(file){
    if (!file || file.type !== 'image/png'){
      brandingStatus.textContent = 'Choose a PNG file with a transparent background.';
      return;
    }
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      if (brandingUrl) URL.revokeObjectURL(brandingUrl);
      brandingImage = image;
      brandingUrl = url;
      brandingPlacement.width = Number(brandingSize.value) / 100;
      updateBrandingOverlay();
      saveSession();
    };
    image.onerror = () => { URL.revokeObjectURL(url); brandingStatus.textContent = 'Could not read that PNG file.'; };
    image.src = url;
  }
  function clearBranding(){
    brandingImage = null;
    if (brandingUrl) URL.revokeObjectURL(brandingUrl);
    brandingUrl = null;
    brandingOverlay.removeAttribute('src');
    updateBrandingOverlay();
    brandingStatus.textContent = 'No branding PNG added.';
    saveSession();
  }
  const filterPresets = {
    original: {},
    vivid: { saturation: 28, contrast: 10 },
    warm: { warmth: 20, saturation: 8, brightness: 4 },
    cool: { warmth: -20, contrast: 6 },
    vintage: { warmth: 16, contrast: -8, saturation: -12, fade: 12 },
    noir: { saturation: -100, contrast: 22, brightness: 4 },
    faded: { saturation: -18, contrast: -12, fade: 28 },
    dramatic: { contrast: 30, saturation: 14, shadows: -12, highlights: -8 },
    clarendon: { contrast: 18, saturation: 22, brightness: 5 },
    juno: { contrast: 12, saturation: 30, warmth: 10, brightness: 3 },
    lark: { brightness: 8, saturation: 18, contrast: -5 },
    valencia: { warmth: 14, brightness: 5, contrast: -6, fade: 6 },
    nashville: { warmth: 24, saturation: -8, contrast: -10, fade: 16 },
    moon: { saturation: -100, contrast: -8, brightness: 10, fade: 8 },
    sepia: { saturation: -70, warmth: 28, contrast: -5 },
    mono: { saturation: -100, contrast: 8 }
  };
  function clampColor(value){ return Math.max(0, Math.min(255, value)); }
  function getAdjustedImageData(){
    const output = new ImageData(new Uint8ClampedArray(originalImageData.data), originalImageData.width, originalImageData.height);
    const preset = filterPresets[selectedFilter] || {};
    const width = output.width, height = output.height;
    for (let y=0; y<height; y++){
      for (let x=0; x<width; x++){
        const index = (y * width + x) * 4;
        const sourceR = output.data[index], sourceG = output.data[index+1], sourceB = output.data[index+2];
        const brightness = (adjustments.brightness + (preset.brightness || 0) * filterStrength) * 2.55;
        const contrast = 1 + (adjustments.contrast + (preset.contrast || 0) * filterStrength) / 100;
        const saturation = 1 + (adjustments.saturation + (preset.saturation || 0) * filterStrength) / 100;
        const warmth = adjustments.warmth + (preset.warmth || 0) * filterStrength;
        const highlights = (adjustments.highlights + (preset.highlights || 0) * filterStrength) / 100;
        const shadows = (adjustments.shadows + (preset.shadows || 0) * filterStrength) / 100;
        let r = (sourceR - 128) * contrast + 128 + brightness + warmth;
        let g = (sourceG - 128) * contrast + 128 + brightness;
        let b = (sourceB - 128) * contrast + 128 + brightness - warmth;
        const luminance = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
        const tone = luminance > 0.5 ? highlights * (luminance - 0.5) * 2 : shadows * (0.5 - luminance) * 2;
        r += tone * 255; g += tone * 255; b += tone * 255;
        const gray = r * 0.299 + g * 0.587 + b * 0.114;
        r = gray + (r - gray) * saturation;
        g = gray + (g - gray) * saturation;
        b = gray + (b - gray) * saturation;
        const fade = (adjustments.fade + (preset.fade || 0) * filterStrength) / 100;
        r = r * (1 - fade) + 128 * fade;
        g = g * (1 - fade) + 128 * fade;
        b = b * (1 - fade) + 128 * fade;
        const distance = Math.hypot(x / width - 0.5, y / height - 0.5) / 0.707;
        const vignette = Math.max(0, Math.min(1, adjustments.vignette / 100 * distance * distance));
        output.data[index] = clampColor(r * (1 - vignette));
        output.data[index+1] = clampColor(g * (1 - vignette));
        output.data[index+2] = clampColor(b * (1 - vignette));
      }
    }
    return output;
  }
  function renderEditedImage(){
    if (!originalImageData) return;
    ctx.putImageData(getAdjustedImageData(), 0, 0);
    if (hasMask){
      ctx.save();
      ctx.globalAlpha = Number(maskOpacityInput.value) / 100;
      ctx.drawImage(maskCanvas, 0, 0);
      ctx.restore();
    }
  }
  function updateFilterThumbnails(){
    if (!originalImageData) return;
    const thumbnail = document.createElement('canvas');
    thumbnail.width = 96;
    thumbnail.height = Math.max(1, Math.round(96 * originalImageData.height / originalImageData.width));
    thumbnail.getContext('2d').drawImage(canvas, 0, 0, thumbnail.width, thumbnail.height);
    const url = `url("${thumbnail.toDataURL('image/jpeg', 0.82)}")`;
    filterChoices.forEach(choice => { choice.querySelector('.filter-swatch').style.backgroundImage = url; });
  }
  function resetEditSettings(){
    selectedFilter = 'original';
    filterStrength = 1;
    Object.keys(adjustments).forEach(key => { adjustments[key] = 0; });
    filterChoices.forEach(choice => choice.classList.toggle('active', choice.dataset.filter === selectedFilter));
    filterIntensity.value = 100;
    filterIntensityVal.textContent = '100%';
    adjustmentInputs.forEach(input => { input.value = 0; input.nextElementSibling.textContent = '0'; });
    renderEditedImage();
  }
  filtersTab.addEventListener('click', () => {
    filtersTab.classList.add('active');
    adjustTab.classList.remove('active');
    filtersTab.setAttribute('aria-selected', 'true');
    adjustTab.setAttribute('aria-selected', 'false');
    filtersPanel.hidden = false;
    adjustPanel.hidden = true;
  });
  adjustTab.addEventListener('click', () => {
    adjustTab.classList.add('active');
    filtersTab.classList.remove('active');
    adjustTab.setAttribute('aria-selected', 'true');
    filtersTab.setAttribute('aria-selected', 'false');
    adjustPanel.hidden = false;
    filtersPanel.hidden = true;
  });
  filterChoices.forEach(choice => choice.addEventListener('click', () => {
    selectedFilter = choice.dataset.filter;
    filterChoices.forEach(item => item.classList.toggle('active', item === choice));
    renderEditedImage();
    saveSession();
  }));
  filterIntensity.addEventListener('input', () => {
    filterStrength = Number(filterIntensity.value) / 100;
    filterIntensityVal.textContent = filterIntensity.value + '%';
    renderEditedImage();
    saveSession();
  });
  adjustmentInputs.forEach(input => input.addEventListener('input', () => {
    adjustments[input.dataset.adjust] = Number(input.value);
    input.nextElementSibling.textContent = input.value;
    renderEditedImage();
    saveSession();
  }));
  resetAdjustments.addEventListener('click', resetEditSettings);
  function setEditorMode(mode){
    editorMode = mode;
    editorSections.forEach(button => {
      const active = button.dataset.editorMode === mode;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
    });
    document.querySelectorAll('.editor-mode-edit').forEach(element => { element.hidden = mode !== 'edit'; });
    document.querySelectorAll('.editor-mode-remove').forEach(element => { element.hidden = mode !== 'remove'; });
    document.querySelectorAll('.editor-mode-branding').forEach(element => { element.hidden = mode !== 'branding'; });
    brandingOverlay.style.pointerEvents = mode === 'branding' ? 'auto' : 'none';
    if (mode !== 'remove' && cropping) setTool('brush');
  }
  editorSections.forEach(button => button.addEventListener('click', () => setEditorMode(button.dataset.editorMode)));
  function setSection(name){
    activeSection = name;
    drawing = false;
    panning = false;
    stage.dataset.section = name;
    document.body.dataset.section = name;
    canvas.style.pointerEvents = name === 'remove' || name === 'ai' ? 'auto' : 'none';
    document.body.classList.toggle('app-editing', name !== 'home');
    if (name !== 'home') window.scrollTo({ top:0, behavior:'instant' });
    sectionChoices.forEach(choice => choice.classList.toggle('active', choice.dataset.section === name));
    sectionChoices.forEach(choice => { choice.parentElement.hidden = !originalImageData; });
    sectionHome.hidden = name !== 'home';
    sectionBack.hidden = name === 'home';
    editorModeSections.hidden = name !== 'remove';
    sectionEditor.forEach(element => { element.hidden = name !== 'remove' && name !== 'ai'; });
    sectionRemove.forEach(element => { element.hidden = name !== 'remove'; });
    aiEditorSection.hidden = name !== 'ai';
    metadataSection.hidden = name !== 'metadata';
    resizeSection.hidden = name !== 'resize';
    if (name === 'remove') setEditorMode(editorMode);
    if (name === 'resize') updateResizeFields();
    saveSession();
  }
  sectionChoices.forEach(choice => choice.addEventListener('click', () => setSection(choice.dataset.section)));

  // ============================================================
  // Loading an image
  // ============================================================
  function isImageFile(file){
    if (!file) return false;
    return file.type.startsWith('image/') || /\.(avif|gif|jpe?g|png|webp|bmp|svg)$/i.test(file.name || '');
  }
  function loadImageFile(file, restoredSection='home', restoredDimensions=null){
    if (!isImageFile(file)){
      setStatus('Choose an image file such as JPG, PNG, or WEBP.');
      return;
    }
    const requestId = ++loadRequestId;
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = function(){
      if (requestId !== loadRequestId){ URL.revokeObjectURL(url); return; }
      imageGeneration++;
      sourceFile = file;
      sourceDimensions = restoredDimensions || { width: img.width, height: img.height };
      if (aiOperation) aiOperation.cancelled = true;
      aiOperation = null;
      resetAiOperationButtons();
      clearAiResult();
      setAiStatus('Ready when an AI model is loaded.');
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
      resetEditSettings();
      updateFilterThumbnails();
      updateBrandingOverlay();
      initialImageData = ctx.getImageData(0,0,w,h);
      maskCtx.clearRect(0,0,w,h);
      maskHistory = [];
      savedMaskData = null;
      actionHistory = [];
      compareSnapshot = { w, h, data: initialImageData };
      hasMask = false;
      zoom = 1;
      applyZoom();
      updateZoomLabel();
      stage.classList.add('active');
      dropzone.style.display = 'none';
      uploadTitle.textContent = 'Image loaded';
      uploadHint.textContent = 'Choose a different tool below to continue';
      savedSession.hidden = true;
      savedSessionFile = null;
      if (savedSessionUrl) URL.revokeObjectURL(savedSessionUrl);
      savedSessionUrl = null;
      sectionChoices.forEach(choice => { choice.disabled = false; });
      markEditorHistory();
      setSection(restoredSection);
      fillBtn.disabled = true;
      downloadBtn.disabled = false;
      undoBtn.disabled = true;
      undoActionBtn.disabled = true;
      compareBtn.disabled = !compareSnapshot;
      setTool('brush');
      setStatus('Paint over the area to remove, then choose Fill.');
      URL.revokeObjectURL(url);

      readMetadata(file, sourceDimensions?.width || img.width, sourceDimensions?.height || img.height);
      saveSession();
      updateAiModelInfo();
    };
    img.onerror = function(){ setStatus('Could not read that file as an image.'); URL.revokeObjectURL(url); };
    img.src = url;
  }

  dropzone.addEventListener('click', () => fileInput.click());
  resumeBtn.addEventListener('click', e => {
    e.stopPropagation();
    if (savedSessionFile) loadImageFile(savedSessionFile, activeSection === 'home' ? 'home' : activeSection);
  });
  fileInput.addEventListener('change', e => {
    loadImageFile(e.target.files[0]);
    fileInput.value = '';
  });
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
    imageGeneration++;
    loadRequestId++;
    if (aiOperation) aiOperation.cancelled = true;
    stage.classList.remove('active');
    dropzone.style.display = '';
    sectionChoices.forEach(choice => { choice.disabled = true; });
    originalImageData = null;
    initialImageData = null;
    savedMaskData = null;
    compareSnapshot = null;
    sourceFile = null;
    sourceDimensions = null;
    aiOperation = null;
    activePointers.clear();
    pinchDistance = 0;
    clearAiResult();
    uploadTitle.textContent = 'Select an image to begin';
    uploadHint.textContent = 'Drag it here or click to browse';
    savedSessionFile = null;
    savedSession.hidden = true;
    if (savedSessionUrl) URL.revokeObjectURL(savedSessionUrl);
    savedSessionUrl = null;
    clearTimeout(sessionSaveTimer);
    deleteSession().catch(() => {});
    fileInput.value = '';
    setStatus('Paint over the area to remove.');
    metaContent.innerHTML = '<p class="hint">Load a photo to see its embedded metadata here.</p>';
    setSection('home');
    updateAiModelInfo();
  });
  changeImageBtn.addEventListener('click', () => {
    fileInput.value = '';
    fileInput.click();
  });

  brandingUploadBtn.addEventListener('click', () => brandingFileInput.click());
  brandingFileInput.addEventListener('change', e => {
    setBrandingImage(e.target.files[0]);
    brandingFileInput.value = '';
  });
  brandingSize.addEventListener('input', () => {
    brandingSizeVal.textContent = brandingSize.value + '%';
    if (!brandingImage) return;
    brandingPlacement.width = Number(brandingSize.value) / 100;
    updateBrandingOverlay();
    saveSession();
  });
  brandingOpacity.addEventListener('input', () => {
    brandingOpacityVal.textContent = brandingOpacity.value + '%';
    updateBrandingOverlay();
    saveSession();
  });
  brandingRemoveBtn.addEventListener('click', clearBranding);
  brandingOverlay.addEventListener('pointerdown', e => {
    if (!brandingImage) return;
    e.preventDefault();
    brandingDragging = true;
    const rect = canvas.getBoundingClientRect();
    brandingDragOffset = {
      x: (e.clientX - rect.left) / rect.width - brandingPlacement.x,
      y: (e.clientY - rect.top) / rect.height - brandingPlacement.y
    };
    brandingOverlay.setPointerCapture?.(e.pointerId);
  });
  brandingOverlay.addEventListener('pointermove', e => {
    if (!brandingDragging) return;
    const rect = canvas.getBoundingClientRect();
    brandingPlacement.x = Math.min(1 - brandingPlacement.width, Math.max(0, (e.clientX - rect.left) / rect.width - brandingDragOffset.x));
    brandingPlacement.y = Math.min(1 - brandingPlacement.height, Math.max(0, (e.clientY - rect.top) / rect.height - brandingDragOffset.y));
    updateBrandingOverlay();
  });
  brandingOverlay.addEventListener('pointerup', () => { brandingDragging = false; saveSession(); });
  brandingOverlay.addEventListener('pointercancel', () => { brandingDragging = false; });

  sectionBack.addEventListener('click', () => setSection('home'));

  const landingUrl = location.href.split('#')[0];
  history.replaceState({ pixelroom:'home' }, '', landingUrl);
  history.pushState({ pixelroom:'home' }, '', landingUrl);
  function markEditorHistory(){
    if (history.state?.pixelroom !== 'editor') history.pushState({ pixelroom:'editor' }, '', '#editor');
  }
  function returnToLanding(){
    canvas.toBlob(blob => {
      if (blob){
        savedSessionFile = new File([blob], sourceFile?.name || 'image.png', { type:'image/png' });
        if (savedSessionUrl) URL.revokeObjectURL(savedSessionUrl);
        savedSessionUrl = URL.createObjectURL(blob);
        savedSessionPreview.src = savedSessionUrl;
        savedSessionName.textContent = sourceFile?.name || 'Saved image';
        savedSession.hidden = false;
      }
    }, 'image/png');
    stage.classList.remove('active');
    dropzone.style.display = '';
    sectionChoices.forEach(choice => { choice.disabled = true; });
    setSection('home');
    history.replaceState({ pixelroom:'home' }, '', landingUrl);
  }
  window.addEventListener('popstate', event => {
    if (stage.classList.contains('active') && event.state?.pixelroom !== 'editor'){
      returnToLanding();
    }
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
    if (zoom === 1){
      canvasWrap.style.width = '100%';
      canvasWrap.style.height = '100%';
      canvas.style.width = '';
      canvas.style.maxWidth = '100%';
      canvas.style.maxHeight = '100%';
    }
    else {
      const fitWidth = canvasScroll.clientWidth;
      const scaledWidth = Math.round(fitWidth * zoom);
      canvasWrap.style.width = scaledWidth + 'px';
      canvasWrap.style.height = 'auto';
      canvas.style.width = scaledWidth + 'px';
      canvas.style.maxWidth = 'none';
      canvas.style.maxHeight = 'none';
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
    brushEnabled = name === 'brush';
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
    toolBrush.setAttribute('aria-pressed', String(brushEnabled));
    toolBrush.classList.toggle('off', !brushEnabled);
    toolBrush.title = brushEnabled ? 'Brush on — tap to turn off and pan' : 'Brush off — tap to turn on';
    canvas.classList.toggle('pan-mode', name === 'off');
  }
  toolBrush.addEventListener('click', () => setTool(brushEnabled ? 'off' : 'brush'));
  toolEraser.addEventListener('click', () => setTool('eraser'));
  toolCrop.addEventListener('click', () => setTool(tool === 'crop' ? 'brush' : 'crop'));

  // ============================================================
  // Brush painting
  // ============================================================
  function getPos(e){
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  }

  function paintDot(x,y){
    const r = parseInt(brushSizeInput.value,10);
    const gradient = maskCtx.createRadialGradient(x, y, 0, x, y, r);
    gradient.addColorStop(0, 'rgba(255,60,60,0.58)');
    gradient.addColorStop(0.72, 'rgba(255,60,60,0.42)');
    gradient.addColorStop(1, 'rgba(255,60,60,0)');
    if (tool === 'eraser'){
      maskCtx.save();
      maskCtx.globalCompositeOperation = 'destination-out';
      maskCtx.fillStyle = gradient;
      maskCtx.beginPath(); maskCtx.arc(x,y,r,0,Math.PI*2); maskCtx.fill();
      maskCtx.restore();
    } else {
      maskCtx.fillStyle = gradient;
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
    renderEditedImage();
  }

  function maskHasContent(){
    const d = maskCtx.getImageData(0,0,maskCanvas.width,maskCanvas.height).data;
    for (let i=3; i<d.length; i+=4){ if (d[i] > 10) return true; }
    return false;
  }

  function updateMaskUi(){
    hasMask = maskHasContent();
    const bbox = hasMask ? maskBoundingBox(0) : null;
    maskStatus.textContent = bbox ? `Selection ready — ${bbox.w} × ${bbox.h}px area` : 'No area selected';
    fillBtn.disabled = !hasMask;
    undoBtn.disabled = !maskHistory.length;
    document.getElementById('saveMaskBtn').disabled = !hasMask;
    document.getElementById('reuseMaskBtn').disabled = !savedMaskData;
    document.getElementById('clearMaskBtn').disabled = !hasMask;
    updateAiActionState();
  }

  async function autoDetectText(){
    if (!originalImageData || !window.Tesseract){
      setStatus('Text detection is unavailable. Check your connection and try again.');
      return;
    }
    autoDetectBtn.disabled = true;
    autoDetectBtn.textContent = 'Scanning…';
    try{
      const scan = document.createElement('canvas');
      const maxSide = 1600;
      const scale = Math.min(1, maxSide / Math.max(canvas.width, canvas.height));
      scan.width = Math.max(1, Math.round(canvas.width * scale));
      scan.height = Math.max(1, Math.round(canvas.height * scale));
      const source = document.createElement('canvas');
      source.width = canvas.width; source.height = canvas.height;
      source.getContext('2d').putImageData(getAdjustedImageData(), 0, 0);
      scan.getContext('2d').drawImage(source, 0, 0, scan.width, scan.height);
      if (!ocrWorker){
        ocrWorker = await Tesseract.createWorker('eng', 1, { logger: message => {
          if (message.status === 'recognizing text') setStatus('Scanning text… ' + Math.round((message.progress || 0) * 100) + '%');
        }});
      }
      const result = await ocrWorker.recognize(scan);
      const words = (result.data.words || []).filter(word => String(word.text || '').trim() && word.confidence >= 35);
      maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
      maskHistory = [];
      const padding = Math.max(4, Math.round(parseInt(maskPadInput.value, 10) / 2));
      maskCtx.fillStyle = 'rgba(255,60,60,0.58)';
      words.forEach(word => {
        const left = Math.max(0, Math.floor(word.bbox.x0 / scale) - padding);
        const top = Math.max(0, Math.floor(word.bbox.y0 / scale) - padding);
        const right = Math.min(canvas.width, Math.ceil(word.bbox.x1 / scale) + padding);
        const bottom = Math.min(canvas.height, Math.ceil(word.bbox.y1 / scale) + padding);
        maskCtx.fillRect(left, top, right - left, bottom - top);
      });
      updateMaskUi();
      redrawWithMask();
      setStatus(words.length ? `Found ${words.length} text area${words.length === 1 ? '' : 's'}. Review the mask, then choose Remove selection.` : 'No readable text found. Paint the area manually instead.');
    }catch(error){
      setStatus('Text detection failed. Paint the area manually instead.');
      console.error('Text detection failed', error);
    }finally{
      autoDetectBtn.disabled = false;
      autoDetectBtn.textContent = 'Auto-detect text';
    }
  }
  autoDetectBtn.addEventListener('click', autoDetectText);

  let lastX = 0, lastY = 0;
  let lastPanX = 0, lastPanY = 0;
  const activePointers = new Map();
  let pinchDistance = 0;
  let pinchZoom = 1;
  function pointerDistance(){
    const points = [...activePointers.values()];
    return points.length > 1 ? Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y) : 0;
  }
  function startDraw(e){
    if (!originalImageData || (activeSection !== 'remove' && activeSection !== 'ai') || cropping) return;
    activePointers.set(e.pointerId, { x:e.clientX, y:e.clientY });
    if (activePointers.size > 1){
      drawing = false; panning = false;
      pinchDistance = pointerDistance(); pinchZoom = zoom;
      e.preventDefault();
      return;
    }
    if (tool === 'off'){
      e.preventDefault();
      panning = true;
      lastPanX = e.clientX;
      lastPanY = e.clientY;
      canvas.setPointerCapture?.(e.pointerId);
      return;
    }
    e.preventDefault();
    drawing = true;
    maskHistory.push(maskCtx.getImageData(0,0,maskCanvas.width,maskCanvas.height));
    if (maskHistory.length > 20) maskHistory.shift();
    const p = getPos(e);
    canvas.setPointerCapture?.(e.pointerId);
    lastX = p.x; lastY = p.y;
    paintDot(p.x,p.y);
    redrawWithMask();
    setStatus('Selection marked. Click Remove selection to apply the fill.');
    undoBtn.disabled = false;
  }
  function moveDraw(e){
    if (activePointers.has(e.pointerId)) activePointers.set(e.pointerId, { x:e.clientX, y:e.clientY });
    if (activePointers.size > 1){
      const distance = pointerDistance();
      if (pinchDistance > 0 && distance > 0){
        zoom = Math.min(4, Math.max(0.25, +(pinchZoom * distance / pinchDistance).toFixed(2)));
        applyZoom(); updateZoomLabel();
      }
      e.preventDefault();
      return;
    }
    if (panning){
      if (activeSection !== 'remove' && activeSection !== 'ai') return;
      e.preventDefault();
      const dx = e.clientX - lastPanX;
      const dy = e.clientY - lastPanY;
      canvasScroll.scrollLeft -= dx;
      canvasScroll.scrollTop -= dy;
      lastPanX = e.clientX;
      lastPanY = e.clientY;
      return;
    }
    if (!drawing || (activeSection !== 'remove' && activeSection !== 'ai')) return;
    e.preventDefault();
    const p = getPos(e);
    paintLine(lastX,lastY,p.x,p.y);
    lastX = p.x; lastY = p.y;
    redrawWithMask();
  }
  function endDraw(e){
    if (e?.pointerId !== undefined) activePointers.delete(e.pointerId);
    if (pinchDistance > 0){
      if (!activePointers.size) pinchDistance = 0;
      drawing = false; panning = false;
      return;
    }
    if (panning){
      panning = false;
      return;
    }
    if (!drawing) return;
    drawing = false;
    if (activeSection !== 'remove' && activeSection !== 'ai') return;
    hasMask = maskHasContent();
    updateMaskUi();
  }

  canvas.addEventListener('pointerdown', startDraw);
  canvas.addEventListener('pointermove', moveDraw);
  canvas.addEventListener('pointerup', endDraw);
  canvas.addEventListener('pointercancel', endDraw);
  canvas.addEventListener('lostpointercapture', endDraw);

  undoBtn.addEventListener('click', () => {
    if (!maskHistory.length) return;
    maskCtx.putImageData(maskHistory.pop(), 0, 0);
    redrawWithMask();
    hasMask = maskHasContent();
    updateMaskUi();
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
    renderEditedImage();
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
    updateBrandingOverlay();
    if (compareSnapshot){ compareSnapshot = { w: canvas.width, h: canvas.height, data: rotateImageData(compareSnapshot.data, dir) }; }
    maskCanvas.width = canvas.width; maskCanvas.height = canvas.height;
    maskCtx.clearRect(0,0,canvas.width,canvas.height);
    maskHistory = []; hasMask = false; fillBtn.disabled = true; undoBtn.disabled = true;
    renderEditedImage();
    applyZoom();
    saveSession();
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
    updateBrandingOverlay();
    if (compareSnapshot){ compareSnapshot = { w: sw, h: sh, data: cropImageData(compareSnapshot.data, sx, sy, sw, sh) }; }
    maskCanvas.width = sw; maskCanvas.height = sh;
    maskCtx.clearRect(0,0,sw,sh);
    maskHistory = []; hasMask = false; fillBtn.disabled = true; undoBtn.disabled = true;
    renderEditedImage();
    zoom = 1; applyZoom(); updateZoomLabel();
    setTool('brush');
    saveSession();
    setStatus('Cropped.');
  });

  // ============================================================
  // Feather slider label
  // ============================================================
  featherRange.addEventListener('input', () => { featherVal.textContent = featherRange.value + 'px'; });
  maskOpacityInput.addEventListener('input', () => {
    maskOpacityVal.textContent = maskOpacityInput.value + '%';
    redrawWithMask();
  });
  saveMaskBtn.addEventListener('click', () => {
    if (!hasMask) return;
    const current = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    savedMaskData = { width: current.width, height: current.height, data: new Uint8ClampedArray(current.data) };
    updateMaskUi();
    setStatus('Mask saved. Paint another area or reuse it on this image.');
  });
  reuseMaskBtn.addEventListener('click', () => {
    if (!savedMaskData || savedMaskData.width !== maskCanvas.width || savedMaskData.height !== maskCanvas.height) return;
    maskCtx.putImageData(new ImageData(new Uint8ClampedArray(savedMaskData.data), savedMaskData.width, savedMaskData.height), 0, 0);
    maskHistory = [];
    redrawWithMask();
    updateMaskUi();
    setStatus('Saved mask reused. Adjust it with the eraser if needed.');
  });
  clearMaskBtn.addEventListener('click', () => {
    maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    maskHistory = [];
    redrawWithMask();
    updateMaskUi();
    setStatus('Selection cleared. Paint over the watermark to try again.');
  });

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
          if (fillCancelled) return list;
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
        if (fillCancelled) return null;
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
    const initialFrontSize = Math.max(1, front.size);
    const maxIter = maskCount * 2 + 500;
    let stepsSinceYield = 0;
    while (front.size > 0 && guard < maxIter){
      if (fillCancelled) return null;
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
        fillProgress.value = Math.min(99, Math.round((1 - front.size / initialFrontSize) * 100));
        setStatus('Filling… ' + fillProgress.value + '%');
        await new Promise(r => setTimeout(r, 0));
      }
    }
    const out = ctx.createImageData(w,h);
    out.data.set(data);
    return out;
  }

  // ============================================================
  // AI fill via ONNX Runtime Web
  // ============================================================
  const DB_NAME = 'onnx-inpaint-cache', STORE = 'models';
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
    imageShape: null, maskShape: null, outputShape: null, inputWidth: null, inputHeight: null,
    imageLayout: 'nchw', maskLayout: 'nchw', hasMask: false,
    async loadFromBytes(bytes, modelName=''){
      if (!window.ort) throw new Error('ONNX Runtime failed to load from the CDN — check your network connection.');
      modelStatus.textContent = 'Initializing runtime…';
      ort.env.wasm.numThreads = Math.min(4, navigator.hardwareConcurrency || 4);
      this.session = await ort.InferenceSession.create(bytes, { executionProviders: ['wasm'] });
      this.inputNames = this.session.inputNames;
      this.outputNames = this.session.outputNames;
      const metadata = this.session.inputMetadata || {};
      const shapeFor = name => metadata[name]?.dimensions || metadata[name]?.shape || [];
      const rank4 = this.inputNames.filter(name => shapeFor(name).length === 4);
      this.imageInputName = this.inputNames.find(n => /img|image|rgb|input/i.test(n)) || rank4[0] || this.inputNames[0];
      this.maskInputName = this.inputNames.find(n => /mask|hole/i.test(n)) || this.inputNames.find(n => n !== this.imageInputName && shapeFor(n).length === 4) || null;
      this.imageShape = shapeFor(this.imageInputName);
      this.maskShape = this.maskInputName ? shapeFor(this.maskInputName) : null;
      this.outputShape = this.session.outputMetadata?.[this.outputNames[0]]?.dimensions || this.session.outputMetadata?.[this.outputNames[0]]?.shape || null;
      this.hasMask = !!this.maskInputName;
      this.imageLayout = inferLayout(this.imageShape, false);
      this.maskLayout = inferLayout(this.maskShape, true);
      const imageSize = getShapeSize(this.imageShape, this.imageLayout);
      this.inputHeight = imageSize.height;
      this.inputWidth = imageSize.width;
      // The published LaMa ONNX exports are fixed at 512x512 even when symbolic dimensions are exposed.
      if ((!this.inputWidth || !this.inputHeight) && /lama(?:_fp32)?\.onnx/i.test(modelName)){
        this.inputWidth = 512;
        this.inputHeight = 512;
      }
      if (!this.imageInputName || !this.imageShape || this.imageShape.length !== 4){
        throw new Error('This model does not expose a supported 4D image input.');
      }
      if (!this.outputNames.length){
        throw new Error('This model does not expose an image output.');
      }
    }
  };

  function setModelReady(){
    modelBadge.textContent = 'Model ready';
    modelBadge.className = 'badge good';
    const inputSize = Model.inputWidth && Model.inputHeight ? ` (${Model.inputWidth} × ${Model.inputHeight})` : ' (dynamic size)';
    modelStatus.textContent = 'Inputs: ' + Model.inputNames.join(', ') + inputSize + '  →  output: ' + Model.outputNames[0] + (Model.hasMask ? '' : ' · no mask input detected');
    updateAiModelInfo();
  }

  chooseModelBtn.addEventListener('click', () => modelFileInput.click());
  modelFileInput.addEventListener('change', async e => {
    const f = e.target.files[0];
    if (!f) return;
    try{
      modelBadge.textContent = 'Loading…'; modelBadge.className = 'badge';
      modelStatus.textContent = 'Reading ' + f.name + ' (' + (f.size/1e6).toFixed(0) + ' MB)…';
      const buf = await f.arrayBuffer();
      await Model.loadFromBytes(buf, f.name);
      await idbSet('onnx-model', { name: f.name, bytes: buf });
      setModelReady();
    }catch(err){
      modelBadge.textContent = 'Load failed'; modelBadge.className = 'badge bad';
      modelStatus.textContent = 'Could not load model: ' + err.message;
    }
  });

  forgetModelBtn.addEventListener('click', async () => {
    try{ await idbDelete('onnx-model'); }catch(e){}
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
      await Model.loadFromBytes(buf.buffer, url.split('/').pop().split('?')[0]);
      await idbSet('onnx-model', { name: 'remote-model', bytes: buf.buffer });
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
      const cached = await idbGet('onnx-model');
      if (cached && cached.bytes){
        modelStatus.textContent = 'Restoring cached model (' + cached.name + ')…';
        await Model.loadFromBytes(cached.bytes, cached.name === 'remote-model' ? 'lama_fp32.onnx' : (cached.name || ''));
        setModelReady();
      }
    }catch(e){ /* no cached model yet */ }
  })();

  function nextMultipleOf8(n){ return Math.max(8, Math.ceil(n/8)*8); }
  function clamp255(v){ return v<0?0:v>255?255:v>>0; }
  function inferLayout(shape, mask){
    if (!shape || shape.length !== 4) return 'nchw';
    return Number(shape[3]) === (mask ? 1 : 3) ? 'nhwc' : 'nchw';
  }
  function getShapeSize(shape, layout){
    if (!shape || shape.length !== 4) return { width:null, height:null };
    const height = Number(shape[layout === 'nhwc' ? 1 : 2]);
    const width = Number(shape[layout === 'nhwc' ? 2 : 3]);
    return { width:Number.isFinite(width) && width > 0 ? width : null, height:Number.isFinite(height) && height > 0 ? height : null };
  }
  function tensorShape(layout, width, height, channels){
    return layout === 'nhwc' ? [1,height,width,channels] : [1,channels,height,width];
  }
  function makeTensorData(imgData, maskData, width, height, layout, channels){
    const plane = width * height;
    const values = new Float32Array(plane * channels);
    for (let i=0;i<plane;i++){
      const px = i*4;
      const pixel = channels === 1 ? [maskData && maskData[px+3] > 10 ? 1 : 0] : [imgData[px]/255, imgData[px+1]/255, imgData[px+2]/255];
      for (let c=0;c<channels;c++) values[layout === 'nhwc' ? i*channels+c : c*plane+i] = pixel[c] ?? pixel[pixel.length-1];
    }
    return values;
  }
  function outputLayout(shape){ return shape && Number(shape[3]) === 3 ? 'nhwc' : 'nchw'; }

  async function runOnnxOnRegion(bbox){
    const MAXP = 768;
    const fixedSize = Model.inputWidth && Model.inputHeight;
    const scale = fixedSize ? Math.min(Model.inputWidth / bbox.w, Model.inputHeight / bbox.h) : Math.min(1, MAXP / Math.max(bbox.w,bbox.h));
    const rw = Math.max(8, Math.round(bbox.w * scale));
    const rh = Math.max(8, Math.round(bbox.h * scale));
    const pw8 = fixedSize ? Model.inputWidth : nextMultipleOf8(rw);
    const ph8 = fixedSize ? Model.inputHeight : nextMultipleOf8(rh);
    const offsetX = Math.floor((pw8-rw)/2), offsetY = Math.floor((ph8-rh)/2);

    const patchCanvas = document.createElement('canvas');
    patchCanvas.width = pw8; patchCanvas.height = ph8;
    const pctx = patchCanvas.getContext('2d');
    pctx.drawImage(canvas, bbox.x, bbox.y, bbox.w, bbox.h, offsetX, offsetY, rw, rh);
    if (pw8>rw) pctx.drawImage(patchCanvas, rw-1,0,1,rh, rw,0,pw8-rw,rh);
    if (ph8>rh) pctx.drawImage(patchCanvas, 0,rh-1,pw8,1, 0,rh,pw8,ph8-rh);

    const maskPatchCanvas = document.createElement('canvas');
    maskPatchCanvas.width = pw8; maskPatchCanvas.height = ph8;
    const mctx = maskPatchCanvas.getContext('2d');
    mctx.drawImage(maskCanvas, bbox.x, bbox.y, bbox.w, bbox.h, offsetX, offsetY, rw, rh);
    if (pw8>rw) mctx.drawImage(maskPatchCanvas, rw-1,0,1,rh, rw,0,pw8-rw,rh);
    if (ph8>rh) mctx.drawImage(maskPatchCanvas, 0,rh-1,pw8,1, 0,rh,pw8,ph8-rh);

    // use the *unmasked* original pixels as the model's image input
    const srcClean = document.createElement('canvas');
    srcClean.width = pw8; srcClean.height = ph8;
    const scctx = srcClean.getContext('2d');
    const origTmp = document.createElement('canvas');
    origTmp.width = canvas.width; origTmp.height = canvas.height;
    origTmp.getContext('2d').putImageData(originalImageData, 0, 0);
    scctx.drawImage(origTmp, bbox.x, bbox.y, bbox.w, bbox.h, offsetX, offsetY, rw, rh);
    if (pw8>rw) scctx.drawImage(srcClean, rw-1,0,1,rh, rw,0,pw8-rw,rh);
    if (ph8>rh) scctx.drawImage(srcClean, 0,rh-1,pw8,1, 0,rh,pw8,ph8-rh);

    const imgData = scctx.getImageData(0,0,pw8,ph8).data;
    const maskData = mctx.getImageData(0,0,pw8,ph8).data;
    const plane = pw8*ph8;
    const imageTensor = new ort.Tensor('float32', makeTensorData(imgData, null, pw8, ph8, Model.imageLayout, 3), tensorShape(Model.imageLayout, pw8, ph8, 3));
    const feeds = {};
    feeds[Model.imageInputName] = imageTensor;
    if (Model.hasMask) feeds[Model.maskInputName] = new ort.Tensor('float32', makeTensorData(imgData, maskData, pw8, ph8, Model.maskLayout, 1), tensorShape(Model.maskLayout, pw8, ph8, 1));

    const results = await Model.session.run(feeds);
    const outTensor = results[Model.outputNames[0]];
    const outData = outTensor.data;
    const outShape = outTensor.dims || Model.outputShape;
    const outLayout = outputLayout(outShape);
    const outSize = getShapeSize(outShape, outLayout);
    const outWidth = outSize.width || pw8, outHeight = outSize.height || ph8;
    const outChannels = outLayout === 'nhwc' ? Number(outShape?.[3]) || 3 : Number(outShape?.[1]) || 3;
    let minSample = Infinity, maxSample = -Infinity;
    for (let i=0;i<Math.min(2000, outData.length); i++){ minSample = Math.min(minSample,outData[i]); maxSample = Math.max(maxSample,outData[i]); }
    const scaleOut = minSample < 0 ? 127.5 : maxSample > 1.5 ? 1 : 255;
    const offsetOut = minSample < 0 ? 127.5 : 0;

    const outCanvas = document.createElement('canvas');
    outCanvas.width = outWidth; outCanvas.height = outHeight;
    const octx = outCanvas.getContext('2d');
    const outImg = octx.createImageData(outWidth,outHeight);
    const outPlane = outWidth*outHeight;
    for (let i=0;i<outPlane;i++){
      const px = i*4;
      const at = c => outData[outLayout === 'nhwc' ? i*outChannels+c : c*outPlane+i] || 0;
      outImg.data[px]   = clamp255(at(0)*scaleOut+offsetOut);
      outImg.data[px+1] = clamp255(at(Math.min(1,outChannels-1))*scaleOut+offsetOut);
      outImg.data[px+2] = clamp255(at(Math.min(2,outChannels-1))*scaleOut+offsetOut);
      outImg.data[px+3] = 255;
    }
    octx.putImageData(outImg,0,0);

    const resultCanvas = document.createElement('canvas');
    resultCanvas.width = bbox.w; resultCanvas.height = bbox.h;
    resultCanvas.getContext('2d').drawImage(outCanvas, offsetX,offsetY,rw,rh, 0,0, bbox.w, bbox.h);
    return resultCanvas;
  }

  function drawEdgePadding(context, source, x, y, width, height, targetWidth, targetHeight){
    if (x > 0) context.drawImage(source, x, y, 1, height, 0, y, x, height);
    if (targetWidth > width) context.drawImage(source, x + width - 1, y, 1, height, x + width, y, targetWidth - width, height);
    if (y > 0) context.drawImage(source, 0, y, targetWidth, 1, 0, 0, targetWidth, y);
    if (targetHeight > height) context.drawImage(source, x, y + height - 1, targetWidth, 1, x, y + height, targetWidth, targetHeight - height);
  }

  async function runOnnxOnOriginal(sourceImage){
    const originalWidth = sourceImage.width;
    const originalHeight = sourceImage.height;
    const targetWidth = Model.inputWidth || nextMultipleOf8(originalWidth);
    const targetHeight = Model.inputHeight || nextMultipleOf8(originalHeight);
    if (!targetWidth || !targetHeight || targetWidth > 8192 || targetHeight > 8192){
      throw new Error('The model reports image dimensions that this browser cannot allocate.');
    }
    const scale = Math.min(targetWidth / originalWidth, targetHeight / originalHeight);
    const drawWidth = Math.max(1, Math.round(originalWidth * scale));
    const drawHeight = Math.max(1, Math.round(originalHeight * scale));
    const offsetX = Math.floor((targetWidth - drawWidth) / 2);
    const offsetY = Math.floor((targetHeight - drawHeight) / 2);

    const inputCanvas = document.createElement('canvas');
    inputCanvas.width = targetWidth; inputCanvas.height = targetHeight;
    const inputContext = inputCanvas.getContext('2d');
    inputContext.drawImage(sourceImage, 0, 0, originalWidth, originalHeight, offsetX, offsetY, drawWidth, drawHeight);
    drawEdgePadding(inputContext, inputCanvas, offsetX, offsetY, drawWidth, drawHeight, targetWidth, targetHeight);

    const inputData = inputContext.getImageData(0, 0, targetWidth, targetHeight).data;
    const feeds = {};
    feeds[Model.imageInputName] = new ort.Tensor('float32', makeTensorData(inputData, null, targetWidth, targetHeight, Model.imageLayout, 3), tensorShape(Model.imageLayout, targetWidth, targetHeight, 3));
    if (Model.hasMask){
      const fullMask = new Uint8ClampedArray(targetWidth * targetHeight * 4);
      for (let i=3; i<fullMask.length; i+=4) fullMask[i] = 255;
      feeds[Model.maskInputName] = new ort.Tensor('float32', makeTensorData(inputData, fullMask, targetWidth, targetHeight, Model.maskLayout, 1), tensorShape(Model.maskLayout, targetWidth, targetHeight, 1));
    }

    const results = await Model.session.run(feeds);
    const output = results[Model.outputNames[0]];
    if (!output || !output.data) throw new Error('The AI model returned no image output.');
    const outputShape = output.dims || Model.outputShape;
    const layout = outputLayout(outputShape);
    const size = getShapeSize(outputShape, layout);
    const outputWidth = size.width || targetWidth;
    const outputHeight = size.height || targetHeight;
    const channels = layout === 'nhwc' ? Number(outputShape?.[3]) || 3 : Number(outputShape?.[1]) || 3;
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = outputWidth; outputCanvas.height = outputHeight;
    const outputContext = outputCanvas.getContext('2d');
    const outputImage = outputContext.createImageData(outputWidth, outputHeight);
    let min = Infinity, max = -Infinity;
    for (let i=0; i<Math.min(2000, output.data.length); i++){ min = Math.min(min, output.data[i]); max = Math.max(max, output.data[i]); }
    const outputScale = min < 0 ? 127.5 : max > 1.5 ? 1 : 255;
    const outputOffset = min < 0 ? 127.5 : 0;
    const plane = outputWidth * outputHeight;
    for (let i=0; i<plane; i++){
      const pixel = i * 4;
      const at = channel => output.data[layout === 'nhwc' ? i * channels + channel : channel * plane + i] || 0;
      outputImage.data[pixel] = clamp255(at(0) * outputScale + outputOffset);
      outputImage.data[pixel + 1] = clamp255(at(Math.min(1, channels - 1)) * outputScale + outputOffset);
      outputImage.data[pixel + 2] = clamp255(at(Math.min(2, channels - 1)) * outputScale + outputOffset);
      outputImage.data[pixel + 3] = 255;
    }
    outputContext.putImageData(outputImage, 0, 0);

    const resultCanvas = document.createElement('canvas');
    resultCanvas.width = originalWidth; resultCanvas.height = originalHeight;
    resultCanvas.getContext('2d').drawImage(outputCanvas, offsetX, offsetY, drawWidth, drawHeight, 0, 0, originalWidth, originalHeight);
    return resultCanvas;
  }

  async function decodeSourceImage(file){
    const image = new Image();
    const url = URL.createObjectURL(file);
    try{
      await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = () => reject(new Error('The original image could not be decoded.')); image.src = url; });
      return image;
    } finally { URL.revokeObjectURL(url); }
  }

  aiRunBtn.addEventListener('click', async () => {
    if (aiOperation) return;
    if (!Model.session){
      setAiStatus('Load a compatible ONNX model below before running the AI edit.');
      return;
    }
    if (!originalImageData || !hasMask){
      setAiStatus('Paint over the area you want the AI to change, then run the edit.');
      return;
    }
    const generation = imageGeneration;
    const selectionPadding = parseInt(maskPadInput.value, 10);
    const editBbox = maskBoundingBox(selectionPadding);
    const operation = { id: ++aiOperationId, generation, cancelled: false };
    aiOperation = operation;
    aiRunBtn.disabled = true; aiDownloadBtn.disabled = true;
    aiCancelBtn.hidden = false; aiRetryBtn.hidden = true; aiDismissBtn.hidden = true;
    pushActionSnapshot();
    operation.snapshot = actionHistory[actionHistory.length - 1];
    setAiStatus('Preparing the selected area for the model…');
    try{
      setAiStatus(Model.inputWidth && Model.inputHeight ? `Resizing the selection to ${Model.inputWidth} × ${Model.inputHeight}px…` : 'Preparing dynamic model dimensions…');
      const result = await aiFill();
      if (!isAiOperationCurrent(operation)){ removeAiSnapshot(operation); return; }
      if (!result){ removeAiSnapshot(operation); throw new Error('The AI model returned no usable image.'); }
      setAiStatus('Reconstructing the result at the original image dimensions…');
      const sourceImage = await decodeSourceImage(sourceFile);
      if (!isAiOperationCurrent(operation)){ removeAiSnapshot(operation); return; }
      const nativeResult = document.createElement('canvas');
      nativeResult.width = sourceImage.width;
      nativeResult.height = sourceImage.height;
      const nativeContext = nativeResult.getContext('2d');
      nativeContext.imageSmoothingEnabled = true;
      nativeContext.imageSmoothingQuality = 'high';
      nativeContext.drawImage(sourceImage, 0, 0);
      const sameComposition = editBbox && sourceDimensions &&
        Math.abs((sourceDimensions.width / sourceDimensions.height) - (canvas.width / canvas.height)) < 0.001;
      if (sameComposition){
        const scaleX = sourceImage.width / canvas.width;
        const scaleY = sourceImage.height / canvas.height;
        nativeContext.drawImage(result, editBbox.x, editBbox.y, editBbox.w, editBbox.h,
          editBbox.x * scaleX, editBbox.y * scaleY, editBbox.w * scaleX, editBbox.h * scaleY);
      } else {
        nativeContext.drawImage(result, 0, 0, result.width, result.height, 0, 0, nativeResult.width, nativeResult.height);
      }
      canvas.width = nativeResult.width;
      canvas.height = nativeResult.height;
      ctx.drawImage(nativeResult, 0, 0);
      originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      renderEditedImage();
      compareSnapshot = null;
      applyZoom();
      updateZoomLabel();
      maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
      maskCanvas.width = canvas.width;
      maskCanvas.height = canvas.height;
      maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
      maskHistory = []; hasMask = false;
      aiResult = nativeResult;
      aiPreviewCanvas.width = nativeResult.width; aiPreviewCanvas.height = nativeResult.height;
      aiPreviewCanvas.getContext('2d').drawImage(aiResult, 0, 0);
      aiPreviewFrame.hidden = false;
      aiDownloadBtn.disabled = false;
      setAiStatus(`Completed at the original ${nativeResult.width} × ${nativeResult.height}px dimensions.`);
      saveSession();
      aiOperation = null;
      resetAiOperationButtons();
    }catch(err){
      if (isAiOperationCurrent(operation)){
        removeAiSnapshot(operation);
        aiOperation = null;
        aiCancelBtn.hidden = true;
        aiRetryBtn.hidden = false;
        aiDismissBtn.hidden = false;
        setAiStatus(err.name === 'AbortError' ? 'AI editing was canceled. Your original image is safe.' : 'AI editing failed. Your original image is safe.');
        console.error('AI edit failed', err);
      }
    }finally{
      if (aiOperation === operation) aiOperation = null;
      if (aiOperation !== operation) updateAiActionState();
    }
  });

  aiCancelBtn.addEventListener('click', () => {
    if (!aiOperation) return;
    aiOperation.cancelled = true;
    aiOperation = null;
    aiCancelBtn.hidden = true;
    aiRetryBtn.hidden = false;
    aiDismissBtn.hidden = false;
    setAiStatus('AI editing was canceled. Your original image is safe.');
    updateAiActionState();
  });
  aiRetryBtn.addEventListener('click', () => {
    aiRetryBtn.hidden = true;
    aiDismissBtn.hidden = true;
    aiRunBtn.click();
  });
  aiDismissBtn.addEventListener('click', () => {
    aiRetryBtn.hidden = true;
    aiDismissBtn.hidden = true;
    setAiStatus('Ready to edit the current selection.');
  });

  aiDownloadBtn.addEventListener('click', () => {
    if (!aiResult) return;
    aiResult.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a'); link.download = nextExportFilename('png'); link.href = url; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    }, 'image/png');
  });

  async function aiFill(){
    if (!Model.session){ setAiStatus('Load an ONNX model in the AI Editor settings first.'); return null; }
    const pad = parseInt(maskPadInput.value,10);
    const bbox = maskBoundingBox(pad);
    if (!bbox) return null;
    if (activeSection === 'ai') setAiStatus('Running the AI model on the selected region…');
    else setStatus('Running the ONNX model on the masked region…');
    let patchResult;
    try{
      patchResult = await runOnnxOnRegion(bbox);
    }catch(err){
      const message = 'AI processing failed: ' + err.message + ' — check the AI Editor model settings.';
      if (activeSection === 'ai') setAiStatus(message);
      else setStatus(message);
      modelStatus.textContent = 'Model could not process this selection: ' + (err.message || 'unknown model error');
      throw err;
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
  fillCancelBtn.addEventListener('click', () => {
    fillCancelled = true;
    fillCancelBtn.hidden = true;
    setStatus('Canceling fill…');
  });
  fillBtn.addEventListener('click', async () => {
    if (!originalImageData || !hasMask) return;
    fillCancelled = false;
    fillBtn.disabled = true;
    fillCancelBtn.hidden = false;
    fillProgress.hidden = false;
    fillProgress.value = 0;
    pushActionSnapshot();
    let result;
    try{
      result = await quickFill();
    }catch(err){
      setStatus('Fill failed: ' + err.message);
      actionHistory.pop();
      fillBtn.disabled = false;
      fillCancelBtn.hidden = true;
      fillProgress.hidden = true;
      return;
    }
    if (!result){
      actionHistory.pop();
      fillBtn.disabled = !hasMask;
      fillCancelBtn.hidden = true;
      fillProgress.hidden = true;
      if (fillCancelled) setStatus('Fill canceled. Your selection is still available.');
      return;
    }
    originalImageData = result;
    maskCtx.clearRect(0,0,maskCanvas.width,maskCanvas.height);
    maskHistory = []; hasMask = false;
    fillBtn.disabled = true; undoBtn.disabled = true;
    fillCancelBtn.hidden = true;
    fillProgress.value = 100;
    fillProgress.hidden = true;
    updateMaskUi();
    renderEditedImage();
    saveSession();
    setStatus('Selection removed. Inspect the result, then download.');
  });

  // ============================================================
  // Download
  // ============================================================
  function createCleanCanvas(){
    const cleanCanvas = document.createElement('canvas');
    cleanCanvas.width = canvas.width;
    cleanCanvas.height = canvas.height;
    cleanCanvas.getContext('2d').putImageData(getAdjustedImageData(), 0, 0);
    return cleanCanvas;
  }
  function getExportDimensions(){
    if (downloadResolution.value === 'custom'){
      return {
        width: Math.max(1, parseInt(exportWidth.value, 10) || canvas.width),
        height: Math.max(1, parseInt(exportHeight.value, 10) || canvas.height)
      };
    }
    return sourceDimensions || { width: canvas.width, height: canvas.height };
  }
  function createExportCanvas(){
    const dimensions = getExportDimensions();
    const output = document.createElement('canvas');
    output.width = dimensions.width; output.height = dimensions.height;
    const outputContext = output.getContext('2d');
    outputContext.imageSmoothingEnabled = true;
    outputContext.imageSmoothingQuality = 'high';
    outputContext.drawImage(createCleanCanvas(), 0, 0, canvas.width, canvas.height, 0, 0, output.width, output.height);
    if (brandingImage){
      outputContext.globalAlpha = Number(brandingOpacity.value) / 100;
      const width = brandingPlacement.width * output.width;
      const height = width / (brandingImage.width / brandingImage.height || 1);
      outputContext.drawImage(brandingImage, brandingPlacement.x * output.width, brandingPlacement.y * output.height, width, height);
      outputContext.globalAlpha = 1;
    }
    return output;
  }
  function updateExportControls(){
    const isPng = downloadFormat.value === 'png';
    exportCustomSize.hidden = downloadResolution.value !== 'custom';
    exportQualityWrap.hidden = isPng;
    exportQualityHint.textContent = isPng ? 'PNG is lossless.' : 'Higher quality creates a larger file.';
  }
  function updatePreviewCanvas(){
    if (!originalImageData) return;
    const output = createExportCanvas();
    previewCanvas.width = output.width;
    previewCanvas.height = output.height;
    previewCanvas.getContext('2d').drawImage(output, 0, 0);
    const dimensions = getExportDimensions();
    previewNote.textContent = `${dimensions.width} × ${dimensions.height}px · ${downloadFormat.value === 'jpeg' ? 'JPG' : downloadFormat.value.toUpperCase()}${downloadFormat.value === 'png' ? ' · lossless' : ' · ' + exportQuality.value + '% quality'}`;
  }
  async function openPreview(){
    if (!originalImageData) return;
    if (downloadResolution.value === 'original' && sourceDimensions){
      exportWidth.value = sourceDimensions.width;
      exportHeight.value = sourceDimensions.height;
    }
    updateExportControls();
    updatePreviewCanvas();
    previewModal.hidden = false;
    previewClose.focus();
  }
  downloadBtn.addEventListener('click', openPreview);
  metadataDownloadBtn.addEventListener('click', () => downloadBtn.click());
  downloadFormat.addEventListener('change', () => { updateExportControls(); if (!previewModal.hidden) updatePreviewCanvas(); });
  downloadResolution.addEventListener('change', () => {
    if (downloadResolution.value === 'custom' && originalImageData){
      exportWidth.value = canvas.width;
      exportHeight.value = canvas.height;
    }
    updateExportControls();
    if (!previewModal.hidden) updatePreviewCanvas();
  });
  [exportWidth, exportHeight, exportQuality].forEach(input => input.addEventListener('input', () => {
    exportQualityValue.textContent = exportQuality.value + '%';
    if (!previewModal.hidden) updatePreviewCanvas();
  }));

  resizeWidth.addEventListener('input', () => {
    if (!resizeKeepRatio.checked || !originalImageData) return;
    resizeHeight.value = Math.max(1, Math.round(Number(resizeWidth.value) * canvas.height / canvas.width));
  });
  resizeHeight.addEventListener('input', () => {
    if (!resizeKeepRatio.checked || !originalImageData) return;
    resizeWidth.value = Math.max(1, Math.round(Number(resizeHeight.value) * canvas.width / canvas.height));
  });
  resizeReset.addEventListener('click', updateResizeFields);
  resizeApply.addEventListener('click', () => {
    if (!originalImageData) return;
    const width = Math.min(2200, Math.max(1, parseInt(resizeWidth.value, 10)));
    const height = Math.min(2200, Math.max(1, parseInt(resizeHeight.value, 10)));
    if (!width || !height) return;
    if (width === canvas.width && height === canvas.height) return;
    pushActionSnapshot();
    const source = document.createElement('canvas');
    source.width = canvas.width; source.height = canvas.height;
    source.getContext('2d').putImageData(originalImageData, 0, 0);
    canvas.width = width; canvas.height = height;
    ctx.drawImage(source, 0, 0, width, height);
    originalImageData = ctx.getImageData(0, 0, width, height);
    updateBrandingOverlay();
    maskCanvas.width = width; maskCanvas.height = height;
    maskCtx.clearRect(0, 0, width, height);
    maskHistory = []; hasMask = false; fillBtn.disabled = true; undoBtn.disabled = true;
    compareSnapshot = null; compareBtn.disabled = true;
    updateResizeFields();
    renderEditedImage();
    applyZoom();
    saveSession();
    setStatus('Image resized to ' + width + ' × ' + height + ' pixels.');
  });
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
    const mime = fmt === 'jpeg' ? 'image/jpeg' : fmt === 'webp' ? 'image/webp' : 'image/png';
    const quality = fmt === 'png' ? undefined : Number(exportQuality.value) / 100;
    const encoded = await new Promise(resolve => createExportCanvas().toBlob(resolve, mime, quality));
    if (!encoded) throw new Error('The selected export format is unavailable in this browser.');
    const output = new Uint8Array(await encoded.arrayBuffer());
    if (fmt !== 'jpeg' || stripMetadata.checked) return new Blob([output], {type:mime});
    const exif = await readOriginalExifSegment();
    return exif ? new Blob([output.slice(0,2), exif, output.slice(2)], {type:mime}) : new Blob([output], {type:mime});
  }
  function closePreview(){ previewModal.hidden = true; }
  previewClose.addEventListener('click', closePreview);
  previewCancel.addEventListener('click', closePreview);
  previewModal.addEventListener('click', e => { if (e.target === previewModal) closePreview(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !previewModal.hidden) closePreview(); });
  previewDownload.addEventListener('click', async () => {
    const fmt = downloadFormat.value;
    const ext = fmt === 'jpeg' ? 'jpg' : fmt === 'webp' ? 'webp' : 'png';
    previewDownload.disabled = true;
    try{
      const blob = await createExportBlob(fmt);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = nextExportFilename(ext);
      link.href = url;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 0);
      closePreview();
    }catch(err){ previewNote.textContent = 'Could not create this export. Choose another format or resolution.'; }
    finally{ previewDownload.disabled = false; }
  });
  // ============================================================
  // Metadata (EXIF) viewer
  // ============================================================
  const EXIF_IFD0 = { 271:'Make', 272:'Model', 274:'Orientation', 282:'XResolution', 283:'YResolution', 296:'ResolutionUnit', 305:'Software', 306:'DateTime', 315:'Artist', 33432:'Copyright', 34665:'ExifIFDPointer', 34853:'GPSInfoIFDPointer' };
  const EXIF_SUB  = { 33434:'ExposureTime', 33437:'FNumber', 34850:'ExposureProgram', 34855:'ISO', 36867:'DateTimeOriginal', 36868:'DateTimeDigitized', 37377:'ShutterSpeedValue', 37378:'ApertureValue', 37379:'BrightnessValue', 37380:'ExposureBiasValue', 37381:'MaxApertureValue', 37382:'SubjectDistance', 37383:'MeteringMode', 37385:'Flash', 37386:'FocalLength', 40961:'ColorSpace', 40962:'PixelXDimension', 40963:'PixelYDimension', 41495:'SensingMethod', 41987:'WhiteBalance', 41988:'DigitalZoomRatio', 41989:'FocalLengthIn35mmFilm', 41990:'SceneCaptureType', 42036:'LensModel' };
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
    rows.push(['Aspect ratio', formatAspectRatio(w, h)]);
    rows.push(['Megapixels', (w * h / 1000000).toFixed(2) + ' MP']);
    rows.push(['Transparency', hasTransparentPixels() ? 'Yes' : 'No']);
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

  function formatAspectRatio(width, height){
    if (!width || !height) return 'Unknown';
    const divisor = gcd(width, height);
    return (width / divisor) + ':' + (height / divisor);
  }
  function gcd(a, b){
    while (b){ const remainder = a % b; a = b; b = remainder; }
    return a || 1;
  }
  function hasTransparentPixels(){
    if (!originalImageData) return false;
    for (let i=3; i<originalImageData.data.length; i+=4){
      if (originalImageData.data[i] < 255) return true;
    }
    return false;
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

  (async function restoreSession(){
    try{
      const saved = await readSession();
      if (!saved || !saved.blob) return;
      const file = new File([saved.blob], saved.name || 'restored-image.png', {
        type: saved.type || saved.blob.type || 'image/png',
        lastModified: saved.lastModified || Date.now()
      });
      savedSessionFile = file;
      savedSessionName.textContent = saved.name || 'Saved image';
      if (savedSessionUrl) URL.revokeObjectURL(savedSessionUrl);
      savedSessionUrl = URL.createObjectURL(saved.blob);
      savedSessionPreview.src = savedSessionUrl;
      savedSession.hidden = false;
      const restoredDimensions = saved.sourceWidth && saved.sourceHeight
        ? { width:saved.sourceWidth, height:saved.sourceHeight }
        : null;
      brandingPlacement = saved.brandingPlacement || brandingPlacement;
      if (saved.brandingSize) brandingSize.value = saved.brandingSize;
      if (saved.brandingOpacity) brandingOpacity.value = saved.brandingOpacity;
      if (saved.brandingBlob) setBrandingImage(new File([saved.brandingBlob], 'branding.png', { type:'image/png' }));
      loadImageFile(file, ['remove','metadata','resize','ai'].includes(saved.section) ? saved.section : 'home', restoredDimensions);
    }catch(e){ /* no previous image session */ }
  })();

  applyZoom();
})();
