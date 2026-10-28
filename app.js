/**
 * YESS // Editorial Cinematic Scroll Experience & Concept Validation
 * - Scroll-driven video scrubbing (Wide Office -> Desk Snack Zoom -> Macro Close-Up)
 * - Scroll reveal animation (elements float up into view on scroll)
 * - Real photography gallery (Pouch package vs 4 Vegetable fiber cubes)
 * - Interactive Flavor Interest Voting Board (6 flavors, live percentage, write-in)
 * - Multi-touchpoint synchronized survey with Price Sensitivity Meter (PSM)
 * - Turnkey Form Submission Endpoint (Google Sheets / Webhook integration with localStorage fallback)
 * - Privacy Policy Modal & Operator Information Controller
 */

// ============================================================================
// CONFIGURATION: FORM SUBMISSION ENDPOINT
// ============================================================================
const CONFIG = {
  // Google Apps Script (GAS) Webhook URL, Formspree, or custom endpoint URL
  SUBMISSION_ENDPOINT: 'https://script.google.com/macros/s/AKfycbwSbT8o_tLAFZtMVwRZRXUbqNqRcqXUAH1LOzaxikvHvLuMDNODtLz8SClZTgJUw5kn/exec', 
  STORAGE_KEY: 'tasuvege_tester_entries'
};

