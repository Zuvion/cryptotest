// -------- Telegram WebApp Initialization ----------
const tg = window.Telegram?.WebApp;

// Initialize Telegram WebApp
if (tg) {
  tg.ready();
  tg.expand();
  tg.enableClosingConfirmation();
  tg.setHeaderColor('secondary_bg_color');
  tg.setBackgroundColor('#0A0A0A');
  
  // Apply Telegram theme colors if available
  if (tg.themeParams) {
    const root = document.documentElement;
    if (tg.themeParams.bg_color) {
      root.style.setProperty('--tg-bg-color', tg.themeParams.bg_color);
    }
    if (tg.themeParams.text_color) {
      root.style.setProperty('--tg-text-color', tg.themeParams.text_color);
    }
  }
}

// -------- Splash Screen ----------
const splashStatusMessages = [
  { ru: 'Подключение к рынку...', en: 'Connecting to market...' },
  { ru: 'Загрузка цен...', en: 'Loading prices...' },
  { ru: 'Синхронизация данных...', en: 'Syncing candles...' },
  { ru: 'Подготовка торговли...', en: 'Preparing trades...' },
  { ru: 'Загрузка кошелька...', en: 'Loading wallet...' }
];

let splashStatusIndex = 0;
let splashStatusInterval = null;
let splashCanvasAnimation = null;

function initSplashScreen() {
  // Start status text rotation
  const statusEl = document.getElementById('splashStatus');
  if (statusEl) {
    splashStatusInterval = setInterval(() => {
      splashStatusIndex = (splashStatusIndex + 1) % splashStatusMessages.length;
      const lang = i18n?.lang || 'ru';
      statusEl.style.opacity = '0';
      setTimeout(() => {
        statusEl.textContent = splashStatusMessages[splashStatusIndex][lang] || splashStatusMessages[splashStatusIndex].en;
        statusEl.style.opacity = '0.7';
      }, 150);
    }, 800);
  }
  
  // Initialize canvas animation
  initSplashCanvas();
}

function initSplashCanvas() {
  const canvas = document.getElementById('splashCanvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  // Price line data
  let pricePoints = [];
  const pointCount = 60;
  for (let i = 0; i < pointCount; i++) {
    pricePoints.push({
      x: (i / pointCount) * canvas.width,
      y: canvas.height / 2 + Math.sin(i * 0.15) * 50 + Math.random() * 20
    });
  }
  
  let offset = 0;
  let colorPhase = 0;
  
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    ctx.strokeStyle = 'rgba(240, 185, 11, 0.3)';
    ctx.lineWidth = 0.5;
    const gridSize = 40;
    
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    
    // Update price points
    offset += 0.5;
    colorPhase += 0.01;
    
    for (let i = 0; i < pointCount; i++) {
      pricePoints[i].y = canvas.height / 2 + 
        Math.sin((i + offset) * 0.1) * 60 + 
        Math.sin((i + offset) * 0.05) * 30;
    }
    
    // Draw price line with gradient color
    const isGreen = Math.sin(colorPhase) > 0;
    const lineColor = isGreen ? 'rgba(14, 203, 129, 0.6)' : 'rgba(246, 70, 93, 0.6)';
    
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pricePoints[0].x, pricePoints[0].y);
    
    for (let i = 1; i < pointCount; i++) {
      const xc = (pricePoints[i].x + pricePoints[i - 1].x) / 2;
      const yc = (pricePoints[i].y + pricePoints[i - 1].y) / 2;
      ctx.quadraticCurveTo(pricePoints[i - 1].x, pricePoints[i - 1].y, xc, yc);
    }
    ctx.stroke();
    
    // Draw glow effect under line
    ctx.strokeStyle = isGreen ? 'rgba(14, 203, 129, 0.2)' : 'rgba(246, 70, 93, 0.2)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(pricePoints[0].x, pricePoints[0].y);
    for (let i = 1; i < pointCount; i++) {
      const xc = (pricePoints[i].x + pricePoints[i - 1].x) / 2;
      const yc = (pricePoints[i].y + pricePoints[i - 1].y) / 2;
      ctx.quadraticCurveTo(pricePoints[i - 1].x, pricePoints[i - 1].y, xc, yc);
    }
    ctx.stroke();
    
    splashCanvasAnimation = requestAnimationFrame(animate);
  }
  
  animate();
}

function hideSplashScreen() {
  const splash = document.getElementById('splashScreen');
  if (splash) {
    // Stop animations
    if (splashStatusInterval) {
      clearInterval(splashStatusInterval);
      splashStatusInterval = null;
    }
    if (splashCanvasAnimation) {
      cancelAnimationFrame(splashCanvasAnimation);
      splashCanvasAnimation = null;
    }
    
    splash.classList.add('fade-out');
    setTimeout(() => {
      splash.style.display = 'none';
    }, 350);
  }
}

function showSplashError() {
  const statusEl = document.getElementById('splashStatus');
  const errorEl = document.getElementById('splashError');
  const progressEl = document.querySelector('.splash-progress');
  
  if (statusEl) statusEl.style.display = 'none';
  if (progressEl) progressEl.style.display = 'none';
  if (errorEl) errorEl.style.display = 'block';
  
  if (splashStatusInterval) {
    clearInterval(splashStatusInterval);
    splashStatusInterval = null;
  }
}

// Initialize splash on load
document.addEventListener('DOMContentLoaded', initSplashScreen);

// -------- i18n ----------
const i18n = { lang:'ru', dict:{} };

// Detect initial language from Telegram → localStorage (only if manually set) → default
function detectInitialLang() {
  const supportedLangs = ['ru', 'en'];
  
  // Check if user manually changed language before
  const manualLangChange = localStorage.getItem('lang_manual');
  
  // Try to get language from Telegram WebApp
  let tgLang = null;
  try {
    const languageCode = tg?.initDataUnsafe?.user?.language_code;
    if (languageCode) {
      tgLang = languageCode.toLowerCase().split('-')[0];
    }
  } catch (e) {}
  
  const storedLang = localStorage.getItem('lang');
  
  // Priority: Manual user choice → Telegram → default 'ru'
  if (manualLangChange === 'true' && storedLang && supportedLangs.includes(storedLang)) {
    return storedLang;
  }
  
  if (tgLang && supportedLangs.includes(tgLang)) {
    return tgLang;
  }
  
  return 'ru';
}

async function loadTranslations(){
  try{
    const cacheBust = Date.now();
    const r = await fetch(`/i18n/translations.json?v=${cacheBust}`);
    i18n.dict = await r.json();
  }catch(e){ 
    i18n.dict={ru:{},en:{}}; 
  }
  
  const detectedLang = detectInitialLang();
  setLang(detectedLang);
}

function t(k){ return i18n.dict[i18n.lang]?.[k] || k; }

function setLang(lang, isManual = false){
  i18n.lang=(['ru','en'].includes(lang)?lang:'ru');
  localStorage.setItem('lang', i18n.lang);
  if (isManual) {
    localStorage.setItem('lang_manual', 'true');
  }
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const key = el.getAttribute('data-i18n');
    const navLabel = el.querySelector('.nav-label');
    if (navLabel) {
      navLabel.textContent = t(key);
    } else {
      el.textContent = t(key);
    }
  });
  const pullText = document.getElementById('pullText');
  if (pullText) pullText.textContent = t('common.pull_to_refresh');
}
function toast(m){
  const el=document.getElementById('toast'); if(!el) return;
  el.textContent=m; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'),3000);
}

// -------- Number Formatting (space as thousands separator) ----------
function fmtNum(value, decimals = 2) {
  const num = Number(value || 0);
  const fixed = num.toFixed(decimals);
  const [intPart, decPart] = fixed.split('.');
  const sign = intPart.startsWith('-') ? '-' : '';
  const abs = intPart.replace('-', '');
  const formatted = abs.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return decPart !== undefined ? sign + formatted + '.' + decPart : sign + formatted;
}

// -------- Count-Up Animation ----------
let balanceAnimated = false;
function countUp(element, target, duration = 1000, decimals = 2) {
  const start = 0;
  const startTime = performance.now();
  const easeOutQuad = t => t * (2 - t);
  
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easeOutQuad(progress);
    const current = start + (target - start) * easedProgress;
    
    element.textContent = fmtNum(current, decimals);
    
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  
  requestAnimationFrame(update);
}

// -------- Skeleton Loading ----------
function showAssetsSkeleton() {
  const cont = document.getElementById('root');
  cont.innerHTML = `
    <div class="container">
      <div class="balance-card">
        <div class="skeleton skeleton-text" style="width:60px;height:12px;margin-bottom:8px"></div>
        <div class="skeleton skeleton-balance"></div>
        <div class="skeleton skeleton-balance-sub"></div>
        <div style="display:flex;gap:8px;margin-top:16px">
          <div class="skeleton" style="flex:1;height:40px"></div>
          <div class="skeleton" style="flex:1;height:40px"></div>
          <div class="skeleton" style="flex:1;height:40px"></div>
        </div>
      </div>
      <div class="section">
        <div class="section-header">
          <div class="skeleton skeleton-text" style="width:100px"></div>
        </div>
      </div>
      <div class="section">
        <div class="section-header">
          <div class="skeleton skeleton-text" style="width:120px"></div>
        </div>
        <div class="section-content">
          <div class="wallet-grid">
            <div class="skeleton skeleton-card"></div>
            <div class="skeleton skeleton-card"></div>
            <div class="skeleton skeleton-card"></div>
            <div class="skeleton skeleton-card"></div>
          </div>
        </div>
      </div>
      <div class="section">
        <div class="section-header">
          <div class="skeleton skeleton-text" style="width:80px"></div>
        </div>
        <div class="section-content">
          <div class="skeleton skeleton-row"></div>
          <div class="skeleton skeleton-row"></div>
          <div class="skeleton skeleton-row"></div>
        </div>
      </div>
    </div>
  `;
}

function showTradeSkeleton() {
  const cont = document.getElementById('root');
  cont.innerHTML = `
    <div class="container">
      <div class="section" style="padding:16px">
        <div class="skeleton" style="width:100%;height:200px;margin-bottom:16px"></div>
        <div style="display:flex;gap:8px;margin-bottom:16px">
          <div class="skeleton" style="flex:1;height:44px"></div>
          <div class="skeleton" style="flex:1;height:44px"></div>
        </div>
        <div class="skeleton" style="width:100%;height:48px;margin-bottom:8px"></div>
        <div style="display:flex;gap:8px">
          <div class="skeleton" style="flex:1;height:56px"></div>
          <div class="skeleton" style="flex:1;height:56px"></div>
        </div>
      </div>
    </div>
  `;
}

// -------- Trade Result Notification System ----------
function showTradeNotification(type, amount, pair) {
  const existingToast = document.getElementById('tradeNotification');
  if (existingToast) existingToast.remove();
  
  const isWin = type === 'win';
  const icon = isWin ? '✓' : '✕';
  const color = isWin ? '#00E676' : '#FF5252';
  const bgColor = isWin ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 82, 82, 0.15)';
  const borderColor = isWin ? 'rgba(0, 230, 118, 0.4)' : 'rgba(255, 82, 82, 0.4)';
  const sign = isWin ? '+' : '-';
  const statusText = t('trade.position_closed');
  const resultText = isWin ? t('trade.profit') : t('trade.loss_text');
  
  const notification = document.createElement('div');
  notification.id = 'tradeNotification';
  notification.className = 'trade-notification';
  notification.innerHTML = `
    <div class="trade-notification-icon" style="background:${color}">${icon}</div>
    <div class="trade-notification-content">
      <div class="trade-notification-title">${statusText}</div>
      <div class="trade-notification-result" style="color:${color}">
        ${resultText} ${sign}${fmtNum(Math.abs(amount), 0)} USDT
      </div>
      ${pair ? `<div class="trade-notification-pair">${pair}</div>` : ''}
    </div>
  `;
  notification.style.cssText = `
    position:fixed;top:60px;left:50%;transform:translateX(-50%) translateY(-120%);
    background:${bgColor};border:1px solid ${borderColor};border-radius:12px;
    padding:14px 20px;display:flex;align-items:center;gap:14px;z-index:1000;
    backdrop-filter:blur(10px);box-shadow:0 8px 32px rgba(0,0,0,0.4);
    animation:tradeNotificationSlideIn 0.4s ease forwards;min-width:280px;
  `;
  
  document.body.appendChild(notification);
  
  // Play sound effect (optional)
  playTradeSound(isWin);
  
  // Auto dismiss after 4 seconds
  setTimeout(() => {
    notification.style.animation = 'tradeNotificationSlideOut 0.3s ease forwards';
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}

// Sound effects for trade results
function playTradeSound(isWin) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    
    const audioCtx = new AudioContext();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    if (isWin) {
      // Win sound: ascending tone
      oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(900, audioCtx.currentTime + 0.1);
      oscillator.type = 'sine';
    } else {
      // Loss sound: descending tone
      oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.15);
      oscillator.type = 'sine';
    }
    
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
    
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.2);
  } catch(e) {
    // Sound not supported or blocked
  }
}

