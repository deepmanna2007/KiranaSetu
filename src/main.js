import './style.css';
import { db } from './db.js';
import { sounds } from './sound.js';
import { PosBillingModule } from './pos.js';
import { BookingsManagerModule } from './bookings.js';
import { InventoryModule } from './inventory.js';
import { KhataModule } from './khata.js';
import { AnalyticsModule } from './analytics.js';
import { CustomerPortalModule } from './customerPortal.js';

class KiranaApp {
  constructor() {
    this.appEl = document.getElementById('app');
    this.currentRole = 'shopkeeper'; // 'shopkeeper' or 'customer'
    this.activeShopTab = 'pos'; // 'pos', 'bookings', 'inventory', 'khata', 'analytics'
    this.darkMode = localStorage.getItem('kiranasetu_theme') === 'dark';
    this.init();
  }

  init() {
    this.applyTheme();
    this.renderShell();
    this.mountActiveView();
    this.listenToGlobalEvents();
  }

  applyTheme() {
    if (this.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  toggleTheme() {
    this.darkMode = !this.darkMode;
    localStorage.setItem('kiranasetu_theme', this.darkMode ? 'dark' : 'light');
    this.applyTheme();
    this.renderShell();
    this.mountActiveView();
  }

  renderShell() {
    const settings = db.getSettings();
    const orders = db.getOrders();
    const products = db.getProducts();

    // Counts for badges
    const pendingPickups = orders.filter(o => o.orderType === 'advance_pickup' && (o.status === 'pending' || o.status === 'packing')).length;
    const pendingDeliveries = orders.filter(o => o.orderType === 'home_delivery' && (o.status === 'pending' || o.status === 'packing' || o.status === 'out_for_delivery')).length;
    const totalPendingOrders = pendingPickups + pendingDeliveries;
    const lowStockCount = products.filter(p => p.stock <= p.lowStockThreshold).length;

    this.appEl.innerHTML = `
      <div class="app-layout">
        <!-- Top Application Header -->
        <header class="app-topbar">
          <div class="topbar-left">
            <div class="brand-logo-area">
              <span class="brand-emblem">🛍️</span>
              <div class="brand-titles">
                <h1 class="brand-name">KiranaSetu <span class="brand-hindi">किराना सेतु</span></h1>
                <span class="brand-subtitle">${settings.storeName}</span>
              </div>
            </div>

            <!-- Role Mode Switcher (Shopkeeper vs Customer) -->
            <div class="role-switch-container">
              <button id="btn-role-shopkeeper" class="role-btn ${this.currentRole === 'shopkeeper' ? 'active' : ''}">
                <span class="role-icon">🏪</span>
                <span class="role-text">Shopkeeper POS Counter</span>
              </button>
              <button id="btn-role-customer" class="role-btn ${this.currentRole === 'customer' ? 'active' : ''}">
                <span class="role-icon">📱</span>
                <span class="role-text">Customer Pre-Order App</span>
              </button>
            </div>
          </div>

          <div class="topbar-right">
            <!-- Soundbox Audio toggle -->
            <button id="btn-toggle-sound" class="icon-toggle-btn ${sounds.enabled ? 'sound-on' : 'sound-off'}" title="Indian Soundbox Voice Alert">
              <span class="icon">${sounds.enabled ? '🔊' : '🔇'}</span>
              <span class="label">Soundbox</span>
            </button>

            <!-- Theme Toggle -->
            <button id="btn-toggle-theme" class="icon-toggle-btn" title="Toggle Light/Dark Mode">
              <span class="icon">${this.darkMode ? '☀️' : '🌙'}</span>
            </button>
          </div>
        </header>

        <!-- Shopkeeper Navigation Bar (Visible only when in Shopkeeper mode) -->
        ${this.currentRole === 'shopkeeper' ? `
          <nav class="shopkeeper-nav">
            <div class="nav-links-wrap">
              <button class="nav-item ${this.activeShopTab === 'pos' ? 'active' : ''}" data-tab="pos">
                <span class="nav-icon">⚡</span>
                <span class="nav-label">Billing Counter (POS)</span>
              </button>

              <button class="nav-item ${this.activeShopTab === 'bookings' ? 'active' : ''}" data-tab="bookings">
                <span class="nav-icon">📦</span>
                <span class="nav-label">Advance Pickups & Delivery</span>
                ${totalPendingOrders > 0 ? `<span class="nav-badge alert">${totalPendingOrders}</span>` : ''}
              </button>

              <button class="nav-item ${this.activeShopTab === 'inventory' ? 'active' : ''}" data-tab="inventory">
                <span class="nav-icon">📋</span>
                <span class="nav-label">Inventory & Stock Radar</span>
                ${lowStockCount > 0 ? `<span class="nav-badge warning">${lowStockCount} Low</span>` : ''}
              </button>

              <button class="nav-item ${this.activeShopTab === 'khata' ? 'active' : ''}" data-tab="khata">
                <span class="nav-icon">📒</span>
                <span class="nav-label">Customer Khata (Udhar)</span>
              </button>

              <button class="nav-item ${this.activeShopTab === 'analytics' ? 'active' : ''}" data-tab="analytics">
                <span class="nav-icon">📊</span>
                <span class="nav-label">Sales & Settings</span>
              </button>
            </div>
          </nav>
        ` : ''}

        <!-- Main View Mount Container -->
        <main id="main-view-container" class="main-content-area">
          <!-- Dynamically mounted content -->
        </main>
      </div>
    `;

    this.attachHeaderListeners();
  }

  attachHeaderListeners() {
    // Role switcher
    const shopRoleBtn = document.getElementById('btn-role-shopkeeper');
    const custRoleBtn = document.getElementById('btn-role-customer');

    if (shopRoleBtn) {
      shopRoleBtn.addEventListener('click', () => {
        this.currentRole = 'shopkeeper';
        this.renderShell();
        this.mountActiveView();
      });
    }

    if (custRoleBtn) {
      custRoleBtn.addEventListener('click', () => {
        this.currentRole = 'customer';
        this.renderShell();
        this.mountActiveView();
      });
    }

    // Sound toggle
    const soundBtn = document.getElementById('btn-toggle-sound');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        sounds.enabled = !sounds.enabled;
        this.renderShell();
        this.mountActiveView();
      });
    }

