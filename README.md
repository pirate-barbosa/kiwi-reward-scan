# KIWI REWARD SCANNER

[![Buy Me A Coffee](https://img.buymeacoffee.com/button-api/?text=Buy%20me%20a%20coffee&emoji=&slug=piratebarbosa&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff)](https://www.buymeacoffee.com/piratebarbosa)

[![Deployment](https://img.shields.io/github/deployments/pirate-barbosa/kiwi-reward-scanner/github-pages?label=deploy&logo=github)](https://pirate-barbosa.github.io/kiwi-reward-scanner/)

LIVE URL - https://pirate-barbosa.github.io/kiwi-reward-scanner/

Scan UPI QR codes to decode merchant details and check Kiwi credit card reward eligibility — entirely offline, right from your phone.

## Features

- **QR Scanning** — Live camera scanning or upload a QR image from your gallery
- **UPI Decoding** — Parses `upi://` URIs to extract payee name, VPA, MCC code, amount, currency, transaction note, and more
- **Merchant vs P2P Detection** — Automatically identifies whether a QR code is a merchant or personal/P2P code based on the presence of an MCC
- **Kiwi Rewards Eligibility** — Instantly checks whether the merchant category is eligible for Kiwi transaction rewards, excluded, or indeterminate
- **Cashback Calculator** — Enter a payment amount to see exact Kiwi rewards (Scan & Pay: 6 Kiwis per ₹100 / Online: 2 Kiwis per ₹100), accounting for the multiples-of-₹100 rule
- **Quick Pay** — Deep links to open the payment directly in Kiwi, GPay, PhonePe, Paytm, CRED, or BHIM
- **Haptic Feedback** — Vibration on successful scan for a native-app feel
- **Works Offline** — Full PWA with service worker caching; works without an internet connection after first load
- **No Backend** — Everything runs client-side. No data leaves your device.

## Install as PWA

This is a Progressive Web App. Install it to your home screen for a native-like experience:

**iOS (Safari only):**
1. Open the app URL in **Safari**
2. Tap the **Share** button (square with arrow)
3. Tap **Add to Home Screen**

> Note: iOS only supports PWA installation from Safari. Third-party browsers (DuckDuckGo, Chrome, Firefox) cannot install PWAs on iOS.

**Android (Chrome):**
1. Open the app URL in Chrome
2. Tap the **three-dot menu** → **Install app** (or **Add to Home Screen**)

## Project Structure

```
kiwi-reward-scanner/
├── index.html                      # App shell
├── manifest.json                   # PWA manifest
├── sw.js                           # Service worker (cache-first)
├── css/
│   └── styles.css                  # Design system & all styles
├── js/
│   ├── app.js                      # Entry point & SW registration
│   ├── constants/
│   │   ├── mcc-database.js         # MCC code → category mapping (~300 codes)
│   │   └── kiwi-excluded.js        # MCCs excluded from Kiwi rewards (~50 codes)
│   └── modules/
│       ├── scanner.js              # Camera & gallery QR scanning
│       ├── upi-parser.js           # UPI URI → structured data
│       ├── kiwi-checker.js         # MCC → eligibility logic
│       └── ui-renderer.js          # All DOM rendering
├── icons/
│   ├── icon-192.svg                # PWA icon (192×192)
│   └── icon-512.svg                # PWA icon (512×512, maskable)
└── vendor/
    └── html5-qrcode.min.js         # QR scanner library (vendored for offline)
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML / CSS / JS — no framework, no build step |
| Modules | ES Modules (`type="module"`) |
| QR Scanning | [html5-qrcode](https://github.com/mebjas/html5-qrcode) (vendored) |
| Fonts | Inter + JetBrains Mono (Google Fonts, optional) |
| Hosting | Any static file server over HTTPS |

## How It Works

```
User scans QR (camera or image)
        │
        ▼
  scanner.js ──► upi-parser.js ──► Extracts pa, pn, mc, am, cu, tn…
        │               │
        │               ▼
        │        mcc-database.js ──► "Restaurants", "Grocery Stores"…
        │
        ▼
  ui-renderer.js
        │
        ├── Type badge (Merchant / P2P)
        ├── Payment details (name, VPA, MCC, amount…)
        ├── Kiwi eligibility ◄── kiwi-checker.js ◄── kiwi-excluded.js
        ├── Cashback calculator (if eligible)
        ├── Quick Pay deep links
        └── Raw UPI URL & params
```

## Deploy

No build step required. Serve the project directory as static files over HTTPS.

**GitHub Pages:**
```bash
git push origin main
# Enable Pages in repo Settings → Pages → Deploy from branch
```

**Netlify / Vercel / Cloudflare Pages:**
- Point to the repository root. No build command needed.

**Any static server:**
```bash
npx serve .
```

> HTTPS is required for service worker registration and camera access.

## Updating

After changing any files, bump `CACHE_VERSION` in `sw.js` so existing installations pick up the new version:

```js
const CACHE_VERSION = 'upi-decoder-v3'; // bump this
```

## Data Sources

- **MCC Database** — ISO 18245 Merchant Category Codes (~300 entries)
- **Kiwi Exclusion List** — Based on [Kiwi Rewards Policy v2](https://gokiwi.in/rewards-policy-v2/)

## License

MIT
