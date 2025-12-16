/**
 * PowerBall Generator - Web Application
 * Main application logic (no Electron dependencies)
 */

// ============================================
// State Management
// ============================================
let isDataLoaded = false;
let isFormExpanded = false;
let isGuideExpanded = false;
let generatedTickets = [];
let currentSort = 'newest';

// Data state
let drawings = [];
let frequencyData = null;
let session = null;

// Local storage keys
const STORAGE_KEY_DRAWINGS = 'powerball_user_drawings';

// ============================================
// DOM Elements
// ============================================
const elements = {
  generateOneBtn: document.getElementById('generateOneBtn'),
  generateMultiBtn: document.getElementById('generateMultiBtn'),
  ticketCountInput: document.getElementById('ticketCount'),
  latestTicket: document.getElementById('latestTicket'),
  ticketCountStat: document.getElementById('ticketCountStat'),
  uniqueCountStat: document.getElementById('uniqueCountStat'),
  drawingCountStat: document.getElementById('drawingCountStat'),
  latestDateStat: document.getElementById('latestDateStat'),
  dataLastUpdatedStat: document.getElementById('dataLastUpdatedStat'),
  historyList: document.getElementById('historyList'),
  historyCount: document.getElementById('historyCount'),
  dataStatus: document.getElementById('dataStatus'),
  errorContainer: document.getElementById('errorContainer'),
  errorText: document.getElementById('errorText'),
  errorClose: document.getElementById('errorClose'),
  successContainer: document.getElementById('successContainer'),
  successText: document.getElementById('successText'),
  successClose: document.getElementById('successClose'),
  // Add drawing form elements
  addDrawingToggle: document.getElementById('addDrawingToggle'),
  addDrawingForm: document.getElementById('addDrawingForm'),
  toggleIcon: document.getElementById('toggleIcon'),
  drawingDate: document.getElementById('drawingDate'),
  wb1: document.getElementById('wb1'),
  wb2: document.getElementById('wb2'),
  wb3: document.getElementById('wb3'),
  wb4: document.getElementById('wb4'),
  wb5: document.getElementById('wb5'),
  pbInput: document.getElementById('pbInput'),
  addDrawingBtn: document.getElementById('addDrawingBtn'),
  clearFormBtn: document.getElementById('clearFormBtn'),
  formMessage: document.getElementById('formMessage'),
  // Reset button
  resetDataBtn: document.getElementById('resetDataBtn'),
  // Sort buttons
  sortNewest: document.getElementById('sortNewest'),
  sortHot: document.getElementById('sortHot'),
  sortCold: document.getElementById('sortCold'),
  // Leaderboard
  leaderboard: document.getElementById('leaderboard'),
  hottestTicket: document.getElementById('hottestTicket'),
  coldestTicket: document.getElementById('coldestTicket'),
  // Rating guide
  ratingGuideToggle: document.getElementById('ratingGuideToggle'),
  ratingGuideContent: document.getElementById('ratingGuideContent'),
  guideToggleIcon: document.getElementById('guideToggleIcon'),
  // Rate numbers elements
  rateNumbersBtn: document.getElementById('rateNumbersBtn'),
  rateWb1: document.getElementById('rateWb1'),
  rateWb2: document.getElementById('rateWb2'),
  rateWb3: document.getElementById('rateWb3'),
  rateWb4: document.getElementById('rateWb4'),
  rateWb5: document.getElementById('rateWb5'),
  ratePb: document.getElementById('ratePb')
};

// ============================================
// Initialization
// ============================================
async function init() {
  console.log('Initializing PowerBall Generator (Web)...');
  
  // Initialize ticket session
  session = new window.TicketGenerator.TicketSession();
  
  // Set up event listeners
  setupEventListeners();
  
  // Load data
  await loadData();
}

