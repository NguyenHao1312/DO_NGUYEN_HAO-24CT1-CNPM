// js/views/forgot_password.js
const ForgotPassword = {
  show() {
    const lang = (typeof LoginView !== 'undefined' && LoginView.currentLang === 'en') ? 'en' : 'vi';
    const isEn = lang === 'en';

    const t = {
      title: isEn ? 'Forgot Password' : 'Quên mật khẩu',
      desc1: isEn ? 'Please select your university and enter your ID to find your account.' : 'Vui lòng chọn trường và nhập Tên đăng nhập hoặc Mã số của bạn để tìm kiếm tài khoản.',
      uniLabel: isEn ? 'Select University' : 'Chọn trường Đại học',
      idLabel: isEn ? 'Student / Teacher ID' : 'Tên đăng nhập / Mã số',
      idPlaceholder: isEn ? 'Enter your ID...' : 'Nhập mã SV/GV hoặc tên đăng nhập...',
      cancelBtn: isEn ? 'Cancel' : 'Hủy',
      continueBtn: isEn ? 'Continue <i class="fas fa-arrow-right" style="margin-left: 8px;"></i>' : 'Tiếp tục <i class="fas fa-arrow-right" style="margin-left: 8px;"></i>',
      accountLabel: isEn ? 'Account' : 'Tài khoản',
      roleLabel: isEn ? 'Role' : 'Vai trò',
      desc2: isEn ? 'Verify identity via registered phone. If none, just enter new password.' : 'Xác minh danh tính bằng số điện thoại đã đăng ký. Nếu chưa có SĐT, bạn chỉ cần nhập mật khẩu mới.',
      phoneLabel: isEn ? 'Phone (if any)' : 'Số điện thoại (nếu có)',
      phonePlaceholder: isEn ? 'Enter phone...' : 'Nhập số điện thoại...',
      newPassLabel: isEn ? 'New password' : 'Mật khẩu mới',
      newPassPlaceholder: isEn ? 'Enter new password...' : 'Nhập mật khẩu mới...',
      confirmPassLabel: isEn ? 'Confirm password' : 'Xác nhận mật khẩu mới',
      confirmPassPlaceholder: isEn ? 'Confirm new password...' : 'Nhập lại mật khẩu mới...',
      backBtn: isEn ? '<i class="fas fa-arrow-left" style="margin-right: 6px;"></i> Back' : '<i class="fas fa-arrow-left" style="margin-right: 6px;"></i> Quay lại',
      resetBtn: isEn ? '<i class="fas fa-check" style="margin-right: 8px;"></i> Reset Password' : '<i class="fas fa-check" style="margin-right: 8px;"></i> Đặt lại mật khẩu',
      successTitle: isEn ? 'Password reset successful!' : 'Đặt lại mật khẩu thành công!',
      successDesc: isEn ? 'You can now login with your new password.' : 'Bạn có thể đăng nhập bằng mật khẩu mới ngay bây giờ.',
      backToLoginBtn: isEn ? '<i class="fas fa-sign-in-alt" style="margin-right: 8px;"></i> Back to Login' : '<i class="fas fa-sign-in-alt" style="margin-right: 8px;"></i> Quay lại Đăng nhập',
      notFoundTitle: isEn ? 'Account not found' : 'Không tìm thấy tài khoản',
      notFoundDesc: isEn ? 'The ID does not exist in the system.' : 'Mã số không tồn tại trong hệ thống.',
      retryBtn: isEn ? '<i class="fas fa-redo" style="margin-right: 6px;"></i> Retry' : '<i class="fas fa-redo" style="margin-right: 6px;"></i> Thử lại',
      errEmpty: isEn ? 'Please enter your ID!' : 'Vui lòng nhập tên đăng nhập hoặc mã số!'
    };

    Utils.showModal(t.title, `
      <div id="forgot-step-1">
        <p style="margin-bottom: var(--space-4); color: var(--text-secondary);">${t.desc1}</p>
        <div class="form-group" style="margin-bottom: 1rem;">
          <label class="form-label">${t.uniLabel}</label>
          <select id="forgot-university" class="form-control" style="padding: 12px; border-radius: var(--radius-md);">
            <!-- Populated by JS -->
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">${t.idLabel}</label>
          <input type="text" id="forgot-username" class="form-control" placeholder="${t.idPlaceholder}" style="padding: 12px; border-radius: var(--radius-md);">
        </div>
        <div id="forgot-step1-error" style="display: none; margin-top: 10px; padding: 10px 14px; background: linear-gradient(135deg, rgba(239,68,68,0.12), rgba(220,38,38,0.08)); border: 1px solid rgba(239,68,68,0.3); border-radius: var(--radius-md); color: #ef4444; font-size: 0.88rem;">
          <i class="fas fa-exclamation-triangle" style="margin-right: 8px;"></i>
          <span id="forgot-step1-error-text"></span>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: var(--space-3); margin-top: var(--space-5);">
          <button type="button" class="btn btn-ghost" onclick="Utils.closeModal()">${t.cancelBtn}</button>
          <button type="button" class="btn btn-primary" id="btn-forgot-next">${t.continueBtn}</button>
        </div>
      </div>

      <div id="forgot-step-2" style="display: none;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: var(--space-4); padding: 12px; background: var(--bg-tertiary); border-radius: var(--radius-md);">
          <i class="fas fa-user-check" style="font-size: 1.5rem; color: var(--success);"></i>
          <div>
            <div style="font-weight: 600; color: var(--text-primary);" id="forgot-found-name">${t.accountLabel}</div>
            <div style="font-size: 0.85rem; color: var(--text-secondary);" id="forgot-found-role">${t.roleLabel}</div>
          </div>
        </div>
        <p style="margin-bottom: var(--space-4); color: var(--text-secondary);">${t.desc2}</p>
        <div class="form-group">
          <label class="form-label">${t.phoneLabel}</label>
          <input type="text" id="forgot-phone" class="form-control" placeholder="${t.phonePlaceholder}" style="padding: 12px; border-radius: var(--radius-md);">
        </div>
        <div class="form-group" style="margin-top: var(--space-4);">
          <label class="form-label">${t.newPassLabel}</label>
          <input type="password" id="forgot-new-password" class="form-control" placeholder="${t.newPassPlaceholder}" style="padding: 12px; border-radius: var(--radius-md);">
        </div>
        <div class="form-group" style="margin-top: var(--space-4);">
          <label class="form-label">${t.confirmPassLabel}</label>
          <input type="password" id="forgot-confirm-password" class="form-control" placeholder="${t.confirmPassPlaceholder}" style="padding: 12px; border-radius: var(--radius-md);">
        </div>
        <div id="forgot-step2-error" style="display: none; margin-top: 10px; padding: 10px 14px; background: linear-gradient(135deg, rgba(239,68,68,0.12), rgba(220,38,38,0.08)); border: 1px solid rgba(239,68,68,0.3); border-radius: var(--radius-md); color: #ef4444; font-size: 0.88rem;">
          <i class="fas fa-exclamation-triangle" style="margin-right: 8px;"></i>
          <span id="forgot-step2-error-text"></span>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: var(--space-3); margin-top: var(--space-5);">
          <button type="button" class="btn btn-ghost" id="btn-forgot-back">${t.backBtn}</button>
          <button type="button" class="btn btn-success" id="btn-forgot-reset">${t.resetBtn}</button>
        </div>
      </div>

      <div id="forgot-success" style="display: none;">
        <div style="text-align: center; padding: var(--space-4) 0;">
          <div style="width: 80px; height: 80px; margin: 0 auto var(--space-4); background: linear-gradient(135deg, #10b981, #059669); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            <i class="fas fa-check" style="font-size: 2.5rem; color: #fff;"></i>
          </div>
          <h3 style="margin-bottom: var(--space-2); color: var(--text-primary);">${t.successTitle}</h3>
          <p style="color: var(--text-secondary);">${t.successDesc}</p>
        </div>
        <div style="display: flex; justify-content: center; margin-top: var(--space-5);">
          <button type="button" class="btn btn-primary" onclick="Utils.closeModal()">${t.backToLoginBtn}</button>
        </div>
      </div>

      <div id="forgot-error" style="display: none;">
        <div style="text-align: center; padding: var(--space-4) 0;">
          <div style="width: 80px; height: 80px; margin: 0 auto var(--space-4); background: linear-gradient(135deg, #ef4444, #dc2626); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            <i class="fas fa-times" style="font-size: 2.5rem; color: #fff;"></i>
          </div>
          <h3 style="margin-bottom: var(--space-2); color: var(--text-primary);">${t.notFoundTitle}</h3>
          <p style="color: var(--text-secondary);">${t.notFoundDesc}</p>
        </div>
        <div style="display: flex; justify-content: center; gap: var(--space-3); margin-top: var(--space-5);">
          <button type="button" class="btn btn-ghost" id="btn-forgot-retry">${t.retryBtn}</button>
          <button type="button" class="btn btn-primary" onclick="Utils.closeModal()">${t.backToLoginBtn}</button>
        </div>
      </div>
    `);

    // Hide footer from Utils.showModal to use custom footer inside content
    const modalFooter = document.getElementById('modal-footer');
    if (modalFooter) modalFooter.style.display = 'none';

    // Populate universities
    const uniSelect = document.getElementById('forgot-university');
    if (uniSelect && Database.UNIVERSITIES) {
      uniSelect.innerHTML = Database.UNIVERSITIES.map(u => {
        const uniName = isEn ? (u.enName || u.name) : u.name;
        return `<option value="${u.id}">${uniName}</option>`;
      }).join('');
    }

    let foundUser = null;

    // Step 1: Find user
    document.getElementById('btn-forgot-next').addEventListener('click', () => {
      const username = document.getElementById('forgot-username').value.trim();
      const universityId = document.getElementById('forgot-university').value;
      const errorEl = document.getElementById('forgot-step1-error');
      const errorText = document.getElementById('forgot-step1-error-text');

      if (!username) {
        errorEl.style.display = 'block';
        errorText.textContent = t.errEmpty;
        return;
      }

      const users = Database.users.getAll();
      foundUser = users.find(u => 
        u.username === username && 
        (u.role === 'admin' || u.universityId == universityId)
      );

      if (foundUser) {
        document.getElementById('forgot-step-1').style.display = 'none';
        document.getElementById('forgot-step-2').style.display = 'block';

        // Show found user info
        const nameEl = document.getElementById('forgot-found-name');
        const roleEl = document.getElementById('forgot-found-role');
        if (nameEl) nameEl.textContent = foundUser.name || foundUser.username;
        if (roleEl) {
          if (isEn) {
            const roleMapEN = { student: 'Student', teacher: 'Teacher', admin: 'Administrator' };
            roleEl.textContent = roleMapEN[foundUser.role] || foundUser.role;
          } else {
            const roleMapVN = { student: 'Sinh viên', teacher: 'Giáo viên', admin: 'Quản trị viên' };
            roleEl.textContent = roleMapVN[foundUser.role] || foundUser.role;
          }
        }
      } else {
        document.getElementById('forgot-step-1').style.display = 'none';
        document.getElementById('forgot-error').style.display = 'block';
      }
    });

    // Back button
    const backBtn = document.getElementById('btn-forgot-back');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        document.getElementById('forgot-step-2').style.display = 'none';
        document.getElementById('forgot-step-1').style.display = 'block';
        foundUser = null;
      });
    }

    // Retry button
    const retryBtn = document.getElementById('btn-forgot-retry');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        document.getElementById('forgot-error').style.display = 'none';
        document.getElementById('forgot-step-1').style.display = 'block';
        document.getElementById('forgot-username').value = '';
        document.getElementById('forgot-step1-error').style.display = 'none';
      });
    }

    // Step 2: Reset password
    document.getElementById('btn-forgot-reset').addEventListener('click', () => {
      const phone = document.getElementById('forgot-phone').value.trim();
      const newPass = document.getElementById('forgot-new-password').value;
      const confirmPass = document.getElementById('forgot-confirm-password').value;
      const errorEl = document.getElementById('forgot-step2-error');
      const errorText = document.getElementById('forgot-step2-error-text');

      const errNoUser = isEn ? 'User not found!' : 'Lỗi: Không tìm thấy người dùng!';
      const errPhone = isEn ? 'Phone number does not match registered phone!' : 'Số điện thoại không khớp với số đã đăng ký!';
      const errEmptyPass = isEn ? 'Please enter new password!' : 'Vui lòng nhập mật khẩu mới!';
      const errPassLength = isEn ? 'Password must be at least 6 characters!' : 'Mật khẩu phải có ít nhất 6 ký tự!';
      const errPassMatch = isEn ? 'Passwords do not match!' : 'Mật khẩu xác nhận không khớp!';

      if (!foundUser) {
        errorEl.style.display = 'block';
        errorText.textContent = errNoUser;
        return;
      }

      // Check phone if user has a phone set in database
      if (foundUser.phone && foundUser.phone !== phone) {
        errorEl.style.display = 'block';
        errorText.textContent = errPhone;
        return;
      }

      if (!newPass) {
        errorEl.style.display = 'block';
        errorText.textContent = errEmptyPass;
        return;
      }

      if (newPass.length < 6) {
        errorEl.style.display = 'block';
        errorText.textContent = errPassLength;
        return;
      }

      if (newPass !== confirmPass) {
        errorEl.style.display = 'block';
        errorText.textContent = errPassMatch;
        return;
      }

      // Check phone logic
      let linkedData = null;
      if (foundUser.role === 'student') linkedData = Database.students.getById(foundUser.linkedId);
      if (foundUser.role === 'teacher') linkedData = Database.teachers.getById(foundUser.linkedId);
      
      const realPhone = foundUser.phone || (linkedData && linkedData.phone) || '';

      if (realPhone && realPhone !== phone) {
        errorEl.style.display = 'block';
        errorText.textContent = 'Số điện thoại không khớp với tài khoản đã đăng ký!';
        return;
      }

      // Reset password
      const users = Database.users.getAll();
      const uIndex = users.findIndex(u => u.id === foundUser.id);
      if (uIndex !== -1) {
        users[uIndex].password = newPass;
        Database._save('unims_users', users);
        
        // Show success
        document.getElementById('forgot-step-2').style.display = 'none';
        document.getElementById('forgot-success').style.display = 'block';
        
        // Auto close modal after 1s to return to fresh login
        setTimeout(() => {
          Utils.closeModal();
          // Force back to login form state
          const toggleLoginBtn = document.getElementById('toggle-login-link');
          if (toggleLoginBtn) toggleLoginBtn.click();
        }, 1000);
      }
    });

    // Allow Enter key on username input
    const usernameInput = document.getElementById('forgot-username');
    if (usernameInput) {
      usernameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          document.getElementById('btn-forgot-next').click();
        }
      });
      // Auto-focus
      setTimeout(() => usernameInput.focus(), 200);
    }
  }
};
