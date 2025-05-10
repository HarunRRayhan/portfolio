/**
 * Script to download AWS service logos and update the AWSCloud component
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
const targetDir = path.join(__dirname, 'public/images/logos/aws');

// List of images to download
const imagesToDownload = [
  { 
    name: 'ec2-icon.png', 
    url: 'https://d1.awsstatic.com/icons/jp/console_ec2_icon.64795d08c5e23e92c12fe08c2dd5bd99255af047.png' 
  },
  { 
    name: 's3-icon.png', 
    url: 'https://d1.awsstatic.com/icons/jp/console_s3_icon.3230f0d3f9b7d9d0ed0c40aa9f2c9a73d2f75f58.png' 
  },
  { 
    name: 'rds-icon.png', 
    url: 'https://d1.awsstatic.com/icons/jp/console_rds_icon.a2ca6f2d69b4a1a5ebea4e7af26e7efe7d37d8c3.png' 
  },
  { 
    name: 'lambda-icon.png', 
    url: 'https://d1.awsstatic.com/icons/jp/console_lambda_icon.c2f9445286e6d03cb6e6c22d51d2f0a472f3b53c.png' 
  },
  { 
    name: 'vpc-icon.png', 
    url: 'https://d1.awsstatic.com/icons/jp/console_vpc_icon.d7d5a1df5d71901a3b1a36ce01b5b8c6e1d1e4df.png' 
  },
  { 
    name: 'cloudfront-icon.png', 
    url: 'https://d1.awsstatic.com/icons/jp/console_cloudfront_icon.0d4509692ecd6adb0e4e8b4a4c26e1e0c57f8b52.png' 
  },
  { 
    name: 'iam-icon.png', 
    url: 'https://d1.awsstatic.com/icons/jp/console_iam_icon.0ae0e0a6340dec68d2e4be79a7e9458d3d1c2c58.png' 
  },
  { 
    name: 'ecs-icon.png', 
    url: 'https://d1.awsstatic.com/icons/jp/ecs-ec2.5a2c0a9d10e01d70a1b0b2f0c7f7d1d9d9b9e9e9.png' 
  },
  { 
    name: 'eks-icon.png', 
    url: 'https://d1.awsstatic.com/icons/jp/eks-ec2.5a2c0a9d10e01d70a1b0b2f0c7f7d1d9d9b9e9e9.png' 
  },
  { 
    name: 'cloudformation-icon.png', 
    url: 'https://d1.awsstatic.com/icons/jp/console_cloudformation_icon.0d4509692ecd6adb0e4e8b4a4c26e1e0c57f8b52.png' 
  },
  { 
    name: 'cloudwatch-icon.png', 
    url: 'https://d1.awsstatic.com/icons/jp/console_cloudwatch_icon.0d4509692ecd6adb0e4e8b4a4c26e1e0c57f8b52.png' 
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
  const filePath = path.join(__dirname, 'resources/js/Pages/Services/AWSCloud.tsx');
  
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
    const relativePath = `/images/logos/aws/${image.name}`;
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