function setupEventListeners() {
  elements.generateOneBtn.addEventListener('click', generateSingleTicket);
  elements.generateMultiBtn.addEventListener('click', generateMultipleTickets);
  elements.errorClose.addEventListener('click', hideError);
  elements.successClose.addEventListener('click', hideSuccess);
  
  // Validate ticket count input
  elements.ticketCountInput.addEventListener('change', () => {
    let value = parseInt(elements.ticketCountInput.value, 10);
    if (isNaN(value) || value < 1) value = 1;
    if (value > 100) value = 100;
    elements.ticketCountInput.value = value;
  });
  
  // Add drawing form
  elements.addDrawingToggle.addEventListener('click', toggleAddDrawingForm);
  elements.addDrawingBtn.addEventListener('click', handleAddDrawing);
  elements.clearFormBtn.addEventListener('click', clearDrawingForm);
  elements.drawingDate.addEventListener('input', formatDateInput);
  
  // Rate numbers
  if (elements.rateNumbersBtn) {
    elements.rateNumbersBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Rate button clicked');
      rateUserNumbers();
    });
  } else {
    console.error('Rate numbers button not found');
  }
  
  // Ball input validation
  const ballInputs = [elements.wb1, elements.wb2, elements.wb3, elements.wb4, elements.wb5];
  ballInputs.forEach(input => {
    input.addEventListener('blur', () => validateBallInput(input, 1, 69));
  });
  elements.pbInput.addEventListener('blur', () => validateBallInput(elements.pbInput, 1, 26));
  
  // Reset button
  elements.resetDataBtn.addEventListener('click', resetToDefaultData);
  
  // Sort buttons
  elements.sortNewest.addEventListener('click', () => sortTickets('newest'));
  elements.sortHot.addEventListener('click', () => sortTickets('hot'));
  elements.sortCold.addEventListener('click', () => sortTickets('cold'));
  
  // Rating guide toggle
  elements.ratingGuideToggle.addEventListener('click', toggleRatingGuide);
}

// ============================================
// Data Loading
// ============================================
async function loadData() {
  updateDataStatus('loading', 'Loading data...');
  
  try {
    const currentVersion = window.DATA_VERSION || '1.0.0';
    let needsReanalysis = false;
    
    // 1. Try to load from IndexedDB cache
    const cached = await window.IndexedDBCache.loadCache();
    
    if (cached && cached.version === currentVersion) {
      // Cache hit! Use cached data
      console.log('Loading from cache...');
      drawings = cached.drawings;
      frequencyData = cached.frequencyData;
      
      // Load any user-added drawings from localStorage
      const userDrawings = loadUserDrawings();
      if (userDrawings.length > 0) {
        // Merge user drawings (avoid duplicates by date)
        const existingDates = new Set(drawings.map(d => d.date));
        const newUserDrawings = userDrawings.filter(ud => !existingDates.has(ud.date));
        
        if (newUserDrawings.length > 0) {
          drawings = [...newUserDrawings, ...drawings];
          needsReanalysis = true;
        }
      }
      
      // Re-analyze only if user drawings were added
      if (needsReanalysis) {
        frequencyData = window.FrequencyAnalyzer.analyzeFrequency(drawings);
        // Update cache with new data
        await window.IndexedDBCache.saveCache({
          drawings: drawings,
          frequencyData: frequencyData
        }, currentVersion);
      }
      
      isDataLoaded = true;
      updateDataStatus('success', `${drawings.length} drawings loaded (cached)`);
      elements.drawingCountStat.textContent = drawings.length.toLocaleString();
      
      if (drawings.length > 0) {
        elements.latestDateStat.textContent = drawings[0].date;
      }
      
      // Display last updated date (source of truth)
      const lastUpdated = window.DATA_LAST_UPDATED || '12/15/2025';
      elements.dataLastUpdatedStat.textContent = lastUpdated;
      
      elements.generateOneBtn.disabled = false;
      elements.generateMultiBtn.disabled = false;
      
      console.log('Data loaded from cache:', {
        totalDrawings: drawings.length,
        cached: true
      });
      
      return;
    }
    
    // 2. Cache miss or outdated - parse embedded data
    console.log('Parsing embedded data...');
    const embeddedResult = window.DataParser.parseDataContent(window.POWERBALL_RAW_DATA);
    
    if (embeddedResult.errors.length > 0 && embeddedResult.drawings.length === 0) {
      updateDataStatus('error', 'Failed to load data');
      showError(embeddedResult.errors[0]);
      return;
    }
    
    drawings = embeddedResult.drawings;
    
    // 3. Merge user drawings from localStorage
    const userDrawings = loadUserDrawings();
    if (userDrawings.length > 0) {
      const existingDates = new Set(drawings.map(d => d.date));
      const newUserDrawings = userDrawings.filter(ud => !existingDates.has(ud.date));
      drawings = [...newUserDrawings, ...drawings];
    }
    
    if (drawings.length === 0) {
      updateDataStatus('error', 'No valid drawings found');
      showError('The data contains no valid drawings.');
      return;
    }
    
    // 4. Analyze frequency
    frequencyData = window.FrequencyAnalyzer.analyzeFrequency(drawings);
    
    // 5. Save to cache for next time
    try {
      await window.IndexedDBCache.saveCache({
        drawings: drawings,
        frequencyData: frequencyData
      }, currentVersion);
      console.log('Data cached successfully');
    } catch (cacheError) {
      console.warn('Failed to cache data (non-critical):', cacheError);
    }
    
    isDataLoaded = true;
    
    // Update UI
    updateDataStatus('success', `${drawings.length} drawings loaded`);
    elements.drawingCountStat.textContent = drawings.length.toLocaleString();
    
    if (drawings.length > 0) {
      elements.latestDateStat.textContent = drawings[0].date;
    }
    
    // Display last updated date (source of truth)
    const lastUpdated = window.DATA_LAST_UPDATED || '12/15/2025';
    elements.dataLastUpdatedStat.textContent = lastUpdated;
    
    elements.generateOneBtn.disabled = false;
    elements.generateMultiBtn.disabled = false;
    elements.rateNumbersBtn.disabled = false;
    
    console.log('Data loaded successfully:', {
      totalDrawings: drawings.length,
      userDrawings: userDrawings.length,
      cached: false
    });
    
  } catch (error) {
    updateDataStatus('error', 'Error loading data');
    showError(`Failed to load data: ${error.message}`);
    console.error('Error loading data:', error);
  }
}

