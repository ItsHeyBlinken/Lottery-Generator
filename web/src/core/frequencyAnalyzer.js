/**
 * Frequency Analyzer Module (Web Version)
 * Counts appearances of each number in historical drawings
 */

/**
 * Analyze frequency of white balls and PowerBall numbers
 * @param {Array} drawings - Array of drawing objects
 * @returns {object} - Frequency data for white balls and PowerBall
 */
function analyzeFrequency(drawings) {
  // Initialize frequency objects
  // White balls: 1-69
  const whiteBallFrequencies = {};
  for (let i = 1; i <= 69; i++) {
    whiteBallFrequencies[i] = 0;
  }

  // PowerBall: 1-26
  const powerballFrequencies = {};
  for (let i = 1; i <= 26; i++) {
    powerballFrequencies[i] = 0;
  }

  // Count frequencies
  for (const drawing of drawings) {
    // Count white balls
    for (const ball of drawing.whiteBalls) {
      if (ball >= 1 && ball <= 69) {
        whiteBallFrequencies[ball]++;
      }
    }

    // Count PowerBall
    if (drawing.powerball >= 1 && drawing.powerball <= 26) {
      powerballFrequencies[drawing.powerball]++;
    }
  }

  // Calculate totals
  const totalWhiteBallDraws = drawings.length * 5;
  const totalPowerballDraws = drawings.length;

  // Calculate sum of all frequencies (for weighted selection)
  let whiteBallFrequencySum = 0;
  for (let i = 1; i <= 69; i++) {
    whiteBallFrequencySum += whiteBallFrequencies[i];
  }

  let powerballFrequencySum = 0;
  for (let i = 1; i <= 26; i++) {
    powerballFrequencySum += powerballFrequencies[i];
  }

  return {
    whiteBallFrequencies,
    powerballFrequencies,
    totalDrawings: drawings.length,
    totalWhiteBallDraws,
    totalPowerballDraws,
    whiteBallFrequencySum,
    powerballFrequencySum
  };
}

/**
 * Get sorted list of numbers by frequency (highest first)
 * @param {object} frequencies - Frequency object (number -> count)
 * @returns {Array} - Array of {number, count} sorted by count descending
 */
function getSortedByFrequency(frequencies) {
  return Object.entries(frequencies)
    .map(([number, count]) => ({ number: parseInt(number, 10), count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Get the most frequent numbers (hot numbers)
 * @param {object} frequencies - Frequency object
 * @param {number} count - How many to return
 * @returns {Array} - Array of {number, count}
 */
function getHotNumbers(frequencies, count = 10) {
  return getSortedByFrequency(frequencies).slice(0, count);
}

/**
 * Get the least frequent numbers (cold numbers)
 * @param {object} frequencies - Frequency object
 * @param {number} count - How many to return
 * @returns {Array} - Array of {number, count}
 */
function getColdNumbers(frequencies, count = 10) {
  return getSortedByFrequency(frequencies).slice(-count).reverse();
}

// Export for use in browser
window.FrequencyAnalyzer = {
  analyzeFrequency,
  getSortedByFrequency,
  getHotNumbers,
  getColdNumbers
};

