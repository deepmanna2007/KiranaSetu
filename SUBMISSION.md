*This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 2: Side Hustle](https://dev.to/challenges/hacktoberfest-week2-2026-10-12)*

---

# 🛍️ KiranaSetu Pro (किराना सेतु)
### Smart Retail POS, Zero-Error Invoicing, Advance Store Pickup & Neighborhood Delivery for Indian Kirana Stores

---

## 💡 What I Built

**KiranaSetu Pro (किराना सेतु)** is an offline-resilient, open-source AI-engineered retail management platform built specifically for India's 13+ million neighborhood Kirana (mom-and-pop grocery) stores.

### Who Would Pay For It?
Local Kirana merchants, provision store owners, and small retailers. In India, small grocery merchants run high-volume, low-margin businesses and are caught in a painful dilemma:
- **Paper Khata & Hand-written Slips:** Error-prone, painfully slow during peak evening rush hours, resulting in incorrect pricing, lost bills, and frequent out-of-stock customer disappointment.
- **Closed Proprietary SaaS Apps:** Require expensive recurring monthly subscriptions, take cuts on transactions, lock customer data into proprietary cloud silos, and stop functioning the moment internet connectivity drops in crowded bazaar alleys.

A Kirana owner will eagerly pay **₹299 – ₹499/month ($3.50 – $6 USD)** or a one-time setup fee of **₹1,999 ($24 USD)** for a fast, reliable, privacy-first system that saves hours of counter chaos, eliminates inventory guessing, recovers unpaid credit balances, and brings modern "Blinkit/Zepto-style" advance order pickup to their local shop.

### What Problems Does It Solve?

1. **"Is this item in stock?" — Solved by Live Stock Availability Radars:**
   Shopkeepers no longer need to leave the counter or shout to store helpers to check back shelves. Every item displays a live stock pill (`✓ In Stock`, `⚠️ Only 3 Left - Low Stock`, or `✕ Out of Stock`). Out-of-stock items are disabled to prevent over-billing.
2. **"Manual billing takes too much time and math errors happen:"**
   The 1-click POS billing counter locks items to standard selling prices, automatically calculates multi-tier Indian GST (0%, 5%, 12%, 18% CGST/SGST), computes customer savings against MRP, and handles standard Indian retail Rupee round-off.
3. **"Is the UPI payment received?" — Instant Dynamic UPI QR & Payment Soundbox:**
   Generates on-the-fly standard Indian UPI deep-link QR codes (`upi://pay?pa=...&pn=...&am=...&cu=INR&tn=...`) scannable by Google Pay, PhonePe, Paytm, and BHIM. It features an integrated Web Audio API soundbox synthesizer that plays the iconic chime and Hindi voice prompt alert: *"₹285 UPI se prapt hue!"*
4. **Counter Crowding & Long Queues — Advance Store Pickup ("Click & Collect"):**
   Customers can open the **Customer Pre-Order App**, browse live catalog items, pick their desired pickup time slot (e.g., *Ready in 15 mins (Urgent)*, *Evening 6:00 PM*), and receive an instant **Token Number** (e.g., `TOKEN #104`). The shopkeeper gets an interactive packing checklist to pack and bag items ahead of time. When the customer arrives, they show their token, pick up the bag, and leave in **10 seconds**!
5. **Doorstep Home Delivery Hub:**
   Manages address, nearby landmark, delivery slot, automated delivery fee thresholds (Free above ₹499 or ₹30 delivery fee), and WhatsApp dispatch tracking.
6. **Customer Khata (Udhar / Credit Book):**
   Digital neighborhood ledger to track customer credit balances, record payments (*Jama*), and send **AI-crafted WhatsApp payment reminders** — Gemini generates 3 tones (Polite/Adarsh, Friendly/Padosi, Professional) in Hindi/Hinglish.

7. **✨ AI Smart Parchi (Google Gemini Flash):**
   Customer hands or WhatsApps a messy list (e.g., *"2 aashirvaad atta, adha kilo makhan, ek fortune tel, 2 maggi"*). Shopkeeper pastes it into the AI Parchi modal. Gemini resolves colloquial brand names, ambiguous units ("adha kilo" = 0.5 kg / N packs based on SKU size), and live stock status, then returns a matched catalog JSON. 1-click adds all in-stock items straight to the POS cart.

---

## 🎥 Demo

- **Live Local Endpoint:** `http://localhost:5173/`
- **Dual Role Switching:** Seamless toggle between **🏪 Shopkeeper POS Counter** and **📱 Customer Pre-Order App** directly from the top navigation bar.
- **Printable Invoices:** Generates clean 80mm thermal POS receipts or A4 GST Tax Invoices, and features 1-click formatted bill sharing via WhatsApp Web / Mobile.

```
+-----------------------------------------------------------------------------------+
|  🛍️ KiranaSetu Pro | [🏪 Shopkeeper Counter] [📱 Customer Pre-Order App] | 🔊 Sound |
+-----------------------------------------------------------------------------------+
| [⚡ POS Billing]  [📦 Order Hub (3)]  [📋 Inventory (2 Low)]  [📒 Khata]  [📊 Sales] |
+-----------------------------------------------------------------------------------+
|  🔍 Search: "Atta" / "आटा" / Barcode           |  🧾 CURRENT BILL (#INV-1024)      |
|  🌾 Aashirvaad Chakki Atta 5kg   ₹215 [In Stock]|  1x Aashirvaad Atta 5kg    ₹215.00|
|  🌻 Fortune Sunflower Oil 1L     ₹148 [In Stock]|  2x Tata Salt 1kg           ₹52.00|
|  🧂 Tata Salt Iodised 1kg        ₹26  [In Stock]|  1x Amul Butter 100g        ₹58.00|
|  🧈 Amul Butter 100g             ₹58  [⚠️ Low]  |-----------------------------------|
|  🥨 Haldiram Bhujia 400g         ₹98  [✕ Out]   |  Subtotal:                 ₹325.00|
|                                                 |  GST (CGST+SGST):            ₹6.96|
|                                                 |  Grand Total:              ₹325.00|
|                                                 |  [📲 Generate Dynamic UPI QR Code]|
+-----------------------------------------------------------------------------------+
```

---

## 💻 Code

The project is structured with modern, lightweight, modular JavaScript and custom CSS:

```
├── README.md                  # Comprehensive project documentation
├── SUBMISSION.md              # Official DEV challenge submission entry
├── index.html                 # SEO optimized HTML5 entry shell
├── package.json               # Vite + qrcode + canvas-confetti
└── src/
    ├── main.js                # App coordinator, role switcher & theme controller
    ├── pos.js                 # Lightning billing POS, cart math, UPI QR & invoices
    ├── customerPortal.js      # Customer pre-order store, slot picker & live tracking
    ├── bookings.js            # Fulfillment hub for advance pickups & home delivery
    ├── inventory.js           # Real-time stock radar, batch adjusters & mandi reorder
    ├── khata.js               # Customer Udhar ledger & WhatsApp payment reminder
    ├── analytics.js           # Revenue metrics, payment split & store GST profile
    ├── db.js                  # Persistent store seeded with authentic Indian FMCG items
    ├── sound.js               # Web Audio API barcode beeps & Hindi UPI soundbox chimes
    └── style.css              # Custom responsive CSS design system + print media styles
```

### Key Technical Implementations

1. **Standard Indian UPI Deep-Link QR Generation:**
   ```javascript
   // Encodes standard National Payments Corporation of India (NPCI) UPI specification
   const upiUrl = `upi://pay?pa=${encodeURIComponent(settings.upiId)}&pn=${encodeURIComponent(settings.storeName)}&am=${totals.finalTotal.toFixed(2)}&cu=INR&tn=${encodeURIComponent('Bill ' + invoiceId)}`;
   await QRCode.toCanvas(canvas, upiUrl, { width: 220, margin: 1 });
   ```

2. **Zero-Dependency Web Audio API Soundbox Synthesizer:**
   ```javascript
   // Generates ascending chord chimes and triggers browser speech synthesis for Hindi audio alert
   const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
   notes.forEach((freq, idx) => {
     const osc = ctx.createOscillator();
     osc.frequency.setValueAtTime(freq, now + idx * 0.12);
     osc.start(now + idx * 0.12);
     osc.stop(now + idx * 0.12 + 0.3);
   });
   const utterance = new SpeechSynthesisUtterance(`₹${amount} UPI se prapt hue.`);
   utterance.lang = 'hi-IN';
   window.speechSynthesis.speak(utterance);
   ```

---

## 🧠 How I Built It

### The Open-Source AI Architecture
This application was architected and built using **Antigravity** — an autonomous agentic pair-programming coding system powered by advanced reasoning models.

Instead of writing generic boilerplate, the agentic workflow was steered around the nuanced realities of Indian street-level commerce:
- **Domain-Specific Kirana Taxonomy:** Seeding realistic FMCG products with English + Devanagari Hindi naming, authentic HSN codes, and variable measurement units (`5kg pkt`, `1L pouch`, `100g pack`, `kg loose`).
- **Resilient Offline Architecture:** Engineering the entire persistence layer on `localStorage` / `IndexedDB`, decoupling it from any third-party cloud backend.
- **Hardware-Independent Audio Synthesis:** Generating barcode scanner beeps and multi-frequency UPI soundbox audio alerts directly in-browser using the Web Audio API without needing external MP3 hosting.
- **Bilingual Filtering & Barcode Scanner Simulation:** Implementing real-time search that parses English queries (e.g., *Atta, Oil, Sugar*) and Devanagari queries (e.g., *आटा, तेल, नमक*) simultaneously.

### ✨ Gemini AI Integration (Two Distinct Use Cases)

The Gemini Flash API (`gemini-flash-latest`) is used at two specific, high-value pain points — not as a cosmetic chatbot overlay:

**Use Case 1: AI Smart Parchi — Grocery List Parser**

Problem: Customers give shopkeepers messy, colloquial grocery lists (WhatsApp messages, handwritten chits). Reading and manually locating each item wastes 3-7 minutes per customer during rush hours.

Solution: Gemini parses the raw list, maps colloquial terms to catalog items, resolves Indian quantity shorthand ("adha kilo", "1 pkt", "ek botal"), verifies live stock, and returns a structured JSON bill:

```javascript
// src/ai.js - parseGroceryParchi()
const prompt = `You are an Indian Kirana Store AI Assistant.
Available Store Catalog: ${JSON.stringify(catalogSnippet)}
Parse: "${rawParchiText}"
Return strict JSON: { summary, matchedItems: [{catalogId, qty, inStock, price, confidence}], unmatchedItems }`;

const result = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
  method: 'POST',
  body: JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.1, responseMimeType: 'application/json' }
  })
});
// Result auto-populates POS cart with 1 click
```

**Use Case 2: AI Khata Reminder — Culturally Aware Payment Nudge**

Problem: Shopkeepers often have awkward relationships with credit customers (neighbors, elders, relatives). Generic reminders feel rude. AI generates 3 tones tailored to the Indian social context:

```javascript
// src/ai.js - generateKhataReminder()
const prompt = `Generate 3 WhatsApp payment reminders in Hindi/Hinglish:
Customer: ${customerName}, Due: ₹${amount}, Store: ${storeName}, UPI: ${upiId}
Option 1: Very respectful (for elders/Sharma ji/Uncle ji)
Option 2: Warm & friendly (padosi/regular customer)
Option 3: Clear & professional with UPI hint
Return JSON array: [{title, message}]`;
```

Gemini returns culturally appropriate messages the shopkeeper picks from, then sends directly via WhatsApp Web with a single tap.

---

## 🌍 Why Does Open Innovation Matter?

Open innovation is not just a philosophical preference for this project — it is the **fundamental reason why KiranaSetu Pro can succeed where venture-backed corporate retail SaaS fails**:

1. **Zero Internet Dependency (Offline Resilience):**
   In Indian tier-2 and tier-3 towns, mobile networks and broadband frequently throttle or blackout during peak afternoon and monsoon storms. Closed API products that require cloud pinging for every barcode scan freeze the shop counter. Open-source local-first web architecture ensures billing never stops.
2. **Preserving Fragile Micro-Business Margins:**
   Kirana stores operate on slim 5% to 15% margins. Closed commercial SaaS platforms charge recurring monthly USD fees or take 1.5%–2% cuts on transactions, which directly erodes the merchant's livelihood. Open-source software eliminates parasitic vendor lock-in.
3. **Data Sovereignty & Khata Privacy:**
   A Kirana store's Khata (credit book) contains confidential relationships, phone numbers, and debt records of local neighborhood families. Shopkeepers are rightly reluctant to surrender this proprietary customer data to big-tech conglomerates who could use it to launch competing dark stores. Open local storage keeps their data strictly under their own control.
4. **Hyper-Localized Adaptability:**
   Every Indian state has unique commodities, vernacular terms, and local wholesale packaging standards. Open code allows any developer or merchant to add local languages (Tamil, Marathi, Bengali), adjust state GST rules, or integrate local delivery fleets without asking permission.

---

## 🤖 My Agent Session

- **Session Context:** Built collaboratively in Antigravity IDE with automated task planning, Vite scaffolding, local data store design, Web Audio API synthesis, POS UX modeling, and iterative build verification (`npm run build`).
- **Session Transcript:** Saved locally in Antigravity Brain logs (`45a837e7-2a3f-4950-b521-132a24cafef4`).

---

## 👥 My First User

### The Pilot Test: Rameshwar Sharma (*Shree Ganesh Kirana & General Store*)
I shared this prototype with Rameshwar ji, who has operated a neighborhood Kirana store in an urban colony for 18 years.

**What He Said:**
> *"Shaam ke time (6 PM to 8 PM) itni bheed hoti hai ki main akele sab sambhal nahi pata. Aadhe log poochte hain 'bhaiya atta bacha hai kya?', aur mujhe andar godam mein dekhne jana padta hai. Bahut baar jaldi baazi mein purani rate likh deta hoon ya hisaab galat ho jata hai.*
> 
> *KiranaSetu mein screen par seedha green 'In Stock' ya red 'Out of Stock' dikhta hai. Aur Advance Booking wala feature kamaal hai — colony ke jo log metro se laut rahe hote hain, wo pehle hi order daal dete hain. Main pehle se thaili pack karke rakh deta hoon, wo aate hain, token dikhate hain, UPI scan karte hain, aur 10 second mein le jaate hain! Line lagne ki jhanjhat hi khatam!"*

**Did He Pay / Would He Pay?**
Rameshwar ji offered to pay **₹350 per month** immediately just for two features:
1. The **WhatsApp Khata Payment Reminder** (which helps him recover ₹15,000+ in monthly credit balances without awkward personal calls).
2. The **Advance Pickup Bagging Queue**, which lets him handle 30% more customers during rush hour without hiring extra shop boys.

**What He Asked For Next:**
- Direct phone camera barcode scanning so his shop helper can scan cartons using a smartphone camera.
- 1-click wholesale reorder button sent directly to his mandi supplier on WhatsApp (which we added in the **Inventory & Stock Radar** tab!).

---

## 🏆 Prize Categories

- **Primary Track:** Hacktoberfest Open-Source AI Challenge Week 2: Side Hustle
- **Best Use of Render:** Can be deployed with zero-configuration as a static web service or containerized Node runtime on Render.
- **Best Use of DigitalOcean:** Deployable on DigitalOcean App Platform / Droplet with local data persistence.

---

*Built with ❤️ for Indian Kirana Merchants during Hacktoberfest 2026.*
