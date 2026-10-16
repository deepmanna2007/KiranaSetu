import { db } from './db.js';
import { sounds } from './sound.js';
import { aiEngine } from './ai.js';

export class KhataModule {
  constructor(containerEl, onKhataChanged) {
    this.container = containerEl;
    this.onKhataChanged = onKhataChanged;
    this.searchQuery = '';
    this.selectedCustomer = null;
    this.showAddModal = false;
    this.showPaymentModal = false;
    this.showAiReminderModal = false;
    this.aiReminders = [];
    this.aiCustomer = null;
    this.isLoadingAi = false;
  }

  render() {
    const customers = db.getCustomers();
    const settings = db.getSettings();

    const totalOutstanding = customers.reduce((sum, c) => sum + (c.khataBalance || 0), 0);
    const customersWithDue = customers.filter(c => c.khataBalance > 0);

    const filtered = customers.filter(c => {
      const q = this.searchQuery.toLowerCase().trim();
      return !q || c.name.toLowerCase().includes(q) || c.phone.includes(q);
    });

    this.container.innerHTML = `
      <div class="khata-view">
        <!-- Stats Top Cards -->
        <div class="khata-stats-grid">
          <div class="stat-card">
            <div class="stat-icon bg-red">📒</div>
            <div class="stat-details">
              <span class="stat-title">Total Outstanding Udhar (बाकी)</span>
              <span class="stat-number text-danger">₹${totalOutstanding.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon bg-amber">👥</div>
            <div class="stat-details">
              <span class="stat-title">Customers with Due Balance</span>
              <span class="stat-number">${customersWithDue.length} Accounts</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon bg-green">🛡️</div>
            <div class="stat-details">
              <span class="stat-title">Total Registered Khatas</span>
              <span class="stat-number">${customers.length} Customers</span>
            </div>
          </div>
        </div>

        <!-- Khata Search & Add Header -->
        <div class="khata-header-bar">
          <div class="search-box-wrap">
            <span class="search-icon">🔍</span>
            <input type="text" id="khata-search-input" class="form-control" 
              placeholder="Search customer by name or phone (e.g. Sharma ji, 9810...)" 
              value="${this.searchQuery}" />
          </div>
          <button id="btn-add-khata-customer" class="btn btn-primary btn-sm">
            + New Khata Account
          </button>
        </div>

        <!-- Customers Ledger List -->
        <div class="khata-ledger-grid">
          ${filtered.length === 0 ? `
            <div class="empty-state">
              <span class="empty-emoji">📒</span>
              <p>No customer khata found.</p>
            </div>
          ` : filtered.map(c => `
            <div class="khata-card ${c.khataBalance > 0 ? 'has-due' : 'settled'}">
              <div class="khata-card-header">
                <div>
                  <h4 class="khata-cust-name">${c.name}</h4>
                  <div class="khata-cust-sub">
                    <span>📞 ${c.phone}</span>
                    ${c.address ? `• <span>📍 ${c.address}</span>` : ''}
                  </div>
                </div>
                <div class="khata-balance-badge ${c.khataBalance > 0 ? 'due' : 'zero'}">
                  <span class="bal-label">${c.khataBalance > 0 ? 'Due (बाकी)' : 'Settled (चुक्ता)'}</span>
                  <span class="bal-amount">₹${c.khataBalance}</span>
                </div>
              </div>

              <!-- Recent Entries Mini List -->
              <div class="khata-entries-preview">
                ${c.history && c.history.length > 0 ? `
                  <div class="entries-title">Last Activity:</div>
                  ${c.history.slice(0, 2).map(h => `
                    <div class="entry-line">
                      <span class="entry-date">${h.date}</span>
                      <span class="entry-desc">${h.desc}</span>
                      <span class="entry-val ${h.debit > 0 ? 'debit' : 'credit'}">
                        ${h.debit > 0 ? `+₹${h.debit}` : `−₹${h.credit}`}
                      </span>
                    </div>
                  `).join('')}
                ` : `<div class="text-muted text-sm">No past credit transactions.</div>`}
              </div>

              <div class="khata-card-actions">
                ${c.khataBalance > 0 ? `
                  <button class="btn btn-success-soft btn-sm btn-record-jama" data-id="${c.id}" data-name="${c.name}" data-balance="${c.khataBalance}">
                    💰 Record Payment (जमा)
                  </button>
                  <button class="btn btn-ai-sparkle btn-sm btn-ai-reminder" style="font-size:11px;padding:6px 12px;" data-phone="${c.phone}" data-name="${c.name}" data-balance="${c.khataBalance}">
                    ✨ AI Reminder (Gemini)
                  </button>
                ` : `
                  <span class="text-success text-sm font-semibold">✓ No Pending Balance</span>
                `}
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Add Customer Modal -->
        <div id="add-cust-modal" class="modal-overlay ${this.showAddModal ? '' : 'hidden'}">
          <div class="modal-content">
            <button id="close-add-cust-modal" class="modal-close-btn">✕</button>
            <div class="modal-header">
              <h3>➕ Open New Customer Khata</h3>
            </div>
            <form id="add-customer-form">
              <div class="form-group">
                <label>Customer Name *</label>
                <input type="text" name="name" class="form-control" required placeholder="e.g. Ramesh Kumar" />
              </div>
              <div class="form-group">
                <label>Mobile Number *</label>
                <input type="tel" name="phone" class="form-control" required placeholder="10-digit phone" maxlength="10" />
              </div>
              <div class="form-group">
                <label>Address / Quarter / Gali No.</label>
                <input type="text" name="address" class="form-control" placeholder="e.g. House 24, Main Road" />
              </div>
              <div class="form-group">
                <label>Initial Opening Udhar Balance (Optional)</label>
                <input type="number" name="initialBalance" class="form-control" value="0" min="0" />
              </div>
              <button type="submit" class="btn btn-primary btn-block">Save Khata</button>
            </form>
          </div>
        </div>

        <!-- Record Payment Modal -->
        <div id="payment-modal" class="modal-overlay ${this.showPaymentModal ? '' : 'hidden'}">
          <div class="modal-content">
            <button id="close-pay-modal" class="modal-close-btn">✕</button>
            <div class="modal-header">
              <h3>💰 Record Jama / Payment</h3>
              <p id="pay-modal-cust-name"></p>
            </div>
            <form id="record-pay-form">
              <input type="hidden" name="customerId" id="pay-cust-id" />
              <div class="form-group">
                <label>Amount Received (₹) *</label>
                <input type="number" name="amount" id="pay-amount-input" class="form-control form-control-lg" required min="1" step="1" />
              </div>
              <div class="form-group">
                <label>Payment Mode</label>
                <select name="method" class="form-control">
                  <option value="Cash">Cash (नकद)</option>
                  <option value="UPI (GPay / PhonePe)">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                </select>
              </div>
              <button type="submit" class="btn btn-success btn-block btn-lg">
                ✓ Confirm Payment & Update Khata
              </button>
            </form>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  attachEventListeners() {
    const search = this.container.querySelector('#khata-search-input');
    if (search) {
      search.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.render();
        const ref = this.container.querySelector('#khata-search-input');
        if (ref) {
          ref.focus();
          ref.setSelectionRange(ref.value.length, ref.value.length);
        }
      });
    }

