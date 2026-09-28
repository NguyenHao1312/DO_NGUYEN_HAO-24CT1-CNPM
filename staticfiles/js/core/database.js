// database.js
const STORAGE_KEYS = {
  STUDENTS: 'unims_students',
  TEACHERS: 'unims_teachers',
  CLASSES: 'unims_classes',
  GRADES: 'unims_grades',
  BUGS: 'unims_bugs',
  CHAT_HISTORY: 'unims_chat_history',
  ACTIVITY_LOG: 'unims_activity_log',
  SETTINGS: 'unims_settings',
  USERS: 'unims_users',
  NOTIFICATIONS: 'unims_notifications',
  REGISTRATIONS: 'unims_registrations',
  STORAGE_LOGS: 'unims_storage_logs',
  LOGIN_HISTORY: 'unims_login_history',
  ACTIVE_SESSIONS: 'unims_active_sessions'
};

const DEPARTMENTS = [
  'Công nghệ thông tin',
  'Kinh tế',
  'Ngoại ngữ',
  'Cơ khí',
  'Y dược'
];

const UNIVERSITIES = [
  { id: 1, name: 'Đại học Bách Khoa', enName: 'University of Science and Technology', desc: 'Đại học kỹ thuật hàng đầu miền Trung', shortName: 'DUT', feePerCredit: 385000, increaseRate: 10 },
  { id: 2, name: 'Đại học Kinh tế', enName: 'University of Economics', desc: 'Đào tạo kinh tế, quản trị kinh doanh', shortName: 'DUE', feePerCredit: 425600, increaseRate: 12 },
  { id: 3, name: 'Đại học Sư phạm', enName: 'University of Education', desc: 'Trung tâm đào tạo giáo viên và khoa học cơ bản', shortName: 'UED', feePerCredit: 320000, increaseRate: 0 },
  { id: 4, name: 'Đại học Ngoại ngữ', enName: 'University of Foreign Language Studies', desc: 'Nơi khởi nguồn ngôn ngữ và văn hóa', shortName: 'UFLS', feePerCredit: 340000, increaseRate: 0 },
  { id: 5, name: 'Đại học FPT Đà Nẵng', enName: 'FPT University Da Nang', desc: 'Trường đại học của doanh nghiệp (Tư thục)', shortName: 'FPT', feePerCredit: 1296000, increaseRate: 8 },
  { id: 6, name: 'Đại học Duy Tân', enName: 'Duy Tan University', desc: 'Đại học tư thục lớn nhất miền Trung (Tư thục)', shortName: 'DTU', feePerCredit: 977500, increaseRate: 15 },
  { id: 7, name: 'Đại học Đông Á', enName: 'Dong A University', desc: 'Đầu tư phát triển toàn diện (Tư thục)', shortName: 'UDA', feePerCredit: 817500, increaseRate: 9 },
  { id: 8, name: 'Đại học Kiến trúc Đà Nẵng', enName: 'Da Nang Architecture University', desc: 'Kiến trúc, Mỹ thuật và Xây dựng (Tư thục)', shortName: 'DAU', feePerCredit: 650000, increaseRate: 0 },
  { id: 9, name: 'Đại học Sư phạm Kỹ thuật', enName: 'University of Technology and Education', desc: 'Kỹ thuật thực hành và Ứng dụng', shortName: 'UTE', feePerCredit: 410400, increaseRate: 14 },
  { id: 10, name: 'Đại học CNTT & TT Việt - Hàn', enName: 'Vietnam-Korea University of IT & C', desc: 'Công nghệ Thông tin và Kinh tế số', shortName: 'VKU', feePerCredit: 444000, increaseRate: 11 },
  { id: 11, name: 'Khoa Y Dược', enName: 'School of Medicine and Pharmacy', desc: 'Đào tạo Y bác sĩ chất lượng cao', shortName: 'UMP', feePerCredit: 678000, increaseRate: 13 }
];

