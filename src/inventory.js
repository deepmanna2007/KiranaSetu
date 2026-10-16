import { db } from './db.js';

export class InventoryModule {
  constructor(containerEl, onProductUpdated) {
    this.container = containerEl;
    this.onProductUpdated = onProductUpdated;
    this.searchQuery = '';
    this.selectedCategory = 'all';
    this.stockFilter = 'all'; // 'all', 'low_stock', 'out_stock'
    this.editingProduct = null;
    this.showAddModal = false;
  }

  render() {
    const products = db.getProducts();
    const categories = ['all', ...new Set(products.map(p => p.category))];

    // Stats calculations
    const totalItems = products.length;
    const lowStockItems = products.filter(p => p.stock > 0 && p.stock <= p.lowStockThreshold);
    const outOfStockItems = products.filter(p => p.stock <= 0);
    const totalInventoryValue = products.reduce((sum, p) => sum + (p.costPrice * p.stock), 0);
    const totalRetailValue = products.reduce((sum, p) => sum + (p.sellingPrice * p.stock), 0);

    // Filter products
    const filtered = products.filter(p => {
      const matchCat = this.selectedCategory === 'all' || p.category === this.selectedCategory;
      const query = this.searchQuery.toLowerCase().trim();
      const matchQuery = !query || 
        p.name.toLowerCase().includes(query) ||
        (p.hindiName && p.hindiName.toLowerCase().includes(query)) ||
        (p.barcode && p.barcode.includes(query)) ||
        p.category.toLowerCase().includes(query);

      let matchStock = true;
      if (this.stockFilter === 'low_stock') {
        matchStock = p.stock > 0 && p.stock <= p.lowStockThreshold;
      } else if (this.stockFilter === 'out_stock') {
        matchStock = p.stock <= 0;
      }

      return matchCat && matchQuery && matchStock;
    });

    this.container.innerHTML = `
      <div class="inventory-view">
        <!-- Top Stats Row -->
        <div class="stats-overview-grid">
          <div class="stat-card">
            <div class="stat-icon bg-blue">📦</div>
            <div class="stat-details">
              <span class="stat-title">Total Active SKUs</span>
              <span class="stat-number">${totalItems} Items</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon bg-amber">⚠️</div>
            <div class="stat-details">
              <span class="stat-title">Low Stock Alert</span>
              <span class="stat-number ${lowStockItems.length > 0 ? 'text-warning' : ''}">${lowStockItems.length} Products</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon bg-red">🚫</div>
            <div class="stat-details">
              <span class="stat-title">Out of Stock</span>
              <span class="stat-number ${outOfStockItems.length > 0 ? 'text-danger' : ''}">${outOfStockItems.length} Products</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon bg-green">💰</div>
            <div class="stat-details">
              <span class="stat-title">Inventory Cost Value</span>
              <span class="stat-number">₹${totalInventoryValue.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        <!-- Inventory Control Bar -->
        <div class="inv-controls-bar">
          <div class="inv-search-wrap">
            <span class="search-icon">🔍</span>
            <input type="text" id="inv-search-input" class="form-control" 
              placeholder="Search product name, Hindi name, barcode..." 
              value="${this.searchQuery}" />
            ${this.searchQuery ? `<button id="inv-clear-search" class="clear-btn">✕</button>` : ''}
          </div>

          <div class="inv-filter-group">
            <select id="inv-cat-select" class="form-control form-control-sm">
              ${categories.map(c => `
                <option value="${c}" ${this.selectedCategory === c ? 'selected' : ''}>
                  ${c === 'all' ? 'All Categories' : c}
                </option>
              `).join('')}
            </select>

            <div class="stock-toggle-buttons">
              <button class="toggle-btn ${this.stockFilter === 'all' ? 'active' : ''}" data-filter="all">All</button>
              <button class="toggle-btn ${this.stockFilter === 'low_stock' ? 'active' : ''}" data-filter="low_stock">⚠️ Low Stock (${lowStockItems.length})</button>
              <button class="toggle-btn ${this.stockFilter === 'out_stock' ? 'active' : ''}" data-filter="out_stock">🚫 Out of Stock (${outOfStockItems.length})</button>
            </div>
          </div>

          <div class="inv-actions-group">
            <button id="btn-export-reorder" class="btn btn-warning-soft btn-sm" title="Copy Low Stock items list for Mandi Wholesale Order">
              📋 Reorder List
            </button>
            <button id="btn-open-add-product" class="btn btn-primary btn-sm">
              + Add New Item
            </button>
          </div>
        </div>

        <!-- Inventory Table -->
        <div class="inv-table-wrapper">
          <table class="inv-table">
            <thead>
              <tr>
                <th>Item / Hindi Name</th>
                <th>Category</th>
                <th>Barcode / HSN</th>
                <th>Stock Status</th>
                <th>Cost (₹)</th>
                <th>Selling (₹)</th>
                <th>MRP (₹)</th>
                <th>Margin</th>
                <th>GST Rate</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.length === 0 ? `
                <tr>
                  <td colspan="10" class="empty-table-cell">
                    No products found matching filters.
                  </td>
                </tr>
              ` : filtered.map(p => {
                const isOut = p.stock <= 0;
                const isLow = p.stock > 0 && p.stock <= p.lowStockThreshold;
                const margin = p.sellingPrice > p.costPrice 
                  ? Math.round(((p.sellingPrice - p.costPrice) / p.costPrice) * 100) 
                  : 0;

                return `
                  <tr class="${isOut ? 'row-out-stock' : isLow ? 'row-low-stock' : ''}">
                    <td>
                      <div class="inv-item-name-cell">
                        <span class="inv-item-emoji">${p.icon || '📦'}</span>
                        <div>
                          <strong>${p.name}</strong>
                          ${p.hindiName ? `<div class="inv-hindi">${p.hindiName}</div>` : ''}
                        </div>
                      </div>
                    </td>
                    <td><span class="category-tag">${p.category}</span></td>
                    <td>
                      <div class="barcode-tag">${p.barcode || '—'}</div>
                      <small class="text-muted">HSN: ${p.hsnCode || '—'}</small>
                    </td>
                    <td>
                      <div class="stock-adjust-widget">
                        <button class="btn-stock-micro minus" data-id="${p.id}" title="Reduce 1">−</button>
                        <span class="stock-count-val ${isOut ? 'text-danger' : isLow ? 'text-warning' : 'text-success'}">
                          ${p.stock} <small>${p.unit}</small>
                        </span>
                        <button class="btn-stock-micro plus" data-id="${p.id}" title="Add 1">+</button>
                        <button class="btn-stock-micro plus-batch" data-id="${p.id}" title="Add 10 (+10)">+10</button>
                      </div>
                    </td>
                    <td>₹${p.costPrice}</td>
                    <td><strong class="text-primary">₹${p.sellingPrice}</strong></td>
                    <td><span class="text-muted">₹${p.mrp}</span></td>
                    <td><span class="margin-pill">${margin}%</span></td>
                    <td>${p.gstRate}%</td>
                    <td class="text-right">
                      <button class="btn-icon-action edit-btn" data-id="${p.id}" title="Edit product">✏️</button>
                      <button class="btn-icon-action delete-btn" data-id="${p.id}" title="Delete product">🗑️</button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <!-- Add / Edit Product Modal -->
        <div id="product-modal-overlay" class="modal-overlay ${this.showAddModal ? '' : 'hidden'}">
          <div class="modal-content product-edit-card">
            <button id="close-product-modal" class="modal-close-btn">✕</button>
            <div class="modal-header">
              <h3>${this.editingProduct ? '✏️ Edit Product' : '➕ Add New Kirana Product'}</h3>
            </div>
            <form id="product-form" class="product-form-grid">
              <div class="form-group span-2">
                <label>Product Name (English) *</label>
                <input type="text" name="name" class="form-control" required 
                  placeholder="e.g. Aashirvaad Shudh Chakki Atta" 
                  value="${this.editingProduct ? this.editingProduct.name : ''}" />
              </div>

              <div class="form-group span-2">
                <label>हिन्दी नाम (Hindi Name)</label>
                <input type="text" name="hindiName" class="form-control" 
                  placeholder="उदा. आशीर्वाद चक्की आटा" 
                  value="${this.editingProduct ? this.editingProduct.hindiName || '' : ''}" />
              </div>

              <div class="form-group">
                <label>Category *</label>
                <input type="text" name="category" list="cat-suggestions" class="form-control" required
                  placeholder="Select or type category" 
                  value="${this.editingProduct ? this.editingProduct.category : 'Staples & Flour'}" />
                <datalist id="cat-suggestions">
                  <option value="Staples & Flour" />
                  <option value="Edible Oils" />
                  <option value="Pulses & Dals" />
                  <option value="Spices & Seasoning" />
                  <option value="Dairy & Eggs" />
                  <option value="Snacks & Packaged Food" />
                  <option value="Beverages" />
                  <option value="Cleaning & Household" />
                  <option value="Personal Care" />
                  <option value="Fresh Vegetables" />
                </datalist>
              </div>

              <div class="form-group">
                <label>Unit of Measure *</label>
                <input type="text" name="unit" class="form-control" required
                  placeholder="e.g. 1kg pkt, 500g, 1L pouch, pcs" 
                  value="${this.editingProduct ? this.editingProduct.unit : '1kg pkt'}" />
              </div>

              <div class="form-group">
                <label>Barcode / EAN (12 digits)</label>
                <div class="input-with-button">
                  <input type="text" name="barcode" class="form-control" 
                    placeholder="8901..." 
                    value="${this.editingProduct ? this.editingProduct.barcode || '' : ''}" />
                  <button type="button" id="btn-gen-barcode" class="btn btn-secondary-outline btn-sm">Gen</button>
                </div>
              </div>

              <div class="form-group">
                <label>HSN Code</label>
                <input type="text" name="hsnCode" class="form-control" 
                  placeholder="e.g. 1101, 1512" 
                  value="${this.editingProduct ? this.editingProduct.hsnCode || '' : ''}" />
              </div>

              <div class="form-group">
                <label>Cost Price (₹) *</label>
                <input type="number" name="costPrice" class="form-control" required min="0" step="0.5" 
                  value="${this.editingProduct ? this.editingProduct.costPrice : ''}" />
              </div>

              <div class="form-group">
                <label>Selling Price (₹) *</label>
                <input type="number" name="sellingPrice" class="form-control" required min="0" step="0.5" 
                  value="${this.editingProduct ? this.editingProduct.sellingPrice : ''}" />
              </div>

              <div class="form-group">
                <label>MRP (₹) *</label>
                <input type="number" name="mrp" class="form-control" required min="0" step="0.5" 
                  value="${this.editingProduct ? this.editingProduct.mrp : ''}" />
              </div>

              <div class="form-group">
                <label>Initial Stock Count *</label>
                <input type="number" name="stock" class="form-control" required min="0" 
                  value="${this.editingProduct ? this.editingProduct.stock : 10}" />
              </div>

              <div class="form-group">
                <label>Low Stock Alert Level</label>
                <input type="number" name="lowStockThreshold" class="form-control" required min="1" 
                  value="${this.editingProduct ? this.editingProduct.lowStockThreshold : 5}" />
              </div>

              <div class="form-group">
                <label>GST Rate</label>
                <select name="gstRate" class="form-control">
                  <option value="0" ${this.editingProduct && this.editingProduct.gstRate === 0 ? 'selected' : ''}>0% (Exempt / Grains / Milk)</option>
                  <option value="5" ${this.editingProduct && this.editingProduct.gstRate === 5 ? 'selected' : ''}>5% (Oils, Tea, Spices)</option>
                  <option value="12" ${this.editingProduct && this.editingProduct.gstRate === 12 ? 'selected' : ''}>12% (Butter, Ghee, Namkeen)</option>
                  <option value="18" ${this.editingProduct && this.editingProduct.gstRate === 18 ? 'selected' : ''}>18% (Soaps, Detergents, Biscuits)</option>
                </select>
              </div>

              <div class="form-group span-2">
                <label>Icon / Emoji</label>
                <input type="text" name="icon" class="form-control" 
                  value="${this.editingProduct ? this.editingProduct.icon || '🛍️' : '🛍️'}" />
              </div>

              <div class="form-actions span-2">
                <button type="submit" class="btn btn-primary btn-block">
                  💾 ${this.editingProduct ? 'Save Product Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  attachEventListeners() {
    // Search input
    const searchInput = this.container.querySelector('#inv-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.render();
        const ref = this.container.querySelector('#inv-search-input');
        if (ref) {
          ref.focus();
          ref.setSelectionRange(ref.value.length, ref.value.length);
        }
      });
    }

