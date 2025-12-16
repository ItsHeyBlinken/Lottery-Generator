# PowerBall Lottery Generator

A personal-use desktop application that analyzes historical PowerBall drawing data and generates suggested number combinations using frequency-based logic.

## ⚠️ Disclaimer

**Lottery drawings are random. This tool does not improve odds or guarantee wins. For entertainment and learning purposes only.**

## Features

- **Frequency Analysis**: Analyzes historical PowerBall data to identify frequently drawn numbers
- **Weighted Random Selection**: Generates tickets using linear weighted randomness based on historical frequency
- **Session Statistics**: Tracks generated tickets, unique combinations, and coverage percentage
- **Multiple Ticket Generation**: Generate single or multiple tickets at once
- **Clean Desktop UI**: Modern, responsive interface built with Electron

## PowerBall Rules

- **White Balls**: 5 numbers from 1-69 (no duplicates)
- **PowerBall**: 1 number from 1-26
- **Total Combinations**: 292,201,338

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- npm (comes with Node.js)

### Setup

1. Clone or download this repository
2. Install dependencies:

```bash
npm install
```

3. Run the application:

```bash
npm start
```

### Development Mode

To run with DevTools open:

```bash
npm run dev
```

## Project Structure

```
lottery-generator/
├── memory-bank/           # Project documentation
├── src/
│   ├── main/              # Electron main process
│   │   ├── main.js        # Window management
│   │   └── preload.js     # Secure IPC bridge
│   ├── renderer/          # UI code
│   │   ├── index.html     # Main HTML
│   │   ├── styles.css     # Styling
│   │   └── renderer.js    # UI logic
│   └── core/              # Business logic
│       ├── dataParser.js  # Parse data file
│       ├── frequencyAnalyzer.js  # Frequency counting
│       └── ticketGenerator.js    # Weighted selection
├── data/
│   └── Powerball_12_16_2025.txt  # Historical data
├── package.json
└── README.md
```

## Data File Format

The data file should follow this format:

```
Results for Powerball
12/15/2025; 23,35,59,63,68; Powerball: 2
12/13/2025; 1,28,31,57,58; Powerball: 16
...
```

Each line contains:
- Date
- 5 white ball numbers (comma-separated)
- PowerBall number

## How It Works

1. **Data Loading**: On startup, the app reads and parses the historical data file
2. **Frequency Analysis**: Counts how often each number appears in historical drawings
3. **Weighted Selection**: Uses linear weighted random selection where higher frequency numbers have proportionally higher chances of being selected
4. **Ticket Generation**: Generates valid PowerBall tickets following all rules (5 unique white balls + 1 PowerBall)

## Technical Notes

- Built with Electron 28.x
- Uses context isolation and secure IPC for renderer-main communication
- Session data is stored in memory only (no persistence)
- Coverage percentage shows what fraction of all 292,201,338 possible combinations have been generated

## License

MIT

