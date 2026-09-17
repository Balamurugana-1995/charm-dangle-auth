# Charm Dangle — desktop app

A real desktop widget: a lucky charm that hangs from the top of your
screen, stays on top of every other window, and lets clicks pass
straight through everywhere except the charm itself — built with
[Electron](https://www.electronjs.org/), reusing the same charm artwork
and physics from the web version.

## What's real here (unlike the browser version)
- **Always on top** — a genuine OS-level always-on-top window.
- **Click-through** — click anywhere else on your screen and it goes
  straight to whatever's underneath; only the small drag-dot and the
  charm itself catch your cursor.
- **System tray icon** — right-click it to pick a charm, trigger its
  ritual, hide/show it, toggle always-on-top, or quit.
- **Real window dragging** — drag the small 🧿 dot at the top to move
  the charm anywhere on your screen; it stays there.
- **Keyboard shortcuts** — `Ctrl/Cmd+Shift+D` hides or shows the charm,
  `Ctrl/Cmd+Shift+R` performs its ritual, from anywhere.

## What's inside
- `main.js` — the Electron main process: creates the transparent
  always-on-top window, the tray menu, the global shortcuts, and the
  click-through logic.
- `preload.js` — the secure bridge between the main process and the
  charm page (exposes `window.charmAPI` to the renderer).
- `renderer/charm.html` — the charm itself: the same rope/pendulum
  physics, rituals, and artwork as the web version, with the on-screen
  toolbar removed (everything is controlled from the tray instead) and
  a tiny drag handle added.
- `icon.png` / `icon16.png` / `icon32.png` — the tray/app icon.

## 1. Run it while you're developing
You'll need [Node.js](https://nodejs.org) installed (version 18 or newer).

```bash
cd charm-dangle-desktop
npm install
npm start
```

A small window should appear near the top-right of your screen with the
evil-eye charm hanging in it, and a new icon should appear in your menu
bar (Mac) or system tray (Windows). Right-click that icon to try the
charm picker, ritual, and hide/show options.

## 2. Turn it into a real installable app
This uses [electron-builder](https://www.electron.build/), which is
already listed in `package.json`.

```bash
npm run dist
```

This creates an installer in a new `dist/` folder:
- **Mac** → a `.dmg` file
- **Windows** → an NSIS `.exe` installer
- **Linux** → an `.AppImage`

Send that installer file to whoever you want using the app — they run
it once to install, and from then on it's a normal app on their
computer (no server, no login, no internet needed — everything runs
locally).

> **Note on cross-building:** electron-builder can usually only build a
> Mac `.dmg` on a Mac, though it can build Windows and Linux installers
> from any of the three. If you're on Windows and want a `.dmg` for a
> Mac-using friend, you'll need to run `npm run dist` on a Mac (or a
> Mac-based CI service) instead.

## 3. Customizing
- **Which charm shows first**: change `activeCharm` at the top of
  `main.js`, and make sure `selectCharm(0)` in `renderer/charm.html`
  matches if you reorder the `charms` array there.
- **Window position/size**: `WINDOW_WIDTH` / `WINDOW_HEIGHT` and the
  `createWindow()` function in `main.js`.
- **Shortcuts**: the two `globalShortcut.register(...)` calls in
  `main.js`.
- **Tray icon**: replace `icon.png` / `icon16.png` / `icon32.png` with
  your own (any square PNG works; keep the 16px one small and simple —
  that's what actually shows in the tray).

## 4. A couple of honest limitations
- The "Your own charm" option is fixed to a ⭐ in this version — the
  text box to type a custom emoji lived in the on-screen toolbar we
  removed. Easy to add back as a tray text-prompt if you want it; ask
  and it can be built out.
- The cursor-follow "lean" effect only reacts to the mouse while it's
  inside the small charm window itself, not the whole screen — that's
  a side effect of how click-through windows report mouse position.