// ============================================
// LocalStorage Functions
// ============================================
function loadUserDrawings() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_DRAWINGS);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading user drawings:', error);
  }
  return [];
}

function saveUserDrawing(drawing) {
  try {
    const userDrawings = loadUserDrawings();
    userDrawings.unshift(drawing);
    localStorage.setItem(STORAGE_KEY_DRAWINGS, JSON.stringify(userDrawings));
    return true;
  } catch (error) {
    console.error('Error saving user drawing:', error);
    return false;
  }
}

function clearUserDrawings() {
  try {
    localStorage.removeItem(STORAGE_KEY_DRAWINGS);
    return true;
  } catch (error) {
    console.error('Error clearing user drawings:', error);
    return false;
  }
}

// ============================================
// Ticket Generation
// ============================================
function generateSingleTicket() {
  if (!isDataLoaded || !frequencyData) {
    showError('Data not loaded. Please wait or refresh the page.');
    return;
  }
  
  try {
    const ticket = window.TicketGenerator.generateTicket(frequencyData);
    session.addTicket(ticket);
    displayLatestTicket(ticket);
    addToHistory(ticket);
    updateStats();
  } catch (error) {
    showError(`Failed to generate ticket: ${error.message}`);
    console.error('Error generating ticket:', error);
  }
}

function generateMultipleTickets() {
  if (!isDataLoaded || !frequencyData) {
    showError('Data not loaded. Please wait or refresh the page.');
    return;
  }
  
  const count = parseInt(elements.ticketCountInput.value, 10) || 5;
  
  try {
    const tickets = window.TicketGenerator.generateMultipleTickets(frequencyData, count);
    session.addTickets(tickets);
    
    if (tickets.length > 0) {
      displayLatestTicket(tickets[tickets.length - 1]);
    }
    
    for (const ticket of tickets) {
      addToHistory(ticket);
    }
    
    updateStats();
  } catch (error) {
    showError(`Failed to generate tickets: ${error.message}`);
    console.error('Error generating tickets:', error);
  }
}