// Calculation delay overlay
function showCalculationOverlay() {
  const existingOverlay = document.getElementById('calculationOverlay');
  if (existingOverlay) existingOverlay.remove();
  
  const calcText = t('trade.calculating');
  
  const overlay = document.createElement('div');
  overlay.id = 'calculationOverlay';
  overlay.innerHTML = `
    <div class="calculation-modal">
      <div class="calculation-spinner"></div>
      <div class="calculation-text">${calcText}</div>
    </div>
  `;
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:999;display:flex;align-items:center;
    justify-content:center;background:rgba(0,0,0,0.7);backdrop-filter:blur(4px);
    animation:fadeIn 0.2s ease;
  `;
  
  document.body.appendChild(overlay);
  return overlay;
}

function hideCalculationOverlay() {
  const overlay = document.getElementById('calculationOverlay');
  if (overlay) {
    overlay.style.animation = 'fadeOut 0.2s ease forwards';
    setTimeout(() => overlay.remove(), 200);
  }
}

// -------- Rate updates ----------
async function updateRates() {
  try {
    await apiFetch('/api/rates');
  } catch(e) {}
}

async function openSettings() {
  const cont = document.getElementById('root');
  
  const currentLang = i18n.lang || 'ru';
  
  cont.innerHTML = `
  <div class="container" style="padding:16px">
    <button class="btn" id="backAssets" style="background:transparent;border:none;color:#fff;font-size:16px;padding:8px 0;margin-bottom:16px">← ${t('btn.back')}</button>
    <div class="section-title" style="font-size:20px;font-weight:700;margin-bottom:20px">${t('settings.title')}</div>
    
    <div class="section" style="margin-top:10px">
      <div class="section-header"><div class="section-title">🌍 ${t('settings.language')}</div></div>
      <div class="section-content" style="display:flex;flex-direction:column;gap:8px">
        <div class="lang-option" data-lang="ru" style="background:${currentLang === 'ru' ? 'rgba(224,64,251,0.15)' : '#131A2A'};border:1px solid ${currentLang === 'ru' ? '#E040FB' : 'transparent'};border-radius:6px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;transition:all 0.2s">
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:40px;height:40px;border-radius:50%;background:#1E88E5;display:flex;align-items:center;justify-content:center;font-size:18px">🇷🇺</div>
            <div style="font-weight:600;font-size:15px;color:#fff">${t('settings.russian')}</div>
          </div>
          <div style="color:${currentLang === 'ru' ? '#E040FB' : 'transparent'};font-size:20px">✓</div>
        </div>
        
        <div class="lang-option" data-lang="en" style="background:${currentLang === 'en' ? 'rgba(224,64,251,0.15)' : '#131A2A'};border:1px solid ${currentLang === 'en' ? '#E040FB' : 'transparent'};border-radius:6px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;transition:all 0.2s">
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:40px;height:40px;border-radius:50%;background:#43A047;display:flex;align-items:center;justify-content:center;font-size:18px">🇺🇸</div>
            <div style="font-weight:600;font-size:15px;color:#fff">English</div>
          </div>
          <div style="color:${currentLang === 'en' ? '#E040FB' : 'transparent'};font-size:20px">✓</div>
        </div>
      </div>
    </div>
  </div>`;
  
  document.getElementById('backAssets').onclick = renderAssets;
  
  document.querySelectorAll('.lang-option').forEach(option => {
    option.onclick = () => {
      const lang = option.getAttribute('data-lang');
      i18n.lang = lang;
      localStorage.setItem('lang', lang);
      toast(t('toast.saved'));
      renderAssets();
    };
  });
}

// -------- Auth bootstrap ----------
let TG_USER=null; try{ TG_USER = tg?.initDataUnsafe?.user || null }catch(e){}
let userData = null;

const apiFetch = async (url, options = {}) => {
  options.headers = options.headers || {};
  if (tg?.initData) {
    options.headers['X-Telegram-Init-Data'] = tg.initData;
  }
  options.headers['X-Telegram-Id'] = TG_USER?.id || '999999';
  return fetch(url, options);
};

async function ensureUser(){
  try{
    await apiFetch('/api/auth/ensure',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        telegram_id: TG_USER?.id || 999999,
        username: TG_USER?.username || null,
        language: i18n.lang
      })
    });
  }catch(e){ console.error('ensureUser failed', e); }
}
function setActive(tab){
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  const el=document.querySelector(`.nav-item[data-tab="${tab}"]`);
  if(el){ el.classList.add('active', tab); }
  const tf = document.getElementById('tradeButtonsFixed');
  if(tf) tf.remove();
}
function shortAddr(s){ if(!s) return ''; return s.slice(0,5)+'…'+s.slice(-4); }

// Restore original header
function restoreHeader(){
  const headerBrand = document.querySelector('.header .brand');
  const headerActions = document.querySelector('.header .actions');
  const headerTitle = document.querySelector('.header .header-title');
  
  if(headerBrand){
    headerBrand.innerHTML = `
      <div class="cryptexa-header-logo">
        <img src="/static/img/logo.png" alt="CRYPTEXA" width="32" height="32" style="border-radius:6px">
      </div>
    `;
  }
  
  if(headerTitle){
    headerTitle.textContent = 'CRYPTEXA';
    headerTitle.classList.add('cryptexa-brand');
    headerTitle.removeAttribute('data-i18n');
  }
  
  if(headerActions){
    headerActions.innerHTML = `
      <button class="icon-btn" id="btnLang" title="Language">🌐</button>
      <button class="icon-btn" title="Notifications">🔔</button>
    `;
    const btnLang = document.getElementById('btnLang');
    if(btnLang){ btnLang.onclick = ()=>{
      const newLang = i18n.lang==='ru'?'en':'ru';
      setLang(newLang, true);
      const activeTab = document.querySelector('.nav-item.active');
      const tab = activeTab ? activeTab.getAttribute('data-tab') : 'assets';
      if(tab==='assets') renderAssets();
      else if(tab==='trade') renderTrade();
      else if(tab==='referrals') renderReferrals();
      else if(tab==='profile') renderProfile();
      toast(newLang==='ru' ? 'Язык: Русский' : 'Language: English');
    }; }
  }
}

function renderHistoryPage(container, transactions, page) {
  const perPage = 10;
  container.innerHTML = '';
  if (!transactions || transactions.length === 0) {
    container.innerHTML = `<div style="text-align:center;color:#7B8CA2;padding:20px;font-size:12px">${t('history.empty')}</div>`;
    return;
  }
  const totalPages = Math.ceil(transactions.length / perPage);
  const start = (page - 1) * perPage;
  const pageItems = transactions.slice(start, start + perPage);
  
  pageItems.forEach(h => {
    const card = document.createElement('div');
    card.className = 'history-card';
    const date = new Date(h.created_at);
    const localDate = date.toLocaleDateString();
    const localTime = date.toLocaleTimeString();
    const typeIcon = h.type === 'deposit' ? '📥' : '📤';
    const typeText = h.type === 'deposit' ? t('history.type.deposit') : t('history.type.withdrawal');
    const statusInfo = (() => {
      if (h.status === 'done' || h.status === 'completed') return { text: t('history.paid'), color: '#00E676' };
      if (h.status === 'pending') return { text: t('history.not_paid'), color: '#E040FB' };
      if (h.status === 'cancelled' || h.status === 'expired') return { text: t('history.cancelled'), color: '#FF5252' };
      return { text: h.status, color: '#7B8CA2' };
    })();
    const amountColor = (h.status === 'done' || h.status === 'completed') ? (h.type === 'deposit' ? '#00E676' : '#FF5252') : '#7B8CA2';
    const amountPrefix = h.type === 'deposit' ? '+' : '-';
    const method = (() => {
      if (h.type === 'deposit' && h.details) {
        if (h.details.method === 'xrocket') return '🚀 xRocket';
        if (h.details.method === 'oxapay' || (h.details.invoice_id && h.details.invoice_id.startsWith('oxapay_'))) return '⛓ OxaPay';
        if (h.details.invoice_id && h.details.invoice_id.startsWith('xrocket_')) return '🚀 xRocket';
      }
      if (h.type === 'withdrawal') return '📤 ' + t('history.crypto_dest');
      return '';
    })();
    let detailsHTML = '';
    if (h.type === 'deposit' && h.details) {
      const currency = h.details.currency || h.details.pay_currency || h.currency || 'USDT';
      detailsHTML = `<div><b>${t('history.method')}:</b> ${method}</div>
        <div style="margin-top:4px"><b>${t('history.currency')}:</b> ${currency}</div>
        <div style="margin-top:4px"><b>${t('history.amount')}:</b> ${h.details.amount_usd || h.amount || 0} USD</div>`;
    } else if (h.type === 'withdrawal' && h.details) {
      detailsHTML = `<div><b>${t('history.amount')}:</b> ${h.details.amount_rub || h.amount || 0} USDT</div>
        <div style="margin-top:4px"><b>${t('history.address')}:</b> <span style="font-family:monospace;font-size:11px">${h.details.card_number || h.details.crypto_address || 'N/A'}</span></div>
        <div style="margin-top:4px"><b>${t('history.network')}:</b> ${h.details.full_name || h.details.network || 'TRC20'}</div>`;
    }
    card.innerHTML = `
      <div class="history-main" style="display:flex;justify-content:space-between;align-items:center">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="font-size:24px">${typeIcon}</div>
          <div>
            <div style="font-weight:600;color:#fff;font-size:14px">${typeText}</div>
            <div style="color:#888;font-size:12px">${localDate} ${localTime}</div>
            ${method ? `<div style="font-size:11px;color:#7B8CA2;margin-top:2px">${method}</div>` : ''}
          </div>
        </div>
        <div style="text-align:right">
          <div style="font-weight:700;color:${amountColor};font-size:16px">${amountPrefix}${h.amount} ${h.currency || 'USDT'}</div>
          <div style="font-size:11px;font-weight:600;color:${statusInfo.color}">${statusInfo.text}</div>
          <div style="color:#888;font-size:11px;margin-top:2px">▼</div>
        </div>
      </div>
      <div class="history-details" style="display:none;margin-top:12px;padding-top:12px;border-top:1px solid #2a2a2a">
        <div style="color:#9ca3af;font-size:13px;line-height:1.6">
          ${detailsHTML}
          <div style="margin-top:4px"><b>${t('profile.status')}:</b> <span style="color:${statusInfo.color}">${statusInfo.text}</span></div>
        </div>
      </div>`;
    card.onclick = () => {
      const details = card.querySelector('.history-details');
      details.style.display = details.style.display === 'none' ? 'block' : 'none';
    };
    container.appendChild(card);
  });

  if (totalPages > 1) {
    const paginationDiv = document.createElement('div');
    paginationDiv.className = 'history-pagination';
    let paginationHTML = '';
    if (page > 1) {
      paginationHTML += `<button class="history-page-btn" onclick="window._historyGoPage(${page-1})">←</button>`;
    }
    paginationHTML += `<span class="history-page-info">${page} / ${totalPages}</span>`;
    if (page < totalPages) {
      paginationHTML += `<button class="history-page-btn" onclick="window._historyGoPage(${page+1})">→</button>`;
    }
    paginationDiv.innerHTML = paginationHTML;
    container.appendChild(paginationDiv);
  }
}

window._historyGoPage = function(page) {
  window._historyPage = page;
  const historyList = document.getElementById('historyList');
  if (historyList && window._historyTransactions) {
    renderHistoryPage(historyList, window._historyTransactions, page);
    historyList.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

// -------- Assets (ЛК) ----------
async function renderAssets(){
  try{
    restoreHeader(); // Restore original header
    setActive('assets');
    const cont=document.getElementById('root');
    
    // Show skeleton loading first
    showAssetsSkeleton();
    
    let user={ balance_usdt:0, wallets:{}, addresses:{}, profile_id:0 };
    try{ user = await (await apiFetch('/api/user')).json(); }catch(e){ console.error('api/user failed',e); }
    userData = user;
    const navProfile = document.getElementById('navProfile');
    const navProfileLabel = document.getElementById('navProfileLabel');
    if(navProfile) {
      navProfile.style.display = '';
      if(userData?.is_admin) {
        navProfileLabel.textContent = t('admin.nav_label');
      } else {
        navProfileLabel.textContent = t('profile.title');
      }
    }
    
    // Check if user is blocked
    if(user.is_blocked){
      const reason = user.block_reason || (t('account.blocked_reason'));
      cont.innerHTML = `
        <div class="container" style="padding-top:80px">
          <div style="text-align:center;padding:40px 20px">
            <div style="font-size:80px;margin-bottom:24px">🚫</div>
            <h2 style="color:#FF5252;margin-bottom:16px;font-size:24px">${t('account.blocked')}</h2>
            <p style="color:#7B8CA2;font-size:16px;line-height:1.6;margin-bottom:24px">${reason}</p>
            <div style="background:#131A2A;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;margin-top:24px">
              <p style="color:#7B8CA2;font-size:14px;margin-bottom:16px">${t('account.blocked_contact')}</p>
              <button class="btn btn-primary" id="btnContactSupport" style="width:100%">${t('support.contact')}</button>
            </div>
          </div>
        </div>
      `;
      document.getElementById('btnContactSupport')?.addEventListener('click', openSupport);
      return;
    }
    
    await updateRates();

    let stats = { pnl_today: 0, pnl_total: 0, active_trades_count: 0, next_trade_seconds: null, wins_count: 0, losses_count: 0, total_trades: 0, telegram_id: null };
    try { stats = await (await apiFetch('/api/stats')).json(); } catch(e) {}

    const pnlTodayColor = stats.pnl_today >= 0 ? '#00E676' : '#FF5252';
    const pnlTotalColor = stats.pnl_total >= 0 ? '#00E676' : '#FF5252';
    const pnlTodaySign = stats.pnl_today >= 0 ? '+' : '';
    const pnlTotalSign = stats.pnl_total >= 0 ? '+' : '';

    let activeTradesHtml = '';
    if (stats.active_trades_count > 0) {
      activeTradesHtml = `
        <div id="activeTradesAlert" style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:12px;padding:12px 16px;background:rgba(224,64,251,0.12);border:1px solid rgba(224,64,251,0.25);border-radius:12px;cursor:pointer">
          <span style="font-size:14px">⚡</span>
          <span style="font-size:13px;color:#E040FB;font-weight:600">${t('trade.active_trades')}: ${stats.active_trades_count}</span>
        </div>`;
      if (stats.next_trade_seconds !== null) {
        activeTradesHtml += `
        <div style="text-align:center;margin-top:6px;font-size:12px;color:#7B8CA2">
          ${stats.active_trades_count === 1 ? (t('trade.one_closes_in')) : (t('trade.next_in'))} <span style="color:#E040FB;font-weight:600">${stats.next_trade_seconds}${t('trade.sec')}</span>
        </div>`;
      }
    } else {
      activeTradesHtml = `
        <div style="text-align:center;margin-top:12px;font-size:12px;color:#4A5568">
          ${t('trade.no_active')}
        </div>`;
    }

    cont.innerHTML = `
      <div class="container">
        <div class="balance-card">
          <div class="small">${t('common.balance')}</div>
          <div class="balance-amount"><span id="balanceValue">${balanceAnimated ? fmtNum(user.balance_usdt||0, 2) : '0.00'}</span> <span class="currency">${t('common.usdt')}</span></div>
          <div style="font-size:14px;color:#7B8CA2;margin-top:6px;font-family:monospace">≈ ${fmtNum(user.balance_usdt||0, 2)} $</div>
          
          <div style="display:flex;align-items:center;justify-content:center;gap:20px;margin-top:14px">
            <div style="text-align:center">
              <div style="font-size:11px;color:#7B8CA2;margin-bottom:3px">${t('profile.today')}</div>
              <div style="font-size:14px;color:${pnlTodayColor};font-weight:600">${pnlTodaySign}${fmtNum(stats.pnl_today, 2)} USDT</div>
            </div>
            <div style="width:1px;height:24px;background:rgba(255,255,255,0.08)"></div>
            <div style="text-align:center">
              <div style="font-size:11px;color:#7B8CA2;margin-bottom:3px">${t('profile.total')}</div>
              <div style="font-size:14px;color:${pnlTotalColor};font-weight:600">${pnlTotalSign}${fmtNum(stats.pnl_total, 2)} USDT</div>
            </div>
          </div>
          
          ${activeTradesHtml}
          
          <div class="balance-actions">
            <button class="btn btn-primary" id="btnDeposit" data-i18n="btn.deposit">${t('btn.deposit')}</button>
            <button class="btn btn-green" id="btnExchange" data-i18n="btn.exchange">${t('btn.exchange')}</button>
            <button class="btn btn-purple" id="btnWithdraw" data-i18n="btn.withdraw">${t('btn.withdraw')}</button>
          </div>
        </div>

        <div class="section" id="profileSection">
          <div class="section-header" id="profileToggle" style="cursor:pointer">
            <div style="display:flex;align-items:center;gap:10px">
              <div class="section-title">${t('profile.title')}</div>
            </div>
          </div>
          <div class="section-content" id="profileContent">
            <div style="display:flex;flex-direction:column;gap:8px">
              <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:rgba(255,255,255,0.04);border-radius:10px;border:1px solid rgba(255,255,255,0.06)">
                <span style="color:#7B8CA2;font-size:12px">ID ${t('profile.account_id')}</span>
                <span style="color:#EAECEF;font-size:13px;font-family:monospace;font-weight:600">${stats.telegram_id || TG_USER?.id || '—'}</span>
              </div>
              <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:rgba(0,230,118,0.06);border-radius:10px;border:1px solid rgba(0,230,118,0.15)">
                <div style="display:flex;align-items:center;gap:8px">
                  <div style="width:8px;height:8px;border-radius:50%;background:#00E676"></div>
                  <span style="color:#7B8CA2;font-size:12px">${t('profile.wins')}</span>
                </div>
                <span style="color:#00E676;font-size:15px;font-weight:700">${stats.wins_count || 0}</span>
              </div>
              <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:rgba(255,82,82,0.06);border-radius:10px;border:1px solid rgba(255,82,82,0.15)">
                <div style="display:flex;align-items:center;gap:8px">
                  <div style="width:8px;height:8px;border-radius:50%;background:#FF5252"></div>
                  <span style="color:#7B8CA2;font-size:12px">${t('profile.losses')}</span>
                </div>
                <span style="color:#FF5252;font-size:15px;font-weight:700">${stats.losses_count || 0}</span>
              </div>
              <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:rgba(255,255,255,0.04);border-radius:10px;border:1px solid rgba(255,255,255,0.06)">
                <div style="display:flex;align-items:center;gap:8px">
                  <div style="width:8px;height:8px;border-radius:50%;background:#7B8CA2"></div>
                  <span style="color:#7B8CA2;font-size:12px">${t('profile.total_trades')}</span>
                </div>
                <span style="color:#7B8CA2;font-size:15px;font-weight:700">${stats.total_trades || 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="section" id="accountStatusSection">
          <div class="section-header" id="statusToggle" style="cursor:pointer">
            <div style="display:flex;align-items:center;gap:10px">
              <div class="section-title">${t('profile.status')}</div>
              <div style="display:flex;gap:6px">
                <div style="width:20px;height:20px;border-radius:50%;background:${user.is_verified ? '#00E676' : '#1B2336'};display:flex;align-items:center;justify-content:center;font-size:10px;color:${user.is_verified ? '#fff' : '#4A5568'}">✓</div>
                <div style="width:20px;height:20px;border-radius:50%;background:${user.is_premium ? '#E040FB' : '#1B2336'};display:flex;align-items:center;justify-content:center;font-size:9px;color:${user.is_premium ? '#fff' : '#4A5568'}">⭐</div>
              </div>
            </div>
          </div>
          <div class="section-content hidden" id="statusContent">
            <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:rgba(255,255,255,0.04);border-radius:10px;border:1px solid rgba(255,255,255,0.06);margin-bottom:8px">
              <div style="display:flex;align-items:center;gap:8px">
                <div style="width:24px;height:24px;border-radius:50%;background:${user.is_verified ? '#00E676' : '#1B2336'};display:flex;align-items:center;justify-content:center;font-size:11px;color:${user.is_verified ? '#fff' : '#7B8CA2'}">✓</div>
                <span style="color:#EAECEF;font-size:13px">${t('profile.verification')}</span>
              </div>
              <span style="color:${user.is_verified ? '#00E676' : '#7B8CA2'};font-size:12px">${user.is_verified ? '✓' : '—'}</span>
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:rgba(255,255,255,0.04);border-radius:10px;border:1px solid rgba(255,255,255,0.06)">
              <div style="display:flex;align-items:center;gap:8px">
                <div style="width:24px;height:24px;border-radius:50%;background:${user.is_premium ? '#E040FB' : '#1B2336'};display:flex;align-items:center;justify-content:center;font-size:10px;color:${user.is_premium ? '#fff' : '#7B8CA2'}">⭐</div>
                <span style="color:#EAECEF;font-size:13px">Premium</span>
              </div>
              <span style="color:${user.is_premium ? '#E040FB' : '#7B8CA2'};font-size:12px">${user.is_premium ? '✓' : '—'}</span>
            </div>
            ${user.is_premium ? `
            <button id="btnCreateCheck" style="margin-top:12px;width:100%;padding:14px;background:linear-gradient(135deg,#E040FB,#7C4DFF);color:#fff;font-weight:600;font-size:14px;border:none;border-radius:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 4px 15px rgba(224,64,251,0.25)">
              <span style="font-size:16px">🎁</span>
              ${t('account.gift_check')}
            </button>
            ` : `
            <div style="margin-top:10px;padding:10px 14px;background:rgba(124,77,255,0.06);border-radius:10px;border:1px solid rgba(124,77,255,0.15)">
              <span style="color:#7B8CA2;font-size:11px">${t('account.get_status')}</span>
            </div>
            `}
          </div>
        </div>

        <div class="section" id="walletsSection">
          <div class="section-header" id="walletsToggle">
            <div class="section-title">${t('wallets.title')}</div>
            <div class="badge">10+</div>
          </div>
          <div class="section-content hidden" id="walletsContent">
            <div class="wallet-grid" id="walletGrid"></div>
          </div>
        </div>

        <div class="section">
          <div class="section-header" id="histToggle">
            <div class="section-title" data-i18n="history.title">${t('history.title')}</div>
          </div>
          <div class="section-content hidden" id="historyWrap">
            <div id="historyList"></div>
          </div>
        </div>
      </div>
      <button class="fab" id="fabSupport">${t('support.chat')}</button>`;

    // Свернуть/развернуть
    document.getElementById('profileToggle').onclick = ()=> document.getElementById('profileContent').classList.toggle('hidden');
    document.getElementById('statusToggle').onclick  = ()=> document.getElementById('statusContent').classList.toggle('hidden');
    
    // Create check button for Premium users
    const btnCreateCheck = document.getElementById('btnCreateCheck');
    if (btnCreateCheck) {
      btnCreateCheck.onclick = () => openCreateCheckModal();
    }
    document.getElementById('walletsToggle').onclick = ()=> document.getElementById('walletsContent').classList.toggle('hidden');
    document.getElementById('histToggle').onclick    = ()=> document.getElementById('historyWrap').classList.toggle('hidden');
    
    // Active trades alert click handler - navigate to trade section
    const activeTradesAlert = document.getElementById('activeTradesAlert');
    if (activeTradesAlert) {
      activeTradesAlert.onclick = () => { renderTrade(); };
    }

    // Кошельки (10+) - загружаем цены для отображения
    const grid = document.getElementById('walletGrid');
    const cryptoList = ['USDT','BTC','ETH','TON','SOL','BNB','XRP','DOGE','LTC','TRX'];
    
    // Получаем цены для всех криптовалют
    let prices = {};
    try {
      const pricesRes = await apiFetch('/api/prices');
      prices = await pricesRes.json();
    } catch(e) { console.error('Failed to load prices', e); }
    
    cryptoList.forEach(sym=>{
      const bal = sym==='USDT' ? user.balance_usdt : (user.wallets?.[sym] || 0);
      const priceData = prices[sym] || (sym === 'USDT' ? {price: 1, change_24h: 0} : {price: 0, change_24h: 0});
      const price = typeof priceData === 'object' ? priceData.price : priceData;
      const change24h = typeof priceData === 'object' ? (priceData.change_24h || 0) : 0;
      const valueUSDT = bal * price;
      const hasBalance = bal > 0.0001;
      
      const isPositive = change24h >= 0;
      const changeColor = isPositive ? '#00E676' : '#FF5252';
      const changeArrow = isPositive ? '↑' : '↓';
      const changeText = `${isPositive ? '+' : ''}${fmtNum(change24h, 2)}%`;
      const borderColor = sym === 'USDT' ? 'transparent' : changeColor;
      
      const card = document.createElement('div');
      card.className='wallet-card';
      
      let cardStyle = `border-left:3px solid ${borderColor};`;
      if (hasBalance) {
        cardStyle += 'border-color:#E040FB;background:rgba(224,64,251,0.04);border-left:3px solid ' + borderColor + ';';
      }
      if (sym !== 'USDT') {
        cardStyle += 'cursor:pointer;transition:all 0.2s ease;';
      }
      card.style.cssText = cardStyle;
      
      const logo = cryptoLogos[sym] || '';
      const logoHTML = logo ? `<img src="${logo}" style="width:28px;height:28px;border-radius:50%" onerror="this.style.display='none'"/>` : `<span style="font-size:20px">💰</span>`;
      
      const priceFormatted = sym === 'USDT' ? '$1.00' : `$${Number(price).toLocaleString('en-US', {minimumFractionDigits: price < 1 ? 4 : 2, maximumFractionDigits: price < 1 ? 4 : 2})}`;
      
      const changeHTML = sym === 'USDT' ? '' : `<span style="font-size:10px;color:${changeColor};font-weight:600;margin-left:6px">${changeArrow} ${changeText}</span>`;
      
      card.innerHTML = `
        <div class="wallet-top" style="margin-bottom:6px">
          <div style="display:flex;align-items:center;gap:8px">
            ${logoHTML}
            <div>
              <div style="font-weight:600;font-size:13px;color:#EAECEF">${sym}${changeHTML}</div>
              <div style="font-size:11px;color:#E040FB;font-weight:500;font-family:monospace">${priceFormatted}</div>
            </div>
          </div>
        </div>
        <div class="wallet-balance" style="font-size:12px;font-weight:500;color:${hasBalance ? '#00E676' : '#7B8CA2'};font-family:monospace">${fmtNum(bal||0, sym==='USDT'?2:6)} ${sym}</div>
        ${hasBalance && sym !== 'USDT' ? `<div style="font-size:10px;color:#7B8CA2;margin-top:3px;font-family:monospace">≈ $${fmtNum(valueUSDT, 2)}</div>` : ''}`;
      
      if (sym !== 'USDT') {
        card.onmouseenter = () => { card.style.transform = 'translateY(-2px)'; card.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)'; };
        card.onmouseleave = () => { card.style.transform = 'translateY(0)'; card.style.boxShadow = 'none'; };
        card.onclick = () => { renderTrade(sym + 'USDT'); };
      } else {
        card.onclick = () => openWallet(sym);
      }
      grid.appendChild(card);
    });

    // История транзакций (только пополнения и выводы) с пагинацией
    try{
      const history = await (await apiFetch('/api/history')).json();
      const historyList = document.getElementById('historyList');
      const transactions = (history || []).filter(h => h.type === 'deposit' || h.type === 'withdrawal');
      
      window._historyTransactions = transactions;
      window._historyPage = 1;
      window._historyPerPage = 10;
      renderHistoryPage(historyList, transactions, 1);
    }catch(e){ console.error('history failed',e); }

    document.getElementById('btnDeposit').onclick = openDeposit;
    document.getElementById('btnWithdraw').onclick = openWithdraw;
    document.getElementById('btnExchange').onclick = openExchange;
    document.getElementById('fabSupport').onclick = openSupport;
    
    // Animate balance on initial load
    if (!balanceAnimated && user.balance_usdt > 0) {
      const balanceEl = document.getElementById('balanceValue');
      if (balanceEl) {
        countUp(balanceEl, user.balance_usdt, 1000, 2);
        balanceAnimated = true;
      }
    }
  }catch(e){
    console.error('renderAssets crash', e);
    toast(t('common.assets_load_error'));
  }
}

// -------- Deposit ----------
async function openDeposit(){
  setActive('assets');
  const cont=document.getElementById('root');
  const userData = await (await apiFetch('/api/user')).json();
  
  // OxaPay coin list
  const oxaCoins = [
    { sym: 'USDT', name: 'Tether', networks: [{id:'TRC20',name:'Tron (TRC20)'},{id:'Ethereum',name:'Ethereum (ERC20)'},{id:'BSC',name:'BSC (BEP20)'},{id:'Polygon',name:'Polygon'},{id:'TON',name:'TON'}] },
    { sym: 'BTC', name: 'Bitcoin', networks: [{id:'Bitcoin',name:'Bitcoin'}] },
    { sym: 'ETH', name: 'Ethereum', networks: [{id:'Ethereum',name:'Ethereum'},{id:'Base',name:'Base'}] },
    { sym: 'BNB', name: 'BNB', networks: [{id:'BSC',name:'BSC (BEP20)'}] },
    { sym: 'SOL', name: 'Solana', networks: [{id:'Solana',name:'Solana'}] },
    { sym: 'TRX', name: 'Tron', networks: [{id:'TRC20',name:'Tron'}] },
    { sym: 'TON', name: 'Toncoin', networks: [{id:'TON',name:'TON'}] },
    { sym: 'LTC', name: 'Litecoin', networks: [{id:'Litecoin',name:'Litecoin'}] },
    { sym: 'DOGE', name: 'Dogecoin', networks: [{id:'Dogecoin',name:'Dogecoin'}] },
    { sym: 'XRP', name: 'Ripple', networks: [{id:'Ripple',name:'Ripple'}] },
    { sym: 'USDC', name: 'USD Coin', networks: [{id:'Ethereum',name:'Ethereum (ERC20)'},{id:'BSC',name:'BSC (BEP20)'},{id:'Polygon',name:'Polygon'}] },
    { sym: 'XMR', name: 'Monero', networks: [{id:'Monero',name:'Monero'}] },
  ];

  const xRocketCurrencies = ['USDT', 'TON', 'BTC', 'ETH', 'BNB', 'USDC', 'SOL', 'DOGE', 'LTC', 'TRX', 'NOT', 'DOGS'];

  showDepositMethodSelection();

  function showDepositMethodSelection() {
    const titleText = t('deposit.method_title');
    cont.innerHTML = `
    <div class="container" style="padding:16px">
      <button class="btn" id="backDeposit" style="background:transparent;border:none;color:#fff;font-size:16px;padding:8px 0;margin-bottom:16px">← ${t('btn.back')}</button>
      <div class="section-title" style="font-size:20px;font-weight:700;margin-bottom:20px">${titleText}</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <div id="methodXRocket" style="background:#131A2A;border-radius:6px;padding:18px 16px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;border:1px solid transparent;transition:all 0.2s">
          <div style="display:flex;align-items:center;gap:14px">
            <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#6C5CE7,#A29BFE);display:flex;align-items:center;justify-content:center;font-size:22px">🚀</div>
            <div>
              <div style="font-weight:600;font-size:16px;color:#fff">xRocket</div>
              <div style="font-size:12px;color:#7B8CA2">${t('deposit.method_xrocket')}</div>
            </div>
          </div>
          <span style="color:#7B8CA2;font-size:18px">›</span>
        </div>
        <div id="methodOxaPay" style="background:#131A2A;border-radius:6px;padding:18px 16px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;border:1px solid transparent;transition:all 0.2s">
          <div style="display:flex;align-items:center;gap:14px">
            <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#00E676,#0B8A5E);display:flex;align-items:center;justify-content:center;font-size:22px">💼</div>
            <div>
              <div style="font-weight:600;font-size:16px;color:#fff">${t('deposit.method_external_wallet')}</div>
              <div style="font-size:12px;color:#7B8CA2">${t('deposit.method_crypto')}</div>
            </div>
          </div>
          <span style="color:#7B8CA2;font-size:18px">›</span>
        </div>
      </div>
    </div>`;

    document.getElementById('backDeposit').onclick = renderAssets;

    const xr = document.getElementById('methodXRocket');
    const ox = document.getElementById('methodOxaPay');
    [xr, ox].forEach(el => {
      el.onmouseenter = () => { el.style.borderColor = '#E040FB'; el.style.background = '#252525'; };
      el.onmouseleave = () => { el.style.borderColor = 'transparent'; el.style.background = '#131A2A'; };
    });
    xr.onclick = () => showXRocketCurrencySelection();
    ox.onclick = () => showOxaPayCoinSelection();
  }

  function showXRocketCurrencySelection() {
    const titleText = t('deposit.select_currency');
    cont.innerHTML = `
    <div class="container" style="padding:16px">
      <button class="btn" id="backXR" style="background:transparent;border:none;color:#fff;font-size:16px;padding:8px 0;margin-bottom:16px">← ${t('btn.back')}</button>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px">
        <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#6C5CE7,#A29BFE);display:flex;align-items:center;justify-content:center;font-size:16px">🚀</div>
        <div class="section-title" style="font-size:20px;font-weight:700;margin:0">${titleText}</div>
      </div>
      <div id="xrCoinList" style="display:flex;flex-direction:column;gap:8px">
        ${xRocketCurrencies.map(sym => {
          const logo = cryptoLogos[sym] || '';
          const logoHTML = logo ? `<img src="${logo}" style="width:40px;height:40px;border-radius:50%" onerror="this.style.display='none'"/>` : `<div style="width:40px;height:40px;border-radius:50%;background:#333;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;color:#E040FB">${sym[0]}</div>`;
          return `<div class="xr-coin-card" data-sym="${sym}" style="background:#131A2A;border-radius:6px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;border:1px solid transparent;transition:all 0.2s">
            <div style="display:flex;align-items:center;gap:12px">
              ${logoHTML}
              <div style="font-weight:600;font-size:15px;color:#fff">${sym}</div>
            </div>
            <span style="color:#7B8CA2;font-size:18px">›</span>
          </div>`;
        }).join('')}
      </div>
    </div>`;

    document.getElementById('backXR').onclick = showDepositMethodSelection;

    document.querySelectorAll('.xr-coin-card').forEach(card => {
      card.onclick = () => showXRocketAmountInput(card.dataset.sym);
      card.onmouseenter = () => { card.style.borderColor = '#E040FB'; card.style.background = '#252525'; };
      card.onmouseleave = () => { card.style.borderColor = 'transparent'; card.style.background = '#131A2A'; };
    });
  }

  function showXRocketAmountInput(currency) {
    const minAmount = 1;
    const presets = [5, 10, 25, 50, 100, 250];
    const orText = t('deposit.or_custom');
    const logo = cryptoLogos[currency] || '';

    cont.innerHTML = `
    <div class="container" style="padding:16px">
      <button class="btn" id="backXRCur" style="background:transparent;border:none;color:#fff;font-size:16px;padding:8px 0;margin-bottom:16px">← ${t('btn.back')}</button>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:6px">
        ${logo ? `<img src="${logo}" style="width:32px;height:32px;border-radius:50%"/>` : ''}
        <div class="section-title" style="font-size:20px;font-weight:700;margin:0">${currency}</div>
        <span style="font-size:11px;color:#A29BFE;background:rgba(108,92,231,0.2);padding:4px 10px;border-radius:12px">xRocket</span>
      </div>
      <div style="color:#7B8CA2;font-size:13px;margin-bottom:20px">${t('deposit.enter_amount_in') + ' ' + currency}</div>

      <div style="background:#131A2A;border-radius:6px;padding:20px;margin-bottom:16px">
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px">
          ${presets.map(amt => `<button class="xr-preset-btn" data-amount="${amt}" style="padding:12px 0;background:#2A2A2A;border:1px solid #3A3A3A;border-radius:8px;color:#fff;font-size:16px;font-weight:700;cursor:pointer;transition:all 0.2s">${amt}</button>`).join('')}
        </div>
        <div style="text-align:center;color:#555;font-size:12px;margin-bottom:12px">— ${orText} —</div>
        <div style="display:flex;align-items:center;gap:12px">
          <input id="xrCustomAmount" type="number" inputmode="decimal" class="input" placeholder="${minAmount}" step="0.01" style="flex:1;font-size:24px;font-weight:700;background:transparent;border:none;color:#fff;text-align:right" value=""/>
          <span style="color:#7B8CA2;font-size:18px;font-weight:600">${currency}</span>
        </div>
        <div style="border-top:1px solid #333;padding-top:12px;margin-top:12px;display:flex;justify-content:space-between">
          <span style="color:#7B8CA2;font-size:12px">${t('deposit.fee_zero')}</span>
          <span style="color:#7B8CA2;font-size:12px">${t('deposit.min_short')}: ${minAmount} ${currency}</span>
        </div>
      </div>
      <button class="btn btn-primary fullwidth" id="xrSubmit" style="padding:16px;font-size:16px;font-weight:600;background:#E040FB;border-radius:6px">${t('deposit.continue')}</button>
    </div>`;

    document.getElementById('backXRCur').onclick = () => showXRocketCurrencySelection();

    const customInput = document.getElementById('xrCustomAmount');

    document.querySelectorAll('.xr-preset-btn').forEach(btn => {
      btn.onclick = () => {
        customInput.value = btn.dataset.amount;
        document.querySelectorAll('.xr-preset-btn').forEach(b => { b.style.borderColor = '#3A3A3A'; b.style.background = '#2A2A2A'; });
        btn.style.borderColor = '#E040FB'; btn.style.background = 'rgba(224,64,251,0.12)';
      };
      btn.onmouseenter = () => { if (btn.style.borderColor !== 'rgb(224, 64, 251)') btn.style.background = '#333'; };
      btn.onmouseleave = () => { if (btn.style.borderColor !== 'rgb(224, 64, 251)') btn.style.background = '#2A2A2A'; };
    });

    customInput.oninput = () => {
      const val = Number(customInput.value || 0);
      document.querySelectorAll('.xr-preset-btn').forEach(b => {
        if (Number(b.dataset.amount) === val) { b.style.borderColor = '#E040FB'; b.style.background = 'rgba(224,64,251,0.12)'; }
        else { b.style.borderColor = '#3A3A3A'; b.style.background = '#2A2A2A'; }
      });
    };

    document.getElementById('xrSubmit').onclick = async () => {
      const amount = Number(customInput.value || 0);
      if (!amount || amount < minAmount) { toast(`${t('deposit.min_amount_toast')}: ${minAmount} ${currency}`); return; }
      await createXRocketInvoice(amount, currency);
    };
  }

  async function createXRocketInvoice(amount, currency) {
    toast(t('deposit.creating_invoice'));
    try {
      const res = await apiFetch('/api/deposit/xrocket/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, currency })
      });
      const data = await res.json();

      if (data.ok) {
        showXRocketPaymentScreen(data);
      } else {
        toast(data.error || t('toast.error'));
      }
    } catch (e) {
      console.error('xRocket error', e);
      toast(t('toast.error'));
    }
  }

  function showXRocketPaymentScreen(payData) {
    const { invoice_id, bot_link, amount, currency, fee } = payData;
    const waitText = t('deposit.waiting');
    const descText = t('deposit.pay_via_xrocket');
    const amountLabel = t('history.amount');
    const methodLabel = t('history.method');
    const paidText = t('deposit.status_paid');
    const cancelText = t('btn.cancel');
    const payBtnText = t('deposit.pay_xrocket');

    cont.innerHTML = `
    <div class="container" style="padding:16px">
      <div style="text-align:center;padding:24px 0">
        <div id="xrPaySpinner" style="margin-bottom:16px">
          <div style="width:60px;height:60px;margin:0 auto;border:3px solid rgba(255,255,255,0.08);border-top-color:#A29BFE;border-radius:50%;animation:spin 1s linear infinite"></div>
        </div>
        <div id="xrPayIcon" style="display:none;font-size:56px;margin-bottom:16px">✅</div>
        <h2 id="xrPayTitle" style="color:#EAECEF;margin-bottom:6px;font-size:18px">${waitText}</h2>
        <p style="color:#7B8CA2;font-size:13px;margin-bottom:4px">${descText}</p>
      </div>

      <div style="background:#131A2A;border-radius:8px;padding:16px;margin-bottom:16px">
        <div style="display:flex;justify-content:space-between;margin-bottom:12px">
          <span style="color:#7B8CA2;font-size:13px">${amountLabel}</span>
          <span style="color:#00E676;font-size:16px;font-weight:700">${amount} ${currency}</span>
        </div>
        <div style="display:flex;justify-content:space-between">
          <span style="color:#7B8CA2;font-size:13px">${methodLabel}</span>
          <span style="color:#A29BFE;font-size:14px;font-weight:600">🚀 xRocket</span>
        </div>
      </div>

      <a href="${bot_link}" target="_blank" style="display:block;text-decoration:none;margin-bottom:12px">
        <button class="btn btn-primary fullwidth" style="padding:16px;font-size:16px;font-weight:600;background:linear-gradient(135deg,#6C5CE7,#A29BFE);border-radius:6px;width:100%;border:none;color:#fff;cursor:pointer">🚀 ${payBtnText}</button>
      </a>

      <div id="xrStatusBar" style="background:#131A2A;border-radius:8px;padding:12px 16px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center">
        <span style="color:#7B8CA2;font-size:13px">${t('profile.status')}</span>
        <span id="xrPayStatus" style="color:#E040FB;font-weight:600;font-size:13px">${t('deposit.status_waiting')}</span>
      </div>

      <button class="btn" id="xrCancelPay" style="width:100%;background:rgba(255,255,255,0.08);padding:14px;font-size:14px">${cancelText}</button>
    </div>
    <style>@keyframes spin { to { transform: rotate(360deg); } }</style>`;

    document.getElementById('xrCancelPay').onclick = () => { clearInterval(xrPollInterval); renderAssets(); };

    let xrPollCount = 0;
    const xrPollInterval = setInterval(async () => {
      xrPollCount++;
      if (xrPollCount > 720) { clearInterval(xrPollInterval); return; }
      try {
        const res = await apiFetch(`/api/deposit/xrocket/check?invoice_id=${invoice_id}`);
        const data = await res.json();
        if (data.paid) {
          clearInterval(xrPollInterval);
          document.getElementById('xrPaySpinner').style.display = 'none';
          document.getElementById('xrPayIcon').style.display = 'block';
          document.getElementById('xrPayTitle').textContent = paidText;
          document.getElementById('xrPayTitle').style.color = '#00E676';
          document.getElementById('xrPayStatus').textContent = paidText;
          document.getElementById('xrPayStatus').style.color = '#00E676';
          toast(t('deposit.credited_toast'));
          setTimeout(() => renderAssets(), 2500);
        } else if (data.status) {
          const sMap = { 'active': t('deposit.status_waiting'), 'expired': t('deposit.status_expired') };
          document.getElementById('xrPayStatus').textContent = sMap[data.status] || data.status;
        }
      } catch(e) { console.error('xRocket poll error', e); }
    }, 5000);
  }

  function showOxaPayCoinSelection() {
    const titleText = t('deposit.select_coin');

    cont.innerHTML = `
    <div class="container" style="padding:16px">
      <button class="btn" id="backMethod" style="background:transparent;border:none;color:#fff;font-size:16px;padding:8px 0;margin-bottom:16px">← ${t('btn.back')}</button>
      <div class="section-title" style="font-size:20px;font-weight:700;margin-bottom:20px">${titleText}</div>
      <div id="oxaCoinList" style="display:flex;flex-direction:column;gap:8px">
        ${oxaCoins.map(c => {
          const logo = cryptoLogos[c.sym] || '';
          const logoHTML = logo ? `<img src="${logo}" style="width:40px;height:40px;border-radius:50%" onerror="this.style.display='none'"/>` : `<div style="width:40px;height:40px;border-radius:50%;background:#333;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;color:#E040FB">${c.sym[0]}</div>`;
          return `<div class="oxa-coin-card" data-sym="${c.sym}" style="background:#131A2A;border-radius:6px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;border:1px solid transparent;transition:all 0.2s">
            <div style="display:flex;align-items:center;gap:12px">
              ${logoHTML}
              <div>
                <div style="font-weight:600;font-size:15px;color:#fff">${c.sym}</div>
                <div style="font-size:12px;color:#7B8CA2">${c.name}</div>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:6px">
              <span style="font-size:11px;color:#555">${c.networks.length > 1 ? c.networks.length + (' ' + t('deposit.networks_count')) : c.networks[0].name}</span>
              <span style="color:#7B8CA2;font-size:18px">›</span>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>`;

    document.getElementById('backMethod').onclick = showDepositMethodSelection;

    document.querySelectorAll('.oxa-coin-card').forEach(card => {
      const sym = card.dataset.sym;
      const coin = oxaCoins.find(c => c.sym === sym);
      card.onclick = () => {
        if (coin.networks.length === 1) {
          showOxaPayAmountInput(coin, coin.networks[0]);
        } else {
          showOxaPayNetworkSelection(coin);
        }
      };
      card.onmouseenter = () => { card.style.borderColor = '#E040FB'; card.style.background = '#252525'; };
      card.onmouseleave = () => { card.style.borderColor = 'transparent'; card.style.background = '#131A2A'; };
    });
  }

  function showOxaPayNetworkSelection(coin) {
    const titleText = t('deposit.select_network');
    const logo = cryptoLogos[coin.sym] || '';

    cont.innerHTML = `
    <div class="container" style="padding:16px">
      <button class="btn" id="backCoins" style="background:transparent;border:none;color:#fff;font-size:16px;padding:8px 0;margin-bottom:16px">← ${t('btn.back')}</button>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
        ${logo ? `<img src="${logo}" style="width:36px;height:36px;border-radius:50%"/>` : ''}
        <div class="section-title" style="font-size:20px;font-weight:700;margin:0">${coin.sym} — ${titleText}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${coin.networks.map(net => `<div class="oxa-net-card" data-net="${net.id}" style="background:#131A2A;border-radius:6px;padding:16px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;border:1px solid transparent;transition:all 0.2s">
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:36px;height:36px;border-radius:50%;background:#2A2A2A;display:flex;align-items:center;justify-content:center;font-size:14px;color:#E040FB;font-weight:700">⛓</div>
            <div style="font-weight:600;font-size:15px;color:#fff">${net.name}</div>
          </div>
          <div style="color:#7B8CA2;font-size:18px">›</div>
        </div>`).join('')}
      </div>
    </div>`;

    document.getElementById('backCoins').onclick = showOxaPayCoinSelection;

    document.querySelectorAll('.oxa-net-card').forEach(card => {
      const net = coin.networks.find(n => n.id === card.dataset.net);
      card.onclick = () => showOxaPayAmountInput(coin, net);
      card.onmouseenter = () => { card.style.borderColor = '#E040FB'; card.style.background = '#252525'; };
      card.onmouseleave = () => { card.style.borderColor = 'transparent'; card.style.background = '#131A2A'; };
    });
  }

  function showOxaPayAmountInput(coin, network) {
    const minAmount = 5;
    const presets = [10, 25, 50, 100, 250, 500];
    const orText = t('deposit.or_custom');
    const logo = cryptoLogos[coin.sym] || '';

    cont.innerHTML = `
    <div class="container" style="padding:16px">
      <button class="btn" id="backNet" style="background:transparent;border:none;color:#fff;font-size:16px;padding:8px 0;margin-bottom:16px">← ${t('btn.back')}</button>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:6px">
        ${logo ? `<img src="${logo}" style="width:32px;height:32px;border-radius:50%"/>` : ''}
        <div class="section-title" style="font-size:20px;font-weight:700;margin:0">${coin.sym}</div>
        <span style="font-size:13px;color:#7B8CA2;background:#2A2A2A;padding:4px 10px;border-radius:12px">${network.name}</span>
      </div>
      <div style="color:#7B8CA2;font-size:13px;margin-bottom:20px">${t('deposit.enter_amount_usd')}</div>

      <div style="background:#131A2A;border-radius:6px;padding:20px;margin-bottom:16px">
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px">
          ${presets.map(amt => `<button class="oxapay-preset-btn" data-amount="${amt}" style="padding:12px 0;background:#2A2A2A;border:1px solid #3A3A3A;border-radius:8px;color:#fff;font-size:16px;font-weight:700;cursor:pointer;transition:all 0.2s">${amt}$</button>`).join('')}
        </div>
        <div style="text-align:center;color:#555;font-size:12px;margin-bottom:12px">— ${orText} —</div>
        <div style="display:flex;align-items:center;gap:12px">
          <input id="oxaCustomAmount" type="number" inputmode="decimal" class="input" placeholder="${minAmount}" step="1" style="flex:1;font-size:24px;font-weight:700;background:transparent;border:none;color:#fff;text-align:right" value=""/>
          <span style="color:#7B8CA2;font-size:18px;font-weight:600">USD</span>
        </div>
        <div style="border-top:1px solid #333;padding-top:12px;margin-top:12px;display:flex;justify-content:space-between">
          <span style="color:#7B8CA2;font-size:12px">${t('deposit.fee_zero')}</span>
          <span style="color:#7B8CA2;font-size:12px">${t('deposit.min_short')}: ${minAmount}$</span>
        </div>
      </div>
      <button class="btn btn-primary fullwidth" id="oxaSubmit" style="padding:16px;font-size:16px;font-weight:600;background:#E040FB;border-radius:6px">${t('deposit.continue')}</button>
    </div>`;

    document.getElementById('backNet').onclick = () => {
      if (coin.networks.length === 1) showOxaPayCoinSelection();
      else showOxaPayNetworkSelection(coin);
    };

    const customInput = document.getElementById('oxaCustomAmount');

    document.querySelectorAll('.oxapay-preset-btn').forEach(btn => {
      btn.onclick = () => {
        customInput.value = btn.dataset.amount;
        document.querySelectorAll('.oxapay-preset-btn').forEach(b => { b.style.borderColor = '#3A3A3A'; b.style.background = '#2A2A2A'; });
        btn.style.borderColor = '#E040FB'; btn.style.background = 'rgba(224,64,251,0.12)';
      };
      btn.onmouseenter = () => { if (btn.style.borderColor !== 'rgb(224, 64, 251)') btn.style.background = '#333'; };
      btn.onmouseleave = () => { if (btn.style.borderColor !== 'rgb(224, 64, 251)') btn.style.background = '#2A2A2A'; };
    });

    customInput.oninput = () => {
      const val = Number(customInput.value || 0);
      document.querySelectorAll('.oxapay-preset-btn').forEach(b => {
        if (Number(b.dataset.amount) === val) { b.style.borderColor = '#E040FB'; b.style.background = 'rgba(224,64,251,0.12)'; }
        else { b.style.borderColor = '#3A3A3A'; b.style.background = '#2A2A2A'; }
      });
    };

    document.getElementById('oxaSubmit').onclick = async () => {
      const amount = Number(customInput.value || 0);
      if (!amount || amount < minAmount) { toast(`${t('deposit.min_amount')}: ${minAmount}$`); return; }
      await createOxaPayWhiteLabel(amount, coin.sym, network.id);
    };
  }

  async function createOxaPayWhiteLabel(amount, payCurrency, network) {
    toast(t('deposit.creating_invoice'));
    try {
      const res = await apiFetch('/api/deposit/oxapay/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, pay_currency: payCurrency, network })
      });
      const data = await res.json();

      if (data.ok) {
        showOxaPayPaymentScreen(data);
      } else {
        toast(data.error || t('toast.error'));
      }
    } catch (e) {
      console.error('OxaPay error', e);
      toast(t('toast.error'));
    }
  }

  function showOxaPayPaymentScreen(payData) {
    const { track_id, address, memo, pay_amount, pay_currency, network, qr_code, expired_at } = payData;
    const waitText = t('deposit.waiting');
    const sendText = t('deposit.send_exact');
    const amountLabel = t('history.amount');
    const networkLabel = t('history.network');
    const addressLabel = t('history.address');
    const memoLabel = 'Memo / Tag';
    const copiedText = t('deposit.copied');
    const cancelText = t('btn.cancel');
    const paidText = t('deposit.status_paid');
    const creditedText = t('deposit.credited');

    const memoSection = memo ? `
      <div style="margin-top:12px">
        <div style="font-size:12px;color:#7B8CA2;margin-bottom:6px">${memoLabel}</div>
        <div style="display:flex;align-items:center;gap:8px;background:#0A0E17;border-radius:6px;padding:10px 12px">
          <span id="memoText" style="flex:1;color:#E040FB;font-size:14px;font-weight:600;word-break:break-all">${memo}</span>
          <button id="copyMemo" style="background:#2A2A2A;border:1px solid #3A3A3A;border-radius:6px;padding:6px 12px;color:#fff;font-size:12px;cursor:pointer">📋</button>
        </div>
      </div>` : '';

    const timeLeft = expired_at ? Math.max(0, Math.floor((expired_at * 1000 - Date.now()) / 1000)) : 3600;

    cont.innerHTML = `
    <div class="container" style="padding:16px">
      <div style="text-align:center;padding:16px 0">
        <div id="paySpinner" style="margin-bottom:16px">
          <div style="width:60px;height:60px;margin:0 auto;border:3px solid rgba(255,255,255,0.08);border-top-color:#E040FB;border-radius:50%;animation:spin 1s linear infinite"></div>
        </div>
        <div id="payIcon" style="display:none;font-size:56px;margin-bottom:16px">✅</div>
        <h2 id="payTitle" style="color:#EAECEF;margin-bottom:6px;font-size:18px">${waitText}</h2>
        <p style="color:#7B8CA2;font-size:13px;margin-bottom:4px">${sendText}</p>
        <p id="payTimer" style="color:#E040FB;font-size:13px;font-weight:600"></p>
      </div>

      ${qr_code ? `<div style="text-align:center;margin-bottom:16px"><img src="${qr_code}" style="width:180px;height:180px;border-radius:8px;background:#fff;padding:8px" onerror="this.style.display='none'"/></div>` : ''}

      <div style="background:#131A2A;border-radius:8px;padding:16px;margin-bottom:16px">
        <div style="display:flex;justify-content:space-between;margin-bottom:12px">
          <span style="color:#7B8CA2;font-size:13px">${amountLabel}</span>
          <span style="color:#00E676;font-size:16px;font-weight:700">${pay_amount} ${pay_currency}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:12px">
          <span style="color:#7B8CA2;font-size:13px">${networkLabel}</span>
          <span style="color:#EAECEF;font-size:14px;font-weight:600">${network}</span>
        </div>

        <div>
          <div style="font-size:12px;color:#7B8CA2;margin-bottom:6px">${addressLabel}</div>
          <div style="display:flex;align-items:center;gap:8px;background:#0A0E17;border-radius:6px;padding:10px 12px">
            <span id="addrText" style="flex:1;color:#E040FB;font-size:13px;font-weight:600;word-break:break-all">${address}</span>
            <button id="copyAddr" style="background:#2A2A2A;border:1px solid #3A3A3A;border-radius:6px;padding:6px 12px;color:#fff;font-size:12px;cursor:pointer">📋</button>
          </div>
        </div>
        ${memoSection}
      </div>

      <div id="payStatusBar" style="background:#131A2A;border-radius:8px;padding:12px 16px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center">
        <span style="color:#7B8CA2;font-size:13px">${t('profile.status')}</span>
        <span id="payStatus" style="color:#E040FB;font-weight:600;font-size:13px">${t('deposit.status_waiting')}</span>
      </div>

      <button class="btn" id="cancelPay" style="width:100%;background:rgba(255,255,255,0.08);padding:14px;font-size:14px">${cancelText}</button>
    </div>
    <style>@keyframes spin { to { transform: rotate(360deg); } }</style>`;

    document.getElementById('copyAddr').onclick = () => {
      navigator.clipboard.writeText(address).then(() => toast(copiedText)).catch(() => {
        const ta = document.createElement('textarea'); ta.value = address; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); toast(copiedText);
      });
    };
    if (memo && document.getElementById('copyMemo')) {
      document.getElementById('copyMemo').onclick = () => {
        navigator.clipboard.writeText(memo).then(() => toast(copiedText)).catch(() => {
          const ta = document.createElement('textarea'); ta.value = memo; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); toast(copiedText);
        });
      };
    }

    let remaining = timeLeft;
    const timerInterval = setInterval(() => {
      remaining--;
      if (remaining <= 0) { clearInterval(timerInterval); document.getElementById('payTimer').textContent = t('deposit.time_expired'); return; }
      const m = Math.floor(remaining / 60); const s = remaining % 60;
      document.getElementById('payTimer').textContent = `⏳ ${m}:${s.toString().padStart(2,'0')}`;
    }, 1000);
    const m0 = Math.floor(remaining / 60); const s0 = remaining % 60;
    document.getElementById('payTimer').textContent = `⏳ ${m0}:${s0.toString().padStart(2,'0')}`;

    document.getElementById('cancelPay').onclick = () => { clearInterval(timerInterval); clearInterval(pollInterval); renderAssets(); };

    let pollCount = 0;
    const pollInterval = setInterval(async () => {
      pollCount++;
      if (pollCount > 720) { clearInterval(pollInterval); return; }
      try {
        const res = await apiFetch(`/api/deposit/oxapay/check?track_id=${track_id}`);
        const data = await res.json();
        if (data.paid) {
          clearInterval(pollInterval); clearInterval(timerInterval);
          document.getElementById('paySpinner').style.display = 'none';
          document.getElementById('payIcon').style.display = 'block';
          document.getElementById('payTitle').textContent = paidText;
          document.getElementById('payTitle').style.color = '#00E676';
          document.getElementById('payStatus').textContent = paidText;
          document.getElementById('payStatus').style.color = '#00E676';
          document.getElementById('payTimer').textContent = '';
          toast(t('deposit.credited_toast'));
          setTimeout(() => renderAssets(), 2500);
        } else if (data.status) {
          const sMap = { 'waiting': t('deposit.status_waiting'), 'new': t('deposit.status_waiting'), 'confirming': t('deposit.status_confirming'), 'expired': t('deposit.status_expired') };
          document.getElementById('payStatus').textContent = sMap[data.status] || data.status;
          if (data.status === 'expired') { clearInterval(pollInterval); clearInterval(timerInterval); document.getElementById('paySpinner').style.display = 'none'; }
        }
      } catch (e) { console.error('OxaPay poll error', e); }
    }, 5000);
  }

}

