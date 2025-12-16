/**
 * Script to generate web/src/data.js with all drawings from the original file
 */

const fs = require('fs');
const path = require('path');

const sourceFile = path.join(__dirname, '..', '..', 'electron', 'data', 'Powerball_12_16_2025.txt');
const outputFile = path.join(__dirname, '..', 'src', 'data.js');

console.log('Reading source file...');
const content = fs.readFileSync(sourceFile, 'utf8');

// Extract just the drawing lines (skip header and disclaimer)
const lines = content.split('\n');
const drawingLines = lines.filter(line => {
  const trimmed = line.trim();
  return trimmed && 
         !trimmed.toLowerCase().includes('results for powerball') &&
         !trimmed.toLowerCase().includes('information') &&
         !trimmed.toLowerCase().includes('accuracy') &&
         trimmed.includes(';');
});

console.log(`Found ${drawingLines.length} drawings`);

// Build the data.js file
// Extract the latest date from the first drawing line (most recent)
const latestDateMatch = drawingLines[0]?.match(/^(\d{1,2}\/\d{1,2}\/\d{4})/);
const lastUpdatedDate = latestDateMatch ? latestDateMatch[1] : '12/15/2025';

const dataJs = `/**
 * Embedded PowerBall Historical Data (Web Version)
 * Data from Powerball_12_16_2025.txt
 * Generated: ${new Date().toISOString()}
 * Total Drawings: ${drawingLines.length}
 */

// Data version - increment when data changes
const DATA_VERSION = '1.0.0';

// Last updated date - source of truth for all users
// This is the date of the most recent drawing in the embedded data
const DATA_LAST_UPDATED = '${lastUpdatedDate}';

const POWERBALL_DATA = \`Results for Powerball
${drawingLines.join('\n')}\`;

// Export the raw data, version, and last updated date
window.POWERBALL_RAW_DATA = POWERBALL_DATA;
window.DATA_VERSION = DATA_VERSION;
window.DATA_LAST_UPDATED = DATA_LAST_UPDATED;
`;

fs.writeFileSync(outputFile, dataJs, 'utf8');
console.log(`✅ Generated ${outputFile}`);
console.log(`   Total drawings: ${drawingLines.length}`);

