# Building and Sharing Your PowerBall Generator

## Quick Start - Build for Windows

1. **Install electron-builder** (if not already installed):
   ```bash
   npm install
   ```

2. **Build the Windows executable**:
   ```bash
   npm run build:win
   ```

3. **Find your executable**:
   - The built app will be in the `dist` folder
   - Look for `PowerBall Lottery Generator Setup.exe` (installer) or the portable version

## Sharing Options

### Option 1: Share the Installer (Recommended)
- Share the `.exe` installer file from the `dist` folder
- Friends can install it like any Windows program
- Creates desktop shortcuts automatically

### Option 2: Share the Portable Version
- Look for the unpacked folder in `dist/win-unpacked/`
- Zip it up and share
- Friends can run it directly without installing

### Option 3: Share via Cloud Storage
- Upload the installer to Google Drive, Dropbox, or OneDrive
- Share the download link with friends

## What Gets Included

The build includes:
- ✅ All your source code
- ✅ The data file (`Powerball_12_16_2025.txt`)
- ✅ All dependencies
- ✅ Everything needed to run the app

## Notes

- The first build might take a few minutes
- The installer will be ~100-150 MB (Electron includes Chromium)
- Friends don't need Node.js installed - it's all bundled!

## Troubleshooting

If you get an error about missing icon:
- The app will still build, just without a custom icon
- You can add an icon later by creating `build/icon.ico` (256x256 pixels)

