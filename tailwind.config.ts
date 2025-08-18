// Tailwind CSS v4.1 configuration is handled in CSS via @theme
// This file is kept for compatibility but most config is now in globals.css

export default {
  // Content detection is automatic in v4.1, but you can still specify if needed
  content: [
	'./app/**/*.{js,ts,jsx,tsx}',
	'./components/**/*.{js,ts,jsx,tsx}',
	'./pages/**/*.{js,ts,jsx,tsx}',
  ],
}