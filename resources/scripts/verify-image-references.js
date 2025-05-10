/**
 * Script to verify all image references in the codebase
 * This checks that all images referenced with getImageUrl() actually exist
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import glob from 'glob';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

// Function to extract image paths from components
function extractImagePaths(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const regex = /getImageUrl\(["']([^"']+)["']\)/g;
  const imagePaths = [];
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    imagePaths.push(match[1]);
  }
  
  return imagePaths;
}

// Function to check if an image exists
function imageExists(imagePath) {
  // Remove leading slash if present
  const normalizedPath = imagePath.startsWith('/') 
    ? imagePath.substring(1) 
    : imagePath;
  
  const fullPath = path.join(rootDir, 'public', normalizedPath);
  return fs.existsSync(fullPath);
}

// Main function
async function main() {
  console.log('Verifying image references in the codebase...');
  
  // Find all TypeScript/JavaScript files in the resources/js directory
  const files = glob.sync('resources/js/**/*.{js,jsx,ts,tsx}', { cwd: rootDir });
  
  let totalReferences = 0;
  let missingImages = [];
  
  // Process each file
  for (const file of files) {
    const filePath = path.join(rootDir, file);
    const imagePaths = extractImagePaths(filePath);
    
    if (imagePaths.length === 0) continue;
    
    totalReferences += imagePaths.length;
    console.log(`Found ${imagePaths.length} image references in ${file}`);
    
    // Check each image path
    for (const imagePath of imagePaths) {
      if (!imageExists(imagePath)) {
        missingImages.push({ file, imagePath });
        console.error(`❌ Missing image: ${imagePath} referenced in ${file}`);
      } else {
        console.log(`✅ Image exists: ${imagePath}`);
      }
    }
  }
  
  // Summary
  console.log('\n--- Summary ---');
  console.log(`Total image references found: ${totalReferences}`);
  console.log(`Missing images: ${missingImages.length}`);
  
  if (missingImages.length > 0) {
    console.log('\nMissing images:');
    missingImages.forEach(({ file, imagePath }) => {
      console.log(`- ${imagePath} (referenced in ${file})`);
    });
  } else {
    console.log('\nAll image references are valid! 🎉');
  }
}

main().catch(console.error);
