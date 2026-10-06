// Hỗ trợ (Helpdesk View)
const HelpdeskView = {
  currentPage: 1,
  perPage: 10,
  searchQuery: '',
  filters: {
    status: '',
    severity: '',
    category: ''
  },

  render() {
    const container = document.getElementById('main-content');
    container.innerHTML = this.getHTML();
    this.attachEvents();
    this.loadData();
    this.renderSummary();
  },

  getHTML() {
    return `
      <div class="page-header">
        <div class="page-title-section">
          <h1 class="page-title">${t('helpdesk_title')}</h1>
          <p class="page-subtitle">${t('helpdesk_subtitle')}</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" id="btn-add-ticket">
            <i class="fas fa-plus"></i> ${t('add_ticket')}
          </button>
        </div>
      </div>

      <!-- Status Cards -->
      <div id="helpdesk-summary" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-4); margin-bottom: var(--space-6);">
        <!-- Rendered by renderSummary() -->
      </div>

      <!-- Filter Bar -->
      <div class="filter-bar" style="display: flex; justify-content: space-between; align-items: center; gap: var(--space-4); flex-wrap: wrap; margin-bottom: var(--space-6);">
        <div class="search-box" style="flex: 1; min-width: 250px; position: relative;">
          <i class="fas fa-search" style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--text-tertiary);"></i>
          <input type="text" id="search-ticket" class="form-input" placeholder="${t('search_placeholder')}" style="padding-left: 2.5rem; width: 100%;">
        </div>
        <div class="filter-group" style="display: flex; gap: var(--space-2); flex-wrap: wrap;">
          <select id="filter-status" class="form-input" style="width: auto; min-width: 150px;">
            <option value="">${t('-- Trạng thái --')}</option>
            <option value="new">${t('new_ticket')}</option>
            <option value="in-progress">${t('in_progress')}</option>
            <option value="resolved">${t('resolved')}</option>
            <option value="closed">${t('closed')}</option>
          </select>
          <select id="filter-severity" class="form-input" style="width: auto; min-width: 150px;">
            <option value="">${t('-- Mức độ --')}</option>
            <option value="low">${t('low')}</option>
            <option value="medium">${t('medium')}</option>
            <option value="high">${t('high')}</option>
            <option value="critical">${t('critical')}</option>
          </select>
          <select id="filter-category" class="form-input" style="width: auto; min-width: 150px;">
            <option value="">${t('-- Danh mục --')}</option>
            <option value="ui">${t('UI/Giao diện')}</option>
            <option value="data">${t('Dữ liệu')}</option>
            <option value="performance">${t('Hiệu suất')}</option>
            <option value="feature">${t('Tính năng')}</option>
            <option value="account">${t('Tài khoản')}</option>
            <option value="other">${t('Khác')}</option>
          </select>
        </div>
      </div>

      <!-- Tickets List -->
      <div class="card p-0 bg-transparent shadow-none" style="background: transparent; box-shadow: none;">
        <div class="flex flex-col gap-4" id="tickets-list">
          <!-- Rendered by loadData() -->
        </div>
        
        <div class="mt-4 p-4 bg-bg-secondary rounded-lg border border-border-color flex justify-between items-center">
          <div class="table-info" id="table-info-tickets"></div>
          <div class="pagination" id="pagination-tickets"></div>
        </div>
      </div>
    `;
  },

  getAllowedBugs() {
    let items = Database.bugs.getAll();
    if (!Auth.isAdmin()) {
       const user = Auth.getCurrentUser();
       // Filter by reporter (name matching for now)
       items = items.filter(b => b.reporter === user.name);
    }
    return items;
  },

  renderSummary() {
    const container = document.getElementById('helpdesk-summary');
    if (!container) return;

    if (!Auth.isAdmin()) {
      container.style.display = 'none';
      return;
    } else {
      container.style.display = 'grid'; // Restore grid display for Admin
    }

    const bugs = this.getAllowedBugs();
    const counts = {
      new: bugs.filter(b => b.status === 'new').length,
      inProgress: bugs.filter(b => b.status === 'in-progress').length,
      resolved: bugs.filter(b => b.status === 'resolved').length,
      closed: bugs.filter(b => b.status === 'closed').length,
    };

    container.innerHTML = `
      <div class="card cursor-pointer" style="display: flex; align-items: center; gap: var(--space-4); padding: var(--space-4); transition: transform 0.2s; border-left: 4px solid var(--info);" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'" onclick="document.getElementById('filter-status').value='new'; document.getElementById('filter-status').dispatchEvent(new Event('change'))">
        <div style="width: 48px; height: 48px; display: flex; justify-content: center; align-items: center; border-radius: 50%; font-size: 1.5rem; background: var(--info-100); color: var(--info-600);">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5v-3h3.56c.69 1.19 1.97 2 3.45 2s2.75-.81 3.45-2H19v3zm0-5h-4.99c0 1.1-.9 2-2 2s-2-.9-2-2H5V5h14v9z" opacity="0.3"/><path d="M12 15c1.1 0 2-.9 2-2H10c0 1.1.9 2 2 2z"/></svg>
        </div>
        <div>
          <div style="color: var(--text-secondary); font-size: var(--font-size-sm);">${t('new_ticket')}</div>
          <div style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary); line-height: 1;">${counts.new}</div>
        </div>
      </div>
      <div class="card cursor-pointer" style="display: flex; align-items: center; gap: var(--space-4); padding: var(--space-4); transition: transform 0.2s; border-left: 4px solid var(--warning);" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'" onclick="document.getElementById('filter-status').value='in-progress'; document.getElementById('filter-status').dispatchEvent(new Event('change'))">
        <div style="width: 48px; height: 48px; display: flex; justify-content: center; align-items: center; border-radius: 50%; font-size: 1.5rem; background: var(--warning-100); color: var(--warning-600);">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>
        </div>
        <div>
          <div style="color: var(--text-secondary); font-size: var(--font-size-sm);">${t('in_progress')}</div>
          <div style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary); line-height: 1;">${counts.inProgress}</div>
        </div>
      </div>
      <div class="card cursor-pointer" style="display: flex; align-items: center; gap: var(--space-4); padding: var(--space-4); transition: transform 0.2s; border-left: 4px solid var(--success);" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'" onclick="document.getElementById('filter-status').value='resolved'; document.getElementById('filter-status').dispatchEvent(new Event('change'))">
        <div style="width: 48px; height: 48px; display: flex; justify-content: center; align-items: center; border-radius: 50%; font-size: 1.5rem; background: var(--success-100); color: var(--success-600);">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
        </div>
        <div>
          <div style="color: var(--text-secondary); font-size: var(--font-size-sm);">${t('resolved')}</div>
          <div style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary); line-height: 1;">${counts.resolved}</div>
        </div>
      </div>
      <div class="card cursor-pointer" style="display: flex; align-items: center; gap: var(--space-4); padding: var(--space-4); transition: transform 0.2s; border-left: 4px solid var(--text-tertiary);" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'" onclick="document.getElementById('filter-status').value='closed'; document.getElementById('filter-status').dispatchEvent(new Event('change'))">
        <div style="width: 48px; height: 48px; display: flex; justify-content: center; align-items: center; border-radius: 50%; font-size: 1.5rem; background: var(--bg-tertiary); color: var(--text-tertiary);">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM6.24 5h11.52l.83 1H5.42l.82-1zM5 19V8h14v11H5zm8-5.5l5-5-1.41-1.41L13 10.67V6h-2v4.67L7.41 7.09 6 8.5l5 5z"/></svg>
        </div>
        <div>
          <div style="color: var(--text-secondary); font-size: var(--font-size-sm);">${t('closed')}</div>
          <div style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary); line-height: 1;">${counts.closed}</div>
        </div>
      </div>
    `;
  },

  attachEvents() {
    const mainContent = document.getElementById('main-content');
    
    mainContent.addEventListener('click', (e) => {
      if (e.target.closest('#btn-add-ticket')) {
        this.showAddModal();
      }
      
      const btnDeleteTicket = e.target.closest('.btn-delete-ticket');
      if (btnDeleteTicket) {
        this.handleDeleteTicket(btnDeleteTicket.dataset.id);
        return;
      }
      
      const ticketCard = e.target.closest('.ticket-card');
      if (ticketCard && !e.target.closest('.no-expand')) {
        this.showTicketDetail(ticketCard.dataset.id);
      }
    });

    // Search
    const searchInput = document.getElementById('search-ticket');
    if (searchInput) {
      searchInput.addEventListener('input', Utils.debounce((e) => {
        this.searchQuery = e.target.value.toLowerCase();
        this.currentPage = 1;
        this.loadData();
      }, 300));
    }

    // Filters
    ['status', 'severity', 'category'].forEach(f => {
      const el = document.getElementById(`filter-${f}`);
      if (el) {
        el.addEventListener('change', (e) => {
          this.filters[f] = e.target.value;
          this.currentPage = 1;
          this.loadData();
        });
      }
    });
  },

  loadData() {
    let items = this.getAllowedBugs();

    if (this.searchQuery) {
      items = items.filter(b => 
        b.title.toLowerCase().includes(this.searchQuery) || 
        b.ticketId.toLowerCase().includes(this.searchQuery) ||
        b.reporter.toLowerCase().includes(this.searchQuery)
      );
    }

    if (this.filters.status) items = items.filter(b => b.status === this.filters.status);
    if (this.filters.severity) items = items.filter(b => b.severity === this.filters.severity);
    if (this.filters.category) items = items.filter(b => b.category === this.filters.category);

    // Sort newest first
    items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const paginated = Utils.paginate(items, this.currentPage, this.perPage);
    this.renderTicketsList(paginated.items);
    
    const infoContainer = document.getElementById('table-info-tickets');
    if (infoContainer) {
      const start = (paginated.currentPage - 1) * this.perPage + 1;
      const end = Math.min(start + this.perPage - 1, paginated.totalItems);
      infoContainer.innerHTML = `${t('showing')} ${paginated.totalItems === 0 ? 0 : start}-${end} ${t('of')} ${paginated.totalItems} ${t('entries')}`;
    }

    Utils.renderPagination('pagination-tickets', paginated.currentPage, paginated.totalPages, (page) => {
      this.currentPage = page;
      this.loadData();
    });
  },

  renderTicketsList(items) {
    const container = document.getElementById('tickets-list');
    if (!container) return;

    if (items.length === 0) {
      container.innerHTML = `<div class="card text-center py-8 text-text-secondary">${t('no_data')}</div>`;
      return;
    }

    const user = Auth.getCurrentUser();
    const isAdmin = user?.role === 'admin';

    container.innerHTML = items.map(b => {
      const sevBadge = Utils.getSeverityBadge(b.severity);
      const statBadge = Utils.getStatusBadge(b.status);
      const timeStr = Utils.timeAgo(b.createdAt);

      // Only ticket owner or admin can delete
      const canDelete = isAdmin || (user && b.reporter === user.name) || (user && String(b.reporterId) === String(user.id));

      const borderColor = b.status === 'new' ? 'var(--info)'
        : b.status === 'in-progress' ? 'var(--warning)'
        : b.status === 'resolved' ? 'var(--success)'
        : '#94a3b8';

      return `
        <div class="card ticket-card cursor-pointer" data-id="${b.id}" style="
          padding: 1rem 1rem 1rem 1.25rem;
          margin-bottom: 0.75rem;
          border-left: 4px solid ${borderColor};
          position: relative;
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        "
        onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 6px 20px rgba(0,0,0,0.1)'"
        onmouseout="this.style.transform='none';this.style.boxShadow=''">

          ${canDelete ? `
          <button
            class="btn-delete-ticket no-expand"
            data-id="${b.id}"
            title="Xóa phiếu này"
            style="
              position: absolute;
              top: 10px;
              right: 10px;
              width: 30px;
              height: 30px;
              border-radius: 8px;
              border: 1.5px solid rgba(239,68,68,0.25);
              background: rgba(239,68,68,0.07);
              color: #ef4444;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              z-index: 3;
              transition: background 0.18s, transform 0.18s, box-shadow 0.18s;
            "
            onmouseover="this.style.background='rgba(239,68,68,0.18)';this.style.transform='scale(1.12)';this.style.boxShadow='0 3px 10px rgba(239,68,68,0.25)'"
            onmouseout="this.style.background='rgba(239,68,68,0.07)';this.style.transform='scale(1)';this.style.boxShadow=''"
          >
            <svg class="no-expand" viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
              <path class="no-expand" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM8.46 11.88l1.41-1.41L12 12.59l2.12-2.12 1.41 1.41L13.41 14l2.12 2.12-1.41 1.41L12 15.41l-2.12 2.12-1.41-1.41L10.59 14l-2.13-2.12zM15.5 4l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </button>
          ` : ''}

          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; padding-right: ${canDelete ? '44px' : '8px'};">
            <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
              <span style="font-weight: 700; color: var(--primary-600); font-size: var(--font-size-sm);">${b.ticketId}</span>
              <h3 style="font-weight: 600; font-size: 1rem; margin: 0;">${b.title}</h3>
            </div>
          </div>

          <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
            ${sevBadge}
            ${statBadge}
          </div>

          <p style="color: var(--text-secondary); font-size: var(--font-size-sm); margin-bottom: 0.75rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
            ${b.description}
          </p>

          <div style="display: flex; justify-content: space-between; align-items: center; font-size: var(--font-size-xs); color: var(--text-tertiary);">
            <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
              <span style="display: flex; align-items: center; gap: 0.25rem;"><i class="fas fa-user"></i> ${b.reporter}</span>
              <span style="display: flex; align-items: center; gap: 0.25rem;"><i class="fas fa-tag"></i> ${b.category.toUpperCase()}</span>
              <span style="display: flex; align-items: center; gap: 0.25rem;"><i class="fas fa-clock"></i> ${timeStr}</span>
            </div>
            <div style="display: flex; gap: 0.25rem; align-items: center; font-weight: 500;">
              <i class="fas fa-comment-alt"></i> ${b.replies?.length || 0} ${t('reply')}
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  showAddModal() {
    const user = Auth.getCurrentUser();
    
    const html = `
      <form id="ticket-form">
        <div class="form-group">
          <label class="form-label">${t('title')} <span class="text-danger">*</span></label>
          <input type="text" id="ticket-title" class="form-input" required>
        </div>
        
        <div class="form-group">
          <label class="form-label">${t('description')} <span class="text-danger">*</span></label>
          <textarea id="ticket-desc" class="form-input" rows="4" required></textarea>
        </div>

        <div class="form-row flex gap-4">
          <div class="form-group flex-1">
            <label class="form-label">${t('severity')}</label>
            <select id="ticket-severity" class="form-input">
              <option value="low">${t('low')}</option>
              <option value="medium" selected>${t('medium')}</option>
              <option value="high">${t('high')}</option>
              <option value="critical">${t('critical')}</option>
            </select>
          </div>
          <div class="form-group flex-1">
            <label class="form-label">${t('category')}</label>
            <select id="ticket-category" class="form-input">
              <option value="ui">${t('UI/Giao diện')}</option>
              <option value="data">${t('Dữ liệu')}</option>
              <option value="performance">${t('Hiệu suất')}</option>
              <option value="feature" selected>${t('Tính năng')}</option>
              <option value="account">${t('Tài khoản')}</option>
              <option value="other">${t('Khác')}</option>
            </select>
          </div>
        </div>
        
        <!-- Only Admin can change reporter name arbitrarily, others are locked to their own name -->
        <div class="form-group" ${!Auth.isAdmin() ? 'style="display:none;"' : ''}>
          <label class="form-label">${t('reporter')} <span class="text-danger">*</span></label>
          <input type="text" id="ticket-reporter" class="form-input" value="${user.name}" required>
        </div>

        <div class="form-group">
          <label class="form-label">Tệp đính kèm (Tối đa 10MB)</label>
          <input type="file" id="ticket-attachment" class="form-input" accept="image/*,.pdf,.doc,.docx,.zip">
        </div>
      </form>
    `;

    Utils.showModal(
      t('add_ticket'),
      html,
      `<button class="btn btn-ghost" onclick="Utils.closeModal()">${t('cancel')}</button>
       <button class="btn btn-primary" id="btn-save-ticket">${t('save')}</button>`
    );

    document.getElementById('btn-save-ticket').addEventListener('click', () => {
      const form = document.getElementById('ticket-form');
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const reporterName = Auth.isAdmin() ? document.getElementById('ticket-reporter').value : user.name;
      const fileInput = document.getElementById('ticket-attachment');
      const file = fileInput.files.length > 0 ? fileInput.files[0] : null;

      if (file && file.size > 10 * 1024 * 1024) { // 10MB Limit
        Utils.toast('Kích thước tệp đính kèm vượt quá giới hạn 10MB.', 'error');
        return;
      }

      const saveTicket = (attachmentData) => {
        const ticket = {
          ticketId: 'TKT-' + Math.floor(1000 + Math.random() * 9000),
          title: document.getElementById('ticket-title').value,
          description: document.getElementById('ticket-desc').value,
          severity: document.getElementById('ticket-severity').value,
          category: document.getElementById('ticket-category').value,
          reporter: reporterName,
          status: 'new',
          replies: [],
          attachment: attachmentData
        };

        Database.bugs.add(ticket);
        Utils.toast(t('success'), 'success');
        Utils.closeModal();
        this.loadData();
        this.renderSummary();
        
        // Notify Admin if it wasn't created by admin
        if (!Auth.isAdmin()) {
          Database.notifications.add('all', t('new_ticket_noti_title'), t('new_ticket_noti_body').replace('{name}', reporterName).replace('{title}', ticket.title), 'warning');
        }
      };

      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          saveTicket({
            name: file.name,
            type: file.type,
            data: e.target.result
          });
        };
        reader.readAsDataURL(file);
      } else {
        saveTicket(null);
      }
    });
  },

  showTicketDetail(id) {
    const ticket = Database.bugs.getById(id);
    if (!ticket) return;

    const repliesHtml = (ticket.replies || []).map(r => `
      <div class="mb-3 p-3 bg-bg-primary rounded border border-border-color">
        <div class="flex justify-between text-xs mb-1">
          <strong class="${r.author === 'Admin' || r.author === 'Administrator' ? 'text-primary-600' : 'text-text-primary'}">${r.author}</strong>
          <span class="text-text-tertiary">${Utils.formatDateTime(r.timestamp)}</span>
        </div>
        <div class="text-sm text-text-secondary whitespace-pre-line">${r.message}</div>
      </div>
    `).join('');

    const isAdmin = Auth.isAdmin();

    const html = `
      <div class="ticket-detail">
        <div class="flex justify-between mb-4 pb-3 border-b border-border-color">
          <div>
            <h2 class="text-xl font-bold mb-1">${ticket.ticketId}: ${ticket.title}</h2>
            <div class="text-sm text-text-tertiary">
              Reported by <strong>${ticket.reporter}</strong> on ${Utils.formatDateTime(ticket.createdAt)}
            </div>
          </div>
          <div class="flex flex-col gap-2 items-end">
            ${Utils.getSeverityBadge(ticket.severity)}
            ${Utils.getStatusBadge(ticket.status)}
          </div>
        </div>

        <div class="mb-6 p-4 bg-bg-tertiary rounded-lg whitespace-pre-line text-sm border border-border-color">
          ${ticket.description}
        </div>

        ${ticket.attachment ? `
        <div class="mb-6 p-3 bg-bg-secondary rounded border border-border-color flex items-center justify-between">
          <div class="flex items-center gap-2">
            <i class="fas fa-paperclip text-text-tertiary"></i>
            <span class="text-sm font-medium">${ticket.attachment.name}</span>
          </div>
          <a href="${ticket.attachment.data}" download="${ticket.attachment.name}" class="btn btn-sm btn-ghost" title="Tải xuống">
            <i class="fas fa-download"></i>
          </a>
        </div>
        ` : ''}

        <div class="replies-section mb-4">
          <h4 class="font-semibold mb-3 border-b border-border-color pb-1">${t('reply')} (${ticket.replies?.length || 0})</h4>
          <div class="replies-list max-h-60 overflow-y-auto pr-2">
            ${repliesHtml || `<div class="text-center text-sm text-text-tertiary py-2">${t('no_replies')}</div>`}
          </div>
        </div>

        <div class="reply-form mt-4 pt-4 border-t border-border-color">
          <div class="form-group mb-2">
            <textarea id="reply-message" class="form-input" rows="3" placeholder="${t('enter_reply_placeholder')}"></textarea>
          </div>
          ${isAdmin ? `
            <div class="mb-3 flex gap-2">
              <button type="button" class="btn btn-sm btn-secondary" id="btn-ai-suggest">
                <i class="fas fa-magic"></i> ${t('ai_suggest_reply')}
              </button>
            </div>
          ` : ''}
          <div class="flex justify-between items-center mt-2">
            ${isAdmin ? `
            <select id="update-status" class="form-input text-sm" style="width: auto;">
              <option value="new" ${ticket.status === 'new' ? 'selected' : ''}>${t('new_ticket')}</option>
              <option value="in-progress" ${ticket.status === 'in-progress' ? 'selected' : ''}>${t('in_progress')}</option>
              <option value="resolved" ${ticket.status === 'resolved' ? 'selected' : ''}>${t('resolved')}</option>
              <option value="closed" ${ticket.status === 'closed' ? 'selected' : ''}>${t('closed')}</option>
            </select>
            ` : '<span></span>'}
            <button class="btn btn-primary btn-sm" id="btn-send-reply">${t('send_reply')}</button>
          </div>
        </div>
      </div>
    `;

    Utils.showModal(
      t('ticket_details_title'),
      html,
      `<button class="btn btn-ghost" onclick="Utils.closeModal()">${t('close')}</button>`
    );

    // AI Suggestion Event
    if (isAdmin) {
      document.getElementById('btn-ai-suggest')?.addEventListener('click', async (e) => {
        const btn = e.target.closest('button');
        btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${t('ai_thinking')}`;
        btn.disabled = true;
        
        try {
          const settings = Database.settings.get();
          let suggestion = "Dạ chào bạn, lỗi này đã được ghi nhận và phòng kỹ thuật đang xử lý. Cảm ơn bạn đã thông báo!";
          
          if (settings.aiProvider === 'gemini' && settings.aiApiKey) {
            suggestion = await ChatbotView.callGeminiAPI(`Đề xuất 1 câu trả lời ngắn gọn (dưới 50 từ) để phản hồi lại ticket lỗi này cho user: Tiêu đề: ${ticket.title}. Mô tả: ${ticket.description}. Lời nhắn lịch sự, ngắn gọn.`, settings.aiApiKey);
          } else if (settings.aiProvider === 'gpt' && settings.aiApiKey) {
            suggestion = await ChatbotView.callGPTAPI(`Đề xuất 1 câu trả lời ngắn gọn để phản hồi lại ticket: ${ticket.title}. Mô tả: ${ticket.description}`, settings.aiApiKey);
          }
          
          document.getElementById('reply-message').value = suggestion.trim();
        } catch (err) {
          Utils.toast(t('ai_suggestion_error'), 'error');
        } finally {
          btn.innerHTML = `<i class="fas fa-magic"></i> ${t('ai_suggest_reply')}`;
          btn.disabled = false;
        }
      });
    }

    document.getElementById('btn-send-reply').addEventListener('click', () => {
      const msg = document.getElementById('reply-message').value.trim();
      const statusSelect = document.getElementById('update-status');
      const newStatus = statusSelect ? statusSelect.value : ticket.status;
      
      let updated = false;
      const user = Auth.getCurrentUser();
      
      if (msg) {
        Database.bugs.addReply(id, { author: user.name, message: msg });
        updated = true;
      }
      
      if (newStatus !== ticket.status) {
        Database.bugs.update(id, { status: newStatus });
        updated = true;
      }
      
      if (updated) {
        Utils.toast(t('success'), 'success');
        this.loadData();
        this.renderSummary();
        this.showTicketDetail(id); // Reload modal content
      }
    });
  },

  handleDeleteTicket(id) {
    Utils.showConfirm(t('confirm_delete') || 'Bạn có chắc chắn muốn xóa?', () => {
      Database.bugs.delete(id);
      Utils.logActivity('deleted', 'bug', id, `Xóa phiếu hỗ trợ`);
      Utils.toast(t('success') || 'Đã xoá thành công!', 'success');
      this.loadData();
      this.renderSummary();
    });
  }
};
