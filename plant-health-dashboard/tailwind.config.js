module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          primary: {
            light: '#4ade80',
            DEFAULT: '#22c55e',
            dark: '#16a34a',
          },
          secondary: {
            light: '#7dd3fc', 
            DEFAULT: '#0ea5e9',
            dark: '#0369a1',
          },
          warning: {
            light: '#fcd34d',
            DEFAULT: '#f59e0b',
            dark: '#d97706',
          },
          danger: {
            light: '#fca5a5',
            DEFAULT: '#ef4444',
            dark: '#b91c1c',
          },
        },
        animation: {
          'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        }
      },
    },
    plugins: [require("daisyui")],
  }