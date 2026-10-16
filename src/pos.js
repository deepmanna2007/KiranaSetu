import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { db } from './db.js';
import { sounds } from './sound.js';
import { aiEngine } from './ai.js';

export class PosBillingModule {
  constructor(containerEl, onOrderCreated) {
    this.container = containerEl;
    this.onOrderCreated = onOrderCreated;
    this.cart = [];
    this.selectedCategory = 'all';
    this.searchQuery = '';
    this.discountPercent = 0;
    this.paymentMethod = 'UPI';
    this.customerName = '';
    this.customerPhone = '';
    this.isListeningVoice = false;
  }

  render() {
    const products = db.getProducts();
    const categories = ['all', ...new Set(products.map(p => p.category))];
    const settings = db.getSettings();

    // Filter products
    const filteredProducts = products.filter(p => {
      const matchCat = this.selectedCategory === 'all' || p.category === this.selectedCategory;
      const query = this.searchQuery.toLowerCase().trim();
      const matchQuery = !query || 
        p.name.toLowerCase().includes(query) ||
        (p.hindiName && p.hindiName.toLowerCase().includes(query)) ||
        (p.barcode && p.barcode.includes(query)) ||
        p.category.toLowerCase().includes(query);
      return matchCat && matchQuery;
    });

    // Calculate cart totals
    const cartTotals = this.calculateCartTotals();

    this.container.innerHTML = `
      <div class="pos-layout">
        <!-- Left: Product Catalog & Fast Quick-Pick -->
        <div class="pos-catalog-panel">
          <div class="pos-search-header">
            <div class="search-box-wrap">
              <span class="search-icon">🔍</span>
              <input type="text" id="pos-search-input" class="pos-search-input" 
                placeholder="Search by product name, हिन्दी नाम, barcode (e.g. Atta, आटा, 890103...)" 
                value="${this.searchQuery}" autofocus autocomplete="off" />
              ${this.searchQuery ? `<button id="clear-search-btn" class="clear-btn">✕</button>` : ''}
            </div>

            <!-- AI Smart Parchi Button -->
            <button id="btn-open-ai-parchi" class="btn btn-ai-sparkle btn-sm" title="AI Smart Parchi - Parse handwritten or WhatsApp list with Gemini">
              <span class="icon">✨</span> AI Smart Parchi
            </button>

            <!-- Quick Barcode Sim Button -->
            <button id="quick-barcode-btn" class="btn btn-secondary-outline btn-sm" title="Simulate Barcode Scanner">
              <span class="icon">📷</span> Scan Barcode
            </button>
          </div>

          <!-- Category Pills -->
          <div class="category-pills-bar">
            ${categories.map(cat => `
              <button class="cat-pill ${this.selectedCategory === cat ? 'active' : ''}" data-cat="${cat}">
                ${cat === 'all' ? '✨ All Products' : cat}
              </button>
            `).join('')}
          </div>

          <!-- Product Grid -->
          <div class="pos-product-grid">
            ${filteredProducts.length === 0 ? `
              <div class="empty-state">
                <span class="empty-emoji">📦</span>
                <p>No products found matching "${this.searchQuery}"</p>
                <small>Try typing in English or Hindi (e.g. 'Dal', 'दाल', 'Oil')</small>
              </div>
            ` : filteredProducts.map(p => {
              const inCart = this.cart.find(c => c.id === p.id);
              const isOutOfStock = p.stock <= 0;
              const isLowStock = p.stock > 0 && p.stock <= p.lowStockThreshold;

              let stockBadge = `<span class="stock-badge in-stock">✓ ${p.stock} in stock</span>`;
              if (isOutOfStock) {
                stockBadge = `<span class="stock-badge out-stock">✕ Out of Stock</span>`;
              } else if (isLowStock) {
                stockBadge = `<span class="stock-badge low-stock">⚠ Only ${p.stock} left</span>`;
              }

              return `
                <div class="pos-product-card ${isOutOfStock ? 'disabled' : ''} ${inCart ? 'in-cart' : ''}" data-id="${p.id}">
                  <div class="card-top">
                    <span class="item-emoji">${p.icon || '🛍️'}</span>
                    ${stockBadge}
                  </div>
                  <div class="product-info">
                    <h4 class="product-title">${p.name}</h4>
                    <div class="product-hindi-name">${p.hindiName || ''}</div>
                    <div class="product-meta">
                      <span class="unit-tag">${p.unit}</span>
                      <span class="gst-tag">GST ${p.gstRate}%</span>
                    </div>
                  </div>
                  <div class="card-bottom">
                    <div class="pricing-wrap">
                      <span class="selling-price">₹${p.sellingPrice}</span>
                      ${p.mrp > p.sellingPrice ? `<span class="mrp-price">MRP ₹${p.mrp}</span>` : ''}
                    </div>
                    ${isOutOfStock ? `
                      <button class="btn btn-disabled btn-sm" disabled>Unavailable</button>
                    ` : inCart ? `
                      <div class="cart-stepper-sm">
                        <button class="btn-step-minus" data-id="${p.id}">-</button>
                        <span class="step-qty">${inCart.qty}</span>
                        <button class="btn-step-plus" data-id="${p.id}" ${inCart.qty >= p.stock ? 'disabled' : ''}>+</button>
                      </div>
                    ` : `
                      <button class="btn btn-primary-soft btn-sm add-to-cart-btn" data-id="${p.id}">
                        + Add to Bill
                      </button>
                    `}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Right: Current Bill / Checkout Counter -->
        <div class="pos-cart-panel">
          <div class="cart-header">
            <div class="cart-header-title">
              <h3>🧾 Current Bill / पर्ची</h3>
              <span class="badge-count">${this.cart.reduce((sum, item) => sum + item.qty, 0)} Items</span>
            </div>
            ${this.cart.length > 0 ? `
              <button id="clear-cart-btn" class="btn-text-danger">Clear</button>
            ` : ''}
          </div>

          <!-- Customer Info Inputs -->
          <div class="customer-info-box">
            <div class="input-row">
              <input type="text" id="cust-name-input" class="form-control form-control-sm" 
                placeholder="Customer Name (Optional)" value="${this.customerName}" />
              <input type="tel" id="cust-phone-input" class="form-control form-control-sm" 
                placeholder="Mobile (for WhatsApp Bill)" value="${this.customerPhone}" maxlength="10" />
            </div>
          </div>

          <!-- Cart Item List -->
          <div class="cart-items-list">
            ${this.cart.length === 0 ? `
              <div class="cart-empty-state">
                <span class="cart-empty-icon">🛒</span>
                <p>Bill is currently empty</p>
                <small>Click on items from the left or scan barcode to add to billing cart</small>
              </div>
            ` : this.cart.map(item => {
              const prod = db.getProductById(item.id);
              const maxStock = prod ? prod.stock : item.qty;
              return `
                <div class="cart-item-row" data-id="${item.id}">
                  <div class="cart-item-details">
                    <div class="item-name">${item.name}</div>
                    <div class="item-sub">
                      <span>₹${item.sellingPrice} × ${item.qty} ${item.unit}</span>
                      ${item.gstRate > 0 ? `<span class="gst-micro">GST ${item.gstRate}%</span>` : `<span class="gst-micro">0% GST</span>`}
                    </div>
                  </div>
                  <div class="cart-item-stepper">
                    <button class="btn-step-sm minus" data-id="${item.id}">−</button>
                    <span class="qty-count">${item.qty}</span>
                    <button class="btn-step-sm plus" data-id="${item.id}" ${item.qty >= maxStock ? 'disabled title="Max stock reached"' : ''}>+</button>
                  </div>
                  <div class="cart-item-price">
                    ₹${(item.sellingPrice * item.qty).toFixed(2)}
                  </div>
                  <button class="btn-remove-item" data-id="${item.id}" title="Remove item">✕</button>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Billing Summary Calculation -->
          <div class="cart-summary-section">
            <div class="summary-line">
              <span>Subtotal (${this.cart.length} items)</span>
              <span>₹${cartTotals.subtotal.toFixed(2)}</span>
            </div>
            <div class="summary-line text-muted">
              <span>Total GST (CGST + SGST)</span>
              <span>₹${cartTotals.taxTotal.toFixed(2)}</span>
            </div>
            ${cartTotals.savings > 0 ? `
              <div class="summary-line text-success">
                <span>Customer Savings (vs MRP)</span>
                <span>−₹${cartTotals.savings.toFixed(2)}</span>
              </div>
            ` : ''}
            <div class="summary-line roundoff-line">
              <span>Round Off</span>
              <span>${cartTotals.roundOff >= 0 ? '+' : ''}₹${cartTotals.roundOff.toFixed(2)}</span>
            </div>
            <div class="summary-line grand-total-line">
              <span class="grand-label">Total Amount Payable</span>
              <span class="grand-value">₹${cartTotals.finalTotal}</span>
            </div>

            <!-- Payment Method Selector -->
            <div class="payment-method-selector">
              <label class="section-label">Select Payment Method:</label>
              <div class="payment-options-grid">
                <label class="pay-option ${this.paymentMethod === 'UPI' ? 'active' : ''}">
                  <input type="radio" name="pos-payment" value="UPI" ${this.paymentMethod === 'UPI' ? 'checked' : ''} />
                  <span class="pay-icon">📱</span>
                  <span class="pay-label">UPI QR</span>
                </label>
                <label class="pay-option ${this.paymentMethod === 'Cash' ? 'active' : ''}">
                  <input type="radio" name="pos-payment" value="Cash" ${this.paymentMethod === 'Cash' ? 'checked' : ''} />
                  <span class="pay-icon">💵</span>
                  <span class="pay-label">Cash</span>
                </label>
                <label class="pay-option ${this.paymentMethod === 'Khata' ? 'active' : ''}">
                  <input type="radio" name="pos-payment" value="Khata" ${this.paymentMethod === 'Khata' ? 'checked' : ''} />
                  <span class="pay-icon">📒</span>
                  <span class="pay-label">Khata / Udhar</span>
                </label>
              </div>
            </div>

            <!-- Checkout Action Buttons -->
            <div class="cart-action-buttons">
              ${this.paymentMethod === 'UPI' ? `
                <button id="btn-show-upi-qr" class="btn btn-primary btn-block btn-lg" ${this.cart.length === 0 ? 'disabled' : ''}>
                  <span class="icon">📲</span> Generate UPI QR (₹${cartTotals.finalTotal})
                </button>
              ` : `
                <button id="btn-complete-cash-bill" class="btn btn-success btn-block btn-lg" ${this.cart.length === 0 ? 'disabled' : ''}>
                  <span class="icon">🧾</span> Complete & Print Bill (₹${cartTotals.finalTotal})
                </button>
              `}
            </div>
          </div>
        </div>
      </div>

      <!-- UPI QR Code Modal Container -->
      <div id="upi-modal-overlay" class="modal-overlay hidden">
        <div class="modal-content upi-modal-card">
          <button id="close-upi-modal" class="modal-close-btn">✕</button>
          <div class="upi-modal-header">
            <span class="upi-logo-badge">BHIM UPI ⚡</span>
            <h3>Scan & Pay with Any UPI App</h3>
            <p>GPay, PhonePe, Paytm, BHIM, CRED</p>
          </div>
          <div class="upi-qr-display-box">
            <canvas id="upi-qr-canvas"></canvas>
            <div class="upi-merchant-info">
              <span class="merchant-name">${settings.storeName}</span>
              <span class="merchant-vpa">${settings.upiId}</span>
            </div>
            <div class="upi-amount-pill">
              ₹${cartTotals.finalTotal}
            </div>
          </div>
          <div class="upi-soundbox-hint">
            <span class="speaker-icon">🔊</span> Live Audio Soundbox enabled
          </div>
          <div class="upi-modal-actions">
            <button id="simulate-upi-success-btn" class="btn btn-success btn-block">
              ✓ Simulate Customer Paid (PhonePe/GPay)
            </button>
            <button id="cancel-upi-btn" class="btn btn-secondary-outline btn-block">
              Cancel
            </button>
          </div>
        </div>
      </div>

      <!-- Bill / Invoice Receipt Modal -->
      <div id="invoice-modal-overlay" class="modal-overlay hidden">
        <div class="modal-content invoice-modal-card">
          <div class="invoice-modal-top-actions">
            <button id="print-invoice-btn" class="btn btn-primary btn-sm">
              🖨️ Print Invoice (Thermal / A4)
            </button>
            <button id="whatsapp-share-btn" class="btn btn-success-outline btn-sm">
              💬 Share on WhatsApp
            </button>
            <button id="close-invoice-modal" class="btn-text-muted">✕ Close</button>
          </div>
          <div id="invoice-printable-content" class="invoice-paper">
            <!-- Dynamically populated invoice HTML -->
          </div>
        </div>
      </div>

      <!-- AI Smart Parchi Scanner Modal -->
      <div id="ai-parchi-modal-overlay" class="modal-overlay hidden">
        <div class="modal-content ai-parchi-card">
          <button id="close-ai-parchi-modal" class="modal-close-btn">✕</button>
          <div class="ai-modal-header">
            <span class="ai-badge-pill">✨ Powered by Gemini 3.8 Flash</span>
            <h3>AI Smart Parchi (पर्ची से तुरंत बिल)</h3>
            <p>Paste customer's messy WhatsApp text, handwritten list, or speak into the mic. Gemini maps brands, colloquial units, and verifies live stock.</p>
          </div>

          <!-- Quick Sample Chips -->
          <div class="parchi-sample-chips">
            <span class="sample-label">Try sample:</span>
            <button class="parchi-chip" data-sample="2 aashirvaad atta, 1 fortune tel, adha kilo amul butter, 2 maggi, ek tata namak">Atta + Oil + Butter + Maggi</button>
            <button class="parchi-chip" data-sample="500ml amul doodh, 2 parle g, ek packet surf excel, thoda namak">Milk + Detergent + Biscuits</button>
            <button class="parchi-chip" data-sample="2 kg aalu pyaz, 1kg toor dal, 1 taj mahal chai, colgate toothpaste">Dal + Chai + Veggies</button>
          </div>

          <div class="parchi-input-wrap">
            <textarea id="ai-parchi-textarea" class="form-control" rows="4" 
              placeholder="Paste or type messy grocery list (e.g. 2 packet atta, 1 ltr tel, adha kilo makhan, namak, 2 maggi)..."></textarea>
            
            <div class="parchi-actions-row">
              <button id="btn-voice-dictate-parchi" class="btn btn-secondary-outline btn-sm">
                🎙️ <span id="voice-label">Speak Parchi (बोलकर लिखें)</span>
              </button>
              <button id="btn-submit-ai-parchi" class="btn btn-primary btn-sm">
                ✨ Parse with Gemini AI
              </button>
            </div>
          </div>

          <!-- Live Parsing Loader & Result Container -->
          <div id="ai-parchi-output-area" class="parchi-output-area hidden">
            <!-- Dynamically rendered parsed items -->
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  calculateCartTotals() {
    let subtotal = 0;
    let mrpTotal = 0;
    let taxTotal = 0;

    this.cart.forEach(item => {
      const lineTotal = item.sellingPrice * item.qty;
      subtotal += lineTotal;
      mrpTotal += (item.mrp || item.sellingPrice) * item.qty;

      // Calculate GST portion
      if (item.gstRate && item.gstRate > 0) {
        const taxable = lineTotal / (1 + item.gstRate / 100);
        taxTotal += (lineTotal - taxable);
      }
    });

    const savings = Math.max(0, mrpTotal - subtotal);
    const rawTotal = subtotal;
    const finalTotal = Math.round(rawTotal);
    const roundOff = +(finalTotal - rawTotal).toFixed(2);

    return {
      subtotal,
      mrpTotal,
      savings,
      taxTotal,
      roundOff,
      finalTotal
    };
  }

  attachEventListeners() {
    // Search input
    const searchInput = this.container.querySelector('#pos-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.render();
        const inputRef = this.container.querySelector('#pos-search-input');
        if (inputRef) {
          inputRef.focus();
          inputRef.setSelectionRange(inputRef.value.length, inputRef.value.length);
        }
      });
    }

    const clearSearch = this.container.querySelector('#clear-search-btn');
    if (clearSearch) {
      clearSearch.addEventListener('click', () => {
        this.searchQuery = '';
        this.render();
      });
    }

    // Category pills
    this.container.querySelectorAll('.cat-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectedCategory = btn.getAttribute('data-cat');
        this.render();
      });
    });

    // Customer fields
    const nameInput = this.container.querySelector('#cust-name-input');
    if (nameInput) {
      nameInput.addEventListener('input', (e) => this.customerName = e.target.value);
    }
    const phoneInput = this.container.querySelector('#cust-phone-input');
    if (phoneInput) {
      phoneInput.addEventListener('input', (e) => this.customerPhone = e.target.value);
    }

    // Add to cart buttons
    this.container.querySelectorAll('.add-to-cart-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const prodId = btn.getAttribute('data-id');
        this.addToCart(prodId);
      });
    });

    // Steppers inside catalog
    this.container.querySelectorAll('.btn-step-plus').forEach(btn => {
      btn.addEventListener('click', () => {
        const prodId = btn.getAttribute('data-id');
        this.addToCart(prodId);
      });
    });
    this.container.querySelectorAll('.btn-step-minus').forEach(btn => {
      btn.addEventListener('click', () => {
        const prodId = btn.getAttribute('data-id');
        this.decrementCart(prodId);
      });
    });

    // Steppers inside cart panel
    this.container.querySelectorAll('.cart-item-stepper .plus').forEach(btn => {
      btn.addEventListener('click', () => {
        const prodId = btn.getAttribute('data-id');
        this.addToCart(prodId);
      });
    });
    this.container.querySelectorAll('.cart-item-stepper .minus').forEach(btn => {
      btn.addEventListener('click', () => {
        const prodId = btn.getAttribute('data-id');
        this.decrementCart(prodId);
      });
    });

    // Remove item
    this.container.querySelectorAll('.btn-remove-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const prodId = btn.getAttribute('data-id');
        this.removeFromCart(prodId);
      });
    });

    // Clear cart
    const clearCartBtn = this.container.querySelector('#clear-cart-btn');
    if (clearCartBtn) {
      clearCartBtn.addEventListener('click', () => {
        this.cart = [];
        this.render();
      });
    }

    // Payment method selector
    this.container.querySelectorAll('input[name="pos-payment"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.paymentMethod = e.target.value;
        this.render();
      });
    });

    // Barcode Simulation Button
    const barcodeBtn = this.container.querySelector('#quick-barcode-btn');
    if (barcodeBtn) {
      barcodeBtn.addEventListener('click', () => {
        this.promptBarcodeScan();
      });
    }

    // AI Smart Parchi Modal Listeners
    const openAiParchiBtn = this.container.querySelector('#btn-open-ai-parchi');
    const aiModal = this.container.querySelector('#ai-parchi-modal-overlay');
    const closeAiModal = this.container.querySelector('#close-ai-parchi-modal');
    const parchiTextarea = this.container.querySelector('#ai-parchi-textarea');
    const submitAiBtn = this.container.querySelector('#btn-submit-ai-parchi');
    const outputArea = this.container.querySelector('#ai-parchi-output-area');
    const voiceBtn = this.container.querySelector('#btn-voice-dictate-parchi');
    const voiceLabel = this.container.querySelector('#voice-label');

    if (openAiParchiBtn && aiModal) {
      openAiParchiBtn.addEventListener('click', () => {
        aiModal.classList.remove('hidden');
        if (parchiTextarea) parchiTextarea.focus();
      });
    }

    if (closeAiModal && aiModal) {
      closeAiModal.addEventListener('click', () => {
        aiModal.classList.add('hidden');
      });
    }

    // Sample chips click
    this.container.querySelectorAll('.parchi-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        if (parchiTextarea) {
          parchiTextarea.value = chip.getAttribute('data-sample');
          parchiTextarea.focus();
        }
      });
    });

    // Voice dictation using Web Speech Recognition API
    if (voiceBtn) {
      voiceBtn.addEventListener('click', () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
          alert('Speech Recognition is not supported by your browser. You can type or paste the text directly!');
          return;
        }

        if (this.isListeningVoice) return;

        try {
          const recognition = new SpeechRecognition();
          recognition.lang = 'hi-IN'; // Recognizes Hindi and Hinglish
          recognition.interimResults = false;
          recognition.maxAlternatives = 1;

          this.isListeningVoice = true;
          if (voiceLabel) voiceLabel.textContent = '🔴 Listening... Bolte jaiye...';
          voiceBtn.classList.add('pulse-voice');

          recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            if (parchiTextarea) {
              parchiTextarea.value = (parchiTextarea.value ? parchiTextarea.value + ', ' : '') + transcript;
            }
          };

          recognition.onerror = (e) => {
            console.warn('Speech error', e);
          };

          recognition.onend = () => {
            this.isListeningVoice = false;
            if (voiceLabel) voiceLabel.textContent = '🎙️ Speak Parchi (बोलकर लिखें)';
            voiceBtn.classList.remove('pulse-voice');
          };

          recognition.start();
        } catch (err) {
          console.error(err);
          this.isListeningVoice = false;
          if (voiceLabel) voiceLabel.textContent = '🎙️ Speak Parchi (बोलकर लिखें)';
        }
      });
    }

    // Submit AI Parchi to Gemini
    if (submitAiBtn && parchiTextarea && outputArea) {
      submitAiBtn.addEventListener('click', async () => {
        const rawText = parchiTextarea.value.trim();
        if (!rawText) {
          alert('Please enter or dictate a grocery list first!');
          parchiTextarea.focus();
          return;
        }

        outputArea.classList.remove('hidden');
        outputArea.innerHTML = `
          <div class="ai-loading-state">
            <span class="ai-spinner">🧠</span>
            <div>
              <strong>Gemini AI is analyzing your parchi...</strong>
              <small class="text-muted">Mapping colloquial Hindi/English brands and checking live inventory</small>
            </div>
          </div>
        `;
        submitAiBtn.disabled = true;

        try {
          const products = db.getProducts();
          const result = await aiEngine.parseGroceryParchi(rawText, products);
          this.renderAiParchiResults(result, outputArea, aiModal);
        } catch (err) {
          console.error('AI parsing error', err);
          outputArea.innerHTML = `
            <div class="ai-error-box">
              ⚠️ <strong>Parsing failed:</strong> ${err.message || 'Please check API connection.'}
            </div>
          `;
        } finally {
          submitAiBtn.disabled = false;
        }
      });
    }

    // UPI QR Button
    const upiBtn = this.container.querySelector('#btn-show-upi-qr');
    if (upiBtn) {
      upiBtn.addEventListener('click', () => {
        this.showUpiQrModal();
      });
    }

    // Cash / Khata Bill Completion
    const cashBtn = this.container.querySelector('#btn-complete-cash-bill');
    if (cashBtn) {
      cashBtn.addEventListener('click', () => {
        this.completeOrder(this.paymentMethod, this.paymentMethod === 'Cash' ? 'paid' : 'khata');
      });
    }
  }

  addToCart(prodId) {
    const prod = db.getProductById(prodId);
    if (!prod || prod.stock <= 0) return;

    const existing = this.cart.find(c => c.id === prodId);
    if (existing) {
      if (existing.qty < prod.stock) {
        existing.qty += 1;
        sounds.playScanBeep();
      } else {
        alert(`Cannot add more. Current available stock is ${prod.stock} ${prod.unit}.`);
        return;
      }
    } else {
      this.cart.push({
        id: prod.id,
        name: prod.name,
        hindiName: prod.hindiName,
        sellingPrice: prod.sellingPrice,
        mrp: prod.mrp,
        unit: prod.unit,
        gstRate: prod.gstRate,
        hsnCode: prod.hsnCode,
        qty: 1
      });
      sounds.playScanBeep();
    }
    this.render();
  }

  decrementCart(prodId) {
    const idx = this.cart.findIndex(c => c.id === prodId);
    if (idx !== -1) {
      if (this.cart[idx].qty > 1) {
        this.cart[idx].qty -= 1;
      } else {
        this.cart.splice(idx, 1);
      }
      sounds.playScanBeep();
      this.render();
    }
  }

  removeFromCart(prodId) {
    this.cart = this.cart.filter(c => c.id !== prodId);
    this.render();
  }

  promptBarcodeScan() {
    const products = db.getProducts().filter(p => p.stock > 0);
    const sampleBarcodes = products.slice(0, 5).map(p => `${p.name}: ${p.barcode}`).join('\n');
    const input = prompt(`Simulate Barcode Scanner\nEnter or paste 12-digit barcode:\n\nAvailable Barcodes for Testing:\n${sampleBarcodes}`);
    if (input) {
      const found = db.getProductByBarcode(input.trim());
      if (found) {
        this.addToCart(found.id);
      } else {
        alert('Product barcode not found in database.');
      }
    }
  }

  renderAiParchiResults(result, outputArea, aiModal) {
    const inStockItems = (result.matchedItems || []).filter(item => item.inStock && item.availableStock > 0);
    const outStockItems = (result.matchedItems || []).filter(item => !item.inStock || item.availableStock <= 0);

    outputArea.innerHTML = `
      <div class="ai-results-card">
        <div class="ai-results-header">
          <div>
            <span class="ai-badge-success">✓ Parsed Successfully</span>
            <h4>${result.summary || 'List Items Mapped to Catalog'}</h4>
          </div>
          <span class="badge-count">${inStockItems.length} Available to Bill</span>
        </div>

        <div class="ai-items-list-table">
          <table class="receipt-table">
            <thead>
              <tr>
                <th class="text-left">Identified Product</th>
                <th>Qty</th>
                <th>Status</th>
                <th class="text-right">Price</th>
              </tr>
            </thead>
            <tbody>
              ${(result.matchedItems || []).map(item => `
                <tr class="${item.inStock ? '' : 'text-muted'}">
                  <td class="text-left">
                    <strong>${item.matchedName}</strong>
                    <small class="text-muted d-block">(Found from: "${item.requestedName}")</small>
                  </td>
                  <td>${item.qty} ${item.unit}</td>
                  <td>
                    ${item.inStock ? `
                      <span class="stock-badge in-stock">✓ ${item.availableStock} in stock</span>
                    ` : `
                      <span class="stock-badge out-stock">✕ Out of Stock</span>
                    `}
                  </td>
                  <td class="text-right">₹${(item.price * item.qty).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        ${(result.unmatchedItems && result.unmatchedItems.length > 0) ? `
          <div class="unmatched-items-note">
            ⚠️ <strong>Not Found in Store Catalog:</strong> ${result.unmatchedItems.join(', ')}
          </div>
        ` : ''}

        ${outStockItems.length > 0 ? `
          <div class="unmatched-items-note text-warning">
            ⚠️ <strong>Out of Stock Alert:</strong> ${outStockItems.map(i => i.matchedName).join(', ')} cannot be billed right now.
          </div>
        ` : ''}

        <div class="ai-results-actions">
          <button id="btn-add-ai-items-to-bill" class="btn btn-success btn-block btn-lg" ${inStockItems.length === 0 ? 'disabled' : ''}>
            ⚡ Add ${inStockItems.length} In-Stock Items to Bill (Instant Auto-Cart)
          </button>
        </div>
      </div>
    `;

    // 1-Click Auto-Add to POS Cart
    const addAllBtn = outputArea.querySelector('#btn-add-ai-items-to-bill');
    if (addAllBtn) {
      addAllBtn.onclick = () => {
        inStockItems.forEach(item => {
          const prod = db.getProductById(item.catalogId);
          if (prod) {
            const billQty = Math.min(item.qty || 1, prod.stock);
            const existing = this.cart.find(c => c.id === prod.id);
            if (existing) {
              existing.qty = Math.min(prod.stock, existing.qty + billQty);
            } else {
              this.cart.push({
                id: prod.id,
                name: prod.name,
                hindiName: prod.hindiName,
                sellingPrice: prod.sellingPrice,
                mrp: prod.mrp,
                unit: prod.unit,
                gstRate: prod.gstRate,
                hsnCode: prod.hsnCode,
                qty: billQty
              });
            }
          }
        });

        sounds.playSuccessAlert();
        confetti({ particleCount: 60, spread: 50, origin: { y: 0.5 } });
        aiModal.classList.add('hidden');
        this.render();
      };
    }
  }

  async showUpiQrModal() {
    const totals = this.calculateCartTotals();
    const settings = db.getSettings();
    const upiModal = this.container.querySelector('#upi-modal-overlay');
    if (!upiModal) return;

    upiModal.classList.remove('hidden');

    // Create Indian standard UPI payment deep-link
    // format: upi://pay?pa=<vpa>&pn=<name>&am=<amount>&cu=INR&tn=<note>
    const tempInvId = 'INV-' + Math.floor(1000 + Math.random() * 9000);
    const upiUrl = `upi://pay?pa=${encodeURIComponent(settings.upiId)}&pn=${encodeURIComponent(settings.storeName)}&am=${totals.finalTotal.toFixed(2)}&cu=INR&tn=${encodeURIComponent('Bill ' + tempInvId)}`;

    const canvas = upiModal.querySelector('#upi-qr-canvas');
    if (canvas) {
      try {
        await QRCode.toCanvas(canvas, upiUrl, {
          width: 220,
          margin: 1,
          color: {
            dark: '#1e293b',
            light: '#ffffff'
          }
        });
      } catch (err) {
        console.error('QR code generation error', err);
      }
    }

    // Modal listeners
    const closeBtn = upiModal.querySelector('#close-upi-modal');
    const cancelBtn = upiModal.querySelector('#cancel-upi-btn');
    const simulateSuccess = upiModal.querySelector('#simulate-upi-success-btn');

    const closeModal = () => {
      upiModal.classList.add('hidden');
    };

    closeBtn.onclick = closeModal;
    cancelBtn.onclick = closeModal;

    simulateSuccess.onclick = () => {
      closeModal();
      sounds.playUpiSoundboxChime(totals.finalTotal);
      confetti({ particleCount: 75, spread: 60, origin: { y: 0.6 } });
      this.completeOrder('UPI', 'paid');
    };
  }

  completeOrder(paymentMethod, paymentStatus) {
    if (this.cart.length === 0) return;

    const totals = this.calculateCartTotals();
    const orderData = {
      orderType: 'pos_instant',
      customerName: this.customerName || 'Counter Customer',
      customerPhone: this.customerPhone || '9999999999',
      paymentMethod: paymentMethod,
      paymentStatus: paymentStatus,
      items: JSON.parse(JSON.stringify(this.cart)),
      itemCount: this.cart.reduce((sum, item) => sum + item.qty, 0),
      subtotal: totals.subtotal,
      taxTotal: totals.taxTotal,
      savings: totals.savings,
      roundOff: totals.roundOff,
      total: totals.finalTotal,
      deliveryFee: 0,
      notes: 'Counter Bill Generated'
    };

    const newOrder = db.createOrder(orderData);
    sounds.playSuccessAlert();

    // Show Invoice Modal
    this.displayInvoiceReceipt(newOrder);

    // Reset current POS cart
    this.cart = [];
    this.customerName = '';
    this.customerPhone = '';
    this.render();

    if (this.onOrderCreated) {
      this.onOrderCreated(newOrder);
    }
  }

  displayInvoiceReceipt(order) {
    const settings = db.getSettings();
    const invoiceModal = this.container.querySelector('#invoice-modal-overlay');
    const content = this.container.querySelector('#invoice-printable-content');
    if (!invoiceModal || !content) return;

    invoiceModal.classList.remove('hidden');

    const formattedDate = new Date(order.createdAt).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    content.innerHTML = `
      <div class="receipt-container">
        <!-- Store Header -->
        <div class="receipt-header">
          <div class="store-badge">🕉️ SHREE GANESH 🕉️</div>
          <h2 class="store-title">${settings.storeName}</h2>
          <div class="store-tagline">${settings.tagline}</div>
          <div class="store-address">${settings.address}</div>
          <div class="store-contact">Phone: ${settings.phone} | GSTIN: ${settings.gstin}</div>
        </div>

        <div class="receipt-divider"></div>

        <!-- Invoice Meta -->
        <div class="receipt-meta-grid">
          <div>
            <strong>Invoice No:</strong> ${order.id}<br/>
            <strong>Token No:</strong> #${order.tokenNo}
          </div>
          <div class="text-right">
            <strong>Date:</strong> ${formattedDate}<br/>
            <strong>Payment:</strong> <span class="badge-pill">${order.paymentMethod.toUpperCase()} (${order.paymentStatus.toUpperCase()})</span>
          </div>
        </div>

        <div class="customer-receipt-info">
          <strong>Customer:</strong> ${order.customerName} | <strong>Mobile:</strong> ${order.customerPhone}
        </div>

        <div class="receipt-divider"></div>

        <!-- Itemized Table -->
        <table class="receipt-table">
          <thead>
            <tr>
              <th class="text-left"># Item</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>GST%</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map((it, idx) => `
              <tr>
                <td class="text-left">
                  <div class="r-item-name">${idx + 1}. ${it.name}</div>
                  ${it.hindiName ? `<div class="r-item-hindi">${it.hindiName}</div>` : ''}
                </td>
                <td>${it.qty}</td>
                <td>₹${it.sellingPrice}</td>
                <td>${it.gstRate || 0}%</td>
                <td class="text-right">₹${(it.sellingPrice * it.qty).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="receipt-divider"></div>

        <!-- Calculation Breakdown -->
        <div class="receipt-summary">
          <div class="r-line">
            <span>Subtotal:</span>
            <span>₹${order.subtotal.toFixed(2)}</span>
          </div>
          <div class="r-line">
            <span>GST Tax Included:</span>
            <span>₹${order.taxTotal.toFixed(2)}</span>
          </div>
          ${order.deliveryFee > 0 ? `
            <div class="r-line">
              <span>Home Delivery Fee:</span>
              <span>₹${order.deliveryFee.toFixed(2)}</span>
            </div>
          ` : ''}
          ${order.savings > 0 ? `
            <div class="r-line text-success">
              <span>You Saved (Discount):</span>
              <span>−₹${order.savings.toFixed(2)}</span>
            </div>
          ` : ''}
          ${order.roundOff !== 0 ? `
            <div class="r-line">
              <span>Round Off:</span>
              <span>₹${order.roundOff.toFixed(2)}</span>
            </div>
          ` : ''}
          <div class="r-line r-grand-total">
            <span>GRAND TOTAL:</span>
            <span>₹${order.total}</span>
          </div>
        </div>

        <div class="receipt-divider"></div>

        <!-- Footer terms -->
        <div class="receipt-footer">
          <p>Thank you for shopping with us! Phir Aaiyega! 🙏</p>
          <small>Goods once sold can be exchanged within 24 hours with bill.</small>
          <div class="receipt-barcode-line">||||||||||||||||||||||||||||||||||||</div>
        </div>
      </div>
    `;

    // Print Listener
    const printBtn = invoiceModal.querySelector('#print-invoice-btn');
    printBtn.onclick = () => {
      window.print();
    };

    // WhatsApp Share Listener
    const waBtn = invoiceModal.querySelector('#whatsapp-share-btn');
    waBtn.onclick = () => {
      this.shareInvoiceOnWhatsApp(order, settings);
    };

    // Close Listener
    const closeBtn = invoiceModal.querySelector('#close-invoice-modal');
    closeBtn.onclick = () => {
      invoiceModal.classList.add('hidden');
    };
  }

  shareInvoiceOnWhatsApp(order, settings) {
    const itemList = order.items.map((it, i) => `${i + 1}. ${it.name} (${it.qty} ${it.unit}) = ₹${it.sellingPrice * it.qty}`).join('%0A');
    const message = `*🧾 ${settings.storeName}*%0A` +
      `*Tax Invoice / Cash Memo*%0A` +
      `Bill No: ${order.id}%0A` +
      `Customer: ${order.customerName}%0A` +
      `--------------------------------%0A` +
      itemList + `%0A` +
      `--------------------------------%0A` +
      `*Grand Total: ₹${order.total}*%0A` +
      `Payment: ${order.paymentMethod} (${order.paymentStatus})%0A%0A` +
      `Thank you for shopping with us! 🙏`;

    const cleanPhone = (order.customerPhone || '').replace(/\D/g, '');
    const waUrl = cleanPhone.length === 10 ? `https://wa.me/91${cleanPhone}?text=${message}` : `https://wa.me/?text=${message}`;
    window.open(waUrl, '_blank');
  }
}
