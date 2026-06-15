const fs = require("fs");
const path = require("path");

const SRC_DIR = path.join(__dirname, "src");

const mappings = [
  // 1. Thin out fonts
  { regex: /(?<![\w-])font-black(?![\w-])/g, replacement: "font-bold" },
  { regex: /(?<![\w-])font-bold(?![\w-])/g, replacement: "font-medium" },
  // 2. Fix dim colors to solid colors
  { regex: /(?<![\w-])text-white\/[1-5]0(?![\w-])/g, replacement: "text-netflixGray" },
  { regex: /(?<![\w-])text-white\/[6-7]0(?![\w-])/g, replacement: "text-netflixLight" },
  { regex: /(?<![\w-])text-white\/[8-9]0(?![\w-])/g, replacement: "text-white" },
  // 3. Remove weird tracking/spacing
  { regex: /(?<![\w-])tracking-tighter(?![\w-])/g, replacement: "" },
  { regex: /(?<![\w-])tracking-tight(?![\w-])/g, replacement: "" },
  { regex: /(?<![\w-])tracking-widest(?![\w-])/g, replacement: "" }
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, "utf-8");
  let originalContent = content;

  for (const mapping of mappings) {
    content = content.replace(mapping.regex, mapping.replacement);
  }

  // Cleanup multiple spaces from removed classes
  content = content.replace(/  +/g, " ");
  content = content.replace(/className="\s+/g, `className="`);
  content = content.replace(/\s+"/g, `"`);

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, "utf-8");
    console.log(`Updated: ${path.relative(__dirname, filePath)}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith(".jsx")) {
      processFile(fullPath);
    }
  }
}

walkDir(SRC_DIR);
console.log("Typography fix complete.");
