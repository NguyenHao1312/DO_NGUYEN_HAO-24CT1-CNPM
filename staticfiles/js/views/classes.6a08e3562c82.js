// js/views/classes.js

const ClassesView = {
  searchQuery: '',
  filters: {
    department: '',
    semester: ''
  },

  render() {
    const container = document.getElementById('main-content');
    container.innerHTML = this.getHTML();
    this.attachEvents();
    this.loadData();
    
    container.classList.add('fade-in');
    setTimeout(() => container.classList.remove('fade-in'), 300);
  },

  getHTML() {
    return `
      <div class="page-header">
        <div class="page-title-section">
          <h1 class="page-title">${t('classes_title')}</h1>
          <p class="page-subtitle">${t('classes_subtitle')}</p>
        </div>
        <div class="page-actions">
          ${(Auth.isAdmin() || Auth.isTeacher()) ? `
          <button class="btn btn-primary" id="btn-add-class">
            <i class="fas fa-plus"></i> ${t('add_class')}
          </button>
          ` : ''}
        </div>
      </div>

      <!-- Filter/Search Bar -->
      <div class="filter-bar" style="display: flex; gap: var(--space-4); margin-bottom: var(--space-4); flex-wrap: wrap;">
        <div class="search-box" style="flex: 1; min-width: 200px; position: relative;">
          <i class="fas fa-search" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-tertiary);"></i>
          <input type="text" id="search-class" class="form-input" placeholder="${t('search_placeholder')}" style="padding-left: 36px; width: 100%;">
        </div>
        <div class="filter-group" style="display: flex; gap: var(--space-4);">
          <select id="filter-dept-class" class="form-input">
            <option value="">${t('department')} (${t('all')})</option>
            <option value="Công nghệ thông tin">${t('Công nghệ thông tin')}</option>
            <option value="Kinh tế">${t('Kinh tế')}</option>
            <option value="Ngoại ngữ">${t('Ngoại ngữ')}</option>
            <option value="Cơ khí">${t('Cơ khí')}</option>
            <option value="Y dược">${t('Y dược')}</option>
          </select>
          <select id="filter-semester" class="form-input">
            <option value="">${t('semester')} (${t('all')})</option>
            <option value="HK1 2024-2025">HK1 2024-2025</option>
            <option value="HK2 2023-2024">HK2 2023-2024</option>
            <option value="HK1 2023-2024">HK1 2023-2024</option>
          </select>
        </div>
      </div>

      <!-- Grid Cards -->
      <div id="classes-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--space-5);">
        <!-- Rendered by loadData() -->
      </div>
    `;
  },

  attachEvents() {
    const mainContent = document.getElementById('main-content');
    
    mainContent.addEventListener('click', (e) => {
      const btnAdd = e.target.closest('#btn-add-class');
      const btnEdit = e.target.closest('.btn-edit-class');
      const btnDelete = e.target.closest('.btn-delete-class');
      
      if (btnAdd) this.showAddModal();
      if (btnEdit) this.showEditModal(btnEdit.dataset.id);
      if (btnDelete) this.handleDelete(btnDelete.dataset.id);
    });

    const searchInput = document.getElementById('search-class');
    if (searchInput) {
      searchInput.addEventListener('input', Utils.debounce((e) => {
        this.searchQuery = e.target.value;
        this.loadData();
      }, 300));
    }

    const filterDept = document.getElementById('filter-dept-class');
    if (filterDept) {
      filterDept.addEventListener('change', (e) => {
        this.filters.department = e.target.value;
        this.loadData();
      });
    }

    const filterSem = document.getElementById('filter-semester');
    if (filterSem) {
      filterSem.addEventListener('change', (e) => {
        this.filters.semester = e.target.value;
        this.loadData();
      });
    }
  },

  loadData() {
    let items = Database.classes.getAll();
    const user = Auth.getCurrentUser();
    
    if (user && user.role === 'student' && user.linkedId) {
      // Student only sees their enrolled classes
      const myGrades = Database.grades.getByStudentId(user.linkedId);
      const myClassIds = myGrades.map(g => g.classId);
      items = items.filter(c => myClassIds.includes(c.id));
    } else if (user && user.role === 'teacher' && user.linkedId) {
      // Teacher sees their teaching classes
      const teacherObj = Database.teachers.getById(user.linkedId);
      if (teacherObj) {
         items = items.filter(c => c.teacherId === teacherObj.teacherId || c.teacherId === 'ref:' + teacherObj.teacherId || c.teacherId === teacherObj.id);
      }
    }
    
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      items = items.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.classCode.toLowerCase().includes(q)
      );
    }
    
    if (this.filters.department) {
      items = items.filter(c => c.department === this.filters.department);
    }
    if (this.filters.semester) {
      items = items.filter(c => c.semester === this.filters.semester);
    }

    this.renderGrid(items);
  },

  renderGrid(items) {
    const grid = document.getElementById('classes-grid');
    if (!items || items.length === 0) {
      grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: var(--space-10); color: var(--text-tertiary); background: var(--bg-secondary); border-radius: var(--radius-md);">${t('no_data')}</div>`;
      return;
    }

    // Prepare data for student counts and teacher names
    const allStudents = Database.students.getAll();
    const allTeachers = Database.teachers.getAll();

    grid.innerHTML = items.map(cls => {
      // Find teacher
      let teacherName = t('unassigned_teacher') || 'Chưa phân công';
      if(cls.teacherId) {
        // Handle "ref:" prefix if exists in seed data
        const tId = cls.teacherId.startsWith('ref:') ? cls.teacherId.replace('ref:', '') : cls.teacherId;
        const teacher = allTeachers.find(t => t.teacherId === tId || t.id === tId);
        if(teacher) teacherName = teacher.name;
      }

      // Count students in class
      const studentCount = allStudents.filter(s => s.classId === cls.id || s.classId === cls.classCode).length;
      
      const percent = cls.maxStudents ? Math.min(100, Math.round((studentCount / cls.maxStudents) * 100)) : 0;
      const pbColor = percent > 90 ? 'var(--danger)' : percent > 75 ? 'var(--warning)' : 'var(--success)';

      return `
        <div class="card" style="display: flex; flex-direction: column;">
          <div class="card-header" style="padding: var(--space-4); border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <div style="font-size: var(--font-size-xs); color: var(--primary-600); font-weight: 600; margin-bottom: 4px;">${cls.classCode}</div>
              <h3 style="margin: 0; font-size: var(--font-size-lg); color: var(--text-primary); line-height: 1.3;">
                ${this.searchQuery ? (Utils.highlightText ? Utils.highlightText(t(cls.name), this.searchQuery) : t(cls.name)) : t(cls.name)}
              </h3>
            </div>
            ${(Auth.isAdmin() || Auth.isTeacher()) ? `
            <div style="display: flex; gap: 4px;">
              <button class="btn-icon btn-edit-class" data-id="${cls.id}" style="color: var(--text-secondary); width: 28px; height: 28px;"><i class="fas fa-edit"></i></button>
              <button class="btn-icon btn-delete-class" data-id="${cls.id}" style="color: var(--danger); width: 28px; height: 28px;"><i class="fas fa-trash"></i></button>
            </div>
            ` : ''}
          </div>
          
          <div class="card-body" style="padding: var(--space-4); flex: 1; display: flex; flex-direction: column; gap: var(--space-3); font-size: var(--font-size-sm);">
            <div style="display: flex; align-items: center; gap: var(--space-2); color: var(--text-secondary);">
              <i class="fas fa-chalkboard-teacher" style="width: 16px;"></i> <span>${teacherName}</span>
            </div>
            <div style="display: flex; align-items: center; gap: var(--space-2); color: var(--text-secondary);">
              <i class="fas fa-calendar-alt" style="width: 16px;"></i> <span>${cls.schedule || '-'}</span>
            </div>
            <div style="display: flex; align-items: center; gap: var(--space-2); color: var(--text-secondary);">
              <i class="fas fa-map-marker-alt" style="width: 16px;"></i> <span>${t('Phòng')}: ${cls.room || '-'}</span>
            </div>
            
            <div style="display: flex; gap: var(--space-2); flex-wrap: wrap; margin-bottom: var(--space-4);">
              <span class="badge" style="background: var(--bg-tertiary); color: var(--text-secondary); border: 1px solid var(--border-color);">${t(cls.department) || t('Đại cương')}</span>
              <span class="badge badge-info">${cls.credits} ${t('TC')}</span>
              <span class="badge badge-neutral">${cls.semester}</span>
            </div>
          </div>

          <div class="card-footer" style="padding: var(--space-3) var(--space-4); border-top: 1px solid var(--border-color); background: var(--bg-tertiary);">
            <div style="display: flex; justify-content: space-between; font-size: var(--font-size-xs); color: var(--text-secondary); margin-bottom: 4px;">
              <span>${t('enrolled')}: ${studentCount}/${cls.maxStudents}</span>
              <span>${percent}%</span>
            </div>
            <div style="width: 100%; height: 6px; background: var(--border-color); border-radius: var(--radius-full); overflow: hidden;">
              <div style="height: 100%; width: ${percent}%; background: ${pbColor}; border-radius: var(--radius-full);"></div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  getFormHTML(data = {}) {
    const teachers = Database.teachers.getAll();
    const teacherOptions = teachers.map(t => 
      `<option value="${t.teacherId}" ${data.teacherId === t.teacherId || data.teacherId === 'ref:'+t.teacherId ? 'selected' : ''}>${t.name} (${t.teacherId})</option>`
    ).join('');

    return `
      <form id="class-form" class="form">
        <div class="form-row" style="display: grid; grid-template-columns: 1fr 2fr; gap: var(--space-4); margin-bottom: var(--space-3);">
          <div class="form-group">
            <label class="form-label">${t('class_code')} *</label>
            <input type="text" id="form-cl-code" class="form-input" value="${data.classCode || ''}" required>
          </div>
          <div class="form-group">
            <label class="form-label">${t('class_name')} *</label>
            <input type="text" id="form-cl-name" class="form-input" value="${data.name || ''}" required>
          </div>
        </div>
        
        <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); margin-bottom: var(--space-3);">
          <div class="form-group">
            <label class="form-label">${t('teacher')} *</label>
            <select id="form-cl-teacher" class="form-input" required>
              <option value="">-- ${t('select_teacher') || 'Chọn giáo viên'} --</option>
              ${teacherOptions}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">${t('department')} *</label>
            <select id="form-cl-dept" class="form-input" required>
              <option value="Công nghệ thông tin" ${data.department === 'Công nghệ thông tin' ? 'selected' : ''}>${t('Công nghệ thông tin')}</option>
              <option value="Kinh tế" ${data.department === 'Kinh tế' ? 'selected' : ''}>${t('Kinh tế')}</option>
              <option value="Ngoại ngữ" ${data.department === 'Ngoại ngữ' ? 'selected' : ''}>${t('Ngoại ngữ')}</option>
              <option value="Cơ khí" ${data.department === 'Cơ khí' ? 'selected' : ''}>${t('Cơ khí')}</option>
              <option value="Y dược" ${data.department === 'Y dược' ? 'selected' : ''}>${t('Y dược')}</option>
            </select>
          </div>
        </div>

        <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); margin-bottom: var(--space-3);">
          <div class="form-group">
            <label class="form-label">${t('schedule')} *</label>
            <input type="text" id="form-cl-schedule" class="form-input" placeholder="VD: T2-T4 7:30-9:00" value="${data.schedule || ''}" required>
          </div>
          <div class="form-group">
            <label class="form-label">${t('room')} *</label>
            <input type="text" id="form-cl-room" class="form-input" value="${data.room || ''}" required>
          </div>
        </div>

        <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: var(--space-4); margin-bottom: var(--space-3);">
          <div class="form-group">
            <label class="form-label">${t('max_students')} *</label>
            <input type="number" id="form-cl-max" class="form-input" value="${data.maxStudents || 40}" min="1" required>
          </div>
          <div class="form-group">
            <label class="form-label">${t('credits')} *</label>
            <input type="number" id="form-cl-credits" class="form-input" value="${data.credits || 3}" min="1" max="10" required>
          </div>
          <div class="form-group">
            <label class="form-label">${t('semester')} *</label>
            <input type="text" id="form-cl-semester" class="form-input" value="${data.semester || 'HK1 2024-2025'}" required>
          </div>
        </div>
      </form>
    `;
  },

  showAddModal() {
    const bodyHTML = this.getFormHTML();
    const footerHTML = `
      <button class="btn btn-ghost" onclick="Utils.closeModal()">${t('cancel')}</button>
      <button class="btn btn-primary" onclick="ClassesView.saveClass()">${t('save')}</button>
    `;
    Utils.showModal(t('add_class'), bodyHTML, footerHTML);
  },

  showEditModal(id) {
    const cls = Database.classes.getById(id);
    if (!cls) return;

    const bodyHTML = this.getFormHTML(cls);
    const footerHTML = `
      <button class="btn btn-ghost" onclick="Utils.closeModal()">${t('cancel')}</button>
      <button class="btn btn-primary" onclick="ClassesView.saveClass('${id}')">${t('save')}</button>
    `;
    Utils.showModal(t('edit_class'), bodyHTML, footerHTML);
  },

  saveClass(id = null) {
    if (typeof Auth !== 'undefined' && !(Auth.isAdmin() || Auth.isTeacher())) {
      Utils.toast(t('error') + ': Permission denied', 'error');
      return;
    }

    const form = document.getElementById('class-form');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const data = {
      classCode: document.getElementById('form-cl-code').value.trim(),
      name: document.getElementById('form-cl-name').value.trim(),
      teacherId: document.getElementById('form-cl-teacher').value,
      department: document.getElementById('form-cl-dept').value,
      schedule: document.getElementById('form-cl-schedule').value.trim(),
      room: document.getElementById('form-cl-room').value.trim(),
      maxStudents: parseInt(document.getElementById('form-cl-max').value, 10),
      credits: parseInt(document.getElementById('form-cl-credits').value, 10),
      semester: document.getElementById('form-cl-semester').value.trim()
    };

    try {
      if (id) {
        Database.classes.update(id, data);
        Utils.logActivity('updated', 'class', id, `Cập nhật lớp ${data.classCode}`);
        Utils.toast(t('update_class_success') || 'Đã điều chỉnh lớp học thành công!', 'success');
      } else {
        const newItem = Database.classes.add(data);
        Utils.logActivity('created', 'class', newItem.id, `Thêm lớp ${data.classCode}`);
        Utils.toast(t('add_class_success') || 'Đã thêm lớp học thành công!', 'success');
      }
      Utils.closeModal();
      this.loadData();
      
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (error) {
      Utils.toast(t('error') + ': ' + error.message, 'error');
    }
  },

  handleDelete(id) {
    if (typeof Auth !== 'undefined' && !(Auth.isAdmin() || Auth.isTeacher())) {
      Utils.toast(t('error') + ': Permission denied', 'error');
      return;
    }
    
    const doDelete = () => {
      const cls = Database.classes.getById(id);
      Database.classes.delete(id);
      Utils.logActivity('deleted', 'class', id, `Xóa lớp ${cls ? cls.classCode : ''}`);
      this.loadData();
    };

    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: t('confirm_delete') || 'Xác nhận xoá?',
        text: 'Lớp học phần, đăng ký và điểm số liên quan sẽ bị xoá!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: t('delete') || 'Xoá',
        cancelButtonText: t('cancel') || 'Huỷ',
      }).then((result) => {
        if (result.isConfirmed) {
          doDelete();
          Swal.fire({ icon: 'success', title: 'Đã xoá!', timer: 1500, showConfirmButton: false });
        }
      });
    } else {
      Utils.showConfirm(t('confirm_delete'), () => {
        doDelete();
        Utils.toast(t('delete_class_success') || 'Đã xoá lớp học thành công!', 'success');
      });
    }
  }
};
