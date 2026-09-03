const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const os = require('node:os');
const { spawn } = require('node:child_process');
const { Readable } = require('node:stream');
const { pipeline } = require('node:stream/promises');

const PORT = Number(process.env.PORT || 8000);
const PROVIDER_URL = (process.env.MEDIA_PROVIDER_URL || '').replace(/\/$/, '');
const PROVIDER_API_KEY = process.env.MEDIA_PROVIDER_API_KEY || '';
const APIFY_TOKEN = process.env.APIFY_TOKEN || '';
const YTDLP_COMMAND = process.env.YTDLP_COMMAND || (process.platform === 'win32' ? 'py' : 'yt-dlp');
const YTDLP_PREFIX = process.platform === 'win32' && !process.env.YTDLP_COMMAND ? ['-m', 'yt_dlp'] : [];
const MAX_BODY = 16 * 1024;
const MAX_DOWNLOAD_BYTES = 250 * 1024 * 1024;
const JOB_TTL = 10 * 60 * 1000;
const jobs = new Map();
const root = __dirname;
const allowedHosts = new Set([
  'tiktok.com', 'instagram.com', 'facebook.com', 'fb.watch', 'youtube.com', 'youtu.be', 'x.com', 'twitter.com'
]);

function json(res, status, body){
  res.writeHead(status, { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store' });
  res.end(JSON.stringify(body));
}
function errorCode(error){
  if (error.name === 'AbortError') return 'timeout';
  if (error.code === 'provider_not_configured') return 'provider';
  return error.code || 'provider';
}
function cleanupJobs(){
  const now = Date.now();
  for (const [id, job] of jobs) if (job.expires < now) jobs.delete(id);
}
function parseBody(req){
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
      if (Buffer.byteLength(data) > MAX_BODY) { reject(Object.assign(new Error('Request too large'), { code:'invalid' })); req.destroy(); }
    });
    req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch(e){ reject(Object.assign(new Error('Invalid JSON'), { code:'invalid' })); } });
    req.on('error', reject);
  });
}
function validateSourceUrl(value){
  let parsed;
  try { parsed = new URL(String(value || '').trim()); } catch(e){ throw Object.assign(new Error('Invalid URL'), { code:'invalid' }); }
  if (parsed.protocol !== 'https:') throw Object.assign(new Error('HTTPS required'), { code:'invalid' });
  const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
  const supported = [...allowedHosts].some(name => host === name || host.endsWith('.' + name));
  if (!supported) throw Object.assign(new Error('Unsupported source'), { code:'unsupported' });
  parsed.username = ''; parsed.password = '';
  return parsed.href;
}
async function providerRequest(url, mode = 'auto'){
  if (!PROVIDER_URL) throw Object.assign(new Error('Media provider is not configured'), { code:'provider_not_configured' });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const headers = { 'Accept':'application/json', 'Content-Type':'application/json' };
    if (PROVIDER_API_KEY) headers.Authorization = `Api-Key ${PROVIDER_API_KEY}`;
    const response = await fetch(PROVIDER_URL, { method:'POST', headers, body:JSON.stringify({ url, downloadMode:mode, videoQuality:'max', audioFormat:'mp3', filenameStyle:'basic' }), signal:controller.signal });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.status === 'error') throw Object.assign(new Error('Provider request failed'), { code: data.error?.code || 'provider' });
    return data;
  } finally { clearTimeout(timer); }
}
function runYtDlp(args, timeoutMs = 90000){
  return new Promise((resolve, reject) => {
    const child = spawn(YTDLP_COMMAND, [...YTDLP_PREFIX, ...args], { windowsHide:true });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => { child.kill(); reject(Object.assign(new Error('Extractor timeout'), { code:'timeout' })); }, timeoutMs);
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.on('error', error => { clearTimeout(timer); reject(Object.assign(error, { code:'provider' })); });
    child.on('close', code => {
      clearTimeout(timer);
      if (code !== 0) return reject(Object.assign(new Error(stderr || 'Extractor failed'), { code:'provider', stdout }));
      resolve(stdout.trim());
    });
  });
}
function decodeHtml(value){
  return String(value || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}
async function instagramPublicFallback(sourceUrl, itemCount = 1){
  async function readPage(url){
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(url, { headers:{ 'User-Agent':'Mozilla/5.0', 'Accept':'text/html,application/xhtml+xml' }, signal:controller.signal });
      if (!response.ok) return '';
      return await response.text();
    } finally { clearTimeout(timer); }
  }
  const pages = [];
  for (let index = 1; index <= Math.min(Number(itemCount) || 1, 20); index++) {
    const pageUrl = new URL(sourceUrl);
    if (itemCount > 1) pageUrl.searchParams.set('img_index', String(index));
    pages.push(await readPage(pageUrl.href));
  }
  try {
    const html = pages.find(Boolean) || '';
    if (!html) throw Object.assign(new Error('Instagram media unavailable'), { code:'unavailable' });
    const meta = property => {
      const match = html.match(new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i')) || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i'));
      return match ? decodeHtml(match[1]) : '';
    };
    const video = meta('og:video') || meta('og:video:secure_url');
    const image = meta('og:image');
    const embeddedImages = pages.flatMap(page => [...page.matchAll(/https:\/\/[^"'\\\s<>]+/g)].map(match => decodeHtml(match[0])))
      .filter(url => /scontent[^/]*\/.*\.(?:jpg|jpeg|png|webp)(?:\?|$)/i.test(url));
    const mediaKey = image.match(/_(\d{10,})_/)?.[1];
    const postImages = mediaKey ? embeddedImages.filter(url => url.includes(`_${mediaKey}_`)) : embeddedImages;
    const imageUrls = [...new Map([image, ...postImages].filter(Boolean).map(url => {
      try { return [new URL(url).pathname, url]; } catch(e) { return [url, url]; }
    })).values()];
    const mediaUrl = video || imageUrls[0];
    if (!mediaUrl) throw Object.assign(new Error('Instagram media unavailable'), { code:'unavailable' });
    if (video) {
      const format = makeFormat({ kind:'direct', sourceUrl:video, filename:'instagram-media' }, 'Best available', 'MP4', video, { filename:'instagram-media.mp4' });
      return { title:meta('og:title') || 'Instagram media', source:'Instagram', thumbnail:image || null, duration:'Not available', mediaType:'Video', formats:[format], items:[{ title:meta('og:title') || 'Instagram video', source:'Instagram', thumbnail:image || null, formats:[format] }] };
    }
    const formats = imageUrls.map((url, index) => makeFormat({ kind:'direct', sourceUrl:url, filename:`instagram-image-${index + 1}` }, `Image ${index + 1}`, 'Image', url, { filename:`instagram-image-${index + 1}.jpg` }));
    return { title:meta('og:title') || 'Instagram media', source:'Instagram', thumbnail:imageUrls[0] || null, duration:'Not available', mediaType:'Image', formats, items:formats.map((format, index) => ({ title:`Instagram image ${index + 1}`, source:'Instagram', thumbnail:imageUrls[index], formats:[format] })) };
  } catch(error) { throw error; }
}
async function localAnalyze(sourceUrl){
  let info;
  try { info = JSON.parse(await runYtDlp(['--dump-single-json', '--skip-download', '--no-playlist', '--no-warnings', sourceUrl])); }
  catch(error){
    if (new URL(sourceUrl).hostname.endsWith('instagram.com')) {
      let itemCount = 1;
      try { itemCount = JSON.parse(error.stdout || '{}').playlist_count || 1; } catch(e) {}
      return await instagramPublicFallback(sourceUrl, itemCount);
    }
    throw Object.assign(new Error('Media could not be analyzed'), { code:error.code || 'provider' });
  }
  const formats = [];
  const items = [];
  const sourceItems = Array.isArray(info.entries) ? info.entries.filter(Boolean) : [info];
  for (const sourceItem of sourceItems) {
    const itemFormatsResult = [];
    const seenItem = new Set();
    const seenChoices = new Set();
    let itemThumbnail = sourceItem.thumbnail || null;
    const itemFormats = Array.isArray(sourceItem.formats) && sourceItem.formats.length
      ? sourceItem.formats
      : sourceItem.url ? [{ ...sourceItem, format_id:sourceItem.format_id || 'best', ext:sourceItem.ext || 'bin', vcodec:sourceItem.vcodec || 'none', acodec:sourceItem.acodec || 'none' }] : [];
    for (const item of itemFormats) {
      if (!item.url || !item.format_id || seenItem.has(item.format_id)) continue;
      if (item.vcodec === 'none' && item.acodec === 'none' && !['jpg','jpeg','png','webp','gif'].includes(String(item.ext || '').toLowerCase())) continue;
      if (item.vcodec !== 'none' && item.acodec === 'none') continue;
      const isAudio = item.vcodec === 'none' && !['jpg','jpeg','png','webp','gif'].includes(String(item.ext || '').toLowerCase());
      const isPicture = !isAudio && ['jpg','jpeg','png','webp','gif'].includes(String(item.ext || '').toLowerCase()) && !item.height;
      const height = item.height ? `${item.height}p` : '';
      const label = isPicture ? `Image (${String(item.ext).toUpperCase()})` : isAudio ? `Audio (${item.ext || 'original'})` : (height || `Video (${item.ext || 'original'})`);
      const choiceKey = isAudio ? 'audio' : label;
      if (seenChoices.has(choiceKey)) continue;
      const type = isPicture ? 'Image' : isAudio ? 'Audio' : (item.ext || 'Video').toUpperCase();
      const format = makeFormat({ kind:isPicture ? 'direct' : 'local', sourceUrl, formatId:item.format_id, filename:sourceItem.title || info.title }, label, type, isPicture ? item.url : item.url, { filename:safeFilename(sourceItem.title || info.title) + '.' + (item.ext || 'mp4') });
      jobs.get(format.id).sourceUrl = sourceUrl;
      if (isPicture) jobs.get(format.id).sourceUrl = item.url;
      formats.push(format);
      itemFormatsResult.push(format);
      if (!itemThumbnail && isPicture) itemThumbnail = item.url;
      seenItem.add(item.format_id);
      seenChoices.add(choiceKey);
    }
    if (itemFormatsResult.length) items.push({ title:sourceItem.title || info.title, source:info.extractor_key || info.extractor || 'Supported source', duration:sourceItem.duration_string || '', thumbnail:itemThumbnail, formats:itemFormatsResult });
  }
  formats.sort((a, b) => {
    const aScore = a.type === 'Audio' || a.type === 'Image' ? -1 : (Number.parseInt(a.label, 10) || 0);
    const bScore = b.type === 'Audio' || b.type === 'Image' ? -1 : (Number.parseInt(b.label, 10) || 0);
    return bScore - aScore;
  });
  if (!formats.length && new URL(sourceUrl).hostname.endsWith('instagram.com')) return await instagramPublicFallback(sourceUrl, info.playlist_count || 1);
  return { title:info.title || 'Public media', source:info.extractor_key || info.extractor || 'Supported source', thumbnail:info.thumbnail || null, duration:info.duration_string || (info.duration ? `${Math.round(info.duration)}s` : 'Not available'), mediaType:info._type === 'audio' ? 'Audio' : formats.some(format => format.type === 'Image') ? 'Image' : 'Video', formats, items };
}
function providerFileUrl(data){
  if (data.status === 'redirect' || data.status === 'tunnel') return data.url;
  if (data.status === 'local-processing' && Array.isArray(data.tunnel)) return data.tunnel[0];
  return null;
}
function makeFormat(job, label, type, sourceUrl, extra = {}){
  const id = crypto.randomBytes(18).toString('base64url');
  jobs.set(id, { ...job, sourceUrl, expires:Date.now() + JOB_TTL });
  return { id, label, type, ...extra };
}
function normalizeProviderResult(data, sourceUrl){
  const job = { provider:data, sourceUrl };
  const formats = [];
  const items = [];
  let thumbnail = null;
  if (data.status === 'picker' && Array.isArray(data.picker)) {
    data.picker.forEach((item, index) => {
      if (item.thumb && !thumbnail) thumbnail = item.thumb;
      if (item.url) {
        const format = makeFormat(job, item.type === 'audio' ? 'Audio' : `Media ${index + 1}`, item.type || 'Media', item.url);
        formats.push(format);
        items.push({ title:data.title || `Media ${index + 1}`, source:data.service || 'Supported source', thumbnail:item.thumb || null, formats:[format] });
      }
    });
  } else {
    const directUrl = providerFileUrl(data);
    if (directUrl) {
      const format = makeFormat(job, data.audio ? 'Audio' : 'Best available', data.audio ? 'Audio' : 'Video', directUrl, { filename:data.filename });
      formats.push(format);
      items.push({ title:data.title || 'Public media', source:data.service || 'Supported source', thumbnail:null, formats:[format] });
    }
  }
  return { title:data.title || data.output?.metadata?.title || 'Public media', source:data.service || 'Supported source', thumbnail, duration:data.duration || 'Not available', mediaType: data.audio ? 'Audio' : 'Video', formats, items };
}
async function apifyInstagramAnalyze(sourceUrl){
  const actor = (process.env.APIFY_INSTAGRAM_ACTOR || 'apify/instagram-scraper').replace('/', '~');
  const response = await fetch(`https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items`, {
    method:'POST',
    headers:{ 'Authorization':`Bearer ${APIFY_TOKEN}`, 'Content-Type':'application/json', 'Accept':'application/json' },
    body:JSON.stringify({ resultsType:'posts', directUrls:[sourceUrl], resultsLimit:1 })
  });
  if (!response.ok) throw Object.assign(new Error('Apify request failed'), { code:'provider' });
  const results = await response.json();
  const post = Array.isArray(results) ? results[0] : results;
  if (!post) throw Object.assign(new Error('Instagram media unavailable'), { code:'unavailable' });
  const imageUrls = [...new Set([post.displayUrl, ...(post.images || []), ...(post.carouselImages || []), ...(post.carousel_media || [])].filter(url => typeof url === 'string'))];
  const videoUrls = [...new Set([post.videoUrl, post.video_url, ...(post.childPosts || []).map(child => child.videoUrl || child.video_url)].filter(url => typeof url === 'string'))];
  const items = [];
  const formats = [];
  imageUrls.forEach((url, index) => {
    const format = makeFormat({ kind:'direct', sourceUrl:url, filename:`instagram-image-${index + 1}` }, `Image ${index + 1}`, 'Image', url, { filename:`instagram-image-${index + 1}.jpg` });
    formats.push(format); items.push({ title:`Instagram image ${index + 1}`, source:'Instagram', thumbnail:url, formats:[format] });
  });
  videoUrls.forEach((url, index) => {
    const format = makeFormat({ kind:'direct', sourceUrl:url, filename:`instagram-video-${index + 1}` }, 'Video', 'MP4', url, { filename:`instagram-video-${index + 1}.mp4` });
    formats.push(format); items.push({ title:post.caption || `Instagram video ${index + 1}`, source:'Instagram', thumbnail:post.displayUrl || null, formats:[format] });
  });
  if (!formats.length) throw Object.assign(new Error('Instagram media unavailable'), { code:'unavailable' });
  return { title:post.caption || 'Instagram media', source:'Instagram', thumbnail:post.displayUrl || imageUrls[0] || null, duration:post.videoDuration ? `${Math.round(post.videoDuration)}s` : 'Not available', mediaType:videoUrls.length ? 'Video' : 'Image', formats, items };
}
async function handleAnalyze(req, res){
  const body = await parseBody(req);
  const sourceUrl = validateSourceUrl(body.url);
  if (APIFY_TOKEN && new URL(sourceUrl).hostname.endsWith('instagram.com')) return json(res, 200, await apifyInstagramAnalyze(sourceUrl));
  if (PROVIDER_URL) return json(res, 200, normalizeProviderResult(await providerRequest(sourceUrl), sourceUrl));
  json(res, 200, await localAnalyze(sourceUrl));
}
function safeFilename(value){
  return String(value || 'media-download').replace(/[^a-z0-9._-]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 100) || 'media-download';
}
async function handleDownload(req, res){
  const body = await parseBody(req);
  cleanupJobs();
  const job = jobs.get(String(body.formatId || ''));
  if (!job || job.expires < Date.now()) throw Object.assign(new Error('Download expired'), { code:'provider' });
  validateSourceUrl(body.url);
  if (job.kind === 'local') return await handleLocalDownload(req, res, job, body.formatId);
  const target = new URL(job.sourceUrl);
  if (target.protocol !== 'https:') throw Object.assign(new Error('Unsafe download URL'), { code:'provider' });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120000);
  try {
    const response = await fetch(target, { signal:controller.signal, redirect:'error' });
    if (!response.ok || !response.body) throw Object.assign(new Error('Download unavailable'), { code:'provider' });
    const size = Number(response.headers.get('content-length') || 0);
    if (size > MAX_DOWNLOAD_BYTES) throw Object.assign(new Error('Download too large'), { code:'provider' });
    res.writeHead(200, { 'Content-Type':response.headers.get('content-type') || 'application/octet-stream', 'Content-Disposition':`attachment; filename="${safeFilename(body.filename || 'media-download')}"`, 'Cache-Control':'no-store' });
    await pipeline(Readable.fromWeb(response.body), res);
  } finally { clearTimeout(timer); jobs.delete(String(body.formatId || '')); }
}
async function handleLocalDownload(req, res, job, jobId){
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pixelroom-media-'));
  const outputTemplate = path.join(tempDir, 'download.%(ext)s');
  try {
    await runYtDlp(['--no-playlist', '--no-part', '--no-warnings', '--format', job.formatId, '--output', outputTemplate, job.sourceUrl], 120000);
    const fileName = fs.readdirSync(tempDir).find(name => name.startsWith('download.'));
    if (!fileName) throw Object.assign(new Error('Download unavailable'), { code:'provider' });
    const filePath = path.join(tempDir, fileName);
    const stat = fs.statSync(filePath);
    if (stat.size > MAX_DOWNLOAD_BYTES) throw Object.assign(new Error('Download too large'), { code:'provider' });
    res.writeHead(200, { 'Content-Type':fileName.endsWith('.mp4') ? 'video/mp4' : 'application/octet-stream', 'Content-Disposition':`attachment; filename="${safeFilename(job.filename)}-${job.formatId}.${path.extname(fileName).slice(1)}"`, 'Content-Length':stat.size, 'Cache-Control':'no-store' });
    await pipeline(fs.createReadStream(filePath), res);
  } finally {
    jobs.delete(jobId);
    fs.rmSync(tempDir, { recursive:true, force:true });
  }
}
function serveStatic(req, res){
  const requestPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const relative = requestPath === '/' ? 'index.html' : requestPath.replace(/^\/+/, '');
  const filePath = path.resolve(root, relative);
  if (!filePath.startsWith(root + path.sep) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) return json(res, 404, { error:'Not found' });
  const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.svg':'image/svg+xml', '.webmanifest':'application/manifest+json' };
  res.writeHead(200, { 'Content-Type':types[path.extname(filePath)] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
}
const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'POST' && req.url === '/api/media/analyze') return await handleAnalyze(req, res);
    if (req.method === 'POST' && req.url === '/api/media/download') return await handleDownload(req, res);
    if (req.method !== 'GET') return json(res, 405, { error:'Method not allowed' });
    serveStatic(req, res);
  } catch(error){
    const code = errorCode(error);
    const status = code === 'invalid' ? 400 : code === 'unsupported' ? 422 : code === 'provider_not_configured' ? 503 : 502;
    json(res, status, { code });
  }
});
server.listen(PORT, () => console.log(`Pixelroomedit running at http://localhost:${PORT}`));
process.on('SIGINT', () => server.close(() => process.exit(0)));
