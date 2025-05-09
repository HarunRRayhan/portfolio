/**
 * Script to download performance optimization tool logos and update the component
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
const targetDir = path.join(__dirname, 'public/images/logos/performance');

// List of images to download
const imagesToDownload = [
  { 
    name: 'new-relic-logo.svg', 
    url: 'https://newrelic.com/themes/custom/erno/assets/mediakit/new_relic_logo_vertical.svg' 
  },
  { 
    name: 'datadog-logo.png', 
    url: 'https://imgix.datadoghq.com/img/about/presskit/logo-v/dd_vertical_purple.png' 
  },
  { 
    name: 'prometheus-logo.svg', 
    url: 'https://raw.githubusercontent.com/cncf/artwork/master/projects/prometheus/icon/color/prometheus-icon-color.svg' 
  },
  { 
    name: 'grafana-logo.svg', 
    url: 'https://grafana.com/static/img/logos/grafana_logo_swirl_fullcolor.svg' 
  },
  { 
    name: 'jmeter-logo.svg', 
    url: 'https://jmeter.apache.org/images/logo.svg' 
  },
  { 
    name: 'gatling-logo.svg', 
    url: 'https://gatling.io/wp-content/uploads/2019/04/logo-gatling-transparent@15x.svg' 
  },
  { 
    name: 'elastic-logo.svg', 
    url: 'https://static-www.elastic.co/v3/assets/bltefdd0b53724fa2ce/blt05047fdbe3b9c333/5d0823c3d8ff351753cbc99f/logo-elastic-outlined-black.svg' 
  },
  { 
    name: 'dynatrace-logo.png', 
    url: 'https://assets.dynatrace.com/content/dam/dynatrace/misc/dynatrace_web.png' 
  },
  { 
    name: 'lighthouse-logo.svg', 
    url: 'https://developers.google.com/web/tools/lighthouse/images/lighthouse-logo.svg' 
  },
  { 
    name: 'webpagetest-logo.png', 
    url: 'https://www.webpagetest.org/images/wpt-logo.png' 
  },
  { 
    name: 'redis-logo.png', 
    url: 'https://redis.io/images/redis-white.png' 
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
  const filePath = path.join(__dirname, 'resources/js/Pages/Services/PerformanceOptimization.tsx');
  
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
    const relativePath = `/images/logos/performance/${image.name}`;
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
