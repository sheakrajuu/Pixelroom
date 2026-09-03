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

## How It Works

1. Open Pixelroomedit and select or drop an image.
2. Choose **Remove object or watermark**, **Remove image metadata**, or **Resize image**.
3. In the removal section, use the Brush tool to mark the object or area to remove. The red overlay is only a temporary selection.
4. Select **Remove selection**. Quick fill works locally and is best for simple or repeating backgrounds.
5. Review the result with **Hold to compare** or **Undo last action**.
6. Select a format and click **Download**. The metadata section provides a dedicated clean-export action.
7. Review the export preview, choose PNG, JPG, or WebP plus resolution and quality, then select **Download image**.

Only edit images that you own or have permission to modify.

## Privacy and Metadata

Pixelroomedit does not send images to a Pixelroomedit server. Image decoding, masking, removal, and export happen in the browser.

The **Remove metadata** option is optional:

- When enabled, Pixelroomedit removes embedded metadata from the export.
- When disabled, original JPEG EXIF metadata is preserved where technically possible.
- PNG exports do not preserve camera EXIF metadata through the browser canvas export path.

The AI model is also processed in the browser. If a model is loaded, it may be cached locally by the browser for later use.

## Run Locally

Pixelroomedit is a static web app. A local HTTP server is recommended for testing:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000/index.html
```

You can also open `index.html` directly in a browser, although some browser features and external resources work more reliably over HTTP.

## Deploy

Upload these files to any static hosting service such as GitHub Pages, Netlify, or Cloudflare Pages:

- `index.html`
- `script.js`
- `styles.css`

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
