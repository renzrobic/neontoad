const fs = require('fs');
const path = require('path');

function updatePadding(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  // Update standard container padding to match new premium layout
  content = content.replace(/px-4 md:px-16/g, 'px-6 md:px-16');
  
  // Make sure to remove any duplicate rounded classes from skeletons that might have been missed
  if (filePath.includes('skeletons')) {
     content = content.replace(/rounded-xl(\s+rounded-xl)+/g, 'rounded-xl');
     content = content.replace(/rounded-full(\s+rounded-full)+/g, 'rounded-full');
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
  }
}

function processDir(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory() && file !== 'node_modules' && file !== '.git') {
      processDir(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      updatePadding(fullPath);
    }
  });
}

processDir('./src');
console.log('Padding updated.');
