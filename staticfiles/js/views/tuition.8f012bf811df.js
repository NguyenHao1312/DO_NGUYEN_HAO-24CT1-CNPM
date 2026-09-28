// tuition.js - Quản lý Học phí (Mô phỏng)

const TuitionView = {
  render() {
    const mainContent = document.getElementById('main-content');
    const user = Auth.getCurrentUser();
    
    if (!user || user.role !== 'student') {
      mainContent.innerHTML = `
        <div class="app-content-container">
          <div class="alert alert-warning">
            <i class="fas fa-exclamation-triangle"></i>
            Chỉ sinh viên mới có thể xem thông tin học phí. / Only students can view tuition information.
          </div>
        </div>
      `;
      return;
    }

    const studentId = user.linkedId;
    
    // Get registrations for this student
    const allRegistrations = Database.registrations.getAll();
    const studentRegs = allRegistrations.filter(r => r.studentId === studentId);
    
    // Get class details
    const allClasses = Database.classes.getAll();
    
    // Get university pricing
    const universities = typeof UNIVERSITIES !== 'undefined' ? UNIVERSITIES : [];
    const userUni = universities.find(u => u.id === parseInt(user.universityId)) || universities[0];
    
    // Base fee from updated 2026 database
    let feePerCredit = userUni ? (userUni.feePerCredit || 350000) : 350000;
    
    let totalCredits = 0;
    
    const tableRows = studentRegs.map(reg => {
      const cls = allClasses.find(c => c.id === reg.classId);
      if (cls) {
        totalCredits += cls.credits;
        const fee = cls.credits * feePerCredit;
        return `
          <tr>
            <td style="padding: var(--space-3); text-align: left;">${cls.classCode || cls.id}</td>
            <td style="padding: var(--space-3); text-align: left;"><strong>${t(cls.name)}</strong></td>
            <td style="padding: var(--space-3); text-align: center;">${cls.credits}</td>
            <td style="padding: var(--space-3); text-align: right; color: var(--primary-600); font-weight: 500;">
              ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(fee)}
            </td>
          </tr>
        `;
      }
      return '';
    }).join('');

    const totalFee = totalCredits * feePerCredit;
    const formattedFeePerCredit = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(feePerCredit);

    mainContent.innerHTML = `
      <div class="app-content-container fade-in">
        <div class="page-header" style="margin-bottom: var(--space-4);">
          <h1 class="page-title" style="font-size: 1.8rem;">${t('tuition')}</h1>
          <p class="page-subtitle" style="font-size: 0.95rem;">${t('tuition_desc')}</p>
        </div>

        <div class="grid-row" style="display: grid; grid-template-columns: 2fr 1fr; gap: var(--space-6); margin-bottom: var(--space-6);">
          <div class="card glass-panel" style="padding: 0;">
            <div class="card-header" style="padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary);">
              <h3 style="margin: 0; font-size: 1.1rem; color: var(--text-primary);"><i class="fas fa-list-ul"></i> ${t('registered_courses')}</h3>
              <div style="background: rgba(20, 184, 166, 0.1); color: var(--primary-600); padding: 4px 12px; border-radius: 4px; font-size: 0.85rem; font-weight: 600;">
                <i class="fas fa-tags"></i> ${t('unit_price')}: ${formattedFeePerCredit}/${t('credit')}
              </div>
            </div>
            <div class="card-body" style="padding: 0; overflow-x: auto;">
              <table class="table" style="width: 100%; table-layout: fixed; border-collapse: collapse;">
                <thead style="background: var(--bg-secondary);">
                  <tr>
                    <th style="padding: var(--space-3); text-align: left; width: 20%;">${t('course_code')}</th>
                    <th style="padding: var(--space-3); text-align: left; width: 45%;">${t('course_name')}</th>
                    <th style="padding: var(--space-3); text-align: center; width: 15%;">${t('credit')}</th>
                    <th style="padding: var(--space-3); text-align: right; width: 20%;">${t('total')}</th>
                  </tr>
                </thead>
                <tbody>
                  ${studentRegs.length > 0 ? tableRows : `<tr><td colspan="4" style="text-align: center; padding: 20px; color: var(--text-tertiary);">${t('no_reg_courses')}</td></tr>`}
                </tbody>
                ${studentRegs.length > 0 ? `
                <tfoot>
                  <tr style="border-top: 2px solid var(--border-color);">
                    <th colspan="2" style="padding: var(--space-3); text-align: right; font-weight: bold; color: var(--text-primary);">${t('total_amount')}:</th>
                    <th style="padding: var(--space-3); text-align: center; color: var(--primary-600);">${totalCredits}</th>
                    <th style="padding: var(--space-3); text-align: right; font-size: 1.1rem; color: var(--danger);">${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalFee)}</th>
                  </tr>
                </tfoot>
                ` : ''}
              </table>
            </div>
          </div>

          <div class="card glass-panel" style="display: flex; flex-direction: column;">
            <div class="card-header" style="padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--border-color); background: var(--bg-secondary);">
              <h3 style="margin: 0; font-size: 1.1rem; color: var(--text-primary);"><i class="fas fa-file-invoice-dollar"></i> ${t('total_tuition')}</h3>
            </div>
            <div class="card-body" style="padding: var(--space-4);">
              <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 4px;">${t('total_credits_fee')}</div>
              <div style="font-size: 1.6rem; font-weight: 700; color: var(--primary-600); margin-bottom: var(--space-4);">${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalFee)}</div>
              
              <div style="background: rgba(245, 158, 11, 0.1); border: 1px dashed rgba(245, 158, 11, 0.4); border-radius: var(--radius-md); padding: 12px; margin-bottom: 16px;">
                <div style="font-size: 0.85rem; color: var(--warning-700); margin-bottom: 8px;"><i class="fas fa-info-circle"></i> ${t('notice')}</div>
                <div style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.5;">${t('payment_deadline_desc')}</div>
              </div>

              <button class="btn btn-primary" style="width: 100%; justify-content: center; font-size: 1.05rem; padding: 10px;" id="btn-pay-tuition">
                <i class="fas fa-credit-card"></i> ${t('pay_tuition')}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    const btnPay = document.getElementById('btn-pay-tuition');
    if (btnPay) {
      btnPay.addEventListener('click', () => {
        this.showPaymentModal(user, totalFee);
      });
    }
  },

  showPaymentModal(user, totalFee) {
    const studentInfo = Database.students.getAll().find(s => s.id === user.linkedId) || { id: user.linkedId, name: user.name };
    const formattedFee = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalFee);

    Utils.showModal(t('tuition_payment'), `
      <div style="padding: var(--space-2); color: var(--text-primary);">
        <div class="alert alert-info" style="margin-bottom: var(--space-4);">
          <i class="fas fa-info-circle"></i>
          <strong>${t('note')}:</strong> ${t('payment_warning')}
        </div>
        
        <p style="margin-bottom: var(--space-2);">${t('please_transfer')} <strong>${formattedFee}</strong> ${t('to_the_following_accounts')}:</p>
        
        <div style="display: flex; flex-direction: column; gap: var(--space-3); margin-top: var(--space-4);">
          <div style="border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: var(--space-4); background: var(--bg-tertiary); display: flex; align-items: center; gap: var(--space-4);">
            <div style="font-size: 2rem; color: #1f3c88; font-weight: 800; min-width: 80px; text-align: center;">MB</div>
            <div>
              <div style="font-weight: 600; font-size: 1.1rem;">${t('mb_bank')}</div>
              <div style="color: var(--text-secondary); font-family: monospace; font-size: 1.1rem; margin: 4px 0;">${t('account_number')}: <strong>0123 456 789 999</strong></div>
              <div style="color: var(--text-secondary); font-size: 0.9rem;">${t('account_holder')}: TRUONG DAI HOC XYZ</div>
            </div>
          </div>

          <div style="border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: var(--space-4); background: var(--bg-tertiary); display: flex; align-items: center; gap: var(--space-4);">
            <div style="font-size: 2rem; color: #006846; font-weight: 800; min-width: 80px; text-align: center;">VCB</div>
            <div>
              <div style="font-weight: 600; font-size: 1.1rem;">${t('vcb_bank')}</div>
              <div style="color: var(--text-secondary); font-family: monospace; font-size: 1.1rem; margin: 4px 0;">${t('account_number')}: <strong>0041 000 111 222</strong></div>
              <div style="color: var(--text-secondary); font-size: 0.9rem;">${t('account_holder')}: TRUONG DAI HOC XYZ</div>
            </div>
          </div>
        </div>

        <div class="form-group" style="margin-top: var(--space-4);">
          <label style="font-weight: 600;">${t('transfer_syntax')}:</label>
          <div style="background: var(--primary-50); padding: 12px; border-left: 4px solid var(--primary-500); font-family: monospace; font-size: 1.1rem; font-weight: bold; color: var(--primary-800); margin-top: 8px; word-break: break-all;">
            ${studentInfo.studentId} - ${studentInfo.name.toUpperCase()} - HOC PHI HK1
          </div>
          <small style="color: var(--text-secondary); display: block; margin-top: 8px;">${t('payment_note')}</small>
        </div>

      </div>
    `);
  }
};
