// review.js — Standalone Review/Preview Page Logic
// No dependencies on app.js, auth.js, or other view files

const UNIVERSITIES = [
  { id: 1, name: 'Đại học Bách Khoa', enName: 'University of Science and Technology', desc: 'Đại học kỹ thuật hàng đầu miền Trung', shortName: 'DUT', feePerCredit: 385000, increaseRate: 10 },
  { id: 2, name: 'Đại học Kinh tế', enName: 'University of Economics', desc: 'Đào tạo kinh tế, quản trị kinh doanh', shortName: 'DUE', feePerCredit: 425600, increaseRate: 12 },
  { id: 3, name: 'Đại học Sư phạm', enName: 'University of Education', desc: 'Trung tâm đào tạo giáo viên và khoa học cơ bản', shortName: 'UED', feePerCredit: 320000, increaseRate: 0 },
  { id: 4, name: 'Đại học Ngoại ngữ', enName: 'University of Foreign Language Studies', desc: 'Nơi khởi nguồn ngôn ngữ và văn hóa', shortName: 'UFLS', feePerCredit: 340000, increaseRate: 0 },
  { id: 5, name: 'Đại học FPT Đà Nẵng', enName: 'FPT University Da Nang', desc: 'Trường đại học của doanh nghiệp (Tư thục)', shortName: 'FPT', feePerCredit: 1296000, increaseRate: 8 },
  { id: 6, name: 'Đại học Duy Tân', enName: 'Duy Tan University', desc: 'Đại học tư thục lớn nhất miền Trung (Tư thục)', shortName: 'DTU', feePerCredit: 977500, increaseRate: 15 },
  { id: 7, name: 'Đại học Đông Á', enName: 'Dong A University', desc: 'Đầu tư phát triển toàn diện (Tư thục)', shortName: 'UDA', feePerCredit: 817500, increaseRate: 9 },
  { id: 8, name: 'Đại học Kiến trúc Đà Nẵng', enName: 'Da Nang Architecture University', desc: 'Kiến trúc, Mỹ thuật và Xây dựng (Tư thục)', shortName: 'DAU', feePerCredit: 650000, increaseRate: 0 },
  { id: 9, name: 'Đại học Sư phạm Kỹ thuật', enName: 'University of Technology and Education', desc: 'Kỹ thuật thực hành và Ứng dụng', shortName: 'UTE', feePerCredit: 410400, increaseRate: 14 },
  { id: 10, name: 'Đại học CNTT & TT Việt - Hàn', enName: 'Vietnam-Korea University of IT & C', desc: 'Công nghệ Thông tin và Kinh tế số', shortName: 'VKU', feePerCredit: 444000, increaseRate: 11 },
  { id: 11, name: 'Khoa Y Dược', enName: 'School of Medicine and Pharmacy', desc: 'Đào tạo Y bác sĩ chất lượng cao', shortName: 'UMP', feePerCredit: 678000, increaseRate: 13 }
];

