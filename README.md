# Pixelroom

Pixelroom is a browser-based image editor for removing unwanted objects and details from photos. It runs image editing locally in the browser, so images do not need to be uploaded to an application server.

## Features

- Drag-and-drop or file-picker image upload
- Local object and watermark removal with a non-AI quick-fill method
- Optional ONNX inpainting through ONNX Runtime Web
- Brush selection and eraser tools
- Crop and rotate
- Zoom controls
- Undo brush strokes
- Multi-step undo for crop, rotate, and removal actions
- Hold-to-compare with the original image
- PNG and JPEG export
- Optional metadata removal
- Export preview before downloading
- Separate object removal, metadata cleanup, and image resize sections
- Pixel-dimension resize with optional aspect-ratio locking
- Responsive desktop and mobile layout

## How It Works

1. Open Pixelroom and select or drop an image.
2. Choose **Remove object or watermark**, **Remove image metadata**, or **Resize image**.
3. In the removal section, use the Brush tool to mark the object or area to remove. The red overlay is only a temporary selection.
4. Choose a removal method:
   - **Quick fill** works locally and is best for simple or repeating backgrounds.
   - **AI fill** can produce better results on complex objects, logos, and detailed backgrounds after a compatible ONNX inpainting model is loaded.
5. Select **Remove selection**.
6. Review the result with **Hold to compare** or **Undo last action**.
7. Select a format and click **Download**. The metadata section provides a dedicated clean-export action.
8. Review the export preview, then select **Download image**.

Only edit images that you own or have permission to modify.

## Privacy and Metadata

Pixelroom does not send images to a Pixelroom server. Image decoding, masking, removal, and export happen in the browser.

The **Remove metadata** option is optional:

- When enabled, Pixelroom removes embedded metadata from the export.
- When disabled, original JPEG EXIF metadata is preserved where technically possible.
- PNG exports do not preserve camera EXIF metadata through the browser canvas export path.

The AI model is also processed in the browser. If a model is loaded, it may be cached locally by the browser for later use.

## Run Locally

Pixelroom is a static web app. A local HTTP server is recommended for testing:

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

## AI Fill Setup

AI fill is optional. To use it:

1. Open the **AI model** tab.
2. Choose a compatible `.onnx` image-inpainting model file, or provide a direct model URL.
3. Wait for the model to load.
4. Select **AI fill** from the removal method menu.

The browser adapter detects common NCHW and NHWC RGB layouts, fixed or dynamic spatial sizes, and an optional single-channel mask input. It preserves the selected region's aspect ratio and composites the result back at the original pixel dimensions. Models with different preprocessing, multiple extra inputs, or non-RGB outputs still need a model-specific adapter. Large downloads can take time and may be blocked by cross-origin restrictions; loading a local model file is the most reliable option.

## Project Structure

```text
index.html   Main editor interface
script.js    Image editing, inpainting, history, export, and metadata logic
styles.css   Layout, responsive styles, and editor appearance
favicon.svg  Pixelroom star app icon
site.webmanifest  Installable web-app configuration
README.md    Project documentation
```

## License

No license has been specified for this project yet. Add a license file before accepting contributions or distributing the project publicly.