    // Theme toggle
    const themeBtn = document.getElementById('btn-toggle-theme');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        this.toggleTheme();
      });
    }

    // Shop navigation items
    if (this.currentRole === 'shopkeeper') {
      document.querySelectorAll('.shopkeeper-nav .nav-item').forEach(item => {
        item.addEventListener('click', () => {
          this.activeShopTab = item.getAttribute('data-tab');
          this.renderShell();
          this.mountActiveView();
        });
      });
    }
  }

  mountActiveView() {
    const container = document.getElementById('main-view-container');
    if (!container) return;

    if (this.currentRole === 'customer') {
      this.customerPortal = new CustomerPortalModule(container, (newOrder) => {
        // Notification when customer places advance order
        sounds.playSuccessAlert();
      });
      this.customerPortal.render();
    } else {
      switch (this.activeShopTab) {
        case 'pos':
          this.posModule = new PosBillingModule(container, (order) => {
            this.renderShell();
            this.mountActiveView();
          });
          this.posModule.render();
          break;

        case 'bookings':
          this.bookingsModule = new BookingsManagerModule(container, (orderId, newStatus) => {
            if (this.customerPortal) {
              this.customerPortal.updateLiveOrderStatus(orderId, newStatus);
            }
            this.renderShell();
            this.mountActiveView();
          });
          this.bookingsModule.render();
          break;

        case 'inventory':
          this.inventoryModule = new InventoryModule(container, () => {
            this.renderShell();
            this.mountActiveView();
          });
          this.inventoryModule.render();
          break;

        case 'khata':
          this.khataModule = new KhataModule(container, () => {
            this.renderShell();
            this.mountActiveView();
          });
          this.khataModule.render();
          break;

        case 'analytics':
          this.analyticsModule = new AnalyticsModule(container, () => {
            this.renderShell();
            this.mountActiveView();
          });
          this.analyticsModule.render();
          break;

        default:
          break;
      }
    }
  }

  listenToGlobalEvents() {
    window.addEventListener('show-invoice-modal', (e) => {
      const order = e.detail;
      if (!this.posModule) {
        this.activeShopTab = 'pos';
        this.renderShell();
        this.mountActiveView();
      }
      setTimeout(() => {
        if (this.posModule) {
          this.posModule.displayInvoiceReceipt(order);
        }
      }, 50);
    });
  }
}

// Start application
window.addEventListener('DOMContentLoaded', () => {
  new KiranaApp();
});
