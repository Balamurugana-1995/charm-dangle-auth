# Charm Dangle — real sign-in website

A tiny real website: anyone, anywhere, can sign up with their own username
and password. On a successful login they see a button that opens the
Charm Dangle artifact. You (the admin) can log in with a fixed admin
account and see every signed-up user, from any device — because this
one has a real server and a real file-based database behind it, unlike
the Claude-artifact version which only remembered signups in one browser.

## What's inside
- `server.js` — the whole backend (Node.js + Express)
- `public/index.html` — the page people see (login / signup)
- `private/charms.html` — the actual Charm Dangle app; only reachable by
  logged-in visitors, at `/charms` (see `requireLogin` in `server.js`)
- `data/users.json` — where accounts are stored (created automatically)
- `data/charm-config.json` — which charms are turned on (created automatically)
- `package.json` — the list of packages it needs

## How login and the admin panel connect now
- A normal user who signs up or logs in is sent straight to `/charms`,
  which shows only the charms the admin has switched on.
- Logging in as the admin (the fixed username/password below) instead
  opens **Charm Control**: a list of every charm with an on/off switch,
  plus the list of registered users. Flipping switches and pressing
  **Save charms** changes what every user sees immediately (next time
  they open or refresh `/charms`).

## 1. Change the admin password first
Open `server.js` and change these two lines near the top:

```js
const ADMIN_USER = process.env.ADMIN_USER || 'balamurugana';
const ADMIN_PASS = process.env.ADMIN_PASS || 'Balamurugan@2026';
```

Better yet, leave the code as-is and set `ADMIN_USER`, `ADMIN_PASS`, and
`SESSION_SECRET` as **environment variables** on whichever host you pick
(step 3 below shows where). That way your password isn't sitting in a
file at all.

## 2. Test it on your own computer (optional but recommended)
You'll need [Node.js](https://nodejs.org) installed (version 18 or newer).

```bash
cd charm-dangle-auth
npm install
npm start
```

Then open **http://localhost:3000** in a browser. Try signing up, then
open the same page in a different browser (or incognito window) and log
in as the admin — you should see the user you just created.

## 3. Put it online (free options)

Any of these work — pick whichever you find easiest. All of them can run
a Node.js app for free at small scale.

### Option A — Render.com (recommended, easiest)
1. Create a free account at render.com.
2. Push this folder to a new GitHub repository (or use Render's "deploy
   from a folder" option if offered).
3. On Render: **New → Web Service** → connect your repo.
4. Build command: `npm install`
   Start command: `npm start`
5. Under **Environment**, add:
   - `ADMIN_USER` = your chosen admin username
   - `ADMIN_PASS` = your chosen admin password
   - `SESSION_SECRET` = any long random string
6. Deploy. Render gives you a public URL like
   `https://charm-dangle-auth.onrender.com` — that's the link you send
   your friends.

### Option B — Railway.app
Same idea as Render: connect the repo, it detects Node automatically,
you add the same three environment variables in its dashboard, and it
gives you a public URL.

### Option C — Replit
Import this folder as a new Repl (Node.js template), add the
environment variables under "Secrets", and press Run. Replit gives you
a public URL directly in the workspace.

## 4. One important limitation to know about
`data/users.json` is a plain file on the server's disk. Some free hosting
tiers **wipe the disk** every time the app restarts or redeploys (Render's
free tier does this). For a handful of friends this is usually fine day
to day, but if you want accounts to survive forever, ask about upgrading
to a paid plan with a persistent disk, or swapping the JSON file for a
proper hosted database later (e.g. a free tier of Postgres or MongoDB
Atlas) — that's a bigger change than this file, so come back and ask if
you want that next step built out.

## 5. Point it at your own Charm Dangle link
`server.js` has this line:

```js
const CHARM_URL = 'https://claude.ai/artifact/GxaC6r2yYervCB1amNmSsT';
```

Change it if you ever republish the Charm Dangle artifact and get a new
link.
