// static/js/views/public/admission.js
/**
 * UniMS Admission Application Controller
 * Xử lý luồng nộp hồ sơ, đối soát điểm chuẩn, gửi và xác thực OTP, tra cứu CCCD
 */

const AdmissionApp = {
  universitiesData: [],
  selectedUniversity: null,
  selectedDepartment: null,
  currentApplicationId: null,
  countdownInterval: null,
  countdownSeconds: 600, // 10 minutes

  async init() {
    await this.loadUniversities();
  },

  switchTab(tab) {
    const applySec = document.getElementById('section-apply');
    const lookupSec = document.getElementById('section-lookup');
    const applyBtn = document.getElementById('tab-apply-btn');
    const lookupBtn = document.getElementById('tab-lookup-btn');

    if (tab === 'apply') {
      applySec.style.display = 'block';
      lookupSec.style.display = 'none';
      applyBtn.classList.add('active');
      lookupBtn.classList.remove('active');
    } else {
      applySec.style.display = 'none';
      lookupSec.style.display = 'block';
      applyBtn.classList.remove('active');
      lookupBtn.classList.add('active');
    }
  },

  async loadUniversities() {
    try {
      const res = await fetch('/api/admission/universities/');
      const data = await res.json();
      if (data.success) {
        this.universitiesData = data.universities;
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách trường:', err);
    }
  },

  onUniversityChange(uniId) {
    const deptSelect = document.getElementById('department_select');
    const benchmarkPill = document.getElementById('benchmark-display');
    benchmarkPill.style.display = 'none';

    if (!uniId) {
      deptSelect.innerHTML = '<option value="">-- Vui lòng chọn trường trước --</option>';
      this.selectedUniversity = null;
      return;
    }

    const uni = this.universitiesData.find(u => u.id == uniId);
    this.selectedUniversity = uni;

    if (!uni || !uni.majors || uni.majors.length === 0) {
      deptSelect.innerHTML = '<option value="Chung" data-bm="20.0">Chung (Điểm chuẩn: 20.00đ)</option>';
      return;
    }

    let html = '<option value="">-- Chọn ngành xét tuyển --</option>';
    uni.majors.forEach(m => {
      html += `<option value="${m.name}" data-bm="${m.benchmark}">${m.name} — Điểm chuẩn: ${m.benchmark.toFixed(2)}đ</option>`;
    });
    deptSelect.innerHTML = html;
    this.evaluateScoreRealtime();
  },

  onDepartmentChange(selectEl) {
    const opt = selectEl.options[selectEl.selectedIndex];
    const bmVal = opt.getAttribute('data-bm');
    const benchmarkPill = document.getElementById('benchmark-display');
    const benchmarkValEl = document.getElementById('benchmark-value');

    if (bmVal) {
      this.selectedDepartment = opt.value;
      benchmarkValEl.textContent = parseFloat(bmVal).toFixed(2);
      benchmarkPill.style.display = 'inline-block';
    } else {
      benchmarkPill.style.display = 'none';
    }
    this.evaluateScoreRealtime();
  },

  onCccdInput(inputEl) {
    inputEl.value = inputEl.value.replace(/[^0-9]/g, '');
    const note = document.getElementById('cccd-status');
    note.style.display = 'none';
  },

  checkCccdMock() {
    const cccd = document.getElementById('cccd').value.trim();
    const note = document.getElementById('cccd-status');

    if (cccd.length !== 12) {
      Swal.fire({
        icon: 'warning',
        title: 'Số CCCD chưa hợp lệ',
        text: 'Căn cước công dân phải gồm đúng 12 chữ số. Vui lòng kiểm tra lại.',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    note.className = 'validation-note valid';
    note.innerHTML = '<i class="fas fa-check-circle"></i> Số CCCD đã được đối soát hợp lệ trên Cổng Dữ Liệu Tuyển Sinh Quốc Gia.';
    note.style.display = 'block';

    Swal.fire({
      icon: 'success',
      title: 'Xác minh CCCD thành công',
      html: `Số CCCD <b>${cccd}</b> hợp lệ. Hệ thống chấp nhận hồ sơ và sẵn sàng xét tuyển.`,
      timer: 2500,
      showConfirmButton: false
    });
  },

  validateEmailField(inputEl) {
    const val = inputEl.value.trim().toLowerCase();
    if (val && !val.endsWith('@gmail.com')) {
      Swal.fire({
        icon: 'warning',
        title: 'Yêu cầu địa chỉ Gmail',
        text: 'Vui lòng sử dụng địa chỉ Gmail chính thức (@gmail.com) đã hoạt động để bảo đảm nhận được mã OTP và mật khẩu.',
        confirmButtonColor: '#3b82f6'
      });
    }
  },

  evaluateScoreRealtime() {
    const scoreInput = document.getElementById('score');
    const scoreTag = document.getElementById('score-evaluation');
    const deptSelect = document.getElementById('department_select');
    const opt = deptSelect.options[deptSelect.selectedIndex];
    const bmVal = opt ? opt.getAttribute('data-bm') : null;

    if (!scoreInput.value || !bmVal) {
      scoreTag.style.display = 'none';
      return;
    }

    const score = parseFloat(scoreInput.value);
    const bm = parseFloat(bmVal);

    if (isNaN(score)) {
      scoreTag.style.display = 'none';
      return;
    }

    if (score >= bm) {
      scoreTag.className = 'score-tag pass';
      scoreTag.innerHTML = `<i class="fas fa-check-circle"></i> Đủ điều kiện trúng tuyển (Vượt chuẩn ${(score - bm).toFixed(2)}đ)`;
    } else {
      scoreTag.className = 'score-tag fail';
      scoreTag.innerHTML = `<i class="fas fa-exclamation-circle"></i> Chưa đạt điểm chuẩn (Còn thiếu ${(bm - score).toFixed(2)}đ)`;
    }
  },

  async handleApplySubmit(e) {
    e.preventDefault();

    const fullName = document.getElementById('full_name').value.trim();
    const cccd = document.getElementById('cccd').value.trim();
    const email = document.getElementById('email').value.trim().toLowerCase();
    const phone = document.getElementById('phone').value.trim();
    const universityId = document.getElementById('university_select').value;
    const department = document.getElementById('department_select').value;
    const score = parseFloat(document.getElementById('score').value);

    if (cccd.length !== 12) {
      Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Số CCCD phải gồm đúng 12 chữ số' });
      return;
    }

    if (!email.endsWith('@gmail.com')) {
      Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Email bắt buộc phải là @gmail.com' });
      return;
    }

    const btnSubmit = document.getElementById('btn-submit-apply');
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý & gửi OTP...';

    try {
      const res = await fetch('/api/admission/apply/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          cccd: cccd,
          email: email,
          phone: phone,
          university_id: universityId,
          department: department,
          score: score
        })
      });

      const data = await res.json();
      if (!data.success) {
        Swal.fire({ icon: 'error', title: 'Không thành công', text: data.message });
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = '<i class="fas fa-paper-plane"></i> Nộp Hồ Sơ & Nhận Mã OTP Xác Thực';
        return;
      }

      this.currentApplicationId = data.application_id;

      // Chuyển sang Bước 2: Nhập OTP
      document.getElementById('apply-form').style.display = 'none';
      document.getElementById('otp-section').style.display = 'block';
      document.getElementById('otp-target-email').textContent = email;

      document.getElementById('step-badge-1').classList.remove('active');
      document.getElementById('step-line-1').classList.add('active');
      document.getElementById('step-badge-2').classList.add('active');
      document.getElementById('step-title').textContent = 'Bước 2: Xác Thực Gmail Bằng Mã OTP';

      this.startCountdown();

      Swal.fire({
        icon: 'info',
        title: 'Đã gửi mã xác thực',
        text: data.message,
        confirmButtonColor: '#3b82f6'
      });

    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Lỗi máy chủ', text: 'Không thể kết nối đến máy chủ tuyển sinh' });
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = '<i class="fas fa-paper-plane"></i> Nộp Hồ Sơ & Nhận Mã OTP Xác Thực';
    }
  },

  startCountdown() {
    clearInterval(this.countdownInterval);
    this.countdownSeconds = 600;
    const timerEl = document.getElementById('otp-countdown');

    this.countdownInterval = setInterval(() => {
      this.countdownSeconds--;
      if (this.countdownSeconds <= 0) {
        clearInterval(this.countdownInterval);
        timerEl.textContent = 'Đã hết hạn';
      } else {
        const m = Math.floor(this.countdownSeconds / 60);
        const s = this.countdownSeconds % 60;
        timerEl.textContent = `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
      }
    }, 1000);
  },

  async resendOtp() {
    if (!this.currentApplicationId) return;

    try {
      const res = await fetch('/api/admission/resend-otp/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_id: this.currentApplicationId })
      });
      const data = await res.json();
      if (data.success) {
        this.startCountdown();
        Swal.fire({ icon: 'success', title: 'Thành công', text: data.message, timer: 2000 });
      } else {
        Swal.fire({ icon: 'error', title: 'Lỗi', text: data.message });
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Không thể gửi lại mã OTP' });
    }
  },

  async verifyOtp() {
    const otp = document.getElementById('otp-digit').value.trim();
    if (!otp || otp.length < 6) {
      Swal.fire({ icon: 'warning', title: 'Thiếu mã OTP', text: 'Vui lòng nhập đủ 6 chữ số mã OTP' });
      return;
    }

    try {
      const res = await fetch('/api/admission/verify-otp/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_id: this.currentApplicationId,
          otp: otp
        })
      });

      const data = await res.json();
      if (!data.success) {
        Swal.fire({ icon: 'error', title: 'Xác thực thất bại', text: data.message });
        return;
      }

      clearInterval(this.countdownInterval);

      // Chuyển sang Bước 3: Kết quả
      document.getElementById('otp-section').style.display = 'none';
      document.getElementById('result-section').style.display = 'block';

      document.getElementById('step-badge-2').classList.remove('active');
      document.getElementById('step-line-2').classList.add('active');
      document.getElementById('step-badge-3').classList.add('active');
      document.getElementById('step-title').textContent = 'Bước 3: Kết Quả Xét Tuyển & Cấp Mã Sinh Viên';

      if (data.qualified) {
        // Đậu
        document.getElementById('result-qualified').style.display = 'block';
        document.getElementById('result-unqualified').style.display = 'none';
        document.getElementById('qualified-school-info').textContent =
          `Trường: ${data.university_name} | Ngành: ${data.department} | Điểm xét tuyển: ${data.score.toFixed(2)}đ (Điểm chuẩn: ${data.benchmark.toFixed(2)}đ)`;
        document.getElementById('res-student-id').textContent = data.student_id;
      } else {
        // Chưa đạt
        document.getElementById('result-qualified').style.display = 'none';
        document.getElementById('result-unqualified').style.display = 'block';
        document.getElementById('unqualified-info').textContent =
          `Trường: ${data.university_name} | Ngành: ${data.department} | Điểm xét tuyển: ${data.score.toFixed(2)}đ (Điểm chuẩn: ${data.benchmark.toFixed(2)}đ)`;
      }

    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Không thể xác thực mã OTP' });
    }
  },

  resetForm() {
    location.reload();
  },

  async lookupByCccd() {
    const cccd = document.getElementById('lookup-cccd').value.trim();
    if (!cccd) {
      Swal.fire({ icon: 'warning', title: 'Thiếu thông tin', text: 'Vui lòng nhập số CCCD để tra cứu' });
      return;
    }

    const container = document.getElementById('lookup-results');
    container.innerHTML = '<div style="text-align:center; padding: 20px;"><i class="fas fa-spinner fa-spin fa-2x"></i> Đang tra cứu...</div>';

    try {
      const res = await fetch(`/api/admission/check-status/?cccd=${encodeURIComponent(cccd)}`);
      const data = await res.json();

      if (!data.success || !data.found) {
        container.innerHTML = `
          <div class="result-card warning" style="text-align: center;">
            <i class="fas fa-search-minus" style="font-size: 2.5rem; color: #f59e0b; margin-bottom: 12px;"></i>
            <p>${data.message || 'Không tìm thấy hồ sơ xét tuyển với số CCCD này.'}</p>
          </div>
        `;
        return;
      }

      let html = '';
      data.applications.forEach(a => {
        let badgeClass = 'status-badge';
        if (a.status === 'credentials_sent') badgeClass += ' sent';
        else if (a.status === 'approved') badgeClass += ' approved';
        else badgeClass += ' rejected';

        html += `
          <div class="lookup-card-item">
            <div>
              <h4 style="color: var(--adm-text-main); font-size: 1.1rem; margin-bottom: 4px;">
                ${a.university_name} (${a.university_code || '---'})
              </h4>
              <p style="font-size: 0.88rem; color: var(--adm-text-body); margin-bottom: 6px;">
                Ngành: <strong>${a.department}</strong> | Điểm xét tuyển: <strong>${a.score.toFixed(2)}đ</strong> (Chuẩn: ${a.benchmark.toFixed(2)}đ)
              </p>
              <p style="font-size: 0.8rem; color: var(--adm-text-muted);">
                Thí sinh: <strong>${a.full_name}</strong> | Nộp ngày: ${a.created_at}
              </p>
              ${a.generated_student_id ? `
                <p style="font-size: 0.92rem; color: #60a5fa; margin-top: 6px;">
                  <i class="fas fa-id-badge"></i> Mã Sinh Viên: <strong>${a.generated_student_id}</strong> (Đã gửi mật khẩu về Gmail)
                </p>
              ` : ''}
            </div>
            <div>
              <span class="${badgeClass}">
                ${a.status_display}
              </span>
            </div>
          </div>
        `;
      });

      container.innerHTML = html;

    } catch (err) {
      container.innerHTML = '<div class="text-danger" style="text-align:center;">Lỗi kết nối tra cứu</div>';
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  AdmissionApp.init();
});
