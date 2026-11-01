# LINE Sticker AI Generator (LINE LIFF App) 🎨🤖

A full-stack web application integrated as a **LINE LIFF (LINE Front-end Framework)** app that creates complete, consistent sets of LINE Stickers ready for submission to the **LINE Creators Market**.

Powered by **Google AI Studio (Gemini & Imagen 3)**, this app takes a character concept or reference photo, designs a unified character anchor, generates 8–16 expressive sticker prompts, renders the illustrations, automatically removes solid backgrounds to produce transparent PNGs, resizes them according to official LINE specifications, and bundles them into a submission-ready `.zip` package.

---

## 🌟 Key Features

1. **LINE LIFF SDK Integration (`@line/liff`)**
   - Runs natively inside the LINE mobile app (iOS / Android) or in any web browser.
   - Automatic user authentication, fetching profile avatar & display name.
   - Fallback Sandbox / Browser Demo mode when accessed outside LINE or prior to LIFF ID configuration.
   - Built-in LINE Share Target Picker (`liff.shareTargetPicker`) to share generated stickers directly to LINE chat rooms.

2. **Google AI Studio Prompt Engineering (Gemini)**
   - Character Visual Consistency Anchor: Analyzes character concepts or uploaded reference images (multimodal) to freeze visual traits (fur/skin color, attire, eye shape, signature accessories).
   - Multi-Expression Pack Generation: Automatically designs distinct, dynamic action poses (e.g., Hello, Thank You, OK, Haha, Crying, Love, Shocked, Sleepy, Cheering, Sorry, Bye, Angry).
   - Multi-Language Sticker Text: Supports English, Thai (ไทย), Japanese (日本語), or pure character illustrations without text banners.

3. **High-Fidelity AI Image Generation (Google Imagen 3)**
   - Renders crisp sticker artwork on isolated solid backgrounds using Google's state-of-the-art `imagen-3.0-generate-002`.
   - Supports art styles: *Kawaii Chibi*, *3D Cute Toy / Clay*, *Anime & Manga*, *16-bit Pixel Art*, *Soft Watercolor*, and *Pop-Art Comic*.

4. **Background Removal & LINE Specs Compliance (Sharp Engine)**
   - Automated server-side chroma keying / alpha matte generation with anti-aliased edge smoothing.
   - Auto-trims transparent boundaries, preserves aspect ratios, adds recommended ~10px transparent padding, and composites onto exact LINE dimensions:
     - **Stickers (`01.png` – `08.png`)**: Max 370 × 320 px (even pixel dimensions, transparent PNG).
     - **Main Cover (`main.png`)**: 240 × 240 px (LINE Store package thumbnail).
     - **Chat Tab Icon (`tab.png`)**: 96 × 74 px (chat keyboard selector).

