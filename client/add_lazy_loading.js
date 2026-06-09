import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir(path.join(__dirname, 'src'), function(filePath) {
  if (filePath.endsWith('.jsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    // regex to find `<img ... >` or `<img ... />` without `loading=` attribute
    let updated = content.replace(/<img(?![^>]*loading=)([^>]*)>/g, '<img loading="lazy"$1>');
    if (content !== updated) {
      fs.writeFileSync(filePath, updated);
      console.log('Updated ' + filePath);
    }
  }
});
