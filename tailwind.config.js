/** @type {import('tailwindcss').Config} */
module.exports = {
  // Specify the files that Tailwind CSS should scan for utility classes
  // This helps Tailwind generate only the necessary CSS for your project,
  // keeping the final CSS bundle size small.
  content: [
    // Look for .js, .jsx, .ts, .tsx files in the src directory and its subdirectories
    "./src/**/*.{js,jsx,ts,tsx}",
    // You can add other paths here if you have components or HTML files
    // outside of the src directory that use Tailwind classes.
  ],
  theme: {
    // The 'extend' property allows you to add to Tailwind's default theme
    // without overwriting it. You can define custom colors, spacing,
    // typography, breakpoints, etc., here.
    extend: {},
  },
  plugins: [
    // This is where you would add Tailwind CSS plugins.
    // For now, we don't need any custom plugins.
  ],
};