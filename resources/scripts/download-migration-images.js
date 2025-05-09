/**
 * Script to download infrastructure migration logos and update the component
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
const targetDir = path.join(__dirname, 'public/images/logos/migration');

// List of images to download
const imagesToDownload = [
  { 
    name: 'aws-migration-hub.png', 
    url: 'https://d1.awsstatic.com/icons/aws-icons/AWS-Migration-Hub_icon_64_squid.3cea7d6a3d2c3c0c0d4bfb3c6d0e3e0e.png' 
  },
  { 
    name: 'azure-migrate.png', 
    url: 'https://azure.microsoft.com/svghandler/migrate/?width=300&height=300' 
  },
  { 
    name: 'gcp-logo.svg', 
    url: 'https://www.gstatic.com/devrel-devsite/prod/v2210075187f059b839246c2c03840474501c3c6024a99fb78f6293c1b4c0f664/cloud/images/cloud-logo.svg' 
  },
  { 
    name: 'vmware-logo.svg', 
    url: 'https://www.vmware.com/content/dam/digitalmarketing/vmware/en/images/company/vmware-logo-grey.svg' 
  },
  { 
    name: 'terraform-logo.svg', 
    url: 'https://www.terraform.io/img/logo-hashicorp.svg' 
  },
  { 
    name: 'ansible-logo.png', 
    url: 'https://www.ansible.com/hubfs/2016_Images/Assets/Ansible-Mark-Large-RGB-Mango.png' 
  },
  { 
    name: 'docker-logo.png', 
    url: 'https://www.docker.com/sites/default/files/d8/2019-07/vertical-logo-monochromatic.png' 
  },
  { 
    name: 'kubernetes-logo.png', 
    url: 'https://kubernetes.io/images/favicon.png' 
  },
  { 
    name: 'cloudendure-logo.png', 
    url: 'https://d1.awsstatic.com/product-marketing/CloudEndure/CloudEndure_logo_light.3a2fddd4fb1aef9c41c14e0bd52de4ef4b9b15a7.png' 
  },
  { 
    name: 'carbonite-logo.svg', 
    url: 'https://www.carbonite.com/globalassets/images/logos/carbonite-logo-2020.svg' 
  },
  { 
    name: 'velostrata-logo.png', 
    url: 'https://velostrata.com/wp-content/themes/velostrata/images/logo.png' 
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

// Function to create a placeholder image
function createPlaceholderImage(targetPath, text) {
  // Copy the placeholder image
  const placeholderPath = path.join(__dirname, 'public/placeholder.svg');
  if (fs.existsSync(placeholderPath)) {
    fs.copyFileSync(placeholderPath, targetPath);
    console.log(`Created placeholder at ${targetPath}`);
    return Promise.resolve(targetPath);
  } else {
    // Create a simple SVG placeholder if placeholder.svg doesn't exist
    const svgContent = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#f0f0f0"/>
      <text x="50%" y="50%" font-family="Arial" font-size="16" text-anchor="middle" dominant-baseline="middle" fill="#666">${text}</text>
    </svg>`;
    
    fs.writeFileSync(targetPath, svgContent);
    console.log(`Created SVG placeholder at ${targetPath}`);
    return Promise.resolve(targetPath);
  }
}

// Function to update the component
function updateComponent() {
  const filePath = path.join(__dirname, 'resources/js/Pages/Services/InfrastructureMigration.tsx');
  
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // First, make sure the getImageUrl import is present
  if (!content.includes('import { getImageUrl }')) {
    const importStatement = 'import { getImageUrl } from "@/lib/imageUtils"\n';
    content = content.replace(/import.*from.*\n/, match => match + importStatement);
  }
  
  // Replace each image URL with the local path
  for (const image of imagesToDownload) {
    const url = image.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special characters
    const relativePath = `/images/logos/migration/${image.name}`;
    content = content.replace(
      new RegExp(`logo: ["']${url}["']`, 'g'),
      `logo: getImageUrl("${relativePath}")`
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
      try {
        await createPlaceholderImage(targetPath, image.name.split('.')[0]);
      } catch (placeholderError) {
        console.error(`Failed to create placeholder: ${placeholderError.message}`);
      }
    }
  }
  
  // Update the component
  updateComponent();
  
  console.log('Done!');
}

main().catch(console.error);
