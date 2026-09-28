// utils.js
const Utils = {
  // Toast Notifications
  showToast(message, type = 'info', duration = 3000) {
    this.toast(message, type, duration);
  },

  toast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'times-circle';
    if (type === 'warning') icon = 'exclamation-triangle';
    
    toast.innerHTML = `
      <i class="fas fa-${icon}"></i>
      <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  // Modal
  showModal(title, bodyHTML, footerHTML = null) {
    const overlay = document.getElementById('modal-overlay');
    const titleEl = document.getElementById('modal-title');
    const bodyEl = document.getElementById('modal-body');
    const footerEl = document.getElementById('modal-footer');
    
    if (!overlay || !titleEl || !bodyEl || !footerEl) return;
    
    titleEl.textContent = title;
    bodyEl.innerHTML = bodyHTML;
    
    if (footerHTML) {
      footerEl.innerHTML = footerHTML;
      footerEl.style.display = 'flex';
    } else {
      footerEl.style.display = 'none';
    }
    
    overlay.classList.add('active');
    
    // Bind close events
    const closeBtn = document.getElementById('modal-close');
    if (closeBtn) closeBtn.onclick = this.closeModal;
    
    overlay.onclick = (e) => {
      if (e.target === overlay) this.closeModal();
    };
  },
  
  closeModal() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
      overlay.classList.remove('active');
    }
  },
  
  showConfirm(message, onConfirm) {
    const body = `<p>${message}</p>`;
    const footer = `
      <button class="btn btn-ghost" onclick="Utils.closeModal()">${t('cancel')}</button>
      <button class="btn btn-primary" id="btn-confirm">${t('confirm')}</button>
    `;
    this.showModal(t('confirm'), body, footer);
    
    setTimeout(() => {
      const btn = document.getElementById('btn-confirm');
      if (btn) {
        btn.onclick = () => {
          this.closeModal();
          if (onConfirm) onConfirm();
        };
      }
    }, 0);
  },

  // Date Formatting
  formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  },
  
  formatDateTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    const hr = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${d}/${m}/${y} ${hr}:${min}`;
  },
  
  timeAgo(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    const lang = Database.settings.get()?.language || 'vi';
    const isVi = lang === 'vi';
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + (isVi ? ' năm trước' : ' years ago');
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + (isVi ? ' tháng trước' : ' months ago');
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + (isVi ? ' ngày trước' : ' days ago');
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + (isVi ? ' giờ trước' : ' hours ago');
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + (isVi ? ' phút trước' : ' minutes ago');
    return Math.floor(seconds) + (isVi ? ' giây trước' : ' seconds ago');
  },

  // Validation
  validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },
  
  validatePhone(phone) {
    return /(84|0[3|5|7|8|9])+([0-9]{8})\b/.test(phone);
  },
  
  validateRequired(value) {
    return value !== null && value !== undefined && String(value).trim() !== '';
  },

  // Charts
  _setupCanvas(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    
    // Handle High-DPI
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    const w = rect.width || canvas.clientWidth || 400;
    const h = rect.height || canvas.clientHeight || 300;
    
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    
    return { canvas, ctx, width: w, height: h };
  },

  drawBarChart(canvasId, labels, data, colors) {
    const setup = this._setupCanvas(canvasId);
    if (!setup) return;
    const { ctx, width, height } = setup;
    
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const barWidth = chartWidth / data.length * 0.6;
    const maxData = Math.max(...data, 1);
    
    ctx.clearRect(0, 0, width, height);
    
    // Draw Grid and Y-axis labels
    ctx.fillStyle = '#94a3b8';
    ctx.strokeStyle = '#e2e8f0';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.font = '12px Inter';
    
    const steps = 5;
    for (let i = 0; i <= steps; i++) {
      const y = height - padding - (i / steps) * chartHeight;
      const val = Math.round((maxData / steps) * i);
      
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
      
      ctx.fillText(val.toString(), padding - 10, y);
    }
    
    // Draw Bars and X-axis labels
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    data.forEach((val, i) => {
      const barHeight = (val / maxData) * chartHeight;
      const x = padding + (i * (chartWidth / data.length)) + (chartWidth / data.length - barWidth) / 2;
      const y = height - padding - barHeight;
      
      ctx.fillStyle = colors[i % colors.length];
      
      // Animation (simple instant for now, but could be animated using requestAnimationFrame)
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
      ctx.fill();
      
      // X label
      ctx.fillStyle = '#94a3b8';
      let label = labels[i];
      if (label.length > 10) label = label.substring(0, 8) + '...';
      ctx.fillText(label, x + barWidth / 2, height - padding + 10);
    });
  },
  
  drawPieChart(canvasId, labels, data, colors) {
    const setup = this._setupCanvas(canvasId);
    if (!setup) return;
    const { ctx, width, height } = setup;
    
    ctx.clearRect(0, 0, width, height);
    
    const total = data.reduce((a, b) => a + b, 0);
    if (total === 0) return;
    
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 20;
    
    let startAngle = -0.5 * Math.PI;
    
    data.forEach((val, i) => {
      const sliceAngle = (val / total) * 2 * Math.PI;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      
      // Labels
      const percent = Math.round((val / total) * 100);
      if (percent > 5) {
        const labelAngle = startAngle + sliceAngle / 2;
        const labelX = centerX + (radius * 0.7) * Math.cos(labelAngle);
        const labelY = centerY + (radius * 0.7) * Math.sin(labelAngle);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${percent}%`, labelX, labelY);
      }
      
      startAngle += sliceAngle;
    });
  },
  
  drawLineChart(canvasId, labels, data, color) {
    const setup = this._setupCanvas(canvasId);
    if (!setup) return;
    const { ctx, width, height } = setup;
    
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const maxData = Math.max(...data, 1);
    
    ctx.clearRect(0, 0, width, height);
    
    // Grid
    ctx.fillStyle = '#94a3b8';
    ctx.strokeStyle = '#e2e8f0';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.font = '12px Inter';
    
    for (let i = 0; i <= 5; i++) {
      const y = height - padding - (i / 5) * chartHeight;
      const val = Math.round((maxData / 5) * i);
      
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
      ctx.fillText(val.toString(), padding - 10, y);
    }
    
    // Line
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    
    data.forEach((val, i) => {
      const x = padding + i * (chartWidth / Math.max(data.length - 1, 1));
      const y = height - padding - (val / maxData) * chartHeight;
      
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      
      // X label
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(labels[i], x, height - padding + 10);
    });
    ctx.stroke();
    
    // Points
    data.forEach((val, i) => {
      const x = padding + i * (chartWidth / Math.max(data.length - 1, 1));
      const y = height - padding - (val / maxData) * chartHeight;
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.stroke();
    });
  },

  // Pagination
  paginate(items, page, perPage = 10) {
    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / perPage) || 1;
    const currentPage = Math.max(1, Math.min(page, totalPages));
    const start = (currentPage - 1) * perPage;
    const end = start + perPage;
    
    return {
      items: items.slice(start, end),
      currentPage,
      totalPages,
      totalItems
    };
  },
  
  renderPagination(containerId, currentPage, totalPages, onPageChange) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }
    
    let html = `
      <button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">
        <i class="fas fa-chevron-left"></i>
      </button>
    `;
    
    for (let i = 1; i <= totalPages; i++) {
      // Logic for ellipsis can be added here if totalPages > 5
      html += `
        <button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>
      `;
    }
    
    html += `
      <button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">
        <i class="fas fa-chevron-right"></i>
      </button>
    `;
    
    container.innerHTML = html;
    
    container.querySelectorAll('.page-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (!btn.disabled && !btn.classList.contains('active')) {
          onPageChange(parseInt(btn.dataset.page));
        }
      });
    });
  },

  // Activity Logging
  logActivity(action, entity, entityId, details) {
    Database.activity.add(action, entity, entityId, details);
  },

  // Avatar Helpers
  getInitials(name) {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  },
  
  getAvatarColor(name) {
    if (!name) return 'hsl(0, 0%, 50%)';
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 50%)`;
  },

  // Highlight Text
  highlightText(text, query) {
    if (!query || !text) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return String(text).replace(regex, '<mark>$1</mark>');
  },

  // Export
  downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },
  
  downloadCSV(headers, rows, filename) {
    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.map(cell => {
        const cellStr = String(cell).replace(/"/g, '""');
        return `"${cellStr}"`;
      }).join(',') + '\n';
    });
    
    // Add BOM for Excel UTF-8
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },

  // Utils
  debounce(fn, delay = 300) {
    let timeoutId;
    return function (...args) {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        fn.apply(this, args);
      }, delay);
    };
  },
  
  formatNumber(num) {
    if (num === null || num === undefined) return '';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  },

  getClassification(average) {
    if (average >= 9.0) return 'excellent';
    if (average >= 8.0) return 'good';
    if (average >= 6.5) return 'fair';
    if (average >= 5.0) return 'average_grade';
    if (average >= 3.5) return 'weak';
    return 'poor';
  },
  
  getClassificationColor(classification) {
    const map = {
      excellent: 'success',
      good: 'info',
      fair: 'primary',
      average_grade: 'warning',
      weak: 'danger',
      poor: 'danger'
    };
    return map[classification] || 'neutral';
  },

  getStatusBadge(status) {
    const clsMap = {
      active: 'success',
      inactive: 'neutral',
      graduated: 'primary',
      suspended: 'danger',
      new: 'info',
      'in-progress': 'warning',
      resolved: 'success',
      closed: 'neutral'
    };
    const cls = clsMap[status] || 'neutral';
    return `<span class="badge badge-${cls}">${t(status) || status}</span>`;
  },
  
  getSeverityBadge(severity) {
    const clsMap = {
      low: 'info',
      medium: 'warning',
      high: 'danger',
      critical: 'danger'
    };
    const cls = clsMap[severity] || 'neutral';
    return `<span class="badge badge-${cls}">${t(severity) || severity}</span>`;
  }
};
