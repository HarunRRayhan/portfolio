/**
 * Script to create custom SVG logos for missing images
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

// Define custom SVG logos for each missing image
const missingLogos = {
  // MySQL logo
  '/images/logos/tech/logo-mysql-170x115.png': {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <style>
        .st0{fill:#00758F;}
        .st1{fill:#F29111;}
      </style>
      <path class="st0" d="M40,100c0,5.5,0.4,10.5,1.2,15c0.8,4.5,2,8.4,3.6,11.7c1.6,3.3,3.5,6,5.7,8.1c2.2,2.1,4.7,3.7,7.5,4.8
        c2.8,1.1,5.8,1.9,9.1,2.3c3.3,0.4,6.7,0.6,10.4,0.6h2.5c3.7,0,7.1-0.2,10.4-0.6c3.3-0.4,6.3-1.2,9.1-2.3c2.8-1.1,5.3-2.7,7.5-4.8
        c2.2-2.1,4.1-4.8,5.7-8.1c1.6-3.3,2.8-7.2,3.6-11.7c0.8-4.5,1.2-9.5,1.2-15c0-5.5-0.4-10.5-1.2-15c-0.8-4.5-2-8.4-3.6-11.7
        c-1.6-3.3-3.5-6-5.7-8.1c-2.2-2.1-4.7-3.7-7.5-4.8c-2.8-1.1-5.8-1.9-9.1-2.3c-3.3-0.4-6.7-0.6-10.4-0.6h-2.5
        c-3.7,0-7.1,0.2-10.4,0.6c-3.3,0.4-6.3,1.2-9.1,2.3c-2.8,1.1-5.3,2.7-7.5,4.8c-2.2,2.1-4.1,4.8-5.7,8.1c-1.6,3.3-2.8,7.2-3.6,11.7
        C40.4,89.5,40,94.5,40,100z"/>
      <path class="st1" d="M160,100c0,5.5-0.4,10.5-1.2,15c-0.8,4.5-2,8.4-3.6,11.7c-1.6,3.3-3.5,6-5.7,8.1c-2.2,2.1-4.7,3.7-7.5,4.8
        c-2.8,1.1-5.8,1.9-9.1,2.3c-3.3,0.4-6.7,0.6-10.4,0.6h-2.5c-3.7,0-7.1-0.2-10.4-0.6c-3.3-0.4-6.3-1.2-9.1-2.3
        c-2.8-1.1-5.3-2.7-7.5-4.8c-2.2-2.1-4.1-4.8-5.7-8.1c-1.6-3.3-2.8-7.2-3.6-11.7c-0.8-4.5-1.2-9.5-1.2-15c0-5.5,0.4-10.5,1.2-15
        c0.8-4.5,2-8.4,3.6-11.7c1.6-3.3,3.5-6,5.7-8.1c2.2-2.1,4.7-3.7,7.5-4.8c2.8-1.1,5.8-1.9,9.1-2.3c3.3-0.4,6.7-0.6,10.4-0.6h2.5
        c3.7,0,7.1,0.2,10.4,0.6c3.3,0.4,6.3,1.2,9.1,2.3c2.8,1.1,5.3,2.7,7.5,4.8c2.2,2.1,4.1,4.8,5.7,8.1c1.6,3.3,2.8,7.2,3.6,11.7
        C159.6,89.5,160,94.5,160,100z"/>
      <path class="st0" d="M100,60v80"/>
      <path class="st0" d="M60,100h80"/>
    </svg>`,
    targetPath: '/public/images/logos/tech/logo-mysql-170x115.png'
  },
  
  // Oracle logo
  '/images/logos/tech/rh03-oracle-logo.png': {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <style>
        .st0{fill:#FF0000;}
      </style>
      <rect x="40" y="70" class="st0" width="120" height="60" rx="10" ry="10"/>
      <text x="100" y="110" font-family="Arial, sans-serif" font-size="30" font-weight="bold" text-anchor="middle" fill="#FFFFFF">ORACLE</text>
    </svg>`,
    targetPath: '/public/images/logos/tech/rh03-oracle-logo.png'
  },
  
  // Redis logo
  '/images/logos/tech/redis-white.png': {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <style>
        .st0{fill:#A41E11;}
        .st1{fill:#FFFFFF;}
      </style>
      <rect x="20" y="20" class="st0" width="160" height="160" rx="15" ry="15"/>
      <path class="st1" d="M100,50l-40,20v60l40,20l40-20V70L100,50z M100,70l20,10l-20,10l-20-10L100,70z M70,100l20,10l-20,10V100z
        M100,130l-20-10l20-10l20,10L100,130z M130,120l-20-10V90l20,10V120z"/>
    </svg>`,
    targetPath: '/public/images/logos/tech/redis-white.png'
  },
  
  // Cassandra logo
  '/images/logos/tech/cassandra_logo.svg': {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <style>
        .st0{fill:#1287B1;}
        .st1{fill:#FFFFFF;}
      </style>
      <circle cx="100" cy="100" r="80" class="st0"/>
      <path class="st1" d="M100,50c-5.5,0-10,4.5-10,10s4.5,10,10,10s10-4.5,10-10S105.5,50,100,50z"/>
      <path class="st1" d="M70,80c-5.5,0-10,4.5-10,10s4.5,10,10,10s10-4.5,10-10S75.5,80,70,80z"/>
      <path class="st1" d="M130,80c-5.5,0-10,4.5-10,10s4.5,10,10,10s10-4.5,10-10S135.5,80,130,80z"/>
      <path class="st1" d="M70,120c-5.5,0-10,4.5-10,10s4.5,10,10,10s10-4.5,10-10S75.5,120,70,120z"/>
      <path class="st1" d="M130,120c-5.5,0-10,4.5-10,10s4.5,10,10,10s10-4.5,10-10S135.5,120,130,120z"/>
      <path class="st1" d="M100,130c-5.5,0-10,4.5-10,10s4.5,10,10,10s10-4.5,10-10S105.5,130,100,130z"/>
      <path class="st1" d="M100,70l-30,20 M100,70l30,20 M70,100v30 M130,100v30 M80,140h40"/>
    </svg>`,
    targetPath: '/public/images/logos/tech/cassandra_logo.svg'
  },
  
  // HP Schema logo
  '/images/logos/tech/hp_schema%402x.b509be7f0e26575880dbd3f100d2d9fc3585ef14.png': {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <style>
        .st0{fill:#0096D6;}
        .st1{fill:#FFFFFF;}
      </style>
      <rect x="30" y="30" class="st0" width="140" height="140" rx="10" ry="10"/>
      <text x="100" y="100" font-family="Arial, sans-serif" font-size="40" font-weight="bold" text-anchor="middle" fill="#FFFFFF">HP</text>
      <text x="100" y="130" font-family="Arial, sans-serif" font-size="20" font-weight="normal" text-anchor="middle" fill="#FFFFFF">Schema</text>
    </svg>`,
    targetPath: '/public/images/logos/tech/hp_schema%402x.b509be7f0e26575880dbd3f100d2d9fc3585ef14.png'
  },
  
  // Cloud logo
  '/images/logos/tech/cloud-logo.svg': {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <style>
        .st0{fill:#4285F4;}
        .st1{fill:#FFFFFF;}
      </style>
      <path class="st0" d="M160,110c0-5.5-4.5-10-10-10h-10c0-22.1-17.9-40-40-40c-18.8,0-34.5,12.9-38.9,30.4C50.2,93.8,42,104.1,42,116
        c0,13.8,11.2,25,25,25h73c11,0,20-9,20-20C160,118.9,160,111.1,160,110z"/>
      <path class="st1" d="M140,110h-10V90c0-16.6-13.4-30-30-30c-14.1,0-25.9,9.7-29.2,22.8C63.2,85.9,57,94.5,57,104c0,9.9,8.1,18,18,18h65
        c5.5,0,10-4.5,10-10S145.5,110,140,110z"/>
    </svg>`,
    targetPath: '/public/images/logos/tech/cloud-logo.svg'
  },
  
  // Puppet logo
  '/images/logos/tech/Puppet_transparent_logo.svg': {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <style>
        .st0{fill:#FFAE1A;}
        .st1{fill:#FFFFFF;}
      </style>
      <circle cx="100" cy="100" r="80" class="st0"/>
      <circle cx="70" cy="80" r="15" class="st1"/>
      <circle cx="130" cy="80" r="15" class="st1"/>
      <path class="st1" d="M140,120c0,22.1-17.9,40-40,40s-40-17.9-40-40H140z"/>
    </svg>`,
    targetPath: '/public/images/logos/tech/Puppet_transparent_logo.svg'
  },
  
  // PyTorch logo
  '/images/logos/tech/pytorch-logo.png': {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <style>
        .st0{fill:#EE4C2C;}
      </style>
      <path class="st0" d="M140,60c0,5.5-4.5,10-10,10s-10-4.5-10-10s4.5-10,10-10S140,54.5,140,60z"/>
      <path class="st0" d="M100,40v80c0,22.1-17.9,40-40,40s-40-17.9-40-40s17.9-40,40-40c5.5,0,10.8,1.1,15.6,3.1L100,40z M60,100
        c-11,0-20,9-20,20s9,20,20,20s20-9,20-20S71,100,60,100z"/>
    </svg>`,
    targetPath: '/public/images/logos/tech/pytorch-logo.png'
  },
  
  // Scikit-learn logo
  '/images/logos/tech/logo.svg': {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <style>
        .st0{fill:#F89939;}
        .st1{fill:#3499CD;}
      </style>
      <path class="st0" d="M100,20c-44.1,0-80,35.9-80,80s35.9,80,80,80s80-35.9,80-80S144.1,20,100,20z M100,160
        c-33.1,0-60-26.9-60-60s26.9-60,60-60s60,26.9,60,60S133.1,160,100,160z"/>
      <path class="st1" d="M100,40c-33.1,0-60,26.9-60,60s26.9,60,60,60s60-26.9,60-60S133.1,40,100,40z M100,140
        c-22.1,0-40-17.9-40-40s17.9-40,40-40s40,17.9,40,40S122.1,140,100,140z"/>
      <path class="st0" d="M100,60c-22.1,0-40,17.9-40,40s17.9,40,40,40s40-17.9,40-40S122.1,60,100,60z M100,120
        c-11,0-20-9-20-20s9-20,20-20s20,9,20,20S111,120,100,120z"/>
      <circle class="st1" cx="100" cy="100" r="20"/>
    </svg>`,
    targetPath: '/public/images/logos/tech/logo.svg'
  },
  
  // MLflow logo
  '/images/logos/tech/MLflow-logo-final-black.png': {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <style>
        .st0{fill:#0194E2;}
        .st1{fill:#FF6C37;}
      </style>
      <path class="st0" d="M40,60v80h40V60H40z M60,120c-5.5,0-10-4.5-10-10s4.5-10,10-10s10,4.5,10,10S65.5,120,60,120z"/>
      <path class="st1" d="M90,60v80h40l30-40l-30-40H90z M110,120c-5.5,0-10-4.5-10-10s4.5-10,10-10s10,4.5,10,10S115.5,120,110,120z"/>
    </svg>`,
    targetPath: '/public/images/logos/tech/MLflow-logo-final-black.png'
  },
  
  // Pinterest logo
  '/images/logos/tech/pin_large.png': {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <style>
        .st0{fill:#E60023;}
        .st1{fill:#FFFFFF;}
      </style>
      <circle cx="100" cy="100" r="80" class="st0"/>
      <path class="st1" d="M100,50c-27.6,0-50,22.4-50,50c0,20.7,12.6,38.5,30.6,46c-0.4-3.8-0.8-9.7,0.2-13.9c0.9-3.8,5.7-24.2,5.7-24.2
        s-1.5-2.9-1.5-7.3c0-6.8,4-11.9,8.9-11.9c4.2,0,6.2,3.1,6.2,6.9c0,4.2-2.7,10.5-4.1,16.3c-1.2,4.9,2.4,8.9,7.3,8.9
        c8.7,0,15.3-9.2,15.3-22.5c0-11.8-8.4-20-20.5-20c-14,0-22.2,10.5-22.2,21.3c0,4.2,1.6,8.7,3.6,11.2c0.4,0.5,0.5,0.9,0.3,1.4
        c-0.4,1.5-1.2,4.7-1.3,5.4c-0.2,0.9-0.7,1.1-1.6,0.7c-6-2.8-9.8-11.6-9.8-18.7c0-15.1,11-28.9,31.6-28.9c16.6,0,29.5,11.9,29.5,27.7
        c0,16.5-10.4,29.8-24.8,29.8c-4.8,0-9.4-2.5-10.9-5.5c0,0-2.4,9.1-3,11.3c-1.1,4.2-4,9.5-6,12.7c4.5,1.4,9.3,2.2,14.3,2.2
        c27.6,0,50-22.4,50-50C150,72.4,127.6,50,100,50z"/>
    </svg>`,
    targetPath: '/public/images/logos/tech/pin_large.png'
  },
  
  // CUDA logo
  '/images/logos/tech/cuda_logo_white.jpg': {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <style>
        .st0{fill:#76B900;}
        .st1{fill:#FFFFFF;}
      </style>
      <rect x="20" y="20" width="160" height="160" fill="#000000"/>
      <path class="st0" d="M40,80v40h20V80H40z"/>
      <path class="st0" d="M70,60v80h20V60H70z"/>
      <path class="st0" d="M100,70v60h20V70H100z"/>
      <path class="st1" d="M130,80l30,20l-30,20V80z"/>
    </svg>`,
    targetPath: '/public/images/logos/tech/cuda_logo_white.jpg'
  },
  
  // AWS SageMaker logo
  '/images/logos/tech/SageMaker_Amazon.6e2760a8a5f7e5f3a8b7e9f9b6d2f7e7e5f3a8b7e9f9b6d2f7e7.png': {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <style>
        .st0{fill:#FF9900;}
        .st1{fill:#FFFFFF;}
      </style>
      <rect x="20" y="20" class="st0" width="160" height="160" rx="15" ry="15"/>
      <path class="st1" d="M60,60v80h80V60H60z M120,120H80V80h40V120z"/>
      <circle class="st1" cx="70" cy="70" r="10"/>
      <circle class="st1" cx="130" cy="70" r="10"/>
      <circle class="st1" cx="70" cy="130" r="10"/>
      <circle class="st1" cx="130" cy="130" r="10"/>
    </svg>`,
    targetPath: '/public/images/logos/tech/SageMaker_Amazon.6e2760a8a5f7e5f3a8b7e9f9b6d2f7e7e5f3a8b7e9f9b6d2f7e7.png'
  },
  
  // Google Cloud Functions logo
  '/images/logos/tech/google-cloud-functions-logo-AECD57BFA2-seeklogo.com.png': {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <style>
        .st0{fill:#4285F4;}
        .st1{fill:#FFFFFF;}
      </style>
      <rect x="20" y="20" class="st0" width="160" height="160" rx="15" ry="15"/>
      <path class="st1" d="M60,60l80,80 M140,60L60,140"/>
      <circle class="st1" cx="60" cy="60" r="15"/>
      <circle class="st1" cx="140" cy="60" r="15"/>
      <circle class="st1" cx="60" cy="140" r="15"/>
      <circle class="st1" cx="140" cy="140" r="15"/>
    </svg>`,
    targetPath: '/public/images/logos/tech/google-cloud-functions-logo-AECD57BFA2-seeklogo.com.png'
  },
  
  // AWS EventBridge logo
  '/images/logos/tech/AWS_EventBridge_logo.svg': {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <style>
        .st0{fill:#FF9900;}
        .st1{fill:#FFFFFF;}
      </style>
      <rect x="20" y="20" class="st0" width="160" height="160" rx="15" ry="15"/>
      <path class="st1" d="M40,100h120 M100,40v120"/>
      <circle class="st1" cx="100" cy="100" r="30" fill="none" stroke="#FFFFFF" stroke-width="10"/>
      <circle class="st1" cx="100" cy="100" r="10"/>
      <circle class="st1" cx="40" cy="100" r="10"/>
      <circle class="st1" cx="160" cy="100" r="10"/>
      <circle class="st1" cx="100" cy="40" r="10"/>
      <circle class="st1" cx="100" cy="160" r="10"/>
    </svg>`,
    targetPath: '/public/images/logos/tech/AWS_EventBridge_logo.svg'
  }
};

// Function to save SVG content to file
function saveSvgToFile(svgContent, targetPath) {
  const fullTargetPath = path.join(rootDir, targetPath);
  
  // Create directory if it doesn't exist
  const targetDir = path.dirname(fullTargetPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    console.log(`Created directory: ${targetDir}`);
  }
  
  // Write SVG content to file
  fs.writeFileSync(fullTargetPath, svgContent);
  console.log(`Created custom SVG logo at ${targetPath}`);
  
  return fullTargetPath;
}

// Main function
async function main() {
  console.log('Creating custom SVG logos for missing images...');
  
  // Process each logo in missingLogos
  for (const [imagePath, details] of Object.entries(missingLogos)) {
    const { svg, targetPath } = details;
    
    try {
      // Save the SVG content to file
      saveSvgToFile(svg, targetPath);
      console.log(`Successfully created custom logo for ${imagePath}`);
    } catch (error) {
      console.error(`Failed to create custom logo for ${imagePath}: ${error.message}`);
    }
  }
  
  console.log('Done creating custom SVG logos for missing images!');
}

main().catch(console.error);
