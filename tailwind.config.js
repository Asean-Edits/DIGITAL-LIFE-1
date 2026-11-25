/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./script.js"],
  theme: { extend: {} },
  plugins: [],
  // Keep common runtime-selected utility families available when classes
  // are assembled dynamically in the simulation UI.
  safelist: [
    { pattern: /(bg|text|border|ring|from|to|via)-(slate|gray|zinc|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|100|200|300|400|500|600|700|800|900|950)(\/\d+)?/ },
    { pattern: /(hidden|block|inline-block|flex|grid|absolute|fixed|relative|sticky)/ }
  ]
};
