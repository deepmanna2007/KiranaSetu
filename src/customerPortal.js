import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { db } from './db.js';
import { sounds } from './sound.js';
import { aiEngine } from './ai.js';

export class CustomerPortalModule {
  constructor(containerEl, onOrderPlaced) {
    this.container = containerEl;
    this.onOrderPlaced = onOrderPlaced;
    this.cart = [];
    this.orderType = 'advance_pickup'; // 'advance_pickup' or 'home_delivery'
    this.selectedCategory = 'all';
    this.searchQuery = '';
    this.customerName = '';
    this.customerPhone = '';
    this.pickupSlot = 'Ready in 30 mins';
    this.deliveryAddress = '';
    this.landmark = '';
    this.deliverySlot = 'Today Evening (6:00 - 8:00 PM)';
    this.notes = '';
    this.paymentMethod = 'UPI'; // 'UPI', 'COD' / 'Pay on Pickup'
    this.activeTrackingOrder = null;
  }

  render() {
    const products = db.getProducts();
    const categories = ['all', ...new Set(products.map(p => p.category))];
    const settings = db.getSettings();

    const filtered = products.filter(p => {
      const matchCat = this.selectedCategory === 'all' || p.category === this.selectedCategory;
      const query = this.searchQuery.toLowerCase().trim();
      const matchQuery = !query ||
        p.name.toLowerCase().includes(query) ||
        (p.hindiName && p.hindiName.toLowerCase().includes(query)) ||
        p.category.toLowerCase().includes(query);
      return matchCat && matchQuery;
    });

    const cartTotals = this.calculateTotals(settings);

    this.container.innerHTML = `
      <div class="customer-portal-view">
        <!-- Customer Hero Banner -->
        <div class="customer-hero-banner">
          <div class="hero-content">
            <span class="hero-badge">✨ Customer Self-Service & Pre-Order Portal</span>
            <h2>${settings.storeName}</h2>
            <p class="hero-subtitle">Bina line me lage saamaan paayein! Advance booking karein ya ghar baithe mangwayein.</p>
            
            <div class="order-type-tabs">
              <button class="order-type-tab ${this.orderType === 'advance_pickup' ? 'active' : ''}" data-type="advance_pickup">
                <span class="tab-icon">🛍️</span>
                <div class="tab-text">
                  <strong>Advance Booking (Store Pickup)</strong>
                  <small>Shopkeeper packs ahead • Zero wait time</small>
                </div>
              </button>
              <button class="order-type-tab ${this.orderType === 'home_delivery' ? 'active' : ''}" data-type="home_delivery">
                <span class="tab-icon">🛵</span>
                <div class="tab-text">
                  <strong>Home Delivery (Ghar Pahuch)</strong>
                  <small>Fast doorstep delivery • Free above ₹${settings.freeDeliveryThreshold}</small>
                </div>
              </button>
            </div>
          </div>
        </div>

        ${this.activeTrackingOrder ? this.renderActiveTrackingCard() : ''}

        <!-- Store Main Area -->
        <div class="customer-store-layout">
          <!-- Left: Catalog -->
          <div class="customer-catalog-panel">
            <div class="customer-search-bar-wrap">
              <div class="customer-search-bar">
                <span class="search-icon">🔍</span>
                <input type="text" id="cust-search-input" class="customer-search-input" 
                  placeholder="Search ration, atta, oil, spices, dairy (उदा. आटा, तेल, नमक)..." 
                  value="${this.searchQuery}" />
                ${this.searchQuery ? `<button id="cust-clear-search" class="clear-btn">✕</button>` : ''}
              </div>
              <button id="btn-cust-ai-parchi" class="btn btn-ai-sparkle btn-sm" title="Paste or speak your grocery list to auto-fill bag">
                <span class="icon">✨</span> AI Smart Parchi
              </button>
            </div>

            <!-- Categories -->
            <div class="customer-categories-bar">
              ${categories.map(cat => `
                <button class="cust-cat-pill ${this.selectedCategory === cat ? 'active' : ''}" data-cat="${cat}">
                  ${cat === 'all' ? 'All Items' : cat}
                </button>
              `).join('')}
            </div>

            <!-- Products Grid -->
            <div class="customer-product-grid">
              ${filtered.length === 0 ? `
                <div class="empty-state">
                  <span class="empty-emoji">🔍</span>
                  <p>No items found for "${this.searchQuery}"</p>
                </div>
              ` : filtered.map(p => {
                const inCart = this.cart.find(c => c.id === p.id);
                const isOutOfStock = p.stock <= 0;
                const isLowStock = p.stock > 0 && p.stock <= p.lowStockThreshold;

                let stockBadge = `<span class="stock-pill available">✓ In Stock</span>`;
                if (isOutOfStock) {
                  stockBadge = `<span class="stock-pill out">✕ Currently Out of Stock</span>`;
                } else if (isLowStock) {
                  stockBadge = `<span class="stock-pill low">⚠ Only ${p.stock} left</span>`;
                }

                return `
                  <div class="cust-item-card ${isOutOfStock ? 'disabled-card' : ''}">
                    <div class="card-icon-area">
                      <span class="card-emoji">${p.icon || '🛍️'}</span>
                      ${stockBadge}
                    </div>
                    <div class="card-body">
                      <h4 class="card-title">${p.name}</h4>
                      <div class="card-hindi">${p.hindiName || ''}</div>
                      <div class="card-desc">${p.description || ''}</div>
                      <div class="card-unit-badge">${p.unit}</div>
                    </div>
                    <div class="card-footer">
                      <div class="card-prices">
                        <span class="cust-selling-price">₹${p.sellingPrice}</span>
                        ${p.mrp > p.sellingPrice ? `<span class="cust-mrp">MRP ₹${p.mrp}</span>` : ''}
                      </div>

                      ${isOutOfStock ? `
                        <button class="btn btn-disabled btn-sm" disabled>Out of Stock</button>
                      ` : inCart ? `
                        <div class="cust-stepper">
                          <button class="step-btn minus" data-id="${p.id}">−</button>
                          <span class="step-num">${inCart.qty}</span>
                          <button class="step-btn plus" data-id="${p.id}" ${inCart.qty >= p.stock ? 'disabled' : ''}>+</button>
                        </div>
                      ` : `
                        <button class="btn btn-primary-soft btn-sm cust-add-btn" data-id="${p.id}">
                          + Add
                        </button>
                      `}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Right: Order Bag & Slot Configurator -->
          <div class="customer-bag-panel">
            <div class="bag-card">
              <div class="bag-header">
                <h3>🛍️ Your Shopping Bag</h3>
                <span class="badge-count">${this.cart.reduce((sum, it) => sum + it.qty, 0)} Items</span>
              </div>

              <!-- Delivery threshold hint -->
              ${this.orderType === 'home_delivery' ? `
                <div class="delivery-threshold-banner ${cartTotals.subtotal >= settings.freeDeliveryThreshold ? 'free' : ''}">
                  ${cartTotals.subtotal >= settings.freeDeliveryThreshold ? `
                    <span>🎉 You unlocked <strong>FREE Home Delivery!</strong></span>
                  ` : `
                    <span>🚚 Add <strong>₹${(settings.freeDeliveryThreshold - cartTotals.subtotal).toFixed(0)}</strong> more for FREE Delivery (Fee: ₹${settings.deliveryFee})</span>
                  `}
                </div>
              ` : `
                <div class="pickup-hint-banner">
                  ⚡ <strong>Advance Booking:</strong> Shopkeeper prepares your bag before you reach. Zero waiting!
                </div>
              `}

              <!-- Bag items -->
              <div class="bag-items-list">
                ${this.cart.length === 0 ? `
                  <div class="bag-empty">
                    <span>🛒</span>
                    <p>Your bag is empty</p>
                    <small>Add items from the catalog to book advance pickup or order delivery</small>
                  </div>
                ` : this.cart.map(item => `
                  <div class="bag-item-row">
                    <div class="bag-item-title">
                      <div>${item.name}</div>
                      <small>₹${item.sellingPrice} × ${item.qty} ${item.unit}</small>
                    </div>
                    <div class="bag-stepper">
                      <button class="step-btn minus" data-id="${item.id}">−</button>
                      <span>${item.qty}</span>
                      <button class="step-btn plus" data-id="${item.id}">+</button>
                    </div>
                    <div class="bag-item-total">₹${(item.sellingPrice * item.qty).toFixed(2)}</div>
                  </div>
                `).join('')}
              </div>

              <!-- Order Details Form -->
              <div class="order-details-form">
                <div class="form-group">
                  <label>Your Name *</label>
                  <input type="text" id="cust-form-name" class="form-control" 
                    placeholder="Enter full name" value="${this.customerName}" />
                </div>

                <div class="form-group">
                  <label>Mobile Number (for Order Updates & OTP) *</label>
                  <input type="tel" id="cust-form-phone" class="form-control" 
                    placeholder="10-digit mobile number" value="${this.customerPhone}" maxlength="10" />
                </div>

                ${this.orderType === 'advance_pickup' ? `
                  <!-- Advance Pickup Settings -->
                  <div class="form-group">
                    <label>When will you visit the shop to collect? *</label>
                    <select id="cust-form-pickup-slot" class="form-control">
                      <option value="Ready in 15 mins (Urgent)" ${this.pickupSlot.includes('15') ? 'selected' : ''}>⚡ Ready in 15 mins (Urgent)</option>
                      <option value="Ready in 30 mins" ${this.pickupSlot.includes('30') ? 'selected' : ''}>⏰ Ready in 30 mins</option>
                      <option value="Today Evening (5:00 - 7:00 PM)" ${this.pickupSlot.includes('Evening') ? 'selected' : ''}>🌅 Today Evening (5:00 - 7:00 PM)</option>
                      <option value="Tomorrow Morning (8:00 - 10:00 AM)" ${this.pickupSlot.includes('Tomorrow') ? 'selected' : ''}>📅 Tomorrow Morning (8:00 - 10:00 AM)</option>
                    </select>
                  </div>
                ` : `
                  <!-- Home Delivery Settings -->
                  <div class="form-group">
                    <label>Delivery Address *</label>
                    <textarea id="cust-form-address" class="form-control" rows="2" 
                      placeholder="Flat/House No., Building, Street Name">${this.deliveryAddress}</textarea>
                  </div>
                  <div class="form-group">
                    <label>Nearby Landmark (Optional)</label>
                    <input type="text" id="cust-form-landmark" class="form-control" 
                      placeholder="e.g. Near Shiv Mandir, Opposite Park" value="${this.landmark}" />
                  </div>
                  <div class="form-group">
                    <label>Preferred Delivery Slot *</label>
                    <select id="cust-form-delivery-slot" class="form-control">
                      <option value="Express Delivery (Within 45 mins)">⚡ Express Delivery (Within 45 mins)</option>
                      <option value="Today Evening (6:00 - 8:00 PM)" selected>Today Evening (6:00 - 8:00 PM)</option>
                      <option value="Tomorrow Morning (9:00 - 11:00 AM)">Tomorrow Morning (9:00 - 11:00 AM)</option>
                    </select>
                  </div>
                `}

                <div class="form-group">
                  <label>Packing Instructions / Special Request</label>
                  <input type="text" id="cust-form-notes" class="form-control" 
                    placeholder="e.g. Double bag flour, check expiry" value="${this.notes}" />
                </div>

                <!-- Payment Selection -->
                <div class="form-group">
                  <label>Payment Method:</label>
                  <div class="cust-pay-grid">
                    <label class="pay-radio-card ${this.paymentMethod === 'UPI' ? 'active' : ''}">
                      <input type="radio" name="cust-pay" value="UPI" ${this.paymentMethod === 'UPI' ? 'checked' : ''} />
                      <span class="icon">📱</span>
                      <div class="text">
                        <strong>Instant UPI QR</strong>
                        <small>GPay, PhonePe, Paytm</small>
                      </div>
                    </label>
                    <label class="pay-radio-card ${this.paymentMethod !== 'UPI' ? 'active' : ''}">
                      <input type="radio" name="cust-pay" value="${this.orderType === 'advance_pickup' ? 'Pay on Pickup' : 'COD'}" ${this.paymentMethod !== 'UPI' ? 'checked' : ''} />
                      <span class="icon">💵</span>
                      <div class="text">
                        <strong>${this.orderType === 'advance_pickup' ? 'Pay on Pickup Counter' : 'Cash on Delivery (COD)'}</strong>
                        <small>Cash or UPI at handoff</small>
                      </div>
                    </label>
                  </div>
                </div>

                <!-- Bag Totals -->
                <div class="bag-totals">
                  <div class="totals-row">
                    <span>Items Total:</span>
                    <span>₹${cartTotals.subtotal.toFixed(2)}</span>
                  </div>
                  ${this.orderType === 'home_delivery' ? `
                    <div class="totals-row">
                      <span>Delivery Charge:</span>
                      <span>${cartTotals.deliveryFee === 0 ? '<span class="text-success">FREE</span>' : `₹${cartTotals.deliveryFee}`}</span>
                    </div>
                  ` : ''}
                  ${cartTotals.savings > 0 ? `
                    <div class="totals-row text-success">
                      <span>Your Savings:</span>
                      <span>−₹${cartTotals.savings.toFixed(2)}</span>
                    </div>
                  ` : ''}
                  <div class="totals-row grand">
                    <span>To Pay:</span>
                    <span>₹${cartTotals.finalTotal}</span>
                  </div>
                </div>

                <!-- Submit Button -->
                <button id="cust-submit-order-btn" class="btn btn-primary btn-block btn-lg" ${this.cart.length === 0 ? 'disabled' : ''}>
                  ${this.orderType === 'advance_pickup' ? `
                    🛍️ Book Advance Store Pickup (₹${cartTotals.finalTotal})
                  ` : `
                    🛵 Place Home Delivery Order (₹${cartTotals.finalTotal})
                  `}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Customer UPI Payment Modal -->
        <div id="cust-upi-modal" class="modal-overlay hidden">
          <div class="modal-content upi-modal-card">
            <button id="close-cust-upi" class="modal-close-btn">✕</button>
            <div class="upi-modal-header">
              <span class="upi-logo-badge">BHIM UPI ⚡</span>
              <h3>Scan & Pay Advance</h3>
              <p>Scan with any UPI App on your phone</p>
            </div>
            <div class="upi-qr-display-box">
              <canvas id="cust-upi-canvas"></canvas>
              <div class="upi-amount-pill">₹${cartTotals.finalTotal}</div>
            </div>
            <div class="upi-modal-actions">
              <button id="cust-upi-confirm-btn" class="btn btn-success btn-block">
                ✓ Confirm UPI Payment Made
              </button>
            </div>
          </div>
        </div>

        <!-- Customer AI Parchi Modal -->
        <div id="cust-ai-parchi-modal" class="modal-overlay hidden">
          <div class="modal-content ai-parchi-card">
            <button id="close-cust-ai-modal" class="modal-close-btn">✕</button>
            <div class="ai-modal-header">
              <span class="ai-badge-pill">✨ Powered by Gemini 3.8 Flash</span>
              <h3>Paste Your Grocery List (AI स्मार्ट पर्ची)</h3>
              <p>Type, paste WhatsApp message, or speak your monthly ration list. Gemini AI maps the items to available store products automatically.</p>
            </div>

            <div class="parchi-sample-chips">
              <span class="sample-label">Try sample:</span>
              <button class="cust-parchi-chip" data-sample="2 aashirvaad atta, 1 fortune tel, adha kilo amul butter, 2 maggi, ek tata namak">Atta + Oil + Butter + Maggi</button>
              <button class="cust-parchi-chip" data-sample="500ml amul doodh, 2 parle g, ek packet surf excel, thoda namak">Milk + Detergent + Biscuits</button>
            </div>

            <div class="parchi-input-wrap">
              <textarea id="cust-parchi-textarea" class="form-control" rows="4" 
                placeholder="Paste or type messy grocery list (e.g. 2 packet atta, 1 ltr tel, adha kilo makhan, namak, 2 maggi)..."></textarea>
              
              <div class="parchi-actions-row">
                <button id="btn-cust-voice-dictate" class="btn btn-secondary-outline btn-sm">
                  🎙️ <span id="cust-voice-label">Speak (बोलकर लिखें)</span>
                </button>
                <button id="btn-cust-submit-ai-parchi" class="btn btn-primary btn-sm">
                  ✨ Parse & Add to Bag
                </button>
              </div>
            </div>

            <div id="cust-ai-parchi-output" class="parchi-output-area hidden"></div>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  renderActiveTrackingCard() {
    const order = this.activeTrackingOrder;
    if (!order) return '';

    const isPickup = order.orderType === 'advance_pickup';
    const stages = isPickup ? [
      { key: 'pending', label: 'Order Placed', icon: '📝' },
      { key: 'packing', label: 'Packing in Progress', icon: '📦' },
      { key: 'ready_for_pickup', label: 'Ready for Pickup at Counter', icon: '🛍️' },
      { key: 'collected', label: 'Collected & Completed', icon: '✅' }
    ] : [
      { key: 'pending', label: 'Order Received', icon: '📝' },
      { key: 'packing', label: 'Packing Items', icon: '📦' },
      { key: 'out_for_delivery', label: 'Out for Delivery', icon: '🛵' },
      { key: 'delivered', label: 'Delivered', icon: '✅' }
    ];

    let currentStageIndex = stages.findIndex(s => s.key === order.status);
    if (currentStageIndex === -1) {
      if (order.status === 'ready_for_pickup' && !isPickup) currentStageIndex = 1;
      else if (order.status === 'delivered' || order.status === 'collected') currentStageIndex = 3;
      else currentStageIndex = 0;
    }

    return `
      <div class="active-order-tracking-banner">
        <div class="tracking-top-bar">
          <div class="token-display">
            <span class="token-label">YOUR TOKEN NO:</span>
            <span class="token-num">#${order.tokenNo}</span>
          </div>
          <div class="tracking-meta">
            <h4>${isPickup ? '🛍️ Advance Store Pickup Order' : '🛵 Doorstep Home Delivery'}</h4>
            <div class="order-id-sub">Order ID: ${order.id} | ${order.itemCount} Items | Total: ₹${order.total}</div>
            <div class="slot-badge">${isPickup ? `Pickup Slot: ${order.pickupTimeSlot}` : `Delivery Slot: ${order.deliverySlot}`}</div>
          </div>
          <button id="dismiss-tracking-btn" class="btn-text-muted">✕ Hide</button>
        </div>

        <!-- Stepper Progress Tracker -->
        <div class="tracking-stepper">
          ${stages.map((stage, idx) => `
            <div class="tracking-step ${idx <= currentStageIndex ? 'completed' : ''} ${idx === currentStageIndex ? 'current' : ''}">
              <div class="step-circle">
                ${stage.icon}
              </div>
              <div class="step-label">${stage.label}</div>
            </div>
          `).join('')}
        </div>

        <div class="tracking-info-box">
          ${isPickup ? `
            <div class="info-alert">
              💡 <strong>What to do next:</strong> When you arrive at the store, just show <strong>Token #${order.tokenNo}</strong> to the counter. Your bag is being prepared so you can take it and leave immediately without waiting!
            </div>
          ` : `
            <div class="info-alert">
              🏠 <strong>Delivery to:</strong> ${order.deliveryAddress} ${order.landmark ? `(Landmark: ${order.landmark})` : ''}. The delivery boy will reach during your slot.
            </div>
          `}
        </div>
      </div>
    `;
  }

  calculateTotals(settings) {
    let subtotal = 0;
    let mrpTotal = 0;

    this.cart.forEach(item => {
      subtotal += item.sellingPrice * item.qty;
      mrpTotal += (item.mrp || item.sellingPrice) * item.qty;
    });

    const savings = Math.max(0, mrpTotal - subtotal);
    const deliveryFee = (this.orderType === 'home_delivery' && subtotal < settings.freeDeliveryThreshold && subtotal > 0) ? settings.deliveryFee : 0;
    const finalTotal = Math.round(subtotal + deliveryFee);

    return {
      subtotal,
      mrpTotal,
      savings,
      deliveryFee,
      finalTotal
    };
  }

  attachEventListeners() {
    // Order type tabs
    this.container.querySelectorAll('.order-type-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.orderType = tab.getAttribute('data-type');
        this.render();
      });
    });

    // Dismiss active tracking
    const dismissBtn = this.container.querySelector('#dismiss-tracking-btn');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => {
        this.activeTrackingOrder = null;
        this.render();
      });
    }

    // Search input
    const searchInput = this.container.querySelector('#cust-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.render();
        const ref = this.container.querySelector('#cust-search-input');
        if (ref) {
          ref.focus();
          ref.setSelectionRange(ref.value.length, ref.value.length);
        }
      });
    }

    const clearSearch = this.container.querySelector('#cust-clear-search');
    if (clearSearch) {
      clearSearch.addEventListener('click', () => {
        this.searchQuery = '';
        this.render();
      });
    }

    // Category pills
    this.container.querySelectorAll('.cust-cat-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectedCategory = btn.getAttribute('data-cat');
        this.render();
      });
    });

    // Add buttons
    this.container.querySelectorAll('.cust-add-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.addToBag(id);
      });
    });

    // Plus/Minus steppers
    this.container.querySelectorAll('.step-btn.plus').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.addToBag(id);
      });
    });
    this.container.querySelectorAll('.step-btn.minus').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.decrementBag(id);
      });
    });

    // Form inputs
    const nameInput = this.container.querySelector('#cust-form-name');
    if (nameInput) nameInput.addEventListener('input', (e) => this.customerName = e.target.value);

    const phoneInput = this.container.querySelector('#cust-form-phone');
    if (phoneInput) phoneInput.addEventListener('input', (e) => this.customerPhone = e.target.value);

    const pickupSelect = this.container.querySelector('#cust-form-pickup-slot');
    if (pickupSelect) pickupSelect.addEventListener('change', (e) => this.pickupSlot = e.target.value);

    const addrInput = this.container.querySelector('#cust-form-address');
    if (addrInput) addrInput.addEventListener('input', (e) => this.deliveryAddress = e.target.value);

    const landmarkInput = this.container.querySelector('#cust-form-landmark');
    if (landmarkInput) landmarkInput.addEventListener('input', (e) => this.landmark = e.target.value);

    const deliverySelect = this.container.querySelector('#cust-form-delivery-slot');
    if (deliverySelect) deliverySelect.addEventListener('change', (e) => this.deliverySlot = e.target.value);

    const notesInput = this.container.querySelector('#cust-form-notes');
    if (notesInput) notesInput.addEventListener('input', (e) => this.notes = e.target.value);

    // Payment radio
    this.container.querySelectorAll('input[name="cust-pay"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.paymentMethod = e.target.value;
        this.render();
      });
    });

    // Submit order button
    const submitBtn = this.container.querySelector('#cust-submit-order-btn');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        this.handleSubmitOrder();
      });
    }

    // Customer AI Parchi Listeners
    const openCustAiBtn = this.container.querySelector('#btn-cust-ai-parchi');
    const custAiModal = this.container.querySelector('#cust-ai-parchi-modal');
    const closeCustAiBtn = this.container.querySelector('#close-cust-ai-modal');
    const custTextarea = this.container.querySelector('#cust-parchi-textarea');
    const custSubmitAi = this.container.querySelector('#btn-cust-submit-ai-parchi');
    const custOutput = this.container.querySelector('#cust-ai-parchi-output');
    const custVoiceBtn = this.container.querySelector('#btn-cust-voice-dictate');
    const custVoiceLabel = this.container.querySelector('#cust-voice-label');

    if (openCustAiBtn && custAiModal) {
      openCustAiBtn.onclick = () => {
        custAiModal.classList.remove('hidden');
        if (custTextarea) custTextarea.focus();
      };
    }

    if (closeCustAiBtn && custAiModal) {
      closeCustAiBtn.onclick = () => {
        custAiModal.classList.add('hidden');
      };
    }

    this.container.querySelectorAll('.cust-parchi-chip').forEach(chip => {
      chip.onclick = () => {
        if (custTextarea) {
          custTextarea.value = chip.getAttribute('data-sample');
          custTextarea.focus();
        }
      };
    });

    if (custVoiceBtn) {
      custVoiceBtn.onclick = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
          alert('Speech Recognition is not supported by your browser.');
          return;
        }
        try {
          const recognition = new SpeechRecognition();
          recognition.lang = 'hi-IN';
          if (custVoiceLabel) custVoiceLabel.textContent = '🔴 Listening...';
          recognition.onresult = (e) => {
            const transcript = e.results[0][0].transcript;
            if (custTextarea) {
              custTextarea.value = (custTextarea.value ? custTextarea.value + ', ' : '') + transcript;
            }
          };
          recognition.onend = () => {
            if (custVoiceLabel) custVoiceLabel.textContent = '🎙️ Speak (बोलकर लिखें)';
          };
          recognition.start();
        } catch (e) {
          console.error(e);
          if (custVoiceLabel) custVoiceLabel.textContent = '🎙️ Speak (बोलकर लिखें)';
        }
      };
    }

    if (custSubmitAi && custTextarea && custOutput) {
      custSubmitAi.onclick = async () => {
        const text = custTextarea.value.trim();
        if (!text) {
          alert('Please enter or speak your grocery list first!');
          return;
        }

        custOutput.classList.remove('hidden');
        custOutput.innerHTML = `
          <div class="ai-loading-state">
            <span class="ai-spinner">🧠</span>
            <div><strong>Gemini AI is matching your list...</strong></div>
          </div>
        `;
        custSubmitAi.disabled = true;

        try {
          const products = db.getProducts();
          const result = await aiEngine.parseGroceryParchi(text, products);
          this.renderCustAiResults(result, custOutput, custAiModal);
        } catch (err) {
          custOutput.innerHTML = `<div class="ai-error-box">⚠️ ${err.message}</div>`;
        } finally {
          custSubmitAi.disabled = false;
        }
      };
    }
  }

  renderCustAiResults(result, outputEl, modalEl) {
    const inStock = (result.matchedItems || []).filter(i => i.inStock && i.availableStock > 0);
    outputEl.innerHTML = `
      <div class="ai-results-card">
        <div class="ai-results-header">
          <strong>${result.summary || 'List Parsed'}</strong>
          <span class="badge-count">${inStock.length} Available</span>
        </div>
        <div class="ai-items-list-table">
          <table class="receipt-table">
            <thead><tr><th class="text-left">Item</th><th>Qty</th><th>Status</th><th class="text-right">Rate</th></tr></thead>
            <tbody>
              ${(result.matchedItems || []).map(item => `
                <tr>
                  <td class="text-left"><strong>${item.matchedName}</strong></td>
                  <td>${item.qty} ${item.unit}</td>
                  <td>${item.inStock ? '<span class="stock-badge in-stock">✓ Available</span>' : '<span class="stock-badge out-stock">✕ Out of Stock</span>'}</td>
                  <td class="text-right">₹${(item.price * item.qty).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <button id="btn-cust-add-ai-bag" class="btn btn-primary btn-block btn-lg" style="margin-top: 12px;">
          ⚡ Add ${inStock.length} Items Directly to My Bag
        </button>
      </div>
    `;

    const addBtn = outputEl.querySelector('#btn-cust-add-ai-bag');
    if (addBtn) {
      addBtn.onclick = () => {
        inStock.forEach(item => {
          const prod = db.getProductById(item.catalogId);
          if (prod) {
            const qty = Math.min(item.qty || 1, prod.stock);
            const existing = this.cart.find(c => c.id === prod.id);
            if (existing) {
              existing.qty = Math.min(prod.stock, existing.qty + qty);
            } else {
              this.cart.push({
                id: prod.id,
                name: prod.name,
                hindiName: prod.hindiName,
                sellingPrice: prod.sellingPrice,
                mrp: prod.mrp,
                unit: prod.unit,
                gstRate: prod.gstRate,
                qty
              });
            }
          }
        });
        sounds.playSuccessAlert();
        confetti({ particleCount: 50, spread: 50, origin: { y: 0.5 } });
        modalEl.classList.add('hidden');
        this.render();
      };
    }
  }

  addToBag(prodId) {
    const prod = db.getProductById(prodId);
    if (!prod || prod.stock <= 0) return;

    const existing = this.cart.find(c => c.id === prodId);
    if (existing) {
      if (existing.qty < prod.stock) {
        existing.qty += 1;
        sounds.playScanBeep();
      } else {
        alert(`Cannot add more. Only ${prod.stock} ${prod.unit} available in stock.`);
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
        qty: 1
      });
      sounds.playScanBeep();
    }
    this.render();
  }

  decrementBag(prodId) {
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

  handleSubmitOrder() {
    if (this.cart.length === 0) {
      alert('Your bag is empty.');
      return;
    }

    if (!this.customerName.trim()) {
      alert('Please enter your Name.');
      const n = this.container.querySelector('#cust-form-name');
      if (n) n.focus();
      return;
    }

    if (!this.customerPhone.trim() || this.customerPhone.length < 10) {
      alert('Please enter a valid 10-digit Mobile Number.');
      const p = this.container.querySelector('#cust-form-phone');
      if (p) p.focus();
      return;
    }

    if (this.orderType === 'home_delivery' && !this.deliveryAddress.trim()) {
      alert('Please enter your Delivery Address.');
      const a = this.container.querySelector('#cust-form-address');
      if (a) a.focus();
      return;
    }

    const settings = db.getSettings();
    const totals = this.calculateTotals(settings);

    if (this.paymentMethod === 'UPI') {
      this.showCustomerUpiModal(totals);
    } else {
      this.finishPlacingOrder(totals, this.paymentMethod, 'pending');
    }
  }

  async showCustomerUpiModal(totals) {
    const settings = db.getSettings();
    const modal = this.container.querySelector('#cust-upi-modal');
    if (!modal) return;

    modal.classList.remove('hidden');

    const tempToken = Math.floor(100 + Math.random() * 900);
    const upiUrl = `upi://pay?pa=${encodeURIComponent(settings.upiId)}&pn=${encodeURIComponent(settings.storeName)}&am=${totals.finalTotal.toFixed(2)}&cu=INR&tn=${encodeURIComponent('PreOrder Token ' + tempToken)}`;

    const canvas = modal.querySelector('#cust-upi-canvas');
    if (canvas) {
      try {
        await QRCode.toCanvas(canvas, upiUrl, {
          width: 220,
          margin: 1,
          color: { dark: '#0f172a', light: '#ffffff' }
        });
      } catch (e) {
        console.error(e);
      }
    }

    const closeBtn = modal.querySelector('#close-cust-upi');
    closeBtn.onclick = () => modal.classList.add('hidden');

    const confirmBtn = modal.querySelector('#cust-upi-confirm-btn');
    confirmBtn.onclick = () => {
      modal.classList.add('hidden');
      sounds.playUpiSoundboxChime(totals.finalTotal);
      this.finishPlacingOrder(totals, 'UPI', 'paid');
    };
  }

  finishPlacingOrder(totals, paymentMethod, paymentStatus) {
    const orderData = {
      orderType: this.orderType,
      customerName: this.customerName,
      customerPhone: this.customerPhone,
      pickupTimeSlot: this.orderType === 'advance_pickup' ? this.pickupSlot : null,
      deliveryAddress: this.orderType === 'home_delivery' ? this.deliveryAddress : null,
      landmark: this.orderType === 'home_delivery' ? this.landmark : null,
      deliverySlot: this.orderType === 'home_delivery' ? this.deliverySlot : null,
      status: 'pending',
      paymentMethod: paymentMethod,
      paymentStatus: paymentStatus,
      items: JSON.parse(JSON.stringify(this.cart)),
      itemCount: this.cart.reduce((s, it) => s + it.qty, 0),
      subtotal: totals.subtotal,
      deliveryFee: totals.deliveryFee,
      savings: totals.savings,
      taxTotal: 0,
      total: totals.finalTotal,
      notes: this.notes
    };

    const newOrder = db.createOrder(orderData);
    sounds.playSuccessAlert();
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.5 } });

    // Clear cart and show active tracking
    this.cart = [];
    this.activeTrackingOrder = newOrder;
    this.render();

    if (this.onOrderPlaced) {
      this.onOrderPlaced(newOrder);
    }
  }

  updateLiveOrderStatus(orderId, newStatus) {
    if (this.activeTrackingOrder && this.activeTrackingOrder.id === orderId) {
      this.activeTrackingOrder.status = newStatus;
      this.render();
    }
  }
}
