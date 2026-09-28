// crypto.js — UniMS AES-GCM Encryption Module
// Mã hoá/giải mã dữ liệu cache offline trong localStorage.
// Sử dụng Web Crypto API (chuẩn trình duyệt, không phụ thuộc thư viện ngoài).
// Token KHÔNG lưu ở đây — token dùng HttpOnly Cookie.

const CryptoManager = {
  _DB_NAME: 'unims_keystore',
  _STORE_NAME: 'keys',
  _KEY_ID: 'aes-gcm-master',
  _cachedKey: null,

  // ========== IndexedDB Key Storage ==========
  // Lưu AES key trong IndexedDB (khó bị XSS truy cập hơn localStorage)

  _openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this._DB_NAME, 1);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(this._STORE_NAME)) {
          db.createObjectStore(this._STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror = (e) => reject(e.target.error);
    });
  },

  async _storeKey(cryptoKey) {
    const db = await this._openDB();
    const exported = await crypto.subtle.exportKey('jwk', cryptoKey);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this._STORE_NAME, 'readwrite');
      tx.objectStore(this._STORE_NAME).put({ id: this._KEY_ID, jwk: exported });
      tx.oncomplete = () => resolve();
      tx.onerror = (e) => reject(e.target.error);
    });
  },

  async _loadKey() {
    const db = await this._openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this._STORE_NAME, 'readonly');
      const req = tx.objectStore(this._STORE_NAME).get(this._KEY_ID);
      req.onsuccess = (e) => {
        if (e.target.result) {
          crypto.subtle.importKey(
            'jwk', e.target.result.jwk,
            { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']
          ).then(resolve).catch(reject);
        } else {
          resolve(null);
        }
      };
      req.onerror = (e) => reject(e.target.error);
    });
  },

  // ========== Key Management ==========

  async _getOrCreateKey() {
    // Cache in memory để không query IndexedDB mỗi lần
    if (this._cachedKey) return this._cachedKey;

    // Thử load từ IndexedDB
    let key = await this._loadKey();
    if (!key) {
      // Tạo key mới (256-bit AES-GCM)
      key = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true, // extractable (để export vào IndexedDB)
        ['encrypt', 'decrypt']
      );
      await this._storeKey(key);
      console.log('[CryptoManager] Generated new AES-256-GCM master key');
    }

    this._cachedKey = key;
    return key;
  },

  // ========== Encrypt / Decrypt ==========

  async encrypt(plainText) {
    try {
      const key = await this._getOrCreateKey();
      const encoder = new TextEncoder();
      const data = encoder.encode(plainText);

      // IV 12 bytes (96 bits) — chuẩn cho AES-GCM
      const iv = crypto.getRandomValues(new Uint8Array(12));

      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        data
      );

      // Kết hợp IV + ciphertext → base64
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(encrypted), iv.length);

      return btoa(String.fromCharCode(...combined));
    } catch (err) {
      console.error('[CryptoManager] Encrypt error:', err);
      return null;
    }
  },

  async decrypt(base64Cipher) {
    try {
      const key = await this._getOrCreateKey();

      // Decode base64 → IV + ciphertext
      const combined = Uint8Array.from(atob(base64Cipher), c => c.charCodeAt(0));
      const iv = combined.slice(0, 12);
      const ciphertext = combined.slice(12);

      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        ciphertext
      );

      return new TextDecoder().decode(decrypted);
    } catch (err) {
      // Key thay đổi hoặc dữ liệu hỏng → trả null, caller xử lý fallback
      console.warn('[CryptoManager] Decrypt failed (key changed or data corrupted)');
      return null;
    }
  },

  // ========== High-level API cho Database ==========
  // Wrap JSON data → encrypt → store / load → decrypt → parse

  async saveEncrypted(storageKey, data) {
    const json = JSON.stringify(data);
    const cipher = await this.encrypt(json);
    if (cipher) {
      localStorage.setItem(storageKey, 'ENC:' + cipher);
    } else {
      // Fallback: lưu plaintext nếu mã hoá thất bại
      localStorage.setItem(storageKey, json);
    }
  },

  async loadEncrypted(storageKey) {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];

    // Kiểm tra prefix ENC: để biết dữ liệu đã mã hoá hay chưa
    if (raw.startsWith('ENC:')) {
      const decrypted = await this.decrypt(raw.substring(4));
      if (decrypted) {
        return JSON.parse(decrypted);
      }
      // Giải mã thất bại → dữ liệu cũ/hỏng, trả mảng rỗng
      console.warn(`[CryptoManager] Cannot decrypt ${storageKey}, returning empty`);
      return [];
    }

    // Dữ liệu cũ chưa mã hoá → parse bình thường (backward compatible)
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  // ========== Migrate: mã hoá toàn bộ dữ liệu plaintext cũ ==========
  async migrateToEncrypted(storageKeys) {
    let migrated = 0;
    for (const key of storageKeys) {
      const raw = localStorage.getItem(key);
      if (raw && !raw.startsWith('ENC:')) {
        try {
          const data = JSON.parse(raw);
          await this.saveEncrypted(key, data);
          migrated++;
        } catch {
          // Không phải JSON, bỏ qua
        }
      }
    }
    if (migrated > 0) {
      console.log(`[CryptoManager] Migrated ${migrated} keys to encrypted storage`);
    }
  },

  // Kiểm tra trình duyệt hỗ trợ Web Crypto API
  isSupported() {
    return !!(crypto && crypto.subtle && crypto.subtle.generateKey);
  },
};
