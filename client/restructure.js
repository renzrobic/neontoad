import fs from 'fs';
import path from 'path';

const componentsDir = path.join(process.cwd(), 'src', 'components');
const pagesDir = path.join(process.cwd(), 'src', 'pages');
const appFile = path.join(process.cwd(), 'src', 'App.jsx');

const fileMap = {
  'BoxyIcons.jsx': 'ui',
  'Navbar.jsx': 'layout',
  'Footer.jsx': 'layout',
  'MainLayout.jsx': 'layout',
  'AnimeCard.jsx': 'anime',
  'AnimeRow.jsx': 'anime',
  'SkeletonCard.jsx': 'skeletons',
  'SkeletonHero.jsx': 'skeletons',
  'SkeletonReel.jsx': 'skeletons',
  'ProtectedRoute.jsx': 'auth',
  'ReelUpload.jsx': 'reels',
  'HeroBanner.jsx': 'home'
};

// Create directories
const dirs = [...new Set(Object.values(fileMap))];
dirs.forEach(dir => {
  const dirPath = path.join(componentsDir, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Move files
for (const [file, dir] of Object.entries(fileMap)) {
  const oldPath = path.join(componentsDir, file);
  const newPath = path.join(componentsDir, dir, file);
  if (fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, newPath);
    console.log(`Moved ${file} to ${dir}`);
  }
}

// Function to update imports in a file
const updateImports = (filePath, isComponent = false) => {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;

  for (const [file, dir] of Object.entries(fileMap)) {
    const componentName = file.replace('.jsx', '');
    
    // Pattern to match imports like: import { BoxyIcon } from '../components/BoxyIcons';
    // or import Navbar from './Navbar';
    
    const importBase = isComponent ? '\\.' : '\\.\\./components';
    
    // Regex for default imports
    const defaultRegex = new RegExp(`import\\s+${componentName}\\s+from\\s+['"]${importBase}/${componentName}['"];`, 'g');
    if (defaultRegex.test(content)) {
      const newImport = isComponent ? `../${dir}/${componentName}` : `../components/${dir}/${componentName}`;
      content = content.replace(defaultRegex, `import ${componentName} from '${newImport}';`);
      changed = true;
    }

    // Regex for named imports (like BoxyIcons)
    const namedRegex = new RegExp(`import\\s+\\{([^}]+)\\}\\s+from\\s+['"]${importBase}/${componentName}['"];`, 'g');
    if (namedRegex.test(content)) {
      const newImport = isComponent ? `../${dir}/${componentName}` : `../components/${dir}/${componentName}`;
      content = content.replace(namedRegex, `import {$1} from '${newImport}';`);
      changed = true;
    }
    
    // Regex for App.jsx (special case ./components/...)
    if (filePath === appFile) {
      const appDefaultRegex = new RegExp(`import\\s+${componentName}\\s+from\\s+['"]\\./components/${componentName}['"];`, 'g');
      if (appDefaultRegex.test(content)) {
         content = content.replace(appDefaultRegex, `import ${componentName} from './components/${dir}/${componentName}';`);
         changed = true;
      }
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated imports in ${path.basename(filePath)}`);
  }
};

// Update pages
if (fs.existsSync(pagesDir)) {
  fs.readdirSync(pagesDir).forEach(file => {
    if (file.endsWith('.jsx')) {
      updateImports(path.join(pagesDir, file), false);
    }
  });
}

// Update components themselves
dirs.forEach(dir => {
  const dirPath = path.join(componentsDir, dir);
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach(file => {
      if (file.endsWith('.jsx')) {
        updateImports(path.join(dirPath, file), true);
      }
    });
  }
});

// Update App.jsx
updateImports(appFile, false);

console.log('Restructuring complete.');
