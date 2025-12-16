/**
 * IndexedDB Cache Manager
 * Stores parsed drawings and frequency data for fast loading
 */

const DB_NAME = 'powerball_cache';
const DB_VERSION = 1;
const STORE_NAME = 'data';

/**
 * Open/create the IndexedDB database
 * @returns {Promise<IDBDatabase>}
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

/**
 * Save data to cache
 * @param {object} data - Object containing drawings and frequencyData
 * @param {string} version - Data version string
 * @returns {Promise<void>}
 */
async function saveCache(data, version) {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.put({ 
        drawings: data.drawings,
        frequencyData: data.frequencyData,
        version: version,
        timestamp: Date.now()
      }, 'main');
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('Failed to save cache:', error);
    throw error;
  }
}

/**
 * Load data from cache
 * @returns {Promise<object|null>} - Cached data or null if not found
 */
async function loadCache() {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.get('main');
      request.onsuccess = () => {
        const result = request.result;
        resolve(result || null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('Failed to load cache:', error);
    return null;
  }
}

/**
 * Clear the cache
 * @returns {Promise<void>}
 */
async function clearCache() {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('Failed to clear cache:', error);
    throw error;
  }
}

// Export for use in browser
window.IndexedDBCache = {
  saveCache,
  loadCache,
  clearCache
};

