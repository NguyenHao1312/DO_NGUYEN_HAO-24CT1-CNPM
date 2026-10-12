// chatbot.js
// Trợ lý AI (Chatbot View) với tích hợp Gemini/GPT

const CHATBOT_KB = [
  {
    pattern: /(tuyển sinh|xét tuyển|điểm chuẩn|chỉ tiêu|nguyện vọng|hồ sơ|admission|enrollment|score|quota)/i,
    vi: "Năm nay, các trường Đại học tại Đà Nẵng chủ yếu xét tuyển theo 4 phương thức: Xét điểm thi THPT, Xét học bạ, Tuyển thẳng và Xét điểm ĐGNL. Bạn có thể xem chi tiết ở Cổng thông tin Tuyển sinh.",
    en: "Universities in Da Nang mainly admit based on 4 methods: High school exam score, Academic transcript, Direct admission, and Competence assessment. You can check the Admission Portal for details."
  },
  {
    pattern: /(học phí|lệ phí|viện phí|tiền học|tuition|fee|cost|price)/i,
    vi: "Học phí tại các trường dao động từ 15 - 35 triệu/năm đối với trường công lập (tùy ngành), và 25 - 60 triệu/năm đối với trường tư thục. Có chính sách hỗ trợ miễn giảm cho đối tượng chính sách.",
    en: "Tuition fees range from 15 - 35 million/year for public universities, and 25 - 60 million/year for private universities. Financial aid is available for eligible students."
  },
  {
    pattern: /(học bổng|trợ cấp|vay vốn|miễn giảm|scholarship|grant|loan|financial aid)/i,
    vi: "Sinh viên có cơ hội nhận học bổng khuyến khích học tập, học bổng doanh nghiệp và hỗ trợ vay vốn sinh viên với lãi suất 0% từ Ngân hàng Chính sách Xã hội.",
    en: "Students have opportunities to receive academic scholarships, corporate scholarships, and 0% interest student loans from the Social Policy Bank."
  },
  {
    pattern: /(tín chỉ|môn học|ngành|chương trình đào tạo|credit|course|major|curriculum|syllabus)/i,
    vi: "Chương trình đào tạo thường có từ 120 - 150 tín chỉ tùy ngành, kéo dài từ 3.5 - 4.5 năm. Sinh viên đăng ký trung bình 15-20 tín chỉ mỗi học kỳ thông qua cổng thông tin nội bộ.",
    en: "Programs typically consist of 120 - 150 credits depending on the major, lasting 3.5 - 4.5 years. Students register for 15-20 credits per semester via the internal portal."
  },
  {
    pattern: /(tài khoản|đăng nhập|mật khẩu|quên mật khẩu|account|login|password|forgot|reset)/i,
    vi: "Để bảo mật, hệ thống không lưu trữ mật khẩu dưới dạng văn bản. Nếu quên mật khẩu, vui lòng liên hệ Phòng Đào tạo hoặc dùng chức năng 'Quên mật khẩu' ở màn hình Đăng nhập.",
    en: "For security, passwords are encrypted. If you forgot your password, please contact the Academic Affairs Office or use the 'Forgot Password' feature on the Login screen."
  },
  {
    pattern: /(ký túc xá|chỗ ở|nhà trọ|ktx|dorm|accommodation|housing)/i,
    vi: "Các trường đều có hệ thống Ký túc xá ưu tiên cho Tân sinh viên và sinh viên diện chính sách. Vui lòng đăng ký ngay khi làm thủ tục nhập học.",
    en: "Universities provide dormitories prioritized for freshmen and eligible students. Please register during the enrollment process."
  },
  {
    pattern: /(câu lạc bộ|hoạt động ngoại khóa|đoàn|hội sinh viên|club|extracurricular|union|activity)/i,
    vi: "Đời sống sinh viên rất phong phú với hơn 50 câu lạc bộ từ học thuật, nghệ thuật đến thể thao. Theo dõi fanpage Hội Sinh viên để biết lịch sinh hoạt.",
    en: "Student life is vibrant with over 50 academic, arts, and sports clubs. Follow the Student Union fanpage for event schedules."
  },
  {
    pattern: /(tốt nghiệp|ra trường|việc làm|thực tập|graduate|graduation|job|internship|career)/i,
    vi: "Tỷ lệ sinh viên có việc làm sau khi ra trường đạt trên 95%. Nhà trường thường xuyên tổ chức Hội chợ Việc làm (Job Fair) kết nối sinh viên với các doanh nghiệp lớn.",
    en: "The post-graduation employment rate is over 95%. Universities regularly host Job Fairs connecting students with top enterprises."
  },
  {
    pattern: /(bách khoa|kinh tế|sư phạm|ngoại ngữ|fpt|duy tân|đông á|kiến trúc|ute|vku|ump|dut|due|ued|ufls|dau)/i,
    vi: "Trường này là một trong những đối tác/thành viên chiến lược của hệ thống. Bạn hãy chọn tab 'Các trường Đại học' trên menu để xem thông tin chi tiết (Logo, Học phí, Ngành nghề).",
    en: "This school is a strategic partner/member of the system. Please select the 'Universities' tab to view detailed info (Logo, Tuition, Majors)."
  },
  {
    pattern: /(xin chào|hello|hi|chào|bot|ai)/i,
    vi: "Chào bạn! Tôi là Trợ lý AI Offline của UniMS. Tôi có thể giải đáp các thông tin chung về tuyển sinh, học phí, tín chỉ, tài khoản,... Bạn cần hỏi gì?",
    en: "Hello! I am the UniMS Offline AI Assistant. I can help with admissions, tuition, credits, accounts, etc. What would you like to know?"
  },
  {
    pattern: /(tìm sinh viên|tra cứu|thông tin sinh viên|look up|search student)/i,
    vi: "Để tra cứu sinh viên, vào menu 'Sinh viên' ở thanh bên (Sidebar), dùng thanh tìm kiếm để gõ Mã SV hoặc Tên sinh viên.",
    en: "To search for a student, go to 'Students' in the sidebar and use the search bar to type the Student ID or Name."
  },
  {
    pattern: /(điểm|bảng điểm|grade|score|transcript)/i,
    vi: "Vào menu 'Bảng điểm' để xem/nhập điểm. Cấu trúc điểm: Giữa kỳ (30%), Cuối kỳ (50%), Bài tập (20%).",
    en: "Go to the 'Grades' menu to view/enter grades. Grade structure: Midterm (30%), Final (50%), Assignment (20%)."
  },
  {
    pattern: /(thêm sinh viên|add student)/i,
    vi: "Nếu bạn có quyền Admin/Giáo viên, vào 'Sinh viên' và nhấn nút 'Thêm sinh viên' để tạo hồ sơ mới.",
    en: "If you have Admin/Teacher rights, go to 'Students' and click 'Add Student' to create a new profile."
  },
  {
    pattern: /(lịch|thời khoá biểu|schedule|timetable)/i,
    vi: "Lịch học chi tiết xem tại phần 'Lớp học' hoặc tiện ích lịch trên màn hình Tổng quan (Dashboard).",
    en: "Detailed class schedules can be viewed in the 'Classes' section or the calendar widget on the Dashboard."
  },
  {
    pattern: /(lỗi|bug|báo cáo|report|hỗ trợ|support|giúp đỡ|help)/i,
    vi: "Gặp sự cố hệ thống? Hãy vào mục 'Hỗ trợ' (Helpdesk) để gửi yêu cầu hỗ trợ (Ticket) đến bộ phận IT.",
    en: "System issues? Go to the 'Helpdesk' section to submit a support ticket to the IT department."
  }
];

