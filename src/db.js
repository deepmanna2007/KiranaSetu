// KiranaSetu Data Store (LocalStorage based persistence with rich Indian Kirana seed data)

const STORAGE_KEYS = {
  PRODUCTS: 'kiranasetu_products',
  ORDERS: 'kiranasetu_orders',
  CUSTOMERS: 'kiranasetu_customers',
  SETTINGS: 'kiranasetu_settings'
};

export const INITIAL_SETTINGS = {
  storeName: 'Shree Ganesh Kirana & General Store',
  tagline: 'Aapki Apni Pados Ki Dukan',
  ownerName: 'Rameshwar Sharma',
  phone: '9876543210',
  address: 'Shop No. 4, Main Market, Gandhi Chowk, Delhi - 110001',
  gstin: '07AAAAA0000A1Z5',
  upiId: 'shreeganesh.kirana@okhdfcbank',
  deliveryFee: 30,
  freeDeliveryThreshold: 499,
  enableUpiSound: true,
  currency: '₹'
};

export const INITIAL_PRODUCTS = [
  {
    id: 'prod-001',
    name: 'Aashirvaad Shudh Chakki Atta',
    hindiName: 'आशीर्वाद चक्की आटा',
    barcode: '890103000001',
    category: 'Staples & Flour',
    mrp: 235,
    sellingPrice: 215,
    costPrice: 195,
    stock: 24,
    unit: '5kg pkt',
    lowStockThreshold: 5,
    hsnCode: '1101',
    gstRate: 0,
    icon: '🌾',
    description: '100% whole wheat grain with 0% maida'
  },
  {
    id: 'prod-002',
    name: 'Fortune Sunlite Refined Sunflower Oil',
    hindiName: 'फॉर्च्यून सूरजमुखी तेल',
    barcode: '890103000002',
    category: 'Edible Oils',
    mrp: 165,
    sellingPrice: 148,
    costPrice: 135,
    stock: 18,
    unit: '1L pouch',
    lowStockThreshold: 4,
    hsnCode: '1512',
    gstRate: 5,
    icon: '🌻',
    description: 'Light and healthy cooking oil enriched with vitamins'
  },
  {
    id: 'prod-003',
    name: 'Tata Salt Vacuum Evaporated Iodised',
    hindiName: 'टाटा नमक',
    barcode: '890103000003',
    category: 'Spices & Seasoning',
    mrp: 28,
    sellingPrice: 26,
    costPrice: 22,
    stock: 45,
    unit: '1kg pkt',
    lowStockThreshold: 10,
    hsnCode: '2501',
    gstRate: 0,
    icon: '🧂',
    description: 'Desh Ka Namak with essential iodine'
  },
  {
    id: 'prod-004',
    name: 'Amul Butter (Pasteurized)',
    hindiName: 'अमूल मक्खन',
    barcode: '890103000004',
    category: 'Dairy & Eggs',
    mrp: 60,
    sellingPrice: 58,
    costPrice: 52,
    stock: 3,
    unit: '100g pack',
    lowStockThreshold: 5, // low stock trigger
    hsnCode: '0405',
    gstRate: 12,
    icon: '🧈',
    description: 'Utterly Butterly Delicious fresh cream butter'
  },
  {
    id: 'prod-005',
    name: 'Amul Taaza Fresh Homogenised Milk',
    hindiName: 'अमूल ताज़ा दूध',
    barcode: '890103000005',
    category: 'Dairy & Eggs',
    mrp: 28,
    sellingPrice: 28,
    costPrice: 26,
    stock: 15,
    unit: '500ml pouch',
    lowStockThreshold: 5,
    hsnCode: '0401',
    gstRate: 0,
    icon: '🥛',
    description: 'Toned milk with balanced nutrition'
  },
  {
    id: 'prod-006',
    name: 'Tata Sampann Unpolished Toor / Arhar Dal',
    hindiName: 'टाटा संपन्न अरहर दाल',
    barcode: '890103000006',
    category: 'Pulses & Dals',
    mrp: 195,
    sellingPrice: 175,
    costPrice: 155,
    stock: 12,
    unit: '1kg pkt',
    lowStockThreshold: 4,
    hsnCode: '0713',
    gstRate: 0,
    icon: '🥣',
    description: 'High protein unpolished dal with natural nutrition'
  },
  {
    id: 'prod-007',
    name: 'India Gate Basmati Rice Rozzana',
    hindiName: 'इंडिया गेट बासमती चावल',
    barcode: '890103000007',
    category: 'Staples & Flour',
    mrp: 140,
    sellingPrice: 125,
    costPrice: 110,
    stock: 16,
    unit: '1kg pkt',
    lowStockThreshold: 4,
    hsnCode: '1006',
    gstRate: 0,
    icon: '🍚',
    description: 'Aromatic long grain basmati rice for daily meals'
  },
  {
    id: 'prod-008',
    name: 'Maggi 2-Minute Masala Noodles',
    hindiName: 'मैगी मसाला नूडल्स',
    barcode: '890103000008',
    category: 'Snacks & Packaged Food',
    mrp: 60,
    sellingPrice: 56,
    costPrice: 48,
    stock: 30,
    unit: 'Pack of 4',
    lowStockThreshold: 8,
    hsnCode: '1902',
    gstRate: 18,
    icon: '🍜',
    description: 'Favorite instant noodles with authentic Indian spices'
  },
  {
    id: 'prod-009',
    name: 'Parle-G Gold Glucose Biscuits',
    hindiName: 'पारले-जी बिस्कुट',
    barcode: '890103000009',
    category: 'Snacks & Packaged Food',
    mrp: 30,
    sellingPrice: 28,
    costPrice: 24,
    stock: 25,
    unit: '250g pkt',
    lowStockThreshold: 6,
    hsnCode: '1905',
    gstRate: 18,
    icon: '🍪',
    description: 'Classic glucose biscuits, best paired with chai'
  },
  {
    id: 'prod-010',
    name: 'Taj Mahal Premium Leaf Tea',
    hindiName: 'ताज महल चाय',
    barcode: '890103000010',
    category: 'Beverages',
    mrp: 340,
    sellingPrice: 310,
    costPrice: 280,
    stock: 8,
    unit: '500g box',
    lowStockThreshold: 3,
    hsnCode: '0902',
    gstRate: 5,
    icon: '☕',
    description: 'Wah Taj! Aromatic Assam rich black tea'
  },
  {
    id: 'prod-011',
    name: 'MDH Deggi Mirch Powder',
    hindiName: 'एमडीएच देगी मिर्च',
    barcode: '890103000011',
    category: 'Spices & Seasoning',
    mrp: 92,
    sellingPrice: 85,
    costPrice: 75,
    stock: 14,
    unit: '100g box',
    lowStockThreshold: 4,
    hsnCode: '0904',
    gstRate: 5,
    icon: '🌶️',
    description: 'Gives rich red color without excessive pungency'
  },
  {
    id: 'prod-012',
    name: 'Surf Excel Easy Wash Detergent Powder',
    hindiName: 'सर्फ एक्सेल डिटर्जेंट पाउडर',
    barcode: '890103000012',
    category: 'Cleaning & Household',
    mrp: 145,
    sellingPrice: 135,
    costPrice: 120,
    stock: 2, // low stock
    unit: '1kg pkt',
    lowStockThreshold: 4,
    hsnCode: '3402',
    gstRate: 18,
    icon: '🧺',
    description: 'Tough stain removal in just 1 stroke'
  },
  {
    id: 'prod-013',
    name: 'Dettol Original Bathing Soap Bar',
    hindiName: 'डेटॉल साबुन',
    barcode: '890103000013',
    category: 'Personal Care',
    mrp: 125,
    sellingPrice: 115,
    costPrice: 100,
    stock: 15,
    unit: 'Pack of 3',
    lowStockThreshold: 5,
    hsnCode: '3401',
    gstRate: 18,
    icon: '🧼',
    description: 'Trusted 99.9% germ protection soap'
  },
  {
    id: 'prod-014',
    name: 'Sugar / Safed Chini (M-30 Clean)',
    hindiName: 'साफ सफेद चीनी',
    barcode: '890103000014',
    category: 'Staples & Flour',
    mrp: 48,
    sellingPrice: 44,
    costPrice: 39,
    stock: 50,
    unit: '1kg loose pack',
    lowStockThreshold: 15,
    hsnCode: '1701',
    gstRate: 0,
    icon: '🍬',
    description: 'Crystal clear sulfur-free refined sugar'
  },
  {
    id: 'prod-015',
    name: 'Haldiram Nagpur Bhujia Sev',
    hindiName: 'हल्दीराम भुजिया सेव',
    barcode: '890103000015',
    category: 'Snacks & Packaged Food',
    mrp: 110,
    sellingPrice: 98,
    costPrice: 85,
    stock: 0, // OUT OF STOCK test
    unit: '400g pouch',
    lowStockThreshold: 5,
    hsnCode: '2106',
    gstRate: 12,
    icon: '🥨',
    description: 'Crispy spicy tepary bean and chickpea snack'
  },
  {
    id: 'prod-016',
    name: 'Fresh Mandi Potato (Aloo)',
    hindiName: 'ताज़ा आलू',
    barcode: '890103000016',
    category: 'Fresh Vegetables',
    mrp: 35,
    sellingPrice: 28,
    costPrice: 20,
    stock: 40,
    unit: '1kg bag',
    lowStockThreshold: 10,
    hsnCode: '0701',
    gstRate: 0,
    icon: '🥔',
    description: 'Fresh farm harvested medium sized potatoes'
  },
  {
    id: 'prod-017',
    name: 'Fresh Nashik Red Onion (Pyaz)',
    hindiName: 'ताज़ा नासिक प्याज',
    barcode: '890103000017',
    category: 'Fresh Vegetables',
    mrp: 45,
    sellingPrice: 38,
    costPrice: 30,
    stock: 35,
    unit: '1kg bag',
    lowStockThreshold: 10,
    hsnCode: '0703',
    gstRate: 0,
    icon: '🧅',
    description: 'Crisp, pungent red onions directly from mandi'
  },
  {
    id: 'prod-018',
    name: 'Colgate Strong Teeth Dental Cream',
    hindiName: 'कोलगेट टूथपेस्ट',
    barcode: '890103000018',
    category: 'Personal Care',
    mrp: 115,
    sellingPrice: 105,
    costPrice: 90,
    stock: 20,
    unit: '200g tube',
    lowStockThreshold: 5,
    hsnCode: '3306',
    gstRate: 18,
    icon: '🪥',
    description: 'Calcium boost formula for all day tooth protection'
  }
];

