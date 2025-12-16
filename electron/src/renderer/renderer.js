/**
 * Renderer Process
 * Handles UI logic and user interactions
 */

// State
let isDataLoaded = false;
let isFormExpanded = false;
let isGuideExpanded = false;
let generatedTickets = []; // Store all generated tickets for sorting
let currentSort = 'newest'; // 'newest', 'hot', 'cold'

// DOM Elements
const elements = {
  generateOneBtn: document.getElementById('generateOneBtn'),
  generateMultiBtn: document.getElementById('generateMultiBtn'),
  ticketCountInput: document.getElementById('ticketCount'),
  latestTicket: document.getElementById('latestTicket'),
  ticketCountStat: document.getElementById('ticketCountStat'),
  uniqueCountStat: document.getElementById('uniqueCountStat'),
  drawingCountStat: document.getElementById('drawingCountStat'),
  latestDateStat: document.getElementById('latestDateStat'),
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
  guideToggleIcon: document.getElementById('guideToggleIcon')
};

/**
 * Initialize the application
 */
async function init() {
  console.log('Initializing PowerBall Generator...');
  
  // Set up event listeners
  setupEventListeners();
  
  // Load data
  await loadData();
}

/**
 * Set up event listeners
 */
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
  
  // Add drawing form event listeners
  elements.addDrawingToggle.addEventListener('click', toggleAddDrawingForm);
  elements.addDrawingBtn.addEventListener('click', handleAddDrawing);
  elements.clearFormBtn.addEventListener('click', clearDrawingForm);
  
  // Auto-format date input
  elements.drawingDate.addEventListener('input', formatDateInput);
  
  // Validate ball inputs on blur
  const ballInputs = [elements.wb1, elements.wb2, elements.wb3, elements.wb4, elements.wb5];
  ballInputs.forEach(input => {
    input.addEventListener('blur', () => validateBallInput(input, 1, 69));
  });
  elements.pbInput.addEventListener('blur', () => validateBallInput(elements.pbInput, 1, 26));
  
  // Sort button event listeners
  elements.sortNewest.addEventListener('click', () => sortTickets('newest'));
  elements.sortHot.addEventListener('click', () => sortTickets('hot'));
  elements.sortCold.addEventListener('click', () => sortTickets('cold'));
  
  // Rating guide toggle
  elements.ratingGuideToggle.addEventListener('click', toggleRatingGuide);
}

/**
 * Load and parse the data file
 */
async function loadData() {
  updateDataStatus('loading', 'Loading data...');
  
  try {
    const result = await window.lottery.loadData();
    
    if (result.errors.length > 0 && result.drawings.length === 0) {
      // Critical error - no data loaded
      updateDataStatus('error', 'Failed to load data');
      showError(result.errors[0]);
      return;
    }
    
    if (result.drawings.length === 0) {
      updateDataStatus('error', 'No valid drawings found');
      showError('The data file contains no valid drawings.');
      return;
    }
    
    isDataLoaded = true;
    
    // Update UI
    updateDataStatus('success', `${result.drawings.length} drawings loaded`);
    elements.drawingCountStat.textContent = result.drawings.length.toLocaleString();
    
    // Get and display latest drawing date
    const latestDate = await window.lottery.getLatestDrawingDate();
    if (latestDate) {
      elements.latestDateStat.textContent = latestDate;
    }
    
    // Enable buttons
    elements.generateOneBtn.disabled = false;
    elements.generateMultiBtn.disabled = false;
    
    // Log any non-critical errors
    if (result.errors.length > 0) {
      console.warn('Some lines could not be parsed:', result.errors);
    }
    
    console.log('Data loaded successfully:', {
      totalDrawings: result.drawings.length,
      totalLines: result.totalLines,
      validLines: result.validLines
    });
    
  } catch (error) {
    updateDataStatus('error', 'Error loading data');
    showError(`Failed to load data: ${error.message}`);
    console.error('Error loading data:', error);
  }
}

/**
 * Generate a single ticket
 */
