/*
 * Image to Editable PSD — native text importer
 * Run from Photoshop: File > Scripts > Browse…
 * The active document must match the scene canvas dimensions.
 */
#target photoshop
app.bringToFront();

function readText(file) {
  file.encoding = 'UTF8';
  if (!file.open('r')) throw new Error('Could not open the scene JSON.');
  var content = file.read();
  file.close();
  return content;
}

function hexToRgb(hex) {
  var safeHex = String(hex || '#111111').replace('#', '');
  var color = new SolidColor();
  color.rgb.red = parseInt(safeHex.substring(0, 2), 16);
  color.rgb.green = parseInt(safeHex.substring(2, 4), 16);
  color.rgb.blue = parseInt(safeHex.substring(4, 6), 16);
  return color;
}

function addTextLayer(node) {
  var layer = app.activeDocument.artLayers.add();
  layer.kind = LayerKind.TEXT;
  layer.name = node.name || node.text || 'Text';
  layer.textItem.contents = node.text || '';
  layer.textItem.position = [UnitValue(node.x || 0, 'px'), UnitValue((node.y || 0) + (node.fontSize || 16), 'px')];
  layer.textItem.size = UnitValue(node.fontSize || 16, 'px');
  layer.textItem.color = hexToRgb(node.fill);
  try { layer.textItem.font = node.fontFamily || 'SegoeUI'; } catch (ignore) {}
}

try {
  if (app.documents.length === 0) throw new Error('Open a Photoshop document before importing.');
  var file = File.openDialog('Choose scene.json', 'JSON:*.json');
  if (!file) throw new Error('No scene JSON was selected.');
  var scene = JSON.parse(readText(file));
  var group = app.activeDocument.layerSets.add();
  group.name = 'Recognized editable text';
  for (var index = 0; index < scene.nodes.length; index++) {
    var node = scene.nodes[index];
    if (node.type === 'text') {
      addTextLayer(node);
      app.activeDocument.activeLayer.move(group, ElementPlacement.INSIDE);
    }
  }
  alert('Imported editable text layers. Check fonts and positions before saving.');
} catch (error) {
  alert('Import failed: ' + error.message);
}

