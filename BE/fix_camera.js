const fs = require('fs');
let content = fs.readFileSync('src/modules/camera/index.ts', 'utf8');

// Replace create logic 1
content = content.replace(/imageUrl: null, \/\/ Image data not stored in DB \(kept in memory only\)\n\s*detections: JSON\.stringify\(detectedObjects\), \/\/ Store as JSON string\n\s*confidence: aiResponse\.data\.confidence \|\| 0,\n\s*processingTime: aiResponse\.data\.processingTime \|\| 0,\n\s*status: 'COMPLETED',/g, 
  "label: detectedObjects.length ? detectedObjects[0].label : 'unknown',\n          confidence: aiResponse.data.confidence || 0,\n          bbox: JSON.stringify(detectedObjects.length ? detectedObjects[0].bbox : []),\n          source: 'webcam',\n          status: 'COMPLETED',");

// Replace create logic 2
content = content.replace(/imageUrl: null,\n\s*detections: JSON\.stringify\(\{ error: aiError\.message \}\),\n\s*confidence: 0,\n\s*processingTime: 0,\n\s*status: 'FAILED',/g,
  "label: 'error',\n            confidence: 0,\n            bbox: '[]',\n            source: 'webcam',\n            status: 'FAILED',");

// Replace select logic
content = content.replace(/detections: true,\n\s*confidence: true,\n\s*processingTime: true,/g,
  "label: true,\n        confidence: true,\n        bbox: true,");

// Replace formatted logic
content = content.replace(/detections: JSON\.parse\(d\.detections\),/g,
  "detections: [{ label: d.label, confidence: d.confidence, bbox: JSON.parse(d.bbox || '[]') }],");

// Replace get by ID logic
content = content.replace(/detections: JSON\.parse\(detection\.detections\),/g,
  "detections: [{ label: detection.label, confidence: detection.confidence, bbox: JSON.parse(detection.bbox || '[]') }],");

fs.writeFileSync('src/modules/camera/index.ts', content);

let lpContent = fs.readFileSync('src/modules/learning-path/controller.ts', 'utf8');
lpContent = lpContent.replace(/req\.user!/g, '(req as any).user!');
fs.writeFileSync('src/modules/learning-path/controller.ts', lpContent);
console.log("Fixed camera index & learning-path controller.");
