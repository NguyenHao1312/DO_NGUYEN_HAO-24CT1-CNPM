// js/views/registration.js

const RegistrationView = {
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
    const isAdmin = user && user.role === 'admin';
    if (!user || (!isAdmin && user.role !== 'student')) {
      return `<div class="page-header"><h1 class="page-title">${t('access_denied')}</h1><p>${t('student_access_only')}</p></div>`;
    }

    if (isAdmin) {
      return this.getAdminHTML();
    }
    
    return this.getStudentRegistrationHTML(user.linkedId);
  },

  getAdminHTML() {
    const students = Database.students.getAll();
    return `
      <div class="page-header" style="display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: var(--space-4);">
        <div class="page-title-section">
          <h1 class="page-title" style="font-size: 1.8rem; font-weight: 700; color: var(--text-primary); margin-bottom: 8px;">${t('admin_registration_title')}</h1>
          <p class="page-subtitle" style="font-size: 1rem; color: var(--text-secondary); max-width: 800px; line-height: 1.6;">
            ${t('admin_registration_desc')}
          </p>
        </div>
      </div>
      <div class="card" style="margin-bottom: var(--space-6);">
        <div class="card-header" style="font-weight: bold; padding: var(--space-4); border-bottom: 1px solid var(--border-color);">
          ${t('select_student_manage')}
        </div>
        <div class="card-body" style="padding: var(--space-4);">
          <select id="admin-reg-student" class="form-input" style="max-width: 400px; display: inline-block; margin-right: 16px;">
            <option value="">-- ${t('select_student')} --</option>
            ${students.map(s => `<option value="${s.id}">${s.studentId} - ${s.name}</option>`).join('')}
          </select>
          <button class="btn btn-primary" id="btn-admin-load-reg">${t('continue_btn')}</button>
        </div>
      </div>
      <div id="admin-reg-content"></div>
    `;
  },

  getStudentRegistrationHTML(studentId, isAdminOverride = false) {
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    const date = now.getDate();
    // Registration period: July 1st to August 15th
    const isRegistrationOpen = isAdminOverride || ((month === 7) || (month === 8 && date <= 15));
    const selectedSemester = 'HK1 2026-2027'; // Default for the demo

    // Get actual classes from Database
    let allClasses = Database.classes.getAll() || [];
    // Only show classes for current semester or all if no semester specified
    let curriculum = allClasses.filter(c => !c.semester || c.semester === selectedSemester || c.semester === 'HK1 - 2026-2027' || true); // Showing all for demo purposes, since mock classes might not have strict semesters

    // Get student's current registrations
    const studentRegistrations = Database.registrations ? Database.registrations.getByStudentId(studentId) : [];
    const registeredClassIds = studentRegistrations.map(r => r.classId);

    // Get university pricing
    let userUni = null;
    const user = Auth.getCurrentUser();
    const targetStudent = Database.students.getById(studentId);
    
    const universities = typeof UNIVERSITIES !== 'undefined' ? UNIVERSITIES : [];
    if (isAdminOverride && targetStudent) {
       // Assume admin uses default uni for demo
       userUni = universities[0];
    } else {
       userUni = universities.find(u => u.id === parseInt(user.universityId)) || universities[0];
    }
    
    // Base fee + 10% if applicable
    let feePerCredit = userUni ? (userUni.feePerCredit || 350000) : 350000;
    if (userUni && userUni.hasAnnualIncrease) {
      feePerCredit = feePerCredit * 1.1; // Tăng 10%
    }
    const formattedFeePerCredit = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(feePerCredit);

    return `
      ${!isAdminOverride ? `
      <div class="page-header" style="display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: var(--space-4);">
        <div class="page-title-section">
          <h1 class="page-title" style="font-size: 1.8rem; font-weight: 700; color: var(--text-primary); margin-bottom: 8px;">${t('course_reg')}</h1>
          <p class="page-subtitle" style="font-size: 1rem; color: var(--text-secondary); max-width: 800px; line-height: 1.6;">
            ${t('course_reg_desc')}
          </p>
        </div>
        <div style="background: ${isRegistrationOpen ? 'var(--success-100)' : 'var(--danger-100)'}; color: ${isRegistrationOpen ? 'var(--success-700)' : 'var(--danger-700)'}; padding: 8px 16px; border-radius: 8px; font-weight: 600; display: flex; align-items: center; gap: 8px; font-size: 0.95rem; border: 1px solid ${isRegistrationOpen ? 'var(--success-200)' : 'var(--danger-200)'};">
          <i class="fas ${isRegistrationOpen ? 'fa-door-open' : 'fa-lock'}"></i>
          <div>
            <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.8;">${t('status')}</div>
            <div>${isRegistrationOpen ? t('reg_open') : t('reg_closed')}</div>
          </div>
        </div>
      </div>
      ` : ''}

      <div class="grid-row" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: var(--space-6);">
        
        <!-- Chương trình khung -->
        <div class="card" style="display: flex; flex-direction: column;">
          <div class="card-header" style="padding: var(--space-4); border-bottom: 1px solid var(--border-color); font-weight: 600; font-size: 1.1rem; color: var(--text-primary);">
            <i class="fas fa-sitemap" style="color: #8b5cf6; margin-right: 8px;"></i> ${t('curriculum')}
          </div>
          <div class="card-body" style="padding: 0; max-height: 500px; overflow-y: auto;">
            <table class="table" style="width: 100%; border-collapse: collapse;">
              <thead style="position: sticky; top: 0; background: var(--bg-primary); z-index: 1; border-bottom: 2px solid var(--border-color);">
                <tr>
                  <th style="padding: 12px; text-align: left; font-weight: 600; color: var(--text-secondary);">${t('course_code')}</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600; color: var(--text-secondary);">${t('course_name')}</th>
                  <th style="padding: 12px; text-align: center; font-weight: 600; color: var(--text-secondary);">${t('credit')}</th>
                  <th style="padding: 12px; text-align: center; font-weight: 600; color: var(--text-secondary);">${t('type')}</th>
                </tr>
              </thead>
              <tbody>
                ${curriculum.map(c => `
                  <tr style="border-bottom: 1px solid var(--border-color); transition: background-color 0.2s;">
                    <td style="padding: 12px; font-weight: 500;">${c.classCode || c.id.substring(0, 6).toUpperCase()}</td>
                    <td style="padding: 12px;">
                      <div>${t(c.name)}</div>
                      <span style="font-size: 0.75rem; background: var(--bg-tertiary); padding: 2px 6px; border-radius: 4px; color: var(--text-secondary); margin-top: 4px; display: inline-block;">${t(c.type || 'Bắt buộc')}</span>
                    </td>
                    <td style="padding: 12px; text-align: center;">${c.credits || 3}</td>
                    <td style="padding: 12px; text-align: center;">${t(c.type || 'Chính khóa')}</td>
                  </tr>
                `).join('')}
                ${curriculum.length === 0 ? `<tr><td colspan="4" style="text-align:center; padding: 20px;">${t('no_courses') || 'Không có môn học nào'}</td></tr>` : ''}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Đăng ký học kỳ -->
        <div class="card" style="display: flex; flex-direction: column;">
          <div class="card-header" style="padding: var(--space-4); border-bottom: 1px solid var(--border-color); font-weight: 600; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <i class="fas fa-edit" style="color: var(--primary-500); margin-right: 8px;"></i> ${t('reg_semester')} ${isAdminOverride ? (targetStudent ? 'cho ' + targetStudent.name : '') : ''}
            </div>
            <select class="form-input" style="padding: 4px 28px 4px 12px; font-size: 0.85rem; border-radius: var(--radius-sm); border: 1px solid #e2e8f0; color: var(--text-secondary);">
              <option>${selectedSemester}</option>
            </select>
          </div>
          <div class="card-body" style="padding: 0; display: flex; flex-direction: column; flex: 1;">
            <div style="padding: var(--space-4); background: var(--bg-secondary); border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
              <p style="margin-bottom: 0; color: var(--text-secondary); font-size: 0.9rem;">${t('select_courses')}</p>
              <div style="background: rgba(20, 184, 166, 0.1); color: var(--primary-600); padding: 4px 12px; border-radius: 4px; font-size: 0.85rem; font-weight: 600;">
                <i class="fas fa-money-bill-wave"></i> ${t('unit_price')}: ${formattedFeePerCredit}/tín chỉ
              </div>
            </div>
            <div style="flex: 1; overflow-y: auto; max-height: 380px;">
              <table class="table" style="width: 100%; border-collapse: collapse;">
                <tbody>
                  ${curriculum.map(c => {
                    // Calculate current students (registrations + existing grades)
                    const regCount = Database.registrations ? Database.registrations.getByClassId(c.id).length : 0;
                    const gradeCount = Database.grades.getByClassId(c.id).length;
                    const currentStudents = regCount + gradeCount;
                    const maxStudents = c.maxStudents || 40;
                    
                    const isFull = currentStudents >= maxStudents;
                    const isRegistered = registeredClassIds.includes(c.id);
                    
                    let statusHtml = '';
                    let isDisabled = false;
                    
                    if (isRegistered) {
                      statusHtml = `<span style="color: var(--success); font-size: 0.8rem; font-weight: 600;"><i class="fas fa-check-circle"></i> ${t('already_reg')}</span>`;
                      // Admin can unregister if they want? We'll leave it checked and disabled for simplicity, or maybe admin can toggle.
                      // Let's allow admin to toggle registration.
                      isDisabled = !isAdminOverride; 
                    } else if (isFull) {
                      statusHtml = `<span style="color: var(--danger); font-size: 0.8rem; font-weight: 600;"><i class="fas fa-times-circle"></i> ${t('full_slot')}</span>`;
                      isDisabled = !isAdminOverride; // Admin can force register
                    } else {
                      statusHtml = `<span style="color: var(--text-secondary); font-size: 0.8rem;">${t('slot_count')}: ${currentStudents}/${maxStudents}</span>`;
                    }
                    
                    if (!isRegistrationOpen) isDisabled = true;

                    return `
                    <tr style="border-bottom: 1px solid var(--border-color); ${isRegistered ? 'background: var(--success-100);' : ''}">
                      <td style="padding: 12px; width: 40px; text-align: center;">
                        <input type="checkbox" class="course-checkbox" data-class-id="${c.id}" data-credits="${c.credits || 3}" 
                          ${isDisabled ? 'disabled' : ''} ${isRegistered ? 'checked' : ''} 
                          style="width: 16px; height: 16px; cursor: ${isDisabled ? 'not-allowed' : 'pointer'}; accent-color: var(--primary-500);">
                      </td>
                      <td style="padding: 12px;">
                        <div style="font-weight: 500; color: var(--text-primary);">${t(c.name)}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">
                          ${c.classCode || c.id.substring(0, 6).toUpperCase()} - ${c.credits || 3} ${t('tín chỉ')}
                        </div>
                      </td>
                      <td style="padding: 12px; text-align: right;">
                        ${statusHtml}
                      </td>
                      <td style="padding: 12px; text-align: right; font-weight: 500; color: var(--primary-600);">
                        ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format((c.credits || 3) * feePerCredit)}
                      </td>
                    </tr>
                  `}).join('')}
                </tbody>
              </table>
            </div>
            <div style="padding: var(--space-4); border-top: 1px solid var(--border-color); background: var(--bg-secondary); display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="color: var(--text-secondary); font-size: 0.9rem;">${t('total_reg_credits')}: <span id="total-selected-credits" style="font-weight: 700; color: var(--text-primary); font-size: 1.1rem;">0</span></div>
                <div style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 4px;">${t('est_tuition')}: <span id="total-selected-fee" style="font-weight: 700; color: var(--warning); font-size: 1.1rem;">0 ₫</span></div>
              </div>
              <button class="btn btn-primary" id="btn-submit-registration" data-student-id="${studentId}" data-is-admin="${isAdminOverride}" ${isRegistrationOpen ? '' : 'disabled'}>
                <i class="fas fa-save"></i> ${t('save_reg')}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  attachEvents() {
    const user = Auth.getCurrentUser();
    
    // Attach listener for Admin Student Selection
    const btnAdminLoad = document.getElementById('btn-admin-load-reg');
    if (btnAdminLoad) {
       btnAdminLoad.addEventListener('click', () => {
          const studentId = document.getElementById('admin-reg-student').value;
          if (!studentId) {
             Utils.toast(t('select_student') || 'Vui lòng chọn sinh viên', 'warning');
             return;
          }
          const contentDiv = document.getElementById('admin-reg-content');
          contentDiv.innerHTML = this.getStudentRegistrationHTML(studentId, true);
          this.attachRegistrationEvents(studentId, true);
       });
    }

    if (user && user.role === 'student') {
       this.attachRegistrationEvents(user.linkedId, false);
    }
  },
  
  attachRegistrationEvents(studentId, isAdminOverride = false) {
    const user = Auth.getCurrentUser();
    const universities = typeof UNIVERSITIES !== 'undefined' ? UNIVERSITIES : [];
    
    let userUni = null;
    const targetStudent = Database.students.getById(studentId);
    if (isAdminOverride && targetStudent) {
       userUni = universities[0];
    } else {
       userUni = universities.find(u => u.id === parseInt(user.universityId)) || universities[0];
    }
    
    let feePerCredit = userUni ? (userUni.feePerCredit || 350000) : 350000;
    if (userUni && userUni.hasAnnualIncrease) {
      feePerCredit = feePerCredit * 1.1;
    }
    
    const checkboxes = document.querySelectorAll('.course-checkbox');
    const submitBtn = document.getElementById('btn-submit-registration');

    const updateCredits = () => {
      let totalCredits = 0;
      checkboxes.forEach(cb => {
        if (cb.checked) {
          totalCredits += parseInt(cb.dataset.credits);
        }
      });
      
      const totalFee = totalCredits * feePerCredit;
      
      const totalCreditsEl = document.getElementById('total-selected-credits');
      const totalFeeEl = document.getElementById('total-selected-fee');
      if (totalCreditsEl) totalCreditsEl.textContent = totalCredits;
      if (totalFeeEl) totalFeeEl.textContent = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalFee);
    };

    // Initial count
    updateCredits();

    checkboxes.forEach(cb => {
      cb.addEventListener('change', updateCredits);
    });

    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        const studentToRegister = studentId;
        if (!studentToRegister) return;

        let selectedIds = [];
        checkboxes.forEach(cb => {
          if (cb.checked && !cb.disabled) {
            selectedIds.push(cb.dataset.classId);
          }
        });

        const t = App.t ? App.t.bind(App) : window.t;

        if (selectedIds.length === 0 && !isAdminOverride) {
          Utils.showToast(t('please_select_course'), 'warning');
          return;
        }

        // Show loading state
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${t('processing')}`;
        submitBtn.disabled = true;

        setTimeout(() => {
          let successCount = 0;
          
          if (isAdminOverride) {
             // For admin, we should delete existing registrations for this student and add new ones (sync)
             const existingRegs = Database.registrations.getByStudentId(studentToRegister);
             existingRegs.forEach(r => Database.registrations.remove(studentToRegister, r.classId));
          }
          
          selectedIds.forEach(classId => {
            // Check if already registered to avoid duplicates
            const existing = Database.registrations.getByStudentId(studentToRegister).find(r => r.classId === classId);
            if (!existing) {
               if (Database.registrations.add(studentToRegister, classId, 'HK1 2026-2027')) {
                 successCount++;
               }
            }
          });

          if (successCount > 0 || isAdminOverride) {
            if (isAdminOverride) {
               Utils.showToast(t('admin_reg_success') || 'Đã điều chỉnh đăng ký học phần thành công!', 'success');
               if (Utils.logActivity) {
                  Utils.logActivity('updated', 'registration', studentToRegister, `Admin đã điều chỉnh học phần cho SV ${studentToRegister}`);
               }
            } else {
               Utils.showToast(t('reg_success', { count: successCount }), 'success');
               if (Utils.logActivity && successCount > 0) {
                  Utils.logActivity('created', 'registration', studentToRegister, `Sinh viên ${studentToRegister} đã đăng ký ${successCount} học phần`);
               }
            }
            // Re-render to show updated status
            if (isAdminOverride) {
               const contentDiv = document.getElementById('admin-reg-content');
               if (contentDiv) {
                  contentDiv.innerHTML = this.getStudentRegistrationHTML(studentId, true);
                  this.attachRegistrationEvents(studentId, true);
               }
            } else {
               this.render();
            }
            
            setTimeout(() => {
              window.location.reload();
            }, 800);
          } else {
            Utils.showToast(t('reg_failed'), 'error');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
          }
        }, 800); // Simulate network delay
      });
    }
  }
};
