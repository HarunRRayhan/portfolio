import { createElement, type ComponentType, type SVGProps } from 'react';
import { Globe, Mail } from 'lucide-react';

export type Icon = ComponentType<SVGProps<SVGSVGElement>>;

const makeBrandIcon = (pathData: string): Icon => (props) =>
  createElement(
    'svg',
    {
      viewBox: '0 0 24 24',
      fill: 'currentColor',
      xmlns: 'http://www.w3.org/2000/svg',
      ...props,
    },
    createElement('path', { d: pathData }),
  );

export const Twitter = makeBrandIcon(
  'M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zM8.9 1.57h2.388L15.098 6.9h-2.389z',
);

export const Linkedin = makeBrandIcon(
  'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.049c.476-.9 1.637-1.852 3.368-1.852 3.601 0 4.267 2.369 4.267 5.452v6.291ZM5.337 7.433a2.062 2.062 0 1 1 0-4.123 2.062 2.062 0 0 1 0 4.123ZM7.115 20.452H3.558V9h3.557v11.452Z',
);

export const Github = makeBrandIcon(
  'M12 .297C5.373.297 0 5.67 0 12c0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.611-4.042-1.611-.546-1.387-1.333-1.757-1.333-1.757-1.089-.745.082-.729.082-.729 1.205.084 1.84 1.237 1.84 1.237 1.07 1.835 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.605-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.468-2.381 1.235-3.221-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.3 1.23a11.49 11.49 0 0 1 6 0c2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.873.118 3.176.77.84 1.235 1.91 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .319.218.694.825.576C20.565 21.796 24 17.299 24 12c0-6.33-5.373-11.703-12-11.703Z',
);

export { Mail };

export const Icons = {
  twitter: Twitter,
  globe: Globe,
  linkedin: Linkedin,
  github: Github,
  mail: Mail,
} as const;
