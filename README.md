# Pixelroomedit

Pixelroomedit is a private, browser-based image editor. Images stay on the device while you edit and export them.

## Features

### Image editing

- Upload an image by browsing, dragging, or replacing the current image.
- Crop, rotate left, rotate right, zoom, pan, and compare changes.
- Remove simple objects or watermarks with the quick-fill tool.
- Use the eraser to refine a removal mask.
- Save, reuse, clear, and undo mask strokes.

### Filters and adjustments

The Filters tab includes 16 presets:

- Original
- Vivid
- Warm
- Cool
- Vintage
- Noir
- Faded
- Dramatic
- Clarendon
- Juno
- Lark
- Valencia
- Nashville
- Moon
- Sepia
- Mono

The Edit tab includes live controls for brightness, contrast, saturation, warmth, highlights, shadows, fade, and vignette. Adjustments are non-destructive until export, and Reset edits returns to the original look.

### Automatic text and watermark detection

Choose **Auto-detect text** to scan the image with local OCR. Recognized text regions are added to the existing removal mask. Review the red mask, erase any incorrect areas, and then choose **Remove selection**.

The detector identifies readable text, but it cannot know whether text is a watermark, caption, sign, or important content. Always review the mask before removing it. The OCR library is loaded from the Tesseract.js CDN the first time it is used.

### PNG branding

- Upload a transparent PNG logo.
- Drag it to any position on the image.
- Change its size and opacity.
- Keep the same position when replacing the base image.
- Save the logo, size, opacity, and normalized position in the local editing session.
- Include the logo in PNG, JPEG, and WebP exports.

### Export and other sections

- Preview the final image before downloading.
- Export PNG, JPEG, or WebP.
- Choose original or custom output resolution.
- Set JPEG and WebP quality.
- Clean EXIF metadata from JPEG exports, including camera, date, and GPS information.
- Resize images to custom dimensions for social posts, portrait images, Stories, or other platforms.
- View file name, size, MIME type, original dimensions, aspect ratio, megapixels, transparency, modified time, and available EXIF camera, exposure, lens, color, white-balance, scene, and GPS data.
- Run optional ONNX-based AI editing when a compatible local model is loaded. The AI editor is currently marked as coming soon in the main interface.

### Related app

The homepage includes a small **Try ClipGrab** promotion linking directly to [clipgrab-mtcp.onrender.com](https://clipgrab-mtcp.onrender.com).

### Information pages

- `about.html` contains only the About information.
- `terms.html` contains only the Terms and responsible-use information.
- `privacy.html` contains only the Privacy and local-processing information.

## How to use

1. Open `index.html` in a modern browser.
2. Select an image.
3. Choose the editing section.
4. Apply filters or Edit adjustments.
5. Paint a removal mask or choose Auto-detect text.
6. Review the mask and choose Remove selection.
7. Add and position a PNG logo if needed.
8. Choose Download, review the export, and save the result.

## Running locally

This is a static browser application. Opening `index.html` directly is enough for the core editor. A local web server is recommended when browser security rules affect CDN scripts or file access.

For example, with Python installed:

```text
python -m http.server 8000
```

Then open `http://localhost:8000/`.

## Privacy and network requirements

- Image pixels are processed in the browser.
- Images are not sent to an application server.
- The app may request external CDN assets for ONNX Runtime Web and Tesseract.js.
- Auto text detection needs an internet connection the first time the OCR library and language data are loaded.
- A saved editing session uses IndexedDB in the current browser profile.
- Export metadata behavior applies to JPEG exports when the metadata option is enabled.

## Project files

- `index.html` - page structure, editor controls, sections, and external script references.
- `script.js` - image loading, canvas editing, filters, adjustments, OCR detection, branding, metadata, and export logic.
- `styles.css` - responsive layout, editor styling, mobile behavior, and hidden scrollbar rules.
- `site.webmanifest` - installable web app metadata.

## Current limitations

- OCR selects readable text candidates; it does not semantically classify every region as a watermark.
- Quick fill works best on simple or textured backgrounds.
- AI editing requires a compatible ONNX model and is not enabled in the default visible workflow.
- Batch processing and multiple simultaneous branding layers are not currently implemented.
