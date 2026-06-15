const fs = require('fs');
const path = require('path');

function cleanFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remove duplicate rounded-xl
  content = content.replace(/rounded-xl(\s+rounded-xl)+/g, 'rounded-xl');
  content = content.replace(/rounded-full(\s+rounded-full)+/g, 'rounded-full');
  
  // Remove rounded-xl if rounded-full is present
  content = content.replace(/rounded-full\s+([a-zA-Z0-9\-\/]+\s+)*rounded-xl/g, (match) => {
    return match.replace(' rounded-xl', '');
  });
  content = content.replace(/rounded-xl\s+([a-zA-Z0-9\-\/]+\s+)*rounded-full/g, (match) => {
    return match.replace('rounded-xl ', '');
  });

  // Remove backdrop-blur-md if backdrop-blur-3xl is present
  content = content.replace(/backdrop-blur-md\s+([a-zA-Z0-9\-\/]+\s+)*backdrop-blur-3xl/g, (match) => {
    return match.replace('backdrop-blur-md ', '');
  });
  content = content.replace(/backdrop-blur-3xl\s+([a-zA-Z0-9\-\/]+\s+)*backdrop-blur-md/g, (match) => {
    return match.replace(' backdrop-blur-md', '');
  });
  
  fs.writeFileSync(filePath, content);
}

function processDir(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      cleanFile(fullPath);
    }
  });
}

processDir('./src/components/skeletons');
console.log('Skeletons cleaned.');
