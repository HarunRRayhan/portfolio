/**
 * Script to fix failed image downloads with alternative sources
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Alternative sources for common logos that failed to download
const alternativeSources = {
  // Docker logo
  'vertical-logo-monochromatic.png': 'https://www.docker.com/wp-content/uploads/2022/03/Moby-logo.png',
  
  // Kubernetes logo
  'favicon.png': 'https://kubernetes.io/images/kubernetes-192x192.png',
  
  // Terraform logo
  'logo-hashicorp.svg': 'https://www.datocms-assets.com/2885/1620155116-brandhcterraformverticalcolor.svg',
  
  // Elastic logo
  'logo-elastic-outlined-black.svg': 'https://static-www.elastic.co/v3/assets/bltefdd0b53724fa2ce/blt8781708f8f37ed16/5c11ec2edf09df047814db23/logo-elastic-search-color-64.svg',
  
  // Grafana logo
  'grafana_logo_swirl_fullcolor.svg': 'https://grafana.com/static/assets/img/grafana_icon.svg',
  
  // Nagios logo
  'Nagios-Logo.jpg': 'https://www.nagios.com/wp-content/uploads/2015/05/Nagios-Logo.jpg',
  
  // Zipkin logo
  'zipkin-logo-200x119.jpg': 'https://zipkin.io/public/img/logo_png/zipkin_vertical_grey_gb.png',
  
  // AWS CloudWatch logo
  'AWS-CloudWatch_icon_64_Squid.4c65a3d318a1e2c52a77f4f60b336430c9d7294a.png': 'https://d1.awsstatic.com/product-marketing/CloudWatch/product-page-diagram_Cloudwatch_v4.2d92fe6a0a87d3d98f7e1362b5d8a9a8c71a89a9.png',
  
  // AWS CodePipeline logo
  'console_codepipeline_icon.0c5de384dc60b71dae9d780b0c572d5deb9e3f0a.png': 'https://d1.awsstatic.com/products/codepipeline/Product-Page-Diagram_AWS-CodePipeline.4a1bea38d3c8d3b2d6a4f1d3c5e15b1d197e7a08.png',
  
  // CircleCI logo
  'circleci-logo-stacked-fb-657e221fda1646a7e652c09c9fbfb2b0feb5d710089bb4d8e8c759d37a832694.png': 'https://d3r49iyjzglexf.cloudfront.net/logo-wordmark-black-7fec8eb518c6e0ab226d9db3ec57f6e995c9abea7daab7f9885d7dfa97e9169e.svg'
};

// Function to download an image
function downloadImage(url, targetPath) {
  return new Promise((resolve, reject) => {
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

// Main function
async function main() {
  // Check each directory for missing images
  const baseDir = path.join(__dirname, 'public/images/logos');
  const categories = ['tech', 'cloud', 'db', ''];
  
  for (const category of categories) {
    const dirPath = path.join(baseDir, category);
    if (!fs.existsSync(dirPath)) continue;
    
    const files = fs.readdirSync(dirPath);
    
    // Process each file in alternativeSources
    for (const [filename, alternativeUrl] of Object.entries(alternativeSources)) {
      const targetPath = path.join(dirPath, filename);
      
      // Skip if file already exists
      if (fs.existsSync(targetPath)) continue;
      
      try {
        // Try to download from alternative source
        await downloadImage(alternativeUrl, targetPath);
        console.log(`Successfully downloaded alternative for ${filename}`);
      } catch (error) {
        console.error(`Failed to download alternative for ${filename}: ${error.message}`);
        
        // Create placeholder as fallback
        try {
          await createPlaceholderImage(targetPath, filename.split('.')[0]);
        } catch (placeholderError) {
          console.error(`Failed to create placeholder: ${placeholderError.message}`);
        }
      }
    }
  }
  
  // Update code references to use getImageUrl for all image references
  const filesToProcess = [
    'resources/js/Pages/Services/DatabaseOptimization.tsx',
    'resources/js/Pages/Services/InfrastructureAsCode.tsx',
    'resources/js/Pages/Services/MLOps.tsx',
    'resources/js/Pages/Services/ServerlessInfrastructure.tsx',
    'resources/js/Pages/Services/DevOps.tsx',
    'resources/js/Pages/Services/AutomatedDeployment.tsx',
    'resources/js/Pages/Services/MonitoringObservability.tsx'
  ];
  
  for (const file of filesToProcess) {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) continue;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Replace any remaining direct URLs with getImageUrl
    const regex = /logo:\s*["'](https?:\/\/[^"']+)["']/g;
    const newContent = content.replace(regex, (match, url) => {
      modified = true;
      const filename = path.basename(new URL(url).pathname);
      return `logo: getImageUrl("/images/logos/tech/${filename}")`;
    });
    
    if (modified) {
      fs.writeFileSync(filePath, newContent);
      console.log(`Updated remaining URLs in ${filePath}`);
    }
  }
  
  console.log('Done fixing failed images!');
}

main().catch(console.error);
