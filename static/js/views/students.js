// js/views/students.js

const StudentsView = {
  currentPage: 1,
  perPage: 10,
  searchQuery: '',
  filters: {
    department: '',
    status: ''
  },

  render() {
    const container = document.getElementById('main-content');
    container.innerHTML = this.getHTML();
    this.attachEvents();
    this.loadData();
    
    // Animation
    container.classList.add('fade-in');
    setTimeout(() => container.classList.remove('fade-in'), 300);
  },

  getHTML() {
    return `
      <div class="page-header">
        <div class="page-title-section">
          <h1 class="page-title">${t('students_title')}</h1>
          <p class="page-subtitle">${t('students_subtitle')}</p>
        </div>
        <div class="page-actions">
          ${Auth.isAdmin() ? `
          <button class="btn btn-primary" id="btn-add-student">
            <i class="fas fa-plus"></i> ${t('add_student')}
          </button>
          ` : ''}
        </div>
      </div>

      <!-- Filter/Search Bar -->
      <div class="filter-bar" style="display: flex; gap: var(--space-4); margin-bottom: var(--space-4); flex-wrap: wrap;">
        <div class="search-box" style="flex: 1; min-width: 200px; position: relative;">
          <i class="fas fa-search" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-tertiary);"></i>
          <input type="text" id="search-student" class="form-input" placeholder="${t('search_placeholder')}" style="padding-left: 36px; width: 100%;">
        </div>
        <div class="filter-group" style="display: flex; gap: var(--space-4);">
          <select id="filter-dept" class="form-input">
            <option value="">${t('department')} (${t('all') || 'Tất cả'})</option>
            <option value="Công nghệ thông tin">${t('Công nghệ thông tin')}</option>
            <option value="Kinh tế">${t('Kinh tế')}</option>
            <option value="Ngoại ngữ">${t('Ngoại ngữ')}</option>
            <option value="Cơ khí">${t('Cơ khí')}</option>
            <option value="Y dược">${t('Y dược')}</option>
          </select>
          <select id="filter-status" class="form-input">
            <option value="">${t('status')} (${t('all') || 'Tất cả'})</option>
            <option value="active">${t('active')}</option>
            <option value="inactive">${t('inactive')}</option>
            <option value="graduated">${t('graduated')}</option>
            <option value="suspended">${t('suspended')}</option>
          </select>
          <button class="btn btn-ghost" id="btn-export">
            <i class="fas fa-download"></i> ${t('export')}
          </button>
        </div>
      </div>

      <!-- Data Table -->
      <div class="card">
        <div class="table-responsive">
          <table class="data-table" id="table-students" style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 1px solid var(--border-color); text-align: left;">
                <th style="padding: var(--space-3);">&nbsp;</th>
                <th style="padding: var(--space-3);">${t('student_id')}</th>
                <th style="padding: var(--space-3);">${t('student_name')}</th>
                <th style="padding: var(--space-3);">${t('email')}</th>
                <th style="padding: var(--space-3);">${t('phone')}</th>
                <th style="padding: var(--space-3);">${t('department')}</th>
                <th style="padding: var(--space-3);">${t('status')}</th>
                ${Auth.isAdmin() ? `<th style="padding: var(--space-3); text-align: center;">${t('actions')}</th>` : ''}
              </tr>
            </thead>
            <tbody id="tbody-students">
              <!-- Rendered by loadData() -->
            </tbody>
          </table>
        </div>
        <div class="table-footer" style="padding: var(--space-4); display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color);">
          <div class="table-info" id="table-info-students" style="color: var(--text-secondary); font-size: var(--font-size-sm);"></div>
          <div class="pagination" id="pagination-students" style="display: flex; gap: var(--space-1);"></div>
        </div>
      </div>
    `;
  },

  attachEvents() {
    const mainContent = document.getElementById('main-content');
    
    // Delegation for buttons
    mainContent.addEventListener('click', (e) => {
      const btnAdd = e.target.closest('#btn-add-student');
      const btnEdit = e.target.closest('.btn-edit');
      const btnDelete = e.target.closest('.btn-delete');
      const btnView = e.target.closest('.btn-view');
      const btnExport = e.target.closest('#btn-export');
      
      if (btnAdd) this.showAddModal();
      if (btnEdit) this.showEditModal(btnEdit.dataset.id);
      if (btnDelete) this.handleDelete(btnDelete.dataset.id);
      if (btnView) this.showDetailModal(btnView.dataset.id);
      if (btnExport) this.handleExport();
    });

    // Search with debounce
    const searchInput = document.getElementById('search-student');
    if (searchInput) {
      searchInput.addEventListener('input', Utils.debounce((e) => {
        this.searchQuery = e.target.value;
        this.currentPage = 1;
        this.loadData();
      }, 300));
    }

    // Filters
    const filterDept = document.getElementById('filter-dept');
    const filterStatus = document.getElementById('filter-status');
    if (filterDept) {
      filterDept.addEventListener('change', (e) => {
        this.filters.department = e.target.value;
        this.currentPage = 1;
        this.loadData();
      });
    }
    if (filterStatus) {
      filterStatus.addEventListener('change', (e) => {
        this.filters.status = e.target.value;
        this.currentPage = 1;
        this.loadData();
      });
    }
  },

  loadData() {
    let items = Database.students.getAll();
    const user = Auth.getCurrentUser();
    
    // If teacher, only show students in their classes
    if (Auth.isTeacher() && user.linkedId) {
      const teacherObj = Database.teachers.getById(user.linkedId);
      if (teacherObj) {
        // Find classes taught by this teacher
        const allClasses = Database.classes.getAll();
        const myClasses = allClasses.filter(c => c.teacherId === teacherObj.teacherId || c.teacherId === 'ref:' + teacherObj.teacherId || c.teacherId === teacherObj.id);
        const myClassIds = myClasses.map(c => c.id);
        
        // Find grades in those classes
        const myGrades = Database.grades.getAll().filter(g => myClassIds.includes(g.classId));
        const myStudentIds = [...new Set(myGrades.map(g => g.studentId))];
        
        items = items.filter(s => myStudentIds.includes(s.id));
      }
    }
    
    // Áp dụng tìm kiếm
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      items = items.filter(s => 
        s.name.toLowerCase().includes(q) || 
        s.studentId.toLowerCase().includes(q) || 
        s.email.toLowerCase().includes(q)
      );
    }
    
    // Áp dụng bộ lọc
    if (this.filters.department) {
      items = items.filter(s => s.department === this.filters.department);
    }
    if (this.filters.status) {
      items = items.filter(s => s.status === this.filters.status);
    }

    const paginated = Utils.paginate(items, this.currentPage, this.perPage);
    this.renderTable(paginated.items);
    this.renderPaginationInfo(paginated);
  },

  renderTable(items) {
    const tbody = document.getElementById('tbody-students');
    if (!items || items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: var(--space-6); color: var(--text-tertiary);">${t('no_data')}</td></tr>`;
      return;
    }

    tbody.innerHTML = items.map(s => {
      const initials = Utils.getInitials ? Utils.getInitials(s.name) : s.name.substring(0,2).toUpperCase();
      const color = Utils.getAvatarColor ? Utils.getAvatarColor(s.name) : 'var(--primary-500)';
      const statusBadge = Utils.getStatusBadge ? Utils.getStatusBadge(s.status) : `<span class="badge badge-neutral">${t(s.status)}</span>`;
      
      return `
        <tr style="border-bottom: 1px solid var(--border-color);">
          <td style="padding: var(--space-3);">
            <div class="avatar avatar-sm" style="background-color: ${color}; color: white; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-full); width: 32px; height: 32px; font-weight: bold; font-size: 12px;">
              ${initials}
            </div>
          </td>
          <td style="padding: var(--space-3); font-weight: 500;">${s.studentId}</td>
          <td style="padding: var(--space-3); cursor: pointer; color: var(--primary-600);" class="btn-view" data-id="${s.id}">
             ${this.searchQuery ? (Utils.highlightText ? Utils.highlightText(s.name, this.searchQuery) : s.name) : s.name}
          </td>
          <td style="padding: var(--space-3); color: var(--text-secondary);">${s.email}</td>
          <td style="padding: var(--space-3); color: var(--text-secondary);">${s.phone}</td>
          <td style="padding: var(--space-3);">${t(s.department)}</td>
          <td style="padding: var(--space-3);">${statusBadge}</td>
          ${Auth.isAdmin() ? `
          <td style="padding: var(--space-3); text-align: center;">
            <div style="display: flex; gap: var(--space-2); justify-content: center;">
              <button class="btn-icon btn-edit" data-id="${s.id}" title="${t('edit')}" style="color: var(--primary-500);"><i class="fas fa-edit"></i></button>
              <button class="btn-icon btn-delete" data-id="${s.id}" title="${t('delete')}" style="color: var(--danger);"><i class="fas fa-trash"></i></button>
            </div>
          </td>
          ` : ''}
        </tr>
      `;
    }).join('');
  },

  renderPaginationInfo(paginated) {
    const infoContainer = document.getElementById('table-info-students');
    const paginationContainer = document.getElementById('pagination-students');
    
    if (paginated.totalItems === 0) {
      infoContainer.innerHTML = '';
      paginationContainer.innerHTML = '';
      return;
    }

    const start = (paginated.currentPage - 1) * this.perPage + 1;
    const end = Math.min(start + this.perPage - 1, paginated.totalItems);
    
    infoContainer.innerHTML = `${t('showing')} ${start}-${end} ${t('of')} ${paginated.totalItems} ${t('entries')}`;
    
    if (Utils.renderPagination) {
      Utils.renderPagination('pagination-students', paginated.currentPage, paginated.totalPages, (page) => {
        this.currentPage = page;
        this.loadData();
      });
    }
  },

  getFormHTML(data = {}) {
    return `
      <form id="student-form" class="form">
        <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); margin-bottom: var(--space-3);">
          <div class="form-group">
            <label class="form-label">${t('student_id')} *</label>
            <input type="text" id="form-studentId" class="form-input" value="${data.studentId || ''}" required>
          </div>
          <div class="form-group">
            <label class="form-label">${t('student_name')} *</label>
            <input type="text" id="form-name" class="form-input" value="${data.name || ''}" required>
          </div>
        </div>
        
        <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); margin-bottom: var(--space-3);">
          <div class="form-group">
            <label class="form-label">${t('email')} *</label>
            <input type="email" id="form-email" class="form-input" value="${data.email || ''}" required>
          </div>
          <div class="form-group">
            <label class="form-label">${t('phone')} *</label>
            <input type="tel" id="form-phone" class="form-input" value="${data.phone || ''}" required>
          </div>
        </div>

        <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); margin-bottom: var(--space-3);">
          <div class="form-group">
            <label class="form-label">${t('dob')} *</label>
            <input type="date" id="form-dob" class="form-input" value="${data.dob || ''}" required>
          </div>
          <div class="form-group">
            <label class="form-label">${t('gender')} *</label>
            <select id="form-gender" class="form-input" required>
              <option value="male" ${data.gender === 'male' ? 'selected' : ''}>${t('male')}</option>
              <option value="female" ${data.gender === 'female' ? 'selected' : ''}>${t('female')}</option>
            </select>
          </div>
        </div>

        <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); margin-bottom: var(--space-3);">
          <div class="form-group">
            <label class="form-label">${t('department')} *</label>
            <select id="form-department" class="form-input" required>
              <option value="Công nghệ thông tin" ${data.department === 'Công nghệ thông tin' ? 'selected' : ''}>${t('Công nghệ thông tin')}</option>
              <option value="Kinh tế" ${data.department === 'Kinh tế' ? 'selected' : ''}>${t('Kinh tế')}</option>
              <option value="Ngoại ngữ" ${data.department === 'Ngoại ngữ' ? 'selected' : ''}>${t('Ngoại ngữ')}</option>
              <option value="Cơ khí" ${data.department === 'Cơ khí' ? 'selected' : ''}>${t('Cơ khí')}</option>
              <option value="Y dược" ${data.department === 'Y dược' ? 'selected' : ''}>${t('Y dược')}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">${t('status')} *</label>
            <select id="form-status" class="form-input" required>
              <option value="active" ${data.status === 'active' ? 'selected' : ''}>${t('active')}</option>
              <option value="inactive" ${data.status === 'inactive' ? 'selected' : ''}>${t('inactive')}</option>
              <option value="graduated" ${data.status === 'graduated' ? 'selected' : ''}>${t('graduated')}</option>
              <option value="suspended" ${data.status === 'suspended' ? 'selected' : ''}>${t('suspended')}</option>
            </select>
          </div>
        </div>
        
        <div class="form-group" style="margin-bottom: var(--space-3);">
          <label class="form-label">${t('address')}</label>
          <textarea id="form-address" class="form-input" rows="3">${data.address || ''}</textarea>
        </div>
      </form>
    `;
  },

  showAddModal() {
    const bodyHTML = this.getFormHTML();
    const footerHTML = `
      <button class="btn btn-ghost" onclick="Utils.closeModal()">${t('cancel')}</button>
      <button class="btn btn-primary" onclick="StudentsView.saveStudent()">${t('save')}</button>
    `;
    Utils.showModal(t('add_student'), bodyHTML, footerHTML);
  },

  showEditModal(id) {
    const student = Database.students.getById(id);
    if (!student) return;

    const bodyHTML = this.getFormHTML(student);
    const footerHTML = `
      <button class="btn btn-ghost" onclick="Utils.closeModal()">${t('cancel')}</button>
      <button class="btn btn-primary" onclick="StudentsView.saveStudent('${id}')">${t('save')}</button>
    `;
    Utils.showModal(t('edit_student'), bodyHTML, footerHTML);
  },

  saveStudent(id = null) {
    if (typeof Auth !== 'undefined' && !Auth.isAdmin()) {
      Utils.toast(t('error') + ': Permission denied', 'error');
      return;
    }

    // Validate form
    const form = document.getElementById('student-form');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const data = {
      studentId: document.getElementById('form-studentId').value.trim(),
      name: document.getElementById('form-name').value.trim(),
      email: document.getElementById('form-email').value.trim(),
      phone: document.getElementById('form-phone').value.trim(),
      dob: document.getElementById('form-dob').value,
      gender: document.getElementById('form-gender').value,
      department: document.getElementById('form-department').value,
      status: document.getElementById('form-status').value,
      address: document.getElementById('form-address').value.trim(),
    };

    if (!Utils.validateEmail(data.email)) {
      Utils.toast(t('error') + ': Email format is invalid', 'error');
      return;
    }

    try {
      if (id) {
        Database.students.update(id, data);
        Utils.logActivity('updated', 'student', id, `Cập nhật sinh viên ${data.name}`);
        Utils.toast(t('update_student_success') || 'Đã điều chỉnh sinh viên thành công!', 'success');
      } else {
        const newItem = Database.students.add(data);
        Utils.logActivity('created', 'student', newItem.id, `Thêm sinh viên ${data.name}`);
        Utils.toast(t('add_student_success') || 'Đã thêm sinh viên thành công!', 'success');
      }
      Utils.closeModal();
      this.loadData();
      
      // Auto-reload as requested
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (error) {
      Utils.toast(t('error') + ': ' + error.message, 'error');
    }
  },

  handleDelete(id) {
    if (typeof Auth !== 'undefined' && !Auth.isAdmin()) {
      Utils.toast(t('error') + ': Permission denied', 'error');
      return;
    }
    const doDelete = () => {
      const s = Database.students.getById(id);
      Database.students.delete(id);
      Utils.logActivity('deleted', 'student', id, `Xóa sinh viên ${s ? s.name : ''}`);
      
      const totalItems = Database.students.count();
      if ((this.currentPage - 1) * this.perPage >= totalItems && this.currentPage > 1) {
        this.currentPage--;
      }
      this.loadData();
    };

    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: t('confirm_delete') || 'Xác nhận xoá?',
        text: 'Sinh viên và toàn bộ điểm số liên quan sẽ bị xoá vĩnh viễn!',
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
        Utils.toast(t('delete_student_success') || 'Đã xoá sinh viên thành công!', 'success');
      });
    }
  },

  showDetailModal(id) {
    const s = Database.students.getById(id);
    if (!s) return;

    const initials = Utils.getInitials ? Utils.getInitials(s.name) : s.name.substring(0,2).toUpperCase();
    const color = Utils.getAvatarColor ? Utils.getAvatarColor(s.name) : 'var(--primary-500)';
    const statusBadge = Utils.getStatusBadge ? Utils.getStatusBadge(s.status) : `<span class="badge badge-neutral">${t(s.status)}</span>`;

    // Fetch grades and permissions
    const grades = Database.grades.getAll().filter(g => g.studentId === id);
    const classes = Database.classes.getAll();
    const user = Auth.getCurrentUser();
    const isTeacher = user && user.role === 'teacher';
    const isAdmin = Auth.isAdmin();

    let teacherClassIds = [];
    if (isTeacher) {
      const teacherObj = Database.teachers.getAll().find(t => t.id === user.linkedId || t.teacherId === user.linkedId);
      if (teacherObj) {
        teacherClassIds = classes.filter(c => c.teacherId === teacherObj.id || c.teacherId === teacherObj.teacherId || c.teacherId === 'ref:' + teacherObj.teacherId).map(c => c.id);
      }
    }

    const bodyHTML = `
      <div style="display: flex; gap: var(--space-4); margin-bottom: var(--space-4); align-items: center;">
        <div class="avatar avatar-lg" style="background-color: ${color}; color: white; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-full); width: 64px; height: 64px; font-weight: bold; font-size: 24px;">
          ${initials}
        </div>
        <div>
          <h2 style="margin: 0; font-size: var(--font-size-xl); color: var(--text-primary);">${s.name}</h2>
          <p style="margin: 4px 0 0 0; color: var(--text-secondary);">${s.studentId} • ${s.department}</p>
        </div>
      </div>
      
      <div class="grid-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4);">
        <div>
          <p><strong>${t('email')}:</strong> ${s.email}</p>
          <p><strong>${t('phone')}:</strong> ${s.phone}</p>
          <p><strong>${t('dob')}:</strong> ${Utils.formatDate ? Utils.formatDate(s.dob) : s.dob}</p>
        </div>
        <div>
          <p><strong>${t('gender')}:</strong> ${s.gender === 'male' ? t('male') : t('female')}</p>
          <p><strong>${t('status')}:</strong> ${statusBadge}</p>
          <p><strong>${t('address')}:</strong> ${s.address || '-'}</p>
        </div>
      </div>

      <h3 style="margin-top: var(--space-6); margin-bottom: var(--space-3); font-size: 1.1rem; color: var(--text-primary); border-top: 1px solid var(--border-color); padding-top: var(--space-4);">${t('academic_results')}</h3>
      <div style="max-height: 250px; overflow-y: auto; background: var(--bg-secondary); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
        <table class="table" style="width: 100%; font-size: 0.9rem; margin: 0;">
          <thead style="position: sticky; top: 0; background: var(--bg-tertiary); z-index: 1;">
            <tr>
              <th style="padding: 10px;">${t('subject')}</th>
              <th style="padding: 10px; text-align: center;">${t('assignment_grade')}</th>
              <th style="padding: 10px; text-align: center;">${t('midterm_grade')}</th>
              <th style="padding: 10px; text-align: center;">${t('final_grade')}</th>
              <th style="padding: 10px; text-align: right;">${t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            ${grades.map(g => {
              const cls = classes.find(c => c.id === g.classId);
              const clsName = cls ? t(cls.name) : t('unknown');
              const canEdit = isAdmin || (isTeacher && teacherClassIds.includes(g.classId));
              return `
                <tr id="grade-row-\${g.id}" style="border-bottom: 1px solid var(--border-color);">
                  <td style="padding: 10px; font-weight: 500;">\${clsName}</td>
                  <td style="padding: 10px; text-align: center;"><span id="val-ass-\${g.id}">\${g.assignment || '-'}</span><input type="number" id="inp-ass-\${g.id}" class="form-input" style="display:none; width: 60px; padding: 4px; text-align: center;" value="\${g.assignment || ''}" min="0" max="10" step="0.1"></td>
                  <td style="padding: 10px; text-align: center;"><span id="val-mid-\${g.id}">\${g.midterm || '-'}</span><input type="number" id="inp-mid-\${g.id}" class="form-input" style="display:none; width: 60px; padding: 4px; text-align: center;" value="\${g.midterm || ''}" min="0" max="10" step="0.1"></td>
                  <td style="padding: 10px; text-align: center;"><span id="val-fin-\${g.id}">\${g.final || '-'}</span><input type="number" id="inp-fin-\${g.id}" class="form-input" style="display:none; width: 60px; padding: 4px; text-align: center;" value="\${g.final || ''}" min="0" max="10" step="0.1"></td>
                  <td style="padding: 10px; text-align: right;">
                    \${canEdit ? \`
                      <button id="btn-edit-\${g.id}" class="btn btn-sm btn-ghost" onclick="StudentsView.toggleEditGrade('\${g.id}')" style="color: var(--primary-500);"><i class="fas fa-edit"></i></button>
                      <button id="btn-save-\${g.id}" class="btn btn-sm btn-primary" onclick="StudentsView.saveGrade('\${g.id}', '\${s.name}', '\${clsName}')" style="display:none;"><i class="fas fa-save"></i></button>
                    \` : ''}
                  </td>
                </tr>
              `;
            }).join('')}
            ${grades.length === 0 ? `<tr><td colspan="5" style="text-align: center; padding: 16px; color: var(--text-tertiary);">${t('no_grades_data')}</td></tr>` : ''}
          </tbody>
        </table>
      </div>
    `;

    const footerHTML = `
      <button class="btn btn-ghost" onclick="Utils.closeModal()">${t('close')}</button>
      ${isAdmin ? `<button class="btn btn-primary" onclick="Utils.closeModal(); StudentsView.showEditModal('${id}')">${t('edit_info')}</button>` : ''}
    `;

    Utils.showModal(t('view_detail'), bodyHTML, footerHTML);
  },

  toggleEditGrade(gradeId) {
    const isEditing = document.getElementById(`btn-save-${gradeId}`).style.display !== 'none';
    if (isEditing) {
      // Cancel edit
      ['ass', 'mid', 'fin'].forEach(f => {
        document.getElementById(`val-${f}-${gradeId}`).style.display = 'inline';
        document.getElementById(`inp-${f}-${gradeId}`).style.display = 'none';
      });
      document.getElementById(`btn-edit-${gradeId}`).style.display = 'inline-block';
      document.getElementById(`btn-save-${gradeId}`).style.display = 'none';
    } else {
      // Start edit
      ['ass', 'mid', 'fin'].forEach(f => {
        document.getElementById(`val-${f}-${gradeId}`).style.display = 'none';
        document.getElementById(`inp-${f}-${gradeId}`).style.display = 'inline-block';
      });
      document.getElementById(`btn-edit-${gradeId}`).style.display = 'none';
      document.getElementById(`btn-save-${gradeId}`).style.display = 'inline-block';
    }
  },

  saveGrade(gradeId, studentName, className) {
    const grade = Database.grades.getById(gradeId);
    if (!grade) return;
    
    const ass = parseFloat(document.getElementById(`inp-ass-${gradeId}`).value);
    const mid = parseFloat(document.getElementById(`inp-mid-${gradeId}`).value);
    const fin = parseFloat(document.getElementById(`inp-fin-${gradeId}`).value);
    
    // Validation
    if ((ass && (ass < 0 || ass > 10)) || (mid && (mid < 0 || mid > 10)) || (fin && (fin < 0 || fin > 10))) {
       Utils.toast(t('grade_range_error') || 'Điểm số phải từ 0 đến 10', 'error');
       return;
    }

    const updatedData = {
      ...grade,
      assignment: isNaN(ass) ? grade.assignment : ass,
      midterm: isNaN(mid) ? grade.midterm : mid,
      final: isNaN(fin) ? grade.final : fin
    };

    try {
      Database.grades.update(gradeId, updatedData);
      const user = Auth.getCurrentUser();
      const roleName = user.role === 'admin' ? 'Admin' : 'Giáo viên';
      Utils.logActivity('updated', 'grade', gradeId, `${roleName} đã cập nhật điểm môn ${className} của sinh viên ${studentName}`);
      Utils.toast(t('update_grade_success') || 'Cập nhật điểm thành công', 'success');
      
      // Update UI
      ['ass', 'mid', 'fin'].forEach(f => {
        const val = updatedData[f === 'ass' ? 'assignment' : f === 'mid' ? 'midterm' : 'final'];
        document.getElementById(`val-${f}-${gradeId}`).textContent = val !== undefined ? val : '-';
        document.getElementById(`inp-${f}-${gradeId}`).value = val !== undefined ? val : '';
      });
      
      this.toggleEditGrade(gradeId);
    } catch (e) {
      Utils.toast('Lỗi cập nhật: ' + e.message, 'error');
    }
  },

  handleExport() {
    const items = Database.students.getAll();
    if(Utils.downloadJSON) {
      Utils.downloadJSON(items, 'students_export.json');
      Utils.logActivity('exported', 'student', '', 'Xuất dữ liệu sinh viên');
      Utils.toast(t('success'), 'success');
    }
  }
};
