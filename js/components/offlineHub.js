/**
 * js/components/offlineHub.js — ExploreDesh Go Global Offline Hub & Companion
 * 
 * Provides:
 * - Slide-in glassmorphism Drawer / Modal for offline pocket guides
 * - Himalayan & Remote Safari Emergency SOS Toolkit with direct dialers
 * - High-Altitude Sickness (AMS) mitigation & Lake Louise assessment
 * - Device storage manager with StorageManager quota visualization
 * - Native PWA install prompt handler (beforeinstallprompt)
 * - Real-time ambient network connectivity status bar (online / offline)
 */

import { icon } from './icons.js';
import { esc } from '../utils/format.js';
import {
  getAllOfflineGuides,
  removeDestinationOffline,
  clearAllOfflineData,
  getStorageMetrics,
  getEmergencyToolkit,
  formatBytes
} from '../utils/offlineStorage.js';

let isInitialized = false;
let deferredInstallPrompt = null;
let currentTab = 'saved'; // 'saved' | 'emergency' | 'storage'

/**
 * Register Service Worker across any page with graceful fallback
 */
export function registerServiceWorker() {
  if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          console.info('[ExploreDesh Go] Service Worker active with scope:', reg.scope);
          // Check for worker updates
          reg.addEventListener('updatefound', () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.addEventListener('statechange', () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.info('[ExploreDesh Go] New version available.');
                }
              });
            }
          });
        })
        .catch((err) => {
          console.warn('[ExploreDesh Go] Service Worker registration failed:', err);
        });
    });
  }
}

/**
 * Capture PWA install prompt
 */
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  const installBtn = document.getElementById('hubInstallAppBtn');
  if (installBtn) installBtn.style.display = 'inline-flex';
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  const installBtn = document.getElementById('hubInstallAppBtn');
  if (installBtn) installBtn.style.display = 'none';
  console.info('[ExploreDesh Go] App installed successfully');
});

/**
 * Setup Ambient Network Bar (Online / Offline detection)
 */
function setupNetworkBar() {
  let bar = document.getElementById('networkStatusBar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'networkStatusBar';
    bar.className = 'network-status-bar hidden';
    bar.setAttribute('role', 'status');
    bar.setAttribute('aria-live', 'polite');
    document.body.prepend(bar);
  }

  function updateStatus(isOnline) {
    if (!isOnline) {
      bar.innerHTML = `
        <div class="network-status-content">
          <span class="network-status-icon">${icon('wifi-off', { size: 16 })}</span>
          <span class="network-status-text">
            <strong>Offline Mode Active</strong> — ExploreDesh Go is protecting your trip. Saved pocket guides and SOS tools are ready.
          </span>
          <button type="button" class="network-status-btn" id="netBarOpenHubBtn">Open Guides</button>
        </div>
      `;
      bar.classList.remove('hidden', 'network-online');
      bar.classList.add('network-offline');
      const btn = document.getElementById('netBarOpenHubBtn');
      if (btn) btn.onclick = () => openOfflineHub('saved');
    } else {
      // If was previously offline, show green flash
      if (bar.classList.contains('network-offline')) {
        bar.innerHTML = `
          <div class="network-status-content">
            <span class="network-status-icon">${icon('check', { size: 16 })}</span>
            <span class="network-status-text">
              <strong>Back Online!</strong> Connected to high-speed internet.
            </span>
          </div>
        `;
        bar.classList.remove('network-offline');
        bar.classList.add('network-online');
        setTimeout(() => {
          bar.classList.add('hidden');
          bar.classList.remove('network-online');
        }, 3500);
      } else {
        bar.classList.add('hidden');
      }
    }
  }

  window.addEventListener('offline', () => updateStatus(false));
  window.addEventListener('online', () => updateStatus(true));

  if (!navigator.onLine) {
    updateStatus(false);
  }
}

/**
 * Inject the Offline Hub markup into the DOM
 */