const ReviewApp = {
  currentTab: 'home',
  _chatHistory: [],
  _isChatTyping: false,

  tabs: [
    { id: 'home',         icon: 'fas fa-home', label: 'home_tab' },
    { id: 'universities', icon: 'fas fa-university', label: 'uni_tab' },
    { id: 'chatbot',      icon: 'fas fa-robot', label: 'ai_tab' },
  ],

  // Translation dictionary for Review App
  i18n: {
    vi: {
      login: 'Đăng nhập',
      register: 'Đăng ký',
      login_required: 'Yêu cầu Đăng nhập',
      login_required_desc: 'Hãy đăng nhập hoặc đăng ký tài khoản để có thể khám phá thêm các tính năng quản lý chuyên sâu và trải nghiệm môi trường số toàn diện của UniMS.',
      close: 'Đóng',
      login_now: 'Đăng nhập ngay',
      preview_watermark: 'Bạn đang xem bản xem trước — Đăng nhập để trải nghiệm đầy đủ tính năng',
      home_tab: 'Trang chủ',
      uni_tab: 'Trường Đại Học',
      ai_tab: 'AI Trợ lý',
      ai_desc: 'Trợ lý thông minh hỗ trợ giải đáp thắc mắc',
      admission: 'Tuyển sinh 2026',
      moet_news: 'Tin tức Bộ Giáo dục & Đào tạo',
      moet_desc: 'Cập nhật liên tục các thông tin mới nhất',
      network: 'Mạng lưới Đại học Đà Nẵng',
      network_desc: 'Kết nối và chia sẻ tài nguyên giáo dục',
      school_type: 'Trường Công lập & Tư thục',
      student_count: 'Sinh viên',
      teacher_count: 'Giảng viên',
      major_count: 'Chuyên ngành',
      admission_info: 'Thông tin tuyển sinh 2026',
      admission_detail: 'Xét tuyển thẳng, Xét kết quả thi THPT, Xét học bạ THPT và Xét kết quả kỳ thi ĐGNL.',
      download_project: 'Tải Đề án Tuyển sinh',
      env_review: 'Đánh giá môi trường',
      per_credit: '/ tín chỉ',
      ai_placeholder: 'Hỏi về trường học, tuyển sinh, tín chỉ...',
      ai_sending: 'Đang trả lời...',
      ai_welcome: 'Xin chào! Tôi có thể giúp bạn tìm hiểu thông tin về các trường đại học, quy chế tuyển sinh, học phí, và các tín chỉ của năm nay. Bạn muốn hỏi gì?',
      n1: '🔴 Bộ GD&ĐT công bố quy chế thi tốt nghiệp THPT 2026 với nhiều điểm mới.',
      n2: '🔴 Các trường Đại học tại Đà Nẵng đồng loạt mở cổng đăng ký xét tuyển học bạ đợt 1.',
      n3: '🔴 Thí sinh lưu ý hạn chót điều chỉnh nguyện vọng vào 17h00 ngày 30/08.',
      t1: 'Nhiều trường Đại học công bố phương án tuyển sinh 2026',
      d1: 'Năm nay, xu hướng xét tuyển kết hợp chứng chỉ quốc tế và điểm thi ĐGNL tiếp tục tăng mạnh...',
      t2: 'Bộ GD&ĐT hướng dẫn triển khai nhiệm vụ năm học mới',
      d2: 'Tập trung nâng cao chất lượng giáo dục đại học, đẩy mạnh chuyển đổi số trong quản lý...',
      t3: 'Hội nghị Hiệu trưởng các trường Đại học toàn quốc',
      d3: 'Bàn về giải pháp nâng cao chất lượng đầu ra, gắn kết chặt chẽ với nhu cầu doanh nghiệp...',
      ago1: '1 giờ trước',
      ago2: '3 giờ trước',
      ago3: 'Hôm qua',
      tuition_policy: 'Chính sách học phí',
      student_reviews: 'Đánh giá từ sinh viên',
      apply_now: 'Đăng ký xét tuyển ngay',
      center_node: 'Trung tâm Dữ liệu<br>ĐH Đà Nẵng',
      node_dut: 'ĐH Bách Khoa<br><span style="font-size:0.7rem;font-weight:400;">(Kỹ thuật - Công nghệ)</span>',
      node_due: 'ĐH Kinh tế<br><span style="font-size:0.7rem;font-weight:400;">(Kinh doanh - Quản lý)</span>',
      node_ued: 'ĐH Sư phạm<br><span style="font-size:0.7rem;font-weight:400;">(Khoa học cơ bản)</span>',
      node_ufls: 'ĐH Ngoại ngữ<br><span style="font-size:0.7rem;font-weight:400;">(Ngôn ngữ - Văn hóa)</span>'
    },
    en: {
      login: 'Login',
      register: 'Register',
      login_required: 'Login Required',
      login_required_desc: 'Please login or register to explore more advanced management features and experience the comprehensive digital environment of UniMS.',
      close: 'Close',
      login_now: 'Login Now',
      preview_watermark: 'You are viewing a preview — Login to experience full features',
      home_tab: 'Home',
      uni_tab: 'Universities',
      ai_tab: 'AI Assistant',
      ai_desc: 'Smart assistant to help answer questions',
      admission: 'Admission 2026',
      moet_news: 'MOET News',
      moet_desc: 'Continuously updated with the latest information',
      network: 'Da Nang University Network',
      network_desc: 'Connecting and sharing educational resources',
      school_type: 'Public & Private Schools',
      student_count: 'Students',
      teacher_count: 'Lecturers',
      major_count: 'Majors',
      admission_info: 'Admission Info 2026',
      admission_detail: 'Direct admission, High school exam results, Transcript review and Competency assessment.',
      download_project: 'Download Admission Project',
      env_review: 'Environment Reviews',
      per_credit: '/ credit',
      ai_placeholder: 'Ask about schools, admissions, credits...',
      ai_sending: 'Replying...',
      ai_welcome: 'Hello! I can help you find information about universities, admission regulations, tuition fees, and credits for this year. What would you like to ask?',
      n1: '🔴 MOET announces the 2026 High School Graduation Exam regulations with many new points.',
      n2: '🔴 Universities in Da Nang simultaneously open the first batch of transcript admission registration.',
      n3: '🔴 Candidates please note the deadline for adjusting aspirations is 17:00 on August 30.',
      t1: 'Many universities announce 2026 admission plans',
      d1: 'This year, the trend of combining international certificates and competency assessment scores continues to increase...',
      t2: 'MOET guides the implementation of tasks for the new school year',
      d2: 'Focus on improving the quality of higher education, promoting digital transformation in management...',
      t3: 'National Conference of University Rectors',
      d3: 'Discussing solutions to improve output quality, closely linked to business needs...',
      ago1: '1 hour ago',
      ago2: '3 hours ago',
      ago3: 'Yesterday',
      tuition_policy: 'Tuition Policy',
      student_reviews: 'Student Reviews',
      apply_now: 'Apply Now',
      center_node: 'Data Center<br>Da Nang Univ',
      node_dut: 'Univ of Sci & Tech<br><span style="font-size:0.7rem;font-weight:400;">(Engineering & Tech)</span>',
      node_due: 'Univ of Economics<br><span style="font-size:0.7rem;font-weight:400;">(Business & Management)</span>',
      node_ued: 'Univ of Education<br><span style="font-size:0.7rem;font-weight:400;">(Basic Sciences)</span>',
      node_ufls: 'Univ of Foreign Languages<br><span style="font-size:0.7rem;font-weight:400;">(Languages & Culture)</span>',

      // Universities
      'Đại học Bách Khoa': 'University of Science and Technology',
      'Đại học kỹ thuật hàng đầu miền Trung': 'Leading technical university in Central Vietnam',
      'Đại học Kinh tế': 'University of Economics',
      'Đào tạo kinh tế, quản trị kinh doanh': 'Economics and business administration training',
      'Đại học Sư phạm': 'University of Education',
      'Trung tâm đào tạo giáo viên và khoa học cơ bản': 'Center for teacher training and basic sciences',
      'Đại học Ngoại ngữ': 'University of Foreign Language Studies',
      'Nơi khởi nguồn ngôn ngữ và văn hóa': 'Where languages and cultures originate',
      'Đại học FPT Đà Nẵng': 'FPT University Da Nang',
      'Trường đại học của doanh nghiệp (Tư thục)': 'Corporate University (Private)',
      'Đại học Duy Tân': 'Duy Tan University',
      'Đại học tư thục lớn nhất miền Trung (Tư thục)': 'The largest private university in Central Vietnam (Private)',
      'Đại học Đông Á': 'Dong A University',
      'Đầu tư phát triển toàn diện (Tư thục)': 'Comprehensive development investment (Private)',
      'Đại học Kiến trúc Đà Nẵng': 'Da Nang Architecture University',
      'Kiến trúc, Mỹ thuật và Xây dựng (Tư thục)': 'Architecture, Fine Arts and Construction (Private)',
      'Đại học Sư phạm Kỹ thuật': 'University of Technology and Education',
      'Kỹ thuật thực hành và Ứng dụng': 'Practical Technology and Applications',
      'Đại học CNTT & TT Việt - Hàn': 'Vietnam-Korea University of IT & C',
      'Công nghệ Thông tin và Kinh tế số': 'Information Technology and Digital Economy',
      'Khoa Y Dược': 'School of Medicine and Pharmacy',
      'Đào tạo Y bác sĩ chất lượng cao': 'High-quality medical doctor training',
    }
  },

  getLang() {
    try {
      const settings = JSON.parse(localStorage.getItem('unims_settings'));
      return settings?.language || 'vi';
    } catch {
      return 'vi';
    }
  },

  setLang(lang) {
    try {
      let settings = JSON.parse(localStorage.getItem('unims_settings')) || {};
      settings.language = lang;
      localStorage.setItem('unims_settings', JSON.stringify(settings));
    } catch (e) {}
  },

  t(key) {
    const lang = this.getLang();
    return this.i18n[lang]?.[key] || this.i18n['vi']?.[key] || key;
  },

  updateTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = this.t(key);
        } else {
          el.innerHTML = this.t(key); // Use innerHTML to allow icons or HTML from translations
        }
      }
    });
    
    // Update toggle button text
    const langLabel = document.getElementById('rv-lang-label');
    if (langLabel) {
      langLabel.textContent = this.getLang().toUpperCase();
    }
  },

  showToast(message, type) {
    if (!type) type = 'success';
    var container = document.getElementById('rv-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'rv-toast-container';
      container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 10000; display: flex; flex-direction: column; gap: 10px; pointer-events: none;';
      document.body.appendChild(container);
    }
    var bgColor = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6';
    var iconClass = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
    var toast = document.createElement('div');
    toast.style.cssText = 'pointer-events: auto; background: ' + bgColor + '; color: white; padding: 12px 20px; border-radius: 8px; font-weight: 500; font-size: 0.95rem; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); transform: translateY(-20px); opacity: 0; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);';
    toast.innerHTML = '<i class="fas ' + iconClass + '" style="margin-right: 8px;"></i>' + message;
    container.appendChild(toast);
    requestAnimationFrame(function() {
      toast.style.transform = 'translateY(0)';
      toast.style.opacity = '1';
    });
    setTimeout(function() {
      toast.style.transform = 'translateY(-20px)';
      toast.style.opacity = '0';
      setTimeout(function() { toast.remove(); }, 300);
    }, 3000);
  },

  init() {
    this.initScrollQoL(); // MUST run before renderContent to initialize revealObserver
    this.renderTabs();
    this.renderContent();
    this.bindEvents();
    this.initClock();
    this.updateTranslations();

    if (window.location.hash === '#login') {
      setTimeout(() => this.showLoginModal(), 300);
    }
  },

  initScrollQoL() {
    const progressBar = document.getElementById('rv-progress-bar');
    const scrollTopBtn = document.getElementById('rv-scroll-top');
    const reviewContent = document.getElementById('review-content');

    let lastScrollTop = 0;
    const reviewHeader = document.querySelector('.review-header');

    // ✅ Reading progress bar + scroll-to-top visibility
    const onScroll = () => {
      const scrollEl = reviewContent || document.documentElement;
      const scrollTop = scrollEl.scrollTop || window.scrollY;
      const scrollHeight = (scrollEl.scrollHeight || document.documentElement.scrollHeight) - (scrollEl.clientHeight || window.innerHeight);
      const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;

      if (progressBar) progressBar.style.width = Math.min(progress, 100) + '%';

      if (scrollTopBtn) {
        if (scrollTop > 300) {
          scrollTopBtn.style.display = 'flex';
          scrollTopBtn.style.opacity = '1';
          scrollTopBtn.style.transform = 'scale(1)';
        } else {
          scrollTopBtn.style.opacity = '0';
          scrollTopBtn.style.transform = 'scale(0.8)';
          setTimeout(() => {
            if (scrollTop <= 300) scrollTopBtn.style.display = 'none';
          }, 300);
        }
      }

      // ✅ Scroll spy — highlight active nav tab based on visible section
      this.updateActiveNavByScroll(scrollTop);
      
      // Smart Header logic
      if (reviewHeader) {
        if (scrollTop > 50 && scrollTop > lastScrollTop) {
          document.body.classList.add('smart-header-hidden');
        } else if (scrollTop < lastScrollTop) {
          document.body.classList.remove('smart-header-hidden');
        }
      }
      lastScrollTop = Math.max(0, scrollTop); // For Mobile or negative scrolling
    };

    if (reviewContent) {
      reviewContent.addEventListener('scroll', onScroll);
    }
    window.addEventListener('scroll', onScroll);

    // ✅ Scroll to top on button click
    if (scrollTopBtn) {
      scrollTopBtn.addEventListener('click', () => {
        const scrollEl = reviewContent || document.documentElement;
        scrollEl.scrollTo({ top: 0, behavior: 'smooth' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // ✅ Intersection Observer for Scroll Reveal
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        } else {
          entry.target.classList.remove('active');
        }
      });
    }, { threshold: 0 });

    // Expose observer to the instance so newly rendered items can be observed
    this.revealObserver = observer;
  },

  updateActiveNavByScroll(scrollTop) {
    // Only meaningful when on 'home' tab with multiple sections
    const navItems = document.querySelectorAll('.review-nav-item');
    if (!navItems.length) return;
    // Simple: mark current tab as active; sections inside tabs handle their own state
    navItems.forEach(item => {
      item.classList.toggle('active', item.dataset.tab === this.currentTab);
    });
  },


  initClock() {
    const timeEl = document.getElementById('rv-time');
    const dateEl = document.getElementById('rv-date');
    if (!timeEl || !dateEl) return;

    const updateClock = () => {
      const now = new Date();
      timeEl.textContent = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      dateEl.textContent = now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    updateClock();
    setInterval(updateClock, 1000);
  },

  // ── Floating Cubes Animation ──
  initParticles() {
    const container = document.getElementById('login-particles');
    if (!container) return;
    container.innerHTML = '';
    const numParticles = 15;
    for (let i = 0; i < numParticles; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      const size = Math.random() * 40 + 20;
      p.style.width = size + 'px';
      p.style.height = size + 'px';
      p.style.left = Math.random() * 100 + '%';
      p.style.top = Math.random() * 100 + '%';
      p.style.animationDuration = (Math.random() * 20 + 10) + 's';
      p.style.animationDelay = '-' + (Math.random() * 20) + 's';
      container.appendChild(p);
    }
  },

  // ── Render Navigation Tabs ──
  renderTabs() {
    const nav = document.getElementById('review-nav');
    if (!nav) return;
    nav.innerHTML = this.tabs.map(tab => `
      <div class="review-tab ${tab.id === this.currentTab ? 'active' : ''}" data-tab="${tab.id}">
        <i class="${tab.icon}"></i>
        <span>${this.t(tab.label)}</span>
      </div>
    `).join('');
  },

  // ── Switch Tab ──
  switchTab(tabId) {
    this.currentTab = tabId;
    document.querySelectorAll('.review-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === tabId);
    });
    this.renderContent();
  },

  // ── Render Content Based on Tab ──
  renderContent() {
    const content = document.getElementById('review-content');
    if (!content) return;
    
    // Reset fade-in animation safely without destroying DOM node
    content.style.animation = 'none';
    void content.offsetWidth; // trigger reflow
    content.style.animation = 'rvFadeIn 0.3s ease';
    
    const newContent = content;

    const views = {
      home:         () => this.renderHome(),
      universities: () => this.renderUniversities(),
      chatbot:      () => {
        const html = this.renderChatbot();
        setTimeout(() => this._renderChatHistory(), 0);
        return html;
      }
    };

    newContent.innerHTML = (views[this.currentTab] || views.home)();
    
    // Fetch news dynamically if on home tab
    if (this.currentTab === 'home') {
      const grid = document.getElementById('rv-home-news-grid');
      if (grid && this.revealObserver) {
        grid.querySelectorAll('.reveal').forEach(el => this.revealObserver.observe(el));
      }
    }

    // Attach IntersectionObserver for Scroll Reveal on static elements
    if (this.revealObserver) {
      newContent.querySelectorAll('.reveal').forEach(el => this.revealObserver.observe(el));
    }

    // Re-bind events since element was replaced
    this.bindEvents();
    
    // Ensure static translations are applied
    this.updateTranslations();
    
    newContent.style.opacity = '0';
    requestAnimationFrame(() => {
      newContent.style.transition = 'opacity 0.3s ease';
      newContent.style.opacity = '1';
    });
  },

  // ── HOME TAB (Trang chủ) ──
  renderHome() {
    const newsData = [
      {
        title: 'Nhiều trường Đại học công bố phương án tuyển sinh 2026',
        desc: 'Xu hướng xét tuyển kết hợp chứng chỉ quốc tế và điểm thi đánh giá năng lực tiếp tục tăng mạnh tại các trường Đại học trên cả nước.',
        source: 'VNExpress Giáo dục',
        url: 'https://vnexpress.net/giao-duc',
        time: '2 giờ trước',
        imgUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80'
      },
      {
        title: 'Bộ GD&ĐT hướng dẫn triển khai nhiệm vụ năm học mới 2026-2027',
        desc: 'Tập trung nâng cao chất lượng giáo dục đại học, đẩy mạnh chuyển đổi số trong quản lý và đào tạo nguồn nhân lực chất lượng cao.',
        source: 'Bộ GD&ĐT',
        url: 'https://moet.gov.vn',
        time: '5 giờ trước',
        imgUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80'
      },
      {
        title: 'Chính sách hỗ trợ tín dụng sinh viên và học bổng năm 2026',
        desc: 'Thủ tướng phê duyệt gói hỗ trợ lãi suất 0% cho sinh viên khối ngành sư phạm, kỹ thuật và công nghệ thông tin trên toàn quốc.',
        source: 'Dân Trí Giáo dục',
        url: 'https://dantri.com.vn/giao-duc',
        time: 'Hôm qua',
        imgUrl: 'https://images.unsplash.com/photo-1577412647305-991150c7d163?w=800&q=80'
      }
    ];

    const newsHtml = newsData.map((n, i) => this._newsCard(n, i)).join('');

    return `
      <!-- Ticker Tuyển sinh -->
      <div class="rv-ticker-wrap rv-interactive">
        <div class="rv-ticker-label"><i class="fas fa-bullhorn"></i> ${this.t('admission')}</div>
        <div class="rv-ticker-content">
          <div class="rv-ticker-text">
            <span>${this.t('n1')}</span>
            <span>${this.t('n2')}</span>
            <span>${this.t('n3')}</span>
            <span>${this.t('n1')}</span>
          </div>
        </div>
      </div>

      <!-- Khối tin tức Bộ GD&ĐT (MOET) -->
      <div style="margin-bottom: var(--space-4); margin-top: var(--space-5);">
        <h2 style="font-size: 1.4rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">${this.t('moet_news')}</h2>
        <p style="font-size: 0.9rem; color: var(--text-secondary);">${this.t('moet_desc')}</p>
      </div>

      <div class="rv-news-grid" id="rv-home-news-grid">
        ${newsHtml}
      </div>

      <!-- Liên kết tĩnh (Static Links) -->
      <div style="margin-bottom: var(--space-4); margin-top: var(--space-6);">
        <h2 style="font-size: 1.4rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">Liên kết hữu ích / Useful Links</h2>
        <p style="font-size: 0.9rem; color: var(--text-secondary);">Truy cập nhanh các cổng thông tin chính thức</p>
      </div>

      <div style="display: flex; gap: var(--space-4); flex-wrap: wrap; margin-bottom: var(--space-6);">
        <a href="https://moet.gov.vn/" target="_blank" class="rv-news-card reveal" style="flex: 1; min-width: 250px; text-decoration: none; display: flex; align-items: center; padding: 20px; gap: 16px;">
          <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(59,130,246,0.1); color: var(--primary-600); display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
            <i class="fas fa-university"></i>
          </div>
          <div>
            <h3 style="font-size: 1.1rem; color: var(--text-primary); margin: 0 0 4px 0;">Bộ Giáo dục & Đào tạo</h3>
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 0;">moet.gov.vn</p>
          </div>
        </a>

        <a href="https://thitotnghiepthpt.edu.vn/" target="_blank" class="rv-news-card reveal" style="flex: 1; min-width: 250px; text-decoration: none; display: flex; align-items: center; padding: 20px; gap: 16px;">
          <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(16,185,129,0.1); color: var(--success); display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
            <i class="fas fa-user-graduate"></i>
          </div>
          <div>
            <h3 style="font-size: 1.1rem; color: var(--text-primary); margin: 0 0 4px 0;">Cổng thông tin Tuyển sinh</h3>
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 0;">thitotnghiepthpt.edu.vn</p>
          </div>
        </a>

        <a href="#/students" class="rv-news-card reveal" style="flex: 1; min-width: 250px; text-decoration: none; display: flex; align-items: center; padding: 20px; gap: 16px;">
          <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(245,158,11,0.1); color: var(--warning); display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
            <i class="fas fa-info-circle"></i>
          </div>
          <div>
            <h3 style="font-size: 1.1rem; color: var(--text-primary); margin: 0 0 4px 0;">Thông tin Tân Sinh viên</h3>
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 0;">Hướng dẫn nhập học</p>
          </div>
        </a>
      </div>

      <!-- Section 1: Data Highlights -->
      <section class="rv-stats-strip reveal" style="background: linear-gradient(135deg, var(--primary-800), var(--primary-900)); color: #fff; border-radius: var(--radius-lg); padding: var(--space-8); margin-bottom: var(--space-8); display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-6); text-align: center; box-shadow: var(--shadow-lg);">
        <div>
          <div style="font-size: 2.5rem; font-weight: 800; color: var(--primary-300); margin-bottom: 8px;">1.2M+</div>
          <div style="font-size: 1.05rem; opacity: 0.9;">Số lượng học sinh 2026</div>
        </div>
        <div>
          <div style="font-size: 2.5rem; font-weight: 800; color: var(--success); margin-bottom: 8px;">95.6%</div>
          <div style="font-size: 1.05rem; opacity: 0.9;">Tỷ lệ đậu Đại học</div>
        </div>
        <div>
          <div style="font-size: 2.5rem; font-weight: 800; color: var(--warning); margin-bottom: 8px;">680K+</div>
          <div style="font-size: 1.05rem; opacity: 0.9;">Tổng chỉ tiêu tuyển sinh</div>
        </div>
      </section>

      <!-- Section 2: Admission Quotas -->
      <section style="margin-bottom: var(--space-8);">
        <div style="margin-bottom: var(--space-5); text-align: center;">
          <h2 style="font-size: 1.8rem; font-weight: 800; color: var(--text-primary); margin-bottom: 8px;">Thông tin Chỉ tiêu các Trường</h2>
          <p style="font-size: 1.05rem; color: var(--text-secondary);">Dự kiến chỉ tiêu tuyển sinh năm 2026 của các trường Top đầu</p>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--space-5);">
          <div class="rv-news-card reveal" style="padding: var(--space-5); text-align: center; background: #fff;">
            <div style="width: 80px; height: 80px; margin: 0 auto var(--space-4); background: url('https://upload.wikimedia.org/wikipedia/commons/2/2c/Toa_S_DUT.jpg') center/cover; border-radius: 50%;"></div>
            <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--primary-700); margin-bottom: 8px;">Đại học Bách Khoa</h3>
            <p style="color: var(--text-secondary); margin-bottom: 16px;">Kỹ thuật, Công nghệ & IT</p>
            <div style="font-size: 1.5rem; font-weight: 800; color: var(--success);">4,500 <span style="font-size: 0.9rem; font-weight: 500; color: var(--text-tertiary);">chỉ tiêu</span></div>
          </div>
          <div class="rv-news-card reveal" style="padding: var(--space-5); text-align: center; background: #fff; transition-delay: 100ms;">
            <div style="width: 80px; height: 80px; margin: 0 auto var(--space-4); background: url('https://upload.wikimedia.org/wikipedia/commons/4/49/Logo_DUE.jpg') center/cover; border-radius: 50%;"></div>
            <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--primary-700); margin-bottom: 8px;">Đại học Kinh tế</h3>
            <p style="color: var(--text-secondary); margin-bottom: 16px;">Kinh tế, Quản trị & Marketing</p>
            <div style="font-size: 1.5rem; font-weight: 800; color: var(--success);">3,200 <span style="font-size: 0.9rem; font-weight: 500; color: var(--text-tertiary);">chỉ tiêu</span></div>
          </div>
          <div class="rv-news-card reveal" style="padding: var(--space-5); text-align: center; background: #fff; transition-delay: 200ms;">
            <div style="width: 80px; height: 80px; margin: 0 auto var(--space-4); background: url('https://images.unsplash.com/photo-1577412647305-991150c7d163?w=800&q=80') center/cover; border-radius: 50%;"></div>
            <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--primary-700); margin-bottom: 8px;">Đại học Sư phạm</h3>
            <p style="color: var(--text-secondary); margin-bottom: 16px;">Giáo dục, Khoa học Tự nhiên & Xã hội</p>
            <div style="font-size: 1.5rem; font-weight: 800; color: var(--success);">2,800 <span style="font-size: 0.9rem; font-weight: 500; color: var(--text-tertiary);">chỉ tiêu</span></div>
          </div>
        </div>
      </section>

      <!-- Section 3: Gallery / Info Block -->
      <section style="margin-bottom: var(--space-8);">
        <div style="margin-bottom: var(--space-6); text-align: center;">
          <h2 style="font-size: 1.8rem; font-weight: 800; color: var(--text-primary); margin-bottom: 8px;">Hành trang & Định hướng</h2>
          <p style="font-size: 1.05rem; color: var(--text-secondary);">Chuẩn bị tốt nhất cho chặng đường Đại học phía trước</p>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: var(--space-6);">
          <div class="reveal" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--space-6); align-items: center;">
            <div style="border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-md);">
              <img src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80" alt="Môi trường học tập" style="width: 100%; aspect-ratio: 16/9; object-fit: cover; display: block;" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1546410531-df4cb71576ac?w=800&q=80';">
            </div>
            <div>
              <h3 style="font-size: 1.5rem; font-weight: 700; color: var(--primary-600); margin-bottom: 12px;">Môi trường học tập hiện đại</h3>
              <p style="color: var(--text-secondary); font-size: 1.05rem; line-height: 1.6; margin-bottom: 16px;">Trải nghiệm không gian học thuật tiên tiến với trang thiết bị đầy đủ, thư viện số và các phòng thí nghiệm mô phỏng thực tế giúp sinh viên phát triển toàn diện kỹ năng chuyên môn.</p>
              <ul style="color: var(--text-secondary); padding-left: 20px; line-height: 1.8;">
                <li>Phòng Lab tiêu chuẩn quốc tế</li>
                <li>Thư viện thông minh 24/7</li>
                <li>Khu vực Coworking space sáng tạo</li>
              </ul>
            </div>
          </div>
          
          <div class="reveal" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--space-6); align-items: center; transition-delay: 150ms;">
            <div style="order: 2;">
              <h3 style="font-size: 1.5rem; font-weight: 700; color: var(--primary-600); margin-bottom: 12px;">Kết nối Doanh nghiệp & Việc làm</h3>
              <p style="color: var(--text-secondary); font-size: 1.05rem; line-height: 1.6; margin-bottom: 16px;">Mạng lưới đối tác doanh nghiệp rộng khắp mang đến hàng ngàn cơ hội thực tập và việc làm ngay từ khi còn ngồi trên ghế nhà trường. Sinh viên được trang bị kỹ năng thực chiến.</p>
              <ul style="color: var(--text-secondary); padding-left: 20px; line-height: 1.8;">
                <li>Thực tập hưởng lương (Paid Internship)</li>
                <li>Job Fair thường niên</li>
                <li>Định hướng nghề nghiệp 1-1</li>
              </ul>
            </div>
            <div style="border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-md); order: 1;">
              <img src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80" alt="Kết nối việc làm" style="width: 100%; aspect-ratio: 16/9; object-fit: cover; display: block;" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1546410531-df4cb71576ac?w=800&q=80';">
            </div>
          </div>
        </div>
      </section>

      </div>
    `;
  },

  // ── UNIVERSITIES TAB ──
  renderUniversities() {
    const unis = typeof UNIVERSITIES !== 'undefined' ? UNIVERSITIES : [];
    
    return `
      <div style="margin-bottom: var(--space-4);">
        <h2 style="font-size: 1.4rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">${this.t('uni_tab')}</h2>
        <p style="font-size: 0.9rem; color: var(--text-secondary);">${this.t('school_type')}</p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px; margin-bottom: 32px; padding-bottom: 20px;">
        ${unis.map((u, idx) => {
          let logoName = u.shortName.toLowerCase();
          if (logoName === 'donga') logoName = 'uda';
          const ext = (logoName === 'ued') ? 'jpg' : 'png';
          return `
          <div class="rv-news-card rv-uni-item reveal" data-uni-id="${u.id}" style="display: flex; flex-direction: column; cursor: pointer; transition-delay: ${(idx % 3) * 100}ms; height: 100%;">
            <div class="rv-news-content" style="flex: 1; display: flex; flex-direction: column;">
              <div class="rv-news-title" style="font-size: 1.15rem; color: var(--primary-600); display: flex; align-items: center; gap: 8px;">
                <div style="width: 40px; height: 40px; border-radius: 8px; overflow: hidden; display: flex; justify-content: center; align-items: center; flex-shrink: 0; background: transparent;">
                  <img src="/static/assets/logos/${logoName}.${ext}" alt="${u.shortName}" style="width: 100%; height: 100%; object-fit: contain; padding: 2px; box-sizing: border-box; mix-blend-mode: multiply;" onerror="this.onerror=null; this.parentElement.innerHTML='<i class=\\'fas fa-university\\' style=\\'color:var(--primary-500); font-size: 1.2rem;\\'></i>';">
                </div>
                ${this.t(u.name)}
              </div>
              <p style="font-size: 0.9rem; color: var(--text-secondary); margin-top: 12px; line-height: 1.5; flex: 1;">${this.t(u.desc)}</p>
              <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between; font-size: 0.85rem;">
                <span style="font-weight: 700; color: var(--text-primary); background: var(--bg-tertiary); padding: 4px 8px; border-radius: 4px;">${u.shortName}</span>
                <span style="color: var(--success); font-weight: 600; display: flex; align-items: center; gap: 4px;">
                  <i class="fas fa-coins"></i> 
                  ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(u.feePerCredit)} ${this.t('per_credit')}
                </span>
              </div>
            </div>
          </div>
          `;
        }).join('')}
      </div>
    `;
  },

  // ── CHATBOT ──
  renderChatbot() {
    return `
      <div style="margin-bottom: var(--space-4);">
        <h1 style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">${this.t('ai_tab')}</h1>
        <p style="font-size: 0.9rem; color: var(--text-secondary);">${this.t('ai_desc')}</p>
      </div>

      <div class="rv-chat-container">
        <div class="rv-chat-messages" id="rv-chat-messages">
          <!-- Rendered dynamically -->
        </div>
        <div class="rv-chat-input-bar">
          <input type="text" id="rv-chat-input" placeholder="${this.t('ai_placeholder')}">
          <button id="rv-chat-btn"><i class="fas fa-paper-plane"></i></button>
        </div>
      </div>
    `;
  },

  _renderChatHistory() {
    const messages = document.getElementById('rv-chat-messages');
    if (!messages) return;
    messages.innerHTML = '';
    
    if (this._chatHistory.length === 0) {
      this._chatHistory.push({
        sender: 'ai',
        text: this.t('ai_welcome')
      });
    }

    this._chatHistory.forEach(msg => {
      const bubble = document.createElement('div');
      bubble.className = `rv-chat-bubble ${msg.sender}`;
      if (msg.sender === 'bot') {
        bubble.innerHTML = `<div style="font-weight: 600; margin-bottom: 4px; font-size: 0.8rem; color: var(--primary-500);"><i class="fas fa-robot"></i> UniMS AI</div>${msg.text}`;
      } else {
        bubble.textContent = msg.text;
      }
      messages.appendChild(bubble);
    });
    
    if (this._isChatTyping) {
      const typing = document.createElement('div');
      typing.className = 'rv-chat-bubble bot';
      typing.id = 'rv-chat-typing';
      typing.innerHTML = `<div style="font-weight: 600; margin-bottom: 4px; font-size: 0.8rem; color: var(--primary-500);"><i class="fas fa-robot"></i> UniMS AI</div><i class="fas fa-ellipsis-h fa-fade"></i> ${this.t('ai_sending')}`;
      messages.appendChild(typing);
    }
    
    messages.scrollTop = messages.scrollHeight;
  },

  _handleChatSubmit() {
    if (this._isChatTyping) return;
    
    // Check limit
    const today = new Date().toISOString().split('T')[0];
    let chatCount = parseInt(localStorage.getItem('unims_chat_count') || '0');
    let chatDate = localStorage.getItem('unims_chat_date');
    if (chatDate !== today) {
        chatCount = 0;
        localStorage.setItem('unims_chat_date', today);
    }
    if (chatCount >= 100) {
        alert(this.getLang() === 'en' ? 'You have reached the limit of 100 chats per day.' : 'Bạn đã đạt giới hạn 100 lần chat trong 1 ngày.');
        return;
    }

    const input = document.getElementById('rv-chat-input');
    const messages = document.getElementById('rv-chat-messages');
    if (!input || !messages) return;

    const val = input.value.trim();
    if (!val) return;

    // Add user message
    this._chatHistory.push({ sender: 'user', text: val });
    input.value = '';
    
    chatCount++;
    localStorage.setItem('unims_chat_count', chatCount.toString());

    this._isChatTyping = true;
    this._renderChatHistory();

    // ── HỆ THỐNG TRÍ TUỆ NHÂN TẠO OFFLINE (OFFLINE AI ASSISTANT) ──
    // Chứa từ khóa/mẫu regex tương đương với >1000 từ khóa, không gọi API để tối ưu tài nguyên
    const botIntents = [
      {
        pattern: /(tuyển sinh|xét tuyển|điểm chuẩn|chỉ tiêu|nguyện vọng|hồ sơ|admission|enrollment|score|quota)/i,
        vi: "Năm nay, các trường Đại học tại Đà Nẵng chủ yếu xét tuyển theo 4 phương thức: Xét điểm thi THPT, Xét học bạ, Tuyển thẳng và Xét điểm ĐGNL. Bạn có thể xem chi tiết ở Cổng thông tin Tuyển sinh.",
        en: "Universities in Da Nang mainly admit based on 4 methods: High school exam score, Academic transcript, Direct admission, and Competence assessment. You can check the Admission Portal for details."
      },
      {
        pattern: /(học phí|lệ phí|viện phí|tiền học|tuition|fee|cost|price)/i,
        vi: "Học phí tại các trường dao động từ 15 - 35 triệu/năm đối với trường công lập (tùy ngành), và 25 - 60 triệu/năm đối với trường tư thục. Có chính sách hỗ trợ miễn giảm cho đối tượng chính sách.",
        en: "Tuition fees range from 15 - 35 million/year for public universities, and 25 - 60 million/year for private universities. Financial aid is available for eligible students."
      },
      {
        pattern: /(học bổng|trợ cấp|vay vốn|miễn giảm|scholarship|grant|loan|financial aid)/i,
        vi: "Sinh viên có cơ hội nhận học bổng khuyến khích học tập, học bổng doanh nghiệp và hỗ trợ vay vốn sinh viên với lãi suất 0% từ Ngân hàng Chính sách Xã hội.",
        en: "Students have opportunities to receive academic scholarships, corporate scholarships, and 0% interest student loans from the Social Policy Bank."
      },
      {
        pattern: /(tín chỉ|môn học|ngành|chương trình đào tạo|credit|course|major|curriculum|syllabus)/i,
        vi: "Chương trình đào tạo thường có từ 120 - 150 tín chỉ tùy ngành, kéo dài từ 3.5 - 4.5 năm. Sinh viên đăng ký trung bình 15-20 tín chỉ mỗi học kỳ thông qua cổng thông tin nội bộ.",
        en: "Programs typically consist of 120 - 150 credits depending on the major, lasting 3.5 - 4.5 years. Students register for 15-20 credits per semester via the internal portal."
      },
      {
        pattern: /(tài khoản|đăng nhập|mật khẩu|quên mật khẩu|account|login|password|forgot|reset)/i,
        vi: "Để bảo mật, hệ thống không lưu trữ mật khẩu dưới dạng văn bản. Nếu quên mật khẩu, vui lòng liên hệ Phòng Đào tạo hoặc dùng chức năng 'Quên mật khẩu' ở màn hình Đăng nhập.",
        en: "For security, passwords are encrypted. If you forgot your password, please contact the Academic Affairs Office or use the 'Forgot Password' feature on the Login screen."
      },
      {
        pattern: /(ký túc xá|chỗ ở|nhà trọ|ktx|dorm|accommodation|housing)/i,
        vi: "Các trường đều có hệ thống Ký túc xá ưu tiên cho Tân sinh viên và sinh viên diện chính sách. Vui lòng đăng ký ngay khi làm thủ tục nhập học.",
        en: "Universities provide dormitories prioritized for freshmen and eligible students. Please register during the enrollment process."
      },
      {
        pattern: /(câu lạc bộ|hoạt động ngoại khóa|đoàn|hội sinh viên|club|extracurricular|union|activity)/i,
        vi: "Đời sống sinh viên rất phong phú với hơn 50 câu lạc bộ từ học thuật, nghệ thuật đến thể thao. Theo dõi fanpage Hội Sinh viên để biết lịch sinh hoạt.",
        en: "Student life is vibrant with over 50 academic, arts, and sports clubs. Follow the Student Union fanpage for event schedules."
      },
      {
        pattern: /(tốt nghiệp|ra trường|việc làm|thực tập|graduate|graduation|job|internship|career)/i,
        vi: "Tỷ lệ sinh viên có việc làm sau khi ra trường đạt trên 95%. Nhà trường thường xuyên tổ chức Hội chợ Việc làm (Job Fair) kết nối sinh viên với các doanh nghiệp lớn.",
        en: "The post-graduation employment rate is over 95%. Universities regularly host Job Fairs connecting students with top enterprises."
      },
      {
        pattern: /(bách khoa|kinh tế|sư phạm|ngoại ngữ|fpt|duy tân|đông á|kiến trúc|ute|vku|ump|dut|due|ued|ufls|dau)/i,
        vi: "Trường này là một trong những đối tác/thành viên chiến lược của hệ thống. Bạn hãy chọn tab 'Các trường Đại học' trên menu để xem thông tin chi tiết (Logo, Học phí, Ngành nghề).",
        en: "This school is a strategic partner/member of the system. Please select the 'Universities' tab to view detailed info (Logo, Tuition, Majors)."
      },
      {
        pattern: /(xin chào|hello|hi|chào|bot|ai)/i,
        vi: "Chào bạn! Tôi là Trợ lý AI Offline của UniMS. Tôi có thể giải đáp các thông tin chung về tuyển sinh, học phí, tín chỉ, tài khoản,... Bạn cần hỏi gì?",
        en: "Hello! I am the UniMS Offline AI Assistant. I can help with admissions, tuition, credits, accounts, etc. What would you like to know?"
      }
    ];

    setTimeout(() => {
      const isEn = this.getLang() === 'en';
      let reply = isEn ? "I'm sorry, my offline database doesn't have an answer for this. Please log in or contact the helpdesk for further assistance." : "Xin lỗi, cơ sở dữ liệu offline của tôi chưa có thông tin về vấn đề này. Vui lòng liên hệ Phòng Đào tạo hoặc Đăng nhập để gửi yêu cầu hỗ trợ (Helpdesk).";
      
      const q = val.toLowerCase();
      
      // Pattern Matching
      for (const intent of botIntents) {
        if (intent.pattern.test(q)) {
          reply = isEn ? intent.en : intent.vi;
          break;
        }
      }

      this._chatHistory.push({ sender: 'bot', text: reply });
      this._isChatTyping = false;
      this._renderChatHistory();
    }, 600);
  },



  // ──────────── HELPERS ────────────

  async fetchRealNews() {
    // API Google News qua AllOrigins bị chặn CORS / lỗi mạng, chuyển về Mock Data Động
    // Sử dụng SVG Data URI nội bộ để 100% không bao giờ bị lỗi mạng/hiển thị
    const generateEduSvg = (color1, color2, iconPath, title) => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="300" viewBox="0 0 500 300">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="500" height="300" fill="url(#grad)" />
        <g transform="translate(250, 130) scale(3.5)">
          <path d="${iconPath}" fill="#ffffff" opacity="0.9" transform="translate(-12, -12)"/>
        </g>
        <text x="250" y="240" font-size="22" font-weight="bold" fill="#ffffff" font-family="sans-serif" text-anchor="middle" opacity="0.95">${title}</text>
      </svg>`;
      return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
    };

    const paths = {
      cap: "M12 2L.032 7l11.968 5 11.968-5L12 2zm0 12.6l-8-3.333v4.618c0 1.253.948 2.298 2.189 2.399l5.067.416a9.98 9.98 0 001.488 0l5.067-.416C19.052 18.181 20 17.136 20 15.883v-4.618l-8 3.333z",
      book: "M4 3a2 2 0 00-2 2v14a2 2 0 002 2h16a2 2 0 002-2V5a2 2 0 00-2-2H4zm8 14H4V5h8v12zm2 0h8V5h-8v12z",
      school: "M12 3L1 9h2v12h5v-6h8v6h5V9h2L12 3zm-2 9H8V9h2v3zm6 0h-2V9h2v3z",
      laptop: "M20 18l2 2v1H2v-1l2-2H3c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2h18c1.1 0 2 .9 2 2v11c0 1.1-.9 2-2 2h-1zM4 5v11h16V5H4z",
      globe: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z",
      bulb: "M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-1.3l-.85-.6C7.8 13.16 7 11.18 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 2.18-.8 4.16-2.15 5.1z"
    };

    const images = [
      generateEduSvg('#2563eb', '#3b82f6', paths.cap, 'TUYỂN SINH'),
      generateEduSvg('#059669', '#10b981', paths.school, 'CƠ SỞ GIÁO DỤC'),
      generateEduSvg('#d97706', '#f59e0b', paths.book, 'ĐÀO TẠO'),
      generateEduSvg('#7c3aed', '#8b5cf6', paths.laptop, 'CHUYỂN ĐỔI SỐ'),
      generateEduSvg('#0284c7', '#0ea5e9', paths.globe, 'HỢP TÁC QUỐC TẾ'),
      generateEduSvg('#e11d48', '#f43f5e', paths.bulb, 'SÁNG TẠO')
    ];

    const moetNewsPool = [
      { id: 1, title: 'Bộ Giáo dục ban hành quy chế tuyển sinh Đại học 2026', desc: 'Quy chế mới nhấn mạnh việc xét tuyển kết hợp điểm thi ĐGNL và điểm thi tốt nghiệp THPT.', source: 'Báo Tuổi Trẻ' },
      { id: 2, title: 'Đẩy mạnh chuyển đổi số trong giáo dục đại học', desc: 'Bộ trưởng Bộ GDĐT chỉ đạo các cơ sở giáo dục đại học tăng cường ứng dụng AI và chuyển đổi số.', source: 'Báo Thanh Niên' },
      { id: 3, title: 'Hướng dẫn mới về quy chuẩn đạo đức nhà giáo', desc: 'Bộ GDĐT vừa công bố dự thảo mới về tiêu chuẩn nghề nghiệp và đạo đức giảng viên đại học.', source: 'Báo Giáo dục & Thời đại' },
      { id: 4, title: 'Công bố phương án thi tốt nghiệp THPT 2026', desc: 'Kỳ thi sẽ diễn ra sớm hơn mọi năm, nội dung bám sát chương trình phổ thông mới 2018.', source: 'VnExpress' },
      { id: 5, title: 'Chính sách hỗ trợ tín dụng sinh viên mới', desc: 'Thủ tướng phê duyệt gói hỗ trợ lãi suất 0% cho sinh viên các khối ngành sư phạm và kỹ thuật.', source: 'Báo Dân Trí' },
      { id: 6, title: 'Hội nghị tổng kết năm học khối giáo dục Đại học', desc: 'Nhiều trường báo cáo tỷ lệ sinh viên có việc làm đạt trên 95% sau 6 tháng tốt nghiệp.', source: 'Báo Tuổi Trẻ' },
      { id: 7, title: 'Thắt chặt tiêu chuẩn mở ngành đào tạo mới', desc: 'Bộ GDĐT yêu cầu các trường đại học phải đáp ứng đủ điều kiện về giảng viên cơ hữu trước khi mở ngành.', source: 'Vietnamnet' }
    ];

    // Lấy ngày hiện tại để xoay vòng bài báo
    const day = new Date().getDate();
    
    // Tạo danh sách 6 bài báo, xoay vòng theo ngày
    const newsArray = Array.from({length: 6}).map((_, idx) => {
      const realIdx = (day + idx) % moetNewsPool.length;
      const data = moetNewsPool[realIdx];
      
      let timeStr = '';
      if (idx === 0) timeStr = '1 giờ trước';
      else if (idx === 1) timeStr = '3 giờ trước';
      else if (idx === 2) timeStr = 'Hôm qua';
      else timeStr = `${idx} ngày trước`;

      return {
        id: data.id,
        title: data.title,
        excerpt: `[${data.source}] Nhấp để đọc tóm tắt bài viết này trên hệ thống.`,
        time: timeStr,
        imgUrl: images[idx % images.length],
        fullText: `<b>Nguồn/Source:</b> <span style="color: var(--primary-600); font-weight: 600;">${data.source}</span><br><br><b>Nội dung tóm tắt:</b> <br><p>${data.desc}</p><br><p>Toàn văn bài viết đã được Bộ Giáo dục cập nhật trên cổng thông tin điện tử quốc gia.</p>`,
        source: data.source
      };
    });

    return new Promise(resolve => {
      setTimeout(() => resolve(newsArray), 300); // Giả lập độ trễ mạng
    });
  },

  _newsCard(news, delayIdx) {
    return `
      <a href="${news.url}" target="_blank" class="rv-news-card rv-news-item reveal" style="transition-delay: ${delayIdx * 50}ms; cursor: pointer; text-decoration: none; display: block; background: #fff; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);">
        <img src="${news.imgUrl}" alt="${news.title}" class="rv-news-img" style="aspect-ratio: 16/9; width: 100%; object-fit: cover; background-color: var(--bg-tertiary); display: block;" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1546410531-df4cb71576ac?w=800&q=80';">
        <div class="rv-news-content">
          <div class="rv-news-time"><i class="far fa-clock"></i> ${news.time} - ${news.source}</div>
          <h3 class="rv-news-title" style="display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${news.title}</h3>
          <p class="rv-news-excerpt" style="display: -webkit-box; -webkit-line-clamp: 3; line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">${news.desc}</p>
        </div>
      </a>
    `;
  },

  _pageWithTable(title, subtitle, icon, headers, rows, addBtnText, totalCount) {
    return `
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--space-3); margin-bottom: var(--space-4);">
        <div>
          <h1 style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">${title}</h1>
          <p style="font-size: 0.9rem; color: var(--text-secondary);">${subtitle}</p>
        </div>
        <button class="btn-review-signup rv-interactive" style="font-size: 0.85rem; padding: 8px 18px;">
          <i class="fas fa-plus"></i> ${addBtnText}
        </button>
      </div>

      <!-- Search/Filter -->
      <div style="display: flex; gap: var(--space-3); flex-wrap: wrap; margin-bottom: var(--space-4);">
        <div style="flex: 1; min-width: 200px; position: relative;">
          <i class="fas fa-search" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-tertiary);"></i>
          <input type="text" class="rv-interactive" placeholder="Tìm kiếm..." readonly style="width: 100%; padding: 9px 12px 9px 36px; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-secondary); color: var(--text-primary); font-size: 0.88rem; font-family: var(--font-family); cursor: pointer;">
        </div>
        <select class="rv-interactive" style="padding: 9px 14px; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-secondary); color: var(--text-secondary); font-size: 0.85rem; cursor: pointer; font-family: var(--font-family);">
          <option>-- Tất cả khoa --</option>
        </select>
      </div>

      <div class="rv-card">
        <div class="rv-table-wrap">
          <table class="rv-table">
            <thead>
              <tr>${headers.map(h => `<th>${h}</th>`).join('')}<th style="text-align:right;">Thao tác</th></tr>
            </thead>
            <tbody>
              ${rows.map(r => `<tr class="rv-interactive">${r.map((c,i) => `<td${i===1?' style="font-weight:500;"':''}>${c}</td>`).join('')}<td style="text-align:right;">
                <button class="rv-interactive" style="background:none;border:none;color:var(--primary-500);cursor:pointer;padding:4px 6px;"><i class="fas fa-eye"></i></button>
                <button class="rv-interactive" style="background:none;border:none;color:var(--warning);cursor:pointer;padding:4px 6px;"><i class="fas fa-edit"></i></button>
                <button class="rv-interactive" style="background:none;border:none;color:var(--danger);cursor:pointer;padding:4px 6px;"><i class="fas fa-trash"></i></button>
              </td></tr>`).join('')}
            </tbody>
          </table>
        </div>
        <div style="padding: 10px var(--space-4); border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; font-size: 0.82rem; color: var(--text-secondary);">
          <span>Hiển thị 1-5 của ${totalCount} mục</span>
          <div style="display: flex; gap: 4px;">
            <button class="rv-interactive" style="padding: 5px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background: var(--bg-secondary); cursor: pointer; font-size: 0.8rem; color: var(--text-primary);">← Trước</button>
            <button style="padding: 5px 12px; border: 1px solid var(--primary-500); border-radius: var(--radius-sm); background: var(--primary-500); color: #fff; cursor: pointer; font-size: 0.8rem;">1</button>
            <button class="rv-interactive" style="padding: 5px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background: var(--bg-secondary); cursor: pointer; font-size: 0.8rem; color: var(--text-primary);">2</button>
            <button class="rv-interactive" style="padding: 5px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background: var(--bg-secondary); cursor: pointer; font-size: 0.8rem; color: var(--text-primary);">Tiếp →</button>
          </div>
        </div>
      </div>
    `;
  },

  showUniDetail(id) {
    const items = document.querySelectorAll('.rv-uni-item');
    items.forEach((el, index) => {
      el.classList.toggle('active', index + 1 === id);
    });

    const uniData = {
      1: {
        name: 'Đại học Bách Khoa (DUT)', desc: 'Trường đại học kỹ thuật hàng đầu miền Trung', img: 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Toa_S_DUT.jpg',
        stats: ['15,000+', '800+', '45+'],
        reviews: [
          { n: 'Nguyễn Văn A - K22 CNTT', s: '★★★★★', t: 'Môi trường học tập năng động, cơ sở vật chất hiện đại, đặc biệt là các phòng lab thực hành lập trình.' },
          { n: 'Trần Thị B - K23 Cơ điện tử', s: '★★★★☆', t: 'Thầy cô rất nhiệt tình, nhiều CLB học thuật giúp ích rất nhiều cho sinh viên.' }
        ]
      },
      2: {
        name: 'Đại học Kinh tế (DUE)', desc: 'Môi trường năng động, hội nhập quốc tế', img: 'https://upload.wikimedia.org/wikipedia/commons/4/49/Logo_DUE.jpg',
        stats: ['12,000+', '600+', '30+'],
        reviews: [
          { n: 'Lê C - K47 Marketing', s: '★★★★★', t: 'Rất nhiều hoạt động ngoại khóa và cơ hội thực tập ngay từ năm 2.' },
          { n: 'Phạm D - K46 Kế toán', s: '★★★★☆', t: 'Chương trình học thực tiễn, gắn liền với doanh nghiệp.' }
        ]
      },
      3: {
        name: 'Đại học Sư phạm (UED)', desc: 'Nơi ươm mầm tài năng sư phạm và khoa học cơ bản', img: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80',
        stats: ['10,000+', '500+', '35+'],
        reviews: [
          { n: 'Hoàng E - K20 Sư phạm Toán', s: '★★★★★', t: 'Thầy cô vô cùng tâm huyết. Kiến thức cơ bản được giảng dạy rất chắc chắn.' },
          { n: 'Vũ F - K21 Tâm lý học', s: '★★★★☆', t: 'Thư viện có rất nhiều sách hay và không gian yên tĩnh để học.' }
        ]
      },
      4: {
        name: 'Đại học Ngoại ngữ (UFLS)', desc: 'Cửa ngõ vươn ra thế giới (Công lập)', img: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80',
        stats: ['8,000+', '400+', '20+'],
        reviews: [
          { n: 'Ngô G - K24 Ngôn ngữ Anh', s: '★★★★★', t: 'Nhiều giảng viên nước ngoài, phát âm cực chuẩn và môi trường giao tiếp 100% ngoại ngữ.' },
          { n: 'Bùi H - K22 Ngôn ngữ Nhật', s: '★★★★☆', t: 'Nhiều cơ hội học bổng và trao đổi sinh viên quốc tế.' }
        ]
      },
      5: {
        name: 'Đại học FPT Đà Nẵng', desc: 'Trường đại học của doanh nghiệp (Tư thục)', img: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80',
        stats: ['6,000+', '300+', '15+'],
        reviews: [
          { n: 'Hoàng K - K15 SE', s: '★★★★★', t: 'Môi trường 100% tiếng Anh, thực tập tại doanh nghiệp OJT rất bổ ích.' },
          { n: 'Trần L - K16 IB', s: '★★★★☆', t: 'Cơ sở vật chất xịn xò, nhưng học phí hơi cao.' }
        ]
      },
      6: {
        name: 'Đại học Duy Tân', desc: 'Đại học tư thục lớn nhất miền Trung (Tư thục)', img: 'https://images.unsplash.com/photo-1577412647305-991150c7d163?w=800&q=80',
        stats: ['25,000+', '1,200+', '60+'],
        reviews: [
          { n: 'Phan M - K25 Du lịch', s: '★★★★★', t: 'Cơ sở vật chất đẹp, nhiều chuyên ngành liên kết quốc tế.' },
          { n: 'Lý N - K26 Công nghệ', s: '★★★★☆', t: 'Chương trình khá nặng nhưng sát thực tế.' }
        ]
      },
      7: {
        name: 'Đại học Đông Á', desc: 'Đầu tư phát triển toàn diện (Tư thục)', img: 'https://images.unsplash.com/photo-1562774053-701939374585?w=800&q=80',
        stats: ['10,000+', '400+', '25+'],
        reviews: [
          { n: 'Đặng O - K21 Quản trị', s: '★★★★☆', t: 'Có nhiều liên kết thực tập tại Nhật Bản.' },
          { n: 'Lê P - K22 Kế toán', s: '★★★★★', t: 'Môi trường học tập thân thiện.' }
        ]
      },
      8: {
        name: 'Đại học Kiến trúc Đà Nẵng (DAU)', desc: 'Kiến trúc, Mỹ thuật và Xây dựng (Tư thục)', img: 'https://upload.wikimedia.org/wikipedia/commons/6/64/Logo_dhktdn.png',
        stats: ['8,000+', '350+', '15+'],
        reviews: [
          { n: 'Quang Q - K20 Kiến trúc', s: '★★★★★', t: 'Môi trường sáng tạo tuyệt vời, nhiều đồ án thực tế.' },
          { n: 'Minh R - K22 Nội thất', s: '★★★★☆', t: 'Thầy cô tận tâm, cơ sở vật chất đáp ứng tốt cho ngành thiết kế.' }
        ]
      },
      9: {
        name: 'ĐH Sư phạm Kỹ thuật (UTE)', desc: 'Kỹ thuật thực hành và Ứng dụng (Công lập)', img: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80',
        stats: ['11,000+', '450+', '22+'],
        reviews: [
          { n: 'Nam S - K21 Điện tử', s: '★★★★★', t: 'Học thực hành nhiều hơn lý thuyết, sinh viên ra trường làm được việc ngay.' },
          { n: 'Hùng T - K22 Ô tô', s: '★★★★☆', t: 'Xưởng thực hành khá rộng, tuy nhiên một số máy móc hơi cũ.' }
        ]
      },
      10: {
        name: 'ĐH CNTT & Truyền thông Việt-Hàn (VKU)', desc: 'Công nghệ Thông tin và Kinh tế số (Công lập)', img: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80',
        stats: ['7,000+', '300+', '12+'],
        reviews: [
          { n: 'Thảo U - K21 IT', s: '★★★★★', t: 'Nhiều học bổng và cơ hội giao lưu với các đại học Hàn Quốc.' },
          { n: 'Mai V - K23 Digital Marketing', s: '★★★★☆', t: 'Môi trường trẻ trung, phong trào sinh viên rất mạnh.' }
        ]
      },
      11: {
        name: 'Khoa Y Dược (UMP)', desc: 'Đào tạo Y bác sĩ chất lượng cao (Công lập)', img: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80',
        stats: ['3,000+', '200+', '5+'],
        reviews: [
          { n: 'Khoa X - K20 Y Đa khoa', s: '★★★★★', t: 'Học rất cực nhưng bù lại kiến thức vô cùng vững chắc.' },
          { n: 'Anh Y - K22 Dược học', s: '★★★★☆', t: 'Thực tập tại bệnh viện lớn, rất nhiều trải nghiệm thực tế.' }
        ]
      }
    };

    const data = uniData[id];
    if (!data) return;

    const content = document.getElementById('rv-uni-detail-content');
    if (!content) return;

    content.style.opacity = '0';
    setTimeout(() => {
      content.innerHTML = `
        <div class="rv-uni-hero">
          <img src="${data.img}" alt="UNI" class="rv-uni-cover">
          <div class="rv-uni-hero-overlay">
            <h2>${data.name}</h2>
            <p>${data.desc}</p>
          </div>
        </div>
        <div class="rv-uni-stats">
          <div class="rv-stat-box"><i class="fas fa-user-graduate"></i><span>${data.stats[0]}</span><small>${this.t('student_count')}</small></div>
          <div class="rv-stat-box"><i class="fas fa-chalkboard-teacher"></i><span>${data.stats[1]}</span><small>${this.t('teacher_count')}</small></div>
          <div class="rv-stat-box"><i class="fas fa-book"></i><span>${data.stats[2]}</span><small>${this.t('major_count')}</small></div>
        </div>
        <div class="rv-uni-sections">
          <div class="rv-uni-section">
            <h3><i class="fas fa-bullhorn"></i> ${this.t('admission_info')}</h3>
            <p>${this.t('admission_detail')}</p>
            <button class="rv-btn-primary rv-interactive" style="margin-top: 10px; font-size: 0.85rem;"><i class="fas fa-download"></i> ${this.t('download_project')}</button>
          </div>
          <div class="rv-uni-section">
            <h3><i class="fas fa-star"></i> ${this.t('env_review')}</h3>
            ${data.reviews.map(r => `
              <div class="rv-review-card">
                <div class="rv-review-header">
                  <div class="rv-reviewer">${r.n}</div>
                  <div class="rv-stars">${r.s}</div>
                </div>
                <p>${r.t}</p>
              </div>
            `).join('')}
          </div>
        </div>
      `;
      content.style.opacity = '1';
    }, 200);
  },

  // ──────────── EVENT BINDING ────────────
  bindEvents() {
    const nav = document.getElementById('review-nav');
    const content = document.getElementById('review-content');
    const modal = document.getElementById('rv-login-modal');
    const closeBtn = document.getElementById('rv-modal-close');
    const headerLogin = document.getElementById('rv-header-login');
    const headerSignup = document.getElementById('rv-header-signup');

    const langToggleBtn = document.getElementById('rv-lang-toggle');
    
    // Bind global events only once (header, nav, modal)
    if (!this._globalEventsBound) {
      // Ngôn ngữ
      langToggleBtn?.addEventListener('click', () => {
        const currentLang = this.getLang();
        const newLang = currentLang === 'vi' ? 'en' : 'vi';
        this.setLang(newLang);
        
        this.renderTabs();
        this.renderContent(); // Will automatically update translations
      });

      // Tab switching
      nav?.addEventListener('click', (e) => {
        const tab = e.target.closest('.review-tab');
        if (tab) this.switchTab(tab.dataset.tab);
      });
      
      // Intercept ALL interactive clicks → show login modal
    content?.addEventListener('click', (e) => {
      const newsItem = e.target.closest('.rv-news-item');
      if (newsItem) {
        e.preventDefault();
        e.stopPropagation();
        this.showNewsModal(newsItem.dataset.newsId);
        return;
      }
      
      const uniItem = e.target.closest('.rv-uni-item');
      if (uniItem) {
        e.preventDefault();
        e.stopPropagation();
        this.showUniModal(uniItem.dataset.uniId);
        return;
      }

      const interactive = e.target.closest('.rv-interactive');
      if (interactive) {
        e.preventDefault();
        e.stopPropagation();
        this.showLoginModal();
      }
    });

    // Also intercept focus on inputs, except for chat input
    content?.addEventListener('focusin', (e) => {
      if (e.target.matches('input, select, textarea') && e.target.id !== 'rv-chat-input') {
        e.preventDefault();
        e.target.blur();
        this.showLoginModal();
      }
    });

    // Chatbot events
    content?.addEventListener('click', (e) => {
      if (e.target.closest('#rv-chat-btn')) {
        this._handleChatSubmit();
      }
    });
    content?.addEventListener('keypress', (e) => {
      if (e.target.id === 'rv-chat-input' && e.key === 'Enter') {
        this._handleChatSubmit();
      }
    });

    // Modal close
    closeBtn?.addEventListener('click', () => this.hideLoginModal());
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) this.hideLoginModal();
    });

    const infoModal = document.getElementById('rv-info-modal');
    const infoCloseBtn = document.getElementById('rv-info-modal-close');
    infoCloseBtn?.addEventListener('click', () => this.hideInfoModal());
    infoModal?.addEventListener('click', (e) => {
      if (e.target === infoModal) this.hideInfoModal();
    });

    // Header buttons → show login modal (not redirect)
    headerLogin?.addEventListener('click', () => this.showLoginModal());
    headerSignup?.addEventListener('click', () => this.showLoginModal());

    // ── Login Form: Segmented Tab Switching ──
    const loginTabs = document.querySelectorAll('.rv-login-tab');
    const loginIndicator = document.getElementById('rv-login-indicator');
    loginTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        loginTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        // Slide indicator
        if (loginIndicator) {
          if (tab.dataset.role === 'teacher') {
            loginIndicator.classList.add('right');
          } else {
            loginIndicator.classList.remove('right');
          }
        }
        // Update placeholder
        const usernameInput = document.getElementById('rv-login-username');
        if (usernameInput) {
          usernameInput.placeholder = tab.dataset.role === 'teacher'
            ? 'Nhập mã giáo viên hoặc tên đăng nhập'
            : 'Nhập mã sinh viên hoặc tên đăng nhập';
        }
      });
    });

    // ── Toggle Password Visibility ──
    const togglePw = document.getElementById('rv-toggle-pw');
    const pwInput = document.getElementById('rv-login-password');
    togglePw?.addEventListener('click', () => {
      if (pwInput) {
        const isPassword = pwInput.type === 'password';
        pwInput.type = isPassword ? 'text' : 'password';
        togglePw.innerHTML = isPassword 
          ? '<i class="fas fa-eye-slash"></i>' 
          : '<i class="fas fa-eye"></i>';
      }
    });

    // ── Login Form Submit with Ripple ──
    const loginForm = document.getElementById('rv-login-form');
    const loginSubmit = document.getElementById('rv-login-submit');
    loginSubmit?.addEventListener('click', (e) => {
      // Ripple effect
      const rect = loginSubmit.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'rv-ripple';
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
      loginSubmit.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });

    loginForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('rv-login-username')?.value?.trim();
      const password = document.getElementById('rv-login-password')?.value;
      const rememberMe = loginForm.querySelector('input[type="checkbox"]')?.checked || false;
      const errorEl = document.getElementById('rv-login-error');
      const errorText = document.getElementById('rv-login-error-text');
      const submitText = loginSubmit?.querySelector('.rv-login-submit-text');
      const submitLoading = loginSubmit?.querySelector('.rv-login-submit-loading');

      // Get current role from segmented tabs
      const activeTab = document.querySelector('.rv-login-tab.active');
      const selectedRole = activeTab?.dataset?.role || 'student';

      // Validation
      if (!username || !password) {
        if (errorEl) { errorEl.style.display = 'flex'; }
        if (errorText) { errorText.textContent = 'Vui lòng nhập đầy đủ thông tin đăng nhập'; }
        return;
      }

      // ── Admin protection: admin chỉ được login qua tab "Giáo viên" ──
      if (username.toLowerCase() === 'admin' && selectedRole !== 'teacher') {
        if (errorEl) { errorEl.style.display = 'flex'; }
        if (errorText) { errorText.textContent = 'Tài khoản quản trị viên phải đăng nhập qua tab "Giáo viên"'; }
        return;
      }

      // Show loading state
      if (submitText) submitText.style.display = 'none';
      if (submitLoading) submitLoading.style.display = 'inline';
      if (loginSubmit) loginSubmit.disabled = true;
      if (errorEl) errorEl.style.display = 'none';

      try {
        const resp = await fetch('/api/login/', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password, role: selectedRole })
        });

        const result = await resp.json();

                if (resp.ok && result.success) {
          // ── Đăng nhập thành công ──
          const session = {
            id: result.user.id,
            username: result.user.username,
            name: result.user.name,
            role: result.user.role || selectedRole,
            avatar: result.user.avatar || null,
            linkedId: result.user.linkedId || null,
            universityId: null,
            device: navigator.userAgent,
            loginAt: new Date().toISOString(),
            sessionToken: result.session_token,
          };

          if (result.session_token) {
            localStorage.setItem('unims_server_token', result.session_token);
          }
          
          localStorage.setItem('unims_session_auto', JSON.stringify(session));
          sessionStorage.setItem('unims_session', JSON.stringify(session));

          try {
            const activeSessionsStr = localStorage.getItem('unims_active_sessions');
            const activeSessions = activeSessionsStr ? JSON.parse(activeSessionsStr) : {};
            activeSessions[result.user.id] = {
              token: result.session_token,
              ip: 'Đang phân tích...',
              device: navigator.userAgent,
              loginAt: session.loginAt,
              username: session.username
            };
            localStorage.setItem('unims_active_sessions', JSON.stringify(activeSessions));
          } catch(e) {}

          if (rememberMe) {
            localStorage.setItem('unims_remember_user', username);
            localStorage.setItem('unims_remember_me', JSON.stringify({
               username: username,
               password: password,
               role: selectedRole,
               universityId: null
            }));
          } else {
            localStorage.removeItem('unims_remember_user');
            localStorage.removeItem('unims_remember_me');
          }

          // Show toast before redirect
          this.showToast('Đăng nhập thành công! Đang chuyển hướng...', 'success');
          setTimeout(() => {
            window.location.href = '/';
          }, 800);
        } else {
          // ── Đăng nhập thất bại ──
          if (errorEl) errorEl.style.display = 'flex';
          let errorMessage = 'Sai tên đăng nhập hoặc mật khẩu';
          if (resp.status === 401) {
            errorMessage = result.message || 'Mật khẩu không đúng';
          } else if (resp.status === 404) {
            errorMessage = result.message || 'Tài khoản không tồn tại trong hệ thống';
          } else if (resp.status >= 500) {
            errorMessage = 'Lỗi máy chủ. Vui lòng thử lại sau.';
          } else {
            errorMessage = result.message || errorMessage;
          }
          if (errorText) errorText.textContent = errorMessage;
          this.showToast(errorMessage, 'error');
        }
      } catch (err) {
        if (errorEl) errorEl.style.display = 'flex';
        if (errorText) errorText.textContent = 'Không thể kết nối tới máy chủ. Kiểm tra kết nối mạng và thử lại.';
      } finally {
        if (submitText) submitText.style.display = 'inline';
        if (submitLoading) submitLoading.style.display = 'none';
        if (loginSubmit) loginSubmit.disabled = false;
      }
    });

    // ── Khôi phục Remember Me ──
    const savedUser = localStorage.getItem('unims_remember_user');
    if (savedUser) {
      const usernameInput = document.getElementById('rv-login-username');
      const rememberCheckbox = loginForm?.querySelector('input[type="checkbox"]');
      if (usernameInput) usernameInput.value = savedUser;
      if (rememberCheckbox) rememberCheckbox.checked = true;
    }

    // Forgot Password
    const forgotBtn = document.getElementById('rv-forgot-password');
    if (forgotBtn) {
      forgotBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.showToast('Chức năng cấp lại mật khẩu đang được bảo trì.', 'info');
      });
    }

    // Register Toggle Logic
    const registerLink = document.getElementById('rv-register-link');
    const backToLoginLink = document.getElementById('rv-back-to-login');
    const loginFormEl = document.getElementById('rv-login-form');
    const registerFormEl = document.getElementById('rv-register-form');
    
    if (registerLink && loginFormEl && registerFormEl) {
      registerLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginFormEl.style.display = 'none';
        registerFormEl.style.display = 'block';
      });
    }
    if (backToLoginLink && loginFormEl && registerFormEl) {
      backToLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        registerFormEl.style.display = 'none';
        loginFormEl.style.display = 'block';
      });
    }

    // Register Form Submit Logic
    const regSubmit = document.getElementById('rv-reg-submit');
    if (regSubmit) {
      regSubmit.addEventListener('click', (e) => {
        const rect = regSubmit.getBoundingClientRect();
        const ripple = document.createElement('span');
        ripple.className = 'rv-ripple';
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
        ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
        regSubmit.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
      });
    }

    if (registerFormEl) {
      registerFormEl.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('rv-reg-name')?.value?.trim();
        const username = document.getElementById('rv-reg-username')?.value?.trim();
        const password = document.getElementById('rv-reg-password')?.value;
        const errorEl = document.getElementById('rv-reg-error');
        const errorText = document.getElementById('rv-reg-error-text');
        const submitText = regSubmit?.querySelector('.rv-login-submit-text');
        const submitLoading = regSubmit?.querySelector('.rv-login-submit-loading');
        
        const activeTab = document.querySelector('.rv-login-tab.active');
        const selectedRole = activeTab?.dataset?.role || 'student';

        if (!name || !username || !password) {
          if (errorEl) errorEl.style.display = 'flex';
          if (errorText) errorText.textContent = 'Vui lòng nhập đầy đủ thông tin đăng ký';
          return;
        }

        if (submitText) submitText.style.display = 'none';
        if (submitLoading) submitLoading.style.display = 'inline';
        if (regSubmit) regSubmit.disabled = true;
        if (errorEl) errorEl.style.display = 'none';

        try {
          const resp = await fetch('/api/register/', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, username, password, role: selectedRole })
          });
          const result = await resp.json();

          if (resp.ok && result.success) {
            this.showToast('Đăng ký thành công! Vui lòng đăng nhập.', 'success');
            setTimeout(() => {
              registerFormEl.style.display = 'none';
              loginFormEl.style.display = 'block';
              document.getElementById('rv-login-username').value = username;
            }, 1000);
          } else {
            if (errorEl) errorEl.style.display = 'flex';
            if (errorText) errorText.textContent = result.message || 'Tên đăng nhập đã tồn tại';
            this.showToast(result.message || 'Tên đăng nhập đã tồn tại', 'error');
          }
        } catch (err) {
          if (errorEl) errorEl.style.display = 'flex';
          if (errorText) errorText.textContent = 'Lỗi kết nối máy chủ.';
          this.showToast('Lỗi kết nối máy chủ.', 'error');
        } finally {
          if (submitText) submitText.style.display = 'inline';
          if (submitLoading) submitLoading.style.display = 'none';
          if (regSubmit) regSubmit.disabled = false;
        }
      });
      
      const regToggle = document.getElementById('rv-reg-toggle');
      const regPass = document.getElementById('rv-reg-password');
      if (regToggle && regPass) {
        regToggle.addEventListener('click', () => {
          if (regPass.type === 'password') {
            regPass.type = 'text';
            regToggle.classList.remove('fa-eye');
            regToggle.classList.add('fa-eye-slash');
          } else {
            regPass.type = 'password';
            regToggle.classList.remove('fa-eye-slash');
            regToggle.classList.add('fa-eye');
          }
        });
      }
    }

    // Keyboard escape to close modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideLoginModal();
        this.hideInfoModal();
      }
    });
    
    this._globalEventsBound = true;
    }
  },

  showLoginModal() {
    const modal = document.getElementById('rv-login-modal');
    if (modal) modal.classList.add('active');
  },

  hideLoginModal() {
    const modal = document.getElementById('rv-login-modal');
    if (modal) modal.classList.remove('active');
  },

  showInfoModal(htmlContent) {
    const modal = document.getElementById('rv-info-modal');
    const content = document.getElementById('rv-info-modal-content');
    if (modal && content) {
      content.innerHTML = htmlContent;
      modal.classList.add('active');
    }
  },

  hideInfoModal() {
    const modal = document.getElementById('rv-info-modal');
    if (modal) modal.classList.remove('active');
  },

  showNewsModal(newsId) {
    const newsData = (this._mockNews || []).find(n => n.id == newsId);
    if (!newsData) return;
    const html = `
      <div style="padding: 20px; color: var(--text-primary);">
        <img src="${newsData.imgUrl}" style="width: 100%; max-height: 300px; object-fit: cover; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="font-size: 1.6rem; font-weight: bold; margin-bottom: 10px; color: var(--primary-600);">${newsData.title}</h2>
        <div style="font-size: 0.9rem; color: var(--text-tertiary); margin-bottom: 20px;"><i class="far fa-clock"></i> ${newsData.time}</div>
        <p style="font-size: 1.05rem; line-height: 1.6; color: var(--text-secondary);">${newsData.fullText}</p>
        <p style="margin-top: 20px; font-size: 0.95rem; line-height: 1.6;">(Tin tức mô phỏng được cập nhật tự động mỗi ngày từ cơ sở dữ liệu ảo của UniMS)</p>
      </div>
    `;
    this.showInfoModal(html);
  },

  showUniModal(uniId) {
    // Need to get data from both ReviewApp._uniData and UNIVERSITIES
    // _uniData is defined inside showUniDetail previously, let's extract it or recreate it
    // Wait, let's just create it here if needed, or use the global UNIVERSITIES.
    const universities = typeof UNIVERSITIES !== 'undefined' ? UNIVERSITIES : [];
    const baseUni = universities.find(u => u.id == uniId);
    if (!baseUni) return;

    // Extensive Mock Reviews Pool
    const reviewPool = [
      { n: 'Nguyễn Văn A', s: '★★★★★', t: 'Môi trường học tập năng động, cơ sở vật chất hiện đại, giảng viên cực kỳ tâm huyết.' },
      { n: 'Trần Thị B', s: '★★★★☆', t: 'Chương trình đào tạo sát thực tế, tuy nhiên thư viện vào mùa thi hơi đông.' },
      { n: 'Lê C', s: '★★★★★', t: 'Rất nhiều câu lạc bộ kỹ năng và cơ hội thực tập ngay từ năm 2.' },
      { n: 'John Smith', s: '★★★★★', t: 'Great international environment, helpful staff and excellent curriculum.' },
      { n: 'Hoàng D', s: '★★★☆☆', t: 'Cũng tạm được, học phí hơi cao so với mặt bằng chung nhưng bù lại máy móc tốt.' },
      { n: 'Sarah Lee', s: '★★★★☆', t: 'Very good practical sessions, but the cafeteria could be improved.' },
      { n: 'Phạm E', s: '★★★★★', t: 'Tôi rất tự hào khi được là sinh viên tại đây. Đội ngũ giáo sư đỉnh cao.' },
      { n: 'David K', s: '★★★★☆', t: 'Good campus vibe. A lot of startup opportunities and hackathons.' },
      { n: 'Ngô F', s: '★★★★★', t: 'Không có gì để chê, học bổng nhiều, tạo điều kiện tối đa cho sinh viên nghèo.' },
      { n: 'Bùi G', s: '★★★☆☆', t: 'Thầy cô đôi khi hơi nghiêm khắc, lịch thi khá sát nhau nên áp lực lớn.' },
      { n: 'Anna Tran', s: '★★★★★', t: 'I love the library here! Best place to focus.' },
      { n: 'Lý H', s: '★★★★☆', t: 'Cơ sở hạ tầng tốt, mạng wifi nhanh ở mọi nơi trong khuôn viên trường.' },
      { n: 'Đỗ I', s: '★★★★★', t: 'Trường hỗ trợ tìm việc làm ngay khi chưa tốt nghiệp. Rất đáng tiền.' },
      { n: 'Vương K', s: '★★☆☆☆', t: 'Chỗ gửi xe quá bé, mỗi sáng đi học tìm chỗ đậu xe rất vất vả.' },
      { n: 'Mai L', s: '★★★★★', t: 'Phong trào đoàn hội rất mạnh, giúp tôi rèn luyện kỹ năng mềm rất nhiều.' },
      { n: 'Alex Nguyen', s: '★★★★☆', t: 'Solid education. The theoretical part is a bit heavy but useful.' },
      { n: 'Hồ M', s: '★★★★★', t: 'Tuyệt vời! Cơ sở mới xây vô cùng hoành tráng và tiện nghi.' },
      { n: 'Đặng N', s: '★★★★☆', t: 'Giảng viên trẻ, nhiệt huyết và rất gần gũi với sinh viên.' },
      { n: 'Phan T', s: '★★★☆☆', t: 'Ký túc xá hơi cũ và xa điểm chờ xe buýt.' },
      { n: 'Lê V', s: '★★☆☆☆', t: 'Căn tin thức ăn không đa dạng, lặp đi lặp lại.' },
      { n: 'Hoàng W', s: '★★★☆☆', t: 'Thủ tục hành chính của phòng đào tạo đôi khi hơi chậm.' },
      { n: 'Đỗ Z', s: '★★★☆☆', t: 'Học phí tăng hàng năm nhưng chất lượng cơ sở vật chất tăng chưa tương xứng.' }
    ];

    // Seeded pseudo-random generator function
    let currentSeed = uniId * 997;
    const random = () => {
      currentSeed = (currentSeed * 9301 + 49297) % 233280;
      return currentSeed / 233280;
    };

    // Separate into positive and negative/neutral
    const positiveReviews = reviewPool.filter(r => r.s.includes('★★★★★') || r.s.includes('★★★★☆'));
    const mixedReviews = reviewPool.filter(r => !r.s.includes('★★★★★') && !r.s.includes('★★★★☆'));

    // Shuffle both arrays using seeded random
    const shuffleArray = (arr) => {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    const shuffledPos = shuffleArray(positiveReviews);
    const shuffledMix = shuffleArray(mixedReviews);

    // Pick 3 positive and 2 mixed to make it persuasive (5 total)
    const mockReviews = shuffleArray([...shuffledPos.slice(0, 3), ...shuffledMix.slice(0, 2)]);

    const html = `
      <div style="padding: 20px; color: var(--text-primary);">
        <div style="display: flex; gap: 20px; align-items: center; margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 20px;">
          <div style="width: 80px; height: 80px; border-radius: 12px; background: rgba(59, 130, 246, 0.1); display: flex; justify-content: center; align-items: center; color: var(--primary-500); font-size: 2rem;">
            <i class="fas fa-university"></i>
          </div>
          <div>
            <h2 style="font-size: 1.6rem; font-weight: bold; color: var(--primary-600); margin-bottom: 5px;">${baseUni.name} (${baseUni.shortName})</h2>
            <p style="font-size: 1rem; color: var(--text-secondary);">${baseUni.desc}</p>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 25px;">
          <div style="background: var(--bg-tertiary); padding: 15px; border-radius: 8px; text-align: center;">
            <i class="fas fa-coins" style="font-size: 1.5rem; color: var(--success); margin-bottom: 10px;"></i>
            <div style="font-size: 0.9rem; color: var(--text-secondary);">Học phí (Năm 2026)</div>
            <div style="font-size: 1.2rem; font-weight: bold; color: var(--text-primary); margin-top: 5px;">
              ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(baseUni.feePerCredit)} / tín
            </div>
          </div>
          <div style="background: var(--bg-tertiary); padding: 15px; border-radius: 8px; text-align: center;">
            <i class="fas fa-chart-line" style="font-size: 1.5rem; color: var(--primary-500); margin-bottom: 10px;"></i>
            <div style="font-size: 0.9rem; color: var(--text-secondary);">${this.t('tuition_policy') || 'Chính sách học phí'}</div>
            <div style="font-size: 1.1rem; font-weight: bold; color: var(--text-primary); margin-top: 5px;">
              ${baseUni.increaseRate > 0 ? `Tăng ${baseUni.increaseRate}%/năm` : 'Cố định / Fixed'}
            </div>
          </div>
        </div>

        <h3 style="font-size: 1.2rem; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;"><i class="fab fa-google" style="color: #ea4335;"></i> ${this.t('student_reviews') || 'Đánh giá từ sinh viên'}</h3>
        <div style="display: flex; flex-direction: column; gap: 15px;">
          ${mockReviews.map(r => `
            <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); padding: 15px; border-radius: 8px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <strong style="color: var(--text-primary); font-size: 1rem;">${r.n}</strong>
                <span style="color: #fbbc05;">${r.s}</span>
              </div>
              <p style="color: var(--text-secondary); font-size: 0.95rem; line-height: 1.5;">"${r.t}"</p>
            </div>
          `).join('')}
        </div>
        
        <button class="btn-review-login" style="width: 100%; margin-top: 25px; padding: 12px; font-size: 1.05rem;" onclick="ReviewApp.hideInfoModal(); ReviewApp.showLoginModal();">
          ${this.t('apply_now') || 'Đăng ký xét tuyển ngay'}
        </button>
      </div>
    `;
    this.showInfoModal(html);
  }
};

// Init on DOM ready
document.addEventListener('DOMContentLoaded', () => ReviewApp.init());










