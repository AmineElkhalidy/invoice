// Run with: node scripts/generateSignatureBase64.js
const fs = require("fs");
const path = require("path");

const signaturePath = path.join(__dirname, "../assets/signature.png");
const outputPath = path.join(__dirname, "../lib/signatureBase64.ts");

const b64 = fs.readFileSync(signaturePath).toString("base64");
const content = [
  "// Auto-generated from assets/signature.png — do not edit manually.",
  '// Regenerate with: node scripts/generateSignatureBase64.js',
  "// eslint-disable-next-line",
  'export const SIGNATURE_BASE64 = "data:image/png;base64,' + b64 + '";',
  "",
].join("\n");

fs.writeFileSync(outputPath, content, "utf8");
console.log("signatureBase64.ts written. Base64 length:", b64.length);