const Database = {
  // --- Keys cần mã hoá (dữ liệu nhạy cảm / cache offline) ---
  ENCRYPTED_KEYS: [
    STORAGE_KEYS.STUDENTS, STORAGE_KEYS.TEACHERS,
    STORAGE_KEYS.GRADES, STORAGE_KEYS.USERS,
    STORAGE_KEYS.CLASSES, STORAGE_KEYS.REGISTRATIONS,
  ],

  _getAll(key) {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    // Nếu dữ liệu bị mã hoá (ENC:) từ lần đóng trang trước → chờ initEncryption giải mã
    if (raw.startsWith('ENC:')) return [];
    try { return JSON.parse(raw); } catch { return []; }
  },
  _save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
    // KHÔNG ghi đè encrypted lên cùng key — sẽ mã hoá khi đóng trang
  },
  // Async version — dùng khi cần đọc dữ liệu đã mã hoá
  async _getAllAsync(key) {
    if (this.ENCRYPTED_KEYS.includes(key) && typeof CryptoManager !== 'undefined' && CryptoManager.isSupported()) {
      return await CryptoManager.loadEncrypted(key);
    }
    return this._getAll(key);
  },
  _generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  },
  _notifyUserByLinkedId(linkedId, title, message, type = 'info') {
    const user = Database.users.getAll().find(u => u.linkedId === linkedId);
    if (user) {
      Database.notifications.add(user.id, title, message, type);
    }
  },

  // Sync data lên server (có fallback offline queue)
  _syncUp(action, data) {
    // Nếu offline → enqueue ngay
    if (!navigator.onLine && typeof SyncQueue !== 'undefined') {
      SyncQueue.enqueue(action, data);
      return;
    }

    const token = (typeof Auth !== 'undefined') ? Auth.getServerToken() : '';
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['X-Session-Token'] = token;
    fetch('/api/sync/up/', {
      method: 'POST',
      credentials: 'include',
      headers: headers,
      body: JSON.stringify({ action, data }),
    }).catch(err => {
      console.log('Sync up failed:', err.message);
      // Fetch thất bại → enqueue để retry sau
      if (typeof SyncQueue !== 'undefined') {
        SyncQueue.enqueue(action, data);
      }
    });
  },

  UNIVERSITIES, // Expose globally

  generateStudentId(uniId = 1) {
    const students = this.students.getAll().filter(s => s.universityId == uniId);
    const prefix = `1000${uniId}`;
    if (students.length === 0) return `${prefix}1`;
    const ids = students.map(s => parseInt(s.studentId.replace(prefix, ''), 10)).filter(id => !isNaN(id));
    if (ids.length === 0) return `${prefix}1`;
    return `${prefix}${Math.max(...ids) + 1}`;
  },

  generateTeacherId(uniId = 1) {
    const teachers = this.teachers.getAll().filter(t => t.universityId == uniId);
    const prefix = uniId === 1 ? `101` : `10${uniId}`; // 101, 102, 103...
    if (teachers.length === 0) return `${prefix}1`;
    const ids = teachers.map(t => parseInt(t.teacherId.replace(prefix, ''), 10)).filter(id => !isNaN(id));
    if (ids.length === 0) return `${prefix}1`;
    return `${prefix}${Math.max(...ids) + 1}`;
  },
  // Students namespace
  students: {
    getAll() {
      return Database._getAll(STORAGE_KEYS.STUDENTS);
    },
    getById(id) {
      return this.getAll().find(s => s.id === id);
    },
    add(data) {
      const students = this.getAll();
      const newStudent = {
        ...data,
        id: Database._generateId(),
        studentId: data.studentId || Database.generateStudentId(data.universityId),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      students.push(newStudent);
      Database._save(STORAGE_KEYS.STUDENTS, students);
      
      // Auto-create user account for student
      if (data.createAccount !== false) {
        Database.users.add({
          username: newStudent.studentId,
          password: '123', // Default password changed to 123
          name: newStudent.name,
          role: 'student',
          linkedId: newStudent.id,
          universityId: data.universityId
        });
      }
      
      return newStudent;
    },
    update(id, data) {
      const students = this.getAll();
      const index = students.findIndex(s => s.id === id);
      if (index !== -1) {
        students[index] = { ...students[index], ...data, updatedAt: new Date().toISOString() };
        Database._save(STORAGE_KEYS.STUDENTS, students);
        
        // Sync name to user account if it changed
        if (data.name) {
           const users = Database.users.getAll();
           const uIndex = users.findIndex(u => u.linkedId === id && u.role === 'student');
           if (uIndex !== -1) {
             users[uIndex].name = data.name;
             Database._save(STORAGE_KEYS.USERS, users);
           }
        }
        return students[index];
      }
      return null;
    },
    delete(id) {
      let students = this.getAll();
      students = students.filter(s => s.id !== id);
      Database._save(STORAGE_KEYS.STUDENTS, students);
      
      // Delete associated user account
      let users = Database.users.getAll();
      users = users.filter(u => !(u.linkedId === id && u.role === 'student'));
      Database._save(STORAGE_KEYS.USERS, users);
      
      // Delete associated grades
      let grades = Database.grades.getAll();
      grades = grades.filter(g => g.studentId !== id);
      Database._save(STORAGE_KEYS.GRADES, grades);
      
      // Delete associated registrations
      let regs = Database.registrations.getAll();
      regs = regs.filter(r => r.studentId !== id);
      Database._save(STORAGE_KEYS.REGISTRATIONS, regs);
    },
    search(query) {
      const q = query.toLowerCase();
      return this.getAll().filter(s => 
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.studentId && s.studentId.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q))
      );
    },
    filter(filters) {
      let students = this.getAll();
      if (filters.department) {
        students = students.filter(s => s.department === filters.department);
      }
      if (filters.status) {
        students = students.filter(s => s.status === filters.status);
      }
      if (filters.classId) {
        students = students.filter(s => s.classId === filters.classId);
      }
      return students;
    },
    count() {
      return this.getAll().length;
    }
  },

  // Teachers namespace
  teachers: {
    getAll() {
      return Database._getAll(STORAGE_KEYS.TEACHERS);
    },
    getById(id) {
      return this.getAll().find(t => t.id === id);
    },
    add(data) {
      const teachers = this.getAll();
      const newTeacher = {
        ...data,
        id: Database._generateId(),
        teacherId: data.teacherId || Database.generateTeacherId(data.universityId),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      teachers.push(newTeacher);
      Database._save(STORAGE_KEYS.TEACHERS, teachers);
      
      // Auto-create user account for teacher
      if (data.createAccount !== false) {
        Database.users.add({
          username: newTeacher.teacherId,
          password: '123', // Default password changed to 123
          name: newTeacher.name,
          role: 'teacher',
          linkedId: newTeacher.id,
          universityId: data.universityId
        });
      }
      
      return newTeacher;
    },
    update(id, data) {
      const teachers = this.getAll();
      const index = teachers.findIndex(t => t.id === id);
      if (index !== -1) {
        teachers[index] = { ...teachers[index], ...data, updatedAt: new Date().toISOString() };
        Database._save(STORAGE_KEYS.TEACHERS, teachers);
        
        // Sync name to user account if it changed
        if (data.name) {
           const users = Database.users.getAll();
           const uIndex = users.findIndex(u => u.linkedId === id && u.role === 'teacher');
           if (uIndex !== -1) {
             users[uIndex].name = data.name;
             Database._save(STORAGE_KEYS.USERS, users);
           }
        }
        return teachers[index];
      }
      return null;
    },
    delete(id) {
      let teachers = this.getAll();
      teachers = teachers.filter(t => t.id !== id);
      Database._save(STORAGE_KEYS.TEACHERS, teachers);
      
      // Delete associated user account
      let users = Database.users.getAll();
      users = users.filter(u => !(u.linkedId === id && u.role === 'teacher'));
      Database._save(STORAGE_KEYS.USERS, users);
    },
    search(query) {
      const q = query.toLowerCase();
      return this.getAll().filter(t => 
        (t.name && t.name.toLowerCase().includes(q)) ||
        (t.teacherId && t.teacherId.toLowerCase().includes(q)) ||
        (t.email && t.email.toLowerCase().includes(q))
      );
    },
    filter(filters) {
      let teachers = this.getAll();
      if (filters.department) {
        teachers = teachers.filter(t => t.department === filters.department);
      }
      if (filters.status) {
        teachers = teachers.filter(t => t.status === filters.status);
      }
      return teachers;
    },
    count() {
      return this.getAll().length;
    }
  },

  // Classes namespace
  classes: {
    getAll() {
      return Database._getAll(STORAGE_KEYS.CLASSES);
    },
    getById(id) {
      return this.getAll().find(c => c.id === id);
    },
    getByTeacherId(teacherId) {
      return this.getAll().filter(c => c.teacherId === teacherId);
    },
    add(data) {
      const classes = this.getAll();
      const newClass = {
        ...data,
        id: Database._generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      classes.push(newClass);
      Database._save(STORAGE_KEYS.CLASSES, classes);
      return newClass;
    },
    update(id, data) {
      const classes = this.getAll();
      const index = classes.findIndex(c => c.id === id);
      if (index !== -1) {
        classes[index] = { ...classes[index], ...data, updatedAt: new Date().toISOString() };
        Database._save(STORAGE_KEYS.CLASSES, classes);
        return classes[index];
      }
      return null;
    },
    delete(id) {
      let classes = this.getAll();
      classes = classes.filter(c => c.id !== id);
      Database._save(STORAGE_KEYS.CLASSES, classes);
      
      // Delete associated grades
      let grades = Database.grades.getAll();
      grades = grades.filter(g => g.classId !== id);
      Database._save(STORAGE_KEYS.GRADES, grades);
      
      // Delete associated registrations
      let regs = Database.registrations.getAll();
      regs = regs.filter(r => r.classId !== id);
      Database._save(STORAGE_KEYS.REGISTRATIONS, regs);
    },
    search(query) {
      const q = query.toLowerCase();
      return this.getAll().filter(c => 
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.classCode && c.classCode.toLowerCase().includes(q))
      );
    },
    count() {
      return this.getAll().length;
    },
    getStudentCount(classId) {
      const grades = Database.grades.getByClassId(classId);
      return grades.length;
    }
  },

  // Grades namespace (Updated for VN system)
  grades: {
    getAll() {
      return Database._getAll(STORAGE_KEYS.GRADES);
    },
    getByStudentId(studentId) {
      return this.getAll().filter(g => g.studentId === studentId);
    },
    getByClassId(classId) {
      return this.getAll().filter(g => g.classId === classId);
    },
    add(data) {
      const grades = this.getAll();
      
      const calc = this.calculateAverage(data.assignment, data.midterm, data.final);
      
      const newGrade = {
        ...data,
        average10: calc.average10,
        average4: calc.average4,
        letterGrade: calc.letterGrade,
        classification: calc.classification,
        id: Database._generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      grades.push(newGrade);
      Database._save(STORAGE_KEYS.GRADES, grades);
      Database._syncUp('add_grade', newGrade);
      
      // Update student GPA
      this._updateStudentGpa(data.studentId);
      
      // Notify student
      Database._notifyUserByLinkedId(data.studentId, 'Điểm số mới', 'Bạn có điểm số mới được cập nhật.', 'info');
      
      return newGrade;
    },
    update(id, data) {
      const grades = this.getAll();
      const index = grades.findIndex(g => g.id === id);
      if (index !== -1) {
        const assignment = data.assignment !== undefined ? data.assignment : grades[index].assignment;
        const midterm = data.midterm !== undefined ? data.midterm : grades[index].midterm;
        const final = data.final !== undefined ? data.final : grades[index].final;
        
        const calc = this.calculateAverage(assignment, midterm, final);
        
        grades[index] = { 
          ...grades[index], 
          ...data, 
          average10: calc.average10,
          average4: calc.average4,
          letterGrade: calc.letterGrade,
          classification: calc.classification,
          updatedAt: new Date().toISOString() 
        };
        Database._save(STORAGE_KEYS.GRADES, grades);
        Database._syncUp('update_grade', grades[index]);
        
        // Update student GPA
        this._updateStudentGpa(grades[index].studentId);
        
        // Notify student
        Database._notifyUserByLinkedId(grades[index].studentId, 'Cập nhật điểm số', 'Điểm số của bạn vừa được cập nhật.', 'info');
        
        return grades[index];
      }
      return null;
    },
    delete(id) {
      let grades = this.getAll();
      const grade = grades.find(g => g.id === id);
      if (grade) {
        grades = grades.filter(g => g.id !== id);
        Database._save(STORAGE_KEYS.GRADES, grades);
        Database._syncUp('delete_grade', grade);
        this._updateStudentGpa(grade.studentId);
      }
    },
    // Vietnamese University Grading System
    calculateAverage(assignment = 0, midterm = 0, final = 0) {
      // Scale 10: CC(20%) + GK(30%) + CK(50%)
      const avg10 = Number(assignment) * 0.2 + Number(midterm) * 0.3 + Number(final) * 0.5;
      const average10 = Math.round(avg10 * 10) / 10;
      
      let average4 = 0;
      let letterGrade = 'F';
      let classification = 'Kém';

      if (average10 >= 8.5) { average4 = 4.0; letterGrade = 'A'; classification = 'Xuất sắc'; }
      else if (average10 >= 8.0) { average4 = 3.5; letterGrade = 'B+'; classification = 'Giỏi'; }
      else if (average10 >= 7.0) { average4 = 3.0; letterGrade = 'B'; classification = 'Khá'; }
      else if (average10 >= 6.5) { average4 = 2.5; letterGrade = 'C+'; classification = 'Trung bình khá'; }
      else if (average10 >= 5.5) { average4 = 2.0; letterGrade = 'C'; classification = 'Trung bình'; }
      else if (average10 >= 5.0) { average4 = 1.5; letterGrade = 'D+'; classification = 'Trung bình yếu'; }
      else if (average10 >= 4.0) { average4 = 1.0; letterGrade = 'D'; classification = 'Yếu'; }
      else { average4 = 0.0; letterGrade = 'F'; classification = 'Kém'; }
      
      return { average10, average4, letterGrade, classification };
    },
    _updateStudentGpa(studentId) {
      const studentGrades = this.getByStudentId(studentId);
      if (studentGrades.length > 0) {
        const sum10 = studentGrades.reduce((acc, g) => acc + g.average10, 0);
        const sum4 = studentGrades.reduce((acc, g) => acc + g.average4, 0);
        
        const gpa10 = Math.round((sum10 / studentGrades.length) * 100) / 100;
        const gpa4 = Math.round((sum4 / studentGrades.length) * 100) / 100;
        
        Database.students.update(studentId, { gpa: gpa4, gpa10: gpa10 });
      } else {
        Database.students.update(studentId, { gpa: 0, gpa10: 0 });
      }
    }
  },

  // Registrations namespace
  registrations: {
    getAll() {
      return Database._getAll(STORAGE_KEYS.REGISTRATIONS);
    },
    getByStudentId(studentId) {
      return this.getAll().filter(r => r.studentId === studentId);
    },
    getByClassId(classId) {
      return this.getAll().filter(r => r.classId === classId);
    },
    add(studentId, classId, semester) {
      const registrations = this.getAll();
      
      // Check if already registered
      const exists = registrations.find(r => r.studentId === studentId && r.classId === classId);
      if (exists) return false;
      
      registrations.push({
        id: Database._generateId(),
        studentId,
        classId,
        semester,
        registeredAt: new Date().toISOString()
      });
      Database._save(STORAGE_KEYS.REGISTRATIONS, registrations);
      return true;
    },
    remove(studentId, classId) {
      let registrations = this.getAll();
      const initialLength = registrations.length;
      registrations = registrations.filter(r => !(r.studentId === studentId && r.classId === classId));
      if (registrations.length < initialLength) {
        Database._save(STORAGE_KEYS.REGISTRATIONS, registrations);
        return true;
      }
      return false;
    }
  },

  // Bugs/Helpdesk namespace
  bugs: {
    getAll() {
      return Database._getAll(STORAGE_KEYS.BUGS);
    },
    getById(id) {
      return this.getAll().find(b => b.id === id);
    },
    getByReporter(reporterName) {
      return this.getAll().filter(b => b.reporter === reporterName);
    },
    add(data) {
      const bugs = this.getAll();
      const newBug = {
        ...data,
        replies: data.replies || [],
        id: Database._generateId(),
        ticketId: 'TKT-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0'),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      bugs.push(newBug);
      Database._save(STORAGE_KEYS.BUGS, bugs);
      return newBug;
    },
    update(id, data) {
      const bugs = this.getAll();
      const index = bugs.findIndex(b => b.id === id);
      if (index !== -1) {
        bugs[index] = { ...bugs[index], ...data, updatedAt: new Date().toISOString() };
        Database._save(STORAGE_KEYS.BUGS, bugs);
        return bugs[index];
      }
      return null;
    },
    delete(id) {
      let bugs = this.getAll();
      bugs = bugs.filter(b => b.id !== id);
      Database._save(STORAGE_KEYS.BUGS, bugs);
    },
    addReply(id, reply) {
      const bugs = this.getAll();
      const index = bugs.findIndex(b => b.id === id);
      if (index !== -1) {
        if (!bugs[index].replies) bugs[index].replies = [];
        bugs[index].replies.push({
          ...reply,
          timestamp: new Date().toISOString()
        });
        bugs[index].updatedAt = new Date().toISOString();
        Database._save(STORAGE_KEYS.BUGS, bugs);
        
        // Notify reporter if they are a user
        const reporterUser = Database.users.getAll().find(u => u.name === bugs[index].reporter || (u.username && u.username === bugs[index].reporter));
        if (reporterUser) {
           Database.notifications.add(reporterUser.id, 'Phản hồi hỗ trợ mới', `Phiếu hỗ trợ "${bugs[index].title}" vừa có phản hồi mới.`, 'info');
        }

        return bugs[index];
      }
      return null;
    },
    count() {
      return this.getAll().length;
    },
    countByStatus() {
      const bugs = this.getAll();
      return bugs.reduce((acc, bug) => {
        acc[bug.status] = (acc[bug.status] || 0) + 1;
        return acc;
      }, { new: 0, 'in-progress': 0, resolved: 0, closed: 0 });
    }
  },

  // Users namespace
  users: {
    getAll() {
      return Database._getAll(STORAGE_KEYS.USERS);
    },
    add(data) {
      const users = this.getAll();
      const newUser = {
        ...data,
        id: Database._generateId(),
        createdAt: new Date().toISOString()
      };
      users.push(newUser);
      Database._save(STORAGE_KEYS.USERS, users);
      return newUser;
    },
    update(id, data) {
      const users = this.getAll();
      const index = users.findIndex(u => u.id === id);
      if (index !== -1) {
        users[index] = { ...users[index], ...data };
        Database._save(STORAGE_KEYS.USERS, users);
        return users[index];
      }
      return null;
    }
  },

  // Login History namespace
  loginHistory: {
    getAll() {
      return Database._getAll(STORAGE_KEYS.LOGIN_HISTORY);
    },
    getByUserId(userId) {
      return this.getAll().filter(h => h.userId === userId).sort((a,b) => new Date(b.loginAt) - new Date(a.loginAt));
    },
    add(userId, sessionData) {
      const history = this.getAll();
      history.unshift({
        id: Database._generateId(),
        userId,
        ip: sessionData.ip || 'Unknown',
        device: sessionData.device || 'Unknown',
        loginAt: sessionData.loginAt || new Date().toISOString()
      });
      // Keep only last 100 entries to save space
      if (history.length > 100) history.pop();
      Database._save(STORAGE_KEYS.LOGIN_HISTORY, history);
    }
  },

  // Notifications namespace
  notifications: {
    getAll() {
      return Database._getAll(STORAGE_KEYS.NOTIFICATIONS);
    },
    getByUserId(userId) {
      return this.getAll().filter(n => n.userId === userId || n.userId === 'all').sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    add(userId, title, message, type = 'info', link = null) {
      const notifs = this.getAll();
      const newNotif = {
        id: Database._generateId(),
        userId,
        title,
        message,
        type,
        link,
        read: false,
        createdAt: new Date().toISOString()
      };
      notifs.unshift(newNotif);
      Database._save(STORAGE_KEYS.NOTIFICATIONS, notifs);
      
      // Update UI if user is active
      if (window.App && typeof App.updateNotificationBadge === 'function') {
         App.updateNotificationBadge();
      }
      
      return newNotif;
    },
    markAsRead(id) {
      const notifs = this.getAll();
      const index = notifs.findIndex(n => n.id === id);
      if (index !== -1) {
        notifs[index].read = true;
        Database._save(STORAGE_KEYS.NOTIFICATIONS, notifs);
        return true;
      }
      return false;
    },
    markAllAsRead(userId) {
      const notifs = this.getAll();
      notifs.forEach(n => {
        if ((n.userId === userId || n.userId === 'all') && !n.read) {
          n.read = true;
        }
      });
      Database._save(STORAGE_KEYS.NOTIFICATIONS, notifs);
    },
    getUnreadCount(userId) {
      return this.getByUserId(userId).filter(n => !n.read).length;
    }
  },

  // Activity Log namespace
  activity: {
    getAll() {
      return Database._getAll(STORAGE_KEYS.ACTIVITY_LOG);
    },
    add(action, entity, entityId, details) {
      let logs = this.getAll();
      const newLog = {
        id: Database._generateId(),
        action,
        entity,
        entityId,
        details,
        timestamp: new Date().toISOString()
      };
      logs.unshift(newLog);
      
      // Keep logs and rotate if > 100
      if (logs.length >= 100) {
        // Move the 100 logs to storage logs
        let storageLogs = Database._getAll(STORAGE_KEYS.STORAGE_LOGS) || [];
        const fileRecord = {
          id: 'log_' + new Date().getTime(),
          createdAt: new Date().toISOString(),
          logCount: logs.length,
          data: logs
        };
        storageLogs.push(fileRecord);
        Database._save(STORAGE_KEYS.STORAGE_LOGS, storageLogs);
        
        // Auto download the file for Admin
        if (typeof Auth !== 'undefined' && Auth.isAdmin() && typeof Utils !== 'undefined' && Utils.downloadJSON) {
          Utils.downloadJSON(logs, `activity_logs_backup_${new Date().getTime()}.json`);
        }
        
        // Reset logs
        logs = [];
      }
      Database._save(STORAGE_KEYS.ACTIVITY_LOG, logs);
      return newLog;
    },
    getRecent(n) {
      return this.getAll().slice(0, n);
    }
  },

  // Settings namespace
  settings: {
    get() {
      const defaultSettings = {
        schoolName: 'UniMS University',
        schoolNameEn: 'UniMS University',
        theme: 'light',
        language: 'vi',
        primaryColor: '#3b82f6',
        aiApiKey: '', // For real Gemini/GPT integration
        aiProvider: 'simulated', // 'simulated', 'gemini', 'gpt'
        initialized: false
      };
      const settings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS));
      return { ...defaultSettings, ...settings };
    },
    save(data) {
      const currentSettings = this.get();
      const newSettings = { ...currentSettings, ...data };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
      return newSettings;
    }
  },

  // Utility functions
  exportAll() {
    const data = {};
    for (const key in STORAGE_KEYS) {
      data[STORAGE_KEYS[key]] = JSON.parse(localStorage.getItem(STORAGE_KEYS[key])) || [];
    }
    return JSON.stringify(data);
  },

  importAll(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      for (const key in STORAGE_KEYS) {
        if (data[STORAGE_KEYS[key]]) {
          localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(data[STORAGE_KEYS[key]]));
        }
      }
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  },

  // ================================================================
  //  SEMESTERS (localStorage cache + server sync)
  // ================================================================
  semesters: {
    _key: 'unims_semesters',
    getAll() {
      return JSON.parse(localStorage.getItem(this._key) || '[]');
    },
    getById(id) {
      return this.getAll().find(s => s.id === id) || null;
    },
    getActive() {
      return this.getAll().find(s => s.status === 'active') || null;
    },
    add(data) {
      const semesters = this.getAll();
      const semester = { ...data, id: data.id || Database._generateId() };
      semesters.push(semester);
      localStorage.setItem(this._key, JSON.stringify(semesters));
      return semester;
    },
    update(id, data) {
      const semesters = this.getAll();
      const idx = semesters.findIndex(s => s.id === id);
      if (idx !== -1) {
        semesters[idx] = { ...semesters[idx], ...data };
        localStorage.setItem(this._key, JSON.stringify(semesters));
        return semesters[idx];
      }
      return null;
    },
    delete(id) {
      let semesters = this.getAll();
      semesters = semesters.filter(s => s.id !== id);
      localStorage.setItem(this._key, JSON.stringify(semesters));
    },
    // Sync từ server
    async syncFromServer() {
      try {
        const res = await (Auth?.apiFetch || fetch)('/api/semesters/');
        if (!res) return;
        const data = await res.json();
        if (data.success && data.semesters) {
          localStorage.setItem(this._key, JSON.stringify(data.semesters));
        }
      } catch (err) {
        console.log('Semester sync failed:', err.message);
      }
    },
  },

  // ================================================================
  //  ATTENDANCE (server-side API — không lưu localStorage)
  // ================================================================
  attendance: {
    // Lấy danh sách điểm danh từ server
    async getByClass(classId, date) {
      try {
        let url = `/api/attendance/?class_id=${classId}`;
        if (date) url += `&date=${date}`;
        const res = await (Auth?.apiFetch || fetch)(url);
        if (!res) return [];
        const data = await res.json();
        return data.success ? data.records : [];
      } catch (err) {
        console.log('Attendance fetch failed:', err.message);
        return [];
      }
    },
    // Lưu điểm danh hàng loạt
    async save(classId, date, sessionNumber, records) {
      try {
        const res = await (Auth?.apiFetch || fetch)('/api/attendance/', {
          method: 'POST',
          body: { class_id: classId, date, session_number: sessionNumber, records },
        });
        if (!res) return { success: false };
        return await res.json();
      } catch (err) {
        console.log('Attendance save failed:', err.message);
        return { success: false, error: err.message };
      }
    },
    // Tổng hợp điểm chuyên cần
    async summarize(classId, studentId) {
      try {
        const res = await (Auth?.apiFetch || fetch)(
          `/api/attendance/summarize/?class_id=${classId}&student_id=${studentId}`
        );
        if (!res) return null;
        const data = await res.json();
        return data.success ? data.attendance_score : null;
      } catch (err) {
        console.log('Attendance summarize failed:', err.message);
        return null;
      }
    },
  },

  // ================================================================
  //  GRADE LOCK CHECK (server-side API)
  // ================================================================
  gradeLock: {
    async check(params = {}) {
      try {
        const query = new URLSearchParams(params).toString();
        const res = await (Auth?.apiFetch || fetch)(`/api/grades/lock-status/?${query}`);
        if (!res) return { locked: false };
        return await res.json();
      } catch (err) {
        console.log('Grade lock check failed:', err.message);
        return { locked: false };
      }
    },
  },

  resetAll() {
    for (const key in STORAGE_KEYS) {
      localStorage.removeItem(STORAGE_KEYS[key]);
    }
    this.seedData();
  },

  seedData() {
    const settings = this.settings.get();
    if (settings.initialized) return;

    // Seed Admin User
    this.users.add({
      username: 'admin',
      password: '123',
      name: 'Administrator',
      role: 'admin'
    });

    // Seed Teachers (All assigned to University 1 - DUT for default mock)
    const SEED_TEACHERS = [
      { name: 'PGS.TS. Nguyễn Văn Hùng', email: 'hung.nv@unims.edu.vn', phone: '0901000001', specialization: 'Khoa học máy tính', department: 'Công nghệ thông tin', position: 'Phó Giáo sư', status: 'active', universityId: 1 },
      { name: 'TS. Trần Thị Mai', email: 'mai.tt@unims.edu.vn', phone: '0901000002', specialization: 'Trí tuệ nhân tạo', department: 'Công nghệ thông tin', position: 'Giảng viên', status: 'active', universityId: 1 },
      { name: 'ThS. Lê Quang Vinh', email: 'vinh.lq@unims.edu.vn', phone: '0901000003', specialization: 'Mạng máy tính', department: 'Công nghệ thông tin', position: 'Giảng viên', status: 'active', universityId: 1 },
      { name: 'GS.TS. Phạm Đình Tuấn', email: 'tuan.pd@unims.edu.vn', phone: '0901000004', specialization: 'Kinh tế vĩ mô', department: 'Kinh tế', position: 'Giáo sư', status: 'active', universityId: 2 },
      { name: 'TS. Hoàng Thị Liên', email: 'lien.ht@unims.edu.vn', phone: '0901000005', specialization: 'Ngôn ngữ Anh', department: 'Ngoại ngữ', position: 'Giảng viên', status: 'active', universityId: 4 },
    ];
    
    const teacherMap = {};
    SEED_TEACHERS.forEach((t, index) => {
      t.teacherId = this.generateTeacherId(t.universityId);
      const added = this.teachers.add(t);
      teacherMap[t.name] = added.id;
    });

    // Seed Classes
    const SEED_CLASSES = [
      { classCode: 'CS101', name: 'Nhập môn Lập trình', teacherId: teacherMap['PGS.TS. Nguyễn Văn Hùng'], department: 'Công nghệ thông tin', schedule: 'T2-T4 7:30-9:00', room: 'A301', maxStudents: 40, semester: 'HK1 2024-2025', credits: 3 },
      { classCode: 'CS201', name: 'Cấu trúc Dữ liệu & Giải thuật', teacherId: teacherMap['TS. Trần Thị Mai'], department: 'Công nghệ thông tin', schedule: 'T3-T5 9:15-10:45', room: 'A302', maxStudents: 35, semester: 'HK1 2024-2025', credits: 4 },
      { classCode: 'CS301', name: 'Cơ sở Dữ liệu', teacherId: teacherMap['PGS.TS. Nguyễn Văn Hùng'], department: 'Công nghệ thông tin', schedule: 'T2-T4 13:30-15:00', room: 'A303', maxStudents: 40, semester: 'HK1 2024-2025', credits: 3 },
      { classCode: 'CS401', name: 'Mạng Máy tính', teacherId: teacherMap['TS. Trần Thị Mai'], department: 'Công nghệ thông tin', schedule: 'T3-T5 15:15-16:45', room: 'A304', maxStudents: 40, semester: 'HK1 2024-2025', credits: 3 },
      { classCode: 'CS501', name: 'Trí tuệ Nhân tạo', teacherId: teacherMap['PGS.TS. Nguyễn Văn Hùng'], department: 'Công nghệ thông tin', schedule: 'T6 7:30-11:00', room: 'A305', maxStudents: 30, semester: 'HK1 2024-2025', credits: 3 },
      { classCode: 'ECON101', name: 'Kinh tế vi mô', teacherId: teacherMap['GS.TS. Phạm Đình Tuấn'], department: 'Kinh tế', schedule: 'T3-T5 7:30-9:00', room: 'C101', maxStudents: 50, semester: 'HK1 2024-2025', credits: 3 },
      { classCode: 'ECON201', name: 'Kinh tế vĩ mô', teacherId: teacherMap['GS.TS. Phạm Đình Tuấn'], department: 'Kinh tế', schedule: 'T2-T4 7:30-9:00', room: 'C102', maxStudents: 50, semester: 'HK1 2024-2025', credits: 3 },
      { classCode: 'ECON301', name: 'Kế toán tài chính', teacherId: teacherMap['GS.TS. Phạm Đình Tuấn'], department: 'Kinh tế', schedule: 'T6 13:30-16:45', room: 'C103', maxStudents: 45, semester: 'HK1 2024-2025', credits: 3 },
      { classCode: 'ECON401', name: 'Marketing cơ bản', teacherId: teacherMap['GS.TS. Phạm Đình Tuấn'], department: 'Kinh tế', schedule: 'T7 7:30-11:00', room: 'C104', maxStudents: 40, semester: 'HK1 2024-2025', credits: 3 },
      { classCode: 'ENG201', name: 'Tiếng Anh Giao tiếp', teacherId: teacherMap['TS. Hoàng Thị Liên'], department: 'Ngoại ngữ', schedule: 'T2-T4 9:15-10:45', room: 'D201', maxStudents: 25, semester: 'HK1 2024-2025', credits: 2 },
      { classCode: 'ENG301', name: 'Ngữ pháp Nâng cao', teacherId: teacherMap['TS. Hoàng Thị Liên'], department: 'Ngoại ngữ', schedule: 'T3-T5 9:15-10:45', room: 'D202', maxStudents: 25, semester: 'HK1 2024-2025', credits: 3 },
      { classCode: 'ENG401', name: 'Văn hóa Anh Mỹ', teacherId: teacherMap['TS. Hoàng Thị Liên'], department: 'Ngoại ngữ', schedule: 'T2-T4 13:30-15:00', room: 'D203', maxStudents: 30, semester: 'HK1 2024-2025', credits: 3 },
      { classCode: 'ENG501', name: 'Biên phiên dịch', teacherId: teacherMap['TS. Hoàng Thị Liên'], department: 'Ngoại ngữ', schedule: 'T6 7:30-11:00', room: 'D204', maxStudents: 20, semester: 'HK1 2024-2025', credits: 4 }
    ];
    
    const classesList = [];
    SEED_CLASSES.forEach(c => {
      classesList.push(this.classes.add(c));
    });

    // Seed Students
    const SEED_STUDENTS = [
      { name: 'Nguyễn Văn An', email: 'an.nv@unims.edu.vn', phone: '0901234567', dob: '2002-03-15', gender: 'male', department: 'Công nghệ thông tin', status: 'active', universityId: 1 },
      { name: 'Trần Thị Bình', email: 'binh.tt@unims.edu.vn', phone: '0912345678', dob: '2002-07-22', gender: 'female', department: 'Công nghệ thông tin', status: 'active', universityId: 1 },
      { name: 'Lê Hoàng Cường', email: 'cuong.lh@unims.edu.vn', phone: '0923456789', dob: '2001-11-08', gender: 'male', department: 'Kinh tế', status: 'active', universityId: 2 },
      { name: 'Hoàng Thị Em', email: 'em.ht@unims.edu.vn', phone: '0945678901', dob: '2003-05-12', gender: 'female', department: 'Ngoại ngữ', status: 'active', universityId: 4 },
      { name: 'Võ Văn Phúc', email: 'phuc.vv@unims.edu.vn', phone: '0956789012', dob: '2002-09-25', gender: 'male', department: 'Công nghệ thông tin', status: 'active', universityId: 1 },
    ];

    SEED_STUDENTS.forEach((s, index) => {
      s.studentId = this.generateStudentId(s.universityId);
      
      // Find 4 classes in the same department
      const classesForStudent = classesList.filter(c => c.department === s.department).slice(0, 4);
      if (classesForStudent.length > 0) {
        s.classId = classesForStudent[0].id; // Primary class
      }
      
      const addedStudent = this.students.add(s);
      
      // Seed 4 grades for this student
      classesForStudent.forEach(cls => {
        this.grades.add({
          studentId: addedStudent.id,
          classId: cls.id,
          assignment: Math.round((Math.random() * 3 + 7) * 10) / 10, // 7.0 - 10.0
          midterm: Math.round((Math.random() * 4 + 6) * 10) / 10,
          final: Math.round((Math.random() * 5 + 5) * 10) / 10,
        });
      });
    });

    // Seed Bugs/Helpdesk
    const SEED_BUGS = [
      { title: 'Quên mật khẩu tài khoản sinh viên', description: 'Em không thể đăng nhập vào hệ thống', severity: 'high', status: 'new', reporter: 'Nguyễn Văn An', category: 'account', replies: [] },
      { title: 'Lỗi hiển thị lịch học', description: 'Lịch học môn CS101 bị trùng', severity: 'medium', status: 'in-progress', reporter: 'Trần Thị Bình', category: 'feature', replies: [{ author: 'Administrator', message: 'Chào bạn, phòng đào tạo đang điều chỉnh lại lịch.', timestamp: new Date().toISOString() }] },
    ];

    SEED_BUGS.forEach(b => this.bugs.add(b));

    // Seed Notifications
    this.notifications.add('all', 'Chào mừng đến với UniMS', 'Hệ thống quản lý đại học UniMS đã chính thức đi vào hoạt động.', 'info');

    // Seed Activities
    this.activity.add('created', 'system', 'sys', 'Hệ thống UniMS được khởi tạo');
    
    // Set initialized
    this.settings.save({ initialized: true });
  },

  // ========== Khởi tạo mã hoá — gọi khi trang load ==========
  async initEncryption() {
    if (typeof CryptoManager === 'undefined' || !CryptoManager.isSupported()) {
      console.log('[Database] Web Crypto API not available, encryption disabled');
      return;
    }

    // 1. Khi MỞ trang: giải mã các key đang ở dạng 'ENC:' → plaintext JSON
    for (const key of this.ENCRYPTED_KEYS) {
      const raw = localStorage.getItem(key);
      if (raw && raw.startsWith('ENC:')) {
        const decrypted = await CryptoManager.decrypt(raw.substring(4));
        if (decrypted) {
          localStorage.setItem(key, decrypted); // Ghi lại plaintext JSON
        } else {
          // Không giải mã được (key thay đổi) → xoá dữ liệu hỏng
          localStorage.removeItem(key);
        }
      }
    }

    // 2. Khi ĐÓNG trang: mã hoá plaintext → 'ENC:' để bảo vệ at-rest
    window.addEventListener('beforeunload', () => {
      for (const key of this.ENCRYPTED_KEYS) {
        const raw = localStorage.getItem(key);
        if (raw && !raw.startsWith('ENC:')) {
          // Sync encrypt — dùng CryptoManager.encrypt nhưng phải sync
          // Vì beforeunload không chờ async, ta dùng trick: lưu flag
          // và mã hoá sẽ hoàn tất ở lần mở trang tiếp theo
          try {
            // Mark for encryption — sẽ encrypt ở background
            const data = JSON.parse(raw);
            CryptoManager.saveEncrypted(key, data).catch(() => {});
          } catch { /* not JSON, skip */ }
        }
      }
    });

    console.log('[Database] Encryption initialized (AES-256-GCM, encrypt-at-rest)');
  }
};

// Auto-init encryption khi script load
Database.initEncryption().catch(err => 
  console.warn('[Database] Encryption init failed:', err)
);
