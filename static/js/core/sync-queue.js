// sync-queue.js — UniMS Offline Sync Queue
// Hàng đợi đồng bộ: khi mất mạng, lưu các thao tác vào queue.
// Khi có mạng trở lại → tự động replay queue lên server.
// Conflict Resolution: Last-write-wins (dựa trên timestamp).

const SyncQueue = {
  QUEUE_KEY: 'unims_sync_queue',
  SYNC_STATUS_KEY: 'unims_sync_status',
  _retryTimer: null,
  _isProcessing: false,
  MAX_RETRIES: 5,
  RETRY_DELAY_MS: 3000,   // 3 giây giữa các lần retry
  BATCH_SIZE: 10,          // Gửi tối đa 10 actions/lần

  // ========== Queue Management ==========

  _getQueue() {
    try {
      return JSON.parse(localStorage.getItem(this.QUEUE_KEY)) || [];
    } catch {
      return [];
    }
  },

  _saveQueue(queue) {
    localStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
    this._updateStatusUI();
  },

  /**
   * Thêm action vào hàng đợi (gọi khi offline hoặc sync thất bại)
   * @param {string} action - Tên hành động (vd: 'upsert_student', 'delete_class')
   * @param {object} data - Dữ liệu cần đồng bộ
   */
  enqueue(action, data) {
    const queue = this._getQueue();
    queue.push({
      id: Date.now().toString(36) + Math.random().toString(36).substring(2, 7),
      action,
      data,
      timestamp: new Date().toISOString(),
      retries: 0,
    });
    this._saveQueue(queue);
    console.log(`[SyncQueue] Enqueued: ${action} (queue size: ${queue.length})`);
  },

  /**
   * Xoá 1 item khỏi queue (sau khi sync thành công)
   */
  dequeue(itemId) {
    const queue = this._getQueue().filter(item => item.id !== itemId);
    this._saveQueue(queue);
  },

  /**
   * Lấy số lượng pending items
   */
  getPendingCount() {
    return this._getQueue().length;
  },

  // ========== Online/Offline Detection ==========

  init() {
    // Lắng nghe sự kiện online/offline
    window.addEventListener('online', () => {
      console.log('[SyncQueue] Network online — starting sync');
      this._showToast('Đã có kết nối mạng. Đang đồng bộ dữ liệu...', 'info');
      this.processQueue();
    });

    window.addEventListener('offline', () => {
      console.log('[SyncQueue] Network offline — queuing changes');
      this._showToast('Mất kết nối mạng. Dữ liệu sẽ được lưu tạm và đồng bộ khi có mạng.', 'warning');
    });

    // Nếu đang online và có items trong queue → sync ngay
    if (navigator.onLine && this.getPendingCount() > 0) {
      setTimeout(() => this.processQueue(), 2000);
    }

    this._updateStatusUI();
  },

  // ========== Process Queue (Replay) ==========

  async processQueue() {
    if (this._isProcessing) return;
    if (!navigator.onLine) return;

    const queue = this._getQueue();
    if (queue.length === 0) return;

    this._isProcessing = true;
    console.log(`[SyncQueue] Processing ${queue.length} pending items...`);

    // Xử lý theo batch
    const batch = queue.slice(0, this.BATCH_SIZE);
    let successCount = 0;
    let failCount = 0;

    for (const item of batch) {
      try {
        const success = await this._sendToServer(item);
        if (success) {
          this.dequeue(item.id);
          successCount++;
        } else {
          item.retries = (item.retries || 0) + 1;
          if (item.retries >= this.MAX_RETRIES) {
            console.warn(`[SyncQueue] Item ${item.id} exceeded max retries, removing`);
            this.dequeue(item.id);
            failCount++;
          }
        }
      } catch (err) {
        console.error(`[SyncQueue] Error processing item ${item.id}:`, err);
        item.retries = (item.retries || 0) + 1;
        failCount++;
      }
    }

    // Cập nhật queue với retry counts mới
    const updatedQueue = this._getQueue();
    this._saveQueue(updatedQueue);

    this._isProcessing = false;

    // Log kết quả
    if (successCount > 0) {
      this._showToast(`Đồng bộ thành công ${successCount} thay đổi.`, 'success');
    }
    if (failCount > 0) {
      this._showToast(`${failCount} thay đổi không thể đồng bộ.`, 'error');
    }

    // Nếu vẫn còn items → retry sau delay
    if (this.getPendingCount() > 0 && navigator.onLine) {
      this._retryTimer = setTimeout(() => this.processQueue(), this.RETRY_DELAY_MS);
    }
  },

  // ========== Gửi 1 item lên server ==========

  async _sendToServer(item) {
    const token = (typeof Auth !== 'undefined') ? Auth.getServerToken() : '';
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['X-Session-Token'] = token;

    try {
      const response = await fetch('/api/sync/up/', {
        method: 'POST',
        credentials: 'include',
        headers: headers,
        body: JSON.stringify({
          action: item.action,
          data: {
            ...item.data,
            _sync_timestamp: item.timestamp,  // Last-write-wins: server dùng timestamp này
            _sync_queue_id: item.id,
          },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        // Kiểm tra conflict
        if (result.conflict) {
          console.warn(`[SyncQueue] Conflict detected for ${item.action}:`, result.conflict);
          // Last-write-wins: nếu server data mới hơn → bỏ qua local change
          if (result.conflict === 'server_wins') {
            return true; // Coi như đã xử lý
          }
        }
        return result.success !== false;
      }

      // HTTP error
      if (response.status === 401) {
        // Session hết hạn — không retry
        console.warn('[SyncQueue] Session expired, cannot sync');
        return false;
      }

      return false;
    } catch (err) {
      // Network error — sẽ retry
      return false;
    }
  },

  // ========== UI Helpers ==========

  _updateStatusUI() {
    const count = this.getPendingCount();
    const badge = document.getElementById('sync-queue-badge');
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'inline-flex' : 'none';
    }

    // Cập nhật sync status indicator
    const indicator = document.getElementById('sync-status');
    if (indicator) {
      if (!navigator.onLine) {
        indicator.className = 'sync-offline';
        indicator.title = 'Offline — Dữ liệu lưu tạm';
      } else if (count > 0) {
        indicator.className = 'sync-pending';
        indicator.title = `${count} thay đổi đang chờ đồng bộ`;
      } else {
        indicator.className = 'sync-ok';
        indicator.title = 'Đã đồng bộ';
      }
    }
  },

  _showToast(message, type = 'info') {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        toast: true,
        position: 'bottom-end',
        icon: type,
        title: message,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    }
  },

  // ========== Tích hợp với Database._syncUp ==========
  // Gọi hàm này thay cho fetch trực tiếp khi offline

  smartSync(action, data) {
    if (navigator.onLine) {
      // Online → sync trực tiếp (fire-and-forget)
      Database._syncUp(action, data);
    } else {
      // Offline → enqueue
      this.enqueue(action, data);
    }
  },
};

// Auto-init khi script load
SyncQueue.init();
