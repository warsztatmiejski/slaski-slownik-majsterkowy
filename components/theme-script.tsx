// app/components/theme-script.tsx
// This script should be added to the <head> of your document to prevent FOUC

export default function ThemeScript() {
  const themeScript = `
	(function() {
	  function getThemePreference() {
		if (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) {
		  return localStorage.getItem('theme');
		}
		return 'system';
	  }

	  function setTheme(theme) {
		if (theme === 'light') {
		  document.documentElement.classList.remove('dark');
		} else if (theme === 'dark') {
		  document.documentElement.classList.add('dark');
		} else {
		  // system
		  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
			document.documentElement.classList.add('dark');
		  } else {
			document.documentElement.classList.remove('dark');
		  }
		}
	  }

	  setTheme(getThemePreference());
	})();
  `

  return (
	<script
	  dangerouslySetInnerHTML={{
		__html: themeScript,
	  }}
	/>
  )
}