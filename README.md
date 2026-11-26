# Image to Editable PSD

An open-source reconstruction tool that turns a flattened UI screenshot into an editable Photoshop document.

This is not a one-layer image converter. The analysis pipeline treats a screenshot as evidence for a new design file: OCR becomes text layers, UI rectangles become shape nodes, and complex artwork remains isolated raster content.

## MVP

- Local browser image analysis
- OCR with Tesseract.js
- Editable `scene.json` intermediate format
- Photoshop JSX importer for native text layers
- A roadmap for rectangle detection, font ranking, and native vector shape layers

## Architecture

`Screenshot → OCR + layout analysis → scene.json → Photoshop importer / PSD exporter`

## Run locally

```bash
git clone https://github.com/lilihxya-sudo/image-to-editable-psd.git
cd image-to-editable-psd
npx serve web
```

The selected image is processed locally in the browser. OCR and layout recognition are estimates, so users can revise scene JSON before it is imported.

## Open-source scope

The project aims to reconstruct editable text, simple UI shapes, groups, and layout. It does not claim to restore original vector paths or exact fonts from a single bitmap.

## License

MIT.
