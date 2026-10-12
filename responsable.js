/**
 * Interactive Controller for Responsable Chantier
 * Handles:
 * - Switching active responsable (mourad / yacine) based on URL or session
 * - Real-time budget arithmetic (Reçu - Matériaux - Paye ouvriers = Solde)
 * - Quick Toolbar Action Modals (Pointage, Achat Sl3a, Paye Khadama)
 * - Shared LocalStorage with Director Dashboard
 */

// Global App Database Schema
const defaultData = {
  mourad: {
    name: "Mourad Rahmani",
    site: "Chantier A · Résidence Liège",
    received: 600000,
    materials: [
      { id: 1, title: "Ciment Lafarge Chiffa (80 Sacs)", supplier: "Quincaillerie Moderne", time: "08:30", amount: 68000 },
      { id: 2, title: "Briques Rouges 8 Trous (1200 U)", supplier: "Briqueterie de l'Est", time: "11:15", amount: 72000 },
      { id: 3, title: "Fer à béton FeE500 (1.5 Tonnes)", supplier: "Dépôt Métaux", time: "Hier", amount: 120000 }
    ],
    payouts: [
      { id: 1, worker: "Karim Bensalem (Coffreur)", time: "Aujourd'hui à 17:30", amount: 45000, note: "Journée complète" },
      { id: 2, worker: "Farid Touati (Ferrailleur)", time: "Aujourd'hui à 17:35", amount: 50000, note: "Forfait ferraillage" },
      { id: 3, worker: "Youcef Mansouri (Manœuvre)", time: "Aujourd'hui à 17:40", amount: 80000, note: "2 journées" }
    ],
    workers: [
      { id: 1, name: "Karim Bensalem", role: "Coffreur Boiseur", time: "07:15", status: "present" },
      { id: 2, name: "Farid Touati", role: "Ferrailleur", time: "07:20", status: "present" },
      { id: 3, name: "Bilal Khelifi", role: "Électricien", time: "--:--", status: "absent" },
      { id: 4, name: "Youcef Mansouri", role: "Manœuvre Qualifié", time: "07:05", status: "present" },
      { id: 5, name: "Ahmed Kaci", role: "Manœuvre", time: "07:08", status: "present" }
    ]
  },
  yacine: {
    name: "Yacine Belkacem",
    site: "Chantier B · Tour Annaba",
    received: 600000,
    materials: [
      { id: 1, title: "Sable Oued Souf (2 Camions 16m³)", supplier: "Carrière Nord", time: "09:00", amount: 90000 },
      { id: 2, title: "Gravier Concassé 15/25 (1 Camion)", supplier: "Carrière Nord", time: "10:45", amount: 45000 },
      { id: 3, title: "Tubes PVC & Raccords", supplier: "Sanitaire Plus", time: "14:20", amount: 145000 }
    ],
    payouts: [
      { id: 1, worker: "Sofiane Hamidi (Maçon Chef)", time: "Aujourd'hui à 17:15", amount: 65000, note: "Journée + Heures supp" },
      { id: 2, worker: "Amine Zitouni (Plâtrier)", time: "Aujourd'hui à 17:25", amount: 60000, note: "Pose staff salon" },
      { id: 3, worker: "Groupe Échafaudeurs", time: "Aujourd'hui à 18:00", amount: 80000, note: "Forfait montage façade" }
    ],
    workers: [
      { id: 6, name: "Sofiane Hamidi", role: "Maçon Chef", time: "07:10", status: "present" },
      { id: 7, name: "Amine Zitouni", role: "Plâtrier / Staffeur", time: "07:45", status: "late" },
      { id: 8, name: "Rabah Bouzid", role: "Grutier", time: "06:50", status: "present" },
      { id: 9, name: "Walid Cherif", role: "Plombier", time: "--:--", status: "absent" }
    ]
  }
};

// Determine Active Responsable from URL param: ?user=mourad or ?user=yacine
const urlParams = new URLSearchParams(window.location.search);
let currentRespKey = urlParams.get('user') || localStorage.getItem('active_resp') || 'mourad';
if (currentRespKey !== 'mourad' && currentRespKey !== 'yacine') currentRespKey = 'mourad';

let currentData = defaultData[currentRespKey];

