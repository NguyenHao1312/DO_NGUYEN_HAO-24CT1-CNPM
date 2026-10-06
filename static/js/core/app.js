// app.js

// Global Error Handler
window.addEventListener('error', (event) => {
    if (window.Utils && typeof window.Utils.showToast === 'function') {
        window.Utils.showToast('Lỗi hệ thống: ' + event.message, 'error');
    }
    console.error('Global JS Error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    if (window.Utils && typeof window.Utils.showToast === 'function') {
        window.Utils.showToast('Lỗi Promise ngầm: ' + (event.reason ? event.reason.message || event.reason : 'Không xác định'), 'error');
    }
    console.error('Unhandled Promise Rejection:', event.reason);
});

// Translations — tách riêng ra file translations.js để dễ bảo trì
const translations = window.AppTranslations || {};

window.t = function(key, params = {}) {
  const lang = (typeof Database !== 'undefined' && Database.settings) ? (Database.settings.get().language || 'vi') : (localStorage.getItem('unims_settings') ? JSON.parse(localStorage.getItem('unims_settings')).language : 'vi');
  let text = translations[lang]?.[key] || translations['vi']?.[key] || key;
  
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{${k}}`, v);
    }
  }
  return text;
};

// Also keep global function t for backward compatibility
function t(key, params = {}) {
  return window.t(key, params);
}

const NAV_ITEMS = [
  { hash: '#/dashboard', color: '#3B82F6', icon: '<svg viewBox="0 0 24 24" class="nav-svg"><rect x="3" y="3" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.4"/><rect x="14" y="3" width="7" height="11" rx="1.5" fill="currentColor"/><rect x="14" y="18" width="7" height="3" rx="1.5" fill="currentColor" opacity="0.4"/><rect x="3" y="14" width="7" height="7" rx="1.5" fill="currentColor"/></svg>', label: 'nav_dashboard', id: 'dashboard' },
  { hash: '#/students', color: '#10B981', icon: '<svg viewBox="0 0 24 24" class="nav-svg"><path d="M12 3l8 4.5-8 4.5-8-4.5L12 3z" fill="currentColor"/><path d="M12 12l8-4.5v5.8a2 2 0 01-1.1 1.8l-5.9 3.2a2 2 0 01-2 0l-5.9-3.2a2 2 0 01-1.1-1.8V7.5L12 12z" fill="currentColor" opacity="0.4"/></svg>', label: 'nav_students', id: 'students' },
  { hash: '#/teachers', color: '#F59E0B', icon: '<svg viewBox="0 0 24 24" class="nav-svg"><rect x="2" y="3" width="20" height="13" rx="2" fill="currentColor" opacity="0.4"/><path d="M8 21h8M12 16v5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="9" r="3" fill="currentColor"/><path d="M7 16c0-2.2 2-4 5-4s5 1.8 5 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>', label: 'nav_teachers', id: 'teachers' },
  { hash: '#/classes', color: '#8B5CF6', icon: '<svg viewBox="0 0 24 24" class="nav-svg"><path d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" fill="currentColor" opacity="0.3"/><path d="M8 10h8M8 14h5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M16 4v16M8 4v16" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 4" opacity="0.5"/></svg>', label: 'nav_classes', id: 'classes' },
  { hash: '#/registration', color: '#EC4899', icon: '<svg viewBox="0 0 24 24" class="nav-svg"><rect x="5" y="3" width="14" height="18" rx="2" fill="currentColor" opacity="0.3"/><path d="M9 9h6M9 13h6M9 17h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M14 2l5 5h-3a2 2 0 01-2-2V2z" fill="currentColor"/></svg>', label: 'nav_registration', id: 'registration' },
  { hash: '#/tuition', color: '#F43F5E', icon: '<svg viewBox="0 0 24 24" class="nav-svg"><rect x="3" y="6" width="18" height="12" rx="2" fill="currentColor" opacity="0.3"/><circle cx="12" cy="12" r="3" fill="currentColor"/><path d="M3 10h18M3 14h18" stroke="currentColor" stroke-width="1" opacity="0.5"/><path d="M20 6h-2M20 18h-2" stroke="currentColor" stroke-width="2"/></svg>', label: 'nav_tuition', id: 'tuition' },
  { hash: '#/grades', color: '#0EA5E9', icon: '<svg viewBox="0 0 24 24" class="nav-svg"><path d="M12 2l2.4 7.4h7.6l-6.2 4.5 2.4 7.4-6.2-4.5-6.2 4.5 2.4-7.4-6.2-4.5h7.6z" fill="currentColor" opacity="0.4"/><path d="M12 5l1.6 4.8h5.1l-4.1 3 1.6 4.8-4.2-3-4.2 3 1.6-4.8-4.1-3h5.1z" fill="currentColor"/></svg>', label: 'nav_grades', id: 'grades' },
  { divider: true },
  { hash: '#/chatbot', color: '#14B8A6', icon: '<svg viewBox="0 0 24 24" class="nav-svg"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" fill="currentColor" opacity="0.3"/><circle cx="9" cy="10" r="1.5" fill="currentColor"/><circle cx="15" cy="10" r="1.5" fill="currentColor"/><path d="M9 15h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>', label: 'nav_chatbot', id: 'chatbot' },
  { hash: '#/helpdesk', color: '#F97316', icon: '<svg viewBox="0 0 24 24" class="nav-svg"><circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2"/><path d="M12 2a10 10 0 00-10 10v4a2 2 0 002 2h2a2 2 0 002-2v-4a2 2 0 00-2-2H4" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M12 2a10 10 0 0110 10v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4a2 2 0 012-2h2" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M15 22H9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>', label: 'nav_helpdesk', id: 'helpdesk' },
  { hash: '#/profile', color: '#6366F1', icon: '<svg viewBox="0 0 24 24" class="nav-svg"><rect x="3" y="4" width="18" height="16" rx="2" fill="currentColor" opacity="0.3"/><circle cx="12" cy="10" r="3" fill="currentColor"/><path d="M7 17c0-2.2 2-4 5-4s5 1.8 5 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>', label: 'nav_profile', id: 'profile' },
  { divider: true, id: 'admin_divider' },
  { hash: '#/workshop', color: '#EF4444', icon: '<svg viewBox="0 0 24 24" class="nav-svg"><path d="M12 22a10 10 0 100-20 10 10 0 000 20z" fill="currentColor" opacity="0.2"/><path d="M12 16l-3 3-2-2 3-3V9l4-4 2 2-4 4v5z" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>', label: 'nav_workshop', id: 'workshop' },
];

const routes = {
  
  '#/dashboard': () => typeof DashboardView !== 'undefined' ? DashboardView.render() : console.log('DashboardView missing'),
  '#/students': () => typeof StudentsView !== 'undefined' ? StudentsView.render() : console.log('StudentsView missing'),
  '#/teachers': () => typeof TeachersView !== 'undefined' ? TeachersView.render() : console.log('TeachersView missing'),
  '#/classes': () => typeof ClassesView !== 'undefined' ? ClassesView.render() : console.log('ClassesView missing'),
  '#/registration': () => typeof RegistrationView !== 'undefined' ? RegistrationView.render() : console.log('RegistrationView missing'),
  '#/tuition': () => typeof TuitionView !== 'undefined' ? TuitionView.render() : console.log('TuitionView missing'),
  '#/grades': () => typeof GradesView !== 'undefined' ? GradesView.render() : console.log('GradesView missing'),
  '#/chatbot': () => typeof ChatbotView !== 'undefined' ? ChatbotView.render() : console.log('ChatbotView missing'),
  '#/helpdesk': () => typeof HelpdeskView !== 'undefined' ? HelpdeskView.render() : console.log('HelpdeskView missing'),
  '#/workshop': () => typeof WorkshopView !== 'undefined' ? WorkshopView.render() : console.log('WorkshopView missing'),
  '#/profile': () => typeof ProfileView !== 'undefined' ? ProfileView.render() : console.log('ProfileView missing'),
};

const App = {
  async init() {
    // 1. CHỜ giải mã dữ liệu offline hoàn tất trước khi làm việc khác
    if (typeof Database.initEncryption === 'function') {
      try {
        await Database.initEncryption();
      } catch (e) {
        console.error('Encryption init failed:', e);
      }
    }
    // Force reseed data to sync with the new university IDs
    if (!localStorage.getItem('unims_v2_seeded')) {
      if (typeof Database.resetAll === 'function') {
        Database.resetAll();
      }
      localStorage.setItem('unims_v2_seeded', 'true');
    }

    Database.seedData();
    
    if (!Auth.isLoggedIn()) {
      window.location.href = '/review/#login';
      return;
    }

    // Đã đăng nhập -> Kéo dữ liệu từ server (Sync Down)
    try {
      const res = await Auth.apiFetch('/api/sync/down/');
      if (res && res.ok) {
        const data = await res.json();
        if (data.classes && data.classes.length > 0) {
          localStorage.setItem('unims_classes', JSON.stringify(data.classes));
        }
        if (data.registrations && data.registrations.length > 0) {
          localStorage.setItem('unims_registrations', JSON.stringify(data.registrations));
        }
        if (data.grades && data.grades.length > 0) {
          localStorage.setItem('unims_grades', JSON.stringify(data.grades));
        }
      }
    } catch(err) {
      console.log("Offline mode: Skipping sync down");
    }

    this.setupUserProfile();
    this.renderSidebar();
    this.setupRouter();
    this.setupTheme();
    this.setupLanguage();
    this.setupGlobalSearch();
    this.setupMobileMenu();
    this.setupChatbotFab();
    this.setupNotifications();
    this.setupHelpdeskBadge();
    this.setupRealtimeClock();
  },

  setupUserProfile() {
    const user = Auth.getCurrentUser();
    if (!user) return;

    // Display Name and Role
    const userNameEl = document.getElementById('user-name');
    const userRoleEl = document.getElementById('user-role');
    const userAvatarEl = document.getElementById('user-avatar');

    if (userNameEl) userNameEl.textContent = user.name || user.username;
    
    if (userRoleEl) {
      let roleText = t('user') || 'Người dùng';
      if (user.role === 'admin') roleText = t('admin_role') || 'Quản trị viên';
      else if (user.role === 'teacher') roleText = t('teacher_role') || 'Giáo viên';
      else if (user.role === 'student') roleText = t('student_role') || 'Sinh viên';
      userRoleEl.textContent = roleText;
    }

    if (userAvatarEl && user.name) {
      if (user.avatar) {
        userAvatarEl.innerHTML = `<img src="${user.avatar}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
        userAvatarEl.style.backgroundColor = 'transparent';
      } else {
        const parts = user.name.split(' ');
        const initials = parts.length > 1 
          ? parts[0][0] + parts[parts.length - 1][0]
          : parts[0][0];
        userAvatarEl.textContent = initials.toUpperCase();
        userAvatarEl.style.backgroundImage = 'none';
      }
    }

    // Display University in Header
    const uniDisplay = document.getElementById('header-university-display');
    const uniNameEl = document.getElementById('header-university-name');
    const uniDescEl = document.getElementById('header-university-desc');

    if (uniDisplay && user.universityId) {
      const uni = Database.UNIVERSITIES.find(u => u.id === user.universityId);
      if (uni) {
        uniDisplay.style.display = 'flex';
        if (uniNameEl) uniNameEl.textContent = t(uni.name);
        if (uniDescEl) uniDescEl.textContent = t(uni.desc);
        const uniLogoContainer = document.getElementById('header-university-logo');
        if (uniLogoContainer) {
          uniLogoContainer.innerHTML = `<span style="font-weight: 700; color: var(--primary-600); font-size: 0.75rem;">${uni.shortName}</span>`;
        }
      }
    } else if (uniDisplay && user.role === 'admin') {
      // Admin might have null universityId, they manage everything
      uniDisplay.style.display = 'flex';
      if (uniNameEl) uniNameEl.textContent = t('Hệ thống Quản trị');
      if (uniDescEl) uniDescEl.textContent = t('Quyền điều hành đa trường học');
    }

    // Logout Event
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
      // Avoid attaching multiple listeners on re-init
      const newBtn = btnLogout.cloneNode(true);
      btnLogout.parentNode.replaceChild(newBtn, btnLogout);
      newBtn.addEventListener('click', (e) => {
        e.preventDefault();
        Auth.logout();
        window.location.href = '/review/';
        
      });
    }
  },

  renderSidebar() {
    const nav = document.getElementById('sidebar-nav');
    if (!nav) return;
    
    const user = Auth.getCurrentUser();
    let hasAddedDivider = false;

    nav.innerHTML = NAV_ITEMS.map(item => {
      if (item.divider) {
        // Only show workshop divider if admin
        if (item.id === 'admin_divider' && user?.role !== 'admin') return '';
        if (hasAddedDivider) return ''; // Prevent double dividers
        hasAddedDivider = true;
        return '<hr style="border-color: var(--sidebar-hover); margin: 0.5rem 1rem;">';
      }
      
      hasAddedDivider = false;
      // Filter by role access
      if (!Auth.canAccess(item.id)) return '';

      const iconColor = item.color || 'var(--primary-500)';
      const iconBg = item.bg || (item.color + '1A');
      const label = t(item.label);

      return `
        <a href="${item.hash}" class="nav-item" data-hash="${item.hash}" data-tooltip="${label}" data-tooltip-color="${iconColor}">
          <div class="nav-icon-wrapper" style="color: ${iconColor}; background: ${iconBg}; border-color: ${iconColor}33;">
            ${item.icon.startsWith('<') ? item.icon : `<i class="${item.icon}"></i>`}
          </div>
          <span class="nav-label">${label}</span>
        </a>
      `;
    }).join('');
    
    this.highlightActiveNav(window.location.hash || '#/dashboard');
    this.setupNavTooltips();
  },

  setupNavTooltips() {
    // Remove any existing tooltip
    const existing = document.getElementById('nav-global-tooltip');
    if (existing) existing.remove();

    // Create a single tooltip element on body (escapes overflow:hidden)
    const tip = document.createElement('div');
    tip.id = 'nav-global-tooltip';
    tip.className = 'nav-item-tooltip';
    document.body.appendChild(tip);

    let hideTimer = null;

    const show = (navEl) => {
      clearTimeout(hideTimer);
      const label = navEl.dataset.tooltip;
      const color = navEl.dataset.tooltipColor || '#3b82f6';
      if (!label) return;

      tip.textContent = label;
      tip.style.setProperty('--nav-tooltip-color', color);

      // Position: vertically centered next to the nav item, to its right
      const rect = navEl.getBoundingClientRect();
      tip.style.top = (rect.top + rect.height / 2) + 'px';
      tip.style.left = (rect.right + 12) + 'px';
      tip.style.transform = 'translateY(-50%) translateX(-4px)';

      // Force reflow so transition fires
      tip.classList.remove('visible');
      void tip.offsetWidth;
      tip.style.transform = 'translateY(-50%) translateX(0)';
      tip.classList.add('visible');
    };

    const hide = () => {
      hideTimer = setTimeout(() => {
        tip.classList.remove('visible');
      }, 80);
    };

    const nav = document.getElementById('sidebar-nav');
    if (!nav) return;

    nav.addEventListener('mouseenter', (e) => {
      const navEl = e.target.closest('.nav-item');
      if (navEl) show(navEl);
    }, true);

    nav.addEventListener('mouseleave', (e) => {
      const navEl = e.target.closest('.nav-item');
      if (navEl) hide();
    }, true);

    nav.addEventListener('mousemove', (e) => {
      const navEl = e.target.closest('.nav-item');
      if (!navEl) { hide(); return; }
      // Keep tooltip position updated while moving within item
      const rect = navEl.getBoundingClientRect();
      tip.style.top = (rect.top + rect.height / 2) + 'px';
      tip.style.left = (rect.right + 12) + 'px';
    });
  },

  setupRouter() {
    // Only add listener once
    if (!this.routerInitialized) {
      window.addEventListener('hashchange', () => {
        const hash = window.location.hash || '#/dashboard';
        this.navigate(hash);
      });
      this.routerInitialized = true;
    }

    // Handle initial route
    const hash = window.location.hash || '#/dashboard';
    this.navigate(hash);
  },

  navigate(hash) {
    if (!Auth.isLoggedIn()) {
      window.location.href = '/review/#login';
      return;
    }

    if (Auth.isLoggedIn() && hash === '#/login') {
      window.location.hash = '#/dashboard';
      return;
    }

    if (routes[hash]) {
      // Permission check
      const routeId = hash.replace('#/', '');
      if (routeId !== 'login' && !Auth.canAccess(routeId)) {
        Utils.showToast(t('no_permission') || 'Bạn không có quyền truy cập trang này!', 'error');
        window.location.hash = '#/dashboard';
        return;
      }

      this.highlightActiveNav(hash);
      routes[hash]();

      // Hide chatbot FAB when on chatbot page
      const fab = document.getElementById('chatbot-fab');
      if (fab) fab.style.display = hash === '#/chatbot' ? 'none' : 'flex';
    } else {
      window.location.hash = '#/dashboard';
    }
  },

  highlightActiveNav(hash) {
    document.querySelectorAll('.nav-item').forEach(el => {
      if (el.dataset.hash === hash) {
        el.classList.add('active');
        el.style.backgroundColor = 'var(--sidebar-active-bg)';
        el.style.color = 'var(--sidebar-text-active)';
        el.style.borderRight = '3px solid var(--sidebar-active-border)';
      } else {
        el.classList.remove('active');
        el.style.backgroundColor = '';
        el.style.color = '';
        el.style.borderRight = '';
      }
    });
  },

  setupTheme() {
    const settings = Database.settings.get();
    const btnTheme = document.getElementById('btn-theme');
    
    if (settings.theme === 'dark') {
      document.body.classList.add('dark-mode');
      document.documentElement.setAttribute('data-theme', 'dark');
      if (btnTheme) btnTheme.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
      document.body.classList.remove('dark-mode');
      document.documentElement.setAttribute('data-theme', 'light');
      if (btnTheme) btnTheme.innerHTML = '<i class="fas fa-moon"></i>';
    }
    
    if (btnTheme) {
      const newBtn = btnTheme.cloneNode(true);
      btnTheme.parentNode.replaceChild(newBtn, btnTheme);
      newBtn.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark-mode');
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        Database.settings.save({ theme: isDark ? 'dark' : 'light' });
        newBtn.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
      });
    }
  },

  setupLanguage() {
    const settings = Database.settings.get();
    const btnLang = document.getElementById('btn-language');
    
    const updateLangLabel = (lang, btn) => {
      if (btn) {
        const label = btn.querySelector('.lang-label');
        if (label) label.textContent = lang.toUpperCase();
      }
    };
    
    updateLangLabel(settings.language, btnLang);
    
    if (btnLang) {
      const newBtn = btnLang.cloneNode(true);
      btnLang.parentNode.replaceChild(newBtn, btnLang);
      newBtn.addEventListener('click', () => {
        const currentLang = Database.settings.get().language;
        const newLang = currentLang === 'vi' ? 'en' : 'vi';
        
        Database.settings.save({ language: newLang });
        updateLangLabel(newLang, newBtn);
        
        this.renderSidebar();
        this.setupUserProfile();
        const currentHash = window.location.hash || '#/dashboard';
        if (routes[currentHash]) routes[currentHash]();
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
          el.placeholder = t(el.dataset.i18nPlaceholder);
        });
        document.querySelectorAll('[data-i18n-value]').forEach(el => {
          el.value = t(el.dataset.i18nValue);
        });
        
        // Translate all static data-i18n elements
        document.querySelectorAll('[data-i18n]').forEach(el => {
          el.textContent = t(el.dataset.i18n);
        });
      });
    }
    
    // Initial translation for static elements on first load
    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = t(el.dataset.i18nPlaceholder);
    });
    document.querySelectorAll('[data-i18n-value]').forEach(el => {
      el.value = t(el.dataset.i18nValue);
    });
  },

  setupGlobalSearch() {
    const searchInput = document.getElementById('global-search');
    if (!searchInput) return;
    
    searchInput.placeholder = t('search_placeholder') || 'Tìm kiếm...';
    
    // Create dropdown wrapper
    let dropdown = document.getElementById('global-search-results');
    if (!dropdown) {
      dropdown = document.createElement('div');
      dropdown.id = 'global-search-results';
      dropdown.style.cssText = 'position:absolute; top:100%; left:0; right:0; background:var(--surface); border:1px solid var(--border-color); border-radius:var(--radius-md); box-shadow:var(--shadow-lg); z-index:1000; display:none; max-height:300px; overflow-y:auto; margin-top:4px;';
      // Ensure parent is relative
      searchInput.parentNode.style.position = 'relative';
      searchInput.parentNode.appendChild(dropdown);
    }

    const routes = [
      { path: '#/dashboard', icon: 'fa-chart-pie', name: 'nav_dashboard', roles: ['admin', 'teacher', 'student'] },
      { path: '#/students', icon: 'fa-user-graduate', name: 'nav_students', roles: ['admin'] },
      { path: '#/teachers', icon: 'fa-chalkboard-teacher', name: 'nav_teachers', roles: ['admin'] },
      { path: '#/classes', icon: 'fa-layer-group', name: 'nav_classes', roles: ['admin', 'teacher'] },
      { path: '#/registration', icon: 'fa-edit', name: 'nav_registration', roles: ['admin', 'student'] },
      { path: '#/tuition', icon: 'fa-money-bill-wave', name: 'nav_tuition', roles: ['student'] },
      { path: '#/grades', icon: 'fa-star', name: 'nav_grades', roles: ['admin', 'teacher', 'student'] },
      { path: '#/profile', icon: 'fa-user-circle', name: 'nav_profile', roles: ['admin', 'teacher', 'student'] },
      { path: '#/helpdesk', icon: 'fa-headset', name: 'nav_helpdesk', roles: ['admin', 'teacher', 'student'] },
      { path: '#/chatbot', icon: 'fa-robot', name: 'nav_chatbot', roles: ['admin', 'teacher', 'student'] },
      { path: '#/workshop', icon: 'fa-tools', name: 'nav_workshop', roles: ['admin'] }
    ];

    let currentResults = [];
    let selectedIndex = -1;

    const renderResults = () => {
      if (currentResults.length === 0) {
        dropdown.innerHTML = `<div style="padding:12px; text-align:center; color:var(--text-secondary); font-size:0.85rem;">${t('no_data') || 'Không tìm thấy kết quả'}</div>`;
      } else {
        dropdown.innerHTML = currentResults.map((r, i) => `
          <div class="search-item ${i === selectedIndex ? 'selected' : ''}" data-path="${r.path}" style="padding:10px 12px; display:flex; align-items:center; gap:10px; cursor:pointer; font-size:0.9rem; color:var(--text-primary); border-bottom:1px solid var(--border-light); ${i === selectedIndex ? 'background:var(--primary-50);' : ''}">
            <i class="fas ${r.icon}" style="color:var(--primary-500); width:20px; text-align:center;"></i>
            <span>${t(r.name) || r.name}</span>
          </div>
        `).join('');
      }
      dropdown.style.display = 'block';
    };

    // Global click listener to close dropdown
    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.style.display = 'none';
      }
    });

    // Event listeners
    dropdown.addEventListener('click', (e) => {
      const item = e.target.closest('.search-item');
      if (item) {
        window.location.hash = item.dataset.path;
        dropdown.style.display = 'none';
        searchInput.value = '';
      }
    });

    searchInput.addEventListener('keydown', (e) => {
      if (dropdown.style.display !== 'block') return;
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, currentResults.length - 1);
        renderResults();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, 0);
        renderResults();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < currentResults.length) {
          window.location.hash = currentResults[selectedIndex].path;
        } else if (currentResults.length > 0) {
          window.location.hash = currentResults[0].path; // Default to first result
        }
        dropdown.style.display = 'none';
        searchInput.value = '';
        searchInput.blur();
      } else if (e.key === 'Escape') {
        dropdown.style.display = 'none';
      }
    });

    searchInput.addEventListener('input', Utils.debounce((e) => {
      const query = e.target.value.trim().toLowerCase();
      if (!query) {
        dropdown.style.display = 'none';
        return;
      }
      
      const role = Auth.getCurrentUser()?.role || 'student';
      currentResults = routes.filter(r => {
        if (!r.roles.includes(role)) return false;
        const translatedName = (t(r.name) || r.name).toLowerCase();
        return translatedName.includes(query);
      });
      
      selectedIndex = -1;
      renderResults();
    }, 200));
    
    searchInput.addEventListener('focus', () => {
      if (searchInput.value.trim().length > 0) {
        dropdown.style.display = 'block';
      }
    });
  },

  setupMobileMenu() {
    const toggleBtn = document.getElementById('mobile-menu-toggle');
    const sidebarToggleBtn = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    
    // Inject overlay if not exists
    let overlay = document.getElementById('sidebar-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'sidebar-overlay';
      overlay.className = 'sidebar-overlay';
      document.body.appendChild(overlay);
    }
    
    if (toggleBtn && sidebar) {
      const newToggle = toggleBtn.cloneNode(true);
      toggleBtn.parentNode.replaceChild(newToggle, toggleBtn);
      
      newToggle.addEventListener('click', () => {
        sidebar.classList.add('active');
        overlay.classList.add('active');
      });
    }
    
    if (overlay && sidebar) {
      overlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
      });
    }
    
    if (sidebarToggleBtn && sidebar) {
      const newSidebarToggleBtn = sidebarToggleBtn.cloneNode(true);
      sidebarToggleBtn.parentNode.replaceChild(newSidebarToggleBtn, sidebarToggleBtn);
      
      newSidebarToggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        
        // Only adjust margin on desktop
        if (window.innerWidth > 768) {
           document.getElementById('main-wrapper').style.marginLeft = 
             sidebar.classList.contains('collapsed') ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)';
        }
      });
    }

    // Auto close sidebar on route change on mobile
    window.addEventListener('hashchange', () => {
      if (window.innerWidth <= 768 && sidebar && overlay) {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
      }
    });
  },

  setupChatbotFab() {
    const fab = document.getElementById('chatbot-fab');
    if (fab) {
      const newFab = fab.cloneNode(true);
      fab.parentNode.replaceChild(newFab, fab);
      newFab.addEventListener('click', () => {
        window.location.hash = '#/chatbot';
      });
    }
  },

  setupNotifications() {
    const user = Auth.getCurrentUser();
    if (!user) return;
    
    const btn = document.getElementById('btn-notifications');
    if (!btn) return;

    // Create dropdown container if not exists
    let dropdown = document.getElementById('notification-dropdown');
    if (!dropdown) {
      dropdown = document.createElement('div');
      dropdown.id = 'notification-dropdown';
      dropdown.className = 'notification-dropdown';
      btn.parentNode.style.position = 'relative'; // Ensure parent is relative
      btn.parentNode.appendChild(dropdown);
    }

    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    
    newBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('show');
      if (dropdown.classList.contains('show')) {
        this.renderNotifications(dropdown, user.id);
      }
    });

    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target) && !newBtn.contains(e.target)) {
        dropdown.classList.remove('show');
      }
    });

    this.updateNotificationBadge();
  },

  renderNotifications(container, userId) {
    const notifs = Database.notifications.getByUserId(userId);
    const unread = notifs.filter(n => !n.read).length;

    container.innerHTML = `
      <div class="notif-header">
        <span>${t('Thông báo ({count})', { count: unread })}</span>
        <button class="btn btn-icon btn-sm" id="btn-read-all" title="${t('Đánh dấu đã đọc tất cả')}">
          <i class="fas fa-check-double"></i>
        </button>
      </div>
      <div class="notif-body">
        ${notifs.length === 0 ? `<div style="padding: 1rem; text-align: center; color: var(--text-tertiary);">${t('Không có thông báo nào')}</div>` : ''}
        ${notifs.map(n => `
          <div class="notif-item ${!n.read ? 'unread' : ''}" data-id="${n.id}">
            <div class="notif-icon" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 50%; flex-shrink: 0; background: var(--${n.type === 'error' ? 'danger' : n.type === 'warning' ? 'warning' : 'primary'}-100); color: var(--${n.type === 'error' ? 'danger' : n.type === 'warning' ? 'warning' : 'primary'}-600)">
              <i class="fas fa-${n.type === 'error' ? 'exclamation-circle' : n.type === 'warning' ? 'exclamation-triangle' : 'info-circle'}" style="font-size: 1.25rem;"></i>
            </div>
            <div class="notif-content">
              <div class="notif-title">${t(n.title)}</div>
              <div class="notif-desc">${t(n.message)}</div>
              <div class="notif-time">${new Date(n.createdAt).toLocaleString(t('vi-VN'))}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    document.getElementById('btn-read-all')?.addEventListener('click', () => {
      Database.notifications.markAllAsRead(userId);
      this.renderNotifications(container, userId);
      this.updateNotificationBadge();
    });

    container.querySelectorAll('.notif-item').forEach(item => {
      item.addEventListener('click', () => {
        Database.notifications.markAsRead(item.dataset.id);
        this.renderNotifications(container, userId);
        this.updateNotificationBadge();
      });
    });
  },

  updateNotificationBadge() {
    const user = Auth.getCurrentUser();
    if (!user) return;
    
    const badge = document.getElementById('notification-badge');
    if (badge) {
      const count = Database.notifications.getUnreadCount(user.id);
      badge.textContent = count > 99 ? '99+' : count;
      badge.style.display = count > 0 ? 'flex' : 'none';
      if (count > 0) {
        badge.classList.add('pulse');
      } else {
        badge.classList.remove('pulse');
      }
    }
  },

  setupHelpdeskBadge() {
    const user = Auth.getCurrentUser();
    if (!user) return;
    
    const btn = document.getElementById('btn-helpdesk-top');
    if (!btn) return;

    if (user.role === 'admin' || user.role === 'teacher') {
      btn.style.display = 'inline-flex';
      const badge = document.getElementById('helpdesk-badge');
      const bugStats = Database.bugs.countByStatus ? Database.bugs.countByStatus() : {};
      const pendingBugsCount = (bugStats['new'] || 0) + (bugStats['in-progress'] || 0);
      
      if (badge) {
        badge.textContent = pendingBugsCount > 99 ? '99+' : pendingBugsCount;
        badge.style.display = pendingBugsCount > 0 ? 'flex' : 'none';
        if (pendingBugsCount > 0) badge.classList.add('pulse');
      }

      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      newBtn.addEventListener('click', () => {
        window.location.hash = '#/helpdesk';
      });
    } else {
      btn.style.display = 'none';
    }
  },

  setupRealtimeClock() {
    const clockTimeEl = document.getElementById('clock-time');
    const clockDateEl = document.getElementById('clock-date');
    if (!clockTimeEl || !clockDateEl) return;

    const updateClock = () => {
      const now = new Date();
      // Time format: HH:MM:SS
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      clockTimeEl.textContent = `${hours}:${minutes}:${seconds}`;

      // Date format: DD/MM/YYYY
      const date = now.getDate().toString().padStart(2, '0');
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const year = now.getFullYear();
      clockDateEl.textContent = `${date}/${month}/${year}`;
    };

    // Update immediately and then every second
    updateClock();
    if (this.clockInterval) clearInterval(this.clockInterval);
    this.clockInterval = setInterval(updateClock, 1000);
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());



