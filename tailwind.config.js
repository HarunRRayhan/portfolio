import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ['class'],
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.tsx',
    ],

    theme: {
    	container: {
    		center: true,
    		padding: '2rem',
    		screens: {
    			'2xl': '1400px'
    		}
    	},
    	extend: {
    		fontFamily: {
    			sans: [
    				'Inter',
                    ...defaultTheme.fontFamily.sans
                ]
    		},
    		colors: {
    			border: 'hsl(var(--border))',
    			input: 'hsl(var(--input))',
    			ring: 'hsl(var(--ring))',
    			background: 'hsl(var(--background))',
    			foreground: 'hsl(var(--foreground))',
    			primary: {
    				DEFAULT: 'hsl(var(--primary))',
    				foreground: 'hsl(var(--primary-foreground))'
    			},
    			secondary: {
    				DEFAULT: 'hsl(var(--secondary))',
    				foreground: 'hsl(var(--secondary-foreground))'
    			},
    			destructive: {
    				DEFAULT: 'hsl(var(--destructive))',
    				foreground: 'hsl(var(--destructive-foreground))'
    			},
    			muted: {
    				DEFAULT: 'hsl(var(--muted))',
    				foreground: 'hsl(var(--muted-foreground))'
    			},
    			accent: {
    				DEFAULT: 'hsl(var(--accent))',
    				foreground: 'hsl(var(--accent-foreground))'
    			},
    			popover: {
    				DEFAULT: 'hsl(var(--popover))',
    				foreground: 'hsl(var(--popover-foreground))'
    			},
    			card: {
    				DEFAULT: 'hsl(var(--card))',
    				foreground: 'hsl(var(--card-foreground))'
    			}
    		},
    		borderRadius: {
    			lg: 'var(--radius)',
    			md: 'calc(var(--radius) - 2px)',
    			sm: 'calc(var(--radius) - 4px)'
    		},
    		keyframes: {
    			'accordion-down': {
    				from: {
    					height: '0'
    				},
    				to: {
    					height: 'var(--radix-accordion-content-height)'
    				}
    			},
    			'accordion-up': {
    				from: {
    					height: 'var(--radix-accordion-content-height)'
    				},
    				to: {
    					height: '0'
    				}
    			},
    			'slide-from-left': {
    				'0%': {
    					transform: 'translateX(-100%)'
    				},
    				'100%': {
    					transform: 'translateX(0)'
    				}
    			},
    			'slide-to-left': {
    				'0%': {
    					transform: 'translateX(0)'
    				},
    				'100%': {
    					transform: 'translateX(-100%)'
    				}
    			},
    			'slide-from-right': {
    				'0%': {
    					transform: 'translateX(100%)'
    				},
    				'100%': {
    					transform: 'translateX(0)'
    				}
    			},
    			'slide-to-right': {
    				'0%': {
    					transform: 'translateX(0)'
    				},
    				'100%': {
    					transform: 'translateX(100%)'
    				}
    			},
    			'slide-from-top': {
    				'0%': {
    					transform: 'translateY(-100%)'
    				},
    				'100%': {
    					transform: 'translateY(0)'
    				}
    			},
    			'slide-to-top': {
    				'0%': {
    					transform: 'translateY(0)'
    				},
    				'100%': {
    					transform: 'translateY(-100%)'
    				}
    			},
    			'slide-from-bottom': {
    				'0%': {
    					transform: 'translateY(100%)'
    				},
    				'100%': {
    					transform: 'translateY(0)'
    				}
    			},
    			'slide-to-bottom': {
    				'0%': {
    					transform: 'translateY(0)'
    				},
    				'100%': {
    					transform: 'translateY(100%)'
    				}
    			}
    		},
    		animation: {
    			'accordion-down': 'accordion-down 0.2s ease-out',
    			'accordion-up': 'accordion-up 0.2s ease-out',
    			'slide-from-left': 'slide-from-left 0.3s ease-out',
    			'slide-to-left': 'slide-to-left 0.3s ease-out',
    			'slide-from-right': 'slide-from-right 0.3s ease-out',
    			'slide-to-right': 'slide-to-right 0.3s ease-out',
    			'slide-from-top': 'slide-from-top 0.3s ease-out',
    			'slide-to-top': 'slide-to-top 0.3s ease-out',
    			'slide-from-bottom': 'slide-from-bottom 0.3s ease-out',
    			'slide-to-bottom': 'slide-to-bottom 0.3s ease-out'
    		}
    	}
    },

    plugins: [
        forms,
        require("tailwindcss-animate")
    ],
};
