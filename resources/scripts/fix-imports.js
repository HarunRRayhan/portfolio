/**
 * Script to fix incorrect imageUtils imports that were added to UI components
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directories to process
const directories = [
  path.join(__dirname, 'resources/js/Components/ui'),
];

// Function to process a file
function processFile(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.jsx')) {
    return;
  }

  console.log(`Processing ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Remove incorrect import statements
  const importRegex = /import\s*{\s*getImageUrl\s*}\s*from\s*["']\.\.\/lib\/imageUtils["'];?\n?/g;
  const newContent = content.replace(importRegex, '');
  
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent);
    console.log(`Updated ${filePath}`);
    modified = true;
  }

  return modified;
}

// Process all files in the directories
let totalModified = 0;
directories.forEach(dir => {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isFile()) {
      const modified = processFile(filePath);
      if (modified) totalModified++;
    }
  });
});

// Also fix Privacy.tsx and Welcome.tsx that have getImageUrl references
const pagesToFix = [
  path.join(__dirname, 'resources/js/Pages/Privacy.tsx'),
  path.join(__dirname, 'resources/js/Pages/Welcome.tsx')
];

pagesToFix.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    console.log(`Processing ${filePath}`);
    
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Add import if needed
    if (content.includes('getImageUrl(') && !content.includes('import { getImageUrl }')) {
      const importStatement = 'import { getImageUrl } from "@/lib/imageUtils"\n';
      
      // Find the last import statement
      const lastImportIndex = content.lastIndexOf('import');
      if (lastImportIndex !== -1) {
        const endOfImport = content.indexOf('\n', lastImportIndex);
        if (endOfImport !== -1) {
          content = content.slice(0, endOfImport + 1) + 
                   importStatement + 
                   content.slice(endOfImport + 1);
          modified = true;
        }
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`Updated ${filePath}`);
      totalModified++;
    }
  }
});

console.log(`Updated ${totalModified} files`);
