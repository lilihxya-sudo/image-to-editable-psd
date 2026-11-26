const input = document.querySelector('#image-file');
const analyzeButton = document.querySelector('#analyze');
const status = document.querySelector('#status');
const panel = document.querySelector('#image-panel');
const preview = document.querySelector('#preview');
const fileName = document.querySelector('#file-name');
const imageSize = document.querySelector('#image-size');
const result = document.querySelector('#result');
const sceneEditor = document.querySelector('#scene');
const nodeCount = document.querySelector('#node-count');
const downloadButton = document.querySelector('#download');
let selectedFile;
let loadedImage;
let previewUrl;

function setStatus(message, isError = false) {
  status.textContent = message;
  status.classList.toggle('error', isError);
}

function readImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('The browser could not decode this image.'));
    image.src = URL.createObjectURL(file);
  });
}

function rgbFromPixel(data, x, y, width, height) {
  const offset = (Math.max(0, Math.min(y, height - 1)) * width + Math.max(0, Math.min(x, width - 1))) * 4;
  return { r: data[offset], g: data[offset + 1], b: data[offset + 2] };
}

function colorToHex(color) {
  return '#' + [color.r, color.g, color.b].map((channel) => channel.toString(16).padStart(2, '0')).join('');
}

function estimateBackground(image) {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.drawImage(image, 0, 0);
  const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const corners = [rgbFromPixel(data, 0, 0, canvas.width, canvas.height), rgbFromPixel(data, canvas.width - 1, 0, canvas.width, canvas.height), rgbFromPixel(data, 0, canvas.height - 1, canvas.width, canvas.height), rgbFromPixel(data, canvas.width - 1, canvas.height - 1, canvas.width, canvas.height)];
  return corners.reduce((total, color) => ({ r: total.r + color.r / corners.length, g: total.g + color.g / corners.length, b: total.b + color.b / corners.length }), { r: 0, g: 0, b: 0 });
}

function buildScene(image, ocr, sourceName) {
  const nodes = [{ id: 'background', type: 'rect', name: 'Background', x: 0, y: 0, width: image.naturalWidth, height: image.naturalHeight, fill: colorToHex(estimateBackground(image)), confidence: 0.5 }];
  ocr.data.words.filter((word) => word.text.trim()).forEach((word, index) => {
    const box = word.bbox;
    nodes.push({ id: `text-${index + 1}`, type: 'text', name: word.text.trim(), text: word.text.trim(), x: box.x0, y: box.y0, width: box.x1 - box.x0, height: box.y1 - box.y0, fontFamily: 'Segoe UI', fontSize: Math.max(9, box.y1 - box.y0), fill: '#111111', confidence: Number((word.confidence / 100).toFixed(2)) });
  });
  return { version: '0.1', source: { fileName: sourceName, width: image.naturalWidth, height: image.naturalHeight }, nodes, notes: ['Text nodes are OCR estimates. Update font family, color, and position before importing into Photoshop.', 'Rectangle detection and native vector-shape import are the next milestone.'] };
}

input.addEventListener('change', async () => {
  selectedFile = input.files[0];
  if (!selectedFile) return;
  try {
    loadedImage = await readImage(selectedFile);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(selectedFile);
    preview.src = previewUrl;
    fileName.textContent = selectedFile.name;
    imageSize.textContent = `${loadedImage.naturalWidth} × ${loadedImage.naturalHeight} px`;
    panel.hidden = false;
    analyzeButton.disabled = false;
    result.hidden = true;
    setStatus('Ready to analyze locally.');
  } catch (error) { setStatus(error.message, true); }
});

analyzeButton.addEventListener('click', async () => {
  if (!loadedImage || !window.Tesseract) return;
  analyzeButton.disabled = true;
  setStatus('Recognizing text. The first run can take a minute while OCR files load…');
  try {
    const worker = await Tesseract.createWorker('eng+chi_sim', 1, { logger: (event) => { if (event.status === 'recognizing text') setStatus(`Recognizing text: ${Math.round(event.progress * 100)}%`); } });
    const ocr = await worker.recognize(loadedImage);
    await worker.terminate();
    const scene = buildScene(loadedImage, ocr, selectedFile.name);
    sceneEditor.value = JSON.stringify(scene, null, 2);
    nodeCount.textContent = `${scene.nodes.length} nodes`;
    result.hidden = false;
    setStatus('Analysis complete. Review the editable scene before exporting.');
  } catch (error) { setStatus(`Analysis failed: ${error.message}`, true); }
  finally { analyzeButton.disabled = false; }
});

downloadButton.addEventListener('click', () => {
  try {
    JSON.parse(sceneEditor.value);
    const blob = new Blob([sceneEditor.value], { type: 'application/json' });
    const link = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'scene.json' });
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  } catch { setStatus('Scene JSON is not valid. Fix it before downloading.', true); }
});