// -------- Withdraw ----------
async function openWithdraw(){
  setActive('assets');
  const cont=document.getElementById('root');
  
  let user = {};
  try {
    user = await (await apiFetch('/api/user')).json();
  } catch(e) { console.error('Failed to load user', e); }
  
  const totalBalance = user.balance_usdt || 0;
  const MIN_USDT = 10;
  const quickAmounts = [10, 25, 50, 100, 250, 500];
  
  const networks = [
    { id: 'TRC20', name: 'Tron (TRC20)', hint: 'T...' },
    { id: 'ERC20', name: 'Ethereum (ERC20)', hint: '0x...' },
    { id: 'BEP20', name: 'BSC (BEP20)', hint: '0x...' },
    { id: 'SOL', name: 'Solana', hint: '...' },
    { id: 'TON', name: 'TON', hint: 'UQ...' },
  ];
  
  cont.innerHTML = `
  <div class="container">
    <button class="btn" id="backAssets" style="background:transparent;border:none;color:#fff;font-size:16px;padding:8px 0;margin-bottom:16px">← ${t('btn.back')}</button>
    <div class="section" style="margin-top:10px">
      <div class="section-header"><div class="section-title">💸 ${t('withdraw.to_crypto')}</div></div>
      <div class="section-content">
        <div style="background:#131A2A;border-radius:6px;padding:14px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center">
          <span style="color:#7B8CA2">${t('common.balance')}:</span>
          <span style="color:#00E676;font-weight:700;font-size:18px">${fmtNum(totalBalance, 2)} USDT</span>
        </div>
        
        <label class="label">${t('withdraw.amount')} (USDT)</label>
        <input type="number" inputmode="decimal" id="wAmount" class="input" placeholder="${MIN_USDT}" min="${MIN_USDT}" step="0.01" style="font-size:18px;font-weight:600"/>
        
        <div id="quickAmounts" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px">
          ${quickAmounts.filter(a => a <= totalBalance).map(amt => `
            <button class="quick-btn" data-amount="${amt}" style="padding:10px 16px;background:#131A2A;border:1px solid #333;border-radius:6px;color:#fff;cursor:pointer;font-weight:600;transition:all 0.2s">${amt} USDT</button>
          `).join('')}
          <button class="quick-btn" data-amount="${Number(totalBalance).toFixed(2)}" style="padding:10px 16px;background:#131A2A;border:1px solid #333;border-radius:6px;color:#E040FB;cursor:pointer;font-weight:600;transition:all 0.2s">${t('btn.all')}</button>
        </div>
        
        <div class="notice small" style="margin-top:12px">💡 ${t('withdraw.min_withdrawal')}: ${MIN_USDT} USDT | ${t('withdraw.commission')}: 0%</div>
        
        <label class="label" style="margin-top:16px">${t('withdraw.network')}</label>
        <div id="networkSelect" style="display:flex;flex-wrap:wrap;gap:8px">
          ${networks.map((n, i) => `
            <button class="net-btn" data-network="${n.id}" style="padding:10px 14px;background:${i === 0 ? 'rgba(224,64,251,0.12)' : '#131A2A'};border:1px solid ${i === 0 ? '#E040FB' : '#333'};border-radius:6px;color:#fff;cursor:pointer;font-size:13px;font-weight:600;transition:all 0.2s">${n.name}</button>
          `).join('')}
        </div>
        
        <label class="label" style="margin-top:16px">${t('withdraw.address')}</label>
        <input type="text" id="wAddress" class="input" placeholder="${networks[0].hint}" style="font-family:monospace;font-size:14px"/>
        
        <button class="btn btn-primary fullwidth" id="wSubmit" style="margin-top:20px;padding:16px;font-size:16px;background:#E040FB;border-radius:6px" disabled>${t('withdraw.submit')}</button>
        <div class="small" id="wCalc" style="margin-top:8px;text-align:center"></div>
      </div>
    </div>
  </div>`;
  
  document.getElementById('backAssets').onclick = renderAssets;
  const amountEl=document.getElementById('wAmount');
  const addressEl=document.getElementById('wAddress');
  const btn=document.getElementById('wSubmit');
  const calcEl=document.getElementById('wCalc');
  let selectedNetwork = networks[0].id;
  
  document.querySelectorAll('.net-btn').forEach(nb => {
    nb.onclick = () => {
      selectedNetwork = nb.dataset.network;
      document.querySelectorAll('.net-btn').forEach(b => { b.style.borderColor = '#333'; b.style.background = '#131A2A'; });
      nb.style.borderColor = '#E040FB';
      nb.style.background = 'rgba(224,64,251,0.12)';
      const net = networks.find(n => n.id === selectedNetwork);
      if (net) addressEl.placeholder = net.hint;
      recalc();
    };
  });
  
  document.querySelectorAll('.quick-btn').forEach(qb => {
    qb.onclick = () => {
      amountEl.value = qb.dataset.amount;
      document.querySelectorAll('.quick-btn').forEach(b => { b.style.borderColor = '#333'; b.style.background = '#131A2A'; b.style.color = '#fff'; });
      qb.style.borderColor = '#E040FB';
      qb.style.background = 'rgba(224,64,251,0.12)';
      recalc();
    };
  });
  
  function recalc(){
    const a = Number(amountEl.value||0);
    const addr = (addressEl.value||'').trim();
    btn.disabled = !(a >= MIN_USDT && a <= totalBalance && addr.length >= 10);
    
    if(a > 0 && a < MIN_USDT){
      calcEl.innerHTML = `<span style="color:#FF5252;font-weight:bold;">❌ ${t('withdraw.min_error')}: ${MIN_USDT} USDT</span>`;
      amountEl.style.borderColor = '#FF5252';
    } else if(a > totalBalance){
      calcEl.innerHTML = `<span style="color:#FF5252;font-weight:bold;">❌ ${t('withdraw.insufficient')}</span>`;
      amountEl.style.borderColor = '#FF5252';
    } else if(a >= MIN_USDT){
      amountEl.style.borderColor = '#E040FB';
      calcEl.textContent = '';
    } else {
      amountEl.style.borderColor = '';
      calcEl.textContent = '';
    }
  }
  
  amountEl.oninput = recalc;
  addressEl.oninput = recalc;
  recalc();
  
  btn.onclick = async () => {
    const amount = Number(amountEl.value||0);
    const address = (addressEl.value||'').trim();
    
    if(address.length < 10) {
      toast(t('withdraw.invalid_address'));
      return;
    }
    
    const payload = { amount, currency: 'USDT', address, network: selectedNetwork };
    
    try{
      const res = await apiFetch('/api/withdraw',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      const data = await res.json();
      if(data.ok){ toast(t('withdraw.submitted')); renderAssets(); } else toast(data.error||t('toast.error'));
    }catch(e){ toast(t('toast.error')); }
  };
}

// -------- Exchange ----------
async function openExchange(){
  setActive('assets');
  const cont=document.getElementById('root');
  
  // Get user data and rates
  let user = { balance_usdt: 0, wallets: {} };
  await updateRates();
  try { 
    user = await (await apiFetch('/api/user')).json();
  } catch(e) {}
  
  const cryptoOptions = ['USDT','BTC','ETH','TON','SOL','BNB','XRP','DOGE','LTC','TRX'];
  const fromOptions = cryptoOptions.map(c => `<option value="${c}"${c === 'USDT' ? ' selected' : ''}>${c}</option>`).join('');
  const toOptions = cryptoOptions.filter(c => c !== 'USDT').map(c => `<option value="${c}"${c === 'BTC' ? ' selected' : ''}>${c}</option>`).join('');
  
  cont.innerHTML = `
  <div class="container">
    <button class="btn" id="backAssets" style="background:transparent;border:none;color:#fff;font-size:16px;padding:8px 0;margin-bottom:16px">← ${t('btn.back')}</button>
    <div class="section" style="margin-top:10px">
      <div class="section-header"><div class="section-title">🔄 ${t('exchange.title')}</div></div>
      <div class="section-content">
        <div style="background:rgba(224,64,251,0.08);border:1px solid rgba(224,64,251,0.15);border-radius:6px;padding:14px;margin-bottom:16px">
          <div style="font-size:12px;color:#9ca3af;margin-bottom:4px">${t('exchange.available_balance')}</div>
          <div id="exAvailBalance" style="font-size:20px;font-weight:700;color:#00E676">${fmtNum(user.balance_usdt||0, 2)} USDT</div>
        </div>
        
        <div class="inline" style="gap:8px;align-items:flex-end">
          <div style="flex:1">
            <label class="label">${t('exchange.give')}</label>
            <select id="exFrom" style="width:100%;padding:12px;border-radius:6px;border:1px solid #333;background:#131A2A;color:#fff;font-size:15px">${fromOptions}</select>
          </div>
          <button id="exSwap" style="padding:12px;background:#E040FB;border:none;border-radius:6px;color:#fff;font-size:18px;cursor:pointer;margin-bottom:0;min-width:48px" title="${t('exchange.swap')}">⇄</button>
          <div style="flex:1">
            <label class="label">${t('exchange.receive')}</label>
            <select id="exTo" style="width:100%;padding:12px;border-radius:6px;border:1px solid #333;background:#131A2A;color:#fff;font-size:15px">${toOptions}</select>
          </div>
        </div>
        
        <div style="margin-top:16px">
          <label class="label">${t('withdraw.amount')}</label>
          <div style="display:flex;gap:8px">
            <input type="number" inputmode="decimal" id="exAmount" class="input" placeholder="0.00" style="flex:1;font-size:18px"/>
            <button id="exMax" style="padding:10px 16px;background:rgba(224,64,251,0.12);border:1px solid rgba(224,64,251,0.3);border-radius:6px;color:#E040FB;font-weight:600;cursor:pointer">MAX</button>
          </div>
        </div>
        
        <div id="exQuote" style="min-height:24px;margin-top:12px;padding:14px;background:rgba(0,200,83,0.1);border-radius:6px;text-align:center;font-weight:600;color:#00E676;display:none"></div>
        
        <div id="exRateInfo" style="margin-top:12px;padding:10px;background:#131A2A;border-radius:6px;text-align:center;font-size:12px;color:#9ca3af">
          ${t('exchange.commission')}: 2%
        </div>
        
        <button class="btn btn-green fullwidth" id="exSubmit" style="margin-top:16px;padding:16px;font-size:16px;border-radius:6px">${t('exchange.submit')}</button>
      </div>
    </div>
  </div>`;
  
  document.getElementById('backAssets').onclick = renderAssets;
  const fromEl=document.getElementById('exFrom'), toEl=document.getElementById('exTo'), amtEl=document.getElementById('exAmount'), qEl=document.getElementById('exQuote');
  const balEl=document.getElementById('exAvailBalance');
  
  function updateBalance() {
    const sym = fromEl.value;
    let bal, decimals, suffix;
    if (sym === 'USDT') {
      bal = user.balance_usdt || 0;
      decimals = 2;
      suffix = 'USDT';
    } else {
      bal = user.wallets?.[sym] || 0;
      decimals = 6;
      suffix = sym;
    }
    balEl.textContent = `${fmtNum(bal||0, decimals)} ${suffix}`;
  }
  
  function updateToOptions() {
    const fromVal = fromEl.value;
    const currentTo = toEl.value;
    let newToVal = currentTo;
    if (fromVal === currentTo) {
      newToVal = fromVal === 'USDT' ? 'BTC' : 'USDT';
    }
    const availableOptions = cryptoOptions.filter(c => c !== fromVal);
    toEl.innerHTML = availableOptions
      .map(c => `<option value="${c}"${c === newToVal ? ' selected' : ''}>${c}</option>`)
      .join('');
  }
  
  document.getElementById('exSwap').onclick = () => {
    const fromVal = fromEl.value;
    const toVal = toEl.value;
    fromEl.innerHTML = cryptoOptions
      .map(c => `<option value="${c}"${c === toVal ? ' selected' : ''}>${c}</option>`)
      .join('');
    updateToOptions();
    toEl.value = fromVal;
    updateBalance();
    amtEl.value = '';
    qEl.style.display = 'none';
  };
  
  document.getElementById('exMax').onclick = () => {
    const sym = fromEl.value;
    let bal;
    if (sym === 'USDT') bal = user.balance_usdt || 0;
    else bal = user.wallets?.[sym] || 0;
    amtEl.value = Number(bal||0).toFixed(sym === 'USDT' ? 2 : 6);
    quote();
  };
  
  updateToOptions();
  updateBalance();
  
  function validateSame(){ 
    if(fromEl.value===toEl.value){ 
      qEl.textContent=t('exchange.same_currency'); 
      qEl.style.display='block';
      qEl.style.background='rgba(239,68,68,0.1)';
      qEl.style.color='#ef4444';
      return false;
    } 
    qEl.style.display='none';
    return true; 
  }
  fromEl.onchange = () => { updateToOptions(); updateBalance(); validateSame(); quote(); };
  toEl.onchange = () => { validateSame(); quote(); };
  let lastQuote = null;
  
  async function quote(){
    if(!validateSame()) return;
    const a=Number(amtEl.value||0); 
    if(a<=0){ 
      qEl.style.display='none'; 
      lastQuote=null; 
      return; 
    }
    try{
      let r;
      r = await (await apiFetch(`/api/exchange/quote?from=${fromEl.value}&to=${toEl.value}&amount=${a}`)).json();
      lastQuote = r;
      const toSym = toEl.value;
      const toDecimals = toSym === 'USDT' ? 2 : 6;
      const toSuffix = toSym;
      qEl.innerHTML = `${t('exchange.you_receive_short')}: <span style="font-size:18px;font-weight:700">${fmtNum(r.amount_to||0, toDecimals)} ${toSuffix}</span>`;
      qEl.style.display='block';
      qEl.style.background='rgba(0,200,83,0.1)';
      qEl.style.color='#00E676';
    }catch(e){ 
      qEl.style.display='none'; 
      lastQuote=null; 
    }
  }
  amtEl.oninput=quote;
  document.getElementById('exSubmit').onclick = async ()=>{
    if(!validateSame()) return;
    const amount = Number(amtEl.value||0);
    if(amount <= 0) { toast(t('exchange.enter_amount')); return; }
    
    try{
      let res, data;
      const payload = {
        from: fromEl.value,
        to: toEl.value,
        amount: amount,
        expected_amount_to: lastQuote?.amount_to
      };
      res = await apiFetch('/api/exchange',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)});
      data = await res.json();
      if(data.ok){ 
        toast('✅ ' + t('exchange.completed')); 
        lastQuote = null;
        renderAssets(); 
      } else {
        toast(data.error||t('toast.error'));
        if(data.error && data.error.includes(t('exchange.rate_changed'))){
          setTimeout(() => quote(), 500);
        }
      }
    }catch(e){ 
      console.error('Exchange error:', e);
      toast(t('toast.error')); 
    }
  };
}

