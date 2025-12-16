/**
 * Ticket Generator Module
 * Generates PowerBall tickets using weighted random selection
 */

// Total possible combinations: C(69,5) * 26 = 292,201,338
const TOTAL_COMBINATIONS = 292201338;

/**
 * Weighted random selection of a single number
 * @param {object} frequencies - Object mapping numbers to their frequencies
 * @param {Set} exclude - Set of numbers to exclude from selection
 * @returns {number} - Selected number
 */
function weightedRandomSelect(frequencies, exclude = new Set()) {
  // Build array of available numbers and their weights
  const available = [];
  let totalWeight = 0;

  for (const [numStr, freq] of Object.entries(frequencies)) {
    const num = parseInt(numStr, 10);
    if (!exclude.has(num)) {
      // Use frequency as weight (linear weighting)
      // Add small base weight to ensure numbers with 0 frequency can still be selected
      const weight = freq + 1;
      available.push({ number: num, weight });
      totalWeight += weight;
    }
  }

  if (available.length === 0) {
    throw new Error('No numbers available for selection');
  }

  // Generate random value between 0 and totalWeight
  let random = Math.random() * totalWeight;

  // Find the selected number
  for (const item of available) {
    random -= item.weight;
    if (random <= 0) {
      return item.number;
    }
  }

  // Fallback to last item (shouldn't happen, but just in case)
  return available[available.length - 1].number;
}

/**
 * Calculate probability statistics for a number
 * @param {number} number - The ball number
 * @param {object} frequencies - Frequency object
 * @param {number} totalDraws - Total number of draws
 * @param {number} maxNumber - Maximum possible number (69 for white, 26 for powerball)
 * @returns {object} - Probability data
 */
function calculateProbability(number, frequencies, totalDraws, maxNumber) {
  const frequency = frequencies[number] || 0;
  
  // Historical probability: how often this number has appeared
  const historicalProbability = totalDraws > 0 ? (frequency / totalDraws) * 100 : 0;
  
  // Expected probability: if all numbers were equally likely
  const expectedProbability = (1 / maxNumber) * 100;
  
  // Relative strength: how much more/less likely than expected
  // > 100% means appears more often than expected, < 100% means less often
  const relativeStrength = expectedProbability > 0 ? (historicalProbability / expectedProbability) * 100 : 0;
  
  // Rank among all numbers (1 = most frequent)
  const sortedNumbers = Object.entries(frequencies)
    .map(([n, f]) => ({ number: parseInt(n, 10), frequency: f }))
    .sort((a, b) => b.frequency - a.frequency);
  
  const rank = sortedNumbers.findIndex(item => item.number === number) + 1;
  
  return {
    frequency,
    historicalProbability: historicalProbability.toFixed(2),
    expectedProbability: expectedProbability.toFixed(2),
    relativeStrength: relativeStrength.toFixed(1),
    rank,
    totalNumbers: maxNumber,
    isHot: relativeStrength > 105, // More than 5% above expected
    isCold: relativeStrength < 95   // More than 5% below expected
  };
}

/**
 * Generate a single PowerBall ticket with probability data
 * @param {object} frequencyData - Frequency data from analyzeFrequency
 * @returns {object} - Generated ticket with whiteBalls, powerball, and probabilities
 */
function generateTicket(frequencyData) {
  const { 
    whiteBallFrequencies, 
    powerballFrequencies,
    totalDrawings,
    totalWhiteBallDraws
  } = frequencyData;
  
  // Select 5 unique white balls
  const whiteBalls = [];
  const selected = new Set();

  for (let i = 0; i < 5; i++) {
    const ball = weightedRandomSelect(whiteBallFrequencies, selected);
    whiteBalls.push(ball);
    selected.add(ball);
  }

  // Sort white balls in ascending order
  whiteBalls.sort((a, b) => a - b);

  // Select PowerBall
  const powerball = weightedRandomSelect(powerballFrequencies);

  // Calculate probabilities for each number
  const whiteBallProbabilities = whiteBalls.map(num => ({
    number: num,
    ...calculateProbability(num, whiteBallFrequencies, totalWhiteBallDraws, 69)
  }));

  const powerballProbability = {
    number: powerball,
    ...calculateProbability(powerball, powerballFrequencies, totalDrawings, 26)
  };

  // Calculate overall ticket score (average relative strength)
  const allStrengths = [
    ...whiteBallProbabilities.map(p => parseFloat(p.relativeStrength)),
    parseFloat(powerballProbability.relativeStrength)
  ];
  const averageStrength = allStrengths.reduce((a, b) => a + b, 0) / allStrengths.length;

  // Calculate ticket rating based on combined probabilities
  const ticketRating = getTicketRating(averageStrength);

  return {
    whiteBalls,
    powerball,
    probabilities: {
      whiteBalls: whiteBallProbabilities,
      powerball: powerballProbability,
      averageStrength: averageStrength.toFixed(1),
      rating: ticketRating
    },
    timestamp: new Date().toISOString()
  };
}

