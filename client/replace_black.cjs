const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

let filesModified = 0;

walkDir('./src', (filePath) => {
  if (filePath.endsWith('.jsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;

    // Replace harsh blacks with soft glass
    newContent = newContent.replace(/bg-black\/40/g, 'bg-white/5');
    newContent = newContent.replace(/bg-black\/50/g, 'bg-white/10');
    newContent = newContent.replace(/bg-black\/60/g, 'bg-white/10');
    newContent = newContent.replace(/bg-black\/80/g, 'bg-neutral-900/80');
    newContent = newContent.replace(/bg-black\/90/g, 'bg-neutral-900/90');
    newContent = newContent.replace(/bg-black\/95/g, 'bg-neutral-900/95');
    
    // Replace bare bg-black that isn't a partial match
    newContent = newContent.replace(/bg-black(?!\/|[a-zA-Z0-9\-])/g, 'bg-transparent');

    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`Updated: ${filePath}`);
      filesModified++;
    }
  }
});

console.log(`Done! Modified ${filesModified} files.`);