5. **Realistic LINE Mobile Chat Simulator**
   - Test generated stickers in an authentic LINE chat room interface (#849EB0 background, speech bubbles, timestamps, and "Read" receipts) before exporting.

6. **One-Click LINE Creators Market ZIP Export (`jszip`)**
   - Automatically compiles all formatted stickers, `main.png`, `tab.png`, and a submission manifest checklist into a single downloadable `.zip` file ready for instant upload to [LINE Creators Market](https://creator.line.me/).

---

## 🏗️ Tech Stack

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router, Route Handlers, Server Actions)
- **Frontend:** React 18, Tailwind CSS, Lucide React Icons
- **LINE Integration:** [`@line/liff`](https://www.npmjs.com/package/@line/liff) (v2.24+)
- **AI Models (Google AI Studio):**
  - Text & Prompt Expansion: [`@google/genai`](https://www.npmjs.com/package/@google/genai) with `gemini-2.5-flash` / `gemini-1.5-flash`
  - Image Generation: `imagen-3.0-generate-002`
- **Image Processing:** [`sharp`](https://sharp.pixelplumbing.com/) (high-speed libvips image transformation)
- **Archive Generation:** [`jszip`](https://stuk.github.io/jszip/) & [`file-saver`](https://www.npmjs.com/package/file-saver)

---

## 📁 Project Folder Structure

```
line-sticker-ai-generator/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── generate-prompts/     # Gemini character & multi-emotion prompt designer
│   │   │   │   └── route.ts
│   │   │   ├── generate-image/       # Imagen 3 text-to-image generator
│   │   │   │   └── route.ts
│   │   │   ├── process-image/        # Sharp transparent background & LINE resizing
│   │   │   │   └── route.ts
│   │   │   └── package-zip/          # Server-side ZIP fallback
│   │   │       └── route.ts
│   │   ├── globals.css               # Tailwind CSS & custom styles
│   │   ├── layout.tsx                # Mobile-responsive root layout
│   │   └── page.tsx                  # Main LIFF single-page wizard
│   ├── components/
│   │   ├── ChatSimulator.tsx         # Interactive LINE mobile chat preview room
│   │   ├── Header.tsx                # App navigation & LIFF user status pill
│   │   ├── LineMarketGuideModal.tsx  # LINE Creators Market submission rules
│   │   ├── PromptReviewModal.tsx     # Gemini prompt inspection & editing modal
│   │   ├── StepCharacterInput.tsx    # Character concept, styles & emotion selector
│   │   ├── StepGeneration.tsx        # Generation progress, cards grid & export controls
│   │   └── StickerCard.tsx           # Individual sticker card with transparent toggle
│   ├── hooks/
│   │   └── useLiff.ts                # React hook for LIFF initialization and state
│   ├── lib/
│   │   ├── gemini.ts                 # Google GenAI SDK client (Gemini & Imagen)
│   │   ├── imageProcessor.ts         # Sharp background removal & canvas compositing
│   │   ├── liff.ts                   # LINE Front-end Framework helper & fallbacks
│   │   ├── lineStickerPresets.ts     # Art styles, emotion lists & LINE guidelines
│   │   └── zipGenerator.ts           # JSZip packaging for Creators Market
│   └── types/
│       └── sticker.ts                # TypeScript interfaces & data types
├── .env.example                      # Environment variables template
├── next.config.mjs                   # Next.js configuration
├── package.json                      # Project dependencies & scripts
├── postcss.config.js                 # PostCSS setup
├── tailwind.config.js                # Tailwind styling with LINE theme palette
├── tsconfig.json                     # TypeScript compiler configuration
└── README.md                         # Documentation
```

---

## 🚀 Getting Started

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone <repository_url>
cd line-sticker-ai-generator

# Install npm dependencies
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Open `.env.local` and configure your credentials:

```env
# 1. Google AI Studio API Key (Required)
# Generate your key at https://aistudio.google.com/
GEMINI_API_KEY="AIzaSy..."

# 2. LINE LIFF ID (Required for LINE integration)
# Create a LIFF app at https://developers.line.biz/
NEXT_PUBLIC_LIFF_ID="2000000000-XXXXXXXX"

# Optional Model Configuration
IMAGEN_MODEL="imagen-3.0-generate-002"
GEMINI_MODEL="gemini-2.5-flash"
```

> **Note on Sandbox Mode:** If you launch the app without `NEXT_PUBLIC_LIFF_ID` or `GEMINI_API_KEY`, the application automatically activates **Browser Sandbox Mode** with high-fidelity mock assets, allowing you to test the complete user flow, background removal, chat simulator, and ZIP downloads immediately!

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

---

## 📱 Setting Up LINE LIFF in LINE Developers Console

To deploy and test your app inside LINE:

1. **Go to LINE Developers Console:**
   - Visit [https://developers.line.biz/](https://developers.line.biz/) and log in with your LINE account.
2. **Create a Provider:**
   - Click **Create a new provider** (e.g., "My Sticker Studio").
3. **Create a LINE Login Channel:**
   - Under your provider, click **Create a new channel** &gt; **LINE Login**.
   - Channel type: `LINE Login`. Fill in App name, description, and category.
4. **Add a LIFF App:**
   - Go to the **LIFF** tab in your LINE Login channel.
   - Click **Add**.
   - **LIFF app name:** `LINE Sticker AI Generator`
   - **Size:** `Full` (Recommended for best mobile canvas experience) or `Tall`.
   - **Endpoint URL:** Your public HTTPS URL (e.g. `https://your-domain.vercel.app` or an ngrok tunnel `https://xxxx.ngrok-free.app` during local development).
   - **Scopes:** Check `profile`, `openid`, and `chat_message.write` (to enable sticker sharing).
   - **Bot link feature:** Normal (or On).
5. **Copy the LIFF ID:**
   - Once saved, copy the **LIFF ID** (e.g. `2000123456-AbCdEfGh`) and paste it as `NEXT_PUBLIC_LIFF_ID` in your `.env.local`.
6. **Open Inside LINE:**
   - Open the **LIFF URL** (`https://liff.line.me/2000123456-AbCdEfGh`) directly on your mobile device inside LINE to test the native in-app experience!

---

## 🎨 LINE Creators Market Specifications Handled

This application adheres to all technical guidelines established by [LINE Creators Market](https://creator.line.me/en/guideline/sticker/):

| File Name | Specification | Requirement Details | Handled by App |
| :--- | :--- | :--- | :---: |
| `01.png` – `08.png` | Max 370 × 320 px | Even pixel dimensions, transparent PNG, ~10px padding | ✅ Auto |
| `main.png` | 240 × 240 px | Main cover image for LINE Sticker Store | ✅ Auto |
| `tab.png` | 96 × 74 px | Chat room tab bar thumbnail icon | ✅ Auto |
| Format | PNG (RGBA) | 72 dpi or higher, RGB color mode, < 1MB each | ✅ Auto |

### Submission Steps to LINE Creators Market:
1. Log in to [creator.line.me](https://creator.line.me/) with your LINE credentials.
2. Click **New Submission** &gt; **Sticker**.
3. Fill in the sticker package title and description.
4. Go to **Sticker Images** &gt; Click **Upload ZIP** & select the `.zip` file generated by this application.
5. Set your price tier (e.g. 50 Coins / 35 THB / $0.99) and submit for review.

---

## 🧪 Testing the Build

You can verify the production Next.js build locally:

```bash
npm run build
npm run start
```

---

## 📄 License
This project is licensed under the MIT License.
