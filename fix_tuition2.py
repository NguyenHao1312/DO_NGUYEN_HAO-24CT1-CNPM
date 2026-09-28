import codecs

with codecs.open(r'd:\24CT1-DO_NGUYEN_HAO\static\js\views\tuition.js', 'r', 'utf-8') as f:
    content = f.read()

start_str = "  showPaymentModal(user, totalFee) {"
start_idx = content.find(start_str)

if start_idx != -1:
    new_method = '''  showPaymentModal(user, totalFee) {
    const studentInfo = Database.students.getAll().find(s => s.id === user.linkedId) || { id: user.linkedId, name: user.name, studentId: user.username };
    const formattedFee = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalFee);
    const syntax = (studentInfo.studentId || user.username) + " - " + (studentInfo.name || user.name);

    Utils.showModal(t('tuition_payment'), 
      <div style="padding: var(--space-2); color: var(--text-primary);">
        <div class="alert alert-info" style="margin-bottom: var(--space-4);">
          <i class="fas fa-info-circle"></i>
          <strong>:</strong> Quét mã QR dưới đây để thanh toán học phí. Vui lòng nhập đúng cú pháp chuyển khoản.
        </div>
        
        <p style="margin-bottom: var(--space-2); text-align: center;">Số tiền cần thanh toán: <strong style="color: var(--danger); font-size: 1.2rem;"></strong></p>
        
        <div style="display: flex; justify-content: center; margin-top: var(--space-4); margin-bottom: var(--space-4);">
          <img src="/static/assets/logos/BANK_PAYMENT.jpg" alt="QR Thanh toán" style="max-width: 300px; width: 100%; object-fit: contain; border-radius: var(--radius-lg); mix-blend-mode: multiply;">
        </div>

        <div class="form-group" style="margin-top: var(--space-4);">
          <label style="font-weight: 600;">Cú pháp chuyển khoản:</label>
          <div style="background: var(--primary-50); padding: 12px; border-left: 4px solid var(--primary-500); font-family: monospace; font-size: 1.1rem; font-weight: bold; color: var(--primary-800); margin-top: 8px; word-break: break-all; text-align: center;">
            
          </div>
          <small style="color: var(--text-secondary); display: block; margin-top: 8px; text-align: center;">* Hệ thống sẽ cập nhật trạng thái sau khi xác nhận thanh toán thành công (Thủ công).</small>
        </div>
      </div>
    );
  }
};
'''
    content = content[:start_idx] + new_method
    
    with codecs.open(r'd:\24CT1-DO_NGUYEN_HAO\static\js\views\tuition.js', 'w', 'utf-8') as f:
        f.write(content)
    print("Success")
else:
    print("Not found")