function injectHubMarkup() {
  if (document.getElementById('exploreDeshGoModal')) return;

  const modal = document.createElement('div');
  modal.id = 'exploreDeshGoModal';
  modal.className = 'go-hub-backdrop hidden';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'goHubTitle');

  modal.innerHTML = `
    <div class="go-hub-drawer" id="goHubDrawer">
      <!-- Drawer Header -->
      <div class="go-hub-header">
        <div class="flex items-center gap-3">
          <span class="brand-mark">${icon('mountain', { size: 20 })}</span>
          <div>
            <div class="flex items-center gap-2">
              <h2 id="goHubTitle" class="font-bold text-lg text-white">ExploreDesh <span class="text-primary">Go</span></h2>
              <span class="go-badge-pill">📴 Offline Pocket Guide</span>
            </div>
            <p class="text-xs text-gray-400">Zero-connectivity companion for Himalayan passes & safaris</p>
          </div>
        </div>
        <button type="button" class="go-close-btn" id="goHubCloseBtn" aria-label="Close offline hub">✕</button>
      </div>

      <!-- Live Connectivity Status Indicator -->
      <div class="go-connection-indicator" id="goConnectionIndicator">
        <span class="conn-dot ${navigator.onLine ? 'online' : 'offline'}"></span>
        <span class="conn-text">${navigator.onLine ? '🟢 Connected to Internet' : '📴 Zero Signal / Offline Active'}</span>
      </div>

      <!-- Navigation Tabs -->
      <div class="go-tabs-bar" role="tablist">
        <button type="button" class="go-tab-btn active" id="tabBtnSaved" data-tab="saved" role="tab" aria-selected="true">
          ${icon('download', { size: 16 })}
          <span>Saved Guides (<span id="savedCountBadge">0</span>)</span>
        </button>
        <button type="button" class="go-tab-btn" id="tabBtnEmergency" data-tab="emergency" role="tab" aria-selected="false">
          ${icon('shield-check', { size: 16 })}
          <span>Emergency & AMS</span>
        </button>
        <button type="button" class="go-tab-btn" id="tabBtnStorage" data-tab="storage" role="tab" aria-selected="false">
          ${icon('hard-drive', { size: 16 })}
          <span>Storage & App</span>
        </button>
      </div>

      <!-- Tab Body -->
      <div class="go-tab-body">
        <!-- 1. Saved Guides Panel -->
        <div class="go-panel" id="panelSaved" role="tabpanel">
          <div class="go-search-wrap">
            <span class="search-icon">${icon('search', { size: 15 })}</span>
            <input type="text" id="goGuideSearchInput" class="go-search-input" placeholder="Search saved offline destinations..." />
          </div>
          <div id="goSavedGuidesList" class="go-guides-list">
            <!-- Populated via renderSavedGuides() -->
          </div>
        </div>

        <!-- 2. Emergency & Himalayan SOS Panel -->
        <div class="go-panel hidden" id="panelEmergency" role="tabpanel">
          <div id="goEmergencyContent" class="go-emergency-wrap">
            <!-- Populated via renderEmergencyToolkit() -->
          </div>
        </div>

        <!-- 3. Storage & PWA Panel -->
        <div class="go-panel hidden" id="panelStorage" role="tabpanel">
          <div id="goStorageContent" class="go-storage-wrap">
            <!-- Populated via renderStorageManager() -->
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Wire events
  document.getElementById('goHubCloseBtn').onclick = closeOfflineHub;
  modal.onclick = (e) => {
    if (e.target === modal) closeOfflineHub();
  };
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
      closeOfflineHub();
    }
  });

  const tabs = modal.querySelectorAll('.go-tab-btn');
  tabs.forEach((tab) => {
    tab.onclick = () => {
      switchTab(tab.getAttribute('data-tab'));
    };
  });

  const searchInput = document.getElementById('goGuideSearchInput');
  if (searchInput) {
    searchInput.oninput = (e) => {
      renderSavedGuides(e.target.value.trim().toLowerCase());
    };
  }
}

/**
 * Switch tab in the Offline Hub
 */
function switchTab(tabId) {
  currentTab = tabId;
  const modal = document.getElementById('exploreDeshGoModal');
  if (!modal) return;

  const tabs = modal.querySelectorAll('.go-tab-btn');
  tabs.forEach((btn) => {
    const isTarget = btn.getAttribute('data-tab') === tabId;
    btn.classList.toggle('active', isTarget);
    btn.setAttribute('aria-selected', isTarget ? 'true' : 'false');
  });

  document.getElementById('panelSaved').classList.toggle('hidden', tabId !== 'saved');
  document.getElementById('panelEmergency').classList.toggle('hidden', tabId !== 'emergency');
  document.getElementById('panelStorage').classList.toggle('hidden', tabId !== 'storage');

  if (tabId === 'saved') renderSavedGuides();
  if (tabId === 'emergency') renderEmergencyToolkit();
  if (tabId === 'storage') renderStorageManager();
}

/**
 * Render Saved Offline Guides List
 */
async function renderSavedGuides(filterQuery = '') {
  const container = document.getElementById('goSavedGuidesList');
  const countBadge = document.getElementById('savedCountBadge');
  if (!container) return;

  const guides = await getAllOfflineGuides();
  if (countBadge) countBadge.textContent = guides.length;

  const filtered = filterQuery
    ? guides.filter((g) => (g.title + ' ' + g.state + ' ' + g.type).toLowerCase().includes(filterQuery))
    : guides;

  if (filtered.length === 0) {
    if (guides.length === 0) {
      container.innerHTML = `
        <div class="go-empty-state">
          <div class="go-empty-icon">${icon('download', { size: 36 })}</div>
          <h3 class="text-white font-bold text-base mb-1">No Offline Guides Downloaded Yet</h3>
          <p class="text-gray-400 text-xs leading-relaxed max-w-xs mb-4">
            Visiting Ladakh, Spiti, Jim Corbett, or coastal waterways? Open any destination page and tap <strong>"Save Pocket Guide"</strong> to keep full travel details ready when cellular signal drops.
          </p>
          <a href="/destinations.html" class="go-action-btn primary" id="goBrowseDestBtn">
            ${icon('map', { size: 16 })} Browse Destinations to Save
          </a>
        </div>
      `;
      // Wire browse link via JS (module scope — avoid inline onclick string)
      const browseBtn = document.getElementById('goBrowseDestBtn');
      if (browseBtn) browseBtn.addEventListener('click', closeOfflineHub);
    } else {
      container.innerHTML = `
        <div class="go-empty-state">
          <p class="text-gray-400 text-xs">No saved guides matching "${esc(filterQuery)}".</p>
        </div>
      `;
    }
    return;
  }

  container.innerHTML = filtered.map((guide) => {
    const isAltitude = guide.altitude && guide.altitude >= 2400;
    const destUrl = `/destination.html?slug=${encodeURIComponent(guide.slug)}`;
    const heroSrc = guide.heroImage || '/images/destinations-immersive-bg.webp';

    return `
      <div class="go-guide-card" data-slug="${esc(guide.slug)}">
        <img src="${esc(heroSrc)}" alt="${esc(guide.title)}" class="go-guide-thumb" loading="lazy" />
        <div class="go-guide-info">
          <div class="flex items-center justify-between gap-2">
            <h4 class="font-bold text-white text-sm tracking-tight truncate">${esc(guide.title)}</h4>
            <span class="go-size-tag">${formatBytes(guide.sizeBytes)}</span>
          </div>
          <p class="text-xs text-gray-400 truncate">${esc(guide.state || 'India')} • <span class="capitalize">${esc(guide.type || 'Travel')}</span></p>
          <div class="flex items-center gap-1.5 mt-1.5 flex-wrap">
            ${isAltitude ? `<span class="go-altitude-tag">🏔️ ${guide.altitude}m AMS Alert</span>` : ''}
            <span class="go-status-pill">✓ Saved Offline</span>
          </div>
        </div>
        <div class="go-guide-actions">
          <a href="${destUrl}" class="go-btn-open" title="Open Pocket Guide">Open</a>
          <button type="button" class="go-btn-delete" data-slug="${esc(guide.slug)}" title="Delete to free device storage" aria-label="Delete ${esc(guide.title)} offline guide">
            ${icon('trash', { size: 15 })}
          </button>
          <button type="button" class="go-btn-delete-confirm hidden" data-slug="${esc(guide.slug)}" title="Confirm delete" style="background:rgba(239,68,68,0.25);border:1px solid rgba(239,68,68,0.6);color:#F87171;padding:4px 10px;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;">
            Sure?
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Wire delete buttons — inline confirm pattern (no confirm() dialog needed)
  container.querySelectorAll('.go-btn-delete').forEach((btn) => {
    const slug = btn.getAttribute('data-slug');
    const card = btn.closest('.go-guide-card');
    const confirmBtn = card ? card.querySelector('.go-btn-delete-confirm') : null;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      // Show confirm button, hide trash icon button
      btn.classList.add('hidden');
      if (confirmBtn) confirmBtn.classList.remove('hidden');
      // Auto-reset after 3s if user doesn't confirm
      setTimeout(() => {
        btn.classList.remove('hidden');
        if (confirmBtn) confirmBtn.classList.add('hidden');
      }, 3000);
    });

    if (confirmBtn) {
      confirmBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Removing…';
        try {
          await removeDestinationOffline(slug);
          await renderSavedGuides();
        } catch (err) {
          console.error('[ExploreDesh Go] Delete failed:', err);
          confirmBtn.disabled = false;
          confirmBtn.textContent = 'Sure?';
        }
      });
    }
  });
}

