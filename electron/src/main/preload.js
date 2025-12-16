/**
 * Preload Script
 * Securely exposes IPC methods to the renderer process
 * This script runs in a sandboxed environment - no Node.js modules available
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to renderer via contextBridge
contextBridge.exposeInMainWorld('lottery', {
  // Load and parse data file
  loadData: () => ipcRenderer.invoke('load-data'),
  
  // Get cached frequency data
  getFrequencyData: () => ipcRenderer.invoke('get-frequency-data'),
  
  // Generate a single ticket
  generateTicket: () => ipcRenderer.invoke('generate-ticket'),
  
  // Generate multiple tickets
  generateMultipleTickets: (count) => ipcRenderer.invoke('generate-multiple-tickets', count),
  
  // Get session statistics
  getSessionStats: () => ipcRenderer.invoke('get-session-stats'),
  
  // Get all tickets from session
  getAllTickets: () => ipcRenderer.invoke('get-all-tickets'),
  
  // Reset session
  resetSession: () => ipcRenderer.invoke('reset-session'),
  
  // Get hot numbers
  getHotNumbers: (count) => ipcRenderer.invoke('get-hot-numbers', count),
  
  // Get cold numbers
  getColdNumbers: (count) => ipcRenderer.invoke('get-cold-numbers', count),
  
  // Get total combinations constant
  getTotalCombinations: () => ipcRenderer.invoke('get-total-combinations'),
  
  // Add a new drawing to the data file
  addDrawing: (drawing) => ipcRenderer.invoke('add-drawing', drawing),
  
  // Get the most recent drawing date
  getLatestDrawingDate: () => ipcRenderer.invoke('get-latest-drawing-date')
});