const ChatbotView = {
  isTyping: false,

  render() {
    const container = document.getElementById('main-content');
    container.innerHTML = this.getHTML();
    this.attachEvents();
    this.loadHistory();
  },

  getHTML() {
    const settings = Database.settings.get();
    const isAdmin = Auth.isAdmin();

    return `
      <div class="page-header">
        <div class="page-title-section">
          <h1 class="page-title">${t('chatbot_title')}</h1>
          <p class="page-subtitle">${t('chatbot_subtitle')}</p>
        </div>
        <div class="page-actions" style="display: flex; gap: 0.5rem; align-items: center;">
          <span style="font-size: 0.8rem; padding: 4px 10px; border-radius: 9999px; background: rgba(16, 185, 129, 0.1); color: var(--success); display: inline-flex; align-items: center; gap: 5px;">
            <i class="fas fa-shield-alt"></i> Server-Side Protected
          </span>
          <button class="btn btn-ghost text-danger border-danger" id="btn-clear-chat">
            <i class="fas fa-trash"></i> ${t('clear_history')}
          </button>
        </div>
      </div>

      <div class="card h-[calc(100vh-220px)] flex flex-col relative" style="height: calc(100vh - 220px); display: flex; flex-direction: column;">
        <!-- Header -->
        <div class="card-header flex items-center gap-3 bg-bg-tertiary border-b border-border-color p-4" style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem; border-bottom: 1px solid var(--border-color);">
          <div style="display: flex; align-items: center; gap: 1rem;">
            <div class="avatar avatar-md bg-primary-500 text-white flex-center rounded-full" style="display:flex; justify-content:center; align-items:center; width: 40px; height: 40px; border-radius: 50%; background: var(--primary-500); color: white;">
              <i class="fas fa-robot"></i>
            </div>
            <div>
              <h3 class="font-bold text-text-primary m-0" style="margin:0; font-weight: 600;">UniMS AI Assistant</h3>
              <span class="text-xs text-success flex items-center gap-1" style="font-size: 0.75rem; display: flex; align-items: center; gap: 4px; color: var(--success);">
                <span style="display:inline-block; width:8px; height:8px; background:var(--success); border-radius:50%;"></span> Trợ lý học vụ thông minh
              </span>
            </div>
          </div>
        </div>

        <!-- Messages Area -->
        <div class="chatbot-messages flex-1 overflow-y-auto p-4 flex flex-col gap-4" id="chat-messages" style="flex: 1; overflow-y: auto; padding: 1rem; display: flex; flex-direction: column; gap: 1rem;">
          <!-- Messages will be injected here -->
        </div>

        <!-- Typing Indicator -->
        <div class="typing-indicator hidden px-4 py-2" id="typing-indicator" style="display: none;">
          <div class="chat-message bot flex gap-2" style="display: flex; gap: 0.5rem;">
            <div class="avatar avatar-sm bg-primary-500 text-white flex-center rounded-full" style="width: 32px; height: 32px; display:flex; justify-content:center; align-items:center; flex-shrink: 0; border-radius: 50%; background: var(--primary-500); color: white;">
              <i class="fas fa-robot text-xs"></i>
            </div>
            <div class="chat-bubble p-3 rounded-lg" style="background: var(--bg-tertiary); border: 1px solid var(--border-color); border-top-left-radius: 0;">
              <div style="display: flex; gap: 4px;">
                <div style="width:6px;height:6px;background:var(--text-tertiary);border-radius:50%;animation:typing 1.4s infinite ease-in-out 0.2s;"></div>
                <div style="width:6px;height:6px;background:var(--text-tertiary);border-radius:50%;animation:typing 1.4s infinite ease-in-out 0.4s;"></div>
                <div style="width:6px;height:6px;background:var(--text-tertiary);border-radius:50%;animation:typing 1.4s infinite ease-in-out 0.6s;"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Input Area -->
        <div class="chatbot-input border-t border-border-color p-4 bg-bg-secondary flex gap-2" style="display: flex; gap: 0.5rem; padding: 1rem; border-top: 1px solid var(--border-color);">
          <input type="text" id="chat-input" class="form-control" placeholder="${t('type_message')}" style="flex: 1;">
          <button class="btn btn-primary" id="btn-send-chat">
            <i class="fas fa-paper-plane"></i> <span class="hidden-mobile" style="margin-left: 8px;">${t('send')}</span>
          </button>
        </div>
      </div>
      
      <style>
        @keyframes typing {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @media (max-width: 768px) {
          .hidden-mobile { display: none; }
        }
        #ai-settings-modal {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5); z-index: 1000;
          display: none; align-items: center; justify-content: center;
        }
        #ai-settings-modal.show { display: flex; }
      </style>
    `;
  },

  attachEvents() {
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('btn-send-chat');
    const clearBtn = document.getElementById('btn-clear-chat');

    const handleSend = () => {
      const text = input.value.trim();
      if (text && !this.isTyping) {
        this.addMessage('user', text);
        input.value = '';
        this.processBotResponse(text);
      }
    };

    sendBtn.addEventListener('click', handleSend);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleSend();
    });

    clearBtn.addEventListener('click', () => {
      if(confirm(t('confirm_clear_chat') || 'Bạn có chắc muốn xóa lịch sử chat?')) {
        localStorage.removeItem('unims_chat_history');
        document.getElementById('chat-messages').innerHTML = '';
        this.loadHistory(); // Reloads welcome msg
      }
    });
  },

  loadHistory() {
    const history = JSON.parse(localStorage.getItem('unims_chat_history') || '[]');
    const container = document.getElementById('chat-messages');
    container.innerHTML = '';

    if (history.length === 0) {
      // Show welcome message
      this.addMessage('bot', t('chatbot_welcome'), false);
    } else {
      history.forEach(msg => {
        this.appendMessageHTML(msg.sender, msg.text, msg.timestamp);
      });
      this.scrollToBottom();
    }
  },

  saveHistory(sender, text, timestamp) {
    const history = JSON.parse(localStorage.getItem('unims_chat_history') || '[]');
    history.push({ sender, text, timestamp });
    // Keep last 50 messages
    if (history.length > 50) history.shift();
    localStorage.setItem('unims_chat_history', JSON.stringify(history));
  },

  addMessage(sender, text, save = true) {
    const timestamp = new Date().toISOString();
    this.appendMessageHTML(sender, text, timestamp);
    if (save) this.saveHistory(sender, text, timestamp);
    this.scrollToBottom();
  },

  appendMessageHTML(sender, text, timestamp) {
    const container = document.getElementById('chat-messages');
    const timeStr = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Parse Markdown basic (bold, line breaks) for bot
    let formattedText = text;
    if (sender === 'bot') {
       formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
       formattedText = formattedText.replace(/\n/g, '<br>');
    }
    
    let html = '';
    if (sender === 'user') {
      html = `
        <div class="chat-message user" style="display:flex; flex-direction:column; align-items:flex-end; gap:0.25rem;">
          <div class="chat-bubble" style="background:var(--primary-500); color:white; border-radius:0.5rem; border-bottom-right-radius:0; max-width:80%; padding:0.75rem; line-height: 1.5; font-size: 0.95rem;">
            ${formattedText}
          </div>
          <span style="font-size: 0.75rem; color: var(--text-tertiary);">${timeStr}</span>
        </div>
      `;
    } else {
      html = `
        <div class="chat-message bot" style="display:flex; gap:0.5rem; align-items: flex-start;">
          <div style="width:32px; height:32px; display:flex; justify-content:center; align-items:center; flex-shrink:0; border-radius: 50%; background: var(--bg-tertiary); border: 1px solid var(--border-color); color: var(--primary-500);">
            <i class="fas fa-robot text-xs"></i>
          </div>
          <div style="display:flex; flex-direction:column; gap:0.25rem; max-width:80%;">
            <div class="chat-bubble" style="background:var(--bg-tertiary); color:var(--text-primary); border:1px solid var(--border-color); border-radius:0.5rem; border-top-left-radius:0; padding:0.75rem; line-height: 1.5; font-size: 0.95rem;">
              ${formattedText}
            </div>
            <span style="font-size: 0.75rem; color: var(--text-tertiary);">${timeStr}</span>
          </div>
        </div>
      `;
    }
    
    container.insertAdjacentHTML('beforeend', html);
  },

  scrollToBottom() {
    const container = document.getElementById('chat-messages');
    container.scrollTop = container.scrollHeight;
  },

  async processBotResponse(userText) {
    const isEn = (typeof Database !== 'undefined' && Database.settings.get().language === 'en') || (localStorage.getItem('unims_settings') && JSON.parse(localStorage.getItem('unims_settings')).language === 'en');

    this.isTyping = true;
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) typingIndicator.style.display = 'flex';
    this.scrollToBottom();

    let responseText = '';

    try {
      const token = (typeof Auth !== 'undefined') ? Auth.getServerToken() : '';
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['X-Session-Token'] = token;

      const res = await fetch('/api/ai/chat/', {
        method: 'POST',
        credentials: 'include',
        headers: headers,
        body: JSON.stringify({ message: userText }),
      });

      if (res.ok) {
        const data = await res.json();
        responseText = data.reply || (isEn ? "Sorry, no response received." : "Xin lỗi, không nhận được phản hồi.");
      } else {
        const errData = await res.json().catch(() => ({}));
        if (errData && errData.error) {
          responseText = errData.error;
        } else {
          // Fallback sang kho tri thức offline cục bộ
          responseText = await this.getSimulatedAnswer(userText, isEn);
        }
      }
    } catch (e) {
      console.warn("AI Backend unreachable, using offline fallback:", e);
      responseText = await this.getSimulatedAnswer(userText, isEn);
    }

    if (typingIndicator) typingIndicator.style.display = 'none';
    this.isTyping = false;
    this.addMessage('bot', responseText);
  },

  getSimulatedAnswer(input, isEn) {
    return new Promise(resolve => {
      setTimeout(() => {
        const q = input.toLowerCase();
        let reply = isEn 
          ? "I'm sorry, my offline database doesn't have an answer for this. Please check the menu options or contact the helpdesk." 
          : "Xin lỗi, cơ sở dữ liệu offline của tôi chưa có thông tin về vấn đề này. Vui lòng kiểm tra các menu bên trái hoặc liên hệ Hỗ trợ (Helpdesk).";
        
        for (const intent of CHATBOT_KB) {
          if (intent.pattern.test(q)) {
            reply = isEn ? intent.en : intent.vi;
            break;
          }
        }
        
        resolve(reply);
      }, 400);
    });
  }
};