export const INITIAL_ORDERS = [
  {
    id: 'ORD-101',
    orderType: 'advance_pickup', // 'pos_instant', 'advance_pickup', 'home_delivery'
    customerName: 'Sunita Verma',
    customerPhone: '9811223344',
    pickupTimeSlot: 'Today 5:30 PM',
    status: 'ready_for_pickup', // 'pending', 'packing', 'ready_for_pickup', 'collected', 'delivered', 'cancelled'
    paymentMethod: 'UPI',
    paymentStatus: 'paid', // 'pending', 'paid', 'khata'
    items: [
      { id: 'prod-001', name: 'Aashirvaad Shudh Chakki Atta', price: 215, qty: 1, unit: '5kg pkt' },
      { id: 'prod-003', name: 'Tata Salt Vacuum Evaporated Iodised', price: 26, qty: 2, unit: '1kg pkt' },
      { id: 'prod-004', name: 'Amul Butter (Pasteurized)', price: 58, qty: 1, unit: '100g pack' }
    ],
    itemCount: 4,
    subtotal: 325,
    taxTotal: 6.96,
    deliveryFee: 0,
    discount: 0,
    total: 325,
    notes: 'Please pack in double carry bag',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    tokenNo: 101
  },
  {
    id: 'ORD-102',
    orderType: 'home_delivery',
    customerName: 'Amit Saxena',
    customerPhone: '9922334455',
    deliveryAddress: 'Flat 302, Royal Residency, Sector 4',
    landmark: 'Near SBI Bank ATM',
    deliverySlot: 'Evening 6:00 PM - 7:00 PM',
    status: 'packing',
    paymentMethod: 'COD',
    paymentStatus: 'pending',
    items: [
      { id: 'prod-002', name: 'Fortune Sunlite Refined Sunflower Oil', price: 148, qty: 2, unit: '1L pouch' },
      { id: 'prod-006', name: 'Tata Sampann Unpolished Toor Dal', price: 175, qty: 1, unit: '1kg pkt' },
      { id: 'prod-010', name: 'Taj Mahal Premium Leaf Tea', price: 310, qty: 1, unit: '500g box' }
    ],
    itemCount: 4,
    subtotal: 781,
    taxTotal: 29.8,
    deliveryFee: 0, // order > 499
    discount: 0,
    total: 781,
    notes: 'Call before reaching gate',
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    tokenNo: 102
  },
  {
    id: 'ORD-103',
    orderType: 'advance_pickup',
    customerName: 'Rajesh Gupta',
    customerPhone: '9871100223',
    pickupTimeSlot: 'Immediate (15 mins)',
    status: 'pending',
    paymentMethod: 'Pay on Pickup',
    paymentStatus: 'pending',
    items: [
      { id: 'prod-005', name: 'Amul Taaza Fresh Homogenised Milk', price: 28, qty: 2, unit: '500ml pouch' },
      { id: 'prod-009', name: 'Parle-G Gold Glucose Biscuits', price: 28, qty: 3, unit: '250g pkt' }
    ],
    itemCount: 5,
    subtotal: 140,
    taxTotal: 12.8,
    deliveryFee: 0,
    discount: 0,
    total: 140,
    notes: 'Keep chilled milk ready',
    createdAt: new Date(Date.now() - 900000).toISOString(),
    tokenNo: 103
  }
];

