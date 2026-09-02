/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		/* Day 41 (Week 9, Build Reference Part 5.4 -- design tokens): the two
  		   scales Part 5.4 calls for that had no declared tokens before today
  		   (colour and border-radius already existed pre-Day-1, see the
  		   colors block below and src/index.css's CSS variables).

  		   TYPE SCALE. An audit (`grep -rhoE 'text-\[[0-9.]+(px|rem)\]'`
  		   across src/components and src/pages) found 90+ call sites already
  		   using `text-[11px]` and a handful using `text-[13px]`/`text-[10px]`
  		   -- ad hoc sizes that fall between Tailwind's own default `text-xs`
  		   (12px) and `text-sm` (14px) steps, reinvented independently rather
  		   than named. These three are declared as named tokens so future
  		   code (starting with the D42-D44 primitives and wizard shell) has
  		   a real name to reach for instead of another bracketed literal.
  		   Existing call sites are NOT migrated today -- Part 5.3 explicitly
  		   scopes this pass against "no wholesale migration" and "backfill
  		   only where there is a defect"; these values aren't defects, they
  		   render correctly today. Migrating them to the named tokens is a
  		   tracked backfill candidate for whenever those files are next
  		   touched for another reason, not a Day 41 task. */
  		fontSize: {
  			'2xs': ['0.625rem', { lineHeight: '0.875rem' }],   // 10px -- matches existing text-[10px]
  			label: ['0.6875rem', { lineHeight: '1rem' }],       // 11px -- matches existing text-[11px] (90+ sites)
  			caption: ['0.8125rem', { lineHeight: '1.125rem' }], // 13px -- matches existing text-[13px]
  		},
  		/* SPACING. Ordinary padding/margin/gap already consistently uses
  		   Tailwind's default 4px-grid scale across the app (no arbitrary
  		   p-/m-/gap- values turned up in the same audit) -- nothing to add
  		   there. The one real, reused arbitrary value is the wizard
  		   sidebar's width, hardcoded identically as `w-72` (expanded) /
  		   `w-[72px]` (collapsed) in THREE separate files
  		   (Competency/Evidence/TaskWizard's WizardSidebar.jsx). Named here
  		   so Day 44's extracted wizard shell has one definition to import
  		   instead of a fourth copy of the same two numbers. */
  		spacing: {
  			'wizard-rail': '18rem',            // 288px, == w-72
  			'wizard-rail-collapsed': '4.5rem',  // 72px,  == w-[72px]
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
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
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
