/**
 * Script to update all local image references to use the getImageUrl function
 * This ensures that images are served from the CDN in production
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directories to process
const directories = [
  path.join(__dirname, 'resources/js/Components'),
  path.join(__dirname, 'resources/js/Pages'),
  path.join(__dirname, 'resources/js/Pages/Services'),
];

// Import statement to add
const importStatement = `import { getImageUrl } from "@/lib/imageUtils"`;
const importStatementRelative = `import { getImageUrl } from "../lib/imageUtils"`;

// Function to process a file
function processFile(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.jsx')) {
    return;
  }

  console.log(`Processing ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Check if the file already has the import
  const hasImport = content.includes('getImageUrl');
  
  // Add import if needed
  if (!hasImport) {
    // Determine which import statement to use based on file path
    const importToUse = filePath.includes('/Components/') 
      ? importStatementRelative 
      : importStatement;
    
    // Find the last import statement
    const lastImportIndex = content.lastIndexOf('import');
    if (lastImportIndex !== -1) {
      const endOfImport = content.indexOf('\n', lastImportIndex);
      if (endOfImport !== -1) {
        content = content.slice(0, endOfImport + 1) + 
                 importToUse + '\n' + 
                 content.slice(endOfImport + 1);
        modified = true;
      }
    }
  }

  // Update image references
  // Pattern 1: src="/images/...
  content = content.replace(
    /src=["']\/images\/([^"']+)["']/g, 
    'src={getImageUrl("/images/$1")}'
  );
  
  // Pattern 2: logo: "/images/...
  content = content.replace(
    /logo:\s*["']\/images\/([^"']+)["']/g, 
    'logo: getImageUrl("/images/$1")'
  );
  
  // Pattern 3: src={...} that doesn't use getImageUrl
  content = content.replace(
    /src=\{([^}]*?)(?!\{getImageUrl\()["']\/images\/([^"']+)["']\}/g,
    'src={getImageUrl("/images/$2")}'
  );

  // Save the file if modified
  if (content !== fs.readFileSync(filePath, 'utf8')) {
    fs.writeFileSync(filePath, content);
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
    } else if (stats.isDirectory()) {
      // Process subdirectories
      const subFiles = fs.readdirSync(filePath);
      subFiles.forEach(subFile => {
        const subFilePath = path.join(filePath, subFile);
        if (fs.statSync(subFilePath).isFile()) {
          const modified = processFile(subFilePath);
          if (modified) totalModified++;
        }
      });
    }
  });
});

console.log(`Updated ${totalModified} files`);