// -------- Wallet detail ----------
async function openWallet(sym){
  const cont=document.getElementById('root');
  const user = await (await apiFetch('/api/user')).json();
  const bal = user.wallets?.[sym] ?? (sym==='USDT'? user.balance_usdt: 0);
  cont.innerHTML = `
  <div class="container">
    <button class="btn" id="backAssets">${'← ' + t('btn.back')}</button>
    <div class="balance-card" style="margin-top:10px">
      <div class="small">${sym} ${t('common.balance')}</div>
      <div class="balance-amount">${fmtNum(bal||0, 6)} <span class="currency">${sym}</span></div>
      <div class="balance-actions">
        <button class="btn btn-primary" id="wDep">${t('btn.deposit')}</button>
        <button class="btn btn-green" id="wEx">${t('btn.exchange')}</button>
      </div>
    </div>
    <div class="section">
      <div class="section-header" id="whToggle"><div class="section-title">${t('history.title')} (${sym})</div></div>
      <div class="section-content hidden" id="walletHist"></div>
    </div>
  </div>`;
  document.getElementById('backAssets').onclick = renderAssets;
  document.getElementById('wDep').onclick = openDeposit;
  document.getElementById('wEx').onclick = openExchange;
  document.getElementById('whToggle').onclick = ()=> document.getElementById('walletHist').classList.toggle('hidden');
  
  const h = await (await apiFetch('/api/history?symbol='+encodeURIComponent(sym))).json();
  const wrap = document.getElementById('walletHist'); const ul=document.createElement('div');
  (h||[]).forEach(x=>{ const row=document.createElement('div'); row.className='small'; row.textContent = `${x.type} • ${x.amount} ${x.currency} • ${new Date(x.created_at).toLocaleString()}`; ul.appendChild(row); });
  wrap.appendChild(ul);
}

// -------- Trade ----------
// Crypto logos mapping (using cryptocurrency-icons CDN)
const cryptoLogos = {
  'USDT': 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
  'BTC': 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
  'ETH': 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  'TON': 'https://assets.coingecko.com/coins/images/17980/small/ton_symbol.png',
  'SOL': 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
  'BNB': 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
  'XRP': 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
  'DOGE': 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png',
  'LTC': 'https://assets.coingecko.com/coins/images/2/small/litecoin.png',
  'TRX': 'https://assets.coingecko.com/coins/images/1094/small/tron-logo.png',
  'ADA': 'https://assets.coingecko.com/coins/images/975/small/cardano.png',
  'DOT': 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png',
  'LINK': 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png',
  'MATIC': 'https://assets.coingecko.com/coins/images/4713/small/polygon.png',
  'AVAX': 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png',
  'SHIB': 'https://assets.coingecko.com/coins/images/11939/small/shiba.png',
  'UNI': 'https://assets.coingecko.com/coins/images/12504/small/uni.png',
  'BCH': 'https://assets.coingecko.com/coins/images/780/small/bitcoin-cash-circle.png',
  'USDC': 'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
  'NOT': 'https://assets.coingecko.com/coins/images/36045/small/notcoin.png',
  'DOGS': 'https://assets.coingecko.com/coins/images/39585/small/DOGS.png'
};