    const clearSearch = this.container.querySelector('#inv-clear-search');
    if (clearSearch) {
      clearSearch.addEventListener('click', () => {
        this.searchQuery = '';
        this.render();
      });
    }

    // Category select
    const catSelect = this.container.querySelector('#inv-cat-select');
    if (catSelect) {
      catSelect.addEventListener('change', (e) => {
        this.selectedCategory = e.target.value;
        this.render();
      });
    }

    // Stock toggle buttons
    this.container.querySelectorAll('.stock-toggle-buttons .toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.stockFilter = btn.getAttribute('data-filter');
        this.render();
      });
    });

    // Reorder list export button
    const reorderBtn = this.container.querySelector('#btn-export-reorder');
    if (reorderBtn) {
      reorderBtn.addEventListener('click', () => {
        this.copyReorderList();
      });
    }

    // Open add product modal
    const addBtn = this.container.querySelector('#btn-open-add-product');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        this.editingProduct = null;
        this.showAddModal = true;
        this.render();
      });
    }

    // Close product modal
    const closeBtn = this.container.querySelector('#close-product-modal');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.showAddModal = false;
        this.editingProduct = null;
        this.render();
      });
    }

    // Generate random barcode
    const genBarcodeBtn = this.container.querySelector('#btn-gen-barcode');
    if (genBarcodeBtn) {
      genBarcodeBtn.addEventListener('click', () => {
        const barcodeInput = this.container.querySelector('input[name="barcode"]');
        if (barcodeInput) {
          barcodeInput.value = '890' + Math.floor(100000000 + Math.random() * 900000000);
        }
      });
    }

    // Form submit
    const form = this.container.querySelector('#product-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const productPayload = {
          name: formData.get('name'),
          hindiName: formData.get('hindiName'),
          category: formData.get('category'),
          unit: formData.get('unit'),
          barcode: formData.get('barcode'),
          hsnCode: formData.get('hsnCode'),
          costPrice: parseFloat(formData.get('costPrice')),
          sellingPrice: parseFloat(formData.get('sellingPrice')),
          mrp: parseFloat(formData.get('mrp')),
          stock: parseInt(formData.get('stock'), 10),
          lowStockThreshold: parseInt(formData.get('lowStockThreshold'), 10),
          gstRate: parseInt(formData.get('gstRate'), 10),
          icon: formData.get('icon') || '🛍️'
        };

        if (this.editingProduct) {
          db.updateProduct(this.editingProduct.id, productPayload);
        } else {
          db.addProduct(productPayload);
        }

        this.showAddModal = false;
        this.editingProduct = null;
        this.render();
        if (this.onProductUpdated) this.onProductUpdated();
      });
    }

    // Micro stock adjusters
    this.container.querySelectorAll('.btn-stock-micro.plus').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const prod = db.getProductById(id);
        if (prod) {
          db.updateProduct(id, { stock: prod.stock + 1 });
          this.render();
          if (this.onProductUpdated) this.onProductUpdated();
        }
      });
    });

    this.container.querySelectorAll('.btn-stock-micro.plus-batch').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const prod = db.getProductById(id);
        if (prod) {
          db.updateProduct(id, { stock: prod.stock + 10 });
          this.render();
          if (this.onProductUpdated) this.onProductUpdated();
        }
      });
    });

    this.container.querySelectorAll('.btn-stock-micro.minus').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const prod = db.getProductById(id);
        if (prod && prod.stock > 0) {
          db.updateProduct(id, { stock: prod.stock - 1 });
          this.render();
          if (this.onProductUpdated) this.onProductUpdated();
        }
      });
    });

    // Edit button
    this.container.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.editingProduct = db.getProductById(id);
        this.showAddModal = true;
        this.render();
      });
    });

    // Delete button
    this.container.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const prod = db.getProductById(id);
        if (confirm(`Are you sure you want to remove "${prod.name}" from inventory?`)) {
          db.deleteProduct(id);
          this.render();
          if (this.onProductUpdated) this.onProductUpdated();
        }
      });
    });
  }

  copyReorderList() {
    const products = db.getProducts();
    const needsReorder = products.filter(p => p.stock <= p.lowStockThreshold);

    if (needsReorder.length === 0) {
      alert('All products are well-stocked! No items currently below reorder levels.');
      return;
    }

    const lines = needsReorder.map(p => `• ${p.name} (Cur Stock: ${p.stock} ${p.unit}, Min: ${p.lowStockThreshold})`);
    const settings = db.getSettings();
    const text = `*📦 Mandi Reorder List - ${settings.storeName}*%0A` +
      `Date: ${new Date().toLocaleDateString('en-IN')}%0A` +
      `-------------------------------------%0A` +
      lines.join('%0A') +
      `%0A-------------------------------------%0APlease arrange supply earliest.`;

    const cleanText = text.replace(/%0A/g, '\n').replace(/\*/g, '');
    navigator.clipboard.writeText(cleanText).then(() => {
      alert(`Reorder list (${needsReorder.length} items) copied to clipboard!\nYou can also send directly to your wholesale distributor.`);
    }).catch(() => {
      window.open(`https://wa.me/?text=${text}`, '_blank');
    });
  }
}
