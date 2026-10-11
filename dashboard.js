/**
 * Interactive Logic for Director General Supervision Dashboard
 * - Realtime Data Model (2 Responsables, Matériaux, Paye ouvriers, Pointage Houdour/Ghiyab)
 * - Dynamic Budget Allocation with real-time recalculations
 * - Search, filter and quick status toggle on Attendance
 * - Live Clock & Toast notifications
 */

// Initial Mock State
const state = {
  responsables: {
    resp1: {
      name: "Mourad Rahmani",
      site: "Chantier A (Résidence Liège)",
      received: 600000,
      materials: [
        { id: 1, title: "Ciment Lafarge Chiffa (80 Sacs)", supplier: "Quincaillerie Moderne", time: "08:30", amount: 68000 },
        { id: 2, title: "Briques Rouges 8 Trous (1200 U)", supplier: "Briqueterie de l'Est", time: "11:15", amount: 72000 },
        { id: 3, title: "Fer à béton FeE500 (1.5 Tonnes)", supplier: "Dépôt Métaux", time: "Hier", amount: 120000 }
      ],
      payouts: [
        { id: 1, worker: "Karim Bensalem (Coffreur)", time: "Aujourd'hui à 17:30", amount: 45000 },
        { id: 2, worker: "Farid Touati (Ferrailleur)", time: "Aujourd'hui à 17:35", amount: 50000 },
        { id: 3, worker: "Youcef M. & Ahmed K. (Manœuvres)", time: "Aujourd'hui à 17:40", amount: 80000 }
      ]
    },
    resp2: {
      name: "Yacine Belkacem",
      site: "Chantier B (Tour Annaba)",
      received: 600000,
      materials: [
        { id: 1, title: "Sable Oued Souf (2 Camions 16m³)", supplier: "Carrière Nord", time: "09:00", amount: 90000 },
        { id: 2, title: "Gravier Concassé 15/25 (1 Camion)", supplier: "Carrière Nord", time: "10:45", amount: 45000 },
        { id: 3, title: "Tubes PVC & Raccords Assainissement", supplier: "Sanitaire Plus", time: "14:20", amount: 145000 }
      ],
      payouts: [
        { id: 1, worker: "Sofiane Hamidi (Maçon Chef)", time: "Aujourd'hui à 17:15", amount: 65000 },
        { id: 2, worker: "Amine Zitouni (Plâtrier)", time: "Aujourd'hui à 17:25", amount: 60000 },
        { id: 3, worker: "Groupe Échafaudeurs (3 ouvriers)", time: "Aujourd'hui à 18:00", amount: 80000 }
      ]
    }
  },
  workers: [
    { id: 1, name: "Karim Bensalem", role: "Coffreur Boiseur", site: "Chantier A (Mourad)", time: "07:15", status: "present", pay: 4500 },
    { id: 2, name: "Farid Touati", role: "Ferrailleur", site: "Chantier A (Mourad)", time: "07:20", status: "present", pay: 5000 },
    { id: 3, name: "Sofiane Hamidi", role: "Maçon Chef", site: "Chantier B (Yacine)", time: "07:10", status: "present", pay: 6500 },
    { id: 4, name: "Amine Zitouni", role: "Plâtrier / Staffeur", site: "Chantier B (Yacine)", time: "07:45", status: "late", pay: 4500 },
    { id: 5, name: "Bilal Khelifi", role: "Électricien Bâtiment", site: "Chantier A (Mourad)", time: "--:--", status: "absent", pay: 0 },
    { id: 6, name: "Youcef Mansouri", role: "Manœuvre Qualifié", site: "Chantier A (Mourad)", time: "07:05", status: "present", pay: 3500 },
    { id: 7, name: "Ahmed Kaci", role: "Manœuvre", site: "Chantier A (Mourad)", time: "07:08", status: "present", pay: 3500 },
    { id: 8, name: "Rabah Bouzid", role: "Grutier", site: "Chantier B (Yacine)", time: "06:50", status: "present", pay: 7000 },
    { id: 9, name: "Walid Cherif", role: "Plombier", site: "Chantier B (Yacine)", time: "--:--", status: "absent", pay: 0 }
  ]
};

// DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initClock();
  initTheme();
  renderKPIs();
  renderAttendanceTable();
  setupEventListeners();
});

// 1. Live Clock
function initClock() {
  const clockEl = document.getElementById('liveClock');
  function update() {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString('fr-FR');
  }
  update();
  setInterval(update, 1000);
}

