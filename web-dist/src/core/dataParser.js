/**
 * Data Parser Module (Web Version)
 * Parses historical PowerBall drawing data from text content
 */

/**
 * Parse a single line of PowerBall data
 * Expected format: "Date; white1,white2,white3,white4,white5; Powerball: PB"
 * @param {string} line - A single line from the data file
 * @returns {object|null} - Parsed drawing object or null if invalid
 */
function parseLine(line) {
  // Skip empty lines
  if (!line || line.trim() === '') {
    return null;
  }

  // Skip header line
  if (line.toLowerCase().includes('results for powerball')) {
    return null;
  }

  // Skip disclaimer lines
  if (line.toLowerCase().includes('information') || line.toLowerCase().includes('accuracy')) {
    return null;
  }

  try {
    // Split by semicolon
    const parts = line.split(';').map(p => p.trim());
    
    if (parts.length !== 3) {
      return null;
    }

    const date = parts[0];
    const whiteBallsStr = parts[1];
    const powerballStr = parts[2];

    // Parse white balls (comma-separated)
    const whiteBalls = whiteBallsStr.split(',').map(n => parseInt(n.trim(), 10));
    
    if (whiteBalls.length !== 5) {
      return null;
    }

    // Validate white ball range (1-69)
    for (const ball of whiteBalls) {
      if (isNaN(ball) || ball < 1 || ball > 69) {
        return null;
      }
    }

    // Check for duplicate white balls
    const uniqueWhiteBalls = new Set(whiteBalls);
    if (uniqueWhiteBalls.size !== 5) {
      return null;
    }

    // Parse PowerBall
    const powerballMatch = powerballStr.match(/Powerball:\s*(\d+)/i);
    if (!powerballMatch) {
      return null;
    }

    const powerball = parseInt(powerballMatch[1], 10);
    
    // Validate PowerBall range (1-26, but allow some historical higher values)
    if (isNaN(powerball) || powerball < 1 || powerball > 39) {
      return null;
    }

    return {
      date,
      whiteBalls: whiteBalls.sort((a, b) => a - b),
      powerball
    };
  } catch (error) {
    console.warn(`Failed to parse line: ${line}`, error);
    return null;
  }
}

/**
 * Parse PowerBall data from text content
 * @param {string} content - Text content of the data file
 * @returns {object} - Object with drawings array and any errors
 */
function parseDataContent(content) {
  const result = {
    drawings: [],
    errors: [],
    totalLines: 0,
    validLines: 0
  };

  try {
    const lines = content.split('\n');
    result.totalLines = lines.length;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line) continue;

      const drawing = parseLine(line);
      
      if (drawing) {
        result.drawings.push(drawing);
        result.validLines++;
      } else if (!line.toLowerCase().includes('results for powerball') && 
                 !line.toLowerCase().includes('information') &&
                 !line.toLowerCase().includes('accuracy')) {
        result.errors.push(`Line ${i + 1}: Invalid format`);
      }
    }

    return result;
  } catch (error) {
    result.errors.push(`Failed to parse content: ${error.message}`);
    return result;
  }
}

// Export for use in browser
window.DataParser = {
  parseLine,
  parseDataContent
};

