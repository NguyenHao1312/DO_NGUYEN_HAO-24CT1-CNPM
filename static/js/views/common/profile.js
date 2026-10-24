// js/views/profile.js

const ProfileView = {
  render() {
    const container = document.getElementById('main-content');
    container.innerHTML = this.getHTML();
    this.attachEvents();
    
    // Add fade-in animation
    container.classList.add('fade-in');
    setTimeout(() => container.classList.remove('fade-in'), 300);
  },

  getHTML() {
    const user = Auth.getCurrentUser();
    if (!user) return '';

    let linkedData = null;
    if (user.role === 'student' && user.linkedId) {
      linkedData = Database.students.getById(user.linkedId);
    } else if (user.role === 'teacher' && user.linkedId) {
      linkedData = Database.teachers.getById(user.linkedId);
    }

    const cccd = user.cccd || (linkedData && linkedData.cccd) || '';
    const phone = user.phone || (linkedData && linkedData.phone) || '';
    const address = user.address || (linkedData && linkedData.address) || '';
    const email = user.email || (linkedData && linkedData.email) || '';
    const dob = user.dob || (linkedData && linkedData.dob) || '';
    const department = (linkedData && linkedData.department) || '';
    
    // Default avatar if none
    const avatarUrl = user.avatar || '';
    let avatarContent = `<i class="fas fa-user" style="font-size: 3rem; color: var(--primary-500);"></i>`;
    if (avatarUrl) {
      avatarContent = `<img src="${avatarUrl}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
    } else if (user.name) {
      const parts = user.name.split(' ');
      const initials = parts[parts.length - 1].charAt(0).toUpperCase();
      avatarContent = `<span style="font-size: 2.5rem; color: var(--primary-600); font-weight: bold;">${initials}</span>`;
    }

    const t = App.t ? App.t.bind(App) : window.t;

    return `
      <div class="page-header">
        <div class="page-title-section">
          <h1 class="page-title">${t('profile_title')}</h1>
          <p class="page-subtitle">${t('profile_subtitle')}</p>
        </div>
      </div>

      <div class="grid-row" style="display: grid; grid-template-columns: 1fr 2fr; gap: var(--space-6);">
        <!-- Avatar Section -->
        <div class="card" style="align-self: start;">
          <div class="card-body" style="display: flex; flex-direction: column; align-items: center; padding: var(--space-6);">
            <div id="profile-avatar-preview" style="width: 120px; height: 120px; border-radius: 50%; background: var(--primary-100); display: flex; justify-content: center; align-items: center; margin-bottom: var(--space-4); border: 2px solid var(--primary-300); overflow: hidden; position: relative;">
              ${avatarContent}
            </div>
            <h3 style="margin-bottom: var(--space-1);">${user.name}</h3>
            <p style="color: var(--text-secondary); margin-bottom: var(--space-4);">${Auth.getRoleLabel(user.role)}</p>
            
            <label for="avatar-upload" class="btn btn-primary" style="cursor: pointer; width: 100%; justify-content: center;">
              <i class="fas fa-camera"></i> ${t('change_avatar')}
            </label>
            <input type="file" id="avatar-upload" accept="image/*" style="display: none;">
          </div>
        </div>

        <!-- Info Section -->
        <div class="card">
          <div class="card-header">
            <h3>${t('details_info')}</h3>
          </div>
          <div class="card-body">
            <form id="profile-form">
              <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4);">
                
                <div class="form-group">
                  <label class="form-label">${t('full_name')}</label>
                  <input type="text" class="form-control" id="profile-name" value="${user.name}" required>
                </div>
                
                <div class="form-group">
                  <label class="form-label">${t('role')}</label>
                  <input type="text" class="form-control" value="${Auth.getRoleLabel(user.role)}" disabled>
                </div>

                <div class="form-group">
                  <label class="form-label">${t('cccd')}</label>
                  <input type="text" class="form-control" id="profile-cccd" value="${cccd}" placeholder="">
                </div>

                <div class="form-group">
                  <label class="form-label">${t('phone_number')}</label>
                  <input type="text" class="form-control" id="profile-phone" value="${phone}" placeholder="">
                </div>

                <div class="form-group">
                  <label class="form-label">${t('email')}</label>
                  <input type="email" class="form-control" id="profile-email" value="${email}" placeholder="">
                </div>

                ${user.role !== 'admin' ? `
                <div class="form-group">
                  <label class="form-label">${t('department')}</label>
                  <input type="text" class="form-control" value="${department}" disabled>
                </div>
                ` : ''}
              </div>

              <div class="form-group" style="margin-top: var(--space-4);">
                <label class="form-label">${t('address')}</label>
                <textarea class="form-control" id="profile-address" rows="3" placeholder="">${address}</textarea>
              </div>

              <div style="display: flex; justify-content: flex-end; margin-top: var(--space-6);">
                <button type="submit" class="btn btn-primary">
                  <i class="fas fa-save"></i> ${t('save_changes')}
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Password Change Section (Sinh Viên & Giáo Viên) -->
        <div class="card" style="grid-column: span 2; margin-top: var(--space-4);">
          <div class="card-header" style="display: flex; align-items: center; gap: 8px;">
            <i class="fas fa-shield-alt" style="color: var(--primary-500);"></i>
            <h3>Đổi Mật Khẩu Đăng Nhập</h3>
          </div>
          <div class="card-body">
            <p style="color: var(--text-secondary); margin-bottom: var(--space-4); font-size: 0.9rem;">
              Bạn có thể chủ động cập nhật mật khẩu mới bất kỳ lúc nào để bảo mật tài khoản. Dữ liệu sẽ được đồng bộ trực tiếp vào cơ sở dữ liệu SSMS.
            </p>
            <form id="password-change-form">
              <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: var(--space-4);">
                <div class="form-group">
                  <label class="form-label">Mật khẩu hiện tại</label>
                  <input type="password" class="form-control" id="profile-current-pass" placeholder="Nhập mật khẩu cũ..." required>
                </div>
                <div class="form-group">
                  <label class="form-label">Mật khẩu mới (tối thiểu 6 ký tự)</label>
                  <input type="password" class="form-control" id="profile-new-pass" placeholder="Nhập mật khẩu mới..." required minlength="6">
                </div>
                <div class="form-group">
                  <label class="form-label">Xác nhận mật khẩu mới</label>
                  <input type="password" class="form-control" id="profile-confirm-pass" placeholder="Nhập lại mật khẩu mới..." required minlength="6">
                </div>
              </div>
              <div style="display: flex; justify-content: flex-end; margin-top: var(--space-4);">
                <button type="submit" class="btn btn-primary" id="btn-submit-change-pass">
                  <i class="fas fa-key"></i> Lưu Mật Khẩu Mới
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    `;
  },

  attachEvents() {
    const avatarUpload = document.getElementById('avatar-upload');
    const avatarPreview = document.getElementById('profile-avatar-preview');
    let newAvatarBase64 = null;

    if (avatarUpload) {
      avatarUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            newAvatarBase64 = event.target.result;
            avatarPreview.innerHTML = `<img src="${newAvatarBase64}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
          };
          reader.readAsDataURL(file);
        }
      });
    }

    const form = document.getElementById('profile-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const user = Auth.getCurrentUser();
        if (!user) return;

        const name = document.getElementById('profile-name').value.trim();
        const cccd = document.getElementById('profile-cccd').value.trim();
        const phone = document.getElementById('profile-phone').value.trim();
        const email = document.getElementById('profile-email').value.trim();
        const address = document.getElementById('profile-address').value.trim();

        // Update Users Table
        const userUpdateData = { name, cccd, phone, email, address };
        if (newAvatarBase64) {
          userUpdateData.avatar = newAvatarBase64;
          user.avatar = newAvatarBase64; // Update session
        }
        user.name = name;
        sessionStorage.setItem(Auth.SESSION_KEY, JSON.stringify(user));
        localStorage.setItem(Auth.SESSION_KEY + '_auto', JSON.stringify(user));
        Database.users.update(user.id, userUpdateData);

        // Also update linked student or teacher record
        if (user.role === 'student' && user.linkedId) {
          Database.students.update(user.linkedId, { name, cccd, phone, email, address });
        } else if (user.role === 'teacher' && user.linkedId) {
          Database.teachers.update(user.linkedId, { name, cccd, phone, email, address });
        }

        const t = App.t ? App.t.bind(App) : window.t;
        Utils.showToast(t('profile_updated') || 'Cập nhật thành công!', 'success');
        
        // Refresh sidebar user info
        if (window.App && typeof App.setupUserProfile === 'function') {
          App.setupUserProfile();
        }

        // Auto reload after 800ms
        setTimeout(() => {
          window.location.reload();
        }, 800);
      });
    }

    // Password change event listener
    const pwdForm = document.getElementById('password-change-form');
    if (pwdForm) {
      pwdForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const currentPass = document.getElementById('profile-current-pass').value;
        const newPass = document.getElementById('profile-new-pass').value;
        const confirmPass = document.getElementById('profile-confirm-pass').value;

        if (newPass.length < 6) {
          Utils.showToast('Mật khẩu mới phải có tối thiểu 6 ký tự!', 'warning');
          return;
        }

        if (newPass !== confirmPass) {
          Utils.showToast('Mật khẩu xác nhận không khớp!', 'warning');
          return;
        }

        const btn = document.getElementById('btn-submit-change-pass');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang lưu SSMS...';

        try {
          const res = await Auth.apiFetch('/api/change-password/', {
            method: 'POST',
            body: {
              current_password: currentPass,
              new_password: newPass
            }
          });
          const data = await res.json();
          if (data && data.success) {
            Utils.showToast(data.message || 'Đổi mật khẩu thành công!', 'success');
            pwdForm.reset();
          } else {
            Utils.showToast(data.message || 'Đổi mật khẩu thất bại!', 'error');
          }
        } catch (err) {
          Utils.showToast('Không thể kết nối đến máy chủ SSMS', 'error');
        } finally {
          btn.disabled = false;
          btn.innerHTML = '<i class="fas fa-key"></i> Lưu Mật Khẩu Mới';
        }
      });
    }
  }
};
