// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './app/**/*.{js,ts,jsx,tsx}',
        './app/components/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                'dark-blue': '#1e3a8a',
                'light-blue': '#60a5fa',
            },
        },
    },
    plugins: [], // No need to add prose plugin; it's built into Tailwind
};