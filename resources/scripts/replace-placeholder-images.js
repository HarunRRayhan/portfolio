/**
 * Script to replace placeholder images with better alternatives
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

// Better alternative sources for logos that failed to download previously
const betterAlternatives = {
  // Docker logo
  'vertical-logo-monochromatic.png': {
    url: 'https://www.docker.com/wp-content/uploads/2022/03/vertical-logo-monochromatic.png',
    targetPath: '/public/images/logos/tech/vertical-logo-monochromatic.png'
  },
  
  // Kubernetes logo
  'favicon.png': {
    url: 'https://kubernetes.io/images/favicon.png',
    targetPath: '/public/images/logos/tech/favicon.png'
  },
  
  // Terraform logo
  'logo-hashicorp.svg': {
    url: 'https://www.terraform.io/img/logo-hashicorp.svg',
    targetPath: '/public/images/logos/tech/logo-hashicorp.svg'
  },
  
  // Elastic logo
  'logo-elastic-outlined-black.svg': {
    url: 'https://static-www.elastic.co/v3/assets/bltefdd0b53724fa2ce/blt4466841eed0bf232/5d082a5e97f2babb5af907ee/logo-elastic-outlined-black.svg',
    targetPath: '/public/images/logos/logo-elastic-outlined-black.svg'
  },
  
  // Grafana logo
  'grafana_logo_swirl_fullcolor.svg': {
    url: 'https://grafana.com/static/img/grafana_logo_swirl_fullcolor.svg',
    targetPath: '/public/images/logos/grafana_logo_swirl_fullcolor.svg'
  },
  
  // Nagios logo
  'Nagios-Logo.jpg': {
    url: 'https://assets.nagios.com/images/Nagios-Logo.jpg',
    targetPath: '/public/images/logos/Nagios-Logo.jpg'
  },
  
  // Zipkin logo
  'zipkin-logo-200x119.jpg': {
    url: 'https://zipkin.io/public/img/zipkin-logo-200x119.jpg',
    targetPath: '/public/images/logos/zipkin-logo-200x119.jpg'
  },
  
  // AWS CloudWatch logo
  'AWS-CloudWatch_icon_64_Squid.4c65a3d318a1e2c52a77f4f60b336430c9d7294a.png': {
    url: 'https://d1.awsstatic.com/icons/AWS-CloudWatch_icon_64_Squid.4c65a3d318a1e2c52a77f4f60b336430c9d7294a.png',
    targetPath: '/public/images/logos/AWS-CloudWatch_icon_64_Squid.4c65a3d318a1e2c52a77f4f60b336430c9d7294a.png'
  },
  
  // AWS CodePipeline logo
  'console_codepipeline_icon.0c5de384dc60b71dae9d780b0c572d5deb9e3f0a.png': {
    url: 'https://d1.awsstatic.com/icons/console_codepipeline_icon.0c5de384dc60b71dae9d780b0c572d5deb9e3f0a.png',
    targetPath: '/public/images/logos/console_codepipeline_icon.0c5de384dc60b71dae9d780b0c572d5deb9e3f0a.png'
  },
  
  // CircleCI logo
  'circleci-logo-stacked-fb-657e221fda1646a7e652c09c9fbfb2b0feb5d710089bb4d8e8c759d37a832694.png': {
    url: 'https://d3r49iyjzglexf.cloudfront.net/circleci-logo-stacked-fb-657e221fda1646a7e652c09c9fbfb2b0feb5d710089bb4d8e8c759d37a832694.png',
    targetPath: '/public/images/logos/circleci-logo-stacked-fb-657e221fda1646a7e652c09c9fbfb2b0feb5d710089bb4d8e8c759d37a832694.png'
  }
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

// Function to create a better placeholder image if download fails
function createBetterPlaceholder(targetPath, logoName) {
  console.log(`Creating better placeholder for ${logoName} at ${targetPath}`);
  
  // Create a more visually appealing SVG placeholder
  const svgContent = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="200" fill="#f8f9fa"/>
    <rect x="10" y="10" width="180" height="180" fill="#e9ecef" rx="10" ry="10"/>
    <text x="50%" y="45%" font-family="Arial, sans-serif" font-size="24" font-weight="bold" text-anchor="middle" fill="#495057">${logoName}</text>
    <text x="50%" y="60%" font-family="Arial, sans-serif" font-size="14" text-anchor="middle" fill="#6c757d">Logo Placeholder</text>
  </svg>`;
  
  fs.writeFileSync(targetPath, svgContent);
  console.log(`Created better SVG placeholder at ${targetPath}`);
  return Promise.resolve(targetPath);
}

// Function to update component references if needed
function updateComponentReferences() {
  const componentsToUpdate = [
    'resources/js/Pages/Services/DatabaseOptimization.tsx',
    'resources/js/Pages/Services/DevOps.tsx',
    'resources/js/Pages/Services/AutomatedDeployment.tsx',
    'resources/js/Pages/Services/MonitoringObservability.tsx'
  ];
  
  for (const componentPath of componentsToUpdate) {
    const fullPath = path.join(rootDir, componentPath);
    if (!fs.existsSync(fullPath)) {
      console.log(`Component file not found: ${fullPath}`);
      continue;
    }
    
    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;
    
    // Check if any paths need to be updated
    for (const [filename, details] of Object.entries(betterAlternatives)) {
      const targetPath = details.targetPath.replace('/public', '');
      const oldPath = `/images/logos/tech/${filename}`;
      
      // Only update if the path has changed
      if (targetPath !== oldPath && content.includes(oldPath)) {
        content = content.replace(new RegExp(oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), targetPath);
        modified = true;
        console.log(`Updated path in ${componentPath}: ${oldPath} -> ${targetPath}`);
      }
    }
    
    if (modified) {
      fs.writeFileSync(fullPath, content);
      console.log(`Updated component: ${componentPath}`);
    }
  }
}

// Main function
async function main() {
  console.log('Starting to replace placeholder images with better alternatives...');
  
  // Process each logo in betterAlternatives
  for (const [filename, details] of Object.entries(betterAlternatives)) {
    const { url, targetPath } = details;
    const fullTargetPath = path.join(rootDir, targetPath);
    
    // Create directory if it doesn't exist
    const targetDir = path.dirname(fullTargetPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
      console.log(`Created directory: ${targetDir}`);
    }
    
    // Check if file is a placeholder (small file size)
    let isPlaceholder = false;
    if (fs.existsSync(fullTargetPath)) {
      const stats = fs.statSync(fullTargetPath);
      isPlaceholder = stats.size < 1000; // Assume files smaller than 1KB are placeholders
      
      if (!isPlaceholder) {
        console.log(`Skipping ${filename} as it's not a placeholder`);
        continue;
      }
    }
    
    try {
      // Try to download the image
      await downloadImage(url, fullTargetPath);
      console.log(`Successfully downloaded ${filename}`);
    } catch (error) {
      console.error(`Failed to download ${filename}: ${error.message}`);
      
      // Create a better placeholder as fallback
      try {
        const logoName = filename.split('.')[0].replace(/-/g, ' ').replace(/_/g, ' ');
        await createBetterPlaceholder(fullTargetPath, logoName);
      } catch (placeholderError) {
        console.error(`Failed to create placeholder: ${placeholderError.message}`);
      }
    }
  }
  
  // Update component references if needed
  updateComponentReferences();
  
  console.log('Done replacing placeholder images!');
}

main().catch(console.error);