/**
 * Render Himalayan & Safari Emergency SOS Toolkit
 */
async function renderEmergencyToolkit() {
  const container = document.getElementById('goEmergencyContent');
  if (!container) return;

  const data = await getEmergencyToolkit();

  const sosCards = (data.sos_contacts || []).map((c) => `
    <a href="tel:${esc(c.number)}" class="go-sos-call-card" title="Direct dial ${esc(c.number)}">
      <div class="flex items-center gap-3">
        <span class="go-sos-icon-slot">${icon(c.icon || 'phone-call', { size: 18 })}</span>
        <div>
          <h4 class="font-bold text-white text-sm leading-snug">${esc(c.name)}</h4>
          <p class="text-xs text-gray-400 leading-tight">${esc(c.desc)}</p>
        </div>
      </div>
      <div class="go-sos-num-badge">
        <span>${icon('phone-call', { size: 13 })}</span>
        <span>${esc(c.number)}</span>
      </div>
    </a>
  `).join('');

  const alt = data.altitude_protocol || {};
  const safari = data.wildlife_safari_rules || {};
  const coastal = data.coastal_backwaters_rules || {};

  container.innerHTML = `
    <!-- Top Emergency Notice -->
    <div class="go-emergency-banner">
      <span class="alert-icon">${icon('alert-triangle', { size: 20 })}</span>
      <div>
        <h4 class="font-bold text-amber-300 text-sm">Offline Mountain & Safari SOS Directory</h4>
        <p class="text-xs text-amber-100/80">These emergency numbers and protocols are stored locally on your device and are accessible with zero internet coverage.</p>
      </div>
    </div>

    <!-- Direct Dial Grid -->
    <div class="go-sos-grid">
      ${sosCards}
    </div>

    <!-- High-Altitude Sickness (AMS) Accordion -->
    <details class="go-accordion" open>
      <summary class="go-acc-summary">
        <span class="flex items-center gap-2 font-bold text-sm text-white">
          <span>🏔️</span> ${esc(alt.title || 'High-Altitude Sickness (AMS) Protocol')}
        </span>
        <span class="acc-chevron">${icon('chevron-right', { size: 16 })}</span>
      </summary>
      <div class="go-acc-body">
        <div class="go-golden-rule">
          <strong>Golden Mountain Rule:</strong> ${esc(alt.golden_rule || '')}
        </div>
        <h5 class="text-xs font-bold text-amber-300 uppercase tracking-wider mb-1 mt-2">Recognize AMS Symptoms</h5>
        <ul class="go-check-list">
          ${(alt.symptoms || []).map((s) => `<li>${esc(s)}</li>`).join('')}
        </ul>
        <h5 class="text-xs font-bold text-amber-300 uppercase tracking-wider mb-1 mt-3">Action Checklist</h5>
        <ul class="go-check-list">
          ${(alt.action_checklist || []).map((a) => `<li>${esc(a)}</li>`).join('')}
        </ul>
      </div>
    </details>

    <!-- Forest & Safari Safety Accordion -->
    <details class="go-accordion">
      <summary class="go-acc-summary">
        <span class="flex items-center gap-2 font-bold text-sm text-white">
          <span>🐯</span> ${esc(safari.title || 'Forest Core & Safari Safety')}
        </span>
        <span class="acc-chevron">${icon('chevron-right', { size: 16 })}</span>
      </summary>
      <div class="go-acc-body">
        <p class="text-xs text-gray-400 mb-2">Applies to: ${esc(safari.zones || '')}</p>
        <ul class="go-check-list">
          ${(safari.guidelines || []).map((g) => `<li>${esc(g)}</li>`).join('')}
        </ul>
      </div>
    </details>

    <!-- Coastal & Backwaters Safety Accordion -->
    <details class="go-accordion">
      <summary class="go-acc-summary">
        <span class="flex items-center gap-2 font-bold text-sm text-white">
          <span>⛵</span> ${esc(coastal.title || 'Coastal & Backwater Waterway Safety')}
        </span>
        <span class="acc-chevron">${icon('chevron-right', { size: 16 })}</span>
      </summary>
      <div class="go-acc-body">
        <p class="text-xs text-gray-400 mb-2">Applies to: ${esc(coastal.zones || '')}</p>
        <ul class="go-check-list">
          ${(coastal.guidelines || []).map((g) => `<li>${esc(g)}</li>`).join('')}
        </ul>
      </div>
    </details>
  `;
}