async function generateSingleTicket() {
  if (!isDataLoaded) {
    showError('Data not loaded. Please wait or refresh the application.');
    return;
  }
  
  try {
    const ticket = await window.lottery.generateTicket();
    displayLatestTicket(ticket);
    addToHistory(ticket);
    await updateStats();
  } catch (error) {
    showError(`Failed to generate ticket: ${error.message}`);
    console.error('Error generating ticket:', error);
  }
}

/**
 * Generate multiple tickets
 */
async function generateMultipleTickets() {
  if (!isDataLoaded) {
    showError('Data not loaded. Please wait or refresh the application.');
    return;
  }
  
  const count = parseInt(elements.ticketCountInput.value, 10) || 5;
  
  try {
    const tickets = await window.lottery.generateMultipleTickets(count);
    
    // Display the last generated ticket as the "latest"
    if (tickets.length > 0) {
      displayLatestTicket(tickets[tickets.length - 1]);
    }
    
    // Add all to history
    for (const ticket of tickets) {
      addToHistory(ticket);
    }
    
    await updateStats();
  } catch (error) {
    showError(`Failed to generate tickets: ${error.message}`);
    console.error('Error generating tickets:', error);
  }
}

/**
 * Display the latest ticket in the main display
 * @param {object} ticket - Generated ticket with probability data
 */
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
      
      // Add hot/cold class based on probability
      if (ticket.probabilities && ticket.probabilities.whiteBalls[index]) {
        const prob = ticket.probabilities.whiteBalls[index];
        if (prob.isHot) ball.classList.add('hot');
        if (prob.isCold) ball.classList.add('cold');
        
        // Update probability label
        if (probLabel) {
          probLabel.textContent = `${prob.historicalProbability}%`;
          probLabel.className = 'prob-label';
          if (prob.isHot) probLabel.classList.add('hot');
          if (prob.isCold) probLabel.classList.add('cold');
        }
      }
      
      // Trigger reflow to restart animation
      void ball.offsetWidth;
      ball.classList.add('animate');
    }
  });
  
  // Update PowerBall with probability
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

/**
 * Add a ticket to the history
 * @param {object} ticket - Generated ticket
 */
function addToHistory(ticket) {
  // Add ticket to the stored array with a timestamp index for sorting
  ticket.index = generatedTickets.length;
  generatedTickets.push(ticket);
  
  // Re-render with current sort
  renderHistoryList();
  
  // Update leaderboard
  updateLeaderboard();
}

/**
 * Create a DOM element for a ticket
 * @param {object} ticket - Ticket data
 * @returns {HTMLElement} - Ticket element
 */
