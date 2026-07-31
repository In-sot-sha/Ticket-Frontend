/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
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
  			},
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
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
  					height: 0
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
  					height: 0
  				}
  			},
  			'ticket-shimmer': {
  				'0%': { transform: 'translateX(-120%) skewX(-12deg)' },
  				'100%': { transform: 'translateX(220%) skewX(-12deg)' }
  			},
  			'ticket-glow': {
  				'0%, 100%': { boxShadow: '0 0 0 0 rgba(244, 63, 94, 0.35), 0 10px 28px -8px rgba(244, 63, 94, 0.55)' },
  				'50%': { boxShadow: '0 0 0 6px rgba(244, 63, 94, 0), 0 14px 36px -6px rgba(244, 63, 94, 0.7)' }
  			},
  			'ticket-float': {
  				'0%, 100%': { transform: 'translateY(0)' },
  				'50%': { transform: 'translateY(-3px)' }
  			},
  			'chevron-nudge': {
  				'0%, 100%': { transform: 'translateX(0)' },
  				'50%': { transform: 'translateX(4px)' }
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'ticket-shimmer': 'ticket-shimmer 2.4s ease-in-out infinite',
  			'ticket-glow': 'ticket-glow 2.2s ease-in-out infinite',
  			'ticket-float': 'ticket-float 3.2s ease-in-out infinite',
  			'chevron-nudge': 'chevron-nudge 1.2s ease-in-out infinite'
  		},
  		fontFamily: {
  			ticket: ['Oswald', 'ui-sans-serif', 'system-ui', 'sans-serif']
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}