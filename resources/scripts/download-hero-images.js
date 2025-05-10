/**
 * Script to download images used in the HeroSectionV2 component
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the target directory
const targetDir = path.join(__dirname, 'public/images/logos/tech');

// List of images to download
const imagesToDownload = [
  { 
    name: 'aws-logo.svg', 
    url: 'https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg' 
  },
  { 
    name: 'devops-logo.svg', 
    url: 'https://cdn.worldvectorlogo.com/logos/devops-2.svg' 
  },
  { 
    name: 'terraform-logo.svg', 
    url: 'https://www.vectorlogo.zone/logos/terraformio/terraformio-icon.svg' 
  },
  { 
    name: 'github-logo.svg', 
    url: 'https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg' 
  },
  { 
    name: 'kubernetes-logo.svg', 
    url: 'https://upload.wikimedia.org/wikipedia/commons/3/39/Kubernetes_logo_without_workmark.svg' 
  },
  { 
    name: 'docker-logo.png', 
    url: 'https://www.docker.com/wp-content/uploads/2022/03/vertical-logo-monochromatic.png' 
  },
  { 
    name: 'golang-logo.svg', 
    url: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Go_Logo_Blue.svg' 
  },
  { 
    name: 'jenkins-logo.svg', 
    url: 'https://upload.wikimedia.org/wikipedia/commons/e/e9/Jenkins_logo.svg' 
  }
];

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

// Function to update the HeroSectionV2 component
function updateHeroSectionV2() {
  const filePath = path.join(__dirname, 'resources/js/Components/HeroSectionV2.tsx');
  
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace each image URL with the local path
  for (const image of imagesToDownload) {
    const relativePath = `/images/logos/tech/${image.name}`;
    content = content.replace(
      new RegExp(`image: ['"]${image.url}['"]`, 'g'),
      `image: getImageUrl('${relativePath}')`
    );
  }
  
  // Save the updated content
  fs.writeFileSync(filePath, content);
  console.log(`Updated ${filePath}`);
}

// Main function
async function main() {
  // Ensure target directory exists
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  // Download each image
  for (const image of imagesToDownload) {
    const targetPath = path.join(targetDir, image.name);
    try {
      await downloadImage(image.url, targetPath);
    } catch (error) {
      console.error(`Error downloading ${image.url}: ${error.message}`);
      
      // Create a placeholder if download fails
      if (!fs.existsSync(targetPath)) {
        const placeholderPath = path.join(__dirname, 'public/placeholder.svg');
        if (fs.existsSync(placeholderPath)) {
          fs.copyFileSync(placeholderPath, targetPath);
          console.log(`Created placeholder at ${targetPath}`);
        }
      }
    }
  }
  
  // Update the component
  updateHeroSectionV2();
  
  console.log('Done!');
}

main().catch(console.error);
