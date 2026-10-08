# Project Vault: Hackathon Demo

A newsroom console for the "Mirror Defense" duress-PIN demo: fleet board, map, incident timeline, decoy manager, provisioning checklist, an attacker-vs-truth comparison, and a field-device phone simulator. A duress PIN silently raises a full-screen alert (minimisable to a banner).

Everything is simulated at app level. The real design does this at the OS layer (GrapheneOS multi-user), as described in the architecture doc.

## Structure

| Path | Purpose |
|---|---|
| `public/index.html` | The whole app (phone + desk) |
| `public/manifest.webmanifest`, `sw.js`, icons | Installable PWA |
| `api/alert.js` | Alert relay: POST (phone), GET (desk), DELETE (reset) |
| `vercel.json` | Security headers |

## Deploy

1. Push this folder to a GitHub repo.
2. In Vercel: **Add New > Project**, import the repo. No build settings needed (framework "Other").
3. In the project, open **Storage / Marketplace**, add **Upstash Redis** and connect it to the project. This sets the Redis environment variables automatically.
4. Add an environment variable `VAULT_KEY` with any secret value, then **redeploy**.

CLI alternative: `npm i -g vercel`, then `vercel` in this folder.

## Use

- Phone: `https://YOUR-APP.vercel.app/?view=phone&key=YOUR_KEY` (open once with `key`, it is remembered on that device)
- Desk: `https://YOUR-APP.vercel.app/?view=desk&key=YOUR_KEY`
- Split view for solo demos: the plain URL.
- On a phone, use **Add to Home Screen** for a full-screen app.

PINs: real **4821**, duress **1357** (hardcoded in `index.html`; change them there).

The desk shows "Live link" when the API is reachable and "Local only" when it is not.

## Test the API

```bash
curl -X POST https://YOUR-APP.vercel.app/api/alert \
  -H "content-type: application/json" -H "x-vault-key: YOUR_KEY" \
  -d '{"id":1,"t":"10:00","place":"test","lat":-1.28,"lng":36.82}'
curl "https://YOUR-APP.vercel.app/api/alert?since=0" -H "x-vault-key: YOUR_KEY"
```

## Limitations

- Without Redis the API falls back to in-memory storage, which is not shared between serverless instances and will miss alerts. Set up Redis.
- `VAULT_KEY` travels from the browser, so it deters casual abuse only. It is not real authentication.
- The map is a stylised illustration; GPS coordinates are shown as text.
- Chats and notes persist in each device's `localStorage`. Use **Reset phone data** in the presenter notes.
- Do not use this as a security product. The PINs, decoy and alert are all front-end simulation.