// 2. Theme Toggle
function initTheme() {
  const toggleBtn = document.getElementById('dashThemeToggle');
  const icon = document.getElementById('dashThemeIcon');
  const saved = localStorage.getItem('liege_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  icon.className = saved === 'light' ? 'ph ph-sun' : 'ph ph-moon';

  toggleBtn.addEventListener('click', () => {
    const curr = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = curr === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('liege_theme', next);
    icon.className = next === 'light' ? 'ph ph-sun' : 'ph ph-moon';
  });
}

// 3. KPI Recalculation
function renderKPIs() {
  const r1 = state.responsables.resp1;
  const r2 = state.responsables.resp2;

  const totalAllocated = r1.received + r2.received;
  const mat1 = r1.materials.reduce((acc, m) => acc + m.amount, 0);
  const mat2 = r2.materials.reduce((acc, m) => acc + m.amount, 0);
  const totalMaterials = mat1 + mat2;

  const pay1 = r1.payouts.reduce((acc, p) => acc + p.amount, 0);
  const pay2 = r2.payouts.reduce((acc, p) => acc + p.amount, 0);
  const totalPayouts = pay1 + pay2;

  const remaining = totalAllocated - (totalMaterials + totalPayouts);

  document.getElementById('kpiTotalAllocated').textContent = formatDZD(totalAllocated);
  document.getElementById('kpiMaterialsSpent').textContent = formatDZD(totalMaterials);
  document.getElementById('kpiWorkerPayouts').textContent = formatDZD(totalPayouts);
  document.getElementById('kpiRemainingBudget').textContent = formatDZD(remaining);

  // Update card 1 sub-stats
  const rem1 = r1.received - (mat1 + pay1);
  document.getElementById('resp1-received').textContent = formatDZD(r1.received);
  document.getElementById('resp1-materials').textContent = formatDZD(mat1);
  document.getElementById('resp1-payouts').textContent = formatDZD(pay1);
  document.getElementById('resp1-remaining').textContent = formatDZD(rem1);

  // Update card 2 sub-stats
  const rem2 = r2.received - (mat2 + pay2);
  document.getElementById('resp2-received').textContent = formatDZD(r2.received);
  document.getElementById('resp2-materials').textContent = formatDZD(mat2);
  document.getElementById('resp2-payouts').textContent = formatDZD(pay2);
  document.getElementById('resp2-remaining').textContent = formatDZD(rem2);
}

// 4. Render Attendance Table
function renderAttendanceTable(filterStatus = 'all', searchTerm = '') {
  const tbody = document.getElementById('attendanceTableBody');
  tbody.innerHTML = '';

  let list = state.workers;

  if (filterStatus !== 'all') {
    list = list.filter(w => w.status === filterStatus);
  }

  if (searchTerm) {
    const s = searchTerm.toLowerCase();
    list = list.filter(w => w.name.toLowerCase().includes(s) || w.role.toLowerCase().includes(s) || w.site.toLowerCase().includes(s));
  }

  // Count summaries
  let pres = 0, abs = 0, late = 0;
  state.workers.forEach(w => {
    if (w.status === 'present') pres++;
    else if (w.status === 'absent') abs++;
    else if (w.status === 'late') late++;
  });

  document.getElementById('countPresents').textContent = pres;
  document.getElementById('countAbsents').textContent = abs;
  document.getElementById('countLates').textContent = late;

  list.forEach(w => {
    const tr = document.createElement('tr');

    const initials = w.name.split(' ').map(n => n[0]).join('').substring(0, 2);
    let statusLabel = 'Présent (Hader)';
    let statusClass = 'present';
    let statusIcon = 'ph-check-circle';

    if (w.status === 'absent') {
      statusLabel = 'Absent (Ghayeb)';
      statusClass = 'absent';
      statusIcon = 'ph-x-circle';
    } else if (w.status === 'late') {
      statusLabel = 'En Retard';
      statusClass = 'late';
      statusIcon = 'ph-clock';
    }

    tr.innerHTML = `
      <td>
        <div class="worker-identity">
          <div class="worker-avatar">${initials}</div>
          <span class="worker-name">${w.name}</span>
        </div>
      </td>
      <td><strong>${w.role}</strong></td>
      <td><span class="resp-zone"><i class="ph-fill ph-buildings"></i> ${w.site}</span></td>
      <td><code>${w.time}</code></td>
      <td>
        <span class="status-chip ${statusClass}">
          <i class="ph-bold ${statusIcon}"></i> ${statusLabel}
        </span>
      </td>
      <td><span class="pay-tag">${w.pay > 0 ? formatDZD(w.pay) : '0 DZD'}</span></td>
      <td>
        <button class="row-actions-btn" onclick="toggleWorkerStatus(${w.id})" title="Changer le statut">
          <i class="ph-bold ph-arrows-clockwise"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// 5. Toggle Worker Status
window.toggleWorkerStatus = function(id) {
  const worker = state.workers.find(w => w.id === id);
  if (!worker) return;

  if (worker.status === 'present') {
    worker.status = 'late';
    worker.time = '08:45';
  } else if (worker.status === 'late') {
    worker.status = 'absent';
    worker.time = '--:--';
    worker.pay = 0;
  } else {
    worker.status = 'present';
    worker.time = '07:15';
    worker.pay = 4000;
  }

  renderAttendanceTable();
  showToast('Pointage Mis à Jour', `Statut de ${worker.name} modifié.`);
};

// 6. Tabs inside Responsable Cards
window.switchRespTab = function(btn, targetId) {
  const card = btn.closest('.resp-card');
  card.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  card.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));

  btn.classList.add('active');
  const target = document.getElementById(targetId);
  if (target) target.classList.remove('hidden');
};

// 7. Modal Handlers
window.openModal = function(id) {
  document.getElementById(id).classList.add('active');
};

window.closeModal = function(id) {
  document.getElementById(id).classList.remove('active');
};

window.openBudgetModalFor = function(respKey, respName) {
  document.getElementById('modalRespSelect').value = respKey;
  openModal('budgetModal');
};

// 8. Event Listeners Setup
function setupEventListeners() {
  // Modal buttons
  document.getElementById('openAddBudgetModal').addEventListener('click', () => openModal('budgetModal'));
  document.getElementById('openAddWorkerModal').addEventListener('click', () => openModal('workerModal'));

  // Logout button
  document.getElementById('logoutBtn').addEventListener('click', () => {
    if (confirm('Voulez-vous quitter la session Directeur ?')) {
      window.location.href = 'index.html';
    }
  });

  // Search input
  const searchInput = document.getElementById('workerSearch');
  searchInput.addEventListener('input', (e) => {
    renderAttendanceTable('all', e.target.value.trim());
  });

  // Attendance filter buttons
  document.querySelectorAll('.att-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.att-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderAttendanceTable(btn.dataset.status, searchInput.value.trim());
    });
  });

  // Section 1 filter pills
  document.querySelectorAll('.filter-pills .pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.filter-pills .pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const f = pill.dataset.filter;
      const c1 = document.getElementById('card-resp1');
      const c2 = document.getElementById('card-resp2');

      if (f === 'all') {
        c1.style.display = 'flex';
        c2.style.display = 'flex';
      } else if (f === 'resp1') {
        c1.style.display = 'flex';
        c2.style.display = 'none';
      } else {
        c1.style.display = 'none';
        c2.style.display = 'flex';
      }
    });
  });

  // Form: Budget Allocation
  document.getElementById('budgetForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const respKey = document.getElementById('modalRespSelect').value;
    const amount = parseFloat(document.getElementById('modalAmount').value);
    const note = document.getElementById('modalNote').value;

    if (amount > 0) {
      state.responsables[respKey].received += amount;
      renderKPIs();
      closeModal('budgetModal');
      e.target.reset();
      showToast('Allocation Validée', `${formatDZD(amount)} transférés à ${state.responsables[respKey].name}. Note: "${note}"`);
    }
  });

  // Form: New Worker Attendance
  document.getElementById('workerForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('newWorkerName').value;
    const role = document.getElementById('newWorkerRole').value;
    const site = document.getElementById('newWorkerChantier').value;
    const status = document.getElementById('newWorkerStatus').value;
    const pay = parseFloat(document.getElementById('newWorkerPay').value) || 0;

    const newWorker = {
      id: Date.now(),
      name,
      role,
      site,
      time: status === 'absent' ? '--:--' : '07:30',
      status,
      pay
    };

    state.workers.unshift(newWorker);
    renderAttendanceTable();
    closeModal('workerModal');
    e.target.reset();
    showToast('Ouvrier Enregistré', `Pointage de ${name} validé.`);
  });
}

// 9. Toast Notification
let toastTimer = null;
function showToast(title, msg) {
  const toast = document.getElementById('dashToast');
  document.getElementById('dashToastTitle').textContent = title;
  document.getElementById('dashToastMsg').textContent = msg;

  toast.classList.add('active');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('active'), 4000);
}

// Number formatter
function formatDZD(num) {
  return new Intl.NumberFormat('fr-DZ').format(num) + ' DZD';
}
