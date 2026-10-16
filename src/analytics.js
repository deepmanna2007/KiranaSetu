import { db, INITIAL_PRODUCTS, INITIAL_ORDERS } from './db.js';
import { aiEngine } from './ai.js';

export class AnalyticsModule {
  constructor(containerEl, onSettingsUpdated) {
    this.container = containerEl;
    this.onSettingsUpdated = onSettingsUpdated;
    this.activeSubTab = 'sales'; // 'sales' or 'settings'
  }

  render() {
    const orders = db.getOrders();
    const settings = db.getSettings();

    // Calculate analytics metrics
    const totalBills = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? o.total : 0), 0);
    
    const upiRevenue = orders
      .filter(o => o.paymentMethod === 'UPI' && o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.total, 0);

    const cashRevenue = orders
      .filter(o => (o.paymentMethod === 'Cash' || o.paymentMethod === 'COD') && o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.total, 0);

    const khataRevenue = orders
      .filter(o => o.paymentMethod === 'Khata' && o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.total, 0);

    const averageBillValue = totalBills > 0 ? Math.round(totalRevenue / totalBills) : 0;

    this.container.innerHTML = `
      <div class="analytics-view">
        <!-- Sub-navigation -->
        <div class="sub-nav-tabs">
          <button class="sub-tab-btn ${this.activeSubTab === 'sales' ? 'active' : ''}" data-sub="sales">
            📊 Sales Analytics & Invoices History
          </button>
          <button class="sub-tab-btn ${this.activeSubTab === 'settings' ? 'active' : ''}" data-sub="settings">
            ⚙️ Store Profile & GST/UPI Settings
          </button>
        </div>

        ${this.activeSubTab === 'sales' ? `
          <!-- Analytics Metrics -->
          <div class="stats-overview-grid">
            <div class="stat-card">
              <div class="stat-icon bg-green">💵</div>
              <div class="stat-details">
                <span class="stat-title">Total Revenue Generated</span>
                <span class="stat-number text-success">₹${totalRevenue.toLocaleString('en-IN')}</span>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon bg-blue">🧾</div>
              <div class="stat-details">
                <span class="stat-title">Total Invoices & Orders</span>
                <span class="stat-number">${totalBills} Bills</span>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon bg-purple">📱</div>
              <div class="stat-details">
                <span class="stat-title">UPI Digital Payments</span>
                <span class="stat-number text-primary">₹${upiRevenue.toLocaleString('en-IN')}</span>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon bg-amber">📈</div>
              <div class="stat-details">
                <span class="stat-title">Average Bill Value</span>
                <span class="stat-number">₹${averageBillValue}</span>
              </div>
            </div>
          </div>

          <!-- Payment Mode Split Progress Bar -->
          <div class="payment-split-card">
            <h4>Payment Mode Distribution</h4>
            <div class="split-bar-wrapper">
              ${totalRevenue > 0 ? `
                <div class="bar-segment upi" style="width: ${(upiRevenue / totalRevenue) * 100}%" title="UPI: ₹${upiRevenue}"></div>
                <div class="bar-segment cash" style="width: ${(cashRevenue / totalRevenue) * 100}%" title="Cash: ₹${cashRevenue}"></div>
                <div class="bar-segment khata" style="width: ${(khataRevenue / totalRevenue) * 100}%" title="Khata: ₹${khataRevenue}"></div>
              ` : `<div class="bar-segment empty" style="width: 100%"></div>`}
            </div>
            <div class="split-legend">
              <div class="legend-item"><span class="dot upi"></span> UPI: ₹${upiRevenue} (${totalRevenue > 0 ? Math.round((upiRevenue / totalRevenue) * 100) : 0}%)</div>
              <div class="legend-item"><span class="dot cash"></span> Cash: ₹${cashRevenue} (${totalRevenue > 0 ? Math.round((cashRevenue / totalRevenue) * 100) : 0}%)</div>
              <div class="legend-item"><span class="dot khata"></span> Khata (Credit): ₹${khataRevenue} (${totalRevenue > 0 ? Math.round((khataRevenue / totalRevenue) * 100) : 0}%)</div>
            </div>
          </div>

          <!-- All Invoices / Orders Table -->
          <div class="invoices-history-card">
            <div class="card-header-bar">
              <h4>📋 Recent Invoices & Orders</h4>
              <span class="badge-count">${orders.length} Records</span>
            </div>
            <div class="inv-table-wrapper">
              <table class="inv-table">
                <thead>
                  <tr>
                    <th>Invoice / Token</th>
                    <th>Date & Time</th>
                    <th>Type</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Total (₹)</th>
                    <th class="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${orders.map(o => {
                    const dt = new Date(o.createdAt).toLocaleString('en-IN', {
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                    });
                    const isPickup = o.orderType === 'advance_pickup';
                    const isDelivery = o.orderType === 'home_delivery';

                    return `
                      <tr>
                        <td>
                          <strong>${o.id}</strong>
                          <div class="token-sub">Token #${o.tokenNo}</div>
                        </td>
                        <td><small class="text-muted">${dt}</small></td>
                        <td>
                          <span class="type-pill ${isPickup ? 'pickup' : isDelivery ? 'delivery' : 'pos'}">
                            ${isPickup ? '🛍️ Advance Pickup' : isDelivery ? '🛵 Delivery' : '⚡ POS Bill'}
                          </span>
                        </td>
                        <td>
                          <strong>${o.customerName}</strong>
                          <div class="text-muted text-xs">${o.customerPhone}</div>
                        </td>
                        <td>${o.items.length} items (${o.itemCount || o.items.reduce((s, it) => s + it.qty, 0)})</td>
                        <td>
                          <span class="pay-method-badge ${o.paymentStatus === 'paid' ? 'paid' : 'pending'}">
                            ${o.paymentMethod} (${o.paymentStatus})
                          </span>
                        </td>
                        <td>
                          <span class="status-pill-small ${o.status}">
                            ${o.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td><strong>₹${o.total}</strong></td>
                        <td class="text-right">
                          <button class="btn-icon-action btn-view-invoice" data-id="${o.id}" title="View / Print Tax Invoice">🧾</button>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        ` : `
          <!-- Store Profile & GST/UPI Settings Form -->
          <div class="settings-card-form">
            <div class="settings-header">
              <h3>🏪 Kirana Store Profile & Digital Invoicing Settings</h3>
              <p>These details appear on your printed GST Tax Invoices and UPI QR Codes.</p>
            </div>

            <form id="store-settings-form" class="settings-form-grid">
              <div class="form-group span-2">
                <label>Store Name (दुकान का नाम) *</label>
                <input type="text" name="storeName" class="form-control" required value="${settings.storeName}" />
              </div>

              <div class="form-group span-2">
                <label>Tagline / Slogan</label>
                <input type="text" name="tagline" class="form-control" value="${settings.tagline}" />
              </div>

              <div class="form-group">
                <label>Owner Name</label>
                <input type="text" name="ownerName" class="form-control" value="${settings.ownerName}" />
              </div>

              <div class="form-group">
                <label>Mobile Number (for WhatsApp Invoices) *</label>
                <input type="tel" name="phone" class="form-control" required value="${settings.phone}" maxlength="10" />
              </div>

              <div class="form-group span-2">
                <label>Store Address *</label>
                <textarea name="address" class="form-control" rows="2" required>${settings.address}</textarea>
              </div>

              <div class="form-group">
                <label>GSTIN (Optional for composition / regular)</label>
                <input type="text" name="gstin" class="form-control" value="${settings.gstin}" />
              </div>

              <div class="form-group">
                <label>Shop UPI VPA / ID (for Instant QR Codes) *</label>
                <input type="text" name="upiId" class="form-control" required value="${settings.upiId}" 
                  placeholder="e.g. yourname@okhdfcbank or 9876543210@paytm" />
                <small class="text-muted">Used to generate dynamic QR codes for GPay, PhonePe, Paytm</small>
              </div>

              <div class="form-group">
                <label>Standard Home Delivery Fee (₹)</label>
                <input type="number" name="deliveryFee" class="form-control" required min="0" value="${settings.deliveryFee}" />
              </div>

              <div class="form-group">
                <label>Free Delivery Minimum Order (₹)</label>
                <input type="number" name="freeDeliveryThreshold" class="form-control" required min="0" value="${settings.freeDeliveryThreshold}" />
              </div>

              <div class="form-actions span-2">
                <button type="submit" class="btn btn-primary btn-lg">
                  💾 Save Store Settings
                </button>
                <button type="button" id="btn-reset-demo" class="btn btn-outline-danger">
                  🔄 Reset Demo Data (Products & Sample Orders)
                </button>
              </div>
            </form>

            <!-- Gemini AI API Key Section (stored in localStorage only) -->
            <div class="settings-card-form" style="margin-top:24px;border-color:rgba(139,92,246,0.3);">
              <div class="settings-header">
                <h3>✨ Gemini AI Configuration</h3>
                <p style="font-size:13px;color:var(--text-muted);">Your API key is stored <strong>only in your browser's localStorage</strong> — never sent to any server or included in source code.</p>
              </div>
              <div class="form-group">
                <label>Google Gemini API Key <span class="ai-badge-pill" style="font-size:10px;">Required for AI Smart Parchi &amp; AI Reminders</span></label>
                <div style="display:flex;gap:8px;">
                  <input type="password" id="gemini-key-input" class="form-control" 
                    placeholder="Paste your Gemini API Key here (starts with AI...)"
                    value="${aiEngine.getApiKey() ? '(API key is saved — paste new key to update)' : ''}" />
                  <button type="button" id="btn-save-gemini-key" class="btn btn-primary">
                    🔒 Save Key
                  </button>
                </div>
                <small class="text-muted">
                  Get a free key from 
                  <a href="https://aistudio.google.com/apikey" target="_blank" style="color:var(--primary);font-weight:600;">Google AI Studio → aistudio.google.com/apikey</a>
                  &nbsp;|&nbsp;
                  <button type="button" id="btn-clear-gemini-key" class="btn-text-danger" style="font-size:12px;">Clear Saved Key</button>
                </small>
              </div>
              ${aiEngine.getApiKey() ? `
                <div style="background:var(--success-bg);border-radius:var(--radius-md);padding:10px 14px;font-size:13px;color:#047857;">
                  ✓ Gemini API key is configured. AI Smart Parchi &amp; AI Reminders are active.
                </div>
              ` : `
                <div style="background:var(--warning-bg);border-radius:var(--radius-md);padding:10px 14px;font-size:13px;color:#92400e;">
                  ⚠️ No API key set. Add your Gemini key above to enable AI features.
                </div>
              `}
            </div>
          </div>
        `}
      </div>
    `;

    this.attachEventListeners();
  }

  attachEventListeners() {
    this.container.querySelectorAll('.sub-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeSubTab = btn.getAttribute('data-sub');
        this.render();
      });
    });

    // View invoice button
    this.container.querySelectorAll('.btn-view-invoice').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const order = db.getOrders().find(o => o.id === id);
        if (order) {
          window.dispatchEvent(new CustomEvent('show-invoice-modal', { detail: order }));
        }
      });
    });

    // Save settings form
    const form = this.container.querySelector('#store-settings-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const newSettings = {
          ...db.getSettings(),
          storeName: fd.get('storeName'),
          tagline: fd.get('tagline'),
          ownerName: fd.get('ownerName'),
          phone: fd.get('phone'),
          address: fd.get('address'),
          gstin: fd.get('gstin'),
          upiId: fd.get('upiId'),
          deliveryFee: parseFloat(fd.get('deliveryFee') || 30),
          freeDeliveryThreshold: parseFloat(fd.get('freeDeliveryThreshold') || 499)
        };
        db.saveSettings(newSettings);
        alert('Store profile and UPI settings saved successfully!');
        if (this.onSettingsUpdated) this.onSettingsUpdated();
      });
    }

    // Reset demo button
    const resetBtn = this.container.querySelector('#btn-reset-demo');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Reset all products, orders, and khatas to initial Indian Kirana demo state?')) {
          db.resetToDefault();
          alert('Demo data restored!');
          if (this.onSettingsUpdated) this.onSettingsUpdated();
          this.render();
        }
      });
    }
    // Gemini API Key Save
    const geminiKeyInput = this.container.querySelector('#gemini-key-input');
    const saveGeminiBtn = this.container.querySelector('#btn-save-gemini-key');
    const clearGeminiBtn = this.container.querySelector('#btn-clear-gemini-key');

    if (saveGeminiBtn && geminiKeyInput) {
      saveGeminiBtn.addEventListener('click', () => {
        const newKey = geminiKeyInput.value.trim();
        if (!newKey || newKey.startsWith('(API key')) {
          alert('Please paste a valid Gemini API key.');
          geminiKeyInput.focus();
          return;
        }
        aiEngine.setApiKey(newKey);
        alert('✓ Gemini API key saved to your browser. AI features are now active!');
        this.render();
      });
    }

    if (clearGeminiBtn) {
      clearGeminiBtn.addEventListener('click', () => {
        if (confirm('Clear the saved Gemini API key? AI features will be disabled.')) {
          localStorage.removeItem('kiranasetu_gemini_key');
          aiEngine.apiKey = '';
          this.render();
        }
      });
    }
  }
}
