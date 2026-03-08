/* ================================================================
   CHAITANYA SHRI DAIRY FARM – MAIN APP JS
   ================================================================ */

// ===== CONFIG =====
const CONFIG = {
  whatsappNumber: '917878066868',
  farmName: 'चैतन्या श्री डेरी फार्म',
  currency: '₹',
  products: {
    'A2 देसी गाय का दूध': { price: 70, unit: 'लीटर', emoji: '🥛' },
    'बिलौना देसी घी':     { price: 1400, unit: 'किलो', emoji: '🧈' },
    'ताज़ा पनीर':          { price: 380, unit: 'किलो', emoji: '🧀' },
    'घर जैसा दही':         { price: 90, unit: 'किलो', emoji: '🥣' },
  },
  subscriptions: {
    'daily-milk':   { name: 'रोज़ 1 लीटर दूध – Monthly Plan', price: 2100 },
    'weekly-ghee':  { name: 'हर रविवार 500g घी – Plan',       price: 2800 },
    'family-combo': { name: 'Family Combo Plan',               price: 4500 },
  }
};

// ===== LOCAL STORAGE HELPERS =====
const Store = {
  get:    (k, def = null) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } },
  set:    (k, v)           => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  push:   (k, item)        => { const arr = Store.get(k, []); arr.unshift(item); Store.set(k, arr); },
};

// ===== NAVBAR =====
const navbar = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navLinks = document.querySelector('.nav-links');

window.addEventListener('scroll', () => {
  navbar && navbar.classList.toggle('scrolled', window.scrollY > 50);
});

hamburger && hamburger.addEventListener('click', () => {
  navLinks && navLinks.classList.toggle('open');
});

// Close nav on link click (mobile)
navLinks && navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => navLinks.classList.remove('open'));
});

// ===== SMOOTH SCROLL (anchor links) =====
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ===== SCROLL ANIMATION =====
const observerOptions = { threshold: 0.12, rootMargin: '0px 0px -40px 0px' };
const scrollObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => e.isIntersecting && e.target.classList.add('visible'));
}, observerOptions);
document.querySelectorAll('.fade-in-up').forEach(el => scrollObserver.observe(el));

// ===== ADD FADE-IN-UP TO CARDS =====
document.addEventListener('DOMContentLoaded', () => {
  ['.product-card', '.trust-card', '.review-card', '.sub-card', '.stat-card']
    .forEach(sel => document.querySelectorAll(sel).forEach(el => el.classList.add('fade-in-up')));
  scrollObserver.disconnect();
  document.querySelectorAll('.fade-in-up').forEach(el => scrollObserver.observe(el));
});

// ===== PRODUCT PRICE CALCULATOR (main form) =====
function updateProductPrice() {
  calculateTotal();
}

function calculateTotal() {
  const sel = document.getElementById('productSelect');
  const qtyEl = document.getElementById('quantity');
  const totalDisplay = document.getElementById('totalDisplay');
  const totalAmount = document.getElementById('totalAmount');
  if (!sel || !qtyEl) return;

  const opt = sel.options[sel.selectedIndex];
  const price = parseFloat(opt ? opt.dataset.price : 0) || 0;
  const qty   = parseFloat(qtyEl.value) || 0;

  if (price > 0 && qty > 0) {
    totalDisplay && (totalDisplay.style.display = 'block');
    totalAmount  && (totalAmount.textContent = `₹${(price * qty).toFixed(0)}`);
  } else {
    totalDisplay && (totalDisplay.style.display = 'none');
  }
}

// ===== ORDER FORM SUBMIT =====
function submitOrder(e) {
  e.preventDefault();

  const name    = sanitize(document.getElementById('custName').value);
  const phone   = sanitize(document.getElementById('custPhone').value);
  const address = sanitize(document.getElementById('custAddress').value);
  const product = sanitize(document.getElementById('productSelect').value);
  const qty     = parseFloat(document.getElementById('quantity').value);
  const payment = document.querySelector('input[name="payment"]:checked');
  const notes   = sanitize((document.getElementById('orderNotes')?.value) || '');

  if (!validatePhone(phone))   return showToast('सही मोबाइल नंबर डालें (10 अंक)', 'error');
  if (!product)                 return showToast('प्रोडक्ट चुनें', 'error');
  if (!payment)                 return showToast('भुगतान का तरीका चुनें', 'error');

  const info   = CONFIG.products[product];
  const total  = info ? (info.price * qty).toFixed(0) : 'N/A';
  const orderId = generateOrderId();

  // Save to localStorage
  const orderData = { id: orderId, name, phone, address, product, qty, payment: payment.value, notes, total, timestamp: new Date().toISOString(), status: 'pending' };
  Store.push('csdf_orders', orderData);

  // WhatsApp message
  const msg = buildWhatsAppMsg(orderData);
  window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');

  showToast('ऑर्डर सफलतापूर्वक सबमिट हुआ! WhatsApp खुल रहा है...');
  e.target.reset();
  document.getElementById('totalDisplay') && (document.getElementById('totalDisplay').style.display = 'none');
}

