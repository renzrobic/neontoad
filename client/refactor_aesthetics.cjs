const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    if (fs.statSync(dirPath).isDirectory()) {
      walkDir(dirPath, callback);
    } else {
      callback(dirPath);
    }
  });
}

let modifiedCount = 0;

walkDir('./src', (filePath) => {
  if (filePath.endsWith('.jsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    // 1. Add rounded-xl to buttons that don't have any rounded class
    content = content.replace(/<button\s+([^>]*?)className=(["'`])(.*?)(["'`])/g, (match, before, quote1, classes, quote2) => {
      if (!classes.includes('rounded-')) {
        return `<button ${before}className=${quote1}${classes} rounded-xl${quote2}`;
      }
      return match;
    });

    // 2. Add rounded-xl to inputs, selects, textareas
    content = content.replace(/<(input|select|textarea)\s+([^>]*?)className=(["'`])(.*?)(["'`])/g, (match, tag, before, quote1, classes, quote2) => {
      if (!classes.includes('rounded-')) {
        return `<${tag} ${before}className=${quote1}${classes} rounded-xl${quote2}`;
      }
      return match;
    });

    // 3. Make sure inputs have a nice glass background if they are flat
    content = content.replace(/<(input|select|textarea)\s+([^>]*?)className=(["'`])(.*?)(["'`])/g, (match, tag, before, quote1, classes, quote2) => {
      let newClasses = classes;
      if (!newClasses.includes('bg-')) {
        newClasses += ' bg-white/5 backdrop-blur-md border border-white/10';
      }
      return `<${tag} ${before}className=${quote1}${newClasses}${quote2}`;
    });

    // 4. Update 'rounded-none' or 'rounded-sm' to 'rounded-xl'
    content = content.replace(/\brounded-none\b/g, 'rounded-xl');
    content = content.replace(/\brounded-sm\b/g, 'rounded-xl');

    // 5. Replace border-2 border-transparent with ring-2 ring-transparent
    content = content.replace(/\bborder-2 border-transparent\b/g, 'ring-2 ring-transparent ring-offset-2 ring-offset-background');
    content = content.replace(/\bgroup-hover:border-white\b/g, 'group-hover:ring-white/80');

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated: ${filePath}`);
      modifiedCount++;
    }
  }
});

console.log(`Done! Modified ${modifiedCount} files explicitly.`);
