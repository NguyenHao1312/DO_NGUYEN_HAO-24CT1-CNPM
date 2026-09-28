// js/views/teachers.js

const TeachersView = {
  currentPage: 1,
  perPage: 10,
  searchQuery: '',
  filters: {
    department: ''
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
          <h1 class="page-title">${t('teachers_title')}</h1>
          <p class="page-subtitle">${t('teachers_subtitle')}</p>
        </div>
        <div class="page-actions">
          ${Auth.isAdmin() ? `
          <button class="btn btn-primary" id="btn-add-teacher">
            <i class="fas fa-plus"></i> ${t('add_teacher')}
          </button>
          ` : ''}
        </div>
      </div>

      <!-- Filter/Search Bar -->
      <div class="filter-bar" style="display: flex; gap: var(--space-4); margin-bottom: var(--space-4); flex-wrap: wrap;">
        <div class="search-box" style="flex: 1; min-width: 200px; position: relative;">
          <i class="fas fa-search" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-tertiary);"></i>
          <input type="text" id="search-teacher" class="form-input" placeholder="${t('search_placeholder')}" style="padding-left: 36px; width: 100%;">
        </div>
        <div class="filter-group" style="display: flex; gap: var(--space-4);">
          <select id="filter-dept-teacher" class="form-input">
            <option value="">${t('department')} (${t('all') || 'Tất cả'})</option>
            <option value="Công nghệ thông tin">${t('Công nghệ thông tin')}</option>
            <option value="Kinh tế">${t('Kinh tế')}</option>
            <option value="Ngoại ngữ">${t('Ngoại ngữ')}</option>
            <option value="Cơ khí">${t('Cơ khí')}</option>
            <option value="Y dược">${t('Y dược')}</option>
          </select>
        </div>
      </div>

      <!-- Data Table -->
      <div class="card">
        <div class="table-responsive">
          <table class="data-table" id="table-teachers" style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 1px solid var(--border-color); text-align: left;">
                <th style="padding: var(--space-3);">&nbsp;</th>
                <th style="padding: var(--space-3);">${t('teacher_id')}</th>
                <th style="padding: var(--space-3);">${t('teacher_name')}</th>
                <th style="padding: var(--space-3);">${t('email')}</th>
                <th style="padding: var(--space-3);">${t('specialization')}</th>
                <th style="padding: var(--space-3);">${t('department')}</th>
                <th style="padding: var(--space-3);">${t('position')}</th>
                ${Auth.isAdmin() ? `<th style="padding: var(--space-3); text-align: center;">${t('actions')}</th>` : ''}
              </tr>
            </thead>
            <tbody id="tbody-teachers">
              <!-- Rendered by loadData() -->
            </tbody>
          </table>
        </div>
        <div class="table-footer" style="padding: var(--space-4); display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color);">
          <div class="table-info" id="table-info-teachers" style="color: var(--text-secondary); font-size: var(--font-size-sm);"></div>
          <div class="pagination" id="pagination-teachers" style="display: flex; gap: var(--space-1);"></div>
        </div>
      </div>
    `;
  },

  attachEvents() {
    const mainContent = document.getElementById('main-content');
    
    // Delegation cho buttons
    mainContent.addEventListener('click', (e) => {
      const btnAdd = e.target.closest('#btn-add-teacher');
      const btnEdit = e.target.closest('.btn-edit-teacher');
      const btnDelete = e.target.closest('.btn-delete-teacher');
      
      if (btnAdd) this.showAddModal();
      if (btnEdit) this.showEditModal(btnEdit.dataset.id);
      if (btnDelete) this.handleDelete(btnDelete.dataset.id);
    });

    // Search with debounce
    const searchInput = document.getElementById('search-teacher');
    if (searchInput) {
      searchInput.addEventListener('input', Utils.debounce((e) => {
        this.searchQuery = e.target.value;
        this.currentPage = 1;
        this.loadData();
      }, 300));
    }

    // Filter by department
    const filterDept = document.getElementById('filter-dept-teacher');
    if (filterDept) {
      filterDept.addEventListener('change', (e) => {
        this.filters.department = e.target.value;
        this.currentPage = 1;
        this.loadData();
      });
    }
  },

  loadData() {
    let items = Database.teachers.getAll();
    
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      items = items.filter(t => 
        t.name.toLowerCase().includes(q) || 
        t.teacherId.toLowerCase().includes(q) || 
        t.email.toLowerCase().includes(q)
      );
    }
    
    if (this.filters.department) {
      items = items.filter(t => t.department === this.filters.department);
    }

    const paginated = Utils.paginate(items, this.currentPage, this.perPage);
    this.renderTable(paginated.items);
    this.renderPaginationInfo(paginated);
  },

  renderTable(items) {
    const tbody = document.getElementById('tbody-teachers');
    if (!items || items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: var(--space-6); color: var(--text-tertiary);">${t('no_data')}</td></tr>`;
      return;
    }

    tbody.innerHTML = items.map(tc => {
      const initials = Utils.getInitials ? Utils.getInitials(tc.name) : tc.name.substring(0,2).toUpperCase();
      const color = Utils.getAvatarColor ? Utils.getAvatarColor(tc.name) : 'var(--primary-500)';
      
      // Position style
      let posClass = 'badge-neutral';
      if(tc.position === 'Giáo sư') posClass = 'badge-danger';
      else if(tc.position === 'Phó Giáo sư') posClass = 'badge-warning';
      else posClass = 'badge-info';

      return `
        <tr style="border-bottom: 1px solid var(--border-color);">
          <td style="padding: var(--space-3);">
            <div class="avatar avatar-sm" style="background-color: ${color}; color: white; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-full); width: 32px; height: 32px; font-weight: bold; font-size: 12px;">
              ${initials}
            </div>
          </td>
          <td style="padding: var(--space-3); font-weight: 500;">${tc.teacherId}</td>
          <td style="padding: var(--space-3); color: var(--text-primary);">
             ${this.searchQuery ? (Utils.highlightText ? Utils.highlightText(tc.name, this.searchQuery) : tc.name) : tc.name}
          </td>
          <td style="padding: var(--space-3); color: var(--text-secondary);">${tc.email}</td>
          <td style="padding: var(--space-3);">${t(tc.specialization)}</td>
          <td style="padding: var(--space-3);">${t(tc.department)}</td>
          <td style="padding: var(--space-3);"><span class="badge ${posClass}">${t(tc.position)}</span></td>
          ${Auth.isAdmin() ? `
          <td style="padding: var(--space-3); text-align: center;">
            <div style="display: flex; gap: var(--space-2); justify-content: center;">
              <button class="btn-icon btn-edit-teacher" data-id="${tc.id}" title="${t('edit')}" style="color: var(--primary-500);"><i class="fas fa-edit"></i></button>
              <button class="btn-icon btn-delete-teacher" data-id="${tc.id}" title="${t('delete')}" style="color: var(--danger);"><i class="fas fa-trash"></i></button>
            </div>
          </td>
          ` : ''}
        </tr>
      `;
    }).join('');
  },

  renderPaginationInfo(paginated) {
    const infoContainer = document.getElementById('table-info-teachers');
    const paginationContainer = document.getElementById('pagination-teachers');
    
    if (paginated.totalItems === 0) {
      infoContainer.innerHTML = '';
      paginationContainer.innerHTML = '';
      return;
    }

    const start = (paginated.currentPage - 1) * this.perPage + 1;
    const end = Math.min(start + this.perPage - 1, paginated.totalItems);
    
    infoContainer.innerHTML = `${t('showing')} ${start}-${end} ${t('of')} ${paginated.totalItems} ${t('entries')}`;
    
    if (Utils.renderPagination) {
      Utils.renderPagination('pagination-teachers', paginated.currentPage, paginated.totalPages, (page) => {
        this.currentPage = page;
        this.loadData();
      });
    }
  },

  getFormHTML(data = {}) {
    return `
      <form id="teacher-form" class="form">
        <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); margin-bottom: var(--space-3);">
          <div class="form-group">
            <label class="form-label">${t('teacher_id')} *</label>
            <input type="text" id="form-tc-id" class="form-input" value="${data.teacherId || ''}" required>
          </div>
          <div class="form-group">
            <label class="form-label">${t('teacher_name')} *</label>
            <input type="text" id="form-tc-name" class="form-input" value="${data.name || ''}" required>
          </div>
        </div>
        
        <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); margin-bottom: var(--space-3);">
          <div class="form-group">
            <label class="form-label">${t('email')} *</label>
            <input type="email" id="form-tc-email" class="form-input" value="${data.email || ''}" required>
          </div>
          <div class="form-group">
            <label class="form-label">${t('phone')} *</label>
            <input type="tel" id="form-tc-phone" class="form-input" value="${data.phone || ''}" required>
          </div>
        </div>

        <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); margin-bottom: var(--space-3);">
          <div class="form-group">
            <label class="form-label">${t('specialization')} *</label>
            <input type="text" id="form-tc-spec" class="form-input" value="${data.specialization || ''}" required>
          </div>
          <div class="form-group">
            <label class="form-label">${t('department')} *</label>
            <select id="form-tc-dept" class="form-input" required>
              <option value="Công nghệ thông tin" ${data.department === 'Công nghệ thông tin' ? 'selected' : ''}>${t('Công nghệ thông tin')}</option>
              <option value="Kinh tế" ${data.department === 'Kinh tế' ? 'selected' : ''}>${t('Kinh tế')}</option>
              <option value="Ngoại ngữ" ${data.department === 'Ngoại ngữ' ? 'selected' : ''}>${t('Ngoại ngữ')}</option>
              <option value="Cơ khí" ${data.department === 'Cơ khí' ? 'selected' : ''}>${t('Cơ khí')}</option>
              <option value="Y dược" ${data.department === 'Y dược' ? 'selected' : ''}>${t('Y dược')}</option>
            </select>
          </div>
        </div>

        <div class="form-group" style="margin-bottom: var(--space-3);">
          <label class="form-label">${t('position')} *</label>
          <select id="form-tc-pos" class="form-input" required>
            <option value="Giảng viên" ${data.position === 'Giảng viên' ? 'selected' : ''}>${t('Giảng viên')}</option>
            <option value="Phó Giáo sư" ${data.position === 'Phó Giáo sư' ? 'selected' : ''}>${t('Phó Giáo sư')}</option>
            <option value="Giáo sư" ${data.position === 'Giáo sư' ? 'selected' : ''}>${t('Giáo sư')}</option>
          </select>
        </div>
      </form>
    `;
  },

  showAddModal() {
    const bodyHTML = this.getFormHTML();
    const footerHTML = `
      <button class="btn btn-ghost" onclick="Utils.closeModal()">${t('cancel')}</button>
      <button class="btn btn-primary" onclick="TeachersView.saveTeacher()">${t('save')}</button>
    `;
    Utils.showModal(t('add_teacher'), bodyHTML, footerHTML);
  },

  showEditModal(id) {
    const tc = Database.teachers.getById(id);
    if (!tc) return;

    const bodyHTML = this.getFormHTML(tc);
    const footerHTML = `
      <button class="btn btn-ghost" onclick="Utils.closeModal()">${t('cancel')}</button>
      <button class="btn btn-primary" onclick="TeachersView.saveTeacher('${id}')">${t('save')}</button>
    `;
    Utils.showModal(t('edit_teacher'), bodyHTML, footerHTML);
  },

  saveTeacher(id = null) {
    if (typeof Auth !== 'undefined' && !Auth.isAdmin()) {
      Utils.toast(t('error') + ': Permission denied', 'error');
      return;
    }

    const form = document.getElementById('teacher-form');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const data = {
      teacherId: document.getElementById('form-tc-id').value.trim(),
      name: document.getElementById('form-tc-name').value.trim(),
      email: document.getElementById('form-tc-email').value.trim(),
      phone: document.getElementById('form-tc-phone').value.trim(),
      specialization: document.getElementById('form-tc-spec').value.trim(),
      department: document.getElementById('form-tc-dept').value,
      position: document.getElementById('form-tc-pos').value,
    };

    try {
      if (id) {
        // Preserve existing status when editing
        Database.teachers.update(id, data);
        Utils.logActivity('updated', 'teacher', id, `Cập nhật giáo viên ${data.name}`);
        Utils.toast(t('update_teacher_success') || 'Đã điều chỉnh giáo viên thành công!', 'success');
      } else {
        data.status = 'active';
        const newItem = Database.teachers.add(data);
        Utils.logActivity('created', 'teacher', newItem.id, `Thêm giáo viên ${data.name}`);
        Utils.toast(t('add_teacher_success') || 'Đã thêm giáo viên thành công!', 'success');
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
    if (typeof Auth !== 'undefined' && !Auth.isAdmin()) {
      Utils.toast(t('error') + ': Permission denied', 'error');
      return;
    }
    const doDelete = () => {
      const tc = Database.teachers.getById(id);
      Database.teachers.delete(id);
      Utils.logActivity('deleted', 'teacher', id, `Xóa giáo viên ${tc ? tc.name : ''}`);
      const totalItems = Database.teachers.count();
      if ((this.currentPage - 1) * this.perPage >= totalItems && this.currentPage > 1) {
        this.currentPage--;
      }
      this.loadData();
    };

    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: t('confirm_delete') || 'Xác nhận xoá?',
        text: 'Giáo viên và dữ liệu liên quan sẽ bị xoá vĩnh viễn!',
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
        Utils.toast(t('delete_teacher_success') || 'Đã xoá giáo viên thành công!', 'success');
      });
    }
  }
};