function buildWhatsAppMsg(o) {
  return `🐄 *${CONFIG.farmName}*\n` +
    `━━━━━━━━━━━━━━━━\n` +
    `📋 *नया ऑर्डर* #${o.id}\n\n` +
    `👤 नाम: ${o.name}\n` +
    `📱 मोबाइल: ${o.phone}\n` +
    `📍 पता: ${o.address}\n\n` +
    `🛒 *प्रोडक्ट:* ${o.product}\n` +
    `⚖️ मात्रा: ${o.qty}\n` +
    `💰 कुल: ₹${o.total}\n` +
    `💳 भुगतान: ${o.payment}\n` +
    (o.notes ? `📝 नोट: ${o.notes}\n` : '') +
    `━━━━━━━━━━━━━━━━\n` +
    `🕐 ${new Date().toLocaleString('hi-IN')}`;
}

// ===== QUICK ORDER MODAL =====
function openOrder(productName, price) {
  document.getElementById('modalProduct').value = productName;
  document.getElementById('modalPrice').value   = price;
  document.getElementById('modalProductName').textContent = `${CONFIG.products[productName]?.emoji || '🛒'} ${productName} – ₹${price} / ${CONFIG.products[productName]?.unit || ''}`;
  document.getElementById('modalTotal').textContent = '';
  openModal('orderModal');
}

function calcModalTotal() {
  const price = parseFloat(document.getElementById('modalPrice')?.value) || 0;
  const qty   = parseFloat(document.getElementById('qQty')?.value) || 0;
  const el    = document.getElementById('modalTotal');
  if (el) el.textContent = price > 0 && qty > 0 ? `🧾 कुल: ₹${(price * qty).toFixed(0)}` : '';
}

function submitQuickOrder(e) {
  e.preventDefault();
  const name    = sanitize(document.getElementById('qName').value);
  const phone   = sanitize(document.getElementById('qPhone').value);
  const address = sanitize(document.getElementById('qAddress').value);
  const product = document.getElementById('modalProduct').value;
  const price   = parseFloat(document.getElementById('modalPrice').value);
  const qty     = parseFloat(document.getElementById('qQty').value);

  if (!validatePhone(phone)) return showToast('सही मोबाइल नंबर डालें', 'error');

  const total   = (price * qty).toFixed(0);
  const orderId = generateOrderId();
  const orderData = { id: orderId, name, phone, address, product, qty, payment: 'WhatsApp', notes: '', total, timestamp: new Date().toISOString(), status: 'pending' };
  Store.push('csdf_orders', orderData);

  const msg = buildWhatsAppMsg(orderData);
  window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
  showToast('WhatsApp पर ऑर्डर भेजा जा रहा है!');
  closeModal('orderModal');
  e.target.reset();
}

// ===== SUBSCRIPTION MODAL =====
function openSubscription(productName) {
  const planKey = Object.keys(CONFIG.subscriptions).find(k =>
    CONFIG.subscriptions[k].name.includes(productName.slice(0,6))
  ) || 'daily-milk';
  openSubscriptionModal(planKey);
}

function openSubscriptionModal(planKey) {
  const plan = CONFIG.subscriptions[planKey] || {};
  document.getElementById('subPlan').value           = planKey;
  document.getElementById('subPlanName').textContent = `${plan.name || planKey} – ₹${plan.price || ''}/महीना`;
  const today = new Date();
  today.setDate(today.getDate() + 1);
  const minDate = today.toISOString().split('T')[0];
  const subDate = document.getElementById('subStartDate');
  if (subDate) { subDate.min = minDate; subDate.value = minDate; }
  openModal('subscriptionModal');
}

function submitSubscription(e) {
  e.preventDefault();
  const name    = sanitize(document.getElementById('subName').value);
  const phone   = sanitize(document.getElementById('subPhone').value);
  const address = sanitize(document.getElementById('subAddress').value);
  const plan    = document.getElementById('subPlan').value;
  const start   = document.getElementById('subStartDate').value;

  if (!validatePhone(phone)) return showToast('सही मोबाइल नंबर डालें', 'error');

  const planInfo = CONFIG.subscriptions[plan] || {};
  const subId    = 'SUB' + Date.now().toString(36).toUpperCase();
  const subData  = { id: subId, name, phone, address, plan, planName: planInfo.name, price: planInfo.price, startDate: start, timestamp: new Date().toISOString(), status: 'pending' };
  Store.push('csdf_subscriptions', subData);

  const msg = `🐄 *${CONFIG.farmName}*\n━━━━━━━━━━━━━━━━\n📅 *नया Subscription* #${subId}\n\n👤 नाम: ${name}\n📱 मोबाइल: ${phone}\n📍 पता: ${address}\n\n📦 Plan: ${planInfo.name}\n💰 मूल्य: ₹${planInfo.price}/महीना\n📆 शुरुआत: ${start}\n━━━━━━━━━━━━━━━━\nकृपया पुष्टि करें! 🙏`;
  window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
  showToast('Subscription के लिए WhatsApp खुल रहा है!');
  closeModal('subscriptionModal');
  e.target.reset();
}