    const addBtn = this.container.querySelector('#btn-add-khata-customer');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        this.showAddModal = true;
        this.render();
      });
    }

    const closeAdd = this.container.querySelector('#close-add-cust-modal');
    if (closeAdd) {
      closeAdd.addEventListener('click', () => {
        this.showAddModal = false;
        this.render();
      });
    }

    const addForm = this.container.querySelector('#add-customer-form');
    if (addForm) {
      addForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(addForm);
        const name = fd.get('name');
        const phone = fd.get('phone');
        const address = fd.get('address');
        const initial = parseFloat(fd.get('initialBalance') || 0);

        const customers = db.getCustomers();
        customers.push({
          id: 'cust-' + Date.now().toString(36),
          name,
          phone,
          address,
          khataBalance: initial,
          history: initial > 0 ? [{ date: new Date().toISOString().split('T')[0], desc: 'Opening Balance', debit: initial, credit: 0 }] : []
        });
        db.saveCustomers(customers);

        this.showAddModal = false;
        this.render();
        if (this.onKhataChanged) this.onKhataChanged();
      });
    }

    // Record Jama Modal buttons
    this.container.querySelectorAll('.btn-record-jama').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const name = btn.getAttribute('data-name');
        const balance = btn.getAttribute('data-balance');

        this.showPaymentModal = true;
        this.render();

        const custNameEl = this.container.querySelector('#pay-modal-cust-name');
        const idInput = this.container.querySelector('#pay-cust-id');
        const amtInput = this.container.querySelector('#pay-amount-input');
        if (custNameEl) custNameEl.textContent = `Customer: ${name} (Total Due: ₹${balance})`;
        if (idInput) idInput.value = id;
        if (amtInput) amtInput.value = balance;
      });
    });

    const closePay = this.container.querySelector('#close-pay-modal');
    if (closePay) {
      closePay.addEventListener('click', () => {
        this.showPaymentModal = false;
        this.render();
      });
    }

    const payForm = this.container.querySelector('#record-pay-form');
    if (payForm) {
      payForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(payForm);
        const customerId = fd.get('customerId');
        const amount = parseFloat(fd.get('amount'));
        const method = fd.get('method');

        db.recordKhataPayment(customerId, amount, method);
        sounds.playUpiSoundboxChime(amount);

        this.showPaymentModal = false;
        this.render();
        if (this.onKhataChanged) this.onKhataChanged();
      });
    }

    // AI-Powered WhatsApp Reminder (Gemini)
    this.container.querySelectorAll('.btn-ai-reminder').forEach(btn => {
      btn.addEventListener('click', async () => {
        const phone = btn.getAttribute('data-phone');
        const name = btn.getAttribute('data-name');
        const balance = btn.getAttribute('data-balance');
        const settings = db.getSettings();

        // Show loading overlay
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'ai-reminders-modal-overlay';
        loadingOverlay.innerHTML = `
          <div class="ai-reminders-card">
            <div class="ai-loading-state">
              <span class="ai-spinner">✨</span>
              <div>
                <strong>Gemini is crafting personalized reminders...</strong>
                <small class="text-muted"> Generating 3 culturally polite Hindi/Hinglish messages for ${name} ji</small>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(loadingOverlay);

        try {
          const reminders = await aiEngine.generateKhataReminder(name, balance, settings.storeName, settings.upiId);

          loadingOverlay.querySelector('.ai-reminders-card').innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
              <h3>✨ AI-Crafted Payment Reminders</h3>
              <button id="close-ai-reminder-overlay" class="modal-close-btn">✕</button>
            </div>
            <p class="text-muted" style="font-size:13px;margin-bottom:18px;">Choose your preferred tone for <strong>${name} ji</strong> (Balance: ₹${balance})</p>
            ${reminders.map(r => `
              <div class="reminder-option-card">
                <div class="reminder-option-title">${r.title}</div>
                <div class="reminder-text">${r.message}</div>
                <button class="btn-send-reminder btn-ai-send-wa" 
                  data-phone="${phone}" 
                  data-msg="${encodeURIComponent(r.message)}">
                  💬 Send on WhatsApp
                </button>
              </div>
            `).join('')}
          `;

          loadingOverlay.querySelector('#close-ai-reminder-overlay').onclick = () => {
            loadingOverlay.remove();
          };

          loadingOverlay.querySelectorAll('.btn-ai-send-wa').forEach(waBtn => {
            waBtn.onclick = () => {
              const ph = waBtn.getAttribute('data-phone').replace(/\D/g, '');
              const msg = waBtn.getAttribute('data-msg');
              window.open(`https://wa.me/91${ph}?text=${msg}`, '_blank');
              loadingOverlay.remove();
            };
          });

        } catch (err) {
          console.error('AI Reminder error:', err);
          loadingOverlay.querySelector('.ai-reminders-card').innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
              <h3>✨ AI Reminder</h3>
              <button id="close-ai-err" class="modal-close-btn">✕</button>
            </div>
            <div class="ai-error-box">
              ⚠️ AI reminder generation failed: ${err.message || 'Please check API key in Settings.'}<br/><br/>
              Sending standard reminder instead...
            </div>
          `;
          loadingOverlay.querySelector('#close-ai-err').onclick = () => loadingOverlay.remove();

          // Fallback to static reminder
          const msg = `Namaste ${name} ji! 🙏%0A` +
            `A gentle reminder that your pending balance at *${settings.storeName}* is *₹${balance}*.%0A` +
            `You can pay via UPI to *${settings.upiId}* or visit the store.%0A` +
            `Dhanyawad!`;
          const cleanPhone = phone.replace(/\D/g, '');
          window.open(`https://wa.me/91${cleanPhone}?text=${msg}`, '_blank');
        }
      });
    });
  }
}