document.addEventListener('DOMContentLoaded', () => {

  // ==========================================================================
  // REAL-TIME TAP LOGGING INFRASTRUCTURE (Pattern B)
  // ==========================================================================
  let sessionId = '';
  try {
    sessionId = sessionStorage.getItem('tasuvege_sess_id') || '';
    if (!sessionId) {
      sessionId = 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
      sessionStorage.setItem('tasuvege_sess_id', sessionId);
    }
  } catch (_) {
    sessionId = 'sess_' + Date.now().toString(36);
  }

  function logTapEvent(category, value, action = '選択') {
    if (!CONFIG.SUBMISSION_ENDPOINT || !value) return;

    const payload = {
      type: 'tap_event',
      sessionId: sessionId,
      category: category,
      value: value,
      action: action,
      timestamp: new Date().toISOString(),
      referrer: document.referrer || 'direct',
      userAgent: navigator.userAgent
    };

    try {
      fetch(CONFIG.SUBMISSION_ENDPOINT, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      }).catch(() => {});
    } catch (_) {}
  }

  /* ========================================================================
     UX ENHANCEMENT 1: ACTIVE SCROLLSPY NAVIGATION
     ======================================================================== */
  const navLinks = document.querySelectorAll('.header-nav .nav-item');
  const sectionsToTrack = [
    document.getElementById('sec-cinema'),
    document.getElementById('sec-product'),
    document.getElementById('sec-flavor-board'),
    document.getElementById('sec-problem'),
    document.getElementById('sec-hypothesis'),
    document.getElementById('sec-scenes')
  ].filter(Boolean);

  function updateActiveSectionNav() {
    const scrollPos = window.scrollY + 140;
    let activeId = '';

    for (let i = 0; i < sectionsToTrack.length; i++) {
      const sec = sectionsToTrack[i];
      const top = sec.offsetTop;
      const height = sec.offsetHeight;
      if (scrollPos >= top && scrollPos < top + height) {
        activeId = sec.id;
        break;
      }
    }

    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href === '#' + activeId) {
        link.classList.add('is-current');
      } else {
        link.classList.remove('is-current');
      }
    });
  }

  window.addEventListener('scroll', updateActiveSectionNav, { passive: true });
  updateActiveSectionNav();

  /* ========================================================================
     UX ENHANCEMENT 2: MICRO-INTERACTION TOAST & FEEDBACK
     ======================================================================== */
  const toastEl = document.getElementById('interaction-toast');
  const toastTextEl = document.getElementById('toast-text');
  let toastTimerId = null;

  function showInteractionFeedback(message) {
    if (!toastEl || !toastTextEl) return;
    toastTextEl.textContent = message;
    toastEl.classList.add('is-active');

    if (toastTimerId) clearTimeout(toastTimerId);
    toastTimerId = setTimeout(() => {
      toastEl.classList.remove('is-active');
    }, 2400);
  }

  /* ========================================================================
     UX ENHANCEMENT 3: MOBILE STICKY BOTTOM CTA CONTROLLER
     ======================================================================== */
  const mobileStickyBar = document.getElementById('mobile-sticky-bar');
  const entrySection = document.getElementById('sec-entry');

  function updateMobileStickyCta() {
    if (!mobileStickyBar) return;
    const scrollY = window.scrollY;
    const cinemaEl = document.getElementById('sec-cinema');
    const cinemaBottom = cinemaEl ? (cinemaEl.offsetTop + cinemaEl.offsetHeight - 100) : 600;
    const isScrolledPastCinema = scrollY > cinemaBottom;

    let isNearEntry = false;
    if (entrySection) {
      const rect = entrySection.getBoundingClientRect();
      isNearEntry = rect.top < window.innerHeight && rect.bottom > 80;
    }

    if (isScrolledPastCinema && !isNearEntry) {
      mobileStickyBar.classList.add('is-shown');
    } else {
      mobileStickyBar.classList.remove('is-shown');
    }
  }

  window.addEventListener('scroll', updateMobileStickyCta, { passive: true });
  updateMobileStickyCta();

  /* ========================================================================
     1. SCROLL REVEAL OBSERVER (スクロールするごとに浮かび上がる)
     ======================================================================== */
  const revealElements = document.querySelectorAll('.reveal-item');

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin: '0px 0px -60px 0px',
        threshold: 0.12
      }
    );

    revealElements.forEach((el) => revealObserver.observe(el));
  } else {
    revealElements.forEach((el) => el.classList.add('is-revealed'));
  }

  /* ========================================================================
     2. SCROLL-DRIVEN CINEMATIC VIDEO SCRUBBING (0% -> 100%)
     ======================================================================== */
  const video = document.getElementById('scroll-video');
  const cinemaTrack = document.getElementById('sec-cinema');
  const scrubPctText = document.getElementById('scrub-pct-text');
  const scrubberFill = document.getElementById('scrubber-fill');
  const scrubberTrack = document.getElementById('scrubber-track');
  const btnPlayPause = document.getElementById('btn-play-pause');
  const btnSkipProduct = document.getElementById('btn-skip-product');

  const captionStage1 = document.getElementById('caption-stage-1');
  const captionStage2 = document.getElementById('caption-stage-2');
  const captionStage3 = document.getElementById('caption-stage-3');

  let isAutoPlaying = false;
  let targetTime = 0;
  let videoDuration = 10.0;

  if (video) {
    video.addEventListener('loadedmetadata', () => {
      if (video.duration && !isNaN(video.duration)) {
        videoDuration = video.duration;
      }
    });

    video.muted = true;
    video.pause();
  }

  // Smooth scroll scrubbing
  function handleScrollScrub() {
    if (!cinemaTrack || !video || isAutoPlaying) return;

    const rect = cinemaTrack.getBoundingClientRect();
    const trackHeight = cinemaTrack.offsetHeight;
    const windowH = window.innerHeight;

    const scrolledPx = -rect.top;
    const maxScroll = trackHeight - windowH;

    let progress = scrolledPx / maxScroll;
    progress = Math.max(0, Math.min(1, progress));

    targetTime = progress * videoDuration;

    if (Math.abs(video.currentTime - targetTime) > 0.05) {
      video.currentTime = targetTime;
    }

    const pct = Math.round(progress * 100);
    if (scrubPctText) scrubPctText.textContent = `${pct}%`;
    if (scrubberFill) scrubberFill.style.transform = `scaleX(${progress})`;

    // Switch captions cleanly as video zooms in
    if (captionStage1 && captionStage2 && captionStage3) {
      if (progress < 0.33) {
        captionStage1.classList.add('is-active');
        captionStage2.classList.remove('is-active');
        captionStage3.classList.remove('is-active');
      } else if (progress < 0.68) {
        captionStage1.classList.remove('is-active');
        captionStage2.classList.add('is-active');
        captionStage3.classList.remove('is-active');
      } else {
        captionStage1.classList.remove('is-active');
        captionStage2.classList.remove('is-active');
        captionStage3.classList.add('is-active');
      }
    }
  }

  window.addEventListener('scroll', handleScrollScrub, { passive: true });
  handleScrollScrub();

  // Scrubber Track Click-to-Seek
  if (scrubberTrack && cinemaTrack) {
    scrubberTrack.addEventListener('click', (e) => {
      const rect = scrubberTrack.getBoundingClientRect();
      const clickRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const trackTop = cinemaTrack.offsetTop;
      const maxScroll = cinemaTrack.offsetHeight - window.innerHeight;
      window.scrollTo({
        top: trackTop + maxScroll * clickRatio,
        behavior: 'smooth'
      });
    });
  }

  // Auto-Play Toggle Button
  if (btnPlayPause && video) {
    btnPlayPause.addEventListener('click', () => {
      if (video.paused) {
        isAutoPlaying = true;
        video.play();
        btnPlayPause.textContent = '停止';
      } else {
        isAutoPlaying = false;
        video.pause();
        btnPlayPause.textContent = '自動再生';
      }
    });

    video.addEventListener('timeupdate', () => {
      if (!isAutoPlaying) return;
      const progress = video.currentTime / videoDuration;
      const pct = Math.round(progress * 100);
      if (scrubPctText) scrubPctText.textContent = `${pct}%`;
      if (scrubberFill) scrubberFill.style.transform = `scaleX(${progress})`;

      if (captionStage1 && captionStage2 && captionStage3) {
        if (progress < 0.33) {
          captionStage1.classList.add('is-active');
          captionStage2.classList.remove('is-active');
          captionStage3.classList.remove('is-active');
        } else if (progress < 0.68) {
          captionStage1.classList.remove('is-active');
          captionStage2.classList.add('is-active');
          captionStage3.classList.remove('is-active');
        } else {
          captionStage1.classList.remove('is-active');
          captionStage2.classList.remove('is-active');
          captionStage3.classList.add('is-active');
        }
      }
    });

    video.addEventListener('ended', () => {
      isAutoPlaying = false;
      btnPlayPause.textContent = '自動再生';
    });
  }

  // Skip Directly to Product Stage
  if (btnSkipProduct) {
    btnSkipProduct.addEventListener('click', () => {
      const productSec = document.getElementById('sec-product');
      if (productSec) productSec.scrollIntoView({ behavior: 'smooth' });
    });
  }

  /* ========================================================================
     3. PRODUCT GALLERY CONTROLLER (Package vs Cubes Switcher)
     ======================================================================== */
  const galleryTabs = document.querySelectorAll('.gallery-tab');
  const cardCubes = document.getElementById('gallery-card-cubes');
  const cardPackage = document.getElementById('gallery-card-package');

  galleryTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      galleryTabs.forEach((t) => t.classList.remove('is-active'));
      tab.classList.add('is-active');

      const mode = tab.getAttribute('data-gallery-mode');
      if (mode === 'cubes') {
        if (cardCubes) cardCubes.classList.add('is-visible');
        if (cardPackage) cardPackage.classList.remove('is-visible');
      } else {
        if (cardCubes) cardCubes.classList.remove('is-visible');
        if (cardPackage) cardPackage.classList.add('is-visible');
      }
    });
  });

  /* ========================================================================
     4. INTERACTIVE FLAVOR CANDIDATE SELECTION BOARD
     ======================================================================== */
  const flavorNames = {
    'tomato-basil': '完熟トマト＆バジル',
    'carrot-nuts': 'キャロット＆ローストナッツ',
    'pepper-cheese': 'ブラックペッパー＆芳醇チーズ',
    'pumpkin-almond': '北海道かぼちゃ＆アーモンド',
    'curry-onion': '芳醇スパイスカリー＆オニオン',
    'soysauce-edamame': '焦がし醤油＆ロースト枝豆'
  };

  const flavorCards = document.querySelectorAll('.flavor-choice-card');
  const customFlavorInput = document.getElementById('custom-flavor-input');
  const btnSubmitCustomFlavor = document.getElementById('btn-submit-custom-flavor');
  const flavorFeedbackAlert = document.getElementById('flavor-feedback-alert');
  const q4CustomFlavorNote = document.getElementById('q4-custom-flavor-note');

  let alertTimeout = null;
  function showFlavorAlert(msg) {
    if (!flavorFeedbackAlert) return;
    flavorFeedbackAlert.textContent = msg;
    flavorFeedbackAlert.classList.add('is-visible');
    if (alertTimeout) clearTimeout(alertTimeout);
    alertTimeout = setTimeout(() => {
      flavorFeedbackAlert.classList.remove('is-visible');
    }, 4500);
  }

  function updateFlavorBoardUI() {
    flavorCards.forEach((card) => {
      const id = card.getAttribute('data-flavor-id');
      const name = flavorNames[id];
      if (!name) return;

      const isSelected = state.preferred_flavor.has(name);
      card.classList.toggle('is-voted', isSelected);

      const labelEl = card.querySelector('.flavor-vote-action-label');
      if (labelEl) {
        labelEl.textContent = isSelected ? '✓ 選択中（クリックで解除）' : 'この味を選択する';
      }
    });
  }

  flavorCards.forEach((card) => {
    card.addEventListener('click', () => {
      const id = card.getAttribute('data-flavor-id');
      const name = flavorNames[id];
      if (!name) return;

      if (state.preferred_flavor.has(name)) {
        state.preferred_flavor.delete(name);
        showFlavorAlert(`「${name}」の選択を解除しました。`);
        logTapEvent('Q4:フレーバー選択', name, '解除');
      } else {
        state.preferred_flavor.add(name);
        showFlavorAlert(`「${name}」を選択しました！アンケート（Q4）へ自動反映しました。`);
        logTapEvent('Q4:フレーバー選択', name, '選択');
      }

      updateFlavorBoardUI();
      syncFormUI();
    });
  });

  // Custom Flavor Request Box
  function handleCustomFlavorSubmit() {
    if (!customFlavorInput) return;
    const val = customFlavorInput.value.trim();
    if (!val) {
      customFlavorInput.focus();
      return;
    }

    state.customFlavorRequest = val;
    showFlavorAlert(`リクエスト「${val}」を受け付けました！アンケートへ反映しました。`);
    logTapEvent('Q4:カスタムフレーバーリクエスト', val, '入力送信');

    if (q4CustomFlavorNote) {
      q4CustomFlavorNote.style.display = 'block';
      q4CustomFlavorNote.textContent = `★ ご投票・リクエスト中の味: 「${val}」`;
    }

    syncFormUI();
  }

  if (btnSubmitCustomFlavor) {
    btnSubmitCustomFlavor.addEventListener('click', handleCustomFlavorSubmit);
  }

  if (customFlavorInput) {
    customFlavorInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleCustomFlavorSubmit();
      }
    });
  }

  /* ========================================================================
     5. MULTI-TOUCHPOINT SURVEY & TESTER REGISTRATION CONTROLLER
     ======================================================================== */
  const state = {
    role: '',
    roleOther: '',
    hours: '',
    pains: new Set(),
    preferred_flavor: new Set(),
    customFlavorRequest: '',
    price_sensitivity: '',
    health_interview: '',
    email: '',
    checkpointVote: ''
  };

  const progressFill = document.getElementById('form-progress-fill');
  const progressText = document.getElementById('form-progress-text');
  const roleOtherWrap = document.getElementById('role-other-wrap');
  const roleOtherInput = document.getElementById('role-other-input');
  const emailInput = document.getElementById('tester-email');
  const formSubmitBtn = document.getElementById('btn-form-submit');

  function syncFormUI() {
    // Role (Q1)
    document.querySelectorAll('[data-group="role"] .choice-chip').forEach((chip) => {
      chip.classList.toggle('is-selected', state.role === chip.getAttribute('data-value'));
    });

    if (roleOtherWrap) {
      roleOtherWrap.classList.toggle('is-visible', state.role === 'その他');
    }

    // Hours (Q2)
    document.querySelectorAll('[data-group="hours"] .choice-chip').forEach((chip) => {
      chip.classList.toggle('is-selected', state.hours === chip.getAttribute('data-value'));
    });

    // Pains (Q3 - Multi-select)
    document.querySelectorAll('[data-group="pains"] .choice-chip').forEach((chip) => {
      chip.classList.toggle('is-selected', state.pains.has(chip.getAttribute('data-value')));
    });

    // Also sync Section 1.5 Quick Survey options with Q3
    document.querySelectorAll('.survey-option-btn').forEach((btn) => {
      btn.classList.toggle('is-selected', state.pains.has(btn.getAttribute('data-sync-pain')));
    });

    // Preferred Flavors (Q4 - Multi-select synced with Flavor Board)
    document.querySelectorAll('[data-group="preferred_flavor"] .choice-chip').forEach((chip) => {
      chip.classList.toggle('is-selected', state.preferred_flavor.has(chip.getAttribute('data-value')));
    });

    if (q4CustomFlavorNote) {
      if (state.customFlavorRequest) {
        q4CustomFlavorNote.style.display = 'block';
        q4CustomFlavorNote.textContent = `★ ご投票・リクエスト中の味: 「${state.customFlavorRequest}」`;
      } else {
        q4CustomFlavorNote.style.display = 'none';
      }
    }

    // Price Sensitivity (Q5 - PSM)
    document.querySelectorAll('[data-group="price_sensitivity"] .choice-chip').forEach((chip) => {
      chip.classList.toggle('is-selected', state.price_sensitivity === chip.getAttribute('data-value'));
    });

    // Health & Interview (Q6)
    document.querySelectorAll('[data-group="health_interview"] .choice-chip').forEach((chip) => {
      chip.classList.toggle('is-selected', state.health_interview === chip.getAttribute('data-value'));
    });

    // Scene Tiles (Section 4)
    document.querySelectorAll('.scene-tile').forEach((tile) => {
      tile.classList.toggle('is-selected', state.role === tile.getAttribute('data-select-role'));
    });

    updateProgress();
  }

  function updateProgress() {
    let completed = 0;
    if (state.role && (state.role !== 'その他' || state.roleOther.trim().length > 0)) completed++;
    if (state.hours) completed++;
    if (state.pains.size > 0) completed++;
    if (state.preferred_flavor.size > 0 || state.customFlavorRequest.trim().length > 0) completed++;
    if (state.price_sensitivity) completed++;
    if (state.health_interview) completed++;
    if (state.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email.trim())) completed++;

    const pct = Math.round((completed / 7) * 100);
    if (progressFill) progressFill.style.transform = `scaleX(${pct / 100})`;
    if (progressText) progressText.textContent = `${completed} / 7 項目完了 (${pct}%)`;
  }

  // Section 1.5 Quick Survey Buttons
  document.querySelectorAll('.survey-option-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const painVal = btn.getAttribute('data-sync-pain');
      if (!painVal) return;
      if (state.pains.has(painVal)) {
        state.pains.delete(painVal);
        logTapEvent('Q3:間食の悩み(クイック)', painVal, '解除');
      } else {
        state.pains.add(painVal);
        logTapEvent('Q3:間食の悩み(クイック)', painVal, '選択');
      }
      syncFormUI();
    });
  });

  // Section 2 Checkpoint Poll
  const checkpointBtns = document.querySelectorAll('.checkpoint-btn');
  const pollFeedbackMsg = document.getElementById('poll-feedback-msg');

  checkpointBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      checkpointBtns.forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');

      const choice = btn.getAttribute('data-poll-choice') || '';
      state.checkpointVote = choice;
      logTapEvent('中間チェックポイント', choice, '選択');

      if (choice.includes('01')) {
        state.pains.add('キーボードやマウスに油やベタつきがつく');
        state.pains.add('デスクやキーの隙間に粉・破片が落ちる');
      } else if (choice.includes('02')) {
        state.pains.add('昼食が麺類やパンばかりで野菜が足りない');
      } else {
        state.pains.add('キーボードやマウスに油やベタつきがつく');
        state.pains.add('昼食が麺類やパンばかりで野菜が足りない');
      }

      syncFormUI();
      if (pollFeedbackMsg) pollFeedbackMsg.classList.add('is-visible');
      if (typeof showInteractionFeedback === 'function') showInteractionFeedback('気になる悩みを登録フォームに反映しました');

      if (btn.getAttribute('data-jump') === 'true') {
        const entryEl = document.getElementById('sec-entry');
        if (entryEl) entryEl.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Section 4 Scene Tiles -> Select Q1 & Smooth Scroll to Section 5
  document.querySelectorAll('.scene-tile').forEach((tile) => {
    tile.addEventListener('click', () => {
      const roleVal = tile.getAttribute('data-select-role');
      if (roleVal) {
        state.role = roleVal;
        logTapEvent('Q1:職種シーン選択', roleVal, '選択');
        syncFormUI();
        const entryEl = document.getElementById('sec-entry');
        if (entryEl) entryEl.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  const groupCategoryMap = {
    role: 'Q1:お仕事内容',
    hours: 'Q2:作業時間',
    pains: 'Q3:間食の悩み',
    preferred_flavor: 'Q4:希望フレーバー',
    price_sensitivity: 'Q5:継続価格帯',
    health_interview: 'Q6:健康食品・ヒアリング'
  };

  // Section 5 Form Chips Handler
  document.querySelectorAll('[data-group]').forEach((groupEl) => {
    const groupName = groupEl.getAttribute('data-group');
    const isMulti = groupEl.getAttribute('data-multi') === 'true';
    const catLabel = groupCategoryMap[groupName] || groupName;

    groupEl.querySelectorAll('.choice-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const val = chip.getAttribute('data-value');
        if (!val) return;

        if (isMulti) {
          const targetSet = state[groupName];
          if (targetSet instanceof Set) {
            if (targetSet.has(val)) {
              targetSet.delete(val);
              logTapEvent(catLabel, val, '解除');
            } else {
              targetSet.add(val);
              logTapEvent(catLabel, val, '選択');
            }
          }
          if (groupName === 'preferred_flavor') {
            updateFlavorBoardUI();
          }
        } else {
          state[groupName] = val;
          logTapEvent(catLabel, val, '選択');
        }
        syncFormUI();
      });
    });
  });

  if (roleOtherInput) {
    roleOtherInput.addEventListener('input', (e) => {
      state.roleOther = e.target.value;
      updateProgress();
    });
    roleOtherInput.addEventListener('change', (e) => {
      const val = e.target.value.trim();
      if (val) {
        logTapEvent('Q1:お仕事内容(その他自由記入)', val, '入力');
      }
    });
  }

  if (emailInput) {
    emailInput.addEventListener('input', (e) => {
      state.email = e.target.value;
      updateProgress();
    });
  }

  // Initialize UI
  updateFlavorBoardUI();
  syncFormUI();

  // ========================================================================
  // 6. FORM SUBMISSION PIPELINE (Backend Webhook + LocalStorage Fallback)
  // ========================================================================
  const form = document.getElementById('tester-form');
  const completionPanel = document.getElementById('completion-panel');
  const receiptSummary = document.getElementById('receipt-summary');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Anti-spam honeypot detection (invisible trap for bots)
      const hpField = document.getElementById('form-hp-field');
      if (hpField && hpField.value.trim() !== '') {
        console.warn('Bot submission blocked via honeypot.');
        if (completionPanel) {
          completionPanel.classList.add('is-visible');
          completionPanel.scrollIntoView({ behavior: 'smooth' });
        }
        return;
      }

      if (!state.role) {
        alert('Q1. 普段の主な仕事内容をお選びください。');
        return;
      }
      if (!state.hours) {
        alert('Q2. 1日の平均パソコン作業時間をお選びください。');
        return;
      }
      if (state.pains.size === 0) {
        alert('Q3. パソコン作業中の間食で困っていることを1つ以上お選びください。');
        return;
      }
      if (state.preferred_flavor.size === 0 && !state.customFlavorRequest) {
        alert('Q4. 試作品として優先的に食べてみたい味をお選びいただくか、リクエストをご記入ください。');
        return;
      }
      if (!state.price_sensitivity) {
        alert('Q5. 1袋あたり継続して買いやすい価格帯をお選びください。');
        return;
      }
      if (!state.health_interview) {
        alert('Q6. 健康食品の購入状況とヒアリングへのご協力についてお選びください。');
        return;
      }
      if (state.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email.trim())) {
        alert('有効なメールアドレスをご入力いただくか、案内不要の場合は空欄のまま送信してください。');
        if (emailInput) emailInput.focus();
        return;
      }

      const finalRole = state.role === 'その他' && state.roleOther.trim()
        ? `その他（${state.roleOther.trim()}）`
        : state.role;

      const payload = {
        timestamp: new Date().toISOString(),
        product: 'YESS',
        sessionId: sessionId,
        role: sanitizeForSheet(finalRole),
        pcHours: state.hours,
        painPoints: Array.from(state.pains),
        preferredFlavors: Array.from(state.preferred_flavor),
        customFlavorRequest: sanitizeForSheet(state.customFlavorRequest),
        priceSensitivity: state.price_sensitivity,
        healthFoodAndInterview: state.health_interview,
        email: state.email.trim() ? sanitizeForSheet(state.email.trim()) : '（未入力・アンケートのみ）',
        referrer: document.referrer || 'direct',
        userAgent: navigator.userAgent
      };

      // Set UI pending state
      if (formSubmitBtn) {
        formSubmitBtn.disabled = true;
        formSubmitBtn.textContent = '送信処理中...';
      }

      // Safe session backup (clears when browser tab closes; prevents shared-PC leaks)
      try {
        sessionStorage.setItem('tasuvege_submitted_entry', JSON.stringify(payload));
        localStorage.removeItem(CONFIG.STORAGE_KEY); // Clean up legacy persistent storage
      } catch (_) {}

      // If remote endpoint URL is configured, POST to it
      if (CONFIG.SUBMISSION_ENDPOINT) {
        try {
          await fetch(CONFIG.SUBMISSION_ENDPOINT, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
          });
        } catch (err) {
          console.warn('Endpoint submission warning (saved to localStorage):', err);
        }
      }

      // Restore submit button
      if (formSubmitBtn) {
        formSubmitBtn.disabled = false;
        formSubmitBtn.textContent = 'アンケートを送信する';
      }

      if (receiptSummary) {
        const flavorSummaryText = [
          ...payload.preferredFlavors,
          payload.customFlavorRequest ? `リクエスト: ${payload.customFlavorRequest}` : ''
        ].filter(Boolean).join(' ／ ');

        receiptSummary.innerHTML = `
          <div class="receipt-row"><span class="receipt-key">お仕事内容 (Q1)</span><span>${escapeHtml(payload.role)}</span></div>
          <div class="receipt-row"><span class="receipt-key">パソコン作業時間 (Q2)</span><span>${escapeHtml(payload.pcHours)}</span></div>
          <div class="receipt-row"><span class="receipt-key">間食で困っていること (Q3)</span><span>${escapeHtml(payload.painPoints.join(' ／ '))}</span></div>
          <div class="receipt-row"><span class="receipt-key">興味のある味 (Q4)</span><span>${escapeHtml(flavorSummaryText)}</span></div>
          <div class="receipt-row"><span class="receipt-key">継続しやすい価格帯 (Q5)</span><span>${escapeHtml(payload.priceSensitivity)}</span></div>
          <div class="receipt-row"><span class="receipt-key">健康食品・ヒアリング (Q6)</span><span>${escapeHtml(payload.healthFoodAndInterview)}</span></div>
          <div class="receipt-row"><span class="receipt-key">案内送付先メール (Q7)</span><span>${escapeHtml(payload.email)}</span></div>
        `;
      }

      if (completionPanel) {
        completionPanel.classList.add('is-visible');
        completionPanel.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  /* ========================================================================
     7. PRIVACY POLICY MODAL CONTROLLER
     ======================================================================== */
  const privacyModal = document.getElementById('privacy-modal');
  const openPrivacyBtns = [
    document.getElementById('btn-open-privacy'),
    document.getElementById('btn-footer-privacy'),
    document.getElementById('link-privacy-in-form')
  ].filter(Boolean);

  const closePrivacyBtns = [
    document.getElementById('btn-close-privacy'),
    document.getElementById('btn-confirm-privacy'),
    document.getElementById('modal-backdrop')
  ].filter(Boolean);

  function openPrivacyModal() {
    if (privacyModal) {
      privacyModal.removeAttribute('hidden');
      document.body.style.overflow = 'hidden';
    }
  }

  function closePrivacyModal() {
    if (privacyModal) {
      privacyModal.setAttribute('hidden', '');
      document.body.style.overflow = '';
    }
  }

  openPrivacyBtns.forEach((btn) => {
    btn.addEventListener('click', openPrivacyModal);
  });

  closePrivacyBtns.forEach((btn) => {
    btn.addEventListener('click', closePrivacyModal);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && privacyModal && !privacyModal.hasAttribute('hidden')) {
      closePrivacyModal();
    }
  });

  function sanitizeForSheet(str) {
    if (typeof str !== 'string') return '';
    const trimmed = str.trim();
    // Formula injection prevention for Excel/Google Sheets
    if (/^[=+@-]/.test(trimmed)) {
      return "'" + trimmed;
    }
    return trimmed;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
