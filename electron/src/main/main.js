/**
 * Electron Main Process
 * Handles window management, file I/O, and business logic
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Import core modules
const { parseDataFileSync } = require('../core/dataParser');
const { analyzeFrequency, getHotNumbers, getColdNumbers } = require('../core/frequencyAnalyzer');
const { generateTicket, generateMultipleTickets, TicketSession, TOTAL_COMBINATIONS } = require('../core/ticketGenerator');

// Keep a global reference of the window object to prevent garbage collection
let mainWindow;

// Session instance for tracking generated tickets
const session = new TicketSession();

// Cached data
let frequencyData = null;
let cachedDrawings = [];
let dataFilePath = null;

/**
 * Create the main application window
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 800,
    minWidth: 800,
    minHeight: 700,
    title: 'PowerBall Lottery Generator',
    backgroundColor: '#1a1a2e',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load the index.html file
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // Open DevTools in development mode
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Create window when app is ready
app.whenReady().then(createWindow);

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Re-create window on macOS when dock icon is clicked
app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// ============================================
// IPC Handlers
// ============================================

// Load and parse data file
ipcMain.handle('load-data', () => {
  try {
    dataFilePath = path.join(app.getAppPath(), 'data', 'Powerball_12_16_2025.txt');
    const result = parseDataFileSync(dataFilePath);
    
    // Cache drawings and frequency data if successful
    if (result.drawings.length > 0) {
      cachedDrawings = result.drawings;
      frequencyData = analyzeFrequency(result.drawings);
    }
    
    return result;
  } catch (error) {
    return {
      drawings: [],
      errors: [`Failed to load data: ${error.message}`],
      totalLines: 0,
      validLines: 0
    };
  }
});

// Get frequency data
ipcMain.handle('get-frequency-data', () => {
  return frequencyData;
});

// Generate a single ticket
ipcMain.handle('generate-ticket', () => {
  if (!frequencyData) {
    throw new Error('Frequency data not loaded');
  }
  
  const ticket = generateTicket(frequencyData);
  session.addTicket(ticket);
  return ticket;
});

// Generate multiple tickets
ipcMain.handle('generate-multiple-tickets', (event, count) => {
  if (!frequencyData) {
    throw new Error('Frequency data not loaded');
  }
  
  const tickets = generateMultipleTickets(frequencyData, count);
  session.addTickets(tickets);
  return tickets;
});

// Get session statistics
ipcMain.handle('get-session-stats', () => {
  return {
    totalTickets: session.getTotalCount(),
    uniqueCombinations: session.getUniqueCount(),
    coveragePercentage: session.getCoveragePercentage(),
    totalPossible: TOTAL_COMBINATIONS
  };
});

// Get all tickets from session
ipcMain.handle('get-all-tickets', () => {
  return session.getAllTickets();
});

// Reset session
ipcMain.handle('reset-session', () => {
  session.reset();
  return true;
});

// Get hot numbers
ipcMain.handle('get-hot-numbers', (event, count) => {
  if (!frequencyData) return [];
  return getHotNumbers(frequencyData.whiteBallFrequencies, count);
});

// Get cold numbers
ipcMain.handle('get-cold-numbers', (event, count) => {
  if (!frequencyData) return [];
  return getColdNumbers(frequencyData.whiteBallFrequencies, count);
});

// Get constants
ipcMain.handle('get-total-combinations', () => {
  return TOTAL_COMBINATIONS;
});

// ============================================
// Add New Drawing
// ============================================

/**
 * Validate a new drawing entry
 * @param {object} drawing - The drawing to validate
 * @returns {object} - { valid: boolean, error: string | null }
 */
function validateDrawing(drawing) {
  const { date, whiteBalls, powerball } = drawing;
  
  // Validate date format (MM/DD/YYYY)
  if (!date || !/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(date)) {
    return { valid: false, error: 'Invalid date format. Use MM/DD/YYYY.' };
  }
  
  // Validate white balls
  if (!Array.isArray(whiteBalls) || whiteBalls.length !== 5) {
    return { valid: false, error: 'Must have exactly 5 white balls.' };
  }
  
  const whiteBallSet = new Set();
  for (const ball of whiteBalls) {
    const num = parseInt(ball, 10);
    if (isNaN(num) || num < 1 || num > 69) {
      return { valid: false, error: `White ball "${ball}" is invalid. Must be 1-69.` };
    }
    if (whiteBallSet.has(num)) {
      return { valid: false, error: `Duplicate white ball: ${num}` };
    }
    whiteBallSet.add(num);
  }
  
  // Validate PowerBall
  const pb = parseInt(powerball, 10);
  if (isNaN(pb) || pb < 1 || pb > 26) {
    return { valid: false, error: `PowerBall "${powerball}" is invalid. Must be 1-26.` };
  }
  
  // Check if this date already exists
  const existingDates = cachedDrawings.map(d => d.date);
  if (existingDates.includes(date)) {
    return { valid: false, error: `A drawing for ${date} already exists.` };
  }
  
  return { valid: true, error: null };
}

// Add a new drawing to the data file
ipcMain.handle('add-drawing', async (event, drawing) => {
  try {
    // Validate the drawing
    const validation = validateDrawing(drawing);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    
    const { date, whiteBalls, powerball } = drawing;
    
    // Format the line to match the data file format
    const sortedWhiteBalls = whiteBalls.map(n => parseInt(n, 10)).sort((a, b) => a - b);
    const newLine = `${date}; ${sortedWhiteBalls.join(',')}; Powerball: ${powerball}`;
    
    // Read the current file content
    let content = fs.readFileSync(dataFilePath, 'utf-8');
    
    // Split into lines
    const lines = content.split('\n');
    
    // Insert the new line after the header (line 0)
    // This keeps the newest drawings at the top
    lines.splice(1, 0, newLine);
    
    // Write back to file
    fs.writeFileSync(dataFilePath, lines.join('\n'), 'utf-8');
    
    // Update cached data
    const newDrawing = {
      date,
      whiteBalls: sortedWhiteBalls,
      powerball: parseInt(powerball, 10)
    };
    cachedDrawings.unshift(newDrawing);
    
    // Recalculate frequency data
    frequencyData = analyzeFrequency(cachedDrawings);
    
    return { 
      success: true, 
      message: `Drawing for ${date} added successfully!`,
      totalDrawings: cachedDrawings.length
    };
    
  } catch (error) {
    return { success: false, error: `Failed to add drawing: ${error.message}` };
  }
});

// Get the most recent drawing date
ipcMain.handle('get-latest-drawing-date', () => {
  if (cachedDrawings.length > 0) {
    return cachedDrawings[0].date;
  }
  return null;
});
