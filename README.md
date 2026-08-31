# LumenOS

A portable, browser-based desktop OS experience. **Pure HTML/CSS/JS** — no Node, no npm, no build step. Zip it, share it, open `index.html` and go.

## How to run

### On your PC (or a friend's)
1. Unzip the folder.
2. Double-click **`index.html`**.
3. First boot: set your name + avatar color → desktop fades in.

Works in any modern browser (Chrome, Edge, Firefox, Safari).

> Your files live in the browser's `localStorage` — per-browser, per-device. Clearing site data wipes them. Sample media shipped in `assets/` stays there (referenced by path, not copied into storage).

### Deploy to Vercel
Zero config — it's a static site.

**Drag-and-drop:**
1. Go to https://vercel.com/new
2. Drag this folder onto the page.
3. Deploy.

**Vercel CLI:**
```bash
npx vercel --prod
```
Accept all defaults. No framework, no build command.

A `vercel.json` is included for clean URLs.

**GitHub Pages / Netlify / Cloudflare Pages:** all work the same way — just serve the folder.

## Features

### Login & users
- **First-boot setup** prompts for your name + avatar color.
- **Multi-user** — login screen shows all users; right-click a user to remove.
- **"New user"** adds another account.
- **Sign out** from Start menu.
- Animated background on login.

### Built-in apps

- **AI Assistant** — chat helper. Works offline (rule-based + action commands like `open paint`, `set wallpaper ferrari`, `dark mode`). Add an OpenAI / Anthropic / Gemini API key (⚙) for full AI answers.
- **File Explorer** — browse, rename, delete, create files/folders. Right-click an image → **Set as wallpaper**.
- **Notepad** — plain-text editing.
- **Code Editor** — JS/HTML/CSS/JSON syntax highlighting with line numbers.
- **Calculator** — keyboard & mouse.
- **Paint** — icon toolbar (brush, eraser, undo, clear, color, size, save), hover highlights, large default canvas (1600×1000).
- **Media Player** — images, videos (MP4/WEBM/OGG), audio. Opens files from VFS (including sample cars, sunset, spider-man, crazy frog video) or any URL.
- **Browser** — tabs, back/forward, bookmarks, real favicons on shortcuts. Big sites that block embedding (Google, YouTube, etc.) open in a real browser tab.
- **Downloader** — paste a URL, it fetches and saves to your VFS.
- **Terminal** — `ls`, `cd`, `cat`, `echo`, `mkdir`, `rm`, `touch`, `launch <app>`, `↑/↓` history.
- **Clock** — live digital clock.
- **Settings** — light/dark theme, wallpaper picker (with thumbnails), factory reset.
- **About**.

### Wallpapers
- Right-click any image in **File Explorer** or on the desktop → *Set as wallpaper*.
- Or open **Settings → Appearance → Wallpaper**: shows thumbnails of everything in `/Pictures`. Click one to apply.
- Or paste any URL in the *Custom URL* field.
- Or ask the AI: `set wallpaper ferrari`.

## Virtual filesystem

- Persisted to `localStorage` under the key `LUMEN_FS_V2`.
- Sample images/videos in `assets/images` and `assets/videos` are referenced by path (not copied into localStorage) to keep storage light.
- Files you delete go to `/Trash` first.
- Reset from **Settings → Clear all files**.

## Structure

```
lumen-os/
├── index.html          ← entry point
├── vercel.json         ← clean URLs on Vercel
├── css/                ← theme, window, taskbar, login, app styles
├── js/
│   ├── core/           ← util, bus, window mgr, desktop, taskbar, dialog, ctx menu, registry, login, boot
│   ├── fs/vfs.js       ← localStorage-backed virtual filesystem
│   └── apps/           ← one file per app
└── assets/             ← icons, wallpapers, videos, favicon
```

No modules, no bundler. Classic `<script>` tags load everything in order.

## Limitations

- No backend — no accounts across devices, no cloud sync.
- Paint images are stored as base64 data URLs in localStorage. Keep them small.
- localStorage caps at ~5–10 MB per origin.
- Browser iframes block most big sites (CORS / X-Frame-Options). That's a browser-security feature, not a bug.

## License

Use it however you like. No warranty.
