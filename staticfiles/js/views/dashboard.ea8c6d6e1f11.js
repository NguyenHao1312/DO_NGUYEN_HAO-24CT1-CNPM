// js/views/dashboard.js

const DashboardView = {
  render() {
    const container = document.getElementById('main-content');
    container.innerHTML = this.getHTML();
    this.attachEvents();
    
    // Add fade-in animation
    container.classList.add('fade-in');
    setTimeout(() => container.classList.remove('fade-in'), 300);

    // Use requestAnimationFrame + setTimeout to ensure DOM is fully rendered and laid out
    requestAnimationFrame(() => {
      setTimeout(() => {
        this.renderCharts();
      }, 300);
    });
  },

  renderCharts() {
    const user = Auth.getCurrentUser();
    if (user.role === 'admin') {
      this.renderAdminCharts();
    } else {
      this.renderStudentCharts();
      this.renderCalendarWidget();
    }
  },

  renderCalendarWidget(targetYear, targetMonth) {
    const user = Auth.getCurrentUser();
    if (!user || user.role === 'admin') return;

    // Set current date & generate calendar grid
    const now = new Date();
    
    // Default to current date if undefined
    let currentYear = targetYear !== undefined ? targetYear : (this.currentCalendarYear || now.getFullYear());
    let currentMonth = targetMonth !== undefined ? targetMonth : (this.currentCalendarMonth !== undefined ? this.currentCalendarMonth : now.getMonth());

    // Constraints check (max year 3000)
    if (currentYear > 3000) currentYear = 3000;
    if (currentYear < 2000) currentYear = 2000;

    // Save to instance state
    this.currentCalendarYear = currentYear;
    this.currentCalendarMonth = currentMonth;

    const currentDay = (currentYear === now.getFullYear() && currentMonth === now.getMonth()) ? now.getDate() : -1;
    
    const monthYearEl = document.getElementById('cal-month-year');
    if (monthYearEl) {
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      monthYearEl.textContent = `${months[currentMonth]} ${currentYear}`;
    }

    const gridBody = document.getElementById('grid-calendar-body');
    if (!gridBody) return;
    gridBody.innerHTML = '';

    // Bind navigation buttons
    const prevBtn = document.getElementById('cal-prev');
    const nextBtn = document.getElementById('cal-next');
    if (prevBtn) {
       prevBtn.onclick = () => {
          let m = currentMonth - 1;
          let y = currentYear;
          if (m < 0) { m = 11; y--; }
          this.renderCalendarWidget(y, m);
       };
    }
    if (nextBtn) {
       nextBtn.onclick = () => {
          let m = currentMonth + 1;
          let y = currentYear;
          if (m > 11) { m = 0; y++; }
          this.renderCalendarWidget(y, m);
       };
    }

    // Helper to get semester start date
    const getSemesterStart = (semesterStr) => {
       if (!semesterStr) return null;
       const parts = semesterStr.split('-');
       if (parts.length < 2) return null;
       const yearStr = parts[0].split(' ').pop(); // gets "2025" from "HK1 - 2025"
       let year = parseInt(yearStr);
       if (isNaN(year)) year = new Date().getFullYear();
       
       if (semesterStr.includes('HK1')) return new Date(year, 8, 1); // Sept
       if (semesterStr.includes('HK2')) return new Date(year + 1, 0, 1); // Jan
       if (semesterStr.includes('HK3')) return new Date(year + 1, 4, 1); // May
       return new Date(year, 8, 1);
    };

    const isClassActiveInMonth = (c, regSemester, targetYear, targetMonth) => {
       const startDate = getSemesterStart(regSemester);
       if (!startDate) return true; // fallback if no semester
       
       let credits = parseInt(c.credits) || 1;
       if (credits > 3) credits = 3;
       const durationMap = { 1: 2, 2: 3, 3: 5 };
       const durationMonths = durationMap[credits];

       const startAbsolute = startDate.getFullYear() * 12 + startDate.getMonth();
       const endAbsolute = startAbsolute + durationMonths - 1;
       const targetAbsolute = targetYear * 12 + targetMonth;

       return targetAbsolute >= startAbsolute && targetAbsolute <= endAbsolute;
    };

    // Load registered classes
    let registeredClasses = [];
    const mockSemesters = ['HK1 - 2025-2026', 'HK2 - 2025-2026', 'HK3 - 2025-2026'];
    
    if (user.role === 'student' && Database.registrations) {
      const studentRegistrations = Database.registrations.getByStudentId(user.linkedId);
      registeredClasses = studentRegistrations.map((r, i) => {
         const c = Database.classes.getById(r.classId);
         if (c) {
            c._regSemester = r.semester || mockSemesters[i % mockSemesters.length];
            return c;
         }
         return null;
      }).filter(c => c);
    } else if (user.role === 'teacher') {
      const tClasses = Database.classes.getByTeacherId(user.linkedId);
      registeredClasses = tClasses.map((c, i) => {
         c._regSemester = mockSemesters[i % mockSemesters.length];
         return c;
      });
    }

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    // Generate pseudo-events for the month based on registered classes
    const monthEvents = {};
    for (let day = 1; day <= daysInMonth; day++) {
       const date = new Date(currentYear, currentMonth, day);
       const dayOfWeek = date.getDay(); // 0-6
       const events = [];
       
       registeredClasses.forEach(c => {
          if (!isClassActiveInMonth(c, c._regSemester, currentYear, currentMonth)) return;

          const hash = c.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          const classDow = hash % 7; // 0-6
          if (classDow === dayOfWeek) {
             const hour = 7 + (hash % 10);
             let type = 'class';
             let color = '#3b82f6'; // blue
             if (hash % 10 === 0) { type = 'cancelled'; color = '#ef4444'; }
             else if (hash % 10 === 1) { type = 'exam'; color = '#f59e0b'; }
             
             events.push({ class: c, hour, type, color });
          }
       });
       if (events.length > 0) {
         monthEvents[day] = events;
       }
    }

    // Function to render schedule for a specific day
    const renderScheduleForDay = (day, events) => {
      const listEl = document.getElementById('schedule-list');
      if (!listEl) return;
      
      // Update header
      const header = document.querySelector('#schedule-list').previousElementSibling;
      if (header) {
         const formattedDate = `${day}/${currentMonth+1}/${currentYear}`;
         header.innerHTML = t('Lịch trình ngày {date}', { date: formattedDate });
      }

      if (!events || events.length === 0) {
        listEl.innerHTML = `<div style="color: var(--text-tertiary); font-style: italic;">${t('Không có sự kiện hoặc lịch học nào trong ngày.')}</div>`;
        return;
      }

      const html = events.sort((a, b) => a.hour - b.hour).map(e => {
        const c = e.class;
        const hash = c.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const tag = e.type === 'cancelled' ? '<span style="background: #fee2e2; color: #ef4444; font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; margin-left: 8px;">Đã hủy</span>' :
                    e.type === 'exam' ? '<span style="background: #fef3c7; color: #f59e0b; font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; margin-left: 8px;">Thi</span>' : '';
        return `
        <div style="display: flex; gap: 12px; align-items: flex-start; padding: 12px; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-md); border-left: 4px solid ${e.color}; box-shadow: var(--shadow-sm); transition: transform 0.2s;">
          <div style="min-width: 60px; font-weight: 700; color: var(--text-primary); text-align: center;">
            <div style="font-size: 1.1rem;">${String(e.hour).padStart(2, '0')}:00</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">${String(e.hour+2).padStart(2, '0')}:00</div>
          </div>
          <div style="flex: 1;">
            <div style="font-weight: 600; color: var(--primary-600); font-size: 1.05rem; margin-bottom: 2px;">${c.name} ${tag}</div>
            <div style="font-size: 0.85rem; color: var(--text-secondary); display: flex; align-items: center; gap: 8px;">
              <span><i class="fas fa-barcode"></i> ${c.classCode || c.id.substring(0, 6).toUpperCase()}</span>
              <span><i class="fas fa-door-open"></i> P. ${101 + (hash % 20)}</span>
            </div>
          </div>
        </div>
        `;
      }).join('');
      
      listEl.innerHTML = html;
    };

    // Render Previous Month Days
    for (let i = firstDay - 1; i >= 0; i--) {
      const div = document.createElement('div');
      div.style.padding = '8px 0';
      div.style.color = 'var(--text-tertiary)';
      div.style.fontSize = '1rem';
      div.textContent = daysInPrevMonth - i;
      gridBody.appendChild(div);
    }

    // Render Current Month Days
    for (let day = 1; day <= daysInMonth; day++) {
      const div = document.createElement('div');
      div.className = 'cal-day-cell';
      div.style.padding = '8px 0';
      div.style.fontSize = '1rem';
      div.style.cursor = 'pointer';
      div.style.position = 'relative';
      div.style.borderRadius = '4px';
      div.style.display = 'flex';
      div.style.flexDirection = 'column';
      div.style.alignItems = 'center';
      
      if (day === currentDay) {
        div.style.background = 'var(--primary-500)';
        div.style.color = '#fff';
        div.style.fontWeight = 'bold';
        div.classList.add('active-day');
      } else {
        div.style.color = 'var(--text-primary)';
      }

      div.innerHTML = '<span>' + day + '</span>';
      
      // Add dots if events exist
      if (monthEvents[day]) {
         const dotsContainer = document.createElement('div');
         dotsContainer.style.display = 'flex';
         dotsContainer.style.gap = '2px';
         dotsContainer.style.marginTop = '2px';
         
         const uniqueColors = [...new Set(monthEvents[day].map(e => e.color))];
         uniqueColors.forEach(color => {
            const dot = document.createElement('div');
            dot.style.width = '4px';
            dot.style.height = '4px';
            dot.style.borderRadius = '50%';
            dot.style.backgroundColor = (day === currentDay) ? '#fff' : color;
            dotsContainer.appendChild(dot);
         });
         div.appendChild(dotsContainer);
      }

      div.addEventListener('click', () => {
         document.querySelectorAll('.cal-day-cell').forEach(el => {
           el.style.border = 'none';
           if (!el.classList.contains('active-day')) {
             el.style.background = 'transparent';
           }
         });
         if (day !== currentDay) {
           div.style.background = 'var(--bg-tertiary)';
           div.style.border = '1px solid var(--primary-500)';
         }
         renderScheduleForDay(day, monthEvents[day]);
      });

      div.addEventListener('mouseenter', () => {
        if (day !== currentDay && div.style.background === 'transparent') {
           div.style.background = 'var(--bg-secondary)';
        }
      });
      div.addEventListener('mouseleave', () => {
        if (day !== currentDay && !div.style.border) {
           div.style.background = 'transparent';
        }
      });

      gridBody.appendChild(div);
    }

    // Render Next Month Days
    const totalCells = firstDay + daysInMonth;
    const nextDays = (Math.ceil(totalCells / 7) * 7) - totalCells;
    for (let i = 1; i <= nextDays; i++) {
      const div = document.createElement('div');
      div.style.padding = '8px 0';
      div.style.color = 'var(--text-tertiary)';
      div.style.fontSize = '1rem';
      div.textContent = i;
      gridBody.appendChild(div);
    }

    // Initialize with current day
    renderScheduleForDay(currentDay, monthEvents[currentDay]);
  },

  getHTML() {
    const user = Auth.getCurrentUser();
    const isAdmin = Auth.isAdmin();
    const isStudent = Auth.isStudent();
    const isTeacher = Auth.isTeacher();

    if (isStudent || isTeacher) {
      return this.getStudentOrTeacherDashboardHTML(user, isStudent ? 'student' : 'teacher');
    }

    const studentsCount = Database.students.count();
    const teachersCount = Database.teachers.count();
    const classesCount = Database.classes.count();
    const pendingBugsCount = Database.bugs.countByStatus ? Database.bugs.countByStatus('new') + Database.bugs.countByStatus('in-progress') : 0;
    
    const recentActivities = Database.activity.getRecent ? Database.activity.getRecent(10) : [];
    
    return `
      <div class="page-header">
        <div class="page-title-section">
          <h1 class="page-title">${t('dashboard_title')}</h1>
          <p class="page-subtitle">${t('dashboard_subtitle')}</p>
        </div>
      </div>

      <!-- Stat Cards -->
      <div class="grid-row" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: var(--space-6); margin-bottom: var(--space-6);">
        
        <div class="card stat-card" style="border-left: 4px solid var(--primary-500); display: flex; align-items: center; padding: var(--space-4);">
          <div class="stat-card-icon" style="background: linear-gradient(135deg, var(--primary-400), var(--primary-600)); color: white; width: 48px; height: 48px; border-radius: var(--radius-full); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin-right: var(--space-4);">
            <svg viewBox="0 0 24 24" width="24" height="24"><path d="M2 10l10-5 10 5-10 5z" fill="currentColor"/><path d="M6 12v5c0 2 3 4 6 4s6-2 6-4v-5l-6 3-6-3z" fill="currentColor" opacity="0.4"/></svg>
          </div>
          <div class="stat-card-info">
            <div class="stat-card-label" style="color: var(--text-secondary); font-size: var(--font-size-sm);">${t('total_students')}</div>
            <div class="stat-card-value" style="font-size: var(--font-size-2xl); font-weight: 700; color: var(--text-primary);">${Utils.formatNumber ? Utils.formatNumber(studentsCount) : studentsCount}</div>
          </div>
        </div>

        <div class="card stat-card" style="border-left: 4px solid var(--success); display: flex; align-items: center; padding: var(--space-4);">
          <div class="stat-card-icon" style="background: linear-gradient(135deg, var(--accent-400, #34d399), var(--success)); color: white; width: 48px; height: 48px; border-radius: var(--radius-full); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin-right: var(--space-4);">
            <svg viewBox="0 0 24 24" width="24" height="24"><path d="M2 4h20v12H2z" fill="currentColor" opacity="0.3"/><path d="M9 22h6M12 16v6M6 8h12M6 12h5" stroke="currentColor" stroke-width="2" fill="none"/></svg>
          </div>
          <div class="stat-card-info">
            <div class="stat-card-label" style="color: var(--text-secondary); font-size: var(--font-size-sm);">${t('total_teachers')}</div>
            <div class="stat-card-value" style="font-size: var(--font-size-2xl); font-weight: 700; color: var(--text-primary);">${Utils.formatNumber ? Utils.formatNumber(teachersCount) : teachersCount}</div>
          </div>
        </div>

        <div class="card stat-card" style="border-left: 4px solid #8b5cf6; display: flex; align-items: center; padding: var(--space-4);">
          <div class="stat-card-icon" style="background: linear-gradient(135deg, #a78bfa, #8b5cf6); color: white; width: 48px; height: 48px; border-radius: var(--radius-full); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin-right: var(--space-4);">
            <svg viewBox="0 0 24 24" width="24" height="24"><path d="M4 4h6v16H4z" fill="currentColor" opacity="0.4"/><path d="M14 4h6v16h-6z" fill="currentColor" opacity="0.4"/><path d="M4 4h16v2H4zM4 18h16v2H4z" fill="currentColor"/><path d="M10 4h4v16h-4z" fill="currentColor" opacity="0.2"/></svg>
          </div>
          <div class="stat-card-info">
            <div class="stat-card-label" style="color: var(--text-secondary); font-size: var(--font-size-sm);">${t('total_classes')}</div>
            <div class="stat-card-value" style="font-size: var(--font-size-2xl); font-weight: 700; color: var(--text-primary);">${Utils.formatNumber ? Utils.formatNumber(classesCount) : classesCount}</div>
          </div>
        </div>

      </div>

      <!-- Charts Section -->
      <div class="grid-row" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: var(--space-6); margin-bottom: var(--space-6);">
        <div class="card">
          <div class="card-header" style="padding: var(--space-4); border-bottom: 1px solid var(--border-color); font-weight: 600;">
            ${t('grade_change_log')}
          </div>
          <div class="card-body" style="padding: 0; height: 300px; overflow-y: auto;">
            <ul style="list-style: none; padding: 0; margin: 0;">
              ${Database.activity && Database.activity.getAll ? Database.activity.getAll().filter(a => a.entity === 'grade').sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 15).map(act => `
                <li style="padding: var(--space-2) var(--space-3); border-bottom: 1px solid var(--border-color); display: flex; align-items: flex-start; gap: var(--space-3);">
                  <div style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: var(--warning-100); border-radius: 50%; color: var(--warning-600); flex-shrink: 0;">
                    <i class="fas fa-edit" style="font-size: 1rem;"></i>
                  </div>
                  <div style="flex: 1;">
                    <div style="font-size: var(--font-size-sm); color: var(--text-primary); margin-top: 4px;">${act.details}</div>
                    <div style="font-size: var(--font-size-xs); color: var(--text-tertiary); margin-top: 2px;">
                      ${Utils.timeAgo ? Utils.timeAgo(act.timestamp) : act.timestamp}
                    </div>
                  </div>
                </li>
              `).join('') : ''}
              ${(!Database.activity || !Database.activity.getAll || Database.activity.getAll().filter(a => a.entity === 'grade').length === 0) ? `
                <li style="padding: var(--space-4); text-align: center; color: var(--text-tertiary);">
                  ${t('no_grade_changes')}
                </li>
              ` : ''}
            </ul>
          </div>
        </div>

        <div class="card">
          <div class="card-header" style="padding: var(--space-4); border-bottom: 1px solid var(--border-color); font-weight: 600;">
            ${t('course_stats_by_teacher')}
          </div>
          <div class="card-body chart-wrapper" style="padding: var(--space-4); height: 300px; position: relative; width: 100%;">
            <canvas id="chart-dept-stats"></canvas>
          </div>
        </div>
      </div>

      <!-- Bottom Section -->
      <div class="grid-row" style="display: grid; grid-template-columns: ${(isAdmin || isTeacher) ? '1fr 2fr' : '1fr'}; gap: var(--space-6);">
        
        <!-- Quick Actions (Admin & Teacher) -->
        ${(isAdmin || isTeacher) ? `
        <div class="card">
          <div class="card-header" style="padding: var(--space-4); border-bottom: 1px solid var(--border-color); font-weight: 600;">
            ${t('quick_actions')}
          </div>
          <div class="card-body" style="padding: var(--space-4); display: flex; flex-direction: column; gap: var(--space-3);">
            ${isAdmin ? `
            <button class="btn btn-ghost" id="qa-add-student" style="justify-content: flex-start; text-align: left; padding: var(--space-3);">
              <svg viewBox="0 0 24 24" width="16" height="16" style="color: var(--primary-500); margin-right: var(--space-2);"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" fill="currentColor"/></svg> ${t('add_student')}
            </button>
            <button class="btn btn-ghost" id="qa-add-teacher" style="justify-content: flex-start; text-align: left; padding: var(--space-3);">
              <svg viewBox="0 0 24 24" width="16" height="16" style="color: var(--success); margin-right: var(--space-2);"><path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/></svg> ${t('add_teacher')}
            </button>
            <button class="btn btn-ghost" id="qa-add-class" style="justify-content: flex-start; text-align: left; padding: var(--space-3);">
              <svg viewBox="0 0 24 24" width="16" height="16" style="color: #8b5cf6; margin-right: var(--space-2);"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2zm10 14H4V8h16v10zm-7-1h-2v-3H8v-2h3V9h2v3h3v2h-3v3z" fill="currentColor"/></svg> ${t('add_class')}
            </button>
            ` : ''}
            <button class="btn btn-ghost" id="qa-add-grade" style="justify-content: flex-start; text-align: left; padding: var(--space-3);">
              <svg viewBox="0 0 24 24" width="16" height="16" style="color: #f59e0b; margin-right: var(--space-2);"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="currentColor"/></svg> ${t('quick_grade_update')}
            </button>
          </div>
        </div>
        ` : ''}

        <!-- Recent Activity (Admin Only) -->
        ${isAdmin ? `
        <div class="card">
          <div class="card-header" style="padding: var(--space-4); border-bottom: 1px solid var(--border-color); font-weight: 600;">
            ${t('recent_activity')}
          </div>
          <div class="card-body" style="padding: 0;">
            <ul style="list-style: none; padding: 0; margin: 0;">
              ${recentActivities.length > 0 ? recentActivities.map(act => `
                <li style="padding: var(--space-2) var(--space-3); border-bottom: 1px solid var(--border-color); display: flex; align-items: flex-start; gap: var(--space-3);">
                  <div style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: var(--bg-tertiary); border-radius: 50%; color: var(--text-secondary); flex-shrink: 0;">
                    <i class="fas fa-history" style="font-size: 1rem;"></i>
                  </div>
                  <div style="flex: 1;">
                    <div style="font-size: var(--font-size-sm); color: var(--text-primary); margin-top: 4px;">${(Database.settings && Database.settings.get().language === 'en') ? (act.details || '').replace('đã đăng nhập', 'logged in').replace('đã đăng xuất', 'logged out').replace('Quản trị viên', 'Admin') : (act.details || t('actions'))} - ${act.entity}</div>
                    <div style="font-size: var(--font-size-xs); color: var(--text-tertiary); margin-top: 2px;">
                      ${Utils.timeAgo ? Utils.timeAgo(act.timestamp) : act.timestamp}
                    </div>
                  </div>
                </li>
              `).join('') : `
                <li style="padding: var(--space-4); text-align: center; color: var(--text-tertiary);">
                  ${t('no_data')}
                </li>
              `}
            </ul>
          </div>
        </div>
        ` : ''}
      </div>
    `;
  },

  getStudentOrTeacherDashboardHTML(user, role) {
    if (!user.linkedId) return '<div class="page-header"><h1 class="page-title">Không tìm thấy thông tin liên kết</h1></div>';
    
    let grades = [];
    let classesList = [];
    
    if (role === 'student') {
      grades = Database.grades.getByStudentId(user.linkedId);
      classesList = grades.map(g => Database.classes.getById(g.classId)).filter(c => c);
    } else {
      classesList = Database.classes.getByTeacherId(user.linkedId);
      // For teacher, maybe we mock some grades or just show empty chart
    }

    // Calculate Credits (Student only)
    let earnedCredits = 0;
    const requiredCredits = 170; // Based on screenshot
    let totalScore10 = 0;
    let totalScore4 = 0;
    
    grades.forEach(g => {
      const cls = Database.classes.getById(g.classId);
      if (cls && g.average10 >= 4.0) {
         earnedCredits += (cls.credits || 0);
      }
      totalScore10 += (g.average10 || 0);
      totalScore4 += (g.average4 || 0);
    });
    
    const progressPercent = Math.min(100, Math.round((earnedCredits / requiredCredits) * 100));

    // Get notifications
    const allNotifs = Database.notifications.getByUserId ? Database.notifications.getByUserId(user.id) : [];
    const recentNotifs = allNotifs.slice(0, 5);
    
    return `
      <div class="page-header" style="margin-bottom: var(--space-4); display: flex; flex-direction: column; align-items: stretch; gap: var(--space-4);">
        <div class="page-title-section">
          <h1 class="page-title" style="font-size: 1.8rem; font-weight: 700; color: var(--text-primary); margin-bottom: 8px;">${t('welcome_user', { name: user.name })}</h1>
          <p class="page-subtitle" style="font-size: 1rem; color: var(--text-secondary); max-width: 850px; line-height: 1.6; font-style: italic; border-left: 3px solid var(--primary-500); padding-left: 12px;">
            ${t('dashboard_quote')}
          </p>
        </div>
        
        <!-- News Ticker -->
        <div class="news-ticker-container" style="background: var(--glass-bg); backdrop-filter: blur(8px); border: 1px solid var(--border-color); border-radius: var(--radius-full); padding: 8px 20px; display: flex; align-items: center; overflow: hidden; box-shadow: var(--shadow-sm);">
          <div class="news-ticker-label" style="font-weight: 700; color: var(--primary-600); margin-right: 16px; white-space: nowrap; display: flex; align-items: center; gap: 8px; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px;">
            <svg viewBox="0 0 24 24" width="16" height="16" style="color: #ef4444; animation: pulse 2s infinite;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5z" fill="currentColor" opacity="0.3"/><circle cx="12" cy="12" r="2.5" fill="currentColor"/></svg> ${t('news_board')}
          </div>
          <div style="flex: 1; overflow: hidden; position: relative; mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent); -webkit-mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);">
            <div class="news-ticker" style="display: inline-block; white-space: nowrap; animation: ticker 25s linear infinite; font-size: 0.95rem; color: var(--text-primary); padding-left: 100%;">
              <span style="margin-right: 50px;">${t('moet_news')}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 2 Column Layout -->
      <div class="grid-row" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: var(--space-6); margin-bottom: var(--space-6);">
        
        <!-- Layout cho Student vs Teacher -->
        ${role === 'student' ? `
        <!-- Cột 1: Kết quả học tập -->
        <div class="card" style="display: flex; flex-direction: column;">
          <div class="card-header" style="padding: var(--space-4); border-bottom: 1px solid var(--border-color); font-weight: 600; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 1.1rem; color: var(--text-primary);">${t('learning_results')}</span>
            <select id="select-semester-grade" class="form-input" style="padding: 4px 28px 4px 12px; font-size: 0.85rem; border-radius: var(--radius-sm); border: 1px solid #e2e8f0; color: var(--text-secondary);">
              <option value="All">${t('all_semesters')}</option>
              <option value="HK3 - 2025-2026">HK3 - 2025-2026</option>
              <option value="HK2 - 2025-2026">HK2 - 2025-2026</option>
              <option value="HK1 - 2025-2026">HK1 - 2025-2026</option>
            </select>
          </div>
          <div class="card-body chart-wrapper" style="padding: var(--space-4); flex: 1; min-height: 250px; position: relative; width: 100%;">
            <div id="combo-chart-grades"></div>
          </div>
        </div>

        <!-- Cột 2: Tiến độ học tập -->
        <div class="card" style="display: flex; flex-direction: column;">
          <div class="card-header" style="padding: var(--space-4); border-bottom: 1px solid var(--border-color); font-weight: 600; font-size: 1.1rem; color: var(--text-primary); display: flex; justify-content: space-between; align-items: center;">
            <span>${t('study_progress')}</span>
            <select id="select-semester-credit" class="form-input" style="padding: 4px 28px 4px 12px; font-size: 0.85rem; border-radius: var(--radius-sm); border: 1px solid #e2e8f0; color: var(--text-secondary);">
              <option value="All">${t('all_semesters')}</option>
              <option value="HK3 - 2025-2026">HK3 - 2025-2026</option>
              <option value="HK2 - 2025-2026">HK2 - 2025-2026</option>
              <option value="HK1 - 2025-2026">HK1 - 2025-2026</option>
            </select>
          </div>
          <div class="card-body" style="padding: var(--space-4); flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative;">
            <div style="position: relative; display: inline-block;">
              <div id="radial-progress-chart"></div>
              <div id="radial-center-text" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; pointer-events: none;">
                <!-- JS will fill this -->
              </div>
            </div>
            <div style="margin-top: var(--space-4); font-weight: 700; color: var(--text-primary); font-size: 1.1rem;">
              <span id="static-progress-text">${earnedCredits}/${requiredCredits}</span> tín chỉ
            </div>
          </div>
        </div>
        ` : `
        <!-- Giáo viên: Danh sách môn học -->
        <div class="card" style="display: flex; flex-direction: column;">
          <div class="card-header" style="padding: var(--space-4); border-bottom: 1px solid var(--border-color); font-weight: 600;">
            ${t('teacher_stats_title')}
          </div>
          <div class="card-body" style="padding: 0; max-height: 350px; overflow-y: auto;">
            <ul class="list-group" style="list-style: none; padding: 0; margin: 0;">
              ${classesList.map(c => `
                <li style="padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <strong style="color: var(--text-primary);">${c.classCode || c.id.substring(0, 8)}</strong>
                    <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">${c.name}</div>
                  </div>
                  <span class="badge badge-primary">${c.credits || 3} ${t('credits')}</span>
                </li>
              `).join('')}
              ${classesList.length === 0 ? `<li style="padding: var(--space-4); text-align: center; color: var(--text-tertiary);">${t('no_courses')}</li>` : ''}
            </ul>
          </div>
        </div>
        
        <!-- Giáo viên: Thống kê sinh viên -->
        <div class="card" style="display: flex; flex-direction: column;">
          <div class="card-header" style="padding: var(--space-4); border-bottom: 1px solid var(--border-color); font-weight: 600;">
            ${t('students_overview')}
          </div>
          <div class="card-body" style="padding: var(--space-4); display: flex; flex-direction: column; justify-content: center; gap: var(--space-4);">
             <div style="display: flex; align-items: center; padding: 16px; background: var(--bg-tertiary); border-radius: var(--radius-md);">
               <div style="font-size: 2rem; color: var(--primary-500); margin-right: 16px;"><svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor"><path d="M4 4h6v16H4z" opacity="0.4"/><path d="M14 4h6v16h-6z" opacity="0.4"/><path d="M4 4h16v2H4zM4 18h16v2H4z"/></svg></div>
               <div>
                 <div style="font-size: 1.5rem; font-weight: bold; color: var(--text-primary);">${classesList.length}</div>
                 <div style="font-size: 0.9rem; color: var(--text-secondary);">${t('assigned_classes')}</div>
               </div>
             </div>
             <div style="display: flex; align-items: center; padding: 16px; background: var(--bg-tertiary); border-radius: var(--radius-md);">
               <div style="font-size: 2rem; color: var(--success); margin-right: 16px;"><svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg></div>
               <div>
                 <div style="font-size: 1.5rem; font-weight: bold; color: var(--text-primary);">${Database.grades ? (Database.grades.getAll().filter(g => classesList.some(c => c.id === g.classId)).length) : 0}</div>
                 <div style="font-size: 0.9rem; color: var(--text-secondary);">${t('managed_students')}</div>
               </div>
             </div>
          </div>
        </div>
        `}
        
      </div>

      <!-- Calendar Widget (Full Width) -->
      <div class="card" style="margin-bottom: var(--space-6);">
        <div class="card-header" style="padding: var(--space-4); border-bottom: 1px solid var(--border-color); font-weight: 600; display: flex; align-items: center; gap: 8px; font-size: 1.1rem; color: var(--text-primary);">
          <i class="far fa-calendar-alt" style="color: var(--primary-500);"></i> ${t('today_schedule')}
        </div>
        <div class="card-body" style="padding: var(--space-4); display: flex; flex-wrap: wrap; gap: var(--space-6);">
          
          <!-- Lịch bên trái -->
          <div class="cal-left" style="flex: 1.2; min-width: 280px; border-right: 1px solid var(--border-color); padding-right: var(--space-4);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
               <div style="font-weight: 700; font-size: 1.2rem; color: var(--text-primary);" id="cal-month-year">July 2026</div>
               <div style="display: flex; gap: 8px;">
                 <button class="btn-icon" id="cal-prev" style="color: var(--text-secondary);"><i class="fas fa-chevron-up"></i></button>
                 <button class="btn-icon" id="cal-next" style="color: var(--text-secondary);"><i class="fas fa-chevron-down"></i></button>
               </div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; text-align: center; margin-bottom: 12px; color: var(--text-secondary); font-size: 0.9rem; font-weight: 600;">
               <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
            </div>
            <div id="grid-calendar-body" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px 4px; text-align: center;">
               <!-- Generated by JS -->
            </div>
          </div>

          <!-- Lịch trình bên phải -->
          <div class="cal-right" style="flex: 2; min-width: 280px;">
            <h3 style="font-size: 1rem; margin-bottom: var(--space-3); color: var(--text-primary); border-bottom: 2px solid var(--primary-100); padding-bottom: 8px; display: inline-block;">${t('upcoming_events')}</h3>
            <div style="display: flex; flex-direction: column; gap: 12px; max-height: 200px; overflow-y: auto; padding-right: 8px;" id="schedule-list">
              <!-- Rendered via JS below -->
            </div>
          </div>

        </div>
      </div>

      <!-- Notifications below -->
      <div class="card">
        <div class="card-header" style="padding: var(--space-4); border-bottom: 1px solid var(--border-color); font-weight: 600;">
          ${t('Thông báo từ Khoa / Trường')}
        </div>
        <div class="card-body" style="padding: 0;">
          <ul style="list-style: none; padding: 0; margin: 0;">
            ${recentNotifs.length > 0 ? recentNotifs.map(n => `
              <li style="padding: var(--space-2) var(--space-3); border-bottom: 1px solid var(--border-color); display: flex; align-items: flex-start; gap: var(--space-3);">
                <div style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 50%; flex-shrink: 0; background: var(--${n.type === 'alert' ? 'danger' : 'primary'}-100); color: var(--${n.type === 'alert' ? 'danger' : 'primary'}-600);">
                  <i class="fas fa-${n.type === 'alert' ? 'exclamation-triangle' : 'bell'}" style="font-size: 1rem;"></i>
                </div>
                <div style="flex: 1;">
                  <div style="font-size: var(--font-size-sm); font-weight: 500; color: var(--text-primary);">${t(n.title) || t('Thông báo mới')}</div>
                  <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${t(n.message)}</div>
                  <div style="font-size: var(--font-size-xs); color: var(--text-tertiary); margin-top: 4px;">
                    ${Utils.timeAgo ? Utils.timeAgo(n.timestamp) : n.timestamp}
                  </div>
                </div>
              </li>
            `).join('') : `
              <li style="padding: var(--space-4); text-align: center; color: var(--text-tertiary);">
                ${t('no_notifications')}
              </li>
            `}
          </ul>
        </div>
      </div>
    `;
  },

  attachEvents() {
    const mainContent = document.getElementById('main-content');
    
    mainContent.addEventListener('click', (e) => {
      // Admin Quick Actions Navigation
      if (e.target.closest('#qa-add-student')) {
        window.location.hash = '#/students';
        setTimeout(() => { if (window.StudentsView) StudentsView.showAddModal(); }, 100);
      }
      if (e.target.closest('#qa-add-teacher')) {
        window.location.hash = '#/teachers';
        setTimeout(() => { if (window.TeachersView) TeachersView.showAddModal(); }, 100);
      }
      if (e.target.closest('#qa-add-class')) {
        window.location.hash = '#/classes';
        setTimeout(() => { if (window.ClassesView) ClassesView.showAddModal(); }, 100);
      }
      if (e.target.closest('#qa-add-grade')) {
        this.showQuickGradeModal();
      }
    });
  },

  showQuickGradeModal() {
    let modal = document.getElementById('quick-grade-modal');
    if (modal) modal.remove();
    
    const students = Database.students.getAll();
    
    modal = document.createElement('div');
    modal.id = 'quick-grade-modal';
    modal.className = 'modal-overlay active';
    modal.innerHTML = `
      <div class="modal" style="max-width: 500px;">
        <div class="modal-header">
          <h2 class="modal-title">${t('quick_grade_update')}</h2>
          <button class="btn btn-ghost" onclick="document.getElementById('quick-grade-modal').remove()"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>${t('student') || 'student'}</label>
            <select id="qg-student" class="form-input">
              <option value="">${t('select_student')}</option>
              ${students.map(s => `<option value="${s.id}">${s.studentId} - ${s.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group" style="margin-bottom: var(--space-3);">
            <label>${t('registered_course')}</label>
            <select id="qg-class" class="form-input" disabled>
              <option value="">${t('select_student_first')}</option>
            </select>
          </div>
          
          <div id="qg-grade-inputs" style="display: none; margin-top: 15px; border-top: 1px solid var(--border-color); padding-top: 15px;">
            <div class="grid-row" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
              <div class="form-group">
                <label>${t('attendance_grade_label')}</label>
                <input type="number" id="qg-qt" class="form-input" min="0" max="10" step="0.1">
              </div>
              <div class="form-group">
                <label>${t('midterm_grade_label')}</label>
                <input type="number" id="qg-gk" class="form-input" min="0" max="10" step="0.1">
              </div>
              <div class="form-group">
                <label>${t('final_grade_label')}</label>
                <input type="number" id="qg-ck" class="form-input" min="0" max="10" step="0.1">
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer" style="margin-top: var(--space-4); display: flex; justify-content: flex-end; gap: var(--space-2);">
          <button class="btn btn-outline" onclick="document.getElementById('quick-grade-modal').remove()">${t('cancel')}</button>
          <button class="btn btn-primary" id="btn-save-quick-grade" disabled>${t('save_grades')}</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    const studentSelect = document.getElementById('qg-student');
    const classSelect = document.getElementById('qg-class');
    const gradeInputs = document.getElementById('qg-grade-inputs');
    const inputQt = document.getElementById('qg-qt');
    const inputGk = document.getElementById('qg-gk');
    const inputCk = document.getElementById('qg-ck');
    const btnSave = document.getElementById('btn-save-quick-grade');
    
    let currentGrades = null;
    
    studentSelect.addEventListener('change', () => {
       const sid = studentSelect.value;
       if (!sid) {
          classSelect.disabled = true;
          classSelect.innerHTML = `<option value="">${t('select_student_first')}</option>`;
          gradeInputs.style.display = 'none';
          btnSave.disabled = true;
          return;
       }
       
       const regs = Database.registrations ? Database.registrations.getByStudentId(sid) : [];
       if (regs.length === 0) {
          classSelect.disabled = true;
          classSelect.innerHTML = `<option value="">${t('no_registered_courses')}</option>`;
          gradeInputs.style.display = 'none';
          btnSave.disabled = true;
          return;
       }
       
       classSelect.disabled = false;
       classSelect.innerHTML = `<option value="">${t('select_course')}</option>` + regs.map(r => {
          const cls = Database.classes.getById(r.classId);
          return cls ? `<option value="${cls.id}">${t(cls.name)} (${cls.classCode || cls.id.substring(0,6)})</option>` : '';
       }).join('');
       
       gradeInputs.style.display = 'none';
       btnSave.disabled = true;
    });
    
    classSelect.addEventListener('change', () => {
       const cid = classSelect.value;
       const sid = studentSelect.value;
       if (!cid) {
          gradeInputs.style.display = 'none';
          btnSave.disabled = true;
          return;
       }
       
       const grades = Database.grades.getByStudentId(sid);
       const existingGrade = grades.find(g => g.classId === cid);
       
       gradeInputs.style.display = 'block';
       btnSave.disabled = false;
       
       if (existingGrade) {
          currentGrades = existingGrade;
          inputQt.value = existingGrade.processScore || '';
          inputGk.value = existingGrade.midtermScore || '';
          inputCk.value = existingGrade.finalScore || '';
       } else {
          currentGrades = null;
          inputQt.value = '';
          inputGk.value = '';
          inputCk.value = '';
       }
    });
    
    btnSave.addEventListener('click', () => {
       if (typeof Auth !== 'undefined' && !(Auth.isAdmin() || Auth.isTeacher())) {
          Utils.toast(t('error') + ': Permission denied', 'error');
          return;
       }
       
       const cid = classSelect.value;
       const sid = studentSelect.value;
       
       const process = parseFloat(inputQt.value) || 0;
       const midterm = parseFloat(inputGk.value) || 0;
       const final = parseFloat(inputCk.value) || 0;
       
       if (process < 0 || process > 10 || midterm < 0 || midterm > 10 || final < 0 || final > 10) {
          Utils.toast('Điểm không hợp lệ', 'error');
          return;
       }
       
       const average10 = parseFloat((process * 0.2 + midterm * 0.3 + final * 0.5).toFixed(2));
       let average4 = 0;
       let letterGrade = 'F';
       let status = 'Trượt';
       
       if (average10 >= 8.5) { average4 = 4.0; letterGrade = 'A'; status = 'Qua môn'; }
       else if (average10 >= 7.0) { average4 = 3.0; letterGrade = 'B'; status = 'Qua môn'; }
       else if (average10 >= 5.5) { average4 = 2.0; letterGrade = 'C'; status = 'Qua môn'; }
       else if (average10 >= 4.0) { average4 = 1.0; letterGrade = 'D'; status = 'Qua môn'; }
       
       const gradeData = {
          studentId: sid,
          classId: cid,
          processScore: process,
          midtermScore: midterm,
          finalScore: final,
          average10: average10,
          average4: average4,
          letterGrade: letterGrade,
          status: status
       };
       
       if (currentGrades) {
          Database.grades.update(currentGrades.id, gradeData);
       } else {
          Database.grades.add(gradeData);
       }
       
       const stu = Database.students.getById(sid);
       const cls = Database.classes.getById(cid);
       if (Utils.logActivity && stu && cls) {
          const userRole = Auth.isAdmin() ? 'Admin' : 'Giáo viên';
          Utils.logActivity('Cập nhật điểm nhanh', `${userRole} cập nhật điểm môn ${cls.name} cho SV ${stu.name}`);
       }
       
       Utils.toast(t('success') || 'Cập nhật điểm thành công!', 'success');
       modal.remove();
       this.render(); 
       
       setTimeout(() => {
         window.location.reload();
       }, 800);
    });
  },

  renderAdminCharts() {
    if (!window.Utils || !Utils.drawBarChart || !Utils.drawPieChart) return;
    
    // Grade Distribution -> Activity Log (Handled in HTML)
    // No longer drawing bar chart for chart-grade-dist

    // Class per Teacher Stats Data (Admin)
    const classes = Database.classes.getAll();
    const teachers = Database.teachers.getAll();
    const teacherClassCounts = {};
    
    classes.forEach(c => {
      let tId = c.teacherId;
      if (tId && tId.startsWith('ref:')) tId = tId.replace('ref:', '');
      const teacher = teachers.find(t => t.id === tId || t.teacherId === tId);
      const tName = teacher ? teacher.name : 'Chưa phân công';
      teacherClassCounts[tName] = (teacherClassCounts[tName] || 0) + 1;
    });

    const pieLabels = Object.keys(teacherClassCounts);
    const pieData = Object.values(teacherClassCounts);
    const pieColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#14b8a6', '#f43f5e', '#a855f7'];
    
    Utils.drawPieChart('chart-dept-stats', pieLabels, pieData, pieColors.slice(0, pieLabels.length));
  },

  renderStudentCharts(semesterFilter = 'All') {
    const user = Auth.getCurrentUser();
    if (!user || !user.linkedId) return;

    // Attach event listeners
    const selectGrade = document.getElementById('select-semester-grade');
    const selectCredit = document.getElementById('select-semester-credit');
    if (selectGrade && selectCredit) {
      selectGrade.value = semesterFilter;
      selectCredit.value = semesterFilter;
      selectGrade.onchange = (e) => this.renderStudentCharts(e.target.value);
      selectCredit.onchange = (e) => this.renderStudentCharts(e.target.value);
    }

    let grades = [];
    if (user.role === 'student') {
      grades = Database.grades.getByStudentId(user.linkedId);
    }
    
    const mockSemesters = ['HK1 - 2025-2026', 'HK2 - 2025-2026', 'HK3 - 2025-2026'];
    grades.forEach((g, i) => { if (!g.semester) g.semester = mockSemesters[i % mockSemesters.length]; });

    let earnedCredits = 0;
    const requiredCredits = 170;
    let filteredEarnedCredits = 0;
    
    const gradeLabels = [];
    const gradeScores = [];
    const classAverages = [];

    grades.forEach(g => {
      const cls = Database.classes.getById(g.classId);
      if (cls) {
         const isPassed = (g.average10 >= 4.0);
         const credits = cls.credits || 0;
         if (isPassed) earnedCredits += credits;

         if (semesterFilter === 'All' || g.semester === semesterFilter) {
            if (isPassed) filteredEarnedCredits += credits;
            gradeLabels.push(cls.name || cls.classCode);
            gradeScores.push(g.average10 || 0);
            let avg = parseFloat((g.average10 * 0.9 + 0.8).toFixed(1));
            if (avg > 10) avg = 10;
            classAverages.push(avg);
         }
      }
    });

    const displayEarned = (semesterFilter === 'All') ? earnedCredits : filteredEarnedCredits;
    const progressPercent = Math.min(100, Math.round((displayEarned / requiredCredits) * 100));

    // Update Static Progress Text
    const staticText = document.getElementById('static-progress-text');
    if (staticText) staticText.textContent = `${displayEarned}/${requiredCredits}`;

    if (window.comboChartInstance) window.comboChartInstance.destroy();
    if (window.radialChartInstance) window.radialChartInstance.destroy();

    const renderApex = () => {
      if (typeof ApexCharts === 'undefined') { setTimeout(renderApex, 200); return; }
      const comboContainer = document.querySelector("#combo-chart-grades");
    if (comboContainer && typeof ApexCharts !== 'undefined') {
      comboContainer.innerHTML = '';
      const comboChartOptions = {
        series: [
          { name: 'Điểm của bạn', type: 'column', data: gradeScores },
          { name: 'Điểm TB lớp học phần', type: 'line', data: classAverages }
        ],
        chart: {
          height: 300,
          type: 'line',
          toolbar: { show: false },
          fontFamily: 'Inter, system-ui, sans-serif'
        },
        colors: ['#FF7F50', '#FBBF24'],
        stroke: { width: [0, 4], curve: 'smooth' },
        plotOptions: { bar: { borderRadius: 6, columnWidth: '45%' } },
        dataLabels: { 
          enabled: true, 
          enabledOnSeries: [0], 
          offsetY: -10, 
          style: { fontSize: '12px', colors: ['#4b5563'], fontWeight: 600 },
          background: { enabled: false }
        },
        markers: {
          size: [0, 5],
          colors: ['#FBBF24'],
          strokeColors: '#fff',
          strokeWidth: 2,
          hover: { size: 7 }
        },
        labels: gradeLabels,
        xaxis: { 
          type: 'category',
          labels: { show: false },
          axisBorder: { show: true },
          axisTicks: { show: false }
        },
        yaxis: [
          { title: { text: 'Điểm của bạn', style: { color: '#FF7F50', fontWeight: 600 } }, min: 0, max: 10, labels: { style: { colors: '#FF7F50' } } },
          { opposite: true, title: { text: 'Điểm TB lớp học phần', style: { color: '#FBBF24', fontWeight: 600 } }, min: 0, max: 10, labels: { style: { colors: '#FBBF24' } } }
        ],
        tooltip: {
          shared: true,
          intersect: false,
          custom: function({series, seriesIndex, dataPointIndex, w}) {
            const subject = gradeLabels[dataPointIndex];
            const uScore = series[0][dataPointIndex];
            const aScore = series[1][dataPointIndex];
            return `
              <div style="padding: 12px; background: var(--bg-primary, #fff); border: 1px solid var(--border-color, #eee); border-radius: 8px; box-shadow: var(--shadow-md);">
                <div style="font-weight: 700; color: var(--text-primary, #333); margin-bottom: 10px; font-size: 14px;">${subject}</div>
                <div style="display: flex; align-items: center; margin-bottom: 6px;">
                  <span style="width: 10px; height: 10px; border-radius: 50%; background-color: #FF7F50; margin-right: 8px;"></span>
                  <span style="color: var(--text-secondary, #666);">Điểm của bạn: <b style="color: var(--text-primary, #333);">${uScore}</b></span>
                </div>
                <div style="display: flex; align-items: center;">
                  <span style="width: 10px; height: 10px; border-radius: 50%; background-color: #FBBF24; margin-right: 8px;"></span>
                  <span style="color: var(--text-secondary, #666);">Điểm TB lớp: <b style="color: var(--text-primary, #333);">${aScore}</b></span>
                </div>
              </div>
            `;
          }
        },
        legend: { position: 'bottom', horizontalAlign: 'center', labels: { colors: 'var(--text-secondary)' } }
      };
      window.comboChartInstance = new ApexCharts(comboContainer, comboChartOptions);
      window.comboChartInstance.render();
    }

    const radialContainer = document.querySelector("#radial-progress-chart");
    const centerTextDiv = document.getElementById('radial-center-text');
    if (radialContainer && typeof ApexCharts !== 'undefined') {
      radialContainer.innerHTML = '';
      const updateRadialCenterText = (isEarnedHovered) => {
        if (!centerTextDiv) return;
        if (isEarnedHovered) {
          centerTextDiv.innerHTML = `
            <div style="font-size: 14px; color: var(--text-secondary); margin-bottom: 4px;">Đã học: ${displayEarned} tín chỉ</div>
            <div style="font-size: 32px; font-weight: 800; color: #10B981; line-height: 1;">${progressPercent}%</div>
          `;
        } else {
          centerTextDiv.innerHTML = `
            <div style="font-size: 14px; color: var(--text-secondary); margin-bottom: 4px;">Tổng: ${requiredCredits} tín chỉ</div>
            <div style="font-size: 32px; font-weight: 800; color: #3B82F6; line-height: 1;">100%</div>
          `;
        }
      };

      const radialOptions = {
        series: [100, progressPercent],
        chart: {
          height: 320,
          type: 'radialBar',
          fontFamily: 'Inter, system-ui, sans-serif',
          events: {
            dataPointMouseEnter: function(event, chartContext, config) {
              updateRadialCenterText(config.dataPointIndex === 1);
            },
            dataPointMouseLeave: function() {
              updateRadialCenterText(false);
            }
          }
        },
        colors: ['#3B82F6', '#10B981'],
        plotOptions: {
          radialBar: {
            hollow: { size: '55%' },
            track: { background: 'var(--bg-tertiary, #f1f5f9)', margin: 12 },
            dataLabels: { show: false }
          }
        },
        stroke: { lineCap: 'round' },
        labels: ['Tổng tín chỉ', 'Tín chỉ đã học'],
        states: { hover: { filter: { type: 'lighten', value: 0.15 } } }
      };
      
      updateRadialCenterText(false);
      window.radialChartInstance = new ApexCharts(radialContainer, radialOptions);
      window.radialChartInstance.render();
    }
    };
    renderApex();
  },

  drawSimpleLineChart(canvasId, labels, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Auto-resize for HDPI
    const dpr = window.devicePixelRatio || 1;
    const parent = canvas.parentElement;
    const w = parent.clientWidth || 400;
    const h = 260; // Fixed height to anchor the scale and prevent infinite growth loop
    
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = '100%';
    canvas.style.height = h + 'px';
    ctx.scale(dpr, dpr);
    
    const width = w;
    const height = h;
    
    ctx.clearRect(0, 0, width, height);

    if (data.length === 0) {
      ctx.fillStyle = '#9ca3af';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Chưa có dữ liệu điểm số', width/2, height/2);
      return;
    }

    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 40;
    const paddingBottom = 40;
    const maxVal = 10;
    
    // Tính toán chiều rộng khả dụng cho các cột
    const availableWidth = width - paddingLeft - paddingRight;
    const stepX = data.length > 0 ? availableWidth / data.length : 0;
    const barWidth = Math.min(stepX * 0.5, 50); // Max width 50px
    
    // Draw Y axis guidelines and labels
    ctx.lineWidth = 1;
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 10; i+=2) {
      const y = height - paddingBottom - (i / 10) * (height - paddingTop - paddingBottom);
      
      // Draw grid line
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(156, 163, 175, 0.2)'; // Faint grid line
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(width - paddingRight, y);
      ctx.stroke();
      
      // Draw label
      ctx.fillStyle = '#6b7280';
      ctx.fillText(i, paddingLeft - 8, y + 4);
    }

    // Draw Bars and Labels
    data.forEach((val, index) => {
      const barHeight = (val / 10) * (height - paddingTop - paddingBottom);
      const y = height - paddingBottom - barHeight;
      // Center the bar within its allocated band
      const x = paddingLeft + index * stepX + (stepX - barWidth) / 2;
      
      // Draw Bar
      ctx.fillStyle = '#3b82f6'; // Solid primary-500 color, 100% opacity to hide grid line
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
      } else {
        ctx.rect(x, y, barWidth, barHeight);
      }
      ctx.fill();
      
      // Text on top of column
      ctx.textAlign = 'center';
      
      // Môn học (Subject Name)
      ctx.fillStyle = '#4b5563'; // Darker gray for better contrast
      ctx.font = 'bold 12px Arial'; // Increased from 10px
      const label = labels[index];
      const shortLabel = label.length > 12 ? label.substring(0, 10) + '..' : label;
      ctx.fillText(shortLabel, x + barWidth / 2, y - 24);

      // Điểm số (Score)
      ctx.fillStyle = '#059669'; // Darker success color (emerald-600) for more contrast
      ctx.font = '900 16px Arial'; // Thicker and larger font
      ctx.fillText(val, x + barWidth / 2, y - 6);
      
      // Label at bottom X-axis
      ctx.fillStyle = '#9ca3af';
      ctx.font = '11px Arial';
      ctx.fillText('Môn ' + (index+1), x + barWidth / 2, height - paddingBottom + 20);
    });
  }
};



