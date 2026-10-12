/**
 * Interactive Logic for Director General Supervision Dashboard
 * - Fully synchronized with Cloud Firestore via DB.getProjectData / DB.subscribeProject
 * - Tracks Meddeb Naoufel & Meddeb Hani
 */

let projectState = null;

// DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  try { initTheme(); } catch (e) { console.warn(e); }
  try { initClock(); } catch (e) { console.warn(e); }
  try { setupEventListeners(); } catch (e) { console.warn(e); }
  initCloudData();
});

// 1. Initialize Realtime Cloud Data
async function initCloudData() {
  if (typeof DB !== 'undefined') {
    projectState = await DB.getProjectData();
    renderAll();

    // Realtime Cloud Listener
    DB.subscribeProject((updated) => {
      if (updated) {
        projectState = updated;
        renderAll();
      }
    });
  }
}

function persistCloud() {
  if (typeof DB !== 'undefined' && projectState) {
    DB.saveProjectData(projectState);
  }
}

function renderAll() {
  if (!projectState) return;
  renderKPIs();
  renderResponsablesCards();
  renderAttendanceTable();
}

// 2. Live Clock
function initClock() {
  const clockEl = document.getElementById('liveClock');
  if (!clockEl) return;
  function update() {
    clockEl.textContent = new Date().toLocaleTimeString('fr-FR');
  }
  update();
  setInterval(update, 1000);
}