/**
 * Get a rating label based on average strength
 * @param {number} averageStrength - Average relative strength percentage
 * @returns {object} - Rating object with label and description
 */
function getTicketRating(averageStrength) {
  if (averageStrength >= 115) {
    return { label: 'Very Hot', class: 'very-hot', description: 'Numbers appear significantly more often than expected' };
  } else if (averageStrength >= 105) {
    return { label: 'Hot', class: 'hot', description: 'Numbers appear more often than expected' };
  } else if (averageStrength >= 95) {
    return { label: 'Average', class: 'average', description: 'Numbers appear at expected frequency' };
  } else if (averageStrength >= 85) {
    return { label: 'Cold', class: 'cold', description: 'Numbers appear less often than expected' };
  } else {
    return { label: 'Very Cold', class: 'very-cold', description: 'Numbers appear significantly less often than expected' };
  }
}

/**
 * Generate multiple PowerBall tickets
 * @param {object} frequencyData - Frequency data from analyzeFrequency
 * @param {number} count - Number of tickets to generate
 * @returns {Array} - Array of generated tickets
 */
function generateMultipleTickets(frequencyData, count = 1) {
  const tickets = [];
  for (let i = 0; i < count; i++) {
    tickets.push(generateTicket(frequencyData));
  }
  return tickets;
}

/**
 * Create a unique key for a ticket combination (for tracking coverage)
 * @param {object} ticket - Ticket object
 * @returns {string} - Unique combination key
 */
function getTicketKey(ticket) {
  // Sort white balls and create a unique string
  const sortedWhite = [...ticket.whiteBalls].sort((a, b) => a - b);
  return `${sortedWhite.join(',')}-${ticket.powerball}`;
}

/**
 * Session tracker for generated tickets
 */
class TicketSession {
  constructor() {
    this.tickets = [];
    this.uniqueCombinations = new Set();
  }

  /**
   * Add a ticket to the session
   * @param {object} ticket - Generated ticket
   */
  addTicket(ticket) {
    this.tickets.push(ticket);
    this.uniqueCombinations.add(getTicketKey(ticket));
  }

  /**
   * Add multiple tickets to the session
   * @param {Array} tickets - Array of generated tickets
   */
  addTickets(tickets) {
    for (const ticket of tickets) {
      this.addTicket(ticket);
    }
  }

  /**
   * Get total tickets generated
   * @returns {number}
   */
  getTotalCount() {
    return this.tickets.length;
  }

  /**
   * Get unique combinations count
   * @returns {number}
   */
  getUniqueCount() {
    return this.uniqueCombinations.size;
  }

  /**
   * Get coverage as a readable string
   * @returns {string} - Formatted coverage string like "5 of 292,201,338"
   */
  getCoveragePercentage() {
    const unique = this.uniqueCombinations.size;
    const total = TOTAL_COMBINATIONS.toLocaleString();
    return `${unique.toLocaleString()} of ${total}`;
  }

  /**
   * Get all tickets
   * @returns {Array}
   */
  getAllTickets() {
    return [...this.tickets];
  }

  /**
   * Reset the session
   */
  reset() {
    this.tickets = [];
    this.uniqueCombinations.clear();
  }
}

module.exports = {
  generateTicket,
  generateMultipleTickets,
  getTicketKey,
  TicketSession,
  TOTAL_COMBINATIONS,
  calculateProbability,
  getTicketRating
};
