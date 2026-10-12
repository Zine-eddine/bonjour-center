/**
 * Interactive Controller for Responsable Chantier
 * - Synchronized in Realtime with Firestore (Meddeb Naoufel & Meddeb Hani)
 */

const urlParams = new URLSearchParams(window.location.search);
let currentRespKey = urlParams.get('user') || localStorage.getItem('active_resp') || 'naoufel';
if (currentRespKey === 'mourad') currentRespKey = 'naoufel';
if (currentRespKey === 'yacine') currentRespKey = 'hani';
if (currentRespKey !== 'naoufel' && currentRespKey !== 'hani') currentRespKey = 'naoufel';

let masterData = null;
let currentData = null;

document.addEventListener('DOMContentLoaded', () => {
  initClock();
  initTheme();
  setupEvents();
  initCloudData();
});

// 1. Cloud Firestore Sync
async function initCloudData() {
  if (typeof DB !== 'undefined') {
    masterData = await DB.getProjectData();
    updateLocalViews();

    DB.subscribeProject((updated) => {
      if (updated) {
        masterData = updated;
        updateLocalViews();
      }
    });
  }
}

function updateLocalViews() {
  if (!masterData || !masterData.responsables) return;
  currentData = masterData.responsables[currentRespKey];
  initProfile();
  renderWallet();
  renderMaterials();
  renderPayouts();
  renderAttendance();
  populateDropdowns();
}

function persistCloud() {
  if (typeof DB !== 'undefined' && masterData) {
    masterData.responsables[currentRespKey] = currentData;
    DB.saveProjectData(masterData);
  }
}

// 2. Profile Setup
function initProfile() {
  document.getElementById('userName').textContent = currentData.name;
  document.getElementById('siteLabel').textContent = currentData.site;
  document.getElementById('userAvatar').textContent = currentRespKey === 'naoufel' ? 'MN' : 'MH';
}

// 3. Clock
function initClock() {
  const clockEl = document.getElementById('liveTime');
  function update() {
    clockEl.textContent = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
  update();
  setInterval(update, 1000);
}

// 4. Theme
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

// 5. Wallet Calculation
function renderWallet() {
  const received = currentData.received;
  const matSpent = currentData.materials.reduce((acc, m) => acc + m.amount, 0);
  const paySpent = currentData.payouts.reduce((acc, p) => acc + p.amount, 0);
  const remaining = received - (matSpent + paySpent);

  document.getElementById('valReceived').textContent = formatDZD(received);
  document.getElementById('valMaterials').textContent = formatDZD(matSpent);
  document.getElementById('valPayouts').textContent = formatDZD(paySpent);
  document.getElementById('valRemaining').textContent = formatDZD(remaining);

  document.getElementById('countMaterials').textContent = currentData.materials.length;
  document.getElementById('countPayouts').textContent = currentData.payouts.length;
  document.getElementById('countWorkers').textContent = currentData.workers.length;
}

// 6. Materials List
function renderMaterials() {
  const listEl = document.getElementById('materialsList');
  listEl.innerHTML = currentData.materials.map(m => `
    <div class="record-item">
      <div class="record-main">
        <div class="record-icon mat"><i class="ph-fill ph-cube"></i></div>
        <div class="record-details">
          <span class="record-title">${m.title}</span>
          <span class="record-meta">${m.supplier} &bull; ${m.time}</span>
        </div>
      </div>
      <span class="record-cost mat">- ${formatDZD(m.amount)}</span>
    </div>
  `).join('');
}

// 7. Payouts List
function renderPayouts() {
  const listEl = document.getElementById('payoutsList');
  listEl.innerHTML = currentData.payouts.map(p => `
    <div class="record-item">
      <div class="record-main">
        <div class="record-icon pay"><i class="ph-fill ph-user-check"></i></div>
        <div class="record-details">
          <span class="record-title">${p.worker}</span>
          <span class="record-meta">${p.note || 'Paiement'} &bull; ${p.time}</span>
        </div>
      </div>
      <span class="record-cost pay">- ${formatDZD(p.amount)}</span>
    </div>
  `).join('');
}

// 8. Attendance Table
function renderAttendance() {
  const tbody = document.getElementById('attendanceTableBody');
  tbody.innerHTML = currentData.workers.map(w => {
    let statusText = 'Présent (Hader)';
    let statusClass = 'present';
    if (w.status === 'absent') { statusText = 'Absent (Ghayeb)'; statusClass = 'absent'; }
    else if (w.status === 'late') { statusText = 'En Retard'; statusClass = 'late'; }

    return `
      <tr>
        <td><strong>${w.name}</strong></td>
        <td>${w.role}</td>
        <td><code>${w.time}</code></td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        <td>
          <button class="btn-toggle-status" onclick="cycleStatus(${w.id})">Basculer</button>
        </td>
      </tr>
    `;
  }).join('');
}

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
  persistCloud();
  showToast('Pointage Modifié', `${worker.name} synchronisé.`);
};

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

window.openModal = function(id) { document.getElementById(id).classList.add('active'); };
window.closeModal = function(id) { document.getElementById(id).classList.remove('active'); };

function setupEvents() {
  document.getElementById('btnToolPointage').addEventListener('click', () => openModal('modalPointage'));
  document.getElementById('btnToolAchat').addEventListener('click', () => openModal('modalAchat'));
  document.getElementById('btnToolPaye').addEventListener('click', () => openModal('modalPaye'));

  document.getElementById('logoutBtn').addEventListener('click', () => {
    if (confirm('Voulez-vous quitter votre session chantier ?')) window.location.href = 'index.html';
  });

  document.querySelectorAll('.tab-link').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-link').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
    });
  });

  // Achat Matériaux Submit
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
    persistCloud();
    closeModal('modalAchat');
    e.target.reset();
    showToast('Achat Enregistré', `${formatDZD(amount)} déduits et synchronisés sur Firebase.`);
  });

  // Paiement Ouvrier Submit
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
    persistCloud();
    closeModal('modalPaye');
    e.target.reset();
    showToast('Paiement Validé', `${formatDZD(amount)} versés et enregistrés sur la BDD.`);
  });

  // Pointage Submit
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
      persistCloud();
      closeModal('modalPointage');
      showToast('Pointage Réussi', `Présence de ${worker.name} synchronisée.`);
    }
  });
}

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
