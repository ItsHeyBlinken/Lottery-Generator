# Git Hooks Setup

This project uses [Husky](https://typicode.github.io/husky/) to automatically run the web rebuild script before each commit.

## Setup

1. **Initialize Git** (if not already done):
   ```bash
   git init
   ```

2. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

3. **Configure Git hooks**:
   ```bash
   git config core.hooksPath .husky
   ```

   This is a one-time setup. The hooks are now active!

## How It Works

When you commit changes, the pre-commit hook will:
1. Automatically run `npm run rebuild` in the `web/` directory
2. Regenerate the data file with all drawings
3. Build the web app to `web-dist/`
4. Stage the `web-dist/` folder for commit

This ensures that your GitHub repository always has the latest built version of the web app.

## Manual Rebuild

You can still manually rebuild at any time:
```bash
npm run web:rebuild
# or
cd web && npm run rebuild
```

## Troubleshooting

If hooks aren't running:
1. Make sure Git is initialized: `git init`
2. Run `npm run prepare` to set up hooks
3. Check that `.husky/pre-commit` exists and is executable