async function renderTrade(){
  restoreHeader(); // Restore original header
  setActive('trade');
  const cont=document.getElementById('root');
  cont.innerHTML = `
  <div class="container">
    <div class="section">
      <div class="section-header"><div class="section-title" id="pairsTitle">📊 ${t('trade.pairs_title')}</div></div>
      <div class="section-content" id="pairList"></div>
    </div>
  </div>`;
  const pairs=["BTC/USDT","ETH/USDT","SOL/USDT","ADA/USDT","DOT/USDT","LINK/USDT","MATIC/USDT","AVAX/USDT","XRP/USDT","DOGE/USDT","SHIB/USDT","UNI/USDT","LTC/USDT","BCH/USDT","TRX/USDT"];
  const wrap=document.getElementById('pairList');
  
  // Fetch tickers with prices and 24h change
  let tickers = {};
  try {
    const res = await apiFetch('/api/tickers');
    if (res.ok) {
      tickers = await res.json();
    }
  } catch (e) {}
  
  // Full crypto names
  const cryptoNames = {
    'BTC': 'Bitcoin', 'ETH': 'Ethereum', 'SOL': 'Solana', 'ADA': 'Cardano',
    'DOT': 'Polkadot', 'LINK': 'Chainlink', 'MATIC': 'Polygon', 'AVAX': 'Avalanche',
    'XRP': 'Ripple', 'DOGE': 'Dogecoin', 'SHIB': 'Shiba Inu', 'UNI': 'Uniswap',
    'LTC': 'Litecoin', 'BCH': 'Bitcoin Cash', 'TRX': 'Tron'
  };
  
  pairs.forEach(p => {
    const symbol = p.split('/')[0];
    const logo = cryptoLogos[symbol] || '';
    const name = cryptoNames[symbol] || symbol;
    const ticker = tickers[symbol] || { price: 0, change_24h: 0 };
    const price = ticker.price || 0;
    const change = ticker.change_24h || 0;
    const changeColor = change >= 0 ? '#00E676' : '#FF5252';
    const changeSign = change >= 0 ? '+' : '';
    const priceFormatted = price >= 1 ? price.toFixed(2) : price.toFixed(price < 0.001 ? 6 : 4);
    
    const card = document.createElement('div');
    card.className = 'trade-pair-row';
    card.setAttribute('data-pair', p);
    card.style.cssText = 'display:flex;align-items:center;padding:16px;margin:16px 0;border:1px solid rgba(100,116,139,0.4);border-radius:6px;background:rgba(15,23,42,0.3);cursor:pointer;transition:all 0.2s';
    card.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;flex:1">
        <img src="${logo}" alt="${symbol}" style="width:38px;height:38px;border-radius:50%;background:#131A2A;padding:2px;border:1px solid rgba(224,64,251,0.15)" onerror="this.style.display='none'">
        <div style="flex:1">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font-weight:600;font-size:14px;color:#fff">${symbol}/USDT</span>
            <span style="font-weight:600;font-size:14px;color:#fff">${priceFormatted}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:2px">
            <span style="font-size:11px;color:#7B8CA2">${name}</span>
            <span style="font-size:12px;color:${changeColor};font-weight:500">${changeSign}${fmtNum(change, 2)}%</span>
          </div>
        </div>
      </div>
    `;
    wrap.appendChild(card);
  });
  
  // Add click handlers
  document.querySelectorAll('.trade-pair-row').forEach(row => {
    row.onclick = () => {
      const pair = row.getAttribute('data-pair');
      if (pair) openPair(pair);
    };
  });
}

async function openPair(pair, displayName = null){
  setActive('trade');
  const cont=document.getElementById('root');
  const title = displayName || pair;
  const symbol = pair.split('/')[0];
  const logo = cryptoLogos[symbol] || '';
  
  // Модифицируем верхний header
  const headerBrand = document.querySelector('.header .brand');
  const headerActions = document.querySelector('.header .actions');
  
  headerBrand.innerHTML = `<button class="btn" id="backTrade" style="background:transparent;border:none;color:#fff;font-size:20px;padding:5px 10px">←</button>`;
  headerActions.innerHTML = `<span style="color:#fff;font-weight:600;font-size:15px;padding:6px 14px;border:1px solid #E040FB;border-radius:6px;background:rgba(224,64,251,0.08)">${title}</span>`;
  
  cont.innerHTML = `
  <div class="container" style="padding:0;height:calc(100vh - 56px);overflow-y:auto;overflow-x:hidden">
    <!-- Кнопки таймфреймов -->
    <div id="timeframeBar" style="display:flex;gap:4px;padding:8px 10px;background:#0e1219;border-bottom:1px solid #1f2937;overflow-x:auto;scrollbar-width:none;-ms-overflow-style:none">
      <button class="tf-btn" data-tf="1" style="padding:6px 12px;background:#1f2937;border:none;border-radius:4px;color:#9ca3af;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;transition:all 0.2s">${t('trade.duration.1m')}</button>
      <button class="tf-btn active" data-tf="5" style="padding:6px 12px;background:#8b5cf6;border:none;border-radius:4px;color:#fff;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;transition:all 0.2s">${t('trade.duration.5m')}</button>
      <button class="tf-btn" data-tf="15" style="padding:6px 12px;background:#1f2937;border:none;border-radius:4px;color:#9ca3af;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;transition:all 0.2s">${t('trade.duration.15m')}</button>
      <button class="tf-btn" data-tf="30" style="padding:6px 12px;background:#1f2937;border:none;border-radius:4px;color:#9ca3af;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;transition:all 0.2s">${t('trade.duration.30m')}</button>
      <button class="tf-btn" data-tf="60" style="padding:6px 12px;background:#1f2937;border:none;border-radius:4px;color:#9ca3af;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;transition:all 0.2s">${t('trade.duration.1h')}</button>
      <button class="tf-btn" data-tf="240" style="padding:6px 12px;background:#1f2937;border:none;border-radius:4px;color:#9ca3af;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;transition:all 0.2s">${t('trade.duration.4h')}</button>
      <button class="tf-btn" data-tf="1440" style="padding:6px 12px;background:#1f2937;border:none;border-radius:4px;color:#9ca3af;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;transition:all 0.2s">${t('trade.duration.1d')}</button>
    </div>
    
    <!-- TradingView Lightweight Chart (OKX Data) -->
    <div id="price_chart" style="height:30vh;min-height:160px;max-height:280px;width:100%;background:#0e1219;position:relative"></div>
    
    <!-- Trade Parameters Block -->
    <div id="tradeParamsBlock" style="padding:8px 12px;background:#0e1219;border-top:1px solid #1f2937">
      <!-- Amount + Timer Row (compact) -->
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <div style="flex:1;display:flex;align-items:center;background:#1f2937;border-radius:6px;padding:4px 8px">
          <input type="number" id="quickAmount" value="100" min="5" step="10" 
            style="flex:1;background:transparent;border:none;color:#E040FB;font-size:15px;font-weight:700;font-family:monospace;outline:none;width:50px" />
          <span style="color:#7B8CA2;font-size:11px;font-weight:600">USDT</span>
        </div>
        <div style="display:flex;gap:3px;overflow-x:auto;scrollbar-width:none">
          <button class="timer-btn" data-dur="30" style="padding:5px 8px;background:#1f2937;border:1px solid transparent;border-radius:4px;color:#9ca3af;font-size:10px;font-weight:600;cursor:pointer;white-space:nowrap;transition:all 0.2s;font-family:monospace">${t('trade.duration.30s')}</button>
          <button class="timer-btn active" data-dur="60" style="padding:5px 8px;background:#E040FB;border:1px solid #E040FB;border-radius:4px;color:#0A0E17;font-size:10px;font-weight:600;cursor:pointer;white-space:nowrap;transition:all 0.2s;font-family:monospace">${t('trade.duration.1m')}</button>
          <button class="timer-btn" data-dur="300" style="padding:5px 8px;background:#1f2937;border:1px solid transparent;border-radius:4px;color:#9ca3af;font-size:10px;font-weight:600;cursor:pointer;white-space:nowrap;transition:all 0.2s;font-family:monospace">${t('trade.duration.5m')}</button>
          <button class="timer-btn" data-dur="900" style="padding:5px 8px;background:#1f2937;border:1px solid transparent;border-radius:4px;color:#9ca3af;font-size:10px;font-weight:600;cursor:pointer;white-space:nowrap;transition:all 0.2s;font-family:monospace">${t('trade.duration.15m')}</button>
          <button class="timer-btn" data-dur="1800" style="padding:5px 8px;background:#1f2937;border:1px solid transparent;border-radius:4px;color:#9ca3af;font-size:10px;font-weight:600;cursor:pointer;white-space:nowrap;transition:all 0.2s;font-family:monospace">${t('trade.duration.30m')}</button>
        </div>
      </div>
      
      <!-- Potential Profit Display -->
      <div id="profitPreview" style="text-align:center;padding:5px 8px;background:rgba(14,203,129,0.1);border:1px solid rgba(14,203,129,0.3);border-radius:6px;font-size:12px">
        <span style="color:#7B8CA2">${t('trade.stake_label')} </span>
        <span id="stakeDisplay" style="color:#E040FB;font-weight:700;font-family:monospace">100 USDT</span>
        <span style="color:#7B8CA2"> → </span>
        <span style="color:#00E676;font-weight:700">${t('trade.potential_profit')} </span>
        <span id="profitDisplay" style="color:#00E676;font-weight:700;font-family:monospace">+70 USDT</span>
      </div>
    </div>
    
    <!-- Список сделок -->
    <div style="padding:0 12px 80px;margin-top:12px">
      <div style="font-weight:600;font-size:14px;color:#fff;margin-bottom:8px">${t('trade.list.title')}</div>
      <div style="display:flex;gap:12px;margin-bottom:8px;border-bottom:1px solid #1f1f1f">
        <div class="trade-tab active" data-filter="active" style="padding:6px 0;color:#E040FB;font-weight:600;border-bottom:2px solid #E040FB;cursor:pointer;font-size:13px">${t('trade.list.active')}</div>
        <div class="trade-tab" data-filter="closed" style="padding:6px 0;color:#9ca3af;font-weight:600;cursor:pointer;font-size:13px">${t('trade.list.closed')}</div>
        <div class="trade-tab" data-filter="all" style="padding:6px 0;color:#9ca3af;font-weight:600;cursor:pointer;font-size:13px">${t('trade.list.all')}</div>
      </div>
      <div id="tradesList" style="max-height:30vh;overflow-y:auto;overflow-x:hidden"></div>
    </div>
  </div>
  
  <!-- Модальное окно для ввода суммы и длительности -->
  <div id="tradeModal" style="display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.85);z-index:9999;animation:fadeIn 0.3s">
    <div style="position:absolute;bottom:0;left:0;right:0;display:flex;flex-direction:column;max-height:90vh">
      <div id="modalContent" style="background:#1a1a1a;border-radius:16px 16px 0 0;padding:20px 20px 10px;animation:slideUp 0.3s;overflow-y:auto;flex:1">
        <div style="text-align:center;margin-bottom:15px">
          <div style="font-size:13px;color:#9ca3af;margin-bottom:4px" id="modalSubtitle">${t('trade.modal.buying')}</div>
          <div style="font-size:26px;font-weight:700;color:#fff" id="modalTitle">BTC</div>
        </div>
        <div style="margin-bottom:12px">
          <input type="number" id="modalAmount" placeholder="0" min="5" step="1" 
            style="width:100%;padding:0;background:transparent;border:none;color:#8b5cf6;font-size:40px;font-weight:700;text-align:center;outline:none" 
            value="0"/>
          <div style="text-align:center;font-size:16px;color:#fff;margin-top:2px">${t('common.usdt')}</div>
        </div>
        <div style="text-align:center;margin-bottom:15px">
          <span style="color:#9ca3af;font-size:13px">${t('trade.modal.available')}: </span>
          <span style="color:#fff;font-weight:600;font-size:13px" id="modalBalance">0 ${t('common.usdt')}</span>
        </div>
        <div style="margin-bottom:10px">
          <div style="color:#9ca3af;font-size:12px;margin-bottom:8px">${t('trade.modal.duration')}</div>
          <div id="modalDurationChips" style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center">
            <div class="chip" data-dur="30" style="padding:10px 16px;font-size:14px">${t('trade.duration.30s')}</div>
            <div class="chip active" data-dur="60" style="padding:10px 16px;font-size:14px">${t('trade.duration.1m')}</div>
            <div class="chip" data-dur="300" style="padding:10px 16px;font-size:14px">${t('trade.duration.5m')}</div>
            <div class="chip" data-dur="900" style="padding:10px 16px;font-size:14px">${t('trade.duration.15m')}</div>
            <div class="chip" data-dur="1800" style="padding:10px 16px;font-size:14px">${t('trade.duration.30m')}</div>
            <div class="chip" data-dur="3600" style="padding:10px 16px;font-size:14px">${t('trade.duration.1h')}</div>
          </div>
        </div>
      </div>
      <div style="background:#1a1a1a;padding:10px 20px 20px;display:flex;flex-direction:column;gap:8px;padding-bottom:calc(20px + env(safe-area-inset-bottom, 0px))">
        <button id="modalConfirm" style="width:100%;padding:14px;background:#E040FB;color:#fff;border:none;border-radius:8px;font-size:16px;font-weight:600;cursor:pointer">${t('trade.buy')}</button>
        <button id="modalBack" style="width:100%;padding:12px;background:#2a2a2a;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer">${t('btn.back')}</button>
      </div>
    </div>
  </div>
  
  <style>
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideUp {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }
    @keyframes pulse-green {
      0%, 100% { box-shadow: 0 0 0 0 rgba(14, 203, 129, 0.7); }
      50% { box-shadow: 0 0 0 8px rgba(14, 203, 129, 0); }
    }
    @keyframes pulse-red {
      0%, 100% { box-shadow: 0 0 0 0 rgba(246, 70, 93, 0.7); }
      50% { box-shadow: 0 0 0 8px rgba(246, 70, 93, 0); }
    }
    .timer-btn:hover { border-color: #E040FB !important; }
  </style>
  `;
  
  // Create fixed trade buttons in body (outside overflow containers)
  let tradeFixedEl = document.getElementById('tradeButtonsFixed');
  if (tradeFixedEl) tradeFixedEl.remove();
  tradeFixedEl = document.createElement('div');
  tradeFixedEl.id = 'tradeButtonsFixed';
  tradeFixedEl.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);width:calc(100% - 24px);max-width:460px;padding:10px 0;display:flex;gap:10px;z-index:200;';
  tradeFixedEl.innerHTML = `
    <button class="btn btn-green" id="btnBuy" style="flex:1;font-size:15px;font-weight:700;padding:14px;border-radius:10px;box-shadow:0 4px 12px rgba(0,230,118,0.4);background:#00E676;color:#0A0E17;font-family:monospace;border:none;cursor:pointer">
      <span id="btnBuyText">${t('trade.buy')}</span>
      <span id="btnBuyTimer" style="display:none;margin-left:4px"></span>
    </button>
    <button class="btn btn-red" id="btnSell" style="flex:1;font-size:15px;font-weight:700;padding:14px;border-radius:10px;box-shadow:0 4px 12px rgba(255,82,82,0.4);background:#FF5252;color:#fff;font-family:monospace;border:none;cursor:pointer">
      <span id="btnSellText">${t('trade.sell')}</span>
      <span id="btnSellTimer" style="display:none;margin-left:4px"></span>
    </button>
  `;
  document.body.appendChild(tradeFixedEl);

  // Обработчик кнопки назад
  document.getElementById('backTrade').onclick = () => {
    const el = document.getElementById('tradeButtonsFixed');
    if (el) el.remove();
    renderTrade();
  };
  
  const sym=pair.replace('/','');
  
  // Timeframe mapping: minutes → string format
  const tfMap = {
    1: '1m',
    2: '2m',
    5: '5m',
    10: '10m',
    15: '15m',
    30: '30m',
    60: '1h',
    240: '4h',
    1440: '1d'
  };
  
  // Timeframe state (candle interval in minutes)
  let selectedTimeframe = 5; // Default: 5 minutes
  
  // Duration state (trade duration)
  let selectedDuration = 60;
  let selectedSide = 'buy';
  
  // Modal elements
  const tradeModal = document.getElementById('tradeModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalSubtitle = document.getElementById('modalSubtitle');
  const modalAmount = document.getElementById('modalAmount');
  const modalBalance = document.getElementById('modalBalance');
  const modalConfirm = document.getElementById('modalConfirm');
  const modalBack = document.getElementById('modalBack');
  
  // Load user balance
  async function loadUserBalance() {
    try {
      const res = await apiFetch('/api/user');
      const user = await res.json();
      modalBalance.textContent = `${fmtNum(user.balance_usdt || 0, 2)} ${t('common.usdt')}`;
    } catch (e) {
      console.error('Failed to load balance:', e);
    }
  }
  
  // Open modal
  function openTradeModal(side) {
    selectedSide = side;
    const coinName = pair.split('/')[0];
    
    if (side === 'buy') {
      modalSubtitle.textContent = t('trade.modal.buying');
      modalTitle.textContent = coinName;
      modalConfirm.textContent = t('trade.buy');
      modalConfirm.style.background = '#00E676';
    } else {
      modalSubtitle.textContent = t('trade.modal.selling');
      modalTitle.textContent = coinName;
      modalConfirm.textContent = t('trade.sell');
      modalConfirm.style.background = '#FF5252';
    }
    
    // Use amount from quick input
    const quickAmt = document.getElementById('quickAmount');
    modalAmount.value = quickAmt ? quickAmt.value : '100';
    
    loadUserBalance();
    tradeModal.style.display = 'block';
    const tf = document.getElementById('tradeButtonsFixed');
    if(tf) tf.style.display = 'none';
    const nb = document.querySelector('.navbar');
    if(nb) nb.style.display = 'none';
    
    // Focus on amount input
    setTimeout(() => modalAmount.focus(), 300);
  }
  
  // Close modal
  function closeTradeModal() {
    tradeModal.style.display = 'none';
    const tf = document.getElementById('tradeButtonsFixed');
    if(tf) tf.style.display = 'flex';
    const nb = document.querySelector('.navbar');
    if(nb) nb.style.display = '';
  }
  
  // Modal duration chips logic
  document.querySelectorAll('#modalDurationChips .chip').forEach(chip => {
    chip.onclick = () => {
      document.querySelectorAll('#modalDurationChips .chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      selectedDuration = parseInt(chip.getAttribute('data-dur'));
    };
  });
  
  // Timer buttons logic (quick selection above BUY/SELL)
  const timerBtns = document.querySelectorAll('.timer-btn');
  timerBtns.forEach(btn => {
    btn.onclick = () => {
      timerBtns.forEach(b => {
        b.style.background = '#1f2937';
        b.style.border = '1px solid transparent';
        b.style.color = '#9ca3af';
        b.classList.remove('active');
      });
      btn.style.background = '#E040FB';
      btn.style.border = '1px solid #E040FB';
      btn.style.color = '#0A0E17';
      btn.classList.add('active');
      selectedDuration = parseInt(btn.getAttribute('data-dur'));
      
      // Sync with modal chips
      document.querySelectorAll('#modalDurationChips .chip').forEach(c => {
        c.classList.remove('active');
        if (parseInt(c.getAttribute('data-dur')) === selectedDuration) {
          c.classList.add('active');
        }
      });
    };
  });
  
  // Quick amount input and profit calculation
  const quickAmountInput = document.getElementById('quickAmount');
  const stakeDisplay = document.getElementById('stakeDisplay');
  const profitDisplay = document.getElementById('profitDisplay');
  const PAYOUT_RATE = 0.70; // 70% payout
  
  function updateProfitDisplay() {
    const amount = parseFloat(quickAmountInput.value) || 0;
    stakeDisplay.textContent = fmtNum(amount, 0) + ' USDT';
    const profit = amount * PAYOUT_RATE;
    profitDisplay.textContent = '+' + fmtNum(profit, 2) + ' USDT';
  }
  
  quickAmountInput.oninput = updateProfitDisplay;
  quickAmountInput.onchange = updateProfitDisplay;
  
  // Track active trades for this pair to update buttons
  let activeTradeForPair = null;
  let buttonTimerInterval = null;
  
  // Update BUY/SELL buttons based on active trades
  async function updateButtonsWithActiveTrades() {
    try {
      const res = await apiFetch('/api/trade/active');
      if (!res.ok) return;
      const tradesData = await res.json();
      const activeTrades = Array.isArray(tradesData) ? tradesData : (tradesData.trades || []);
      
      // Find active trade for current pair
      const pairNormalized = pair.replace('-', '').replace('/', '');
      const tradeForPair = activeTrades.find(t => 
        t.pair.replace('-', '').replace('/', '') === pairNormalized && 
        (t.is_active || t.status === 'active')
      );
      
      const btnBuy = document.getElementById('btnBuy');
      const btnSell = document.getElementById('btnSell');
      const btnBuyText = document.getElementById('btnBuyText');
      const btnSellText = document.getElementById('btnSellText');
      const btnBuyTimer = document.getElementById('btnBuyTimer');
      const btnSellTimer = document.getElementById('btnSellTimer');
      
      if (!btnBuy || !btnSell) return;
      
      if (tradeForPair) {
        activeTradeForPair = tradeForPair;
        const timeLeft = tradeForPair.time_left_sec || 0;
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        const timerText = `(${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')})`;
        
        if (tradeForPair.side === 'buy') {
          btnBuyText.textContent = t('trade.buy');
          btnBuyTimer.textContent = timerText;
          btnBuyTimer.style.display = 'inline';
          btnBuy.style.background = 'linear-gradient(135deg, #00E676, #0BA069)';
          btnBuy.style.animation = 'pulse-green 1.5s infinite';
          
          btnSellText.textContent = t('trade.sell');
          btnSellTimer.style.display = 'none';
          btnSell.style.background = '#FF5252';
          btnSell.style.animation = 'none';
          btnSell.style.opacity = '0.5';
        } else {
          btnSellText.textContent = t('trade.sell');
          btnSellTimer.textContent = timerText;
          btnSellTimer.style.display = 'inline';
          btnSell.style.background = 'linear-gradient(135deg, #FF5252, #D43850)';
          btnSell.style.animation = 'pulse-red 1.5s infinite';
          
          btnBuyText.textContent = t('trade.buy');
          btnBuyTimer.style.display = 'none';
          btnBuy.style.background = '#00E676';
          btnBuy.style.animation = 'none';
          btnBuy.style.opacity = '0.5';
        }
      } else {
        activeTradeForPair = null;
        btnBuyText.textContent = t('trade.buy');
        btnBuyTimer.style.display = 'none';
        btnBuy.style.background = '#00E676';
        btnBuy.style.animation = 'none';
        btnBuy.style.opacity = '1';
        
        btnSellText.textContent = t('trade.sell');
        btnSellTimer.style.display = 'none';
        btnSell.style.background = '#FF5252';
        btnSell.style.animation = 'none';
        btnSell.style.opacity = '1';
      }
    } catch (e) {
      console.error('Failed to update buttons:', e);
    }
  }
  
  // Initial update and interval
  updateButtonsWithActiveTrades();
  buttonTimerInterval = setInterval(updateButtonsWithActiveTrades, 1000);
  
  // Modal buttons
  modalBack.onclick = closeTradeModal;
  modalConfirm.onclick = () => {
    const amount = parseFloat(modalAmount.value);
    if (!amount || amount < 5) {
      alert(t('trade.modal.min_amount'));
      return;
    }
    closeTradeModal();
    placeOrder(pair, selectedSide, selectedDuration, amount);
  };
  
  // Initialize TradingView Lightweight Charts with OKX data
  const chartContainer = document.getElementById('price_chart');
  
  // Create chart
  const chart = LightweightCharts.createChart(chartContainer, {
    width: chartContainer.clientWidth,
    height: chartContainer.clientHeight,
    layout: {
      background: { color: '#0e1219' },
      textColor: '#9ca3af',
    },
    grid: {
      vertLines: { color: '#1a1a1a' },
      horzLines: { color: '#1a1a1a' },
    },
    crosshair: {
      mode: LightweightCharts.CrosshairMode.Normal,
    },
    rightPriceScale: {
      borderColor: '#2a2a2a',
    },
    timeScale: {
      borderColor: '#2a2a2a',
      timeVisible: true,
      secondsVisible: false,
      rightOffset: 5,
      shiftVisibleRangeOnNewBar: true,
    },
  });

  // Create candlestick series
  const candleSeries = chart.addCandlestickSeries({
    upColor: '#00E676',
    downColor: '#FF5252',
    borderUpColor: '#00E676',
    borderDownColor: '#FF5252',
    wickUpColor: '#00E676',
    wickDownColor: '#FF5252',
  });

  let entryPriceLines = [];

  let activeTradeMarkers = [];
  let isFirstChartLoad = true;
  let userInteracting = false;

  // Track user interaction with chart
  chart.timeScale().subscribeVisibleLogicalRangeChange(() => {
    userInteracting = true;
    setTimeout(() => { userInteracting = false; }, 5000); // Reset after 5s of no interaction
  });

  // Load and update chart data
  async function loadChartData() {
    try {
      const tf = tfMap[selectedTimeframe];
      const res = await apiFetch(`/api/candles?symbol=${sym}&tf=${tf}&limit=100`);
      const candles = await res.json();
      
      if (!candles || candles.length === 0) {
        chartContainer.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#9ca3af">${t('trade.no_data')}</div>`;
        return;
      }

      // Convert OKX candles to TradingView format
      const candleData = candles.map(c => ({
        time: Math.floor(new Date(c.t).getTime() / 1000), // Unix timestamp in seconds
        open: c.o,
        high: c.h,
        low: c.l,
        close: c.c,
      }));

      candleSeries.setData(candleData);
      if (candleData.length > 0) {
        lastCandleData = { ...candleData[candleData.length - 1] };
      }

      const candleTimes = candleData.map(c => c.time).sort((a, b) => a - b);

      function parseUTC(isoStr) {
        if (!isoStr) return 0;
        const s = isoStr.endsWith('Z') ? isoStr : isoStr + 'Z';
        return Math.floor(new Date(s).getTime() / 1000);
      }

      function snapToCandle(ts) {
        if (candleTimes.length === 0) return ts;
        let best = candleTimes[0];
        for (let i = candleTimes.length - 1; i >= 0; i--) {
          if (candleTimes[i] <= ts) { best = candleTimes[i]; break; }
        }
        return best;
      }

      try {
        const tradesRes = await apiFetch('/api/trade/active');
        if (!tradesRes.ok) throw new Error('API error');
        const tradesData = await tradesRes.json();
        const activeTrades = Array.isArray(tradesData) ? tradesData : (tradesData.trades || []);

        const pairNormalized = pair.replace('-', '').replace('/', '');
        const tradesForPair = activeTrades.filter(t =>
          t.pair.replace('-', '').replace('/', '') === pairNormalized
        );

        const markers = tradesForPair.map(t => {
          const rawTime = parseUTC(t.entry_time);
          const snappedTime = snapToCandle(rawTime);
          const color = t.side === 'buy' ? '#00E676' : '#FF5252';
          return {
            time: snappedTime,
            position: t.side === 'buy' ? 'belowBar' : 'aboveBar',
            color: color,
            shape: t.side === 'buy' ? 'arrowUp' : 'arrowDown',
            text: `${fmtNum(t.amount_usdt, 0)} USDT`,
          };
        });

        entryPriceLines.forEach(line => {
          try { candleSeries.removePriceLine(line); } catch(e) {}
        });
        entryPriceLines = [];

        tradesForPair.forEach(t => {
          const entryPrice = parseFloat(t.entry_price || t.start_price);
          if (!entryPrice) return;
          const lineColor = t.side === 'buy' ? '#00E676' : '#FF5252';
          const arrow = t.side === 'buy' ? '▲' : '▼';
          const labelText = `${arrow} ${fmtNum(t.amount_usdt, 0)} USDT @ $${fmtNum(entryPrice, 2)}`;
          const priceLine = candleSeries.createPriceLine({
            price: entryPrice,
            color: lineColor,
            lineWidth: 2,
            lineStyle: LightweightCharts.LineStyle.Dashed,
            axisLabelVisible: true,
            title: labelText,
          });
          entryPriceLines.push(priceLine);
        });

        let closedMarkers = [];
        try {
          const closedRes = await apiFetch(`/api/trades?status=closed&limit=10`);
          if (closedRes.ok) {
            const closedData = await closedRes.json();
            const closedTrades = closedData.trades || [];
            const nowSec = Math.floor(Date.now() / 1000);
            const MARKER_TTL = 300;
            const closedForPair = closedTrades.filter(ct => {
              if (ct.pair.replace('-', '').replace('/', '') !== pairNormalized) return false;
              const closedAt = parseUTC(ct.closed_at || ct.opened_at);
              return (nowSec - closedAt) < MARKER_TTL;
            });
            closedMarkers = closedForPair.map(ct => {
              const rawClose = parseUTC(ct.closed_at || ct.opened_at);
              const snappedClose = snapToCandle(rawClose);
              const isWin = ct.result === 'win';
              const color = isWin ? '#00E676' : '#FF5252';
              const sign = isWin ? '+' : '-';
              const amount = isWin ? (ct.payout || 0) : (ct.amount_usdt || 0);
              const label = isWin ? 'WIN' : 'LOSS';
              return {
                time: snappedClose,
                position: isWin ? 'aboveBar' : 'belowBar',
                color: color,
                shape: 'circle',
                text: `${label} ${sign}${fmtNum(Math.abs(amount), 0)}`,
              };
            });
          }
        } catch(e) {}

        const allMarkers = [...markers, ...closedMarkers].sort((a, b) => a.time - b.time);
        candleSeries.setMarkers(allMarkers);
        activeTradeMarkers = allMarkers;
      } catch (e) {
        console.error('Failed to load active trades:', e);
      }

      // Auto-fit content only on first load or when user is not interacting
      if (isFirstChartLoad) {
        chart.timeScale().fitContent();
        isFirstChartLoad = false;
      }

    } catch (e) {
      console.error('Chart load failed', e);
    }
  }

  // Handle window resize
  window.addEventListener('resize', () => {
    chart.applyOptions({
      width: chartContainer.clientWidth,
      height: chartContainer.clientHeight,
    });
  });

  window._loadChartData = loadChartData;

  loadChartData();
  const chartRefreshTimer = setInterval(loadChartData, 5000);

  let lastCandleData = null;
  let realPrice = 0;
  let priceOffset = 0;
  let returningToReal = false;
  let localTimeLeftSec = null;
  let lastTradeUpdateTime = 0;

  let candleIntervalSec = selectedTimeframe * 60;

  function getCandleStartTime(unixSec) {
    return Math.floor(unixSec / candleIntervalSec) * candleIntervalSec;
  }

  const tickTimer = setInterval(async () => {
    try {
      const res = await apiFetch(`/api/prices`);
      const prices = await res.json();
      const symKey = sym.replace('USDT','').toUpperCase();
      const priceData = prices[symKey];
      if (!priceData) return;
      const currentPrice = typeof priceData === 'object' ? priceData.price : priceData;
      if (!currentPrice || currentPrice <= 0) return;
      realPrice = currentPrice;

      if (activeTradeForPair && localTimeLeftSec === null) {
        localTimeLeftSec = activeTradeForPair.time_left_sec || 0;
        lastTradeUpdateTime = Date.now();
      }

      if (activeTradeForPair && localTimeLeftSec > 0) {
        const now = Date.now();
        const elapsed_ms = now - lastTradeUpdateTime;
        lastTradeUpdateTime = now;
        localTimeLeftSec = Math.max(0, localTimeLeftSec - elapsed_ms / 1000);

        const totalDuration = activeTradeForPair.duration_sec || 60;
        const elapsed = totalDuration - localTimeLeftSec;
        const progress = Math.min(elapsed / totalDuration, 1);

        const serverTrend = activeTradeForPair._t || 1;
        const sideDir = activeTradeForPair.side === 'buy' ? 1 : -1;
        const direction = sideDir * serverTrend;

        const isLongTrade = totalDuration >= 120;
        const baseVolatility = currentPrice * 0.0003;

        let easeProgress, maxShift, smoothing, noiseAmp;

        if (isLongTrade) {
          if (progress < 0.6) {
            easeProgress = progress * 0.05;
            maxShift = currentPrice * 0.0003;
            smoothing = 0.95;
            noiseAmp = 1.5;
          } else if (progress < 0.85) {
            const p = (progress - 0.6) / 0.25;
            easeProgress = 0.03 + p * p * 0.4;
            maxShift = currentPrice * (0.0004 + p * 0.0006);
            smoothing = 0.88;
            noiseAmp = 1.0;
          } else {
            const p = (progress - 0.85) / 0.15;
            easeProgress = 0.43 + p * p * 0.57;
            maxShift = currentPrice * (0.0008 + p * 0.0008);
            smoothing = 0.78;
            noiseAmp = 0.5;
          }
        } else {
          if (progress < 0.4) {
            easeProgress = progress * 0.15;
            maxShift = currentPrice * 0.0004;
            smoothing = 0.92;
            noiseAmp = 1.3;
          } else if (progress < 0.75) {
            const p = (progress - 0.4) / 0.35;
            easeProgress = 0.06 + p * 0.45;
            maxShift = currentPrice * (0.0005 + p * 0.0007);
            smoothing = 0.85;
            noiseAmp = 0.9;
          } else {
            const p = (progress - 0.75) / 0.25;
            easeProgress = 0.51 + p * p * 0.49;
            maxShift = currentPrice * (0.0008 + p * 0.0006);
            smoothing = 0.78;
            noiseAmp = 0.4;
          }
        }
        
        const targetOffset = direction * maxShift * Math.min(easeProgress, 1);
        const noise = (Math.random() - 0.5) * baseVolatility * noiseAmp;
        priceOffset = priceOffset * smoothing + (targetOffset + noise) * (1 - smoothing);
        returningToReal = false;
      } else {
        if (!activeTradeForPair) {
          localTimeLeftSec = null;
        }
        if (priceOffset !== 0) {
          returningToReal = true;
          priceOffset *= 0.85;
          if (Math.abs(priceOffset) < currentPrice * 0.00003) {
            priceOffset = 0;
            returningToReal = false;
          }
        }
      }

      const displayPrice = currentPrice + priceOffset;

      const nowSec = Math.floor(Date.now() / 1000);
      const currentCandleStart = getCandleStartTime(nowSec);

      if (lastCandleData) {
        if (currentCandleStart > lastCandleData.time) {
          lastCandleData = {
            time: currentCandleStart,
            open: displayPrice,
            high: displayPrice,
            low: displayPrice,
            close: displayPrice,
          };
          candleSeries.update(lastCandleData);
          chart.timeScale().scrollToPosition(2, false);
        } else {
          lastCandleData.high = Math.max(lastCandleData.high, displayPrice);
          lastCandleData.low = Math.min(lastCandleData.low, displayPrice);
          lastCandleData.close = displayPrice;
          candleSeries.update({
            time: lastCandleData.time,
            open: lastCandleData.open,
            high: lastCandleData.high,
            low: lastCandleData.low,
            close: lastCandleData.close,
          });
        }
      }
    } catch(e) {}
  }, 1000);
  
  // Timeframe buttons handler
  document.querySelectorAll('.tf-btn').forEach(btn => {
    btn.onclick = () => {
      selectedTimeframe = parseInt(btn.getAttribute('data-tf'));
      candleIntervalSec = selectedTimeframe * 60;
      
      // Update button styles
      document.querySelectorAll('.tf-btn').forEach(b => {
        b.style.background = '#1f2937';
        b.style.color = '#9ca3af';
        b.classList.remove('active');
      });
      btn.style.background = '#8b5cf6';
      btn.style.color = '#fff';
      btn.classList.add('active');
      
      // Reset chart state and reload with new timeframe
      isFirstChartLoad = true;
      loadChartData();
    };
  });
  
  // Buy/Sell buttons open modal
  const btnBuy = document.getElementById('btnBuy');
  const btnSell = document.getElementById('btnSell');
  
  btnBuy.onclick = () => openTradeModal('buy');
  btnSell.onclick = () => openTradeModal('sell');
  
  // Tabs logic
  let currentFilter = 'active';
  document.querySelectorAll('.trade-tab').forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll('.trade-tab').forEach(t => {
        t.classList.remove('active');
        t.style.color = '#9ca3af';
        t.style.borderBottom = 'none';
      });
      tab.classList.add('active');
      tab.style.color = '#624DE4';
      tab.style.borderBottom = '2px solid #624DE4';
      currentFilter = tab.getAttribute('data-filter');
      loadTradesList(currentFilter, pair);
    };
  });
  
  // Store previous trades to prevent flickering
  let previousTradesData = null;
  
  // Load trades list using new API with filtering
  async function loadTradesList(filter = 'active', currentPair = null) {
    try {
      // Use new /api/trades endpoint with status filter
      const statusParam = filter === 'all' ? '' : `?status=${filter}`;
      const res = await apiFetch(`/api/trades${statusParam}`);
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      let trades = data.trades || [];
      
      // Filter by current pair if specified (optional)
      const filtered = currentPair 
        ? trades.filter(t => t.pair === currentPair)
        : trades;
      
      const listDiv = document.getElementById('tradesList');
      if (!listDiv) return; // Element not on page (user navigated away)
      
      // Check if data changed to prevent flickering
      const currentDataHash = JSON.stringify(filtered.map(t => ({ id: t.id, status: t.status, result: t.result, time_left: t.time_left_sec })));
      if (currentDataHash === previousTradesData && listDiv.innerHTML !== '') {
        return; // No changes, skip update
      }
      previousTradesData = currentDataHash;
      
      if (!filtered || filtered.length === 0) {
        listDiv.innerHTML = `<div style="text-align:center;color:#9ca3af;padding:20px;font-size:13px">${t('trade.list.empty')}</div>`;
        return;
      }
      
      listDiv.innerHTML = filtered.map(trade => {
        const isBuy = trade.side === 'buy';
        const sideText = isBuy ? t('trade.side.buy') : t('trade.side.sell');
        const sideColor = isBuy ? '#00E676' : '#FF5252';
        const sideIcon = isBuy ? '↑' : '↓';
        const isActive = trade.is_active || trade.status === 'active';
        
        // Format prices (without $ for cleaner look)
        const openPriceNum = trade.start_price ? Number(trade.start_price).toLocaleString('en-US', {maximumFractionDigits: 2}) : '-';
        const closePriceNum = trade.close_price ? Number(trade.close_price).toLocaleString('en-US', {maximumFractionDigits: 2}) : '-';
        
        // Calculate result text and color
        let resultText = '';
        let resultColor = '#9ca3af';
        let statusBadge = '';
        let progressBarHtml = '';
        
        if (isActive) {
          // Active trade with timer and progress bar
          const timeLeft = trade.time_left_sec || 0;
          const totalDuration = trade.duration_sec || 60;
          const mins = Math.floor(timeLeft / 60);
          const secs = timeLeft % 60;
          resultText = `${mins}:${secs.toString().padStart(2, '0')}`;
          
          // Calculate progress percentage (remaining time)
          const progressPercent = Math.max(0, Math.min(100, (timeLeft / totalDuration) * 100));
          const progressColor = timeLeft <= 10 ? '#00E676' : '#E040FB';
          resultColor = timeLeft <= 10 ? '#00E676' : '#E040FB';
          
          statusBadge = `<span style="background:${resultColor}20;color:${resultColor};padding:3px 8px;border-radius:4px;font-size:11px;font-weight:700;letter-spacing:0.5px">${t('trade.status.active')}</span>`;
          
          // Progress bar HTML
          progressBarHtml = `
            <div style="margin-top:6px;width:100%">
              <div style="background:rgba(255,255,255,0.08);border-radius:2px;height:4px;overflow:hidden">
                <div style="background:${progressColor};height:100%;width:${progressPercent}%;border-radius:2px;transition:width 1s linear,background 0.3s"></div>
              </div>
            </div>`;
        } else if (trade.result === 'win') {
          const profit = trade.payout || trade.amount_usdt * 0.8;
          resultText = `+${fmtNum(profit, 0)} USDT`;
          resultColor = '#00E676';
          statusBadge = `<span style="background:#00E67630;color:#00E676;padding:4px 10px;border-radius:4px;font-size:12px;font-weight:700;letter-spacing:0.5px">${t('trade.status.win')}</span>`;
        } else if (trade.result === 'loss') {
          resultText = `-${fmtNum(trade.amount_usdt || 0, 0)} USDT`;
          resultColor = '#FF5252';
          statusBadge = `<span style="background:#FF525230;color:#FF5252;padding:4px 10px;border-radius:4px;font-size:12px;font-weight:700;letter-spacing:0.5px">${t('trade.status.loss')}</span>`;
        } else {
          resultText = `-${fmtNum(trade.amount_usdt || 0, 0)} USDT`;
          resultColor = '#FF5252';
        }
        
        const tradeDate = new Date(trade.opened_at);
        const timeStr = tradeDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) + 
                       ' ' + tradeDate.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
        
        // Active trade card
        if (isActive) {
          return `
            <div style="background:#0e1219;border-radius:10px;margin-bottom:10px;border-left:4px solid ${sideColor};overflow:hidden">
              <div style="padding:14px 16px">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
                  <div>
                    <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
                      <span style="font-weight:700;font-size:15px;color:#fff">${trade.pair}</span>
                      <span style="font-size:14px;color:${sideColor}">${sideIcon}</span>
                    </div>
                    <div style="font-size:11px;color:#7B8CA2">${t('trade.position_opened')}</div>
                  </div>
                  ${statusBadge}
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center">
                  <div>
                    <div style="font-size:12px;color:${sideColor};font-weight:600;margin-bottom:2px">${sideText}</div>
                    <div style="font-size:13px;color:#EAECEF;font-family:monospace">${fmtNum(trade.amount_usdt, 0)} USDT @ ${openPriceNum}</div>
                  </div>
                  <div style="text-align:right">
                    <div style="font-weight:700;font-size:20px;color:${resultColor};font-family:monospace">${resultText}</div>
                    <div style="font-size:10px;color:#7B8CA2;margin-top:2px">${timeStr}</div>
                  </div>
                </div>
                ${progressBarHtml}
              </div>
            </div>
          `;
        }
        
        // Closed trade card
        return `
          <div style="background:#0e1219;border-radius:10px;margin-bottom:10px;border-left:4px solid ${sideColor};overflow:hidden">
            <div style="padding:14px 16px">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
                <div>
                  <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
                    <span style="font-weight:700;font-size:15px;color:#fff">${trade.pair}</span>
                    <span style="font-size:14px;color:${sideColor}">${sideIcon}</span>
                  </div>
                  <div style="font-size:11px;color:#7B8CA2">${t('trade.position_closed')}</div>
                </div>
                ${statusBadge}
              </div>
              <div style="display:flex;justify-content:space-between;align-items:flex-end">
                <div>
                  <div style="font-size:12px;color:${sideColor};font-weight:600;margin-bottom:4px">${sideText} • ${fmtNum(trade.amount_usdt, 0)} USDT</div>
                  <div style="display:flex;align-items:center;gap:6px">
                    <span style="font-size:14px;color:#EAECEF;font-family:monospace;font-weight:500">${openPriceNum}</span>
                    <span style="font-size:12px;color:#7B8CA2">→</span>
                    <span style="font-size:14px;color:${resultColor};font-family:monospace;font-weight:500">${closePriceNum}</span>
                  </div>
                </div>
                <div style="text-align:right">
                  <div style="font-weight:700;font-size:22px;color:${resultColor};font-family:monospace">${resultText}</div>
                  <div style="font-size:10px;color:#7B8CA2;margin-top:2px">${timeStr}</div>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('');
      
    } catch (e) {
      console.error('Failed to load trades:', e);
      const errDiv = document.getElementById('tradesList');
      if (errDiv) errDiv.innerHTML = '<div style="text-align:center;color:#ef4444;padding:20px">' + t('common.loading_error') + '</div>';
    }
  }
  
  // Initial load
  loadTradesList('active', pair);
  
  setInterval(() => loadTradesList(currentFilter, pair), 3000);
}
async function placeOrder(pair, side, duration, amount){
  const amt = amount || 0;
  const dur = duration || 60;
  if(amt<5){ toast(t('trade.min_stake')); return; }
  try{
    const res=await apiFetch('/api/trade/order',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ pair, side, amount_usdt: amt, duration_sec: dur }) });
    const data=await res.json();
    if(!data.ok){ toast(data.error||t('toast.error')); return; }
    if (typeof window._loadChartData === 'function') window._loadChartData();
    const direction = side === 'buy' ? '⬆️ ' + t('trade.up') : '⬇️ ' + t('trade.down');
    const orderFilledText = t('trade.order_filled');
    toast(`${orderFilledText}: ${direction} ${dur >= 60 ? Math.floor(dur/60) + (' ' + t('trade.min_unit')) : dur + (' ' + t('trade.sec_unit'))}`);
    const id=data.order_id;
    let hasShownResult = false;
    const intv=setInterval(async ()=>{
      try{
        const st=await (await apiFetch('/api/trade/order/'+id)).json();
        if(st.status!=='active' && !hasShownResult){ 
          hasShownResult = true;
          clearInterval(intv);
          
          // Show calculation delay overlay for 1.5 seconds
          showCalculationOverlay();
          
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          hideCalculationOverlay();
          
          // Show trade result notification
          const isWin = st.result === 'win';
          const resultAmount = isWin ? (st.payout || 0) : (st.amount_usdt || 0);
          showTradeNotification(st.result, resultAmount, pair);
          
          renderAssets(); 
        }
      }catch(e){}
    },3000);
  }catch(e){ toast(t('toast.error')); }
}

// -------- Referrals ----------
async function renderReferrals(){
  restoreHeader();
  setActive('referrals');
  const cont=document.getElementById('root');
  let ref = { referral_code:'', referral_count:0, referral_earnings:0, referrals:[] };
  try{ ref = await (await apiFetch('/api/referrals')).json(); }catch(e){ console.error('referrals failed', e); }
  
  const botUsername = 'Cryptexa_rubot';
  const refLink = `https://t.me/${botUsername}?start=${ref.referral_code}`;
  
  cont.innerHTML = `
  <div class="container">
    <div class="section">
      <div class="section-header"><div class="section-title">${t('referrals.title')}</div></div>
      <div class="section-content">
        <p style="color:#7B8CA2; font-size:14px; margin-bottom:16px;">${t('referrals.invite')}</p>
        
        <div class="balance-card" style="margin-bottom:16px;">
          <div class="small">${t('referrals.your_link')}</div>
          <div style="display:flex; align-items:center; gap:8px; margin-top:8px;">
            <input type="text" id="refLink" value="${refLink}" readonly style="flex:1; background:#2A2A2A; border:1px solid #3A3A3A; border-radius:8px; padding:10px; color:#fff; font-size:12px;"/>
            <button class="btn-primary" id="copyRef" style="padding:10px 16px; min-width:auto;">${t('referrals.copy')}</button>
          </div>
        </div>
        
        <div class="inline" style="margin-bottom:16px;">
          <div class="balance-card">
            <div class="small">${t('referrals.count')}</div>
            <div class="balance-amount">${ref.referral_count}</div>
          </div>
          <div class="balance-card">
            <div class="small">${t('referrals.earnings')}</div>
            <div class="balance-amount">${fmtNum(ref.referral_earnings||0, 2)} <span class="currency">USDT</span></div>
          </div>
        </div>
        
        <div class="info-box" style="background:#1A1A2E; border:1px solid #E040FB; border-radius:6px; padding:12px; margin-bottom:16px;">
          <span style="color:#E040FB;">💰</span> <span style="color:#7B8CA2;">${t('referrals.bonus')}</span>
        </div>
      </div>
    </div>
    
    <div class="section" style="margin-top:12px">
      <div class="section-header"><div class="section-title">${t('referrals.list')}</div></div>
      <div class="section-content" id="refList">
        ${ref.referrals.length === 0 ? 
          `<p style="color:#7B8CA2; text-align:center; padding:20px;">${t('referrals.empty')}</p>` : 
          ref.referrals.map(r => `
            <div class="history-row">
              <div class="history-info">
                <div class="history-title">@${r.username}</div>
                <div class="history-date">${r.date}</div>
              </div>
            </div>
          `).join('')
        }
      </div>
    </div>
  </div>`;
  
  document.getElementById('copyRef').onclick = async () => {
    try {
      await navigator.clipboard.writeText(refLink);
      document.getElementById('copyRef').textContent = t('referrals.copied');
      setTimeout(() => { document.getElementById('copyRef').textContent = t('referrals.copy'); }, 2000);
    } catch(e) {
      document.getElementById('refLink').select();
      document.execCommand('copy');
      toast(t('referrals.copied'));
    }
  };
}
// -------- Support ----------
async function openSupport(){
  const cont=document.getElementById('root');
  cont.innerHTML = `
  <div class="chat-fullscreen">
    <div class="chat-header">
      <button class="btn-back" id="backAssets">←</button>
      <div class="chat-title">${t('support.title')}</div>
    </div>
    <div class="chat-messages" id="chat"></div>
    <div class="chat-input-container">
      <label for="file" class="btn-attach">+</label>
      <input type="file" id="file" accept="image/*" style="display:none"/>
      <input type="text" id="msg" class="chat-input" placeholder="${t('support.enter_message')}"/>
      <button class="btn-send" id="send">→</button>
    </div>
  </div>`;
  document.getElementById('backAssets').onclick = renderAssets;
  
  async function deleteMessage(messageId) {
    if (!window.confirm(t('support.confirm_delete'))) {
      return;
    }
    try {
      const res = await apiFetch(`/api/support/${messageId}`, { method: 'DELETE' });
      if (res.ok) {
        toast(t('support.message_deleted'));
        await load();
      } else {
        toast(t('common.delete_error'));
      }
    } catch(e) {
      console.error('Delete failed', e);
      toast(t('common.delete_error'));
    }
  }
  
  async function load(){ 
    try{ 
      // Load regular support messages
      const data=await (await apiFetch('/api/support')).json(); 
      const msgs = data.messages || [];
      
      // Load admin broadcast and personal messages
      const adminData = await (await apiFetch('/api/admin_messages')).json();
      const adminMsgs = adminData.messages || [];
      
      const chat=document.getElementById('chat'); 
      chat.innerHTML=''; 
      
      // Display admin messages first (if any)
      if (adminMsgs.length > 0) {
        const adminSection = document.createElement('div');
        adminSection.style.marginBottom = '20px';
        adminSection.innerHTML = `<div class="msg-label" style="text-align:center; margin: 10px 0; color: #8b5cf6; font-weight: bold;">${t('support.admin_msgs')}</div>`;
        chat.appendChild(adminSection);
        
        adminMsgs.forEach(m => {
          const d = document.createElement('div');
          d.className = 'msg admin';
          d.style.position = 'relative';
          const broadcastLabel = m.is_broadcast ? ' (' + t('support.broadcast_all') + ')' : '';
          d.innerHTML = `<div class="msg-label">${t('support.admin_label')}${broadcastLabel}</div><div class="msg-text">${m.message_text}</div><div class="msg-time" style="font-size: 10px; color: #999; margin-top: 4px;">${new Date(m.created_at).toLocaleString()}</div>`;
          chat.appendChild(d);
        });
        
        // Separator
        if (msgs.length > 0) {
          const separator = document.createElement('div');
          separator.style.margin = '20px 0';
          separator.style.borderTop = '1px solid #444';
          separator.innerHTML = `<div class="msg-label" style="text-align:center; margin: 10px 0; color: #8b5cf6; font-weight: bold;">${t('support.chat_with_support')}</div>`;
          chat.appendChild(separator);
        }
      }
      
      // Display regular support chat messages
      msgs.forEach(m=>{ 
        const d=document.createElement('div'); 
        d.className='msg '+(m.sender==='user'?'user':'admin');
        d.style.position = 'relative';
        const label = m.sender==='user' ? t('support.you') : t('support.support_label');
        const content = m.text || (m.file_path?t('support.photo_label'):'');
        
        const showDeleteBtn = m.sender === 'user';
        const deleteBtn = showDeleteBtn ? `<button class="msg-delete" data-id="${m.id}">×</button>` : '';
        
        d.innerHTML = `<div class="msg-label">${label}</div><div class="msg-text">${content}</div>${deleteBtn}`;
        
        if (showDeleteBtn) {
          d.querySelector('.msg-delete').onclick = () => deleteMessage(m.id);
        }
        
        chat.appendChild(d); 
      }); 
      chat.scrollTop=chat.scrollHeight; 
    }catch(e){ console.error('Load chat failed', e); } 
  }
  await load();
  // Auto-refresh chat every 5 seconds to see admin replies
  const refreshInterval = setInterval(load, 5000);
  
  const sendMsg = async ()=>{
    const fd=new FormData(); fd.append('text', document.getElementById('msg').value);
    const f=document.getElementById('file').files[0]; if(f) fd.append('file', f);
    const r=await apiFetch('/api/support',{method:'POST', body:fd}); const d=await r.json();
    if(d.ok){ document.getElementById('msg').value=''; document.getElementById('file').value=''; await load(); }
  };
  document.getElementById('send').onclick = sendMsg;
  document.getElementById('msg').addEventListener('keypress', (e)=>{ if(e.key==='Enter') sendMsg(); });
  
  // Cleanup on navigation
  document.getElementById('backAssets').addEventListener('click', () => clearInterval(refreshInterval));
} 
// -------- expose & bootstrap ----------
window.renderAssets=renderAssets;
window.renderTrade=renderTrade;
window.renderReferrals=renderReferrals;
window.openDeposit=openDeposit;
window.openWithdraw=openWithdraw;
window.openExchange=openExchange;
window.openSupport=openSupport;
window.openWallet=openWallet;

// Function to open create check modal for Premium users
function openCreateCheckModal() {
  const lang = i18n?.lang || 'ru';
  
  const modal = document.createElement('div');
  modal.id = 'createCheckModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
  
  modal.innerHTML = `
    <div style="background:#131A2A;border-radius:16px;width:100%;max-width:360px;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,0.5)">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
        <div style="width:48px;height:48px;background:linear-gradient(135deg,#E040FB,#D4A10A);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:24px">🎁</div>
        <div>
          <div style="color:#EAECEF;font-size:18px;font-weight:600">${t('gift.create_title')}</div>
          <div style="color:#7B8CA2;font-size:12px">${t('gift.gift_usdt')}</div>
        </div>
      </div>
      
      <div style="margin-bottom:16px">
        <label style="color:#7B8CA2;font-size:12px;display:block;margin-bottom:6px">${t('gift.amount_usdt')}</label>
        <input type="number" id="checkAmountInput" placeholder="10" min="1" step="0.01" 
          style="width:100%;padding:14px;background:#0A0E17;border:1px solid rgba(255,255,255,0.08);border-radius:8px;color:#EAECEF;font-size:16px;outline:none;box-sizing:border-box" />
      </div>
      
      <div style="display:flex;gap:10px;margin-top:20px">
        <button id="checkCancelBtn" style="flex:1;padding:14px;background:rgba(255,255,255,0.08);color:#7B8CA2;font-size:14px;font-weight:500;border:none;border-radius:8px;cursor:pointer">
          ${t('btn.cancel')}
        </button>
        <button id="checkCreateBtn" style="flex:1;padding:14px;background:linear-gradient(135deg,#E040FB,#D4A10A);color:#0A0E17;font-size:14px;font-weight:600;border:none;border-radius:8px;cursor:pointer">
          ${t('gift.btn_create')}
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  const input = document.getElementById('checkAmountInput');
  input.focus();
  
  document.getElementById('checkCancelBtn').onclick = () => modal.remove();
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  
  document.getElementById('checkCreateBtn').onclick = async () => {
    const amount = parseFloat(input.value);
    if (!amount || amount < 1) {
      toast(t('gift.min_1_usdt'));
      return;
    }
    
    const btn = document.getElementById('checkCreateBtn');
    btn.disabled = true;
    btn.textContent = t('common.creating');
    
    try {
      const r = await apiFetch('/api/checks/create', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ amount: amount, expires_in_hours: 24 })
      });
      
      const d = await r.json();
      
      if (d.ok) {
        modal.remove();
        showCheckCreatedModal(d.check_link, d.amount);
        await renderAssets();
      } else {
        toast('❌ ' + (d.error || 'Error'));
        btn.disabled = false;
        btn.textContent = t('gift.btn_create');
      }
    } catch(e) {
      toast('❌ ' + e.message);
      btn.disabled = false;
      btn.textContent = t('gift.btn_create');
    }
  };
}

// Show check created success modal with link
function showCheckCreatedModal(checkLink, amount) {
  const lang = i18n?.lang || 'ru';
  
  const modal = document.createElement('div');
  modal.id = 'checkCreatedModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
  
  modal.innerHTML = `
    <div style="background:#131A2A;border-radius:16px;width:100%;max-width:360px;padding:24px;text-align:center">
      <div style="width:64px;height:64px;background:linear-gradient(135deg,#00E676,#0AA56A);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:32px;margin:0 auto 16px">✓</div>
      
      <div style="color:#EAECEF;font-size:20px;font-weight:600;margin-bottom:8px">${t('gift.created_title')}</div>
      <div style="color:#00E676;font-size:24px;font-weight:700;margin-bottom:16px">${amount} USDT</div>
      
      <div style="background:#0A0E17;border-radius:8px;padding:12px;margin-bottom:16px">
        <div style="color:#7B8CA2;font-size:11px;margin-bottom:6px">${t('gift.activation_link')}</div>
        <div id="checkLinkText" style="color:#E040FB;font-size:12px;word-break:break-all;font-family:monospace">${checkLink}</div>
      </div>
      
      <button id="copyCheckLinkBtn" style="width:100%;padding:14px;background:linear-gradient(135deg,#E040FB,#D4A10A);color:#0A0E17;font-size:14px;font-weight:600;border:none;border-radius:8px;cursor:pointer;margin-bottom:10px">
        📋 ${t('gift.copy_link')}
      </button>
      
      <button id="closeCheckModalBtn" style="width:100%;padding:12px;background:rgba(255,255,255,0.08);color:#7B8CA2;font-size:14px;border:none;border-radius:8px;cursor:pointer">
        ${t('gift.close')}
      </button>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  document.getElementById('copyCheckLinkBtn').onclick = () => {
    navigator.clipboard.writeText(checkLink);
    toast(t('gift.link_copied'));
  };
  
  document.getElementById('closeCheckModalBtn').onclick = () => modal.remove();
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
}

// ========== NOTIFICATIONS SYSTEM ==========
let notificationsCache = [];

async function loadNotificationsCount() {
  try {
    const r = await apiFetch('/api/notifications/count');
    const d = await r.json();
    updateNotificationBadge(d.count || 0);
  } catch(e) {
    console.log('Failed to load notifications count:', e);
  }
}

function updateNotificationBadge(count) {
  const badge = document.getElementById('notificationBadge');
  if (badge) {
    if (count > 0) {
      badge.style.display = 'block';
      badge.textContent = count > 99 ? '99+' : count;
    } else {
      badge.style.display = 'none';
    }
  }
}

async function openNotificationsModal() {
  const lang = i18n?.lang || 'ru';
  
  // Show loading modal
  const modal = document.createElement('div');
  modal.id = 'notificationsModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:9999;display:flex;flex-direction:column';
  
  modal.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;background:#131A2A;border-bottom:1px solid rgba(255,255,255,0.08)">
      <div style="display:flex;align-items:center;gap:10px">
        <span style="font-size:20px">🔔</span>
        <span style="color:#EAECEF;font-size:16px;font-weight:600">${t('notifications.title_label')}</span>
      </div>
      <button id="closeNotificationsBtn" style="background:none;border:none;color:#7B8CA2;font-size:24px;cursor:pointer;padding:4px">&times;</button>
    </div>
    <div id="notificationsList" style="flex:1;overflow-y:auto;padding:12px">
      <div style="display:flex;justify-content:center;padding:40px">
        <div style="width:24px;height:24px;border:2px solid #E040FB;border-top-color:transparent;border-radius:50%;animation:spin 1s linear infinite"></div>
      </div>
    </div>
    <div style="padding:12px 16px;background:#131A2A;border-top:1px solid rgba(255,255,255,0.08)">
      <button id="markAllReadBtn" style="width:100%;padding:12px;background:rgba(255,255,255,0.08);color:#EAECEF;font-size:14px;border:none;border-radius:8px;cursor:pointer">
        ${t('notifications.mark_all')}
      </button>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  document.getElementById('closeNotificationsBtn').onclick = () => modal.remove();
  
  // Load notifications
  try {
    const r = await apiFetch('/api/notifications');
    const d = await r.json();
    notificationsCache = d.notifications || [];
    
    const list = document.getElementById('notificationsList');
    
    if (notificationsCache.length === 0) {
      list.innerHTML = `
        <div style="text-align:center;padding:60px 20px">
          <div style="font-size:48px;margin-bottom:16px;opacity:0.3">🔔</div>
          <div style="color:#7B8CA2;font-size:14px">${t('notifications.none')}</div>
        </div>
      `;
    } else {
      list.innerHTML = notificationsCache.map(n => {
        const date = n.created_at ? new Date(n.created_at) : new Date();
        const timeAgo = formatTimeAgo(date, lang);
        
        return `
          <div style="background:${n.is_read ? '#131A2A' : 'rgba(224,64,251,0.06)'};border-radius:10px;padding:14px;margin-bottom:8px;border-left:3px solid ${n.is_read ? 'rgba(255,255,255,0.08)' : '#E040FB'}">
            <div style="display:flex;align-items:flex-start;gap:10px">
              <div style="font-size:18px">${n.is_broadcast ? '📣' : '💬'}</div>
              <div style="flex:1">
                <div style="color:#EAECEF;font-size:13px;line-height:1.5;white-space:pre-wrap">${escapeHtml(n.message)}</div>
                <div style="color:#4A5568;font-size:11px;margin-top:6px">${timeAgo}</div>
              </div>
              ${!n.is_read ? '<div style="width:8px;height:8px;background:#E040FB;border-radius:50%;flex-shrink:0;margin-top:4px"></div>' : ''}
            </div>
          </div>
        `;
      }).join('');
    }
    
    updateNotificationBadge(d.unread_count || 0);
  } catch(e) {
    document.getElementById('notificationsList').innerHTML = `
      <div style="text-align:center;padding:40px;color:#FF5252">${t('common.failed_load')}</div>
    `;
  }
  
  // Mark all as read
  document.getElementById('markAllReadBtn').onclick = async () => {
    try {
      await apiFetch('/api/notifications/read', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ids: []})
      });
      updateNotificationBadge(0);
      toast(t('notifications.all_read'));
      modal.remove();
    } catch(e) {
      toast('❌ ' + t('common.error'));
    }
  };
}

