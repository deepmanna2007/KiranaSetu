# 🛍️ KiranaSetu Pro (किराना सेतु)
### Smart Indian Retail POS, Inventory Radar, Advance Store Pickup & Home Delivery System

Built specifically for Indian Kirana, Vyapar, and general retail stores. Designed to eliminate manual billing mistakes, prevent out-of-stock customer disappointment, enable zero-wait advance pickup bookings, and automate doorstep home delivery.

---

## 🌟 Key Features

### 1. ⚡ Fast Automatic Billing Counter (POS)
- **Instant Product Search:** Search by English name, हिन्दी नाम (Hindi name), 12-digit barcode, or category filters.
- **Stock Guard:** Real-time stock status pills (`✓ In Stock`, `⚠️ Low Stock`, `✕ Out of Stock`). Out-of-stock items cannot be accidentally added or billed.
- **Zero Calculation Mistakes:** Automatically computes subtotal, GST (0%, 5%, 12%, 18% CGST/SGST), savings against MRP, and Indian retail round-off to the nearest Rupee.
- **Dynamic UPI QR Code Generator:** Embeds exact invoice amount and store UPI ID (`upi://pay?pa=...&pn=...&am=...&cu=INR&tn=...`) scannable by PhonePe, Google Pay, Paytm, and BHIM.
- **Indian Retail Soundbox:** Audio chime and Hindi voice prompt alert on UPI payment completion: *"₹285 UPI se prapt hue!"*
- **GST Tax Invoice / Cash Memo:** Ready for 80mm thermal POS receipt printers or standard A4 sheets, plus 1-click **Share on WhatsApp** with formatted bill summary.

### 2. 🛍️ Customer Advance Store Pickup ("Click & Collect")
- Customers browse the store catalog from their phone or kiosk.
- Select preferred pickup slot (e.g., *Ready in 15 mins (Urgent)*, *Ready in 30 mins*, *Evening 5:00 - 7:00 PM*).
- Add special packing instructions (e.g., *"Double bag wheat flour, check cold milk"*).
- Instant **Token Number** generation (e.g., `TOKEN #104`) with a 4-stage Live Order Tracker.
- Shopkeeper gets immediate notification, packs items into the bag beforehand using the interactive checklist, and marks it *Packed & Ready at Counter*.
- **Zero Wait Time:** Customer walks in, shows Token Number, takes pre-packed bag, and leaves in 10 seconds!

### 3. 🛵 Doorstep Home Delivery Hub
- Customer selects Home Delivery mode with address, nearby landmark, and delivery slot.
- Free delivery rule (e.g., Free above ₹499, otherwise nominal ₹30 fee).
- Shopkeeper Dispatch Board to track: `New Order` ➔ `Packing Items` ➔ `Out for Delivery (Dispatched)` ➔ `Delivered & Paid`.

### 4. 📋 Inventory & Low Stock Radar
- Real-time stock counts across staples, edible oils, pulses, dairy, packaged foods, and personal care.
- Low-stock threshold alerts with warning badges.
- Quick stock adjusters (`+1`, `+10`, `-1`).
- 1-click **Mandi Wholesale Reorder List** (copies formatted item list to clipboard/WhatsApp for wholesale distributors).

### 5. 📒 Customer Khata (Udhar / Credit Ledger)
- Neighborhood credit account ledger.
- Record Jama (payment received) via Cash or UPI.
- **✨ AI-Powered WhatsApp Reminder Generator (Gemini):** Click the "AI Reminder" button on any customer with a due balance to have Gemini generate **3 culturally personalized Hindi/Hinglish payment reminders** — Polite (Adarsh), Friendly (Padosi), and Professional tones. Pick the one that fits and send it directly via WhatsApp.

### 6. ✨ AI Smart Parchi (Powered by Google Gemini Flash)
- Shopkeeper pastes a messy, colloquial customer grocery list (WhatsApp text or handwritten note) like: *"2 aashirvaad atta, adha kilo amul butter, ek fortune tel, 2 maggi, thoda namak"*
- Gemini AI matches each colloquial term to the exact inventory item, resolves units ("adha kilo" = 0.5 or 5 units depending on pack size), checks live stock availability, and returns a structured result.
- **1-click Add to Bill:** All in-stock matched items are instantly added to the POS cart. Out-of-stock items are flagged.
- Also supports **Voice Dictation** (Hindi/Hinglish) via the Web Speech Recognition API.

---

## 🚀 How to Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Start the local development server
npm run dev

# 3. Open your browser
# Visit http://localhost:5173/
```

To create a production bundle:
```bash
npm run build
```

---

## 📁 Project Architecture

- `src/main.js` - Main application controller, role switcher (Shopkeeper vs Customer), theme toggle, soundbox state.
- `src/pos.js` - Lightning-fast billing counter, AI Smart Parchi (Gemini), barcode simulator, cart calculation, UPI QR modal, and tax invoice generator.
- `src/customerPortal.js` - Customer self-service advance booking & home delivery store with live tracking stepper.
- `src/bookings.js` - Shopkeeper fulfillment hub for advance store pickups and delivery dispatch.
- `src/inventory.js` - Inventory manager, live stock status pills, low-stock radar, and mandi reorder list.
- `src/khata.js` - Customer Udhar ledger book, AI-powered Gemini payment reminder generator, and WhatsApp integration.
- `src/analytics.js` - Daily sales analytics, UPI vs Cash distribution, and store profile/GST settings.
- `src/ai.js` - Gemini Flash AI engine: Smart Parchi parser (Hindi/English grocery list → catalog items) and Khata reminder generator (3-tone cultural messages).
- `src/db.js` - LocalStorage persistent database seeded with authentic Indian Kirana products.
- `src/sound.js` - Web Audio API synthesizer for barcode scan beeps, UPI Soundbox chimes, and voice alerts.
- `src/style.css` - Complete modern CSS design system with light/dark themes, glassmorphism, AI modal styles, and print media queries.