/**
 * Render Device Storage & PWA Management
 */
async function renderStorageManager() {
  const container = document.getElementById('goStorageContent');
  if (!container) return;

  const metrics = await getStorageMetrics();

  // Detect install prompt availability
  const canInstall = !!deferredInstallPrompt;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

  let installBtnLabel = 'Install Standalone App';
  let installBtnNote = 'Supported on Chrome, Edge, Safari (Add to Home Screen), and Android.';
  if (isStandalone) {
    installBtnLabel = '✅ App Already Installed';
    installBtnNote = 'ExploreDesh Go is running as an installed standalone app.';
  } else if (isIOS) {
    installBtnLabel = 'Add to Home Screen (Safari)';
    installBtnNote = 'Tap the Share icon (⎋) in Safari → "Add to Home Screen" → Add';
  } else if (!canInstall) {
    installBtnLabel = 'Install via Browser Menu';
    installBtnNote = 'Click the install icon (⊕) in Chrome/Edge address bar, or use browser menu → "Install app".';
  }

  container.innerHTML = `
    <!-- Storage Meter Card -->
    <div class="go-storage-card">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-bold text-white flex items-center gap-2">
          ${icon('hard-drive', { size: 18 })} Device Storage Quota
        </span>
        <span class="text-xs text-amber-400 font-semibold">${metrics.guidesFormatted || '0 KB'} in guides</span>
      </div>
      <div class="go-progress-track">
        <div class="go-progress-fill" style="width: ${Math.max(4, metrics.percentUsed)}%"></div>
      </div>
      <div class="flex items-center justify-between text-xs text-gray-400 mt-2">
        <span>${metrics.guideCount} Pocket Guide${metrics.guideCount === 1 ? '' : 's'} (${metrics.guidesFormatted || '0 KB'})</span>
        <span>App Shell & Cache: ${metrics.usageFormatted}</span>
      </div>
    </div>

    <!-- PWA Install Card -->
    <div class="go-install-card">
      <div class="flex items-center gap-3">
        <img src="/images/pwa-icon-192.png" alt="ExploreDesh Go" class="w-12 h-12 rounded-xl shadow-lg" />
        <div>
          <h4 class="font-bold text-white text-sm">Install ExploreDesh Go App</h4>
          <p class="text-xs text-gray-400 leading-snug">Add to home screen for full-screen standalone offline navigation.</p>
        </div>
      </div>
      <button type="button" class="go-action-btn primary w-full mt-3 justify-center" id="hubInstallAppBtn" ${isStandalone ? 'disabled style="opacity:0.5"' : ''}>
        ${icon('download', { size: 16 })} ${installBtnLabel}
      </button>
      <p class="text-[11px] text-gray-500 mt-2 text-center" id="hubInstallNote">${installBtnNote}</p>
    </div>

    <!-- Clear Cache Action -->
    <div class="go-clear-box">
      <div>
        <h5 class="text-xs font-bold text-white">Reclaim Offline Storage</h5>
        <p class="text-xs text-gray-400">Delete all saved pocket guides and clear media caches.</p>
      </div>
      <div style="display:flex;gap:6px;align-items:center;">
        <button type="button" class="go-action-btn danger text-xs" id="goClearAllBtn">
          ${icon('trash', { size: 14 })} Clear All Data
        </button>
        <button type="button" class="hidden go-action-btn danger text-xs" id="goClearAllConfirmBtn" style="background:rgba(239,68,68,0.4);border-color:rgba(239,68,68,0.8);">
          ⚠️ Confirm Clear
        </button>
      </div>
    </div>
  `;

  // Hook install button
  const installBtn = document.getElementById('hubInstallAppBtn');
  if (installBtn && !isStandalone) {
    installBtn.addEventListener('click', async () => {
      if (deferredInstallPrompt) {
        // Chrome/Edge: native install prompt
        deferredInstallPrompt.prompt();
        const { outcome } = await deferredInstallPrompt.userChoice;
        console.info('[ExploreDesh Go] Install prompt outcome:', outcome);
        deferredInstallPrompt = null;
        installBtn.textContent = outcome === 'accepted' ? '✅ App Installed!' : 'Install Standalone App';
        installBtn.disabled = outcome === 'accepted';
        document.getElementById('hubInstallNote').textContent =
          outcome === 'accepted' ? 'App installed! Launch from your home screen.' : installBtnNote;
      } else if (isIOS) {
        // iOS Safari — show step-by-step instructions overlay
        const note = document.getElementById('hubInstallNote');
        if (note) {
          note.innerHTML = '<strong style="color:#E5C07B">iOS Install Steps:</strong> 1) Tap Share (⎋) at bottom of Safari → 2) Scroll down → tap <strong>"Add to Home Screen"</strong> → 3) Tap <strong>"Add"</strong> top right. Done!';
          note.style.color = '#E5C07B';
        }
      } else {
        // Desktop Chrome/Edge — guide user to address bar
        const note = document.getElementById('hubInstallNote');
        if (note) {
          note.innerHTML = '<strong style="color:#E5C07B">Install via Chrome/Edge:</strong> Look for the <strong>⊕ or install icon</strong> in the browser address bar (right side) and click it, or go to browser menu (⋮) → <strong>"Install ExploreDesh Go"</strong>.';
          note.style.color = '#E5C07B';
        }
      }
    });
  }

  // Hook clear all button — inline confirm pattern
  const clearBtn = document.getElementById('goClearAllBtn');
  const clearConfirmBtn = document.getElementById('goClearAllConfirmBtn');
  if (clearBtn && clearConfirmBtn) {
    clearBtn.addEventListener('click', () => {
      clearBtn.classList.add('hidden');
      clearConfirmBtn.classList.remove('hidden');
      // Auto-reset after 3 seconds
      setTimeout(() => {
        clearBtn.classList.remove('hidden');
        clearConfirmBtn.classList.add('hidden');
      }, 3000);
    });
    clearConfirmBtn.addEventListener('click', async () => {
      clearConfirmBtn.disabled = true;
      clearConfirmBtn.textContent = 'Clearing…';
      try {
        await clearAllOfflineData();
        renderStorageManager();
        renderSavedGuides();
      } catch (err) {
        console.error('[ExploreDesh Go] Clear all failed:', err);
        clearConfirmBtn.disabled = false;
        clearConfirmBtn.textContent = '⚠️ Confirm Clear';
      }
    });
  }
}

