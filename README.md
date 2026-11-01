# LINE Sticker AI Generator & Sticker Studio (LINE LIFF App) 🎨🤖✂️

A comprehensive, production-ready web application integrated as a **LINE LIFF (LINE Front-end Framework)** app for creating, die-cutting, formatting, and packaging ready-to-sell LINE Sticker packs compliant with all official **LINE Creators Market** specifications.

---

## 🌟 Two Powerful Modes in One App

### 1. ✂️ Sticker Studio (ตัดพื้นหลัง & จัดเตรียมขาย) — **NEW**
Designed for creators, illustrators, and artists who already have existing drawings or stickers (e.g. artwork on white background with faint drop shadows or text).
- **High-Precision BFS Boundary Flood-Fill:** Removes the outer solid white background and faint drop shadows 100% cleanly without encroaching on or deleting the white die-cut border, typography, or character artwork.
- **Lanczos3 High-Fidelity Resampling:** Sharp, crystal-clear downsampling preserving fine line work and details.
- **Automatic LINE Creators Market Compliance:**
  - Auto-centers and constrains sticker dimensions to max **370 × 320 px** (always even pixel numbers).
  - Guarantees minimum **10px safe transparent margin** on all sides.
  - Generates official Store Cover **`main.png` (240 × 240 px)** and Chat Keyboard **`tab.png` (96 × 74 px)** automatically.
- **Interactive Inspection Grid:**
  - Split toggle between transparent cutout (checkerboard background) and original image.
  - Live dimension, file size, and margin compliance badges.
  - On-card controls to select `main.png`, `tab.png`, reorder, or delete.