document.addEventListener('DOMContentLoaded', () => {
  initProfile();
  initClock();
  initTheme();
  renderWallet();
  renderMaterials();
  renderPayouts();
  renderAttendance();
  populateDropdowns();
  setupEvents();
});

// 1. Profile Setup
function initProfile() {
  document.getElementById('userName').textContent = currentData.name;
  document.getElementById('siteLabel').textContent = currentData.site;
  document.getElementById('userAvatar').textContent = currentRespKey === 'mourad' ? 'MR' : 'YB';
}

// 2. Clock
function initClock() {
  const clockEl = document.getElementById('liveTime');
  function update() {
    clockEl.textContent = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
  update();
  setInterval(update, 1000);
}

// 3. Theme
function initTheme() {
  const toggleBtn = document.getElementById('themeToggle');
  const icon = document.getElementById('themeIcon');
  let saved = localStorage.getItem('liege_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  if (icon) icon.className = saved === 'light' ? 'ph ph-sun' : 'ph ph-moon';

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const curr = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = curr === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('liege_theme', next);
      if (icon) icon.className = next === 'light' ? 'ph ph-sun' : 'ph ph-moon';
    });
  }
}

// 4. Financial Status (Wallet Calculation)
function renderWallet() {
  const received = currentData.received;
  const matSpent = currentData.materials.reduce((acc, m) => acc + m.amount, 0);
  const paySpent = currentData.payouts.reduce((acc, p) => acc + p.amount, 0);
  const remaining = received - (matSpent + paySpent);

  document.getElementById('valReceived').textContent = formatDZD(received);
  document.getElementById('valMaterials').textContent = formatDZD(matSpent);
  document.getElementById('valPayouts').textContent = formatDZD(paySpent);
  document.getElementById('valRemaining').textContent = formatDZD(remaining);

  // Update counts
  document.getElementById('countMaterials').textContent = currentData.materials.length;
  document.getElementById('countPayouts').textContent = currentData.payouts.length;
  document.getElementById('countWorkers').textContent = currentData.workers.length;
}

// 5. Render Materials List
function renderMaterials() {
  const listEl = document.getElementById('materialsList');
  listEl.innerHTML = '';

  currentData.materials.forEach(m => {
    const item = document.createElement('div');
    item.className = 'record-item';
    item.innerHTML = `
      <div class="record-main">
        <div class="record-icon mat"><i class="ph-fill ph-cube"></i></div>
        <div class="record-details">
          <span class="record-title">${m.title}</span>
          <span class="record-meta">${m.supplier} &bull; ${m.time}</span>
        </div>
      </div>
      <span class="record-cost mat">- ${formatDZD(m.amount)}</span>
    `;
    listEl.appendChild(item);
  });
}

// 6. Render Payouts List
function renderPayouts() {
  const listEl = document.getElementById('payoutsList');
  listEl.innerHTML = '';

  currentData.payouts.forEach(p => {
    const item = document.createElement('div');
    item.className = 'record-item';
    item.innerHTML = `
      <div class="record-main">
        <div class="record-icon pay"><i class="ph-fill ph-user-check"></i></div>
        <div class="record-details">
          <span class="record-title">${p.worker}</span>
          <span class="record-meta">${p.note || 'Paiement'} &bull; ${p.time}</span>
        </div>
      </div>
      <span class="record-cost pay">- ${formatDZD(p.amount)}</span>
    `;
    listEl.appendChild(item);
  });
}