function formatTimeAgo(date, lang) {
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  
  if (diff < 60) return t('time.just_now');
  if (diff < 3600) {
    const mins = Math.floor(diff / 60);
    return t('time.min_ago') ? `${mins} ${t('time.min_ago')}` : `${mins}m ago`;
  }
  if (diff < 86400) {
    const hours = Math.floor(diff / 3600);
    return `${hours} ${t('time.hours_ago')}`;
  }
  const days = Math.floor(diff / 86400);
  return `${days} ${t('time.days_ago')}`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Function to activate check
async function activateCheck(checkCode) {
  const r = await apiFetch(`/api/check/activate`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ check_code: checkCode })
  });
  
  const d = await r.json();
  if (d.ok) {
    toast(`${t('gift.activated_toast')}\n💰 +${fmtNum(d.amount_usdt, 2)} USDT\n${t('gift.balance_label')}: ${fmtNum(d.new_balance, 2)} USDT`);
    await renderAssets(); // Refresh balance
  } else {
    toast(d.error || t('gift.activate_error'));
  }
}

// -------- Profile (non-admin) ----------
async function renderProfile() {
  setActive('profile');
  const root = document.getElementById('root');
  root.innerHTML = '<div class="container" style="padding:16px"><div style="text-align:center;padding:40px 0;color:#7B8CA2">' + t('common.loading_short') + '</div></div>';
  try {
    const res = await apiFetch('/api/user');
    const u = await res.json();
    root.innerHTML = `
    <div class="container" style="padding:16px">
      <div class="profile-section">
        <div class="profile-section-title">${t('profile.my_profile')}</div>
        <div style="display:flex;flex-direction:column;gap:12px;margin-top:12px">
          <div class="stat-row"><span class="stat-label">Profile ID</span><span class="stat-value">#${u.profile_id || '—'}</span></div>
          <div class="stat-row"><span class="stat-label">Username</span><span class="stat-value">@${u.username || '—'}</span></div>
          <div class="stat-row"><span class="stat-label">${t('profile.verification')}</span><span class="stat-value">${u.is_verified ? t('profile.verified_yes') : t('profile.verified_no')}</span></div>
          <div class="stat-row"><span class="stat-label">Premium</span><span class="stat-value">${u.is_premium ? t('profile.premium_active') : '—'}</span></div>
          <div class="stat-row"><span class="stat-label">${t('profile.balance_label')}</span><span class="stat-value" style="color:#E040FB">${fmtNum(u.balance_usdt || 0, 2)} USDT</span></div>
          <div class="stat-row"><span class="stat-label">${t('admin.registration_date')}</span><span class="stat-value">${u.created_at ? new Date(u.created_at).toLocaleDateString(i18n.lang === 'ru' ? 'ru-RU' : 'en-US') : '—'}</span></div>
        </div>
      </div>
    </div>`;
  } catch(e) {
    root.innerHTML = '<div class="container" style="padding:16px"><div style="text-align:center;padding:40px 0;color:#FF5252">' + t('common.loading_profile') + '</div></div>';
  }
}

