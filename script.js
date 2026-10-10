const form          = document.getElementById('transaction-form');
const typeInput     = document.getElementById('type');
const textInput     = document.getElementById('text');
const categoryInput = document.getElementById('category');
const amountInput   = document.getElementById('amount');
const listEl        = document.getElementById('list');
const emptyMsg      = document.getElementById('empty-msg');
const searchInput   = document.getElementById('search');
const clearBtn      = document.getElementById('clear-btn');
const balanceEl     = document.getElementById('balance');
const incomeEl      = document.getElementById('total-income');
const expenseEl     = document.getElementById('total-expense');

// หมวดหมู่ธุรกรรม (Dictionary)
// key = ค่า value ของ <option>, value = ชื่อหมวดหมู่และไอคอน
const CATEGORIES = {
  food:     { name: 'อาหาร',     icon: '🍔' },
  travel:   { name: 'เดินทาง',   icon: '🚗' },
  shopping: { name: 'ช้อปปิ้ง',   icon: '🛍️' },
  salary:   { name: 'เงินเดือน',  icon: '💼' },
  other:    { name: 'อื่นๆ',      icon: '📦' },
};

// ---------- Class สำหรับเก็บข้อมูลธุรกรรม 1 รายการ ----------
class Transaction {
  constructor(id, type, text, category, amount) {
    this.id = id;             // ลำดับ/ID ของรายการ
    this.type = type;         // 'income' หรือ 'expense'
    this.text = text;         // ชื่อรายการ
    this.category = category; // รหัสหมวดหมู่ (key ใน CATEGORIES)
    this.amount = amount;     // จำนวนเงิน (เป็นค่าบวกเสมอ)
  }

  // คืนค่าจำนวนเงินแบบมีเครื่องหมาย (+ รายรับ, - รายจ่าย) ใช้ตอนคำนวณยอด
  get signedAmount() {
    return this.type === 'income' ? this.amount : -this.amount;
  }
}

// Array เก็บธุรกรรมทั้งหมด
let transactions = [];
let nextId = 1;

// ฟังก์ชันช่วย: จัดรูปแบบเงินเป็น ฿1,234.00
function formatMoney(value) {
  return '฿' + value.toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// เพิ่มธุรกรรมใหม่จากฟอร์ม
function addTransaction(e) {
  e.preventDefault();

  const text = textInput.value.trim();
  const amount = parseFloat(amountInput.value);

  if (text === '' || isNaN(amount) || amount <= 0) {
    alert('กรุณากรอกชื่อรายการและจำนวนเงินให้ถูกต้อง');
    return;
  }

  const t = new Transaction(
    nextId++,
    typeInput.value,
    text,
    categoryInput.value, // เก็บหมวดหมู่ที่ผู้ใช้เลือก
    amount
  );
  transactions.push(t);

  // ล้างช่องกรอก
  textInput.value = '';
  amountInput.value = '';
  textInput.focus();

  updateUI();
}

// ลบธุรกรรมทีละรายการ
function removeTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  updateUI();
}

// ค้นหารายการแบบ Real-time
// กรอง array ตามชื่อรายการ
function getFilteredTransactions() {
  const keyword = searchInput.value.trim().toLowerCase();
  if (keyword === '') return transactions;
  return transactions.filter(t => t.text.toLowerCase().includes(keyword));
}

// event 'input'
searchInput.addEventListener('input', renderList);

// แสดงประวัติรายการทั้งหมด เรียงตามลำดับ
// แสดง ID/ลำดับ, ประเภท, ชื่อรายการ, หมวดหมู่ และจำนวนเงิน
function renderList() {
  const items = getFilteredTransactions()          // ใช้ข้อมูลที่ผ่านการค้นหา
    .slice()
    .sort((a, b) => a.id - b.id);                 // เรียงตามลำดับ ID

  listEl.innerHTML = '';

  items.forEach(t => {
    const cat = CATEGORIES[t.category];           // ดึงชื่อ + ไอคอนหมวดหมู่
    const typeLabel = t.type === 'income' ? 'รายรับ' : 'รายจ่าย';
    const sign = t.type === 'income' ? '+' : '-';

    const li = document.createElement('li');
    li.classList.add(t.type === 'income' ? 'plus' : 'minus');

    li.innerHTML = `
      <span class="id">#${t.id}</span>
      <div>
        <!-- โจทย์ที่ 1: แสดงไอคอนหมวดหมู่ร่วมกับชื่อรายการใน <li> -->
        <div class="name">${cat.icon} ${escapeHTML(t.text)}</div>
        <div class="meta">${typeLabel} · ${cat.name}</div>
      </div>
      <span class="amount">${sign}${formatMoney(t.amount)}</span>
      <button class="delete-btn" title="ลบรายการ">✕</button>
    `;
    li.querySelector('.delete-btn')
      .addEventListener('click', () => removeTransaction(t.id));

    listEl.appendChild(li);
  });

  // ข้อความเมื่อไม่มีรายการ / ค้นหาไม่เจอ
  if (transactions.length === 0) {
    emptyMsg.textContent = 'ยังไม่มีรายการ';
    emptyMsg.style.display = 'block';
  } else if (items.length === 0) {
    emptyMsg.textContent = 'ไม่พบรายการที่ค้นหา';
    emptyMsg.style.display = 'block';
  } else {
    emptyMsg.style.display = 'none';
  }
}

// สรุปรายงานการเงิน
// รายรับรวม, รายจ่ายรวม, ยอดคงเหลือสุทธิ = รายรับรวม - รายจ่ายรวม
function updateSummary() {
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  incomeEl.textContent  = formatMoney(totalIncome);
  expenseEl.textContent = formatMoney(totalExpense);
  balanceEl.textContent = formatMoney(balance);
  balanceEl.style.color = balance < 0 ? 'var(--expense)' : 'var(--text)';
}

// ปุ่มล้างข้อมูลทั้งหมด
// แสดง confirm() ก่อน ถ้ายืนยัน -> ล้าง array และยอดเงินกลับเป็น ฿0.00
function clearAll() {
  if (transactions.length === 0) {
    alert('ไม่มีข้อมูลให้ล้าง');
    return;
  }
  if (confirm('ต้องการล้างข้อมูลทั้งหมดใช่หรือไม่?')) {
    transactions = [];
    nextId = 1;
    searchInput.value = '';
    updateUI(); // ยอดเงินทั้งหมดจะถูกคำนวณใหม่เป็น ฿0.00
  }
}
clearBtn.addEventListener('click', clearAll);

// ป้องกันการแทรก HTML จากชื่อรายการ
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// อัปเดตหน้าจอทั้งหมด
function updateUI() {
  renderList();     // โจทย์ที่ 2 + 3
  updateSummary();  // โจทย์ที่ 4
}

// เริ่มโปรแกรม
form.addEventListener('submit', addTransaction);
updateUI();
