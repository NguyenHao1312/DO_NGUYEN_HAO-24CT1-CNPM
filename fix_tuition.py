import re

with open(r'd:\24CT1-DO_NGUYEN_HAO\static\js\views\tuition.js', 'r', encoding='utf-8') as f:
    content = f.read()

replacement = '''  showPaymentModal(user, totalFee) {
    const studentInfo = Database.students.getAll().find(s => s.id === user.linkedId) || { id: user.linkedId, name: user.name, studentId: user.username };
    const formattedFee = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalFee);

    Utils.showModal(t('tuition_payment'), 
      <div style="padding: var(--space-2); color: var(--text-primary);">
        <div class="alert alert-info" style="margin-bottom: var(--space-4);">
          <i class="fas fa-info-circle"></i>
          <strong>\:</strong> \
        </div>
        
        <p style="margin-bottom: var(--space-2); text-align: center;">\ <strong style="color: var(--danger); font-size: 1.2rem;">\</strong></p>
        
        <div style="display: flex; justify-content: center; margin-top: var(--space-4); margin-bottom: var(--space-4);">
          <img src="/static/assets/logos/BANK_PAYMENT.jpg" alt="QR Thanh toán" style="max-width: 300px; width: 100%; object-fit: contain; mix-blend-mode: multiply;">
        </div>

        <div class="form-group" style="margin-top: var(--space-4);">
          <label style="font-weight: 600;">\:</label>
          <div style="background: var(--primary-50); padding: 12px; border-left: 4px solid var(--primary-500); font-family: monospace; font-size: 1.1rem; font-weight: bold; color: var(--primary-800); margin-top: 8px; word-break: break-all; text-align: center;">
            \ - \
          </div>
          <small style="color: var(--text-secondary); display: block; margin-top: 8px; text-align: center;">\</small>
        </div>

      </div>
    );
  }'''

content = re.sub(
    r"  showPaymentModal\(user, totalFee\)\s*\{.+?\}\s*\n  \}",
    replacement,
    content,
    flags=re.DOTALL
)

with open(r'd:\24CT1-DO_NGUYEN_HAO\static\js\views\tuition.js', 'w', encoding='utf-8') as f:
    f.write(content)
