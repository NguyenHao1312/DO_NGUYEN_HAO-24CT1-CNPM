// tuition.js - Quản lý Học phí & Thanh toán QR

const TuitionView = {
  render() {
    const mainContent = document.getElementById('main-content');
    const user = Auth.getCurrentUser();
    
    if (!user || user.role !== 'student') {
      mainContent.innerHTML = `
        <div class="app-content-container">
          <div class="alert alert-warning">
            <i class="fas fa-exclamation-triangle"></i>
            ${t('student_only_tuition')}
          </div>
        </div>
      `;
      return;
    }

    const studentId = user.linkedId || user.username;
    
    // Get registrations for this student
    const allRegistrations = Database.registrations.getAll();
    const studentRegs = allRegistrations.filter(r => r.studentId === studentId);
    
    // Get class details
    const allClasses = Database.classes.getAll();
    
    // Get university pricing
    const universities = typeof UNIVERSITIES !== 'undefined' ? UNIVERSITIES : [];
    const userUni = universities.find(u => u.id === parseInt(user.universityId)) || universities[0];
    
    // Base fee from updated 2026 database (default 385,000 VND / credit)
    let feePerCredit = userUni ? (userUni.feePerCredit || 385000) : 385000;
    
    let totalCredits = 0;
    let tableRows = '';
    const isNewStudentMode = (studentRegs.length === 0);

    if (isNewStudentMode) {
      // Sinh viên mới nhập học chưa đăng ký lớp: Khung tiêu chuẩn 15 tín chỉ HK1
      const defaultCourses = [
        { code: 'MATH101', name: 'Đại số tuyến tính', credits: 3 },
        { code: 'MATH102', name: 'Giải tích 1', credits: 3 },
        { code: 'PHIL101', name: 'Triết học Mác - Lênin', credits: 3 },
        { code: 'ENGL101', name: 'Tiếng Anh chuyên ngành 1', credits: 3 },
        { code: 'INTRO101', name: 'Nhập môn Chuyên ngành & Kỹ năng số', credits: 3 },
      ];
      tableRows = defaultCourses.map(c => {
        totalCredits += c.credits;
        const fee = c.credits * feePerCredit;
        return `
          <tr>
            <td style="padding: var(--space-3); text-align: left;"><span class="badge" style="background: rgba(59, 130, 246, 0.1); color: #2563eb; font-weight:600;">${c.code}</span></td>
            <td style="padding: var(--space-3); text-align: left;"><strong>${c.name}</strong> <small style="color: var(--text-secondary); display:block;">(Khung chuẩn HK1 cho Tân sinh viên)</small></td>
            <td style="padding: var(--space-3); text-align: center; font-weight: 600;">${c.credits}</td>
            <td style="padding: var(--space-3); text-align: right; color: var(--primary-600); font-weight: 600;">
              ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(fee)}
            </td>
          </tr>
        `;
      }).join('');
    } else {
      tableRows = studentRegs.map(reg => {
        const cls = allClasses.find(c => c.id === reg.classId);
        if (cls) {
          totalCredits += cls.credits;
          const fee = cls.credits * feePerCredit;
          return `
            <tr>
              <td style="padding: var(--space-3); text-align: left;">${cls.classCode || cls.id}</td>
              <td style="padding: var(--space-3); text-align: left;"><strong>${t(cls.name)}</strong></td>
              <td style="padding: var(--space-3); text-align: center; font-weight: 600;">${cls.credits}</td>
              <td style="padding: var(--space-3); text-align: right; color: var(--primary-600); font-weight: 600;">
                ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(fee)}
              </td>
            </tr>
          `;
        }
        return '';
      }).join('');
    }

    const totalFee = totalCredits * feePerCredit;
    const formattedFeePerCredit = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(feePerCredit);
    const hasDebt = (user.tuition_debt === true || user.tuition_debt === 'true');

    mainContent.innerHTML = `
      <div class="app-content-container fade-in">
        <div class="page-header" style="margin-bottom: var(--space-4);">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
            <div>
              <h1 class="page-title" style="font-size: 1.8rem;">${t('tuition')}</h1>
              <p class="page-subtitle" style="font-size: 0.95rem;">Theo dõi số tín chỉ học kỳ & Thanh toán học phí trực tuyến</p>
            </div>
            <div>
              ${hasDebt ? `
                <span class="badge" style="background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; padding: 8px 16px; border-radius: 8px; font-weight: 700; font-size: 0.95rem; display: inline-flex; align-items: center; gap: 6px;">
                  <i class="fas fa-circle-exclamation"></i> ${t('tuition_debt_badge')}
                </span>
              ` : `
                <span class="badge" style="background: #dcfce7; color: #15803d; border: 1px solid #86efac; padding: 8px 16px; border-radius: 8px; font-weight: 700; font-size: 0.95rem; display: inline-flex; align-items: center; gap: 6px;">
                  <i class="fas fa-circle-check"></i> ${t('tuition_paid_badge')}
                </span>
              `}
            </div>
          </div>
        </div>

        ${hasDebt ? `
        <div style="background: linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(245, 158, 11, 0.08)); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 14px 18px; margin-bottom: 20px; display: flex; align-items: center; gap: 14px;">
          <div style="width: 40px; height: 40px; border-radius: 50%; background: #fee2e2; color: #dc2626; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0;">
            <i class="fas fa-hand-holding-dollar"></i>
          </div>
          <div style="font-size: 0.92rem; color: #7f1d1d; line-height: 1.5;">
            ${t('academic_tuition_note')}
          </div>
        </div>
        ` : ''}

        <div class="grid-row" style="display: grid; grid-template-columns: 2fr 1fr; gap: var(--space-6); margin-bottom: var(--space-6);">
          <div class="card glass-panel" style="padding: 0;">
            <div class="card-header" style="padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary);">
              <h3 style="margin: 0; font-size: 1.1rem; color: var(--text-primary);"><i class="fas fa-list-ul"></i> ${isNewStudentMode ? t('freshman_hk1_frame') : t('registered_courses')}</h3>
              <div style="background: rgba(20, 184, 166, 0.1); color: var(--primary-600); padding: 4px 12px; border-radius: 4px; font-size: 0.85rem; font-weight: 600;">
                <i class="fas fa-tags"></i> ${t('unit_price')}: ${formattedFeePerCredit}/${t('credit')}
              </div>
            </div>
            <div class="card-body" style="padding: 0; overflow-x: auto;">
              <table class="table" style="width: 100%; table-layout: fixed; border-collapse: collapse;">
                <thead style="background: var(--bg-secondary);">
                  <tr>
                    <th style="padding: var(--space-3); text-align: left; width: 22%;">${t('course_code')}</th>
                    <th style="padding: var(--space-3); text-align: left; width: 45%;">${t('course_name')}</th>
                    <th style="padding: var(--space-3); text-align: center; width: 13%;">${t('credit')}</th>
                    <th style="padding: var(--space-3); text-align: right; width: 20%;">${t('total')}</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableRows}
                </tbody>
                <tfoot>
                  <tr style="border-top: 2px solid var(--border-color);">
                    <th colspan="2" style="padding: var(--space-3); text-align: right; font-weight: bold; color: var(--text-primary);">${t('total_amount')} (${totalCredits} tín chỉ):</th>
                    <th style="padding: var(--space-3); text-align: center; color: var(--primary-600); font-weight: 700;">${totalCredits}</th>
                    <th style="padding: var(--space-3); text-align: right; font-size: 1.15rem; color: var(--danger); font-weight: 700;">${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalFee)}</th>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div class="card glass-panel" style="display: flex; flex-direction: column;">
            <div class="card-header" style="padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--border-color); background: var(--bg-secondary);">
              <h3 style="margin: 0; font-size: 1.1rem; color: var(--text-primary);"><i class="fas fa-file-invoice-dollar"></i> ${t('tuition_summary_title')}</h3>
            </div>
            <div class="card-body" style="padding: var(--space-4);">
              <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 4px;">Số tiền học kỳ này (${totalCredits} tín chỉ):</div>
              <div style="font-size: 1.6rem; font-weight: 700; color: ${hasDebt ? '#dc2626' : '#15803d'}; margin-bottom: var(--space-4);">${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalFee)}</div>
              
              <div style="background: rgba(245, 158, 11, 0.1); border: 1px dashed rgba(245, 158, 11, 0.4); border-radius: var(--radius-md); padding: 12px; margin-bottom: 16px;">
                <div style="font-size: 0.85rem; color: var(--warning-700); margin-bottom: 6px; font-weight: 600;"><i class="fas fa-info-circle"></i> Quy định thanh toán:</div>
                <div style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.5;">Sinh viên thực hiện chuyển khoản qua VietQR. Sau khi ngân hàng hoàn tất giao dịch, Quản trị viên Phòng Đào tạo sẽ đối soát mã sinh viên và duyệt hoàn thành học phí trên Admin Dashboard.</div>
              </div>

              <button class="btn btn-primary" style="width: 100%; justify-content: center; font-size: 1.05rem; padding: 12px; font-weight: 700;" id="btn-pay-tuition">
                <i class="fas fa-qrcode"></i> ${hasDebt ? 'Quét Mã QR Thanh Toán Ngay' : 'Xem Lại Mã QR Thanh Toán'}
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
    const studentInfo = Database.students.getAll().find(s => s.id === user.linkedId) || { id: user.linkedId, name: user.name, studentId: user.username };
    const formattedFee = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalFee);
    const syntax = `UNIMS ${studentInfo.studentId || user.username} HOCPHI HK1`;

    Utils.showModal('Cổng Thanh Toán Học Phí Qua VietQR', `
      <div style="padding: var(--space-2); color: var(--text-primary);">
        <div class="alert alert-info" style="margin-bottom: var(--space-4); display: flex; align-items: center; gap: 10px; background: rgba(59, 130, 246, 0.1); border-left: 4px solid #2563eb; padding: 12px; border-radius: 6px;">
          <i class="fas fa-info-circle" style="color: #2563eb; font-size: 1.2rem;"></i>
          <div style="font-size: 0.9rem; color: #1e40af;"><strong>Lưu ý đối soát:</strong> Vui lòng giữ nguyên nội dung chuyển khoản để hệ thống Admin đối soát tự động theo Mã Sinh Viên.</div>
        </div>
        
        <p style="margin-bottom: var(--space-2); text-align: center; font-size: 1rem;">Số tiền cần thanh toán: <strong style="color: var(--danger); font-size: 1.35rem;">${formattedFee}</strong></p>
        
        <div style="display: flex; justify-content: center; margin-top: var(--space-4); margin-bottom: var(--space-4);">
          <div style="background: #fff; border-radius: var(--radius-lg); padding: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.1); border: 1px solid var(--border-color);">
            <img src="/static/assets/logos/BANK_PAYMENT_QR.png" alt="Mã VietQR Thanh Toán" style="max-width: 280px; width: 100%; object-fit: contain; display: block; border-radius: 8px;">
          </div>
        </div>

        <div class="form-group" style="margin-top: var(--space-4);">
          <label style="font-weight: 700; font-size: 0.9rem;">Cú pháp chuyển khoản bắt buộc:</label>
          <div style="background: #f1f5f9; padding: 12px; border-left: 4px solid #2563eb; font-family: monospace; font-size: 1.15rem; font-weight: bold; color: #0f172a; margin-top: 8px; word-break: break-all; text-align: center; border-radius: 4px; letter-spacing: 1px;">
            ${syntax}
          </div>
          <small style="color: var(--text-secondary); display: block; margin-top: 8px; text-align: center; font-size: 0.85rem;">
            * Sau khi chuyển khoản thành công, Nhà trường sẽ duyệt và gỡ nợ học phí cho sinh viên trên hệ thống Admin.
          </small>
        </div>
      </div>
    `);
  }
};