// 7. Render Attendance Table
function renderAttendance() {
  const tbody = document.getElementById('attendanceTableBody');
  tbody.innerHTML = '';

  currentData.workers.forEach(w => {
    const tr = document.createElement('tr');

    let statusText = 'Présent (Hader)';
    let statusClass = 'present';
    if (w.status === 'absent') { statusText = 'Absent (Ghayeb)'; statusClass = 'absent'; }
    else if (w.status === 'late') { statusText = 'En Retard'; statusClass = 'late'; }

    tr.innerHTML = `
      <td><strong>${w.name}</strong></td>
      <td>${w.role}</td>
      <td><code>${w.time}</code></td>
      <td><span class="status-badge ${statusClass}">${statusText}</span></td>
      <td>
        <button class="btn-toggle-status" onclick="cycleStatus(${w.id})">Basculer</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Quick status toggle
window.cycleStatus = function(workerId) {
  const worker = currentData.workers.find(w => w.id === workerId);
  if (!worker) return;

  if (worker.status === 'present') {
    worker.status = 'late';
    worker.time = '08:15';
  } else if (worker.status === 'late') {
    worker.status = 'absent';
    worker.time = '--:--';
  } else {
    worker.status = 'present';
    worker.time = '07:15';
  }

  renderAttendance();
  showToast('Pointage Modifié', `${worker.name} est maintenant marqué comme ${worker.status}.`);
};

// Populate selects in modals
function populateDropdowns() {
  const paySelect = document.getElementById('payWorkerSelect');
  const pointSelect = document.getElementById('pointWorkerSelect');
  paySelect.innerHTML = '';
  pointSelect.innerHTML = '';

  currentData.workers.forEach(w => {
    const opt1 = document.createElement('option');
    opt1.value = `${w.name} (${w.role})`;
    opt1.textContent = `${w.name} (${w.role})`;
    paySelect.appendChild(opt1);

    const opt2 = document.createElement('option');
    opt2.value = w.id;
    opt2.textContent = `${w.name} (${w.role})`;
    pointSelect.appendChild(opt2);
  });
}

// Modal open/close helpers
window.openModal = function(id) { document.getElementById(id).classList.add('active'); };
window.closeModal = function(id) { document.getElementById(id).classList.remove('active'); };

// Setup Form Handlers & Toolbar buttons
function setupEvents() {
  // Toolbar buttons
  document.getElementById('btnToolPointage').addEventListener('click', () => openModal('modalPointage'));
  document.getElementById('btnToolAchat').addEventListener('click', () => openModal('modalAchat'));
  document.getElementById('btnToolPaye').addEventListener('click', () => openModal('modalPaye'));

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', () => {
    if (confirm('Voulez-vous quitter votre session chantier ?')) {
      window.location.href = 'index.html';
    }
  });

  // Tab navigation
  document.querySelectorAll('.tab-link').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-link').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
    });
  });

  // FORM 1: Achat Matériaux
  document.getElementById('formAchat').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('matName').value;
    const supplier = document.getElementById('matSupplier').value;
    const amount = parseFloat(document.getElementById('matAmount').value);

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    currentData.materials.unshift({
      id: Date.now(),
      title,
      supplier,
      time: timeStr,
      amount
    });

    renderWallet();
    renderMaterials();
    closeModal('modalAchat');
    e.target.reset();
    showToast('Achat Enregistré', `${formatDZD(amount)} déduits de la caisse pour: ${title}`);
  });

  // FORM 2: Paiement Ouvrier
  document.getElementById('formPaye').addEventListener('submit', (e) => {
    e.preventDefault();
    const worker = document.getElementById('payWorkerSelect').value;
    const amount = parseFloat(document.getElementById('payAmount').value);
    const note = document.getElementById('payNote').value;

    const now = new Date();
    const timeStr = `Aujourd'hui à ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    currentData.payouts.unshift({
      id: Date.now(),
      worker,
      time: timeStr,
      amount,
      note
    });

    renderWallet();
    renderPayouts();
    closeModal('modalPaye');
    e.target.reset();
    showToast('Paiement Validé', `${formatDZD(amount)} versés à ${worker}`);
  });

  // FORM 3: Pointage Présence
  document.getElementById('formPointage').addEventListener('submit', (e) => {
    e.preventDefault();
    const workerId = parseInt(document.getElementById('pointWorkerSelect').value);
    const status = document.getElementById('pointStatus').value;
    const time = document.getElementById('pointTime').value;

    const worker = currentData.workers.find(w => w.id === workerId);
    if (worker) {
      worker.status = status;
      worker.time = status === 'absent' ? '--:--' : time;
      renderAttendance();
      closeModal('modalPointage');
      showToast('Pointage Réussi', `Présence de ${worker.name} enregistrée à ${time}`);
    }
  });
}

// Toast helper
let toastTimer = null;
function showToast(title, msg) {
  const toast = document.getElementById('respToast');
  document.getElementById('toastTitle').textContent = title;
  document.getElementById('toastMsg').textContent = msg;

  toast.classList.add('active');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('active'), 4000);
}

function formatDZD(num) {
  try {
    return new Intl.NumberFormat('fr-DZ').format(num) + ' DZD';
  } catch (e) {
    return (num || 0).toLocaleString() + ' DZD';
  }
}
