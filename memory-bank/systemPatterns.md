# System Patterns

## Architecture
```
Electron App
├── Main Process (main.js)
│   └── Window management, file path resolution
├── Preload Script (preload.js)
│   └── Secure IPC bridge between main and renderer
├── Renderer Process (renderer.js)
│   └── UI logic, event handling
└── Core Modules
    ├── dataParser.js - File parsing
    ├── frequencyAnalyzer.js - Frequency counting
    └── ticketGenerator.js - Weighted random selection
```

## Data Flow
```
Data File → Parser → Frequency Analyzer → Ticket Generator → UI Display
```

## Key Patterns

### Weighted Random Selection (Linear)
1. Calculate sum of all frequencies
2. Generate random number between 0 and sum
3. Iterate through numbers, accumulating frequency until random value is reached
4. For white balls: Remove selected number from pool before next selection

### Session State Management
- All state stored in renderer process memory
- Generated tickets array
- Unique combinations Set for coverage tracking
- Resets on app restart (no persistence)

### Error Handling
- Graceful degradation for parsing errors
- User-friendly error messages in UI
- App should never crash on bad data