export const INITIAL_CUSTOMERS = [
  {
    id: 'cust-001',
    name: 'Sharma Ji (Quarter 12)',
    phone: '9810012345',
    address: 'Qtr 12, Police Line Road',
    khataBalance: 450, // owes ₹450
    history: [
      { date: '2026-10-14', desc: 'Grocery purchase (Bill #108)', debit: 650, credit: 0 },
      { date: '2026-10-15', desc: 'Cash payment via GPay', debit: 0, credit: 200 }
    ]
  },
  {
    id: 'cust-002',
    name: 'Pooja Tiwari',
    phone: '9873322110',
    address: 'House 45, Gali No. 2, Shiv Nagar',
    khataBalance: 0,
    history: []
  },
  {
    id: 'cust-003',
    name: 'Vikram Singh (Teacher)',
    phone: '9899887766',
    address: 'B-14, Sharda Enclave',
    khataBalance: 1220,
    history: [
      { date: '2026-10-10', desc: 'Monthly Ration items', debit: 2220, credit: 0 },
      { date: '2026-10-12', desc: 'Cash paid at shop', debit: 0, credit: 1000 }
    ]
  }
];

class Database {
  constructor() {
    this.init();
  }

  init() {
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) {
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(INITIAL_CUSTOMERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
    }
  }