// 3. Theme Toggle
function initTheme() {
  const toggleBtn = document.getElementById('dashThemeToggle');
  const icon = document.getElementById('dashThemeIcon');
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

// 4. Render KPIs
function renderKPIs() {
  const n = projectState.responsables.naoufel;
  const h = projectState.responsables.hani;

  const totalAllocated = n.received + h.received;
  const matN = n.materials.reduce((a, m) => a + m.amount, 0);
  const matH = h.materials.reduce((a, m) => a + m.amount, 0);
  const totalMaterials = matN + matH;

  const payN = n.payouts.reduce((a, p) => a + p.amount, 0);
  const payH = h.payouts.reduce((a, p) => a + p.amount, 0);
  const totalPayouts = payN + payH;

  const remaining = totalAllocated - (totalMaterials + totalPayouts);

  document.getElementById('kpiTotalAllocated').textContent = formatDZD(totalAllocated);
  document.getElementById('kpiMaterialsSpent').textContent = formatDZD(totalMaterials);
  document.getElementById('kpiWorkerPayouts').textContent = formatDZD(totalPayouts);
  document.getElementById('kpiRemainingBudget').textContent = formatDZD(remaining);

  // Substats Naoufel
  const remN = n.received - (matN + payN);
  document.getElementById('resp1-received').textContent = formatDZD(n.received);
  document.getElementById('resp1-materials').textContent = formatDZD(matN);
  document.getElementById('resp1-payouts').textContent = formatDZD(payN);
  document.getElementById('resp1-remaining').textContent = formatDZD(remN);

  // Substats Hani
  const remH = h.received - (matH + payH);
  document.getElementById('resp2-received').textContent = formatDZD(h.received);
  document.getElementById('resp2-materials').textContent = formatDZD(matH);
  document.getElementById('resp2-payouts').textContent = formatDZD(payH);
  document.getElementById('resp2-remaining').textContent = formatDZD(remH);
}

// 5. Render Materials & Payouts Lists inside Responsables Cards
function renderResponsablesCards() {
  const n = projectState.responsables.naoufel;
  const h = projectState.responsables.hani;

  // Render Naoufel Lists
  const listSl3aN = document.getElementById('resp1-sl3a-list');
  listSl3aN.innerHTML = n.materials.map(m => `
    <div class="history-item">
      <div class="item-icon-tag"><i class="ph-fill ph-cube"></i></div>
      <div class="item-main">
        <span class="item-title">${m.title}</span>
        <span class="item-meta">${m.supplier} &bull; ${m.time}</span>
      </div>
      <span class="item-price">- ${formatDZD(m.amount)}</span>
    </div>
  `).join('');
  document.getElementById('resp1-sl3a-count').textContent = n.materials.length;

  const listPayN = document.getElementById('resp1-paye-list');
  listPayN.innerHTML = n.payouts.map(p => `
    <div class="history-item payout">
      <div class="item-icon-tag worker"><i class="ph-fill ph-user-check"></i></div>
      <div class="item-main">
        <span class="item-title">${p.worker}</span>
        <span class="item-meta">${p.note || 'Paye'} &bull; ${p.time}</span>
      </div>
      <span class="item-price payout">- ${formatDZD(p.amount)}</span>
    </div>
  `).join('');
  document.getElementById('resp1-paye-count').textContent = n.payouts.length;

  // Render Hani Lists
  const listSl3aH = document.getElementById('resp2-sl3a-list');
  listSl3aH.innerHTML = h.materials.map(m => `
    <div class="history-item">
      <div class="item-icon-tag"><i class="ph-fill ph-cube"></i></div>
      <div class="item-main">
        <span class="item-title">${m.title}</span>
        <span class="item-meta">${m.supplier} &bull; ${m.time}</span>
      </div>
      <span class="item-price">- ${formatDZD(m.amount)}</span>
    </div>
  `).join('');
  document.getElementById('resp2-sl3a-count').textContent = h.materials.length;

  const listPayH = document.getElementById('resp2-paye-list');
  listPayH.innerHTML = h.payouts.map(p => `
    <div class="history-item payout">
      <div class="item-icon-tag worker"><i class="ph-fill ph-user-check"></i></div>
      <div class="item-main">
        <span class="item-title">${p.worker}</span>
        <span class="item-meta">${p.note || 'Paye'} &bull; ${p.time}</span>
      </div>
      <span class="item-price payout">- ${formatDZD(p.amount)}</span>
    </div>
  `).join('');
  document.getElementById('resp2-paye-count').textContent = h.payouts.length;
}

// 6. Render Attendance Table (Combining Naoufel & Hani workers)
function renderAttendanceTable(filterStatus = 'all', searchTerm = '') {
  if (!projectState) return;
  const tbody = document.getElementById('attendanceTableBody');
  tbody.innerHTML = '';

  const allWorkers = [
    ...projectState.responsables.naoufel.workers.map(w => ({ ...w, siteName: 'Chantier A (Meddeb Naoufel)', respKey: 'naoufel' })),
    ...projectState.responsables.hani.workers.map(w => ({ ...w, siteName: 'Chantier B (Meddeb Hani)', respKey: 'hani' }))
  ];

  let list = allWorkers;
  if (filterStatus !== 'all') list = list.filter(w => w.status === filterStatus);
  if (searchTerm) {
    const s = searchTerm.toLowerCase();
    list = list.filter(w => w.name.toLowerCase().includes(s) || w.role.toLowerCase().includes(s));
  }

  // Summary counts
  let pres = 0, abs = 0, late = 0;
  allWorkers.forEach(w => {
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

    if (w.status === 'absent') { statusLabel = 'Absent (Ghayeb)'; statusClass = 'absent'; statusIcon = 'ph-x-circle'; }
    else if (w.status === 'late') { statusLabel = 'En Retard'; statusClass = 'late'; statusIcon = 'ph-clock'; }

    tr.innerHTML = `
      <td>
        <div class="worker-identity">
          <div class="worker-avatar">${initials}</div>
          <span class="worker-name">${w.name}</span>
        </div>
      </td>
      <td><strong>${w.role}</strong></td>
      <td><span class="resp-zone"><i class="ph-fill ph-buildings"></i> ${w.siteName}</span></td>
      <td><code>${w.time}</code></td>
      <td>
        <span class="status-chip ${statusClass}">
          <i class="ph-bold ${statusIcon}"></i> ${statusLabel}
        </span>
      </td>
      <td><span class="pay-tag">${w.pay > 0 ? formatDZD(w.pay) : '0 DZD'}</span></td>
      <td>
        <button class="row-actions-btn" onclick="toggleWorkerStatus('${w.respKey}', ${w.id})" title="Changer le statut">
          <i class="ph-bold ph-arrows-clockwise"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// 7. Toggle Worker Status
window.toggleWorkerStatus = function(respKey, id) {
  if (!projectState) return;
  const worker = projectState.responsables[respKey].workers.find(w => w.id === id);
  if (!worker) return;

  if (worker.status === 'present') {
    worker.status = 'late';
    worker.time = '08:45';
  } else if (worker.status === 'late') {
    worker.status = 'absent';
    worker.time = '--:--';
  } else {
    worker.status = 'present';
    worker.time = '07:15';
  }

  renderAttendanceTable();
  persistCloud();
  showToast('Pointage Mis à Jour', `${worker.name} synchronisé sur le Cloud.`);
};

// 8. Tabs inside Responsable Cards
window.switchRespTab = function(btn, targetId) {
  const card = btn.closest('.resp-card');
  card.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  card.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));

  btn.classList.add('active');
  const target = document.getElementById(targetId);
  if (target) target.classList.remove('hidden');
};

// 9. Modals
window.openModal = function(id) { document.getElementById(id).classList.add('active'); };
window.closeModal = function(id) { document.getElementById(id).classList.remove('active'); };
window.openBudgetModalFor = function(respKey) {
  document.getElementById('modalRespSelect').value = respKey;
  openModal('budgetModal');
};

// 10. Event Listeners
function setupEventListeners() {
  document.getElementById('openAddBudgetModal').addEventListener('click', () => openModal('budgetModal'));
  document.getElementById('openAddWorkerModal').addEventListener('click', () => openModal('workerModal'));

  document.getElementById('logoutBtn').addEventListener('click', () => {
    if (confirm('Voulez-vous quitter la session Directeur ?')) window.location.href = 'index.html';
  });

  const searchInput = document.getElementById('workerSearch');
  searchInput.addEventListener('input', (e) => {
    renderAttendanceTable('all', e.target.value.trim());
  });

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

      if (f === 'all') { c1.style.display = 'flex'; c2.style.display = 'flex'; }
      else if (f === 'resp1') { c1.style.display = 'flex'; c2.style.display = 'none'; }
      else { c1.style.display = 'none'; c2.style.display = 'flex'; }
    });
  });

  // Budget allocation submit
  document.getElementById('budgetForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const respKey = document.getElementById('modalRespSelect').value; // naoufel or hani
    const amount = parseFloat(document.getElementById('modalAmount').value);
    const note = document.getElementById('modalNote').value;

    if (amount > 0 && projectState) {
      projectState.responsables[respKey].received += amount;
      renderKPIs();
      persistCloud();
      closeModal('budgetModal');
      e.target.reset();
      showToast('Allocation Validée', `${formatDZD(amount)} transférés à ${projectState.responsables[respKey].name} en temps réel.`);
    }
  });

  // Add Worker Submit
  document.getElementById('workerForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('newWorkerName').value;
    const role = document.getElementById('newWorkerRole').value;
    const siteSelect = document.getElementById('newWorkerChantier').value;
    const status = document.getElementById('newWorkerStatus').value;
    const pay = parseFloat(document.getElementById('newWorkerPay').value) || 0;

    const targetResp = siteSelect.includes('Naoufel') ? 'naoufel' : 'hani';

    const newWorker = {
      id: Date.now(),
      name,
      role,
      time: status === 'absent' ? '--:--' : '07:30',
      status,
      pay
    };

    projectState.responsables[targetResp].workers.unshift(newWorker);
    renderAttendanceTable();
    persistCloud();
    closeModal('workerModal');
    e.target.reset();
    showToast('Ouvrier Enregistré', `Pointage de ${name} enregistré dans la BDD.`);
  });
}

// Toast
let toastTimer = null;
function showToast(title, msg) {
  const toast = document.getElementById('dashToast');
  document.getElementById('dashToastTitle').textContent = title;
  document.getElementById('dashToastMsg').textContent = msg;

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
