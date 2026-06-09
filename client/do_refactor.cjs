
const fs = require("fs");
const path = require("path");

const SRC_DIR = path.join(__dirname, "src");

const mappings = [
  { regex: /text-white\/[1-4]0\b/g, replacement: "text-white/70" },
  { regex: /text-white\/[5-7]0\b/g, replacement: "text-white/80" },
  { regex: /text-white\/[8-9]0\b/g, replacement: "text-white/90" },
  
  { regex: /bg-white\/5\b/g, replacement: "bg-neutral-900" },
  { regex: /bg-white\/10\b/g, replacement: "bg-neutral-800" },
  { regex: /bg-white\/[2-3]0\b/g, replacement: "bg-neutral-700" },

  { regex: /border-white\/5\b/g, replacement: "border-white/30" },
  { regex: /border-white\/10\b/g, replacement: "border-white/30" },
  { regex: /border-white\/[2-3]0\b/g, replacement: "border-white/50" }
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, "utf-8");
  let originalContent = content;

  for (const mapping of mappings) {
    content = content.replace(mapping.regex, mapping.replacement);
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, "utf-8");
    console.log(`Updated ${filePath}`);
  }
}

function traverseDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      traverseDir(fullPath);
    } else if (fullPath.endsWith(".jsx")) {
      processFile(fullPath);
    }
  }
}

traverseDir(SRC_DIR);
console.log("Refactoring complete.");

