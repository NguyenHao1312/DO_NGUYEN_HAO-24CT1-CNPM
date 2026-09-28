import re

with open('templates/review.html', 'r', encoding='utf-8') as f:
    content = f.read()

login_form_match = re.search(r'(<form class="rv-login-form" id="rv-login-form" autocomplete="off">.*?</form>)', content, re.DOTALL)

if login_form_match:
    login_form = login_form_match.group(1)
    
    register_form = """
          <!-- Register Form -->
          <form class="rv-login-form" id="rv-register-form" autocomplete="off" style="display: none;">
            <div class="rv-input-group">
              <label>Họ và tên</label>
              <div class="rv-input-wrapper">
                <i class="fas fa-user-edit"></i>
                <input type="text" id="rv-reg-name" placeholder="Họ và tên đầy đủ..." required>
              </div>
            </div>
            
            <div class="rv-input-group">
              <label>Mã số (Sinh viên / Giáo viên)</label>
              <div class="rv-input-wrapper">
                <i class="fas fa-id-card"></i>
                <input type="text" id="rv-reg-username" placeholder="Nhập mã số..." required>
              </div>
            </div>

            <div class="rv-input-group">
              <label>Mật khẩu</label>
              <div class="rv-input-wrapper">
                <i class="fas fa-lock"></i>
                <input type="password" id="rv-reg-password" placeholder="Tạo mật khẩu..." required>
                <i class="fas fa-eye rv-password-toggle" id="rv-reg-toggle"></i>
              </div>
            </div>

            <div class="rv-login-error" id="rv-reg-error">
              <i class="fas fa-exclamation-triangle"></i>
              <span id="rv-reg-error-text">Lỗi hệ thống</span>
            </div>

            <button type="submit" class="rv-login-submit" id="rv-reg-submit">
              <span class="rv-login-submit-text">Đăng ký <i class="fas fa-user-plus" style="margin-left: 6px;"></i></span>
              <div class="rv-login-submit-loading" style="display: none;"><i class="fas fa-circle-notch fa-spin"></i> Đang xử lý...</div>
            </button>

            <div class="rv-login-footer">
              <span style="color: var(--text-secondary);">Đã có tài khoản?</span>
              <a href="#" id="rv-back-to-login" style="color: var(--primary-500); font-weight: 600; text-decoration: none; margin-left: 4px;">Đăng nhập ngay</a>
            </div>
          </form>
"""
    
    new_content = content.replace(login_form, login_form + register_form)
    
    with open('templates/review.html', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Success")
else:
    print("Could not find login form")
