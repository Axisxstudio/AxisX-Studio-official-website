const fs = require('fs');

const fileNames = [
  'src/app/page.tsx',
  'src/components/Navigation.tsx',
  'src/components/Footer.tsx',
  'src/components/FeedbackSection.tsx',
  'src/app/layout.tsx',
];

const replacements = {
  '#000000': '#0B0F14', // old bg
  '#0a0a0a': '#111827', // old surface
  '#111111': '#161F2C', // old surface-2
  '#1a1a1a': '#1F2937', // old surface-3 / old border
  // For text and muted text
  '#fafafa': '#F8FAFC',
  '#a1a1aa': '#94A3B8',
  // Old pure white accent (#ffffff) -> we'll use #3B82F6 as the primary accent, but some white is text. Let's use blue for gradients/borders/glows. I'll just map #ffffff to #3B82F6.
  '#ffffff': '#3B82F6', 
  '#888888': '#1F2937', // from the gradient, use border color
};

for (const name of fileNames) {
  try {
    let content = fs.readFileSync(name, 'utf8');
    for (const [oldHex, newHex] of Object.entries(replacements)) {
      content = content.replace(new RegExp(oldHex, 'gi'), newHex);
    }
    fs.writeFileSync(name, content);
    console.log(`Updated ${name}`);
  } catch (err) {
    console.error(`Skipping ${name}`);
  }
}
console.log('Graphite Blue colors applied!');