  getProducts() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');
  }

  saveProducts(products) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }

  getProductById(id) {
    return this.getProducts().find(p => p.id === id);
  }

  getProductByBarcode(barcode) {
    return this.getProducts().find(p => p.barcode === barcode);
  }

  addProduct(product) {
    const products = this.getProducts();
    const newProd = {
      ...product,
      id: 'prod-' + Date.now().toString(36)
    };
    products.push(newProd);
    this.saveProducts(products);
    return newProd;
  }

  updateProduct(id, updates) {
    const products = this.getProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx !== -1) {
      products[idx] = { ...products[idx], ...updates };
      this.saveProducts(products);
      return products[idx];
    }
    return null;
  }

  deleteProduct(id) {
    let products = this.getProducts();
    products = products.filter(p => p.id !== id);
    this.saveProducts(products);
  }

  deductStock(items) {
    const products = this.getProducts();
    items.forEach(item => {
      const prod = products.find(p => p.id === item.id);
      if (prod) {
        prod.stock = Math.max(0, prod.stock - item.qty);
      }
    });
    this.saveProducts(products);
  }

  restoreStock(items) {
    const products = this.getProducts();
    items.forEach(item => {
      const prod = products.find(p => p.id === item.id);
      if (prod) {
        prod.stock = prod.stock + item.qty;
      }
    });
    this.saveProducts(products);
  }

  getOrders() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || '[]');
  }

  saveOrders(orders) {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }

  createOrder(orderData) {
    const orders = this.getOrders();
    const tokenNo = orders.length + 101;
    const newOrder = {
      id: 'INV-' + (orders.length + 1001),
      tokenNo,
      createdAt: new Date().toISOString(),
      status: orderData.orderType === 'pos_instant' ? 'collected' : 'pending',
      paymentStatus: orderData.paymentStatus || 'pending',
      ...orderData
    };

    orders.unshift(newOrder);
    this.saveOrders(orders);

    // If order was placed or billed, deduct inventory
    if (newOrder.items && newOrder.items.length) {
      this.deductStock(newOrder.items);
    }

    // If Khata payment, add to customer balance
    if (newOrder.paymentMethod === 'Khata' && newOrder.customerPhone) {
      this.addKhataEntry(newOrder.customerName, newOrder.customerPhone, newOrder.total, `Bill #${newOrder.id}`);
    }

    return newOrder;
  }

  updateOrderStatus(orderId, newStatus, paymentStatus = null) {
    const orders = this.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (order) {
      // If cancelled, restore stock
      if (newStatus === 'cancelled' && order.status !== 'cancelled') {
        this.restoreStock(order.items);
      }
      order.status = newStatus;
      if (paymentStatus) {
        order.paymentStatus = paymentStatus;
      }
      this.saveOrders(orders);
      return order;
    }
    return null;
  }

  getCustomers() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOMERS) || '[]');
  }

  saveCustomers(customers) {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  }

  addKhataEntry(customerName, phone, amount, description) {
    const customers = this.getCustomers();
    let cust = customers.find(c => c.phone === phone);
    if (!cust) {
      cust = {
        id: 'cust-' + Date.now().toString(36),
        name: customerName || 'Customer',
        phone: phone,
        address: '',
        khataBalance: 0,
        history: []
      };
      customers.push(cust);
    }
    cust.khataBalance += amount;
    cust.history.unshift({
      date: new Date().toISOString().split('T')[0],
      desc: description,
      debit: amount,
      credit: 0
    });
    this.saveCustomers(customers);
  }

  recordKhataPayment(customerId, amount, paymentMethod = 'Cash') {
    const customers = this.getCustomers();
    const cust = customers.find(c => c.id === customerId);
    if (cust) {
      cust.khataBalance = Math.max(0, cust.khataBalance - amount);
      cust.history.unshift({
        date: new Date().toISOString().split('T')[0],
        desc: `Jama (Payment received via ${paymentMethod})`,
        debit: 0,
        credit: amount
      });
      this.saveCustomers(customers);
      return cust;
    }
    return null;
  }

  getSettings() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || JSON.stringify(INITIAL_SETTINGS));
  }

  saveSettings(settings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }

  resetToDefault() {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(INITIAL_CUSTOMERS));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
  }
}

export const db = new Database();