// ===== MODALS =====
function openModal(id) {
  const modal   = document.getElementById(id);
  const overlay = document.getElementById('modalOverlay');
  if (modal)   modal.classList.add('active');
  if (overlay) overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('active');
  const anyOpen = document.querySelector('.modal.active');
  if (!anyOpen) {
    const overlay = document.getElementById('modalOverlay');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
  }
}
function closeAllModals() {
  document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
  const overlay = document.getElementById('modalOverlay');
  if (overlay) overlay.classList.remove('active');
  document.body.style.overflow = '';
}

// Close modals on Escape
document.addEventListener('keydown', e => e.key === 'Escape' && closeAllModals());

// ===== TOAST =====
let toastTimer = null;
function showToast(msg, type = 'success') {
  const toast = document.getElementById('successToast');
  const msgEl = document.getElementById('toastMsg');
  if (!toast) return;
  if (toastTimer) clearTimeout(toastTimer);
  if (msgEl) msgEl.textContent = msg;
  toast.style.background = type === 'error' ? '#dc2626' : '';
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
}

// ===== HELPERS =====
function generateOrderId() {
  return 'ORD' + Date.now().toString(36).toUpperCase().slice(-6);
}
function validatePhone(p) {
  return /^[6-9][0-9]{9}$/.test(p.replace(/\s/g, ''));
}
function sanitize(str) {
  // Basic sanitization: strip HTML tags to prevent XSS
  return String(str).replace(/<[^>]*>/g, '').trim();
}

// ===== INVOICE PDF GENERATOR =====
function generateInvoice(order) {
  // Opens a printable invoice in a new tab
  const invoiceHTML = `<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="UTF-8" />
  <title>Invoice #${order.id}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; color: #1a1a1a; padding: 40px; max-width: 600px; margin: 0 auto; }
    .invoice-header { text-align: center; border-bottom: 3px solid #2d7a1a; padding-bottom: 20px; margin-bottom: 30px; }
    .farm-name { font-size: 1.5rem; font-weight: 800; color: #1a4a0a; }
    .invoice-title { font-size: 1rem; color: #4a4a4a; margin-top: 4px; }
    .invoice-id { font-size: 0.9rem; color: #7a7a7a; }
    .section { margin-bottom: 24px; }
    .section h3 { font-size: 0.9rem; font-weight: 700; color: #2d7a1a; border-bottom: 1px solid #e8f5e9; padding-bottom: 6px; margin-bottom: 12px; }
    .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 0.9rem; }
    .row.total { font-weight: 800; font-size: 1.1rem; color: #2d7a1a; border-top: 2px solid #2d7a1a; padding-top: 10px; margin-top: 10px; }
    .footer { text-align: center; margin-top: 40px; font-size: 0.82rem; color: #7a7a7a; border-top: 1px solid #eee; padding-top: 16px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="invoice-header">
    <div class="farm-name">🐄 चैतन्या श्री डेरी फार्म</div>
    <div class="invoice-title">बेगूं, चित्तौड़गढ़, राजस्थान</div>
    <div class="invoice-id">Invoice #${order.id} | ${new Date(order.timestamp).toLocaleDateString('hi-IN')}</div>
  </div>
  <div class="section">
    <h3>ग्राहक की जानकारी</h3>
    <div class="row"><span>नाम:</span><span>${order.name}</span></div>
    <div class="row"><span>मोबाइल:</span><span>${order.phone}</span></div>
    <div class="row"><span>पता:</span><span>${order.address}</span></div>
  </div>
  <div class="section">
    <h3>ऑर्डर विवरण</h3>
    <div class="row"><span>प्रोडक्ट:</span><span>${order.product}</span></div>
    <div class="row"><span>मात्रा:</span><span>${order.qty}</span></div>
    <div class="row"><span>भुगतान:</span><span>${order.payment}</span></div>
    <div class="row total"><span>कुल मूल्य:</span><span>₹${order.total}</span></div>
  </div>
  <div class="footer">
    <p>इस Invoice के लिए धन्यवाद! पुनः ऑर्डर के लिए WhatsApp करें।</p>
    <p style="margin-top:6px;color:#2d7a1a;font-weight:600;">चैतन्या श्री डेरी फार्म 🐄</p>
  </div>
  <script>window.onload=()=>window.print();<\/script>
</body>
</html>`;
  const blob = new Blob([invoiceHTML], { type: 'text/html' });
  const url  = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

// Export for use in other pages
window.CSDF = { CONFIG, Store, generateInvoice, showToast, sanitize, validatePhone, generateOrderId };
