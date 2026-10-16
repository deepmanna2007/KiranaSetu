import { db } from './db.js';
import { sounds } from './sound.js';

export class BookingsManagerModule {
  constructor(containerEl, onStatusChange) {
    this.container = containerEl;
    this.onStatusChange = onStatusChange;
    this.activeTab = 'pickup'; // 'pickup' or 'delivery'
    this.statusFilter = 'all';
  }

  render() {
    const orders = db.getOrders();
    const settings = db.getSettings();

    // Separate pickups and deliveries
    const pickupOrders = orders.filter(o => o.orderType === 'advance_pickup');
    const deliveryOrders = orders.filter(o => o.orderType === 'home_delivery');

    const currentList = this.activeTab === 'pickup' ? pickupOrders : deliveryOrders;

    const filteredOrders = currentList.filter(o => {
      if (this.statusFilter === 'all') return true;
      return o.status === this.statusFilter;
    });

    const pendingPickupCount = pickupOrders.filter(o => o.status === 'pending' || o.status === 'packing').length;
    const readyPickupCount = pickupOrders.filter(o => o.status === 'ready_for_pickup').length;
    const pendingDeliveryCount = deliveryOrders.filter(o => o.status === 'pending' || o.status === 'packing' || o.status === 'out_for_delivery').length;

    this.container.innerHTML = `
      <div class="bookings-manager-view">
        <!-- Header & Tabs -->
        <div class="bookings-header">
          <div class="bookings-title-area">
            <h3>📦 Order Fulfillment & Dispatch Hub</h3>
            <p>Manage customer advance store pickups and home deliveries in real time</p>
          </div>

          <!-- Tab switchers -->
          <div class="hub-tabs">
            <button class="hub-tab ${this.activeTab === 'pickup' ? 'active' : ''}" data-tab="pickup">
              <span class="tab-emoji">🛍️</span> Advance Store Pickups
              ${pendingPickupCount > 0 ? `<span class="badge-bubble red">${pendingPickupCount}</span>` : ''}
              ${readyPickupCount > 0 ? `<span class="badge-bubble green">${readyPickupCount} Ready</span>` : ''}
            </button>
            <button class="hub-tab ${this.activeTab === 'delivery' ? 'active' : ''}" data-tab="delivery">
              <span class="tab-emoji">🛵</span> Home Deliveries
              ${pendingDeliveryCount > 0 ? `<span class="badge-bubble orange">${pendingDeliveryCount}</span>` : ''}
            </button>
          </div>
        </div>

        <!-- Filter bar -->
        <div class="hub-filters-bar">
          <div class="status-filters">
            <button class="filter-btn ${this.statusFilter === 'all' ? 'active' : ''}" data-filter="all">All</button>
            <button class="filter-btn ${this.statusFilter === 'pending' ? 'active' : ''}" data-filter="pending">⏳ New / Pending</button>
            <button class="filter-btn ${this.statusFilter === 'packing' ? 'active' : ''}" data-filter="packing">📦 In Packing</button>
            ${this.activeTab === 'pickup' ? `
              <button class="filter-btn ${this.statusFilter === 'ready_for_pickup' ? 'active' : ''}" data-filter="ready_for_pickup">🛍️ Ready for Pickup</button>
              <button class="filter-btn ${this.statusFilter === 'collected' ? 'active' : ''}" data-filter="collected">✓ Collected</button>
            ` : `
              <button class="filter-btn ${this.statusFilter === 'out_for_delivery' ? 'active' : ''}" data-filter="out_for_delivery">🛵 Out for Delivery</button>
              <button class="filter-btn ${this.statusFilter === 'delivered' ? 'active' : ''}" data-filter="delivered">✓ Delivered</button>
            `}
          </div>
        </div>

        <!-- Orders Cards Grid / List -->
        <div class="hub-orders-container">
          ${filteredOrders.length === 0 ? `
            <div class="empty-hub-state">
              <span class="empty-icon">📭</span>
              <h4>No ${this.activeTab === 'pickup' ? 'advance store pickups' : 'home delivery orders'} found</h4>
              <p>When customers pre-book via the Customer Portal, orders will instantly show here.</p>
            </div>
          ` : filteredOrders.map(order => this.renderOrderCard(order, settings)).join('')}
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  renderOrderCard(order, settings) {
    const isPickup = order.orderType === 'advance_pickup';
    const isPaid = order.paymentStatus === 'paid';

    let statusPillClass = 'badge-pending';
    let statusLabel = 'New Order Received';
    if (order.status === 'packing') {
      statusPillClass = 'badge-packing';
      statusLabel = '📦 Packing in Progress';
    } else if (order.status === 'ready_for_pickup') {
      statusPillClass = 'badge-ready';
      statusLabel = '🛍️ Packed & Ready at Counter';
    } else if (order.status === 'out_for_delivery') {
      statusPillClass = 'badge-dispatched';
      statusLabel = '🛵 Out for Delivery';
    } else if (order.status === 'collected' || order.status === 'delivered') {
      statusPillClass = 'badge-completed';
      statusLabel = isPickup ? '✓ Collected & Closed' : '✓ Delivered & Closed';
    } else if (order.status === 'cancelled') {
      statusPillClass = 'badge-cancelled';
      statusLabel = '✕ Cancelled';
    }

    const orderTime = new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    return `
      <div class="hub-order-card ${order.status}" data-id="${order.id}">
        <!-- Card Top Bar -->
        <div class="card-top-header">
          <div class="card-token-box">
            <span class="token-title">TOKEN</span>
            <span class="token-number">#${order.tokenNo}</span>
          </div>

          <div class="card-main-meta">
            <div class="order-id-line">
              <span class="id-text">${order.id}</span>
              <span class="order-time">${orderTime}</span>
              <span class="order-badge ${statusPillClass}">${statusLabel}</span>
            </div>
            <div class="customer-highlight">
              <strong class="cust-name">${order.customerName}</strong>
              <span class="cust-phone">📞 <a href="tel:${order.customerPhone}">${order.customerPhone}</a></span>
              <button class="btn-wa-ping" data-phone="${order.customerPhone}" data-token="${order.tokenNo}" data-name="${order.customerName}" title="Chat on WhatsApp">💬 WhatsApp</button>
            </div>
          </div>

          <div class="card-amount-pill">
            <div class="order-total">₹${order.total}</div>
            <div class="pay-tag ${isPaid ? 'paid' : 'due'}">
              ${isPaid ? '✓ Paid Online (' + order.paymentMethod + ')' : '⚠ ' + order.paymentMethod + ' (Due)'}
            </div>
          </div>
        </div>

        <!-- Timing / Delivery Slot Banner -->
        <div class="slot-callout ${isPickup ? 'pickup-slot' : 'delivery-slot'}">
          ${isPickup ? `
            <span>⏰ <strong>Customer Pickup Time:</strong> ${order.pickupTimeSlot || 'As soon as possible'}</span>
          ` : `
            <span>📍 <strong>Address:</strong> ${order.deliveryAddress || 'Not specified'} ${order.landmark ? `(Landmark: ${order.landmark})` : ''} | <strong>Slot:</strong> ${order.deliverySlot}</span>
          `}
          ${order.notes ? `<div class="customer-notes-bubble">📝 Note: "${order.notes}"</div>` : ''}
        </div>

        <!-- Packing Checklist (Helps shopkeeper pack items accurately) -->
        <div class="packing-checklist-box">
          <div class="checklist-header">
            <span>Items to Pack (${order.items.length} items):</span>
            <small class="text-muted">Tick as you put into bag</small>
          </div>
          <div class="checklist-items">
            ${order.items.map((it, idx) => `
              <label class="check-item-row">
                <input type="checkbox" class="pack-checkbox" />
                <span class="check-item-qty">${it.qty} ×</span>
                <span class="check-item-name">${it.name} <small class="text-muted">(${it.unit})</small></span>
                <span class="check-item-price">₹${it.sellingPrice * it.qty}</span>
              </label>
            `).join('')}
          </div>
        </div>

        <!-- Action Buttons depending on status -->
        <div class="card-actions-bar">
          ${order.status === 'pending' ? `
            <button class="btn btn-warning btn-sm btn-advance-status" data-id="${order.id}" data-status="packing">
              📦 Start Packing Bag
            </button>
          ` : ''}

          ${order.status === 'packing' && isPickup ? `
            <button class="btn btn-primary btn-sm btn-advance-status" data-id="${order.id}" data-status="ready_for_pickup">
              🛍️ Bag Ready at Counter (Notify Customer)
            </button>
          ` : ''}

          ${order.status === 'packing' && !isPickup ? `
            <button class="btn btn-primary btn-sm btn-advance-status" data-id="${order.id}" data-status="out_for_delivery">
              🛵 Handover to Delivery Boy (Dispatch)
            </button>
          ` : ''}

          ${order.status === 'ready_for_pickup' ? `
            <button class="btn btn-success btn-sm btn-advance-status" data-id="${order.id}" data-status="collected" data-payment="paid">
              🤝 Customer Arrived! Handover & Mark Complete
            </button>
          ` : ''}

          ${order.status === 'out_for_delivery' ? `
            <button class="btn btn-success btn-sm btn-advance-status" data-id="${order.id}" data-status="delivered" data-payment="paid">
              ✓ Delivery Confirmed & Payment Collected
            </button>
          ` : ''}

          ${order.status !== 'collected' && order.status !== 'delivered' && order.status !== 'cancelled' ? `
            <button class="btn btn-outline-danger btn-sm btn-cancel-order" data-id="${order.id}">
              ✕ Cancel Order
            </button>
          ` : ''}

          <button class="btn btn-secondary-outline btn-sm btn-print-receipt" data-id="${order.id}">
            🧾 View / Print Bill
          </button>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    // Tab switching
    this.container.querySelectorAll('.hub-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.activeTab = tab.getAttribute('data-tab');
        this.statusFilter = 'all';
        this.render();
      });
    });

    // Status filter buttons
    this.container.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.statusFilter = btn.getAttribute('data-filter');
        this.render();
      });
    });

    // Advance status button
    this.container.querySelectorAll('.btn-advance-status').forEach(btn => {
      btn.addEventListener('click', () => {
        const orderId = btn.getAttribute('data-id');
        const nextStatus = btn.getAttribute('data-status');
        const paymentStatus = btn.getAttribute('data-payment');

        db.updateOrderStatus(orderId, nextStatus, paymentStatus);
        sounds.playSuccessAlert();

        if (nextStatus === 'ready_for_pickup') {
          // Play notification chime and alert
          alert(`Order ${orderId} is marked as Packed & Ready! Customer can now collect immediately upon arrival.`);
        } else if (nextStatus === 'collected' || nextStatus === 'delivered') {
          sounds.playUpiSoundboxChime(100);
        }

        this.render();
        if (this.onStatusChange) {
          this.onStatusChange(orderId, nextStatus);
        }
      });
    });

    // Cancel order button
    this.container.querySelectorAll('.btn-cancel-order').forEach(btn => {
      btn.addEventListener('click', () => {
        const orderId = btn.getAttribute('data-id');
        if (confirm(`Are you sure you want to cancel Order ${orderId}? Stock will be restored.`)) {
          db.updateOrderStatus(orderId, 'cancelled');
          this.render();
          if (this.onStatusChange) {
            this.onStatusChange(orderId, 'cancelled');
          }
        }
      });
    });

    // WhatsApp Ping button
    this.container.querySelectorAll('.btn-wa-ping').forEach(btn => {
      btn.addEventListener('click', () => {
        const phone = btn.getAttribute('data-phone');
        const token = btn.getAttribute('data-token');
        const name = btn.getAttribute('data-name');
        const settings = db.getSettings();

        const msg = `Namaste ${name} ji! 🙏%0A` +
          `Your order at *${settings.storeName}* with *Token #${token}* is being processed.%0A` +
          `We will keep it packed and ready for you!`;

        const cleanPhone = phone.replace(/\D/g, '');
        window.open(`https://wa.me/91${cleanPhone}?text=${msg}`, '_blank');
      });
    });

    // Print Receipt button
    this.container.querySelectorAll('.btn-print-receipt').forEach(btn => {
      btn.addEventListener('click', () => {
        const orderId = btn.getAttribute('data-id');
        const orders = db.getOrders();
        const order = orders.find(o => o.id === orderId);
        if (order) {
          // Trigger the POS invoice modal display
          const posEvent = new CustomEvent('show-invoice-modal', { detail: order });
          window.dispatchEvent(posEvent);
        }
      });
    });
  }
}
