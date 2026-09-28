// Bảng điểm (Grades View)
const GradesView = {
  currentPage: 1,
  perPage: 10,
  searchQuery: '',
  filters: {
    classId: '',
    classification: '',
    semester: ''
  },

  render() {
    const container = document.getElementById('main-content');
    container.innerHTML = this.getHTML();
    this.attachEvents();
    this.loadData();
    this.renderSummary();
  },

  getHTML() {
    const classes = Database.classes.getAll();
    const classOptions = classes.map(c => `<option value="${c.id}">${c.classCode} - ${t(c.name)}</option>`).join('');
    const isStudent = Auth.isStudent();

    // Build semester options from classes data
    const semesterSet = new Set();
    classes.forEach(c => { if (c.semester) semesterSet.add(c.semester); });
    const semesterOptions = [...semesterSet].sort().map(s =>
      `<option value="${s}">${s}</option>`
    ).join('');

    return `
      <div class="page-header">
        <div class="page-title-section">
          <h1 class="page-title">${t('grades_title')}</h1>
          <p class="page-subtitle">${t('grades_subtitle')}</p>
        </div>
        <div class="page-actions">
          ${!isStudent ? `
          <button class="btn btn-primary" id="btn-add-grade">
            <i class="fas fa-plus"></i> ${t('add_grade')}
          </button>
          ` : ''}
        </div>
      </div>
      
      <!-- Summary Cards -->
      <div id="grades-summary" class="grid-row" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-4); margin-bottom: var(--space-6);">
        <!-- Rendered by renderSummary() -->
      </div>

      <!-- Filter/Search Bar -->
      <div class="filter-bar" style="display: flex; justify-content: space-between; align-items: center; gap: var(--space-4); flex-wrap: wrap; margin-bottom: var(--space-6);">
        <div class="search-box" style="flex: 1; min-width: 250px; position: relative;">
          <i class="fas fa-search" style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--text-tertiary);"></i>
          <input type="text" id="search-grade" class="form-input" placeholder="${t('search_placeholder')}" style="padding-left: 2.5rem; width: 100%;">
        </div>
        <div class="filter-group" style="display: flex; gap: var(--space-2); flex-wrap: wrap;">
          <select id="filter-semester" class="form-input" style="width: auto; min-width: 170px;">
            <option value="">${t('all_semesters') || '-- Tất cả học kì --'}</option>
            ${semesterOptions}
          </select>
          <select id="filter-class" class="form-input" style="width: auto; min-width: 150px;">
            <option value="">${t('-- Tất cả lớp --')}</option>
            ${classOptions}
          </select>
          <select id="filter-classification" class="form-control">
            <option value="">${t('-- Tất cả xếp loại --')}</option>
            <option value="Xuất sắc">${t('Xuất sắc')}</option>
            <option value="Giỏi">${t('Giỏi')}</option>
            <option value="Khá">${t('Khá')}</option>
            <option value="Trung bình khá">${t('Trung bình khá') || 'Trung bình khá'}</option>
            <option value="Trung bình">${t('Trung bình')}</option>
            <option value="Trung bình yếu">${t('Trung bình yếu') || 'Trung bình yếu'}</option>
            <option value="Yếu">${t('Yếu')}</option>
            <option value="Kém">${t('Kém')}</option>
          </select>
        </div>
      </div>

      <!-- Data Table -->
      <div class="card">
        <div class="table-responsive">
          <table class="data-table" id="table-grades">
            <thead>
              <tr>
                <th>${t('student_id')}</th>
                <th>${t('student_name')}</th>
                <th>${t('class')}</th>
                <th class="text-center">${t('CC (20%)')}</th>
                <th class="text-center">${t('GK (30%)')}</th>
                <th class="text-center">${t('CK (50%)')}</th>
                <th class="text-center">${t('HỆ 10')}</th>
                <th class="text-center">${t('HỆ 4')}</th>
                <th class="text-center">${t('ĐIỂM CHỮ')}</th>
                <th class="text-center">${t('classification')}</th>
                ${!isStudent ? `<th class="text-right">${t('actions')}</th>` : ''}
              </tr>
            </thead>
            <tbody id="tbody-grades">
              <!-- Rendered by loadData() -->
            </tbody>
          </table>
        </div>
        <div class="table-footer">
          <div class="table-info" id="table-info-grades"></div>
          <div class="pagination" id="pagination-grades"></div>
        </div>
      </div>
    `;
  },

  getAllowedGrades() {
    let items = Database.grades.getAll();
    const user = Auth.getCurrentUser();
    
    if (Auth.isStudent()) {
       // Students only see their own grades
       items = items.filter(g => g.studentId === user.linkedId);
    } else if (Auth.isTeacher() && user.linkedId) {
       // Teachers only see grades for their own classes
       const teacherObj = Database.teachers.getById(user.linkedId);
       if (teacherObj) {
         const allClasses = Database.classes.getAll();
         const myClasses = allClasses.filter(c => c.teacherId === teacherObj.teacherId || c.teacherId === 'ref:' + teacherObj.teacherId || c.teacherId === teacherObj.id);
         const myClassIds = myClasses.map(c => c.id);
         items = items.filter(g => myClassIds.includes(g.classId));
       }
    }
    return items;
  },

  renderSummary() {
    let items = this.getAllowedGrades();
    if (this.filters.classId) {
      items = items.filter(g => g.classId === this.filters.classId);
    }
    
    const summaryContainer = document.getElementById('grades-summary');
    if (!summaryContainer) return;
    
    if (Auth.isAdmin() || Auth.isTeacher()) {
      const students = Database.students.getAll();
      const enrichedItems = items.map(g => {
         const student = students.find(s => s.id === g.studentId) || {};
         return { ...g, studentName: student.name || 'N/A' };
      });
      
      const totalGrades = enrichedItems.length;
      let countA = 0, countB = 0, countC = 0, countD = 0, countF = 0;
      const attentionStudents = [];
      
      enrichedItems.forEach(g => {
         if (g.letterGrade === 'A') countA++;
         else if (g.letterGrade && g.letterGrade.startsWith('B')) countB++;
         else if (g.letterGrade && g.letterGrade.startsWith('C')) countC++;
         else if (g.letterGrade && g.letterGrade.startsWith('D')) {
            countD++;
            // Lọc ra các sinh viên duy nhất bị điểm D/F
            if (!attentionStudents.includes(`${g.studentName} (${g.letterGrade})`)) {
               attentionStudents.push(`${g.studentName} (${g.letterGrade})`);
            }
         }
         else if (g.letterGrade === 'F') {
            countF++;
            if (!attentionStudents.includes(`${g.studentName} (F)`)) {
               attentionStudents.push(`${g.studentName} (F)`);
            }
         }
      });
      
      const attentionHtml = attentionStudents.length > 0 
          ? attentionStudents.map(s => `<div style="font-size:var(--font-size-xs, 12px); border-bottom:1px solid var(--border-color); padding:4px 0;">${s}</div>`).join('')
          : `<div style="font-size:var(--font-size-xs, 12px); color:var(--text-secondary); margin-top:4px;">${t('no_data') || 'Không có'}</div>`;
          
      summaryContainer.style.gridTemplateColumns = ''; // Reset to default
      
      summaryContainer.innerHTML = `
        <div class="card" style="display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3); border-left: 4px solid var(--primary-500);">
          <div style="width: 40px; height: 40px; display: flex; justify-content: center; align-items: center; border-radius: 50%; font-size: 1.25rem; background: var(--primary-100); color: var(--primary-600); flex-shrink: 0;">
            <i class="fas fa-file-alt"></i>
          </div>
          <div>
            <div style="color: var(--text-secondary); font-size: var(--font-size-xs);">${t('total_grades_record')}</div>
            <div style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary); line-height: 1; margin-top: 2px;">${totalGrades}</div>
          </div>
        </div>
        
        <div class="card" style="display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3); border-left: 4px solid var(--info-500);">
          <div style="width: 40px; height: 40px; display: flex; justify-content: center; align-items: center; border-radius: 50%; font-size: 1.25rem; background: var(--info-100); color: var(--info-600); flex-shrink: 0;">
            <i class="fas fa-chart-pie"></i>
          </div>
          <div style="flex:1; min-width: 0;">
            <div style="color: var(--text-secondary); font-size: var(--font-size-xs);">${t('letter_grade_distribution')}</div>
            <div style="display: flex; gap: 8px; font-weight: 600; font-size: 0.85rem; margin-top: 4px; flex-wrap: wrap;">
               <span style="color: var(--success);">A: ${countA}</span>
               <span style="color: var(--primary-500);">B: ${countB}</span>
               <span style="color: var(--warning);">C: ${countC}</span>
               <span style="color: var(--orange-500);">D: ${countD}</span>
               <span style="color: var(--danger);">F: ${countF}</span>
            </div>
          </div>
        </div>
        
        <div class="card" style="display: flex; align-items: flex-start; gap: var(--space-3); padding: var(--space-3); border-left: 4px solid var(--danger);">
          <div style="width: 40px; height: 40px; display: flex; justify-content: center; align-items: center; border-radius: 50%; font-size: 1.25rem; background: #fee2e2; color: #ef4444; flex-shrink: 0;">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <div style="flex: 1; overflow: hidden; width: 100%;">
            <div style="color: var(--text-secondary); font-size: var(--font-size-xs);">${t('attention_students')}</div>
            <div style="max-height: 80px; overflow-y: auto; margin-top: 4px; padding-right: 4px; font-size: 0.85rem;">
               ${attentionHtml}
            </div>
          </div>
        </div>
      `;
    } else {
      // Student View
      let totalAvg10 = 0;
      let maxScore = 0;
      let minScore = 10;
      
      if (items.length > 0) {
          totalAvg10 = items.reduce((sum, g) => sum + (g.average10 || 0), 0) / items.length;
          maxScore = Math.max(...items.map(g => g.average10 || 0));
          minScore = Math.min(...items.map(g => g.average10 || 0));
      } else {
          minScore = 0;
      }

      summaryContainer.innerHTML = `
        <div class="card" style="display: flex; align-items: center; gap: var(--space-4); padding: var(--space-4); border-left: 4px solid var(--primary-500);">
          <div style="width: 48px; height: 48px; display: flex; justify-content: center; align-items: center; border-radius: 50%; font-size: 1.5rem; background: var(--primary-100); color: var(--primary-600);">
            <i class="fas fa-chart-line"></i>
          </div>
          <div>
            <div style="color: var(--text-secondary); font-size: var(--font-size-sm);">${t('Trung bình Hệ 10')}</div>
            <div style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary); line-height: 1;">${totalAvg10.toFixed(2)}</div>
          </div>
        </div>
        <div class="card" style="display: flex; align-items: center; gap: var(--space-4); padding: var(--space-4); border-left: 4px solid var(--success);">
          <div style="width: 48px; height: 48px; display: flex; justify-content: center; align-items: center; border-radius: 50%; font-size: 1.5rem; background: var(--success-100); color: var(--success-600);">
            <i class="fas fa-arrow-up"></i>
          </div>
          <div>
            <div style="color: var(--text-secondary); font-size: var(--font-size-sm);">${t('highest_score')}</div>
            <div style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary); line-height: 1;">${maxScore.toFixed(2)}</div>
          </div>
        </div>
        <div class="card" style="display: flex; align-items: center; gap: var(--space-4); padding: var(--space-4); border-left: 4px solid var(--danger);">
          <div style="width: 48px; height: 48px; display: flex; justify-content: center; align-items: center; border-radius: 50%; font-size: 1.5rem; background: #fee2e2; color: #ef4444;">
            <i class="fas fa-arrow-down"></i>
          </div>
          <div>
            <div style="color: var(--text-secondary); font-size: var(--font-size-sm);">${t('lowest_score')}</div>
            <div style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary); line-height: 1;">${minScore.toFixed(2)}</div>
          </div>
        </div>
      `;
    }
  },

  attachEvents() {
    const mainContent = document.getElementById('main-content');
    
    mainContent.addEventListener('click', (e) => {
      if (e.target.closest('#btn-add-grade')) {
        this.showAddModal();
      }
      
      const btnEdit = e.target.closest('.btn-edit');
      if (btnEdit) {
        this.showEditModal(btnEdit.dataset.id);
      }
      
      const btnDelete = e.target.closest('.btn-delete');
      if (btnDelete) {
        this.handleDelete(btnDelete.dataset.id);
      }
    });

    // Tìm kiếm (debounce)
    const searchInput = document.getElementById('search-grade');
    if (searchInput) {
      searchInput.addEventListener('input', Utils.debounce((e) => {
        this.searchQuery = e.target.value.toLowerCase();
        this.currentPage = 1;
        this.loadData();
      }, 300));
    }

    // Lọc theo lớp
    const filterClass = document.getElementById('filter-class');
    if (filterClass) {
      filterClass.addEventListener('change', (e) => {
        this.filters.classId = e.target.value;
        this.currentPage = 1;
        this.loadData();
        this.renderSummary();
      });
    }

    // Lọc theo học kì
    const filterSemester = document.getElementById('filter-semester');
    if (filterSemester) {
      filterSemester.addEventListener('change', (e) => {
        this.filters.semester = e.target.value;
        this.currentPage = 1;
        this.loadData();
        this.renderSummary();
      });
    }

    // Lọc theo xếp loại
    const filterClassif = document.getElementById('filter-classification');
    if (filterClassif) {
      filterClassif.addEventListener('change', (e) => {
        this.filters.classification = e.target.value;
        this.currentPage = 1;
        this.loadData();
      });
    }
  },

  loadData() {
    let items = this.getAllowedGrades();
    const students = Database.students.getAll();
    const classes = Database.classes.getAll();

    // Enrich items với student name và class name
    items = items.map(g => {
      const student = students.find(s => s.id === g.studentId) || {};
      const cls = classes.find(c => c.id === g.classId) || {};
      return {
        ...g,
        studentName: student.name || 'N/A',
        studentCode: student.studentId || 'N/A',
        className: cls.name || 'N/A',
        classCode: cls.classCode || 'N/A'
      };
    });

    // Lọc theo search
    if (this.searchQuery) {
      items = items.filter(g => 
        g.studentName.toLowerCase().includes(this.searchQuery) || 
        g.studentCode.toLowerCase().includes(this.searchQuery) ||
        g.className.toLowerCase().includes(this.searchQuery)
      );
    }

    // Lọc theo classId
    if (this.filters.classId) {
      items = items.filter(g => g.classId === this.filters.classId);
    }

    // Lọc theo học kì (semester)
    if (this.filters.semester) {
      const semClasses = Database.classes.getAll()
        .filter(c => c.semester === this.filters.semester)
        .map(c => c.id);
      items = items.filter(g => semClasses.includes(g.classId));
    }

    // Lọc theo xếp loại
    if (this.filters.classification) {
      items = items.filter(g => g.classification === this.filters.classification);
    }

    // Phân trang
    const paginated = Utils.paginate(items, this.currentPage, this.perPage);
    this.renderTable(paginated.items);
    
    // Render info và pagination
    const infoContainer = document.getElementById('table-info-grades');
    if (infoContainer) {
      const start = (paginated.currentPage - 1) * this.perPage + 1;
      const end = Math.min(start + this.perPage - 1, paginated.totalItems);
      infoContainer.innerHTML = `${t('showing')} ${paginated.totalItems === 0 ? 0 : start}-${end} ${t('of')} ${paginated.totalItems} ${t('entries')}`;
    }

    Utils.renderPagination('pagination-grades', paginated.currentPage, paginated.totalPages, (page) => {
      this.currentPage = page;
      this.loadData();
    });
  },

  renderTable(items) {
    const tbody = document.getElementById('tbody-grades');
    if (!tbody) return;

    if (items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="11" class="text-center py-8">${t('no_data')}</td></tr>`;
      return;
    }

    const isStudent = Auth.isStudent();

    tbody.innerHTML = items.map(g => {
      const nameHtml = this.searchQuery ? Utils.highlightText(g.studentName, this.searchQuery) : g.studentName;
      const codeHtml = this.searchQuery ? Utils.highlightText(g.studentCode, this.searchQuery) : g.studentCode;
      
      let badgeColor = 'neutral';
      if (g.letterGrade === 'A') badgeColor = 'success';
      else if (['B+', 'B'].includes(g.letterGrade)) badgeColor = 'primary';
      else if (['C+', 'C'].includes(g.letterGrade)) badgeColor = 'warning';
      else if (['D+', 'D'].includes(g.letterGrade)) badgeColor = 'orange';
      else if (g.letterGrade === 'F') badgeColor = 'danger';
      
      return `
        <tr>
          <td><strong>${codeHtml}</strong></td>
          <td>${nameHtml}</td>
          <td>
            <div class="text-sm font-medium">${g.classCode}</div>
            <div class="text-xs text-secondary">${t(g.className)}</div>
          </td>
          <td class="text-center">${g.assignment !== undefined ? g.assignment : '-'}</td>
          <td class="text-center">${g.midterm !== undefined ? g.midterm : '-'}</td>
          <td class="text-center">${g.final !== undefined ? g.final : '-'}</td>
          <td class="text-center font-bold text-primary-600">${g.average10 !== undefined ? g.average10.toFixed(1) : '-'}</td>
          <td class="text-center font-bold text-accent-600">${g.average4 !== undefined ? g.average4.toFixed(1) : '-'}</td>
          <td class="text-center font-bold" style="color: var(--${badgeColor}-600);">${g.letterGrade || '-'}</td>
          <td class="text-center">
            <span class="badge badge-${badgeColor}">${t(g.classification) || g.classification || '--'}</span>
          </td>
          ${!isStudent ? `
          <td class="text-right">
            <button class="btn-icon btn-edit text-primary-500" data-id="${g.id}" title="${t('edit')}">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-icon btn-delete text-danger" data-id="${g.id}" title="${t('delete')}">
              <i class="fas fa-trash"></i>
            </button>
          </td>` : ''}
        </tr>
      `;
    }).join('');
  },

  getModalFormHTML(grade = {}) {
    let students = Database.students.getAll();
    let classes = Database.classes.getAll();
    const user = Auth.getCurrentUser();

    // If teacher, only allow their own classes and students in those classes
    if (Auth.isTeacher() && user.linkedId) {
       const teacherObj = Database.teachers.getById(user.linkedId);
       if (teacherObj) {
         classes = classes.filter(c => c.teacherId === teacherObj.teacherId || c.teacherId === 'ref:' + teacherObj.teacherId || c.teacherId === teacherObj.id);
         const myClassIds = classes.map(c => c.id);
         
         // Optionally filter students, but let's allow all students to be added to their class.
       }
    }
    
    const studentOptions = students.map(s => 
      `<option value="${s.id}" ${grade.studentId === s.id ? 'selected' : ''}>${s.studentId} - ${s.name}</option>`
    ).join('');
    
    const classOptions = classes.map(c => 
      `<option value="${c.id}" ${grade.classId === c.id ? 'selected' : ''}>${c.classCode} - ${c.name}</option>`
    ).join('');

    return `
      <form id="grade-form">
        <input type="hidden" id="grade-id" value="${grade.id || ''}">
        
        <div class="form-group">
          <label class="form-label">${t('student_name')} <span class="text-danger">*</span></label>
          <select id="grade-student" class="form-input" required ${grade.id ? 'disabled' : ''}>
            <option value="">-- ${t('select_student')} --</option>
            ${studentOptions}
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">${t('class')} <span class="text-danger">*</span></label>
          <select id="grade-class" class="form-input" required ${grade.id ? 'disabled' : ''}>
            <option value="">-- ${t('select_class')} --</option>
            ${classOptions}
          </select>
        </div>

        <div class="form-row flex gap-4">
          <div class="form-group flex-1">
            <label class="form-label">${t('attendance_grade_label')}</label>
            <input type="number" id="grade-assignment" class="form-input" min="0" max="10" step="0.1" value="${grade.assignment !== undefined ? grade.assignment : ''}" required>
          </div>
          <div class="form-group flex-1">
            <label class="form-label">${t('midterm_grade_label')}</label>
            <input type="number" id="grade-midterm" class="form-input" min="0" max="10" step="0.1" value="${grade.midterm !== undefined ? grade.midterm : ''}" required>
          </div>
          <div class="form-group flex-1">
            <label class="form-label">${t('final_grade_label')}</label>
            <input type="number" id="grade-final" class="form-input" min="0" max="10" step="0.1" value="${grade.final !== undefined ? grade.final : ''}" required>
          </div>
        </div>

        <div class="p-4 bg-primary-50 rounded-md mt-4 border border-primary-200">
          <div class="flex justify-between items-center mb-2">
            <span class="font-medium text-primary-900">${t('HỆ 10')}:</span>
            <span id="display-average10" class="text-lg font-bold text-primary-600">${grade.average10 !== undefined ? grade.average10.toFixed(1) : '0.0'}</span>
          </div>
          <div class="flex justify-between items-center mb-2">
            <span class="font-medium text-primary-900">${t('HỆ 4')}:</span>
            <span id="display-average4" class="text-lg font-bold text-accent-600">${grade.average4 !== undefined ? grade.average4.toFixed(1) : '0.0'}</span>
          </div>
          <div class="flex justify-between items-center mb-2">
            <span class="font-medium text-primary-900">${t('ĐIỂM CHỮ')}:</span>
            <span id="display-letter" class="text-lg font-bold">${grade.letterGrade || '--'}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="font-medium text-primary-900">${t('classification')}:</span>
            <span id="display-classification" class="badge badge-neutral">${grade.classification || '--'}</span>
          </div>
        </div>
      </form>
    `;
  },

  attachFormEvents() {
    const calcAvg = () => {
      const ass = parseFloat(document.getElementById('grade-assignment').value) || 0;
      const mid = parseFloat(document.getElementById('grade-midterm').value) || 0;
      const fin = parseFloat(document.getElementById('grade-final').value) || 0;

      const calc = Database.grades.calculateAverage(ass, mid, fin);

      document.getElementById('display-average10').innerText = calc.average10.toFixed(1);
      document.getElementById('display-average4').innerText = calc.average4.toFixed(1);

      const letterEl = document.getElementById('display-letter');
      letterEl.innerText = calc.letterGrade;

      let badgeColor = 'neutral';
      if (calc.letterGrade === 'A') badgeColor = 'success';
      else if (['B+', 'B'].includes(calc.letterGrade)) badgeColor = 'primary';
      else if (['C+', 'C'].includes(calc.letterGrade)) badgeColor = 'warning';
      else if (['D+', 'D'].includes(calc.letterGrade)) badgeColor = 'orange';
      else if (calc.letterGrade === 'F') badgeColor = 'danger';

      letterEl.style.color = `var(--${badgeColor}-600)`;

      const classifEl = document.getElementById('display-classification');
      classifEl.innerText = t(calc.classification) || calc.classification;
      classifEl.className = `badge badge-${badgeColor}`;
    };

    calcAvg();

    ['grade-assignment', 'grade-midterm', 'grade-final'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', calcAvg);
      }
    });
  },

  showAddModal() {
    Utils.showModal(
      t('add_grade'),
      this.getModalFormHTML(),
      `<button class="btn btn-ghost" onclick="Utils.closeModal()">${t('cancel')}</button><button class="btn btn-primary" id="btn-save-grade">${t('save')}</button>`
    );
    this.attachFormEvents();

    document.getElementById('btn-save-grade').addEventListener('click', () => this.saveGrade());
  },

  showEditModal(id) {
    const grades = Database.grades.getAll();
    const grade = grades.find(g => g.id === id);
    if (!grade) return;

    Utils.showModal(
      t('edit_grade'),
      this.getModalFormHTML(grade),
      `<button class="btn btn-ghost" onclick="Utils.closeModal()">${t('cancel')}</button><button class="btn btn-primary" id="btn-save-grade">${t('save')}</button>`
    );
    this.attachFormEvents();

    document.getElementById('btn-save-grade').addEventListener('click', () => this.saveGrade());
  },

    async saveGrade() {
      if (typeof Auth !== 'undefined' && !(Auth.isAdmin() || Auth.isTeacher())) {
        Utils.toast(t('error') + ': Permission denied', 'error');
        return;
      }

      const form = document.getElementById('grade-form');
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

    const id = document.getElementById('grade-id').value;
    const studentId = document.getElementById('grade-student').value;
    const classId = document.getElementById('grade-class').value;
    const assignment = parseFloat(document.getElementById('grade-assignment').value);
    const midterm = parseFloat(document.getElementById('grade-midterm').value);
    const final = parseFloat(document.getElementById('grade-final').value);
    
    // Validate 0-10
    if (midterm < 0 || midterm > 10 || final < 0 || final > 10 || assignment < 0 || assignment > 10) {
      Utils.toast(t('error') + ': ' + (t('grade_range_error') || 'Điểm phải từ 0 đến 10'), 'error');
      return;
    }

    // === Grade Lock Check (Server-side) ===
    try {
      const lockStatus = await Database.gradeLock.check({ class_id: classId, student_id: studentId });
      if (lockStatus.locked) {
        // Nếu pre_exam lock: chỉ cho nhập điểm cuối kì
        if (lockStatus.lock_type === 'pre_exam' && !id) {
          // Cho phép nhập final nếu chưa có grade
        } else if (lockStatus.lock_type === 'pre_exam' && id) {
          // Cho phép sửa final, khoá assignment + midterm
          const existingGrade = Database.grades.getAll().find(g => g.id === id);
          if (existingGrade && (assignment !== existingGrade.assignment || midterm !== existingGrade.midterm)) {
            if (typeof Swal !== 'undefined') {
              Swal.fire({
                icon: 'warning',
                title: 'Điểm thành phần đã bị khoá',
                text: lockStatus.message,
                confirmButtonText: 'Đã hiểu',
              });
            } else {
              Utils.toast(lockStatus.message, 'error');
            }
            return;
          }
        } else if (lockStatus.lock_type !== 'pre_exam') {
          // Mọi lock type khác: chặn hoàn toàn
          if (typeof Swal !== 'undefined') {
            Swal.fire({
              icon: 'error',
              title: 'Bảng điểm đã bị khoá',
              text: lockStatus.message,
              confirmButtonText: 'Đã hiểu',
            });
          } else {
            Utils.toast(lockStatus.message, 'error');
          }
          return;
        }
      }
    } catch (err) {
      console.log('Lock check failed, proceeding:', err.message);
    }

    const gradeData = {
      studentId,
      classId,
      assignment,
      midterm,
      final
    };

    if (id) {
      Database.grades.update(id, gradeData);
      Utils.toast(t('success') + ': ' + t('edit_grade'), 'success');
    } else {
      // Check if grade already exists for this student in this class
      const existing = Database.grades.getAll().find(g => g.studentId === studentId && g.classId === classId);
      if (existing) {
        Utils.toast(t('error') + ': ' + (t('grade_duplicate_error') || 'Sinh viên này đã có điểm trong lớp này'), 'error');
        return;
      }
      Database.grades.add(gradeData);
      Utils.toast(t('success') + ': ' + t('add_grade'), 'success');
    }

    Utils.closeModal();
    this.loadData();
    this.renderSummary();
    
    setTimeout(() => {
      window.location.reload();
    }, 800);
  },

  handleDelete(id) {
    if (typeof Auth !== 'undefined' && !(Auth.isAdmin() || Auth.isTeacher())) {
      Utils.toast(t('error') + ': Permission denied', 'error');
      return;
    }
    
    // SweetAlert2 confirmation (fallback to Utils.showConfirm)
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: t('confirm_delete') || 'Xác nhận xoá?',
        text: 'Hành động này không thể hoàn tác!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: t('delete') || 'Xoá',
        cancelButtonText: t('cancel') || 'Huỷ',
      }).then((result) => {
        if (result.isConfirmed) {
          Database.grades.delete(id);
          Swal.fire({
            icon: 'success',
            title: 'Đã xoá!',
            text: 'Bản ghi điểm đã được xoá thành công.',
            timer: 1500,
            showConfirmButton: false,
          });
          this.loadData();
          this.renderSummary();
        }
      });
    } else {
      Utils.showConfirm(t('confirm_delete'), () => {
        Database.grades.delete(id);
        Utils.toast(t('success'), 'success');
        this.loadData();
        this.renderSummary();
      });
    }
  }
};
