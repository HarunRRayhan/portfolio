/**
 * Script to create custom SVG logos for services that failed to download
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

// Define custom SVG logos for each service
const customLogos = {
  // Docker logo
  'vertical-logo-monochromatic.png': {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <style>
        .st0{fill:#2496ED;}
        .st1{fill:#FFFFFF;}
      </style>
      <path class="st0" d="M180,64.7c-5.4-3.7-17.8-5.1-27.4-3.2c-1.2-9.5-8.5-17.7-17.4-22.5l-3.5-1.9l-2.4,3.3
        c-4.7,6.5-6.2,17.5-5.6,25.8c0.3,3.5,1.5,9.7,5.1,15.1c-3.6,2-10.9,4.6-20.4,4.6H20c-2.7,0-4.9,2.2-4.9,4.9
        c-0.3,9.7,1.4,19.4,5,28.4c3.9,9.3,9.7,16.4,16.7,20.7c8.2,5.1,21.6,8,36.5,8c33.7,0,58.5-15.9,70.2-44.6
        c8.1,0.4,25.5,0,34.3-17.3c0.2-0.5,1.3-2.7,1.9-3.5l-0.4-0.7C182.1,79.5,185.4,68.4,180,64.7z"/>
      <path class="st1" d="M46.9,68.9h19.2v19.2H46.9V68.9z M49.9,71.9h3.2v3.2h-3.2V71.9z M49.9,78.3h3.2v3.2h-3.2V78.3z M49.9,84.7h3.2
        v3.2h-3.2V84.7z M56.3,71.9h3.2v3.2h-3.2V71.9z M56.3,78.3h3.2v3.2h-3.2V78.3z M56.3,84.7h3.2v3.2h-3.2V84.7z M62.7,71.9h3.2v3.2
        h-3.2V71.9z M62.7,78.3h3.2v3.2h-3.2V78.3z M62.7,84.7h3.2v3.2h-3.2V84.7z"/>
      <path class="st1" d="M70.1,68.9h19.2v19.2H70.1V68.9z M73.1,71.9h3.2v3.2h-3.2V71.9z M73.1,78.3h3.2v3.2h-3.2V78.3z M73.1,84.7h3.2
        v3.2h-3.2V84.7z M79.5,71.9h3.2v3.2h-3.2V71.9z M79.5,78.3h3.2v3.2h-3.2V78.3z M79.5,84.7h3.2v3.2h-3.2V84.7z M85.9,71.9h3.2v3.2
        h-3.2V71.9z M85.9,78.3h3.2v3.2h-3.2V78.3z M85.9,84.7h3.2v3.2h-3.2V84.7z"/>
      <path class="st1" d="M93.3,68.9h19.2v19.2H93.3V68.9z M96.3,71.9h3.2v3.2h-3.2V71.9z M96.3,78.3h3.2v3.2h-3.2V78.3z M96.3,84.7h3.2
        v3.2h-3.2V84.7z M102.7,71.9h3.2v3.2h-3.2V71.9z M102.7,78.3h3.2v3.2h-3.2V78.3z M102.7,84.7h3.2v3.2h-3.2V84.7z M109.1,71.9h3.2
        v3.2h-3.2V71.9z M109.1,78.3h3.2v3.2h-3.2V78.3z M109.1,84.7h3.2v3.2h-3.2V84.7z"/>
      <path class="st1" d="M93.3,45.7h19.2v19.2H93.3V45.7z M96.3,48.7h3.2v3.2h-3.2V48.7z M96.3,55.1h3.2v3.2h-3.2V55.1z M96.3,61.5h3.2
        v3.2h-3.2V61.5z M102.7,48.7h3.2v3.2h-3.2V48.7z M102.7,55.1h3.2v3.2h-3.2V55.1z M102.7,61.5h3.2v3.2h-3.2V61.5z M109.1,48.7h3.2
        v3.2h-3.2V48.7z M109.1,55.1h3.2v3.2h-3.2V55.1z M109.1,61.5h3.2v3.2h-3.2V61.5z"/>
      <path class="st1" d="M70.1,45.7h19.2v19.2H70.1V45.7z M73.1,48.7h3.2v3.2h-3.2V48.7z M73.1,55.1h3.2v3.2h-3.2V55.1z M73.1,61.5h3.2
        v3.2h-3.2V61.5z M79.5,48.7h3.2v3.2h-3.2V48.7z M79.5,55.1h3.2v3.2h-3.2V55.1z M79.5,61.5h3.2v3.2h-3.2V61.5z M85.9,48.7h3.2v3.2
        h-3.2V48.7z M85.9,55.1h3.2v3.2h-3.2V55.1z M85.9,61.5h3.2v3.2h-3.2V61.5z"/>
    </svg>`,
    targetPath: '/public/images/logos/tech/vertical-logo-monochromatic.png'
  },
  
  // Elastic logo
  'logo-elastic-outlined-black.svg': {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <style>
        .st0{fill:#FEC514;}
        .st1{fill:#00BFB3;}
        .st2{fill:#F04E98;}
        .st3{fill:#1BA9F5;}
        .st4{fill:#93C90E;}
      </style>
      <path class="st0" d="M100,20c44.1,0,80,35.9,80,80s-35.9,80-80,80s-80-35.9-80-80S55.9,20,100,20 M100,10C50.3,10,10,50.3,10,100
        s40.3,90,90,90s90-40.3,90-90S149.7,10,100,10L100,10z"/>
      <path class="st1" d="M48,100c0-4.4,3.6-8,8-8h88c4.4,0,8,3.6,8,8s-3.6,8-8,8H56C51.6,108,48,104.4,48,100z"/>
      <path class="st2" d="M48,68c0-4.4,3.6-8,8-8h88c4.4,0,8,3.6,8,8s-3.6,8-8,8H56C51.6,76,48,72.4,48,68z"/>
      <path class="st3" d="M48,132c0-4.4,3.6-8,8-8h88c4.4,0,8,3.6,8,8s-3.6,8-8,8H56C51.6,140,48,136.4,48,132z"/>
    </svg>`,
    targetPath: '/public/images/logos/logo-elastic-outlined-black.svg'
  },
  
  // Grafana logo
  'grafana_logo_swirl_fullcolor.svg': {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <style>
        .st0{fill:#F05A28;}
        .st1{fill:#F05A28;}
      </style>
      <path class="st0" d="M100,20c44.1,0,80,35.9,80,80s-35.9,80-80,80s-80-35.9-80-80S55.9,20,100,20 M100,10C50.3,10,10,50.3,10,100
        s40.3,90,90,90s90-40.3,90-90S149.7,10,100,10L100,10z"/>
      <path class="st1" d="M125.9,65.4c-3.4,0-6.1,2.7-6.1,6.1c0,3.4,2.7,6.1,6.1,6.1c3.4,0,6.1-2.7,6.1-6.1
        C132,68.1,129.3,65.4,125.9,65.4z M82.5,133.6c0,0,5.3,6.5,13.3,6.5c8,0,14-5.2,14-15.6c0-10.2-7.1-15.6-14-15.6
        c-6.9,0-13.3,6.5-13.3,6.5V133.6z M82.5,99.7c0,0,5.3-6.5,13.3-6.5c7.9,0,14,5.4,14,15.6c0,10.4-6,15.6-14,15.6
        c-8,0-13.3-6.5-13.3-6.5V99.7z M82.5,88.7V65.4h-9.2v73.2h9.2v-6.5c0,0,5.7,7.8,16.3,7.8c11.3,0,22.1-8.7,22.1-26.2
        c0-17.3-10.8-26.2-22.1-26.2C88.2,87.5,82.5,88.7,82.5,88.7z"/>
    </svg>`,
    targetPath: '/public/images/logos/grafana_logo_swirl_fullcolor.svg'
  },
  
  // Nagios logo
  'Nagios-Logo.jpg': {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <style>
        .st0{fill:#222222;}
        .st1{fill:#ED1B2F;}
      </style>
      <rect x="20" y="50" class="st0" width="160" height="100" rx="10" ry="10"/>
      <path class="st1" d="M40,90l20,30h20l-20-30l20-30H60L40,90z"/>
      <path class="st1" d="M85,60h15v60H85V60z"/>
      <path class="st1" d="M110,60h15l20,30l-20,30h-15l20-30L110,60z"/>
      <path class="st1" d="M155,60h15v60h-15V60z"/>
    </svg>`,
    targetPath: '/public/images/logos/Nagios-Logo.jpg'
  },
  
  // AWS CloudWatch logo
  'AWS-CloudWatch_icon_64_Squid.4c65a3d318a1e2c52a77f4f60b336430c9d7294a.png': {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <style>
        .st0{fill:#FF9900;}
        .st1{fill:#FFFFFF;}
      </style>
      <rect x="20" y="20" class="st0" width="160" height="160" rx="15" ry="15"/>
      <circle class="st1" cx="100" cy="100" r="60" fill="none" stroke="#FFFFFF" stroke-width="8"/>
      <line x1="100" y1="60" x2="100" y2="105" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round"/>
      <line x1="100" y1="100" x2="130" y2="130" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round"/>
    </svg>`,
    targetPath: '/public/images/logos/AWS-CloudWatch_icon_64_Squid.4c65a3d318a1e2c52a77f4f60b336430c9d7294a.png'
  },
  
  // AWS CodePipeline logo
  'console_codepipeline_icon.0c5de384dc60b71dae9d780b0c572d5deb9e3f0a.png': {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <style>
        .st0{fill:#232F3E;}
        .st1{fill:#FF9900;}
      </style>
      <rect x="20" y="20" class="st0" width="160" height="160" rx="15" ry="15"/>
      <circle class="st1" cx="50" cy="100" r="20"/>
      <circle class="st1" cx="150" cy="100" r="20"/>
      <circle class="st1" cx="100" cy="100" r="20"/>
      <line x1="70" y1="100" x2="80" y2="100" stroke="#FF9900" stroke-width="6"/>
      <line x1="120" y1="100" x2="130" y2="100" stroke="#FF9900" stroke-width="6"/>
    </svg>`,
    targetPath: '/public/images/logos/console_codepipeline_icon.0c5de384dc60b71dae9d780b0c572d5deb9e3f0a.png'
  },
  
  // CircleCI logo
  'circleci-logo-stacked-fb-657e221fda1646a7e652c09c9fbfb2b0feb5d710089bb4d8e8c759d37a832694.png': {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <style>
        .st0{fill:#343434;}
        .st1{fill:#FFFFFF;}
      </style>
      <rect x="20" y="20" class="st0" width="160" height="160" rx="15" ry="15"/>
      <circle class="st1" cx="100" cy="100" r="50" fill="none" stroke="#FFFFFF" stroke-width="10"/>
      <circle class="st1" cx="100" cy="100" r="25" fill="#FFFFFF"/>
      <rect x="60" y="140" width="80" height="20" rx="5" ry="5" fill="#FFFFFF"/>
    </svg>`,
    targetPath: '/public/images/logos/circleci-logo-stacked-fb-657e221fda1646a7e652c09c9fbfb2b0feb5d710089bb4d8e8c759d37a832694.png'
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
  console.log('Creating custom SVG logos...');
  
  // Process each logo in customLogos
  for (const [filename, details] of Object.entries(customLogos)) {
    const { svg, targetPath } = details;
    
    try {
      // Save the SVG content to file
      saveSvgToFile(svg, targetPath);
      console.log(`Successfully created custom logo for ${filename}`);
    } catch (error) {
      console.error(`Failed to create custom logo for ${filename}: ${error.message}`);
    }
  }
  
  console.log('Done creating custom SVG logos!');
}

main().catch(console.error);
