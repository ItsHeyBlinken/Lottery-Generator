/**
 * Build script for PowerBall Generator Web
 * Bundles all files into a dist folder for deployment
 */

const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, '..', 'web-dist');

// Create dist directory
if (!fs.existsSync(distPath)) {
  fs.mkdirSync(distPath, { recursive: true });
}

// Copy HTML
console.log('Copying HTML...');
fs.copyFileSync(
  path.join(__dirname, 'index.html'),
  path.join(distPath, 'index.html')
);

// Create src and styles directories in dist
const distSrcPath = path.join(distPath, 'src');
const distCorePath = path.join(distSrcPath, 'core');
const distStylesPath = path.join(distPath, 'styles');

if (!fs.existsSync(distSrcPath)) fs.mkdirSync(distSrcPath, { recursive: true });
if (!fs.existsSync(distCorePath)) fs.mkdirSync(distCorePath, { recursive: true });
if (!fs.existsSync(distStylesPath)) fs.mkdirSync(distStylesPath, { recursive: true });

// Copy styles
console.log('Copying styles...');
fs.copyFileSync(
  path.join(__dirname, 'styles', 'styles.css'),
  path.join(distStylesPath, 'styles.css')
);

// Copy JavaScript files
console.log('Copying JavaScript files...');

const jsFiles = [
  { src: 'src/data.js', dest: 'src/data.js' },
  { src: 'src/core/dataParser.js', dest: 'src/core/dataParser.js' },
  { src: 'src/core/frequencyAnalyzer.js', dest: 'src/core/frequencyAnalyzer.js' },
  { src: 'src/core/ticketGenerator.js', dest: 'src/core/ticketGenerator.js' },
  { src: 'src/core/indexedDB.js', dest: 'src/core/indexedDB.js' },
  { src: 'src/app.js', dest: 'src/app.js' }
];

jsFiles.forEach(file => {
  fs.copyFileSync(
    path.join(__dirname, file.src),
    path.join(distPath, file.dest)
  );
  console.log(`  Copied ${file.src}`);
});

console.log('\n✅ Build complete!');
console.log(`Output directory: ${distPath}`);
console.log('\nTo deploy:');
console.log('1. Upload the web-dist folder to your web server');
console.log('2. Or use a static hosting service like Netlify, Vercel, or GitHub Pages');

