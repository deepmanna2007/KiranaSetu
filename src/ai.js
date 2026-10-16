// KiranaSetu AI Engine powered by Google Gemini (gemini-flash-latest)
// API Key is stored ONLY in the user's browser localStorage (kiranasetu_gemini_key).
// NEVER hardcode API keys in source code. Configure via Settings → Gemini API Key.

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';

export class KiranaAIEngine {
  constructor() {
    this.apiKey = localStorage.getItem('kiranasetu_gemini_key') || '';
  }

  getApiKey() {
    return this.apiKey;
  }

  setApiKey(key) {
    this.apiKey = key.trim();
    localStorage.setItem('kiranasetu_gemini_key', this.apiKey);
  }

  /**
   * Parses messy colloquial Hindi/English grocery list ("Parchi") into exact store items & quantities
   * @param {string} rawParchiText - e.g. "2 kg aashirvaad atta, adha kilo amul butter, 1 tel, 2 maggi, thoda namak"
   * @param {Array} catalog - Active store inventory items with stock status
   */
  async parseGroceryParchi(rawParchiText, catalog) {
    if (!this.apiKey) {
      throw new Error('Gemini API Key is missing. Please set it in Settings.');
    }

    const catalogSnippet = catalog.map(p => ({
      id: p.id,
      name: p.name,
      hindiName: p.hindiName,
      unit: p.unit,
      sellingPrice: p.sellingPrice,
      stock: p.stock
    }));

    const systemPrompt = `You are an expert Indian Kirana Store AI Assistant ("स्मार्ट पर्ची असिस्टेंट").
Your job is to read raw, unstructured, messy Indian grocery lists written in Hindi, Hinglish, or English (colloquial shorthand, phonetic spellings, regional terms like "makhan", "namak", "tel", "pyaz", "aalu", "adha kilo", "1 botal", "2 pkt") and match them accurately to items in the store's inventory catalog.

Available Store Inventory Catalog:
${JSON.stringify(catalogSnippet)}

Task:
Analyze the customer's grocery text: "${rawParchiText}"
Match each mentioned product to the most relevant catalog item.

Return ONLY a valid JSON object (no markdown, no backticks, no extra text) with the following exact format:
{
  "summary": "Short bilingual 1-line summary of what was found",
  "matchedItems": [
    {
      "catalogId": "prod-001",
      "requestedName": "user term (e.g. atta)",
      "matchedName": "catalog product name",
      "qty": 2,
      "unit": "catalog unit",
      "inStock": true,
      "availableStock": 24,
      "price": 215,
      "confidence": "high",
      "note": ""
    }
  ],
  "unmatchedItems": [
    "items from user text not sold in this store"
  ]
}

Important Rules:
1. "adha kilo" or "500gm" means 0.5 or 1 unit depending on the pack size. If pack size is 100g, "adha kilo" is 5 packs. If pack size is 500g, it is 1 pack.
2. If stock <= 0, set inStock: false and note "Out of Stock".
3. Match brand colloquialisms: "fortune" -> Fortune Sunflower oil; "aashirvaad" -> Aashirvaad Atta; "amul" -> Amul Butter or Milk; "tata dal" -> Tata Sampann Toor Dal; "tata namak" -> Tata Salt.
4. Output strict JSON only.`;

    const response = await fetch(`${GEMINI_API_URL}?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { parts: [{ text: systemPrompt }] }
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error('Empty response received from Gemini AI.');
    }

    // Clean possible backticks if any
    const cleanJson = candidateText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    return JSON.parse(cleanJson);
  }

  /**
   * Generates culturally polite, respectful Hindi/Hinglish payment reminder for Customer Khata
   */
  async generateKhataReminder(customerName, amount, storeName, upiId) {
    if (!this.apiKey) {
      throw new Error('Gemini API Key is missing.');
    }

    const prompt = `You are a respectful Indian Kirana shopkeeper in New Delhi.
Generate 3 short, culturally polite WhatsApp payment reminder messages in Hindi/Hinglish for a regular customer:
Customer Name: ${customerName}
Pending Udhar Balance: ₹${amount}
Store Name: ${storeName}
Shopkeeper UPI ID: ${upiId}

Option 1: Very respectful & polite (ideal for elders / Sharma ji / Uncle ji)
Option 2: Warm & friendly (ideal for regular neighborhood friends)
Option 3: Clear & professional with UPI QR / payment link hint

Return ONLY a JSON array with 3 objects:
[
  { "title": "Polite / Adarsh", "message": "Text..." },
  { "title": "Friendly / Padosi", "message": "Text..." },
  { "title": "Quick / Professional", "message": "Text..." }
]`;

    const response = await fetch(`${GEMINI_API_URL}?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    });

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const cleanJson = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    return JSON.parse(cleanJson);
  }
}

export const aiEngine = new KiranaAIEngine();
