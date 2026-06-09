const fs = require("fs");
const path = require("path");

const SRC_DIR = path.join(__dirname, "src");

const mappings = [
  { regex: /(?<![\w-])border(?![\w-])/g, replacement: "" },
  { regex: /(?<![\w-])border-t(?![\w-])/g, replacement: "" },
  { regex: /(?<![\w-])border-b(?![\w-])/g, replacement: "" },
  { regex: /(?<![\w-])border-l(?![\w-])/g, replacement: "" },
  { regex: /(?<![\w-])border-r(?![\w-])/g, replacement: "" },
  { regex: /(?<![\w-])border-white\/\d+(?![\w-])/g, replacement: "" },
  { regex: /(?<![\w-])hover:border-white\/\d+(?![\w-])/g, replacement: "" },
  { regex: /(?<![\w-])focus:border-white\/\d+(?![\w-])/g, replacement: "" },
  { regex: /(?<![\w-])focus-within:border-white\/\d+(?![\w-])/g, replacement: "" },
  { regex: /(?<![\w-])hover:border(?![\w-])/g, replacement: "" },
  { regex: /(?<![\w-])border-dashed(?![\w-])/g, replacement: "" }
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, "utf-8");
  let originalContent = content;

  for (const mapping of mappings) {
    content = content.replace(mapping.regex, "");
  }
  
  // Cleanup multiple spaces
  content = content.replace(/  +/g, " ");
  // Cleanup spaces inside className quotes
  content = content.replace(/className="\s+/g, `className="`);
  content = content.replace(/\s+"/g, `"`);

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
console.log("Border removal complete.");
