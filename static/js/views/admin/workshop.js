// Quản trị Workshop (Workshop View)
const WorkshopView = {
  render() {
    const container = document.getElementById('main-content');
    container.innerHTML = this.getHTML();
    this.attachEvents();
    this.renderLogTable();
  },

  getHTML() {
    const stats = {
      students: Database.students.count(),
      teachers: Database.teachers.count(),
      classes: Database.classes.count(),
      grades: Database.grades.getAll().length,
      bugs: Database.bugs.count()
    };

    // Calculate local storage size
    let _lsTotal = 0, _xLen, _x;
    for (_x in localStorage) {
      if (!localStorage.hasOwnProperty(_x)) continue;
      _xLen = ((localStorage[_x].length + _x.length) * 2);
      _lsTotal += _xLen;
    }
    const lsUsage = (_lsTotal / 1024).toFixed(2); // KB
    const lsCapacity = 5120; // ~5MB
    const lsPercent = Math.round((lsUsage / lsCapacity) * 100);

    const settings = Database.settings.get();

    return `
      <div class="page-header">
        <div class="page-title-section">
          <h1 class="page-title">${t('workshop_title')}</h1>
          <p class="page-subtitle">${t('workshop_subtitle')}</p>
        </div>
      </div>

      <div class="grid grid-2 gap-4">
        <!-- Card 1: Database Statistics -->
        <div class="card">
          <div class="card-header border-b border-border-color pb-3 mb-3 flex gap-2 items-center font-semibold">
            <i class="fas fa-database text-primary-500"></i> ${t('db_stats')}
          </div>
          <div class="card-body">
            <table class="w-full text-sm">
              <tbody>
                <tr class="border-b border-border-color"><td class="py-2">Sinh viên:</td><td class="text-right font-bold">${stats.students}</td></tr>
                <tr class="border-b border-border-color"><td class="py-2">Giáo viên:</td><td class="text-right font-bold">${stats.teachers}</td></tr>
                <tr class="border-b border-border-color"><td class="py-2">Lớp học:</td><td class="text-right font-bold">${stats.classes}</td></tr>
                <tr class="border-b border-border-color"><td class="py-2">Bản ghi điểm:</td><td class="text-right font-bold">${stats.grades}</td></tr>
                <tr><td class="py-2">Phiếu hỗ trợ:</td><td class="text-right font-bold">${stats.bugs}</td></tr>
              </tbody>
            </table>
            
            <div class="mt-4 pt-3 border-t border-border-color">
              <div class="flex justify-between text-xs mb-1">
                <span>Dung lượng LocalStorage</span>
                <span>${lsUsage} KB / ~5 MB</span>
              </div>
              <div class="w-full bg-border-color rounded-full h-2">
                <div class="bg-primary-500 h-2 rounded-full" style="width: ${lsPercent}%"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Card 2: Export / Import -->
        <div class="card">
          <div class="card-header border-b border-border-color pb-3 mb-3 flex gap-2 items-center font-semibold">
            <i class="fas fa-file-export text-success"></i> Backup & Restore
          </div>
          <div class="card-body flex flex-col gap-3">
            <button class="btn btn-outline border-primary-500 text-primary-600 hover:bg-primary-50 w-full flex justify-center gap-2" id="btn-export-json">
              <i class="fas fa-download"></i> Sao lưu toàn bộ (JSON)
            </button>
            
            <div class="relative">
              <input type="file" id="file-import" accept=".json" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer">
              <button class="btn btn-outline border-warning text-warning hover:bg-warning/10 w-full flex justify-center gap-2 pointer-events-none">
                <i class="fas fa-upload"></i> Phục hồi dữ liệu (JSON)
              </button>
            </div>

            <hr class="border-border-color my-1">
            
            <button class="btn btn-outline border-info text-info hover:bg-info/10 w-full flex justify-center gap-2" id="btn-export-csv">
              <i class="fas fa-file-csv"></i> Xuất danh sách Sinh viên (CSV)
            </button>
          </div>
        </div>

        <!-- Card 3: System Info -->
        <div class="card">
          <div class="card-header border-b border-border-color pb-3 mb-3 flex gap-2 items-center font-semibold">
            <i class="fas fa-laptop-code text-info"></i> ${t('system_info')}
          </div>
          <div class="card-body">
            <table class="w-full text-sm">
              <tbody>
                <tr class="border-b border-border-color"><td class="py-2">App Version:</td><td class="text-right font-medium">1.0.0</td></tr>
                <tr class="border-b border-border-color"><td class="py-2">Browser:</td><td class="text-right text-xs text-text-secondary">${this.getBrowserInfo()}</td></tr>
                <tr class="border-b border-border-color"><td class="py-2">Screen:</td><td class="text-right text-xs">${window.screen.width} x ${window.screen.height}</td></tr>
                <tr class="border-b border-border-color"><td class="py-2">Current Theme:</td><td class="text-right"><span class="badge badge-neutral">${settings.theme || 'light'}</span></td></tr>
                <tr><td class="py-2">Current Language:</td><td class="text-right"><span class="badge badge-neutral">${settings.language || 'vi'}</span></td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Card 4: School Settings -->
        <div class="card">
          <div class="card-header border-b border-border-color pb-3 mb-3 flex gap-2 items-center font-semibold">
            <i class="fas fa-cog text-text-secondary"></i> ${t('school_settings')}
          </div>
          <div class="card-body">
            <div class="form-group">
              <label class="form-label text-sm">Tên trường (VI)</label>
              <input type="text" id="setting-name-vi" class="form-input form-input-sm" value="${settings.schoolName || 'Đại học Quốc gia'}">
            </div>
            <div class="form-group mb-4">
              <label class="form-label text-sm">Tên trường (EN)</label>
              <input type="text" id="setting-name-en" class="form-input form-input-sm" value="${settings.schoolNameEn || 'National University'}">
            </div>
            <button class="btn btn-primary btn-sm w-full" id="btn-save-settings">Lưu cấu hình</button>
          </div>
        </div>

        <!-- Card 5: Danger Zone -->
        <div class="card border border-danger">
          <div class="card-header border-b border-danger/30 pb-3 mb-3 flex gap-2 items-center font-semibold text-danger">
            <i class="fas fa-exclamation-triangle"></i> ${t('danger_zone')}
          </div>
          <div class="card-body flex flex-col gap-3">
            <button class="btn btn-danger w-full flex justify-center gap-2" id="btn-reset-data">
              <i class="fas fa-trash-alt"></i> ${t('reset_data')}
            </button>
            <button class="btn btn-outline border-danger text-danger hover:bg-danger/10 w-full flex justify-center gap-2" id="btn-seed-data">
              <i class="fas fa-seedling"></i> Tạo dữ liệu mẫu (Seed)
            </button>
            <div class="flex gap-2">
               <button class="btn btn-outline border-border-color text-text-secondary hover:bg-bg-tertiary flex-1 text-xs" id="btn-clear-chat-log">Xóa Chat History</button>
               <button class="btn btn-outline border-border-color text-text-secondary hover:bg-bg-tertiary flex-1 text-xs" id="btn-clear-activity">Xóa Activity Log</button>
            </div>
          </div>
        </div>

        <!-- Card 6: Activity Log -->
        <div class="card" style="grid-column: span 1;">
          <div class="card-header border-b border-border-color pb-3 mb-3 flex gap-2 items-center font-semibold">
            <i class="fas fa-history text-primary-500"></i> ${t('activity_log')}
          </div>
          <div class="card-body p-0 max-h-64 overflow-y-auto" id="activity-log-container">
            <!-- Rendered by renderLogTable() -->
          </div>
        </div>
      </div>
    `;
  },

  getBrowserInfo() {
    const ua = navigator.userAgent;
    let tem, M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
    if(/trident/i.test(M[1])){
        tem =  /\brv[ :]+(\d+)/g.exec(ua) || [];
        return 'IE '+(tem[1] || '');
    }
    if(M[1]=== 'Chrome'){
        tem = ua.match(/\b(OPR|Edge)\/(\d+)/);
        if(tem != null) return tem.slice(1).join(' ').replace('OPR', 'Opera');
    }
    M = M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
    if((tem = ua.match(/version\/(\d+)/i))!= null) M.splice(1, 1, tem[1]);
    return M.join(' ');
  },

  renderLogTable() {
    const logs = Database.activity.getRecent(20);
    const container = document.getElementById('activity-log-container');
    if (!container) return;

    if (logs.length === 0) {
      container.innerHTML = `<div class="p-4 text-center text-sm text-text-tertiary">Chưa có hoạt động nào</div>`;
      return;
    }

    const html = `
      <table class="w-full text-xs">
        <tbody>
          ${logs.map(log => `
            <tr class="border-b border-border-color hover:bg-bg-tertiary">
              <td class="py-2 px-2 font-medium">
                <span class="badge badge-neutral text-[10px] uppercase">${log.action}</span>
              </td>
              <td class="py-2 px-2 text-text-secondary">${log.details}</td>
              <td class="py-2 px-2 text-right text-text-tertiary whitespace-nowrap">${Utils.timeAgo(log.timestamp)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    container.innerHTML = html;
  },

  attachEvents() {
    // Export JSON
    const btnExportJson = document.getElementById('btn-export-json');
    if (btnExportJson) {
      btnExportJson.addEventListener('click', () => {
        const data = Database.exportAll();
        Utils.downloadJSON(JSON.parse(data), `sms33_backup_${new Date().toISOString().split('T')[0]}.json`);
        Utils.toast('Đã xuất dữ liệu thành công', 'success');
        Utils.logActivity('export', 'system', 'all', 'Đã xuất bản sao lưu hệ thống');
        this.renderLogTable();
      });
    }

    // Import JSON
    const fileImport = document.getElementById('file-import');
    if (fileImport) {
      fileImport.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const json = event.target.result;
            Database.importAll(json);
            Utils.toast('Phục hồi dữ liệu thành công! Đang tải lại...', 'success');
            setTimeout(() => window.location.reload(), 1500);
          } catch (error) {
            Utils.toast('File không hợp lệ hoặc bị lỗi', 'error');
          }
        };
        reader.readAsText(file);
      });
    }

    // Export CSV
    const btnExportCsv = document.getElementById('btn-export-csv');
    if (btnExportCsv) {
      btnExportCsv.addEventListener('click', () => {
        const students = Database.students.getAll();
        const headers = ['ID', 'Mã SV', 'Họ Tên', 'Email', 'SĐT', 'Khoa', 'Tình trạng'];
        const rows = students.map(s => [s.id, s.studentId, s.name, s.email, s.phone, s.department, s.status]);
        Utils.downloadCSV(headers, rows, 'students.csv');
        Utils.toast('Xuất CSV thành công', 'success');
      });
    }

    // Settings
    const btnSaveSettings = document.getElementById('btn-save-settings');
    if (btnSaveSettings) {
      btnSaveSettings.addEventListener('click', () => {
        const settings = Database.settings.get();
        settings.schoolName = document.getElementById('setting-name-vi').value;
        settings.schoolNameEn = document.getElementById('setting-name-en').value;
        Database.settings.save(settings);
        Utils.toast('Đã lưu cấu hình', 'success');
      });
    }

    // Danger Zone
    const btnReset = document.getElementById('btn-reset-data');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        Utils.showConfirm('CẢNH BÁO: Hành động này sẽ xóa TOÀN BỘ dữ liệu. Bạn có chắc chắn?', () => {
          Database.resetAll(); // calls clear() and setup
          Utils.toast('Đã xóa toàn bộ dữ liệu', 'success');
          setTimeout(() => window.location.reload(), 1000);
        });
      });
    }

    const btnSeed = document.getElementById('btn-seed-data');
    if (btnSeed) {
      btnSeed.addEventListener('click', () => {
        Utils.showConfirm('Xóa dữ liệu hiện tại và nạp dữ liệu mẫu?', () => {
          Database.resetAll(); // Clear first
          Database.seedData(); // Force seed
          Utils.toast('Đã nạp dữ liệu mẫu', 'success');
          setTimeout(() => window.location.reload(), 1000);
        });
      });
    }

    const btnClearChat = document.getElementById('btn-clear-chat-log');
    if (btnClearChat) {
      btnClearChat.addEventListener('click', () => {
        localStorage.removeItem('sms_chat_history');
        Utils.toast('Đã xóa lịch sử chat', 'success');
      });
    }

    const btnClearActivity = document.getElementById('btn-clear-activity');
    if (btnClearActivity) {
      btnClearActivity.addEventListener('click', () => {
        localStorage.removeItem('sms_activity_log');
        Utils.toast('Đã xóa nhật ký hoạt động', 'success');
        this.renderLogTable();
      });
    }
  }
};