// ========== ADMIN PANEL ==========
let adminCurrentTab = 'dashboard';
let adminUsersPage = 1;
let adminWithdrawalsPage = 1;
let adminLogsPage = 1;
let adminLuckyPage = 1;

async function renderAdminPanel() {
  const root = document.getElementById('mainContent');
  root.innerHTML = `<div class="container" style="padding:16px">
    <div class="admin-header">
      <h2 style="margin:0;font-size:20px">🛡 ${t('admin.title')}</h2>
    </div>
    <div class="admin-tabs">
      <button class="admin-tab ${adminCurrentTab==='dashboard'?'active':''}" onclick="adminSwitchTab('dashboard')">📊 ${t('admin.dashboard')}</button>
      <button class="admin-tab ${adminCurrentTab==='users'?'active':''}" onclick="adminSwitchTab('users')">👥 ${t('admin.users')}</button>
      <button class="admin-tab ${adminCurrentTab==='lucky'?'active':''}" onclick="adminSwitchTab('lucky')">🍀 Lucky</button>
      <button class="admin-tab ${adminCurrentTab==='withdrawals'?'active':''}" onclick="adminSwitchTab('withdrawals')">💸 ${t('admin.withdrawals')}</button>
      <button class="admin-tab ${adminCurrentTab==='broadcast'?'active':''}" onclick="adminSwitchTab('broadcast')">📢 ${t('admin.broadcast')}</button>
      <button class="admin-tab ${adminCurrentTab==='checks'?'active':''}" onclick="adminSwitchTab('checks')">🎁 ${t('admin.checks')}</button>
      <button class="admin-tab ${adminCurrentTab==='logs'?'active':''}" onclick="adminSwitchTab('logs')">📋 ${t('admin.logs')}</button>
    </div>
    <div id="adminContent" style="margin-top:12px"></div>
  </div>`;
  await adminLoadTab(adminCurrentTab);
}

window.adminSwitchTab = async function(tab) {
  adminCurrentTab = tab;
  await renderAdminPanel();
};

async function adminLoadTab(tab) {
  const c = document.getElementById('adminContent');
  if(!c) return;
  c.innerHTML = '<div style="text-align:center;padding:40px"><div class="loader"></div></div>';
  try {
    if(tab==='dashboard') await adminRenderDashboard(c);
    else if(tab==='users') await adminRenderUsers(c);
    else if(tab==='lucky') await adminRenderLucky(c);
    else if(tab==='withdrawals') await adminRenderWithdrawals(c);
    else if(tab==='broadcast') adminRenderBroadcast(c);
    else if(tab==='checks') adminRenderChecks(c);
    else if(tab==='logs') await adminRenderLogs(c);
  } catch(e) { c.innerHTML = `<div style="color:#FF5252;text-align:center;padding:20px">Ошибка: ${e.message}</div>`; }
}

async function adminRenderDashboard(c) {
  const r = await apiFetch('/api/admin/dashboard');
  if(!r.ok) { c.innerHTML = '<div style="color:#FF5252">Ошибка загрузки</div>'; return; }
  const s = r.stats;
  c.innerHTML = `
    <div class="admin-stats-grid">
      <div class="admin-stat-card"><div class="admin-stat-value">${s.total_users}</div><div class="admin-stat-label">${t('admin.total_users')}</div></div>
      <div class="admin-stat-card"><div class="admin-stat-value">${s.active_24h}</div><div class="admin-stat-label">${t('admin.active_24h')}</div></div>
      <div class="admin-stat-card"><div class="admin-stat-value">$${s.deposits_today}</div><div class="admin-stat-label">${t('admin.deposits_today')}</div></div>
      <div class="admin-stat-card"><div class="admin-stat-value">$${s.deposits_week}</div><div class="admin-stat-label">${t('admin.deposits_week')}</div></div>
      <div class="admin-stat-card"><div class="admin-stat-value">$${s.deposits_month}</div><div class="admin-stat-label">${t('admin.deposits_month')}</div></div>
      <div class="admin-stat-card"><div class="admin-stat-value" style="color:#FF5252">${s.pending_withdrawals}</div><div class="admin-stat-label">${t('admin.pending_wd')}</div></div>
      <div class="admin-stat-card"><div class="admin-stat-value">${s.active_trades}</div><div class="admin-stat-label">${t('admin.active_trades')}</div></div>
      <div class="admin-stat-card"><div class="admin-stat-value">$${s.total_balance}</div><div class="admin-stat-label">${t('admin.total_balance')}</div></div>
    </div>`;
}

async function adminRenderUsers(c, search='', filter='') {
  const params = new URLSearchParams({page: adminUsersPage, limit: 20});
  if(search) params.set('search', search);
  if(filter) params.set('filter', filter);
  const r = await apiFetch('/api/admin/users?' + params);
  if(!r.ok) { c.innerHTML = '<div style="color:#FF5252">Ошибка</div>'; return; }
  let html = `<div class="admin-search-bar">
    <input type="text" id="adminUserSearch" placeholder="${t('admin.search_placeholder')}" value="${search}" class="admin-input" />
    <select id="adminUserFilter" class="admin-select">
      <option value="">Все</option>
      <option value="premium" ${filter==='premium'?'selected':''}>Premium</option>
      <option value="blocked" ${filter==='blocked'?'selected':''}>Blocked</option>
      <option value="verified" ${filter==='verified'?'selected':''}>Verified</option>
      <option value="with_balance" ${filter==='with_balance'?'selected':''}>С балансом</option>
    </select>
    <button class="admin-action-btn" onclick="adminSearchUsers()">🔍</button>
  </div>
  <div class="admin-users-list">`;
  for(const u of r.users) {
    const bal = fmtNum(u.balance_usdt || 0, 2);
    const badges = [];
    if(u.is_premium) badges.push('⭐');
    if(u.is_verified) badges.push('✅');
    if(u.is_blocked) badges.push('🚫');
    html += `<div class="admin-user-row" onclick="adminOpenUser(${u.profile_id})">
      <div class="admin-user-info">
        <span class="admin-user-name">${u.username||'No name'} ${badges.join('')}</span>
        <span class="admin-user-id">ID: ${u.profile_id} | TG: ${u.telegram_id}</span>
      </div>
      <div class="admin-user-balance">$${bal}</div>
    </div>`;
  }
  html += '</div>';
  if(r.pages > 1) {
    html += `<div class="admin-pagination">
      ${adminUsersPage > 1 ? `<button class="admin-page-btn" onclick="adminUsersPage--;adminSearchUsers()">←</button>` : ''}
      <span>${adminUsersPage}/${r.pages}</span>
      ${adminUsersPage < r.pages ? `<button class="admin-page-btn" onclick="adminUsersPage++;adminSearchUsers()">→</button>` : ''}
    </div>`;
  }
  c.innerHTML = html;
}

window.adminSearchUsers = async function() {
  const search = document.getElementById('adminUserSearch')?.value || '';
  const filter = document.getElementById('adminUserFilter')?.value || '';
  const c = document.getElementById('adminContent');
  if(c) await adminRenderUsers(c, search, filter);
};

