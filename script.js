/**
 * Next-Gen Interactive Controller for LIÈGE Authentication Portal
 * - Live Dark / Light mode toggle with memory
 * - Dynamic Password Strength Analyzer
 * - Mouse Parallax & Dynamic Light Orb Tracker
 * - Biometric / FaceID simulation
 * - Fluid Field Validation with Instant Checkmarks
 * - Cyber HUD Toast Notifications
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const authForm = document.getElementById('authForm');
  const userEmail = document.getElementById('userEmail');
  const userPassword = document.getElementById('userPassword');
  const fieldEmail = document.getElementById('fieldEmail');
  const fieldPassword = document.getElementById('fieldPassword');
  const togglePass = document.getElementById('togglePass');
  const eyeIcon = document.getElementById('eyeIcon');
  const loginBtn = document.getElementById('loginBtn');
  const neoCard = document.getElementById('neoCard');
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');
  const meterFill = document.getElementById('meterFill');
  const meterText = document.getElementById('meterText');
  const biometricBtn = document.getElementById('biometricBtn');
  const ssoBtn = document.getElementById('ssoBtn');
  const btnForgot = document.getElementById('btnForgot');
  const hudToast = document.getElementById('hudToast');

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // ==========================================================================
  // 1. Theme Management (Dark Cyber <-> Light Clean)
  // ==========================================================================
  const savedTheme = localStorage.getItem('liege_theme') || 'dark';
  applyTheme(savedTheme);

  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
  });

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('liege_theme', theme);
    if (theme === 'light') {
      themeIcon.className = 'ph ph-sun';
    } else {
      themeIcon.className = 'ph ph-moon';
    }
  }

  // ==========================================================================
  // 2. Interactive Aurora Light Follower (Mouse cursor tracker)
  // ==========================================================================
  const orb3 = document.querySelector('.orb-3');
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let currentX = mouseX;
  let currentY = mouseY;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    // Subtle 3D Card Tilt for Desktop
    if (window.innerWidth > 900 && neoCard) {
      const rect = neoCard.getBoundingClientRect();
      const cardCenterX = rect.left + rect.width / 2;
      const cardCenterY = rect.top + rect.height / 2;
      const rotateX = ((e.clientY - cardCenterY) / 30) * -1;
      const rotateY = (e.clientX - cardCenterX) / 30;
      neoCard.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    }
  });

  if (neoCard) {
    neoCard.addEventListener('mouseleave', () => {
      neoCard.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
    });
  }

  // Smooth RAF loop for the glowing orb
  function animateOrb() {
    currentX += (mouseX - currentX) * 0.05;
    currentY += (mouseY - currentY) * 0.05;
    if (orb3) {
      orb3.style.left = `${currentX}px`;
      orb3.style.top = `${currentY}px`;
    }
    requestAnimationFrame(animateOrb);
  }
  animateOrb();

  // ==========================================================================
  // 3. Password Show / Hide toggle
  // ==========================================================================
  togglePass.addEventListener('click', (e) => {
    e.preventDefault();
    const isPass = userPassword.getAttribute('type') === 'password';
    userPassword.setAttribute('type', isPass ? 'text' : 'password');
    eyeIcon.className = isPass ? 'ph ph-eye-slash' : 'ph ph-eye';
  });

  // ==========================================================================
  // 4. Realtime Password Strength Meter
  // ==========================================================================
  userPassword.addEventListener('input', () => {
    const val = userPassword.value;
    const strength = calculateStrength(val);

    // Update meter fill & text
    meterFill.style.width = `${strength.percent}%`;
    meterFill.style.backgroundColor = strength.color;
    meterText.textContent = strength.label;
    meterText.style.color = strength.color;

    if (fieldPassword.classList.contains('has-error') && val.length >= 6) {
      fieldPassword.classList.remove('has-error');
    }
  });

  function calculateStrength(pass) {
    if (!pass) return { percent: 0, color: 'transparent', label: 'Sécurité' };
    let score = 0;
    if (pass.length >= 6) score += 25;
    if (pass.length >= 10) score += 25;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 25;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 25;

    if (score <= 25) return { percent: 25, color: '#ef4444', label: 'Faible' };
    if (score <= 50) return { percent: 50, color: '#f59e0b', label: 'Moyen' };
    if (score <= 75) return { percent: 75, color: '#38bdf8', label: 'Bon' };
    return { percent: 100, color: '#10b981', label: 'Optimal' };
  }

  // ==========================================================================
  // 5. Email Realtime Check
  // ==========================================================================
  userEmail.addEventListener('input', () => {
    const val = userEmail.value.trim();
    if (emailRegex.test(val)) {
      fieldEmail.classList.add('is-valid');
      fieldEmail.classList.remove('has-error');
    } else {
      fieldEmail.classList.remove('is-valid');
    }
  });

  // ==========================================================================
  // 6. Form Submission with Feedback
  // ==========================================================================
  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    let valid = true;
    const emailVal = userEmail.value.trim();
    const passVal = userPassword.value;

    // Validate email
    if (!emailVal || !emailRegex.test(emailVal)) {
      fieldEmail.classList.add('has-error');
      valid = false;
    } else {
      fieldEmail.classList.remove('has-error');
    }

    // Validate password (allows admin for testing)
    if (!passVal || (passVal.length < 6 && passVal !== 'admin')) {
      fieldPassword.classList.add('has-error');
      valid = false;
    } else {
      fieldPassword.classList.remove('has-error');
    }

    if (!valid) {
      triggerVibrate();
      showHUDToast('Validation Requise', 'Veuillez vérifier vos identifiants.', true);
      return;
    }

    // Always redirect to dashboard.html smoothly
    try {
      await new Promise(r => setTimeout(r, 600));
      loginBtn.classList.remove('is-loading');
      loginBtn.disabled = false;

      showHUDToast('Accès Autorisé', 'Redirection vers le tableau de bord...', false);
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 700);
    } catch (err) {
      loginBtn.classList.remove('is-loading');
      loginBtn.disabled = false;
      showHUDToast('Erreur', 'Erreur de redirection', true);
    }
  });

  // ==========================================================================
  // 7. Instant Biometric / TouchID Demo
  // ==========================================================================
  biometricBtn.addEventListener('click', async () => {
    showHUDToast('Scan Biométrique', 'Vérification Face ID / Empreinte...', false);
    biometricBtn.style.opacity = '0.6';

    setTimeout(() => {
      biometricBtn.style.opacity = '1';
      userEmail.value = 'directeur@liege-immobilier.be';
      userPassword.value = 'SuperSecret2026!';
      userEmail.dispatchEvent(new Event('input'));
      userPassword.dispatchEvent(new Event('input'));
      showHUDToast('Identité Confirmée', 'Session authentifiée via clé matérielle.', false);
    }, 1200);
  });

  ssoBtn.addEventListener('click', () => {
    showHUDToast('Authentification Partenaire', 'Redirection vers le portail SSO sécurisé...', false);
  });

  btnForgot.addEventListener('click', (e) => {
    e.preventDefault();
    const email = userEmail.value.trim();
    if (email && emailRegex.test(email)) {
      showHUDToast('Lien de Récupération', `Un code temporaire a été envoyé à ${email}`, false);
    } else {
      userEmail.focus();
      fieldEmail.classList.add('has-error');
      showHUDToast('Email requis', 'Saisissez d\'abord votre e-mail pour recevoir le lien.', true);
    }
  });

  // ==========================================================================
  // 8. HUD Notification Helper
  // ==========================================================================
  let toastTimer = null;
  function showHUDToast(title, desc, isError = false) {
    if (toastTimer) clearTimeout(toastTimer);

    const toastTitle = document.getElementById('toastTitle');
    const toastDesc = document.getElementById('toastDesc');
    const toastIcon = document.getElementById('toastIcon');

    toastTitle.textContent = title;
    toastDesc.textContent = desc;

    if (isError) {
      hudToast.classList.add('hud-error');
      toastIcon.className = 'ph-fill ph-warning-circle';
    } else {
      hudToast.classList.remove('hud-error');
      toastIcon.className = 'ph-fill ph-check-circle';
    }

    hudToast.classList.add('active');

    toastTimer = setTimeout(() => {
      hudToast.classList.remove('active');
    }, 4200);
  }

  function triggerVibrate() {
    if (navigator.vibrate) {
      navigator.vibrate([40, 60, 40]);
    }
    neoCard.style.animation = 'none';
    neoCard.offsetHeight;
    neoCard.style.animation = 'cardShake 0.4s ease';
  }

  // Inject keyframe animation dynamically
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    @keyframes cardShake {
      0%, 100% { transform: translateX(0); }
      20% { transform: translateX(-8px); }
      40% { transform: translateX(8px); }
      60% { transform: translateX(-5px); }
      80% { transform: translateX(5px); }
    }
  `;
  document.head.appendChild(styleEl);
});