function rateUserNumbers() {
  console.log('rateUserNumbers called');
  
  if (!isDataLoaded || !frequencyData) {
    console.error('Data not loaded');
    showError('Data not loaded. Please wait or refresh the page.');
    return;
  }
  
  try {
    console.log('Starting to rate numbers...');
    // Get user input
    const wb1 = parseInt(elements.rateWb1.value, 10);
    const wb2 = parseInt(elements.rateWb2.value, 10);
    const wb3 = parseInt(elements.rateWb3.value, 10);
    const wb4 = parseInt(elements.rateWb4.value, 10);
    const wb5 = parseInt(elements.rateWb5.value, 10);
    const pb = parseInt(elements.ratePb.value, 10);
    
    // Validate inputs
    const whiteBalls = [wb1, wb2, wb3, wb4, wb5];
    
    // Check if all fields are filled
    if (whiteBalls.some(n => isNaN(n) || n < 1) || isNaN(pb) || pb < 1) {
      showError('Please enter all numbers (5 white balls 1-69, 1 PowerBall 1-26)');
      return;
    }
    
    // Check white ball ranges
    if (whiteBalls.some(n => n < 1 || n > 69)) {
      showError('White balls must be between 1 and 69');
      return;
    }
    
    // Check PowerBall range
    if (pb < 1 || pb > 26) {
      showError('PowerBall must be between 1 and 26');
      return;
    }
    
    // Check for duplicate white balls
    const whiteBallSet = new Set(whiteBalls);
    if (whiteBallSet.size !== 5) {
      showError('White balls must be unique (no duplicates)');
      return;
    }
    
    // Sort white balls
    whiteBalls.sort((a, b) => a - b);
    
    // Calculate probabilities using the same logic as generateTicket
    const { 
      whiteBallFrequencies, 
      powerballFrequencies,
      totalDrawings,
      totalWhiteBallDraws
    } = frequencyData;
    
    const whiteBallProbabilities = whiteBalls.map(num => ({
      number: num,
      ...window.TicketGenerator.calculateProbability(num, whiteBallFrequencies, totalWhiteBallDraws, 69)
    }));
    
    const powerballProbability = {
      number: pb,
      ...window.TicketGenerator.calculateProbability(pb, powerballFrequencies, totalDrawings, 26)
    };
    
    // Calculate overall ticket score (average relative strength)
    const allStrengths = [
      ...whiteBallProbabilities.map(p => parseFloat(p.relativeStrength)),
      parseFloat(powerballProbability.relativeStrength)
    ];
    const averageStrength = allStrengths.reduce((a, b) => a + b, 0) / allStrengths.length;
    
    // Get ticket rating
    const ticketRating = window.TicketGenerator.getTicketRating(averageStrength);
    
    // Create ticket-like object for display
    const ratedTicket = {
      whiteBalls,
      powerball: pb,
      probabilities: {
        whiteBalls: whiteBallProbabilities,
        powerball: powerballProbability,
        averageStrength: averageStrength.toFixed(1),
        rating: ticketRating
      },
      timestamp: new Date().toISOString(),
      isRated: true // Flag to indicate this is a user-rated ticket
    };
    
    // Add to session and history (like generated tickets)
    session.addTicket(ratedTicket);
    displayLatestTicket(ratedTicket); // Show in main "Your Numbers" section
    addToHistory(ratedTicket);
    updateStats();
    
    // Clear input fields
    elements.rateWb1.value = '';
    elements.rateWb2.value = '';
    elements.rateWb3.value = '';
    elements.rateWb4.value = '';
    elements.rateWb5.value = '';
    elements.ratePb.value = '';
    
    // Show success message
    showSuccess('Numbers rated and added to history!');
    
    // Scroll to the history section to show the new entry
    const historySection = document.getElementById('ticketHistory');
    if (historySection) {
      setTimeout(() => {
        historySection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
    
    console.log('Numbers rated successfully');
    
  } catch (error) {
    showError(`Failed to rate numbers: ${error.message}`);
    console.error('Error rating numbers:', error);
  }
}

// ============================================
// Display Functions
// ============================================
function displayLatestTicket(ticket) {
  const ticketDisplay = elements.latestTicket.querySelector('.ticket-display');
  ticketDisplay.classList.remove('empty');
  
  // Update white balls with probabilities
  const whiteBallContainers = ticketDisplay.querySelectorAll('.white-balls .ball-container');
  ticket.whiteBalls.forEach((num, index) => {
    if (whiteBallContainers[index]) {
      const ball = whiteBallContainers[index].querySelector('.ball');
      const probLabel = whiteBallContainers[index].querySelector('.prob-label');
      
      ball.textContent = num;
      ball.classList.remove('animate', 'hot', 'cold');
      
      if (ticket.probabilities && ticket.probabilities.whiteBalls[index]) {
        const prob = ticket.probabilities.whiteBalls[index];
        if (prob.isHot) ball.classList.add('hot');
        if (prob.isCold) ball.classList.add('cold');
        
        if (probLabel) {
          probLabel.textContent = `${prob.historicalProbability}%`;
          probLabel.className = 'prob-label';
          if (prob.isHot) probLabel.classList.add('hot');
          if (prob.isCold) probLabel.classList.add('cold');
        }
      }
      
      void ball.offsetWidth;
      ball.classList.add('animate');
    }
  });
  
  // Update PowerBall
  const powerballContainer = ticketDisplay.querySelector('.powerball-section .ball-container');
  if (powerballContainer) {
    const powerball = powerballContainer.querySelector('.ball');
    const probLabel = powerballContainer.querySelector('.prob-label');
    
    powerball.textContent = ticket.powerball;
    powerball.classList.remove('animate', 'hot', 'cold');
    
    if (ticket.probabilities && ticket.probabilities.powerball) {
      const prob = ticket.probabilities.powerball;
      if (prob.isHot) powerball.classList.add('hot');
      if (prob.isCold) powerball.classList.add('cold');
      
      if (probLabel) {
        probLabel.textContent = `${prob.historicalProbability}%`;
        probLabel.className = 'prob-label';
        if (prob.isHot) probLabel.classList.add('hot');
        if (prob.isCold) probLabel.classList.add('cold');
      }
    }
    
    void powerball.offsetWidth;
    powerball.classList.add('animate');
  }
  
  // Update ticket rating
  const ratingContainer = document.getElementById('ticketRating');
  if (ratingContainer && ticket.probabilities) {
    const { rating, averageStrength } = ticket.probabilities;
    ratingContainer.innerHTML = `
      <span class="rating-label ${rating.class}">${rating.label}</span>
      <span class="rating-value">${averageStrength}%</span>
      <span class="rating-description">${rating.description}</span>
    `;
    ratingContainer.style.display = 'block';
  }
}

function addToHistory(ticket) {
  ticket.index = generatedTickets.length;
  generatedTickets.push(ticket);
  renderHistoryList();
  updateLeaderboard();
}

function createTicketElement(ticket) {
  const historyTicket = document.createElement('div');
  historyTicket.className = 'history-ticket';
  
  if (ticket.probabilities && ticket.probabilities.rating) {
    const ratingBadge = document.createElement('span');
    ratingBadge.className = `rating-badge ${ticket.probabilities.rating.class}`;
    ratingBadge.textContent = ticket.probabilities.averageStrength + '%';
    ratingBadge.title = ticket.probabilities.rating.label;
    historyTicket.appendChild(ratingBadge);
  }
  
  ticket.whiteBalls.forEach((num, index) => {
    const ball = document.createElement('span');
    ball.className = 'mini-ball white';
    
    if (ticket.probabilities && ticket.probabilities.whiteBalls[index]) {
      const prob = ticket.probabilities.whiteBalls[index];
      if (prob.isHot) ball.classList.add('hot');
      if (prob.isCold) ball.classList.add('cold');
    }
    
    ball.textContent = num;
    historyTicket.appendChild(ball);
  });
  
  const separator = document.createElement('span');
  separator.className = 'separator';
  separator.textContent = '|';
  historyTicket.appendChild(separator);
  
  const powerball = document.createElement('span');
  powerball.className = 'mini-ball powerball';
  
  if (ticket.probabilities && ticket.probabilities.powerball) {
    const prob = ticket.probabilities.powerball;
    if (prob.isHot) powerball.classList.add('hot');
    if (prob.isCold) powerball.classList.add('cold');
  }
  
  powerball.textContent = ticket.powerball;
  historyTicket.appendChild(powerball);
  
  return historyTicket;
}

function renderHistoryList() {
  elements.historyList.innerHTML = '';
  
  if (generatedTickets.length === 0) {
    elements.historyList.innerHTML = '<div class="empty-history">Generate tickets to see them here</div>';
    return;
  }
  
  const sortedTickets = getSortedTickets();
  const maxHistory = 50;
  const ticketsToShow = sortedTickets.slice(0, maxHistory);
  
  ticketsToShow.forEach(ticket => {
    const element = createTicketElement(ticket);
    elements.historyList.appendChild(element);
  });
}

function getSortedTickets() {
  const tickets = [...generatedTickets];
  
  switch (currentSort) {
    case 'hot':
      return tickets.sort((a, b) => {
        const aStrength = a.probabilities ? parseFloat(a.probabilities.averageStrength) : 0;
        const bStrength = b.probabilities ? parseFloat(b.probabilities.averageStrength) : 0;
        return bStrength - aStrength;
      });
    
    case 'cold':
      return tickets.sort((a, b) => {
        const aStrength = a.probabilities ? parseFloat(a.probabilities.averageStrength) : 0;
        const bStrength = b.probabilities ? parseFloat(b.probabilities.averageStrength) : 0;
        return aStrength - bStrength;
      });
    
    case 'newest':
    default:
      return tickets.sort((a, b) => b.index - a.index);
  }
}

function sortTickets(sortMode) {
  currentSort = sortMode;
  
  elements.sortNewest.classList.remove('active');
  elements.sortHot.classList.remove('active');
  elements.sortCold.classList.remove('active');
  
  switch (sortMode) {
    case 'hot':
      elements.sortHot.classList.add('active');
      break;
    case 'cold':
      elements.sortCold.classList.add('active');
      break;
    case 'newest':
    default:
      elements.sortNewest.classList.add('active');
      break;
  }
  
  renderHistoryList();
}

function updateLeaderboard() {
  if (generatedTickets.length === 0) {
    elements.leaderboard.style.display = 'none';
    return;
  }
  
  elements.leaderboard.style.display = 'flex';
  
  let hottest = null;
  let coldest = null;
  let hottestStrength = -Infinity;
  let coldestStrength = Infinity;
  
  for (const ticket of generatedTickets) {
    if (ticket.probabilities) {
      const strength = parseFloat(ticket.probabilities.averageStrength);
      
      if (strength > hottestStrength) {
        hottestStrength = strength;
        hottest = ticket;
      }
      
      if (strength < coldestStrength) {
        coldestStrength = strength;
        coldest = ticket;
      }
    }
  }
  
  if (hottest) {
    elements.hottestTicket.innerHTML = '';
    elements.hottestTicket.appendChild(createLeaderboardTicket(hottest));
  }
  
  if (coldest) {
    elements.coldestTicket.innerHTML = '';
    elements.coldestTicket.appendChild(createLeaderboardTicket(coldest));
  }
}

function createLeaderboardTicket(ticket) {
  const container = document.createElement('div');
  container.className = 'leaderboard-ticket-content';
  
  if (ticket.probabilities && ticket.probabilities.rating) {
    const ratingBadge = document.createElement('span');
    ratingBadge.className = `rating-badge ${ticket.probabilities.rating.class}`;
    ratingBadge.textContent = ticket.probabilities.averageStrength + '%';
    container.appendChild(ratingBadge);
  }
  
  const ballsContainer = document.createElement('div');
  ballsContainer.className = 'leaderboard-balls';
  
  ticket.whiteBalls.forEach((num, index) => {
    const ball = document.createElement('div');
    ball.className = 'ball white';
    
    if (ticket.probabilities && ticket.probabilities.whiteBalls[index]) {
      const prob = ticket.probabilities.whiteBalls[index];
      if (prob.isHot) ball.classList.add('hot');
      if (prob.isCold) ball.classList.add('cold');
    }
    
    ball.textContent = num;
    ballsContainer.appendChild(ball);
  });
  
  const separator = document.createElement('span');
  separator.className = 'separator';
  separator.textContent = '|';
  ballsContainer.appendChild(separator);
  
  const powerball = document.createElement('div');
  powerball.className = 'ball powerball';
  
  if (ticket.probabilities && ticket.probabilities.powerball) {
    const prob = ticket.probabilities.powerball;
    if (prob.isHot) powerball.classList.add('hot');
    if (prob.isCold) powerball.classList.add('cold');
  }
  
  powerball.textContent = ticket.powerball;
  ballsContainer.appendChild(powerball);
  
  container.appendChild(ballsContainer);
  
  return container;
}

function updateStats() {
  elements.ticketCountStat.textContent = session.getTotalCount().toLocaleString();
  elements.uniqueCountStat.textContent = session.getUniqueCount().toLocaleString();
  elements.historyCount.textContent = `(${session.getTotalCount()})`;
}

// ============================================
// UI Helpers
// ============================================
function updateDataStatus(status, text) {
  const indicator = elements.dataStatus.querySelector('.status-indicator');
  const statusText = elements.dataStatus.querySelector('.status-text');
  
  indicator.classList.remove('loading', 'error');
  
  if (status === 'loading') {
    indicator.classList.add('loading');
  } else if (status === 'error') {
    indicator.classList.add('error');
  }
  
  statusText.textContent = text;
}

function showError(message) {
  elements.errorText.textContent = message;
  elements.errorContainer.style.display = 'block';
  setTimeout(hideError, 10000);
}

function hideError() {
  elements.errorContainer.style.display = 'none';
}

function showSuccess(message) {
  elements.successText.textContent = message;
  elements.successContainer.style.display = 'block';
  setTimeout(hideSuccess, 5000);
}

function hideSuccess() {
  elements.successContainer.style.display = 'none';
}

// ============================================
// Add Drawing Form
// ============================================
function toggleAddDrawingForm() {
  isFormExpanded = !isFormExpanded;
  
  if (isFormExpanded) {
    elements.addDrawingForm.classList.add('expanded');
    elements.toggleIcon.textContent = '▲';
  } else {
    elements.addDrawingForm.classList.remove('expanded');
    elements.toggleIcon.textContent = '▼';
  }
}


function toggleRatingGuide() {
  isGuideExpanded = !isGuideExpanded;
  
  if (isGuideExpanded) {
    elements.ratingGuideContent.classList.add('expanded');
    elements.guideToggleIcon.textContent = '▲';
  } else {
    elements.ratingGuideContent.classList.remove('expanded');
    elements.guideToggleIcon.textContent = '▼';
  }
}

function formatDateInput(e) {
  let value = e.target.value.replace(/\D/g, '');
  
  if (value.length > 2) {
    value = value.slice(0, 2) + '/' + value.slice(2);
  }
  if (value.length > 5) {
    value = value.slice(0, 5) + '/' + value.slice(5, 9);
  }
  
  e.target.value = value;
}

function validateBallInput(input, min, max) {
  const value = parseInt(input.value, 10);
  
  if (input.value && (isNaN(value) || value < min || value > max)) {
    input.classList.add('invalid');
  } else {
    input.classList.remove('invalid');
  }
}

async function handleAddDrawing() {
  const date = elements.drawingDate.value.trim();
  const whiteBalls = [
    elements.wb1.value,
    elements.wb2.value,
    elements.wb3.value,
    elements.wb4.value,
    elements.wb5.value
  ].filter(v => v !== '').map(v => parseInt(v, 10));
  const powerball = parseInt(elements.pbInput.value, 10);
  
  // Validation
  if (!date || !/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(date)) {
    showFormMessage('Please enter a valid date (MM/DD/YYYY).', 'error');
    return;
  }
  
  if (whiteBalls.length !== 5) {
    showFormMessage('Please enter all 5 white ball numbers.', 'error');
    return;
  }
  
  for (const ball of whiteBalls) {
    if (isNaN(ball) || ball < 1 || ball > 69) {
      showFormMessage('White balls must be between 1 and 69.', 'error');
      return;
    }
  }
  
  if (new Set(whiteBalls).size !== 5) {
    showFormMessage('White balls must be unique.', 'error');
    return;
  }
  
  if (isNaN(powerball) || powerball < 1 || powerball > 26) {
    showFormMessage('PowerBall must be between 1 and 26.', 'error');
    return;
  }
  
  // Check for duplicate date
  if (drawings.some(d => d.date === date)) {
    showFormMessage(`A drawing for ${date} already exists.`, 'error');
    return;
  }
  
  // Create new drawing
  const newDrawing = {
    date,
    whiteBalls: whiteBalls.sort((a, b) => a - b),
    powerball
  };
  
  // Save to localStorage
  if (!saveUserDrawing(newDrawing)) {
    showFormMessage('Failed to save drawing.', 'error');
    return;
  }
  
  // Update local data
  drawings.unshift(newDrawing);
  frequencyData = window.FrequencyAnalyzer.analyzeFrequency(drawings);
  
  // Update cache with new data
  const currentVersion = window.DATA_VERSION || '1.0.0';
  try {
    await window.IndexedDBCache.saveCache({
      drawings: drawings,
      frequencyData: frequencyData
    }, currentVersion);
  } catch (cacheError) {
    console.warn('Failed to update cache (non-critical):', cacheError);
  }
  
  // Update UI
  elements.drawingCountStat.textContent = drawings.length.toLocaleString();
  elements.latestDateStat.textContent = date;
  updateDataStatus('success', `${drawings.length} drawings loaded`);
  
  // Display last updated date (source of truth - doesn't change with user additions)
  const lastUpdated = window.DATA_LAST_UPDATED || '12/15/2025';
  elements.dataLastUpdatedStat.textContent = lastUpdated;
  
  showSuccess(`Drawing for ${date} added successfully!`);
  showFormMessage(`Drawing for ${date} added!`, 'success');
  clearDrawingForm();
}

function clearDrawingForm() {
  elements.drawingDate.value = '';
  elements.wb1.value = '';
  elements.wb2.value = '';
  elements.wb3.value = '';
  elements.wb4.value = '';
  elements.wb5.value = '';
  elements.pbInput.value = '';
  
  const inputs = [elements.wb1, elements.wb2, elements.wb3, elements.wb4, elements.wb5, elements.pbInput];
  inputs.forEach(input => input.classList.remove('invalid'));
  
  elements.formMessage.style.display = 'none';
}

function showFormMessage(message, type) {
  elements.formMessage.textContent = message;
  elements.formMessage.className = `form-message ${type}`;
  elements.formMessage.style.display = 'block';
  
  if (type === 'success') {
    setTimeout(() => {
      elements.formMessage.style.display = 'none';
    }, 3000);
  }
}

// ============================================

function resetToDefaultData() {
  if (!confirm('This will clear all user-added drawings and reset to the default data. Continue?')) {
    return;
  }
  
  clearUserDrawings();
  
  // Reload with just embedded data
  const result = window.DataParser.parseDataContent(window.POWERBALL_RAW_DATA);
  drawings = result.drawings;
  frequencyData = window.FrequencyAnalyzer.analyzeFrequency(drawings);
  
  // Update cache
  const currentVersion = window.DATA_VERSION || '1.0.0';
  window.IndexedDBCache.saveCache({
    drawings: drawings,
    frequencyData: frequencyData
  }, currentVersion).catch(cacheError => {
    console.warn('Failed to update cache (non-critical):', cacheError);
  });
  
  // Update UI
  elements.drawingCountStat.textContent = drawings.length.toLocaleString();
  if (drawings.length > 0) {
    elements.latestDateStat.textContent = drawings[0].date;
  }
  updateDataStatus('success', `${drawings.length} drawings loaded`);
  
  // Display last updated date (source of truth)
  const lastUpdated = window.DATA_LAST_UPDATED || '12/15/2025';
  elements.dataLastUpdatedStat.textContent = lastUpdated;
  
  showSuccess('Data reset to default!');
}

// ============================================
// Initialize on DOM Ready
// ============================================
document.addEventListener('DOMContentLoaded', init);