function createTicketElement(ticket) {
  const historyTicket = document.createElement('div');
  historyTicket.className = 'history-ticket';
  
  // Add rating badge if available
  if (ticket.probabilities && ticket.probabilities.rating) {
    const ratingBadge = document.createElement('span');
    ratingBadge.className = `rating-badge ${ticket.probabilities.rating.class}`;
    ratingBadge.textContent = ticket.probabilities.averageStrength + '%';
    ratingBadge.title = ticket.probabilities.rating.label;
    historyTicket.appendChild(ratingBadge);
  }
  
  // Add white balls
  ticket.whiteBalls.forEach((num, index) => {
    const ball = document.createElement('span');
    ball.className = 'mini-ball white';
    
    // Add hot/cold class
    if (ticket.probabilities && ticket.probabilities.whiteBalls[index]) {
      const prob = ticket.probabilities.whiteBalls[index];
      if (prob.isHot) ball.classList.add('hot');
      if (prob.isCold) ball.classList.add('cold');
    }
    
    ball.textContent = num;
    historyTicket.appendChild(ball);
  });
  
  // Add separator
  const separator = document.createElement('span');
  separator.className = 'separator';
  separator.textContent = '|';
  historyTicket.appendChild(separator);
  
  // Add PowerBall
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

/**
 * Render the history list based on current sort
 */
function renderHistoryList() {
  // Clear the list
  elements.historyList.innerHTML = '';
  
  if (generatedTickets.length === 0) {
    elements.historyList.innerHTML = '<div class="empty-history">Generate tickets to see them here</div>';
    return;
  }
  
  // Get sorted tickets
  const sortedTickets = getSortedTickets();
  
  // Limit to max history for display
  const maxHistory = 50;
  const ticketsToShow = sortedTickets.slice(0, maxHistory);
  
  // Render each ticket
  ticketsToShow.forEach(ticket => {
    const element = createTicketElement(ticket);
    elements.historyList.appendChild(element);
  });
}

/**
 * Get tickets sorted by current sort mode
 * @returns {Array} - Sorted tickets array
 */
function getSortedTickets() {
  const tickets = [...generatedTickets];
  
  switch (currentSort) {
    case 'hot':
      // Sort by average strength descending (hottest first)
      return tickets.sort((a, b) => {
        const aStrength = a.probabilities ? parseFloat(a.probabilities.averageStrength) : 0;
        const bStrength = b.probabilities ? parseFloat(b.probabilities.averageStrength) : 0;
        return bStrength - aStrength;
      });
    
    case 'cold':
      // Sort by average strength ascending (coldest first)
      return tickets.sort((a, b) => {
        const aStrength = a.probabilities ? parseFloat(a.probabilities.averageStrength) : 0;
        const bStrength = b.probabilities ? parseFloat(b.probabilities.averageStrength) : 0;
        return aStrength - bStrength;
      });
    
    case 'newest':
    default:
      // Sort by index descending (newest first)
      return tickets.sort((a, b) => b.index - a.index);
  }
}

/**
 * Sort tickets and update display
 * @param {string} sortMode - 'newest', 'hot', or 'cold'
 */
function sortTickets(sortMode) {
  currentSort = sortMode;
  
  // Update button states
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
  
  // Re-render the list
  renderHistoryList();
}

/**
 * Update the leaderboard with hottest and coldest tickets
 */
function updateLeaderboard() {
  if (generatedTickets.length === 0) {
    elements.leaderboard.style.display = 'none';
    return;
  }
  
  // Show leaderboard
  elements.leaderboard.style.display = 'flex';
  
  // Find hottest and coldest tickets
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
  
  // Render hottest ticket
  if (hottest) {
    elements.hottestTicket.innerHTML = '';
    elements.hottestTicket.appendChild(createLeaderboardTicket(hottest));
  }
  
  // Render coldest ticket
  if (coldest) {
    elements.coldestTicket.innerHTML = '';
    elements.coldestTicket.appendChild(createLeaderboardTicket(coldest));
  }
}

/**
 * Create a ticket element for the leaderboard
 * @param {object} ticket - Ticket data
 * @returns {HTMLElement} - Ticket element
 */
function createLeaderboardTicket(ticket) {
  const container = document.createElement('div');
  container.className = 'leaderboard-ticket-content';
  
  // Add rating badge
  if (ticket.probabilities && ticket.probabilities.rating) {
    const ratingBadge = document.createElement('span');
    ratingBadge.className = `rating-badge ${ticket.probabilities.rating.class}`;
    ratingBadge.textContent = ticket.probabilities.averageStrength + '%';
    container.appendChild(ratingBadge);
  }
  
  // Add balls container
  const ballsContainer = document.createElement('div');
  ballsContainer.className = 'leaderboard-balls';
  
  // Add white balls with proper styling
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
  
  // Add separator
  const separator = document.createElement('span');
  separator.className = 'separator';
  separator.textContent = '|';
  ballsContainer.appendChild(separator);
  
  // Add PowerBall with proper styling
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

/**
 * Update session statistics display
 */
async function updateStats() {
  try {
    const stats = await window.lottery.getSessionStats();
    
    elements.ticketCountStat.textContent = stats.totalTickets.toLocaleString();
    elements.uniqueCountStat.textContent = stats.uniqueCombinations.toLocaleString();
    elements.historyCount.textContent = `(${stats.totalTickets})`;
  } catch (error) {
    console.error('Error updating stats:', error);
  }
}

/**
 * Update data status indicator
 * @param {string} status - 'loading', 'success', or 'error'
 * @param {string} text - Status text to display
 */
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

/**
 * Show error message
 * @param {string} message - Error message to display
 */
function showError(message) {
  elements.errorText.textContent = message;
  elements.errorContainer.style.display = 'block';
  
  // Auto-hide after 10 seconds
  setTimeout(hideError, 10000);
}

/**
 * Hide error message
 */
function hideError() {
  elements.errorContainer.style.display = 'none';
}

/**
 * Show success message
 * @param {string} message - Success message to display
 */
function showSuccess(message) {
  elements.successText.textContent = message;
  elements.successContainer.style.display = 'block';
  
  // Auto-hide after 5 seconds
  setTimeout(hideSuccess, 5000);
}

/**
 * Hide success message
 */
function hideSuccess() {
  elements.successContainer.style.display = 'none';
}

// ============================================
// Add Drawing Form Functions
// ============================================

/**
 * Toggle the add drawing form visibility
 */
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

/**
 * Toggle the rating guide visibility
 */
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

/**
 * Format date input as user types
 * @param {Event} e - Input event
 */
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

/**
 * Validate ball input value
 * @param {HTMLInputElement} input - The input element
 * @param {number} min - Minimum valid value
 * @param {number} max - Maximum valid value
 */
function validateBallInput(input, min, max) {
  const value = parseInt(input.value, 10);
  
  if (input.value && (isNaN(value) || value < min || value > max)) {
    input.classList.add('invalid');
  } else {
    input.classList.remove('invalid');
  }
}

/**
 * Handle add drawing form submission
 */
async function handleAddDrawing() {
  // Gather form values
  const date = elements.drawingDate.value.trim();
  const whiteBalls = [
    elements.wb1.value,
    elements.wb2.value,
    elements.wb3.value,
    elements.wb4.value,
    elements.wb5.value
  ].filter(v => v !== '');
  const powerball = elements.pbInput.value;
  
  // Basic validation
  if (!date) {
    showFormMessage('Please enter a drawing date.', 'error');
    return;
  }
  
  if (whiteBalls.length !== 5) {
    showFormMessage('Please enter all 5 white ball numbers.', 'error');
    return;
  }
  
  if (!powerball) {
    showFormMessage('Please enter the PowerBall number.', 'error');
    return;
  }
  
  // Disable button during submission
  elements.addDrawingBtn.disabled = true;
  elements.addDrawingBtn.textContent = 'Saving...';
  
  try {
    const result = await window.lottery.addDrawing({
      date,
      whiteBalls,
      powerball
    });
    
    if (result.success) {
      showSuccess(result.message);
      showFormMessage(result.message, 'success');
      clearDrawingForm();
      
      // Update the drawing count and latest date
      elements.drawingCountStat.textContent = result.totalDrawings.toLocaleString();
      elements.latestDateStat.textContent = date;
      
      // Update data status
      updateDataStatus('success', `${result.totalDrawings} drawings loaded`);
    } else {
      showFormMessage(result.error, 'error');
    }
  } catch (error) {
    showFormMessage(`Error: ${error.message}`, 'error');
    console.error('Error adding drawing:', error);
  } finally {
    elements.addDrawingBtn.disabled = false;
    elements.addDrawingBtn.innerHTML = '<span class="btn-icon">💾</span> Save Drawing';
  }
}

/**
 * Clear the add drawing form
 */
function clearDrawingForm() {
  elements.drawingDate.value = '';
  elements.wb1.value = '';
  elements.wb2.value = '';
  elements.wb3.value = '';
  elements.wb4.value = '';
  elements.wb5.value = '';
  elements.pbInput.value = '';
  
  // Remove any validation styling
  const inputs = [elements.wb1, elements.wb2, elements.wb3, elements.wb4, elements.wb5, elements.pbInput];
  inputs.forEach(input => input.classList.remove('invalid'));
  
  // Hide form message
  elements.formMessage.style.display = 'none';
}

/**
 * Show a message in the form area
 * @param {string} message - Message to display
 * @param {string} type - 'success' or 'error'
 */
function showFormMessage(message, type) {
  elements.formMessage.textContent = message;
  elements.formMessage.className = `form-message ${type}`;
  elements.formMessage.style.display = 'block';
  
  // Auto-hide success messages
  if (type === 'success') {
    setTimeout(() => {
      elements.formMessage.style.display = 'none';
    }, 3000);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
