# Pixelroomedit

Pixelroomedit is a browser-based image editor for removing unwanted objects and details from photos. It runs image editing locally in the browser, so images do not need to be uploaded to an application server.

## Features

- Drag-and-drop or file-picker image upload
- Local object and watermark removal with a non-AI quick-fill method
- Separate AI Editor with ONNX processing through ONNX Runtime Web
- Brush selection and eraser tools
- Crop and rotate
- Zoom controls
- Undo brush strokes
- Multi-step undo for crop, rotate, and removal actions
- Hold-to-compare with the original image
- PNG and JPEG export
- PNG, JPG, and WebP export with original/custom resolution and quality preview
- Optional metadata removal
- Export preview before downloading
- Separate object removal, metadata cleanup, and image resize sections
- Independent AI Editor with model-derived input sizing and original-size output reconstruction
- Pixel-dimension resize with optional aspect-ratio locking
- Responsive desktop and mobile layout
- Touch drawing, pinch zoom, and pan while zoomed
- Cancel, retry, and dismiss recovery for AI edits
- Media Downloader frontend with backend analysis, format selection, cancellation, and local recent-download history

## How It Works

1. Open Pixelroomedit and select or drop an image.
2. Choose **Remove object or watermark**, **Remove image metadata**, or **Resize image**.
3. In the removal section, use the Brush tool to mark the object or area to remove. The red overlay is only a temporary selection.
4. Select **Remove selection**. Quick fill works locally and is best for simple or repeating backgrounds.
5. Review the result with **Hold to compare** or **Undo last action**.
6. Select a format and click **Download**. The metadata section provides a dedicated clean-export action.
7. Review the export preview, choose PNG, JPG, or WebP plus resolution and quality, then select **Download image**.

Only edit images that you own or have permission to modify.

## Media Downloader Backend

The Media Downloader is intentionally server-backed. The browser sends a submitted public URL to `POST /api/media/analyze`:

```json
{ "url": "https://supported.example/public-media" }
```

The endpoint should return structured metadata without exposing provider credentials:

```json
{
	"title": "Example video",
	"source": "Example",
	"thumbnail": "https://cdn.example/thumbnail.jpg",
	"duration": "00:32",
	"mediaType": "Video",
	"formats": [{ "id": "video-720", "label": "720p", "type": "MP4", "filename": "example.mp4" }]
}
```

The browser posts the selected `formatId` and URL to `POST /api/media/download`. The server should validate the URL again, enforce an allowlist of providers, protect against SSRF and redirects, cap download size and processing time, sanitize filenames, and return a streamed media response or a short-lived authorized download. Temporary files and jobs should be deleted after completion or expiration, and submitted URLs should not be logged unnecessarily. The frontend never contains provider API keys and stores only lightweight recent-download details in local storage, never media files.

## Privacy and Metadata

Pixelroomedit does not send images to a Pixelroomedit server. Image decoding, masking, removal, and export happen in the browser.

The **Remove metadata** option is optional:

- When enabled, Pixelroomedit removes embedded metadata from the export.
- When disabled, original JPEG EXIF metadata is preserved where technically possible.
- PNG exports do not preserve camera EXIF metadata through the browser canvas export path.

The AI model is also processed in the browser. If a model is loaded, it may be cached locally by the browser for later use.

## Run Locally

Use the included Node server so the Media Downloader's POST endpoints are available:

```bash
npm start
```

The Media Downloader uses the locally installed `yt-dlp` extractor by default. On Windows, `py -m yt_dlp` must work. On Linux/macOS, install the `yt-dlp` command. `ffmpeg` is optional and is only needed for formats that require merging or conversion.

For stronger Instagram carousel support, configure Apify on the server. The Instagram Actor returns the post's public `displayUrl`, carousel image URLs, and video URLs:

```powershell
$env:APIFY_TOKEN = "your-apify-token"
node server.js
```

The token is read only by `server.js` and is never sent to the browser. Apify's Instagram Actor uses pay-per-event pricing; review the current pricing and usage limits before deploying it publicly.

For deployments that use a separate permitted provider instead, configure it before starting the server:

```powershell
$env:MEDIA_PROVIDER_URL = "https://your-provider.example"
$env:MEDIA_PROVIDER_API_KEY = "your-server-side-key"
npm start
```

The provider should implement the Cobalt-compatible JSON request/response shape described in the Media Downloader Backend section. Do not put either environment variable in client-side JavaScript or commit them to the repository. The local extractor does not require either variable.

Then open:

```text
http://localhost:8000/index.html
```

Opening `index.html` directly or using `python -m http.server` will disable the downloader API because those servers do not handle its POST requests.

## Deploy

The image editor files can be uploaded to any static hosting service such as GitHub Pages, Netlify, or Cloudflare Pages. The Media Downloader additionally requires the included Node server or an equivalent backend deployment:

- `index.html`
- `script.js`
- `styles.css`
- `server.js`
- `package.json`

The app loads ONNX Runtime Web from jsDelivr and the upload panel uses a remote Unsplash image, so deployed users need an internet connection for those resources. Basic image editing does not require an AI service or API key.

## AI Editor Setup

The AI Editor is separate from Remove object or watermark. To use it:

1. Open **AI Editor**.
2. Choose a compatible `.onnx` image-inpainting model file, or provide a direct model URL.
3. Wait for the model to load.
4. Use the shared Brush or Eraser tools to mark the area to edit.
5. Select **Run AI edit**.

The browser adapter detects common NCHW and NHWC RGB layouts, fixed or dynamic spatial sizes, and an optional single-channel mask input. It preserves the selected region's aspect ratio and composites the result back at the original pixel dimensions. Models with different preprocessing, multiple extra inputs, or non-RGB outputs still need a model-specific adapter. Large downloads can take time and may be blocked by cross-origin restrictions; loading a local model file is the most reliable option.

## AI Editor

The **AI Editor** is separate from Remove object or watermark. It uses the loaded ONNX model's detected input dimensions (or its dynamic dimensions), keeps the original uploaded file untouched, letterboxes it without distortion for model input, and reconstructs the returned image at the original width and height. A replacement upload invalidates pending AI work and clears its result. Models that require text prompts, custom preprocessing, or inputs beyond RGB and an optional mask are not supported by this generic browser adapter.

## Project Structure

```text
index.html   Main editor interface
script.js    Image editing, inpainting, history, export, and metadata logic
styles.css   Layout, responsive styles, and editor appearance
favicon.svg  Pixelroomedit star app icon
site.webmanifest  Installable web-app configuration
README.md    Project documentation
```

## License

No license has been specified for this project yet. Add a license file before accepting contributions or distributing the project publicly.
