# Hosting Your Download Page

## Quick Setup

### Step 1: Build Your App
```bash
npm run build:win
```

### Step 2: Prepare Files for Coolify

**Option A: Use the automated script (Recommended)**
```bash
npm run prepare:coolify
```
This will create a `coolify-deploy/` folder with:
- `index.html` (renamed from download-page.html)
- `PowerBall Lottery Generator Setup.exe`

**Option B: Manual preparation**
1. Create a folder (e.g., `download-site`)
2. Copy `download-page.html` to this folder (rename to `index.html`)
3. Copy `PowerBall Lottery Generator Setup.exe` from the `dist` folder to the same location
4. Make sure both files are in the same folder

### Step 3: Host It

## Option 1: Coolify (Hostinger VPS) - Recommended for You

1. **In Coolify Dashboard:**
   - Click "New Resource" → "Static Site"
   - Or use "Quick Deploy" if available

2. **Configure the Static Site:**
   - **Name**: `powerball-generator` (or your choice)
   - **Source**: 
     - If using Git: Connect your repo and set build command to `echo "No build needed"`
     - If using local files: Upload the folder via SFTP/SSH to your VPS
   - **Port**: Leave default (usually 80/443)
   - **Domain**: Your Coolify subdomain (e.g., `powerball.yourdomain.com`)

3. **File Structure:**
   ```
   coolify-deploy/  (or your chosen folder)
   ├── index.html
   └── PowerBall Lottery Generator Setup.exe
   ```
   
   **Quick setup:** Run `npm run prepare:coolify` to create this folder automatically!

4. **If using Git:**
   - Create a repository with both files
   - Connect to Coolify
   - Set build command: `echo "Static site - no build needed"`
   - Set publish directory: `/` (root)

5. **If uploading directly:**
   - Use SFTP/SSH to upload files to your VPS
   - Point Coolify to that directory
   - Or use Coolify's file manager if available

6. **Important Settings:**
   - Enable HTTPS (Coolify usually does this automatically)
   - Make sure `.exe` files are allowed (may need to configure MIME types)
   - Set proper file permissions (644 for files, 755 for directories)

7. **Test the Download:**
   - Visit your subdomain
   - Click the download button
   - Should download the .exe file

**Troubleshooting:**
- If download doesn't work, check Nginx/Caddy config in Coolify
- May need to add `.exe` to allowed file types
- Ensure file size limits allow ~150MB downloads

## Option 1: GitHub Pages (Free & Easy)

1. **Create a GitHub repository** (or use existing one)
2. **Upload both files** to the repository:
   - `download-page.html` (rename to `index.html`)
   - `PowerBall Lottery Generator Setup.exe`
3. **Enable GitHub Pages**:
   - Go to Settings → Pages
   - Select branch (usually `main`)
   - Save
4. **Your link will be**: `https://yourusername.github.io/repository-name/`

**Note:** GitHub Pages has a 100MB file limit. If your .exe is larger, use Option 2 or 3.

## Option 2: Netlify Drop (Free & No Account Needed)

1. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
2. Drag and drop the folder containing:
   - `download-page.html` (rename to `index.html`)
   - `PowerBall Lottery Generator Setup.exe`
3. Get instant link to share!

## Option 3: Simple Web Server

If you have web hosting:
1. Upload both files via FTP
2. Access via: `https://yourdomain.com/download-page.html`

## Option 4: Google Drive / OneDrive

1. Upload the `.exe` file to Google Drive or OneDrive
2. Get a shareable link
3. Update the download button in `download-page.html`:
   ```html
   <a href="YOUR_DRIVE_LINK_HERE" class="download-btn" download>
   ```

## Customizing the Page

Edit `download-page.html` to:
- Change the download link URL
- Update version number
- Add your name/contact info
- Customize colors/styling

## File Size Note

If your `.exe` is over 100MB:
- Use Netlify Drop (no size limit)
- Or use Google Drive/OneDrive and link to it
- Or use a file hosting service like MediaFire