window.adminOpenUser = async function(profileId) {
  const c = document.getElementById('adminContent');
  if(!c) return;
  c.innerHTML = '<div style="text-align:center;padding:40px"><div class="loader"></div></div>';
  try {
    const r = await apiFetch('/api/admin/user/' + profileId);
    if(!r.ok) { c.innerHTML = '<div style="color:#FF5252">Ошибка загрузки</div>'; return; }
    const u = r.user;
    let html = `<button class="admin-back-btn" onclick="adminSwitchTab('users')">← ${t('admin.back')}</button>
    <div class="admin-user-card">
      <div class="admin-user-card-header">
        <h3>${u.username || 'No name'}</h3>
        <div class="admin-user-card-badges">
          ${u.is_verified ? '<span class="admin-badge admin-badge-green">✅ Verified</span>' : ''}
          ${u.is_premium ? '<span class="admin-badge admin-badge-gold">⭐ Premium</span>' : ''}
          ${u.is_blocked ? '<span class="admin-badge admin-badge-red">🚫 Blocked</span>' : ''}
        </div>
      </div>
      <div class="admin-user-details">
        <div class="admin-detail-row"><span>Profile ID:</span><span>${u.profile_id}</span></div>
        <div class="admin-detail-row"><span>Telegram ID:</span><span>${u.telegram_id}</span></div>
        <div class="admin-detail-row"><span>Balance:</span><span style="color:#00E676">$${u.balance_usdt}</span></div>
        <div class="admin-detail-row"><span>Referral Code:</span><span>${u.referral_code||'-'}</span></div>
        <div class="admin-detail-row"><span>Referred By:</span><span>${u.referred_by||'-'}</span></div>
        <div class="admin-detail-row"><span>Language:</span><span>${u.language||'ru'}</span></div>
        <div class="admin-detail-row"><span>Created:</span><span>${u.created_at ? new Date(u.created_at).toLocaleString() : '-'}</span></div>
      </div>
      <div class="admin-actions-section">
        <h4>${t('admin.balance_mgmt')}</h4>
        <div class="admin-balance-controls">
          <select id="adminBalAction" class="admin-select"><option value="add">+Add</option><option value="subtract">-Sub</option><option value="set">Set</option></select>
          <input type="number" id="adminBalAmount" class="admin-input" placeholder="Amount" step="0.01" />
          <button class="admin-action-btn admin-btn-green" onclick="adminChangeBalance(${u.profile_id})">💰</button>
        </div>
        <h4>${t('admin.status_mgmt')}</h4>
        <div class="admin-status-controls">
          <button class="admin-action-btn" onclick="adminToggleStatus(${u.profile_id},'verify')">${u.is_verified?'❌ Unverify':'✅ Verify'}</button>
          <button class="admin-action-btn" onclick="adminToggleStatus(${u.profile_id},'premium')">${u.is_premium?'❌ Unpremium':'⭐ Premium'}</button>
          ${u.is_blocked?`<button class="admin-action-btn admin-btn-green" onclick="adminToggleStatus(${u.profile_id},'unblock')">🔓 Unblock</button>`:`<button class="admin-action-btn admin-btn-red" onclick="adminBlockUser(${u.profile_id})">🚫 Block</button>`}
        </div>
        <h4>${t('admin.send_msg')}</h4>
        <div class="admin-msg-controls">
          <input type="text" id="adminMsgText" class="admin-input" placeholder="${t('admin.msg_placeholder')}" />
          <button class="admin-action-btn" onclick="adminSendMessage(${u.profile_id})">📨</button>
        </div>
      </div>
    </div>`;
    if(r.transactions && r.transactions.length) {
      html += `<h4 style="margin-top:16px">${t('admin.recent_txs')} (${r.transactions.length})</h4><div class="admin-table-wrap"><table class="admin-table"><tr><th>Type</th><th>Amount</th><th>Status</th><th>Date</th></tr>`;
      for(const tx of r.transactions.slice(0,20)) {
        html += `<tr><td>${tx.type}</td><td>${tx.amount} ${tx.currency}</td><td>${tx.status}</td><td>${tx.created_at?new Date(tx.created_at).toLocaleString():'-'}</td></tr>`;
      }
      html += '</table></div>';
    }
    if(r.trades && r.trades.length) {
      html += `<h4 style="margin-top:16px">${t('admin.recent_trades')} (${r.trades.length})</h4><div class="admin-table-wrap"><table class="admin-table"><tr><th>Pair</th><th>Side</th><th>Amount</th><th>Result</th><th>Payout</th></tr>`;
      for(const tr of r.trades.slice(0,20)) {
        const resColor = tr.result==='win'?'#00E676':tr.result==='loss'?'#FF5252':'#888';
        html += `<tr><td>${tr.pair}</td><td>${tr.side}</td><td>$${fmtNum(tr.amount_usdt, 0)}</td><td style="color:${resColor}">${(tr.result||tr.status).toUpperCase()}</td><td>$${fmtNum(tr.payout, 0)}</td></tr>`;
      }
      html += '</table></div>';
    }
    c.innerHTML = html;
  } catch(e) { c.innerHTML = `<div style="color:#FF5252">${e.message}</div>`; }
};

window.adminChangeBalance = async function(profileId) {
  const action = document.getElementById('adminBalAction')?.value || 'add';
  const amount = parseFloat(document.getElementById('adminBalAmount')?.value);
  if(!amount || amount <= 0) { toast('Введите сумму'); return; }
  const r = await apiFetch('/api/admin/user/' + profileId + '/balance', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action,amount,type:'real'})});
  if(r.ok) { toast(`✅ Баланс: $${r.balance_usdt}`); adminOpenUser(profileId); }
  else toast('❌ Ошибка: ' + (r.error||''));
};

window.adminToggleStatus = async function(profileId, action) {
  const r = await apiFetch('/api/admin/user/' + profileId + '/status', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action})});
  if(r.ok) { toast('✅ Обновлено'); adminOpenUser(profileId); }
  else toast('❌ Ошибка');
};

window.adminBlockUser = async function(profileId) {
  const reason = prompt('Причина блокировки:');
  if(!reason) return;
  const r = await apiFetch('/api/admin/user/' + profileId + '/status', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action:'block',reason})});
  if(r.ok) { toast('🚫 Заблокирован'); adminOpenUser(profileId); }
  else toast('❌ Ошибка');
};

window.adminSendMessage = async function(profileId) {
  const text = document.getElementById('adminMsgText')?.value;
  if(!text) { toast('Введите сообщение'); return; }
  const r = await apiFetch('/api/admin/user/' + profileId + '/message', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({text})});
  if(r.ok && r.message_sent) toast('📨 Отправлено');
  else toast('❌ Не удалось отправить');
};

async function adminRenderLucky(c, search='', filter='') {
  const params = new URLSearchParams({page: adminLuckyPage});
  if(search) params.set('search', search);
  if(filter) params.set('filter', filter);
  const r = await apiFetch('/api/admin/lucky/users?' + params);
  if(!r.ok) { c.innerHTML = '<div style="color:#FF5252">Ошибка</div>'; return; }
  let html = `<div class="admin-search-bar">
    <input type="text" id="adminLuckySearch" placeholder="Поиск по ID/username" value="${search}" class="admin-input" />
    <select id="adminLuckyFilter" class="admin-select"><option value="">Все</option><option value="on" ${filter==='on'?'selected':''}>🍀 ON</option><option value="off" ${filter==='off'?'selected':''}>OFF</option></select>
    <button class="admin-action-btn" onclick="adminSearchLucky()">🔍</button>
  </div><div class="admin-users-list">`;
  for(const u of r.users) {
    html += `<div class="admin-user-row" onclick="adminOpenLuckyUser('${u.telegram_id}', ${u.profile_id})">
      <div class="admin-user-info">
        <span class="admin-user-name">${u.username||'No name'} ${u.lucky_mode?'🍀':''}</span>
        <span class="admin-user-id">ID: ${u.profile_id} | $${u.balance_usdt}</span>
      </div>
      <div class="admin-lucky-status">${u.lucky_mode?'<span style="color:#00E676">ON</span>':'<span style="color:#888">OFF</span>'}</div>
    </div>`;
  }
  html += '</div>';
  if(r.pages > 1) {
    html += `<div class="admin-pagination">
      ${adminLuckyPage > 1 ? `<button class="admin-page-btn" onclick="adminLuckyPage--;adminSearchLucky()">←</button>` : ''}
      <span>${adminLuckyPage}/${r.pages}</span>
      ${adminLuckyPage < r.pages ? `<button class="admin-page-btn" onclick="adminLuckyPage++;adminSearchLucky()">→</button>` : ''}
    </div>`;
  }
  c.innerHTML = html;
}

window.adminSearchLucky = async function() {
  const search = document.getElementById('adminLuckySearch')?.value || '';
  const filter = document.getElementById('adminLuckyFilter')?.value || '';
  const c = document.getElementById('adminContent');
  if(c) await adminRenderLucky(c, search, filter);
};

window.adminOpenLuckyUser = async function(telegramId, profileId) {
  const c = document.getElementById('adminContent');
  if(!c) return;
  c.innerHTML = '<div style="text-align:center;padding:40px"><div class="loader"></div></div>';
  const rUser = await apiFetch('/api/admin/user/' + profileId);
  const rHist = await apiFetch('/api/admin/lucky/history/' + profileId);
  const u = rUser.user;
  let html = `<button class="admin-back-btn" onclick="adminSwitchTab('lucky')">← Назад</button>
  <div class="admin-user-card">
    <h3>🍀 Lucky Mode: ${u.username||'No name'}</h3>
    <div class="admin-user-details">
      <div class="admin-detail-row"><span>Telegram ID:</span><span>${u.telegram_id}</span></div>
      <div class="admin-detail-row"><span>Balance:</span><span>$${fmtNum(u.balance_usdt||0, 2)}</span></div>
    </div>
    <div class="admin-lucky-controls">
      <h4>Настройки Lucky Mode</h4>
      <div class="admin-lucky-form">
        <label>Включить</label>
        <select id="luckyEnabled" class="admin-select"><option value="true">ON 🍀</option><option value="false">OFF</option></select>
        <label>Причина (обязательно)</label>
        <input type="text" id="luckyReason" class="admin-input" placeholder="Причина" />
        <label>До (дата, необязательно)</label>
        <input type="datetime-local" id="luckyUntil" class="admin-input" />
        <label>Макс. побед (необязательно)</label>
        <input type="number" id="luckyMaxWins" class="admin-input" placeholder="Без лимита" />
        <button class="admin-action-btn admin-btn-green" onclick="adminSetLucky('${telegramId}', ${profileId})" style="margin-top:8px;width:100%">💾 Сохранить</button>
      </div>
    </div>
  </div>`;
  if(rHist.ok && rHist.history && rHist.history.length) {
    html += `<h4 style="margin-top:16px">📋 История Lucky</h4><div class="admin-table-wrap"><table class="admin-table"><tr><th>Action</th><th>Before</th><th>After</th><th>Reason</th><th>Date</th></tr>`;
    for(const h of rHist.history) {
      html += `<tr><td>${h.action}</td><td style="font-size:11px">${h.before||'-'}</td><td style="font-size:11px">${h.after||'-'}</td><td>${h.reason||'-'}</td><td>${h.created_at?new Date(h.created_at).toLocaleString():'-'}</td></tr>`;
    }
    html += '</table></div>';
  }
  c.innerHTML = html;
};

window.adminSetLucky = async function(telegramId, profileId) {
  const enabled = document.getElementById('luckyEnabled')?.value === 'true';
  const reason = document.getElementById('luckyReason')?.value;
  if(!reason) { toast('Укажите причину'); return; }
  const until = document.getElementById('luckyUntil')?.value || null;
  const maxWins = parseInt(document.getElementById('luckyMaxWins')?.value) || null;
  const r = await apiFetch('/api/admin/lucky/set', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({target_telegram_id: telegramId, enabled, reason, until, max_wins: maxWins})});
  if(r.ok) { toast(enabled ? '🍀 Lucky Mode ON' : 'Lucky Mode OFF'); adminOpenLuckyUser(telegramId, profileId); }
  else toast('❌ ' + (r.error||'Ошибка'));
};

async function adminRenderWithdrawals(c) {
  const params = new URLSearchParams({page: adminWithdrawalsPage, limit: 20, status: 'pending'});
  const r = await apiFetch('/api/admin/withdrawals?' + params);
  if(!r.ok) { c.innerHTML = '<div style="color:#FF5252">Ошибка</div>'; return; }
  let html = `<div class="admin-search-bar">
    <select id="adminWdFilter" class="admin-select" onchange="adminFilterWithdrawals()">
      <option value="pending">⏳ Pending</option><option value="completed">✅ Completed</option><option value="cancelled">❌ Cancelled</option><option value="all">All</option>
    </select>
  </div>`;
  if(!r.withdrawals.length) {
    html += `<div style="text-align:center;padding:40px;color:#5A6577">${t('admin.no_withdrawals')}</div>`;
  } else {
    html += '<div class="admin-withdrawals-list">';
    for(const w of r.withdrawals) {
      html += `<div class="admin-wd-card">
        <div class="admin-wd-header">
          <span class="admin-wd-user" onclick="adminOpenUser(${w.profile_id})">${w.username||'User'} (ID: ${w.profile_id})</span>
          <span class="admin-wd-amount">$${w.amount_rub}</span>
        </div>
        <div class="admin-wd-details">
          <div>📋 Address: <span style="font-size:11px;word-break:break-all">${w.card_number||'-'}</span></div>
          <div>🌐 Network: ${w.full_name||'-'}</div>
          <div>📅 ${w.created_at?new Date(w.created_at).toLocaleString():'-'}</div>
        </div>
        ${w.status==='pending'?`<div class="admin-wd-actions">
          <button class="admin-action-btn admin-btn-green" onclick="adminWdAction(${w.id},'approve')">✅ Approve</button>
          <button class="admin-action-btn admin-btn-red" onclick="adminWdAction(${w.id},'reject')">❌ Reject</button>
        </div>`:`<div class="admin-wd-status admin-wd-status-${w.status}">${w.status.toUpperCase()}</div>`}
      </div>`;
    }
    html += '</div>';
  }
  if(r.pages > 1) {
    html += `<div class="admin-pagination">
      ${adminWithdrawalsPage > 1 ? `<button class="admin-page-btn" onclick="adminWithdrawalsPage--;adminFilterWithdrawals()">←</button>` : ''}
      <span>${adminWithdrawalsPage}/${r.pages}</span>
      ${adminWithdrawalsPage < r.pages ? `<button class="admin-page-btn" onclick="adminWithdrawalsPage++;adminFilterWithdrawals()">→</button>` : ''}
    </div>`;
  }
  c.innerHTML = html;
}

window.adminFilterWithdrawals = async function() {
  const c = document.getElementById('adminContent');
  if(c) await adminRenderWithdrawals(c);
};

window.adminWdAction = async function(wdId, action) {
  let reason = '';
  if(action === 'reject') { reason = prompt('Причина отказа:'); if(!reason) return; }
  const r = await apiFetch('/api/admin/withdrawal/' + wdId + '/action', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action, reason})});
  if(r.ok) { toast(action==='approve'?'✅ Одобрено':'❌ Отклонено'); adminRenderWithdrawals(document.getElementById('adminContent')); }
  else toast('❌ ' + (r.error||'Ошибка'));
};

function adminRenderBroadcast(c) {
  c.innerHTML = `<div class="admin-user-card">
    <h4>📢 ${t('admin.broadcast')}</h4>
    <div class="admin-broadcast-form">
      <label>Фильтр пользователей</label>
      <select id="adminBroadcastFilter" class="admin-select">
        <option value="">Все пользователи</option>
        <option value="premium">Premium</option>
        <option value="verified">Verified</option>
        <option value="with_balance">С балансом</option>
      </select>
      <label>Сообщение (HTML)</label>
      <textarea id="adminBroadcastText" class="admin-textarea" rows="6" placeholder="Текст рассылки..."></textarea>
      <button class="admin-action-btn admin-btn-green" onclick="adminSendBroadcast()" style="margin-top:8px;width:100%">📢 Отправить рассылку</button>
    </div>
  </div>`;
}

window.adminSendBroadcast = async function() {
  const text = document.getElementById('adminBroadcastText')?.value;
  if(!text) { toast('Введите сообщение'); return; }
  const filter = document.getElementById('adminBroadcastFilter')?.value || null;
  if(!confirm('Отправить рассылку?')) return;
  toast('📢 Отправка...');
  const r = await apiFetch('/api/admin/broadcast', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({text, filter})});
  if(r.ok) toast(`✅ Отправлено: ${r.sent}, Ошибок: ${r.failed}`);
  else toast('❌ Ошибка');
};

function adminRenderChecks(c) {
  c.innerHTML = `<div class="admin-user-card">
    <h4>🎁 ${t('admin.create_check')}</h4>
    <div class="admin-check-form">
      <label>Сумма (USDT)</label>
      <input type="number" id="adminCheckAmount" class="admin-input" placeholder="10.00" step="0.01" />
      <label>Срок действия (часов)</label>
      <input type="number" id="adminCheckHours" class="admin-input" value="24" />
      <button class="admin-action-btn admin-btn-green" onclick="adminCreateCheck()" style="margin-top:8px;width:100%">🎁 Создать чек</button>
    </div>
    <div id="adminCheckResult"></div>
  </div>`;
}

window.adminCreateCheck = async function() {
  const amount_usdt = parseFloat(document.getElementById('adminCheckAmount')?.value);
  const expires_in_hours = parseInt(document.getElementById('adminCheckHours')?.value) || 24;
  if(!amount_usdt || amount_usdt <= 0) { toast('Введите сумму'); return; }
  const r = await apiFetch('/api/admin/check/create', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({amount_usdt, expires_in_hours})});
  const res = document.getElementById('adminCheckResult');
  if(r.ok) {
    res.innerHTML = `<div class="admin-check-success">
      <div style="color:#00E676;font-weight:bold;margin-bottom:8px">✅ Чек создан!</div>
      <div>💰 Сумма: $${fmtNum(r.amount_usdt, 2)}</div>
      <div>🔗 Ссылка:</div>
      <input type="text" value="${r.check_link}" class="admin-input" style="margin-top:4px" readonly onclick="this.select();document.execCommand('copy');toast('📋 Скопировано')" />
      <div style="margin-top:4px;font-size:12px;color:#5A6577">Код: ${r.check_code}</div>
      <div style="font-size:12px;color:#5A6577">Истекает: ${new Date(r.expires_at).toLocaleString()}</div>
    </div>`;
    toast('✅ Чек создан');
  } else { res.innerHTML = `<div style="color:#FF5252;margin-top:8px">${r.error||'Ошибка'}</div>`; }
};

async function adminRenderLogs(c) {
  const params = new URLSearchParams({page: adminLogsPage, limit: 50});
  const r = await apiFetch('/api/admin/logs?' + params);
  if(!r.ok) { c.innerHTML = '<div style="color:#FF5252">Ошибка</div>'; return; }
  let html = '<div class="admin-table-wrap"><table class="admin-table"><tr><th>Action</th><th>User</th><th>Before</th><th>After</th><th>Reason</th><th>Date</th></tr>';
  for(const log of r.logs) {
    html += `<tr><td>${log.action}</td><td>${log.user_id||'-'}</td><td style="font-size:11px;max-width:100px;overflow:hidden">${log.before_value||'-'}</td><td style="font-size:11px;max-width:100px;overflow:hidden">${log.after_value||'-'}</td><td>${log.reason||'-'}</td><td style="white-space:nowrap">${log.created_at?new Date(log.created_at).toLocaleString():'-'}</td></tr>`;
  }
  html += '</table></div>';
  if(r.pages > 1) {
    html += `<div class="admin-pagination">
      ${adminLogsPage > 1 ? `<button class="admin-page-btn" onclick="adminLogsPage--;adminLoadTab('logs')">←</button>` : ''}
      <span>${adminLogsPage}/${r.pages}</span>
      ${adminLogsPage < r.pages ? `<button class="admin-page-btn" onclick="adminLogsPage++;adminLoadTab('logs')">→</button>` : ''}
    </div>`;
  }
  c.innerHTML = html;
}

window.addEventListener('DOMContentLoaded', async ()=>{
  // FORCE CLEAR old language settings (one-time migration)
  const migrationVersion = localStorage.getItem('lang_migration_v2');
  if (!migrationVersion) {
    localStorage.removeItem('lang');
    localStorage.removeItem('lang_manual');
    localStorage.setItem('lang_migration_v2', 'done');
  }
  
  await loadTranslations();
  setLang(i18n.lang);
  await ensureUser();
  await renderAssets(); // Wait for initial data to load
  
  // Initialize notifications button
  const btnNotifications = document.getElementById('btnNotifications');
  if (btnNotifications) {
    btnNotifications.onclick = () => openNotificationsModal();
  }
  await loadNotificationsCount();
  
  // Check if there's a check code in URL
  const urlParams = new URLSearchParams(window.location.search);
  const checkCode = urlParams.get('check');
  if (checkCode) {
    // Show activation dialog
    setTimeout(async () => {
      const confirm = window.confirm(`${t('gift.activate_confirm')}\n${t('gift.code_label')}: ${checkCode}`);
      if (confirm) {
        await activateCheck(checkCode);
        // Remove check from URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }, 1000);
  }
  
  // Hide splash screen after everything is loaded (minimum 1.2s for UX)
  setTimeout(() => {
    hideSplashScreen();
  }, 800); // Shorter delay since we already waited for renderAssets()
  
  function navTransition(renderFn, tabName) {
    return async () => {
      const root = document.getElementById('root');
      if (!root) return;
      if (tg?.HapticFeedback) tg.HapticFeedback.selectionChanged();
      root.style.transition = 'opacity 0.15s ease, transform 0.15s ease';
      root.style.opacity = '0';
      root.style.transform = 'translateY(8px)';
      await new Promise(r => setTimeout(r, 150));
      await renderFn();
      root.style.transition = 'opacity 0.25s ease, transform 0.25s cubic-bezier(0.34,1.56,0.64,1)';
      root.style.opacity = '1';
      root.style.transform = 'translateY(0)';
    };
  }

  const a=document.querySelector('.nav-item[data-tab="assets"]');
  const tradeTab=document.querySelector('.nav-item[data-tab="trade"]');
  const s=document.querySelector('.nav-item[data-tab="referrals"]');
  if(a) a.onclick = navTransition(renderAssets, 'assets');
  if(tradeTab) tradeTab.onclick = navTransition(renderTrade, 'trade');
  if(s) s.onclick = navTransition(renderReferrals, 'referrals');
  const profileTab = document.querySelector('.nav-item[data-tab="profile"]');
  if(profileTab) profileTab.onclick = navTransition(() => {
    if(userData?.is_admin) return renderAdminPanel();
    else return renderProfile();
  }, 'profile');

  const btnLang=document.getElementById('btnLang');
  if(btnLang){ btnLang.onclick = ()=>{ setLang(i18n.lang==='ru'?'en':'ru', true); toast(t('toast.saved')); }; }
});

// -------- Pull to Refresh ----------
let currentTab = 'assets';
let pullStartY = 0;
let isPulling = false;
let isRefreshing = false;

function initPullToRefresh() {
  const indicator = document.getElementById('pullIndicator');
  const pullText = document.getElementById('pullText');
  const pullArrow = indicator?.querySelector('.pull-arrow');
  if (!indicator) return;
  
  const threshold = 80;
  
  document.addEventListener('touchstart', (e) => {
    if (isRefreshing) return;
    if (window.scrollY <= 0) {
      pullStartY = e.touches[0].clientY;
      isPulling = true;
    }
  }, { passive: true });
  
  document.addEventListener('touchmove', (e) => {
    if (!isPulling || isRefreshing) return;
    
    const pullDistance = e.touches[0].clientY - pullStartY;
    
    if (pullDistance > 0 && window.scrollY <= 0) {
      const progress = Math.min(pullDistance / threshold, 1);
      
      if (pullDistance > 20) {
        indicator.classList.add('visible');
        
        if (pullDistance >= threshold) {
          pullText.textContent = t('pull.release');
          pullArrow.classList.add('rotated');
        } else {
          pullText.textContent = t('pull.refresh');
          pullArrow.classList.remove('rotated');
        }
      }
    }
  }, { passive: true });
  
  document.addEventListener('touchend', async () => {
    if (!isPulling || isRefreshing) return;
    isPulling = false;
    
    const indicator = document.getElementById('pullIndicator');
    const pullText = document.getElementById('pullText');
    const pullArrow = indicator?.querySelector('.pull-arrow');
    
    if (pullArrow?.classList.contains('rotated')) {
      isRefreshing = true;
      pullText.textContent = t('pull.refreshing');
      pullArrow.classList.remove('rotated');
      indicator.classList.add('refreshing');
      
      // Haptic feedback
      if (tg?.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('medium');
      }
      
      // Refresh current tab
      try {
        const activeTab = document.querySelector('.nav-item.active');
        const tab = activeTab?.dataset?.tab || 'assets';
        
        if (tab === 'assets') await renderAssets();
        else if (tab === 'trade') await renderTrade();
        else if (tab === 'referrals') await renderReferrals();
        else if (tab === 'profile') {
          if(userData?.is_admin) await renderAdminPanel();
          else await renderProfile();
        }
        
        toast(t('common.updated'));
      } catch (e) {
        console.error('Refresh failed', e);
      }
      
      setTimeout(() => {
        indicator.classList.remove('visible', 'refreshing');
        isRefreshing = false;
      }, 300);
    } else {
      indicator.classList.remove('visible');
    }
  });
}

// Initialize pull-to-refresh after DOM loaded
setTimeout(initPullToRefresh, 1000);