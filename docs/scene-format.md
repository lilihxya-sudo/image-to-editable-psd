# Scene format

`scene.json` deliberately describes the reconstructed design instead of storing Photoshop-specific binary data.

```json
{
  "version": "0.1",
  "source": { "fileName": "screen.png", "width": 1440, "height": 900 },
  "nodes": [
    {
      "id": "text-1",
      "type": "text",
      "text": "Sign in",
      "x": 120,
      "y": 80,
      "fontFamily": "Segoe UI",
      "fontSize": 20,
      "fill": "#111111",
      "confidence": 0.96
    },
    {
      "id": "background",
      "type": "rect",
      "x": 0,
      "y": 0,
      "width": 1440,
      "height": 900,
      "fill": "#ffffff"
    }
  ]
}
```

Node types are `text`, `rect`, `image`, and `group`. Exporters must preserve unknown node types so future analysis models can extend the format without breaking existing work.