/**
 * Open the ExploreDesh Go Offline Hub
 */
export function openOfflineHub(tab = 'saved') {
  initOfflineHub();
  const modal = document.getElementById('exploreDeshGoModal');
  if (!modal) return;

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  // Update connectivity indicator
  const connText = modal.querySelector('.conn-text');
  const connDot = modal.querySelector('.conn-dot');
  if (connText && connDot) {
    connDot.className = `conn-dot ${navigator.onLine ? 'online' : 'offline'}`;
    connText.textContent = navigator.onLine ? '🟢 Connected to Internet' : '📴 Zero Signal / Offline Active';
  }

  switchTab(tab);
}

/**
 * Close the Offline Hub
 */
export function closeOfflineHub() {
  const modal = document.getElementById('exploreDeshGoModal');
  if (!modal) return;
  modal.classList.add('hidden');
  document.body.style.overflow = '';
}

/**
 * Initialize all offline hub facilities
 */
export function initOfflineHub() {
  if (isInitialized) return;
  isInitialized = true;

  registerServiceWorker();
  setupNetworkBar();
  injectHubMarkup();

  // Listen for storage updates
  window.addEventListener('exploredesh:offline-guides-changed', () => {
    if (currentTab === 'saved') renderSavedGuides();
    if (currentTab === 'storage') renderStorageManager();
    // Update badge count
    getAllOfflineGuides().then((guides) => {
      const b = document.getElementById('savedCountBadge');
      if (b) b.textContent = guides.length;
      const navBadges = document.querySelectorAll('.nav-offline-count-badge');
      navBadges.forEach((nb) => {
        nb.textContent = guides.length > 0 ? String(guides.length) : '';
        nb.style.display = guides.length > 0 ? 'inline-flex' : 'none';
      });
    });
  });

  // Initial badge update
  getAllOfflineGuides().then((guides) => {
    const navBadges = document.querySelectorAll('.nav-offline-count-badge');
    navBadges.forEach((nb) => {
      nb.textContent = guides.length > 0 ? String(guides.length) : '';
      nb.style.display = guides.length > 0 ? 'inline-flex' : 'none';
    });
  });
}
