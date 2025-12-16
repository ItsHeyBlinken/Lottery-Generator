# Tech Context

## Technology Stack
- **Runtime**: Electron 28.x (Chromium + Node.js)
- **Language**: JavaScript (ES6+)
- **UI**: HTML5 + CSS3 (vanilla, no frameworks)
- **Build**: npm scripts

## Project Structure
```
lottery-generator/
├── memory-bank/           # Project documentation
├── src/
│   ├── main/              # Electron main process
│   │   ├── main.js
│   │   └── preload.js
│   ├── renderer/          # UI code
│   │   ├── index.html
│   │   ├── styles.css
│   │   └── renderer.js
│   └── core/              # Business logic
│       ├── dataParser.js
│       ├── frequencyAnalyzer.js
│       └── ticketGenerator.js
├── data/
│   └── Powerball_12_16_2025.txt
├── package.json
└── README.md
```

## Dependencies
- electron: ^28.0.0 (dev dependency)

## Data Format
Input file format (semicolon-separated):
```
Results for Powerball
12/15/2025; 23,35,59,63,68; Powerball: 2
```

## PowerBall Rules
- 5 white balls: range 1-69, no duplicates
- 1 PowerBall: range 1-26
- Total combinations: C(69,5) × 26 = 292,201,338

## Running the App
```bash
npm install
npm start
```

