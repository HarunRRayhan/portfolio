/**
 * Script to download external images and update references in the code
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define image categories and their target directories
const categories = {
  tech: path.join(__dirname, 'public/images/logos/tech'),
  cloud: path.join(__dirname, 'public/images/logos/cloud'),
  db: path.join(__dirname, 'public/images/logos/db'),
  default: path.join(__dirname, 'public/images/logos')
};

// List of files to process
const filesToProcess = [
  'resources/js/Pages/Services/DatabaseOptimization.tsx',
  'resources/js/Pages/Services/InfrastructureAsCode.tsx',
  'resources/js/Pages/Services/MLOps.tsx',
  'resources/js/Pages/Services/ServerlessInfrastructure.tsx',
  'resources/js/Pages/Services/DevOps.tsx',
  'resources/js/Pages/Services/AutomatedDeployment.tsx',
  'resources/js/Pages/Services/MonitoringObservability.tsx'
];

// Function to determine the category of an image based on its URL
function determineCategory(url) {
  const lowerUrl = url.toLowerCase();
  
  if (lowerUrl.includes('aws') || lowerUrl.includes('azure') || lowerUrl.includes('cloud') || 
      lowerUrl.includes('netlify') || lowerUrl.includes('vercel')) {
    return 'cloud';
  } else if (lowerUrl.includes('mysql') || lowerUrl.includes('postgres') || 
             lowerUrl.includes('mongo') || lowerUrl.includes('oracle') || 
             lowerUrl.includes('sql-server') || lowerUrl.includes('redis') || 
             lowerUrl.includes('elastic') || lowerUrl.includes('cassandra')) {
    return 'db';
  } else {
    return 'tech';
  }
}

// Function to sanitize a filename
function sanitizeFilename(url) {
  // Extract the filename from the URL
  const urlObj = new URL(url);
  let filename = path.basename(urlObj.pathname);
  
  // Remove query parameters if present
  if (filename.includes('?')) {
    filename = filename.split('?')[0];
  }
  
  // Replace special characters
  filename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  // Add extension if missing
  if (!path.extname(filename)) {
    // Default to png if no extension
    filename += '.png';
  }
  
  return filename;
}

// Function to download an image
function downloadImage(url, targetPath) {
  return new Promise((resolve, reject) => {
    // Skip if already downloaded
    if (fs.existsSync(targetPath)) {
      console.log(`File already exists: ${targetPath}`);
      resolve(targetPath);
      return;
    }
    
    console.log(`Downloading ${url} to ${targetPath}`);
    
    const protocol = url.startsWith('https') ? https : http;
    
    const request = protocol.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        console.log(`Redirecting to: ${redirectUrl}`);
        downloadImage(redirectUrl, targetPath).then(resolve).catch(reject);
        return;
      }
      
      // Check if the response is successful
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
        return;
      }
      
      // Create write stream
      const fileStream = fs.createWriteStream(targetPath);
      response.pipe(fileStream);
      
      fileStream.on('finish', () => {
        fileStream.close();
        resolve(targetPath);
      });
      
      fileStream.on('error', (err) => {
        fs.unlink(targetPath, () => {}); // Delete the file if there's an error
        reject(err);
      });
    });
    
    request.on('error', (err) => {
      reject(err);
    });
  });
}

// Function to process a file
async function processFile(filePath) {
  console.log(`Processing ${filePath}`);
  
  const content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;
  let modified = false;
  
  // Regular expression to match image URLs in the code
  const regex = /logo:\s*["']((https?:\/\/[^"']+))["']/g;
  const matches = [...content.matchAll(regex)];
  
  for (const match of matches) {
    const [fullMatch, url] = match;
    
    try {
      // Skip URLs that are already using getImageUrl
      if (fullMatch.includes('getImageUrl')) {
        continue;
      }
      
      // Determine category and target directory
      const category = determineCategory(url);
      const targetDir = categories[category] || categories.default;
      
      // Create sanitized filename
      const filename = sanitizeFilename(url);
      const targetPath = path.join(targetDir, filename);
      
      // Download the image
      await downloadImage(url, targetPath);
      
      // Create the relative path for the code
      const relativePath = `/images/logos/${category}/${filename}`;
      
      // Replace the URL in the code
      const replacement = `logo: getImageUrl("${relativePath}")`;
      newContent = newContent.replace(fullMatch, replacement);
      modified = true;
      
      console.log(`Replaced ${url} with ${relativePath}`);
    } catch (error) {
      console.error(`Error processing ${url}: ${error.message}`);
    }
  }
  
  // Save the modified content
  if (modified) {
    fs.writeFileSync(filePath, newContent);
    console.log(`Updated ${filePath}`);
  }
}

// Main function
async function main() {
  // Ensure target directories exist
  Object.values(categories).forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
  
  // Process each file
  for (const file of filesToProcess) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      await processFile(filePath);
    } else {
      console.warn(`File not found: ${filePath}`);
    }
  }
  
  console.log('Done!');
}

main().catch(console.error);