- **Otter Sample Pack Included:** 1-click button to load sample otter stickers ("ปั่นงานอยู่", "สาธุ", "กำลังไป!") to test the studio workflow instantly.
- **One-Click Package Export:** Generates `line_sticker_pack.zip` with numbered PNGs (`01.png` - `NN.png`), `main.png`, `tab.png`, `line_creators_metadata.json`, and `LINE_SUBMISSION_INFO.txt` (ready to copy-paste into [creator.line.me](https://creator.line.me/)).

### 2. 🤖 AI Sticker Generator (สร้างสติกเกอร์จากไอเดีย)
Generates complete, stylistically consistent character sticker sets from text prompts, concepts, or reference photos.
- **Dual AI Engine Architecture:**
  - **Free FLUX.1 Engine (Pollinations):** 100% free, requires no API key and no credit card. Includes smart client-side countdown timer and auto-retry queue when throttled by server cooldown limits.
  - **Google AI Studio (Gemini 2.5 Flash Image / Imagen 3):** High-speed, high-quality generation using Google AI credentials.
- **Visual Consistency Anchor:** Freezes character features (fur, eyes, clothing, accessories) across all sticker poses.
- **Smart Typography & Text Overlay:** Custom Thai and English font styling, outline strokes, and positioning.
- **Interactive LINE Chat Simulator:** Test sending stickers in an authentic LINE chat room with Light/Dark background toggle and read receipts before downloading.

---

## 📐 LINE Creators Market Specifications Handled

Every file exported from the application strictly complies with [LINE Creators Market Guidelines](https://creator.line.me/en/guideline/sticker/):

| File Name | Dimensions | Requirement Details | Status |
| :--- | :--- | :--- | :---: |
| `01.png` – `40.png` | Max 370 × 320 px | Even pixel dimensions, transparent PNG, ≥10px padding | ✅ 100% Auto |
| `main.png` | 240 × 240 px | Main package cover in LINE Sticker Store | ✅ 100% Auto |
| `tab.png` | 96 × 74 px | Chat room keyboard selector icon | ✅ 100% Auto |
| Format | PNG (RGBA) | RGB color mode, alpha channel, < 1MB per image | ✅ 100% Auto |
| Pack Size | 8, 16, 24, 32, 40 | Standard LINE pack counts supported | ✅ Supported |

---

## 🏗️ Tech Stack

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router, Route Handlers)
- **Frontend:** React 18, Tailwind CSS, Lucide React Icons
- **Image Processing:** [`sharp`](https://sharp.pixelplumbing.com/) (Lanczos3 resampling, boundary flood-fill, contour dilation)
- **LINE LIFF SDK:** [`@line/liff`](https://www.npmjs.com/package/@line/liff) (v2.24+)
- **AI Models:**
  - FLUX.1 Schnell via Pollinations API (Free tier)
  - Google Gemini 2.5 Flash & Imagen 3 via `@google/genai`
- **Archive Generation:** [`jszip`](https://stuk.github.io/jszip/) & [`file-saver`](https://www.npmjs.com/package/file-saver)
- **Deployment:** [Vercel](https://vercel.com/) with `vercel.json` preset

---

## 📁 Project Structure

```
line-sticker-ai-generator/
├── public/
│   └── samples/                  # Sample otter stickers for instant 1-click test
│       ├── otter_01_work.jpg     # "ปั่นงานอยู่"
│       ├── otter_02_pray.jpg     # "สาธุ"
│       └── otter_03_run.jpg      # "กำลังไป!"
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── clean-and-format/ # High-precision BFS die-cut & LINE sizing API
│   │   │   ├── generate-image/   # AI Image engine (FLUX.1 free / Gemini AI Studio)
│   │   │   ├── generate-prompts/ # Gemini character prompt expansion & metadata
│   │   │   ├── package-zip/      # Server-side ZIP fallback
│   │   │   └── process-image/    # Canvas compositing & padding
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx              # Main view with Tab switcher
│   ├── components/
│   │   ├── ChatSimulator.tsx     # Realistic LINE chat room simulator
│   │   ├── Header.tsx            # Navigation, tab switcher & LIFF status
│   │   ├── LineMarketGuideModal.tsx # Submission guidelines modal
│   │   ├── LineMetadataModal.tsx # Copy-paste submission metadata modal
│   │   ├── PromptReviewModal.tsx # AI prompt inspector
│   │   ├── StepCharacterInput.tsx # AI character concept form
│   │   ├── StepGeneration.tsx    # AI generation grid & controls
│   │   ├── StickerCard.tsx       # Individual AI sticker card with cooldown timer
│   │   ├── StickerStudioTab.tsx  # Importer, batch die-cut & LINE packager
│   │   └── TextOverlayEditorModal.tsx # Thai typography editor
│   ├── hooks/
│   │   └── useLiff.ts            # LINE LIFF initialization hook
│   ├── lib/
│   │   ├── dieCutExtractor.ts    # BFS flood-fill background & shadow removal
│   │   ├── flux.ts               # FLUX.1 engine with 429 cooldown detection
│   │   ├── gemini.ts             # Google GenAI SDK client
│   │   ├── imageProcessor.ts     # Sharp background removal & resizing
│   │   ├── lineStickerPresets.ts # Art styles, emotions & LINE guidelines
│   │   └── zipGenerator.ts       # Ready-to-sell ZIP package builder
│   └── types/
│       └── sticker.ts            # TypeScript interfaces
├── vercel.json                   # Vercel deployment configuration
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/kgvkgv20/line-sticker-ai-generator.git
cd line-sticker-ai-generator
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Optional: Required only if using Google AI Studio mode (not needed for Free FLUX mode or Sticker Studio)
GEMINI_API_KEY="AIzaSy..."

# Optional: Required for native in-app LINE LIFF features
NEXT_PUBLIC_LIFF_ID="2000000000-XXXXXXXX"
```

> **Note:** The app works out of the box in **Browser Sandbox Mode** even with an empty `.env.local`! You can immediately use the **Sticker Studio** to import, die-cut, and package your stickers, or generate stickers using the **Free FLUX.1 Engine**.

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ Deploying to Vercel

1. Push your repository to GitHub.
2. In [Vercel Dashboard](https://vercel.com/new), import your repository:
   - **Framework Preset:** Next.js
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
3. Add Environment Variables in Vercel project settings:
   - `NEXT_PUBLIC_LIFF_ID` (your LINE LIFF ID)
   - `GEMINI_API_KEY` (if using Google AI Studio)
4. Click **Deploy**. Vercel will output a live HTTPS URL (e.g. `https://your-app.vercel.app`).

---

## 📱 Setting Up LINE LIFF in LINE Developers Console

To use the app directly inside LINE on iOS / Android:

1. Go to [LINE Developers Console](https://developers.line.biz/) and log in with your LINE account.
2. Create a **Provider** (e.g. "Sticker Studio").
3. Create a **LINE Login Channel** under the provider.
4. Go to the **LIFF** tab in your channel and click **Add**:
   - **LIFF app name:** `LINE Sticker AI & Studio`
   - **Size:** `Full`
   - **Endpoint URL:** Your Vercel URL (`https://your-app.vercel.app`)
   - **Scopes:** Check `profile`, `openid`, and `chat_message.write`
5. Copy the generated **LIFF ID** (e.g. `2000123456-AbCdEfGh`) and set it as `NEXT_PUBLIC_LIFF_ID` in your Vercel settings and `.env.local`.
6. Share or open the URL `https://liff.line.me/2000123456-AbCdEfGh` in LINE to run natively inside the chat app!

---

## 📦 How to Submit Exported ZIP to LINE Creators Market

1. Download the ZIP file from the app (via **ดาวน์โหลด ZIP พร้อมส่งขาย** in Sticker Studio or AI Generator).
2. Go to [https://creator.line.me/](https://creator.line.me/) and sign in with your LINE account.
3. Click **New Submission** > **Sticker**.
4. Open `LINE_SUBMISSION_INFO.txt` inside your ZIP and copy-paste:
   - English Title & Description (Required)
   - Thai Title & Description
   - Japanese Title & Description
5. Under **Sticker Images**, click **Upload ZIP file** and upload your downloaded `.zip`.
6. Review the images in the LINE preview.
7. Set your price tier (e.g. 50 Coins / 35 THB / $0.99) and click **Request Review**!

---

## 📄 License
This project is licensed under the MIT License.
