// js/components/LoginBackground.js
window.LoginBackground = class {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    
    this.canvas.style.touchAction = 'none'; // Prevent scroll on mobile touch
    this.ctx = this.canvas.getContext('2d');
    this.blocks = [];
    this.currentTheme = 'none'; // Default to no theme until selected
    
    // Interaction states
    this.draggedBlock = null;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;
    this.pointerVelX = 0;
    this.pointerVelY = 0;
    this.lastPointerX = 0;
    this.lastPointerY = 0;

    // Tooltip
    this.tooltip = document.createElement('div');
    this.tooltip.id = 'login-interactive-tooltip';
    this.tooltip.style.cssText = `
      position: fixed;
      display: none;
      background: rgba(15, 23, 42, 0.9);
      color: #fff;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 600;
      pointer-events: none;
      z-index: 9999;
      transform: translate(-50%, -150%);
      transition: opacity 0.2s;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
      backdrop-filter: blur(4px);
      white-space: nowrap;
    `;
    document.body.appendChild(this.tooltip);
    this.tooltipTimeout = null;

    this.W = () => this.canvas.width;
    this.H = () => this.canvas.height;
    
    this.resize();
    window.addEventListener('resize', () => this.resize());
    
    this.bindEvents();
    
    // Start loop
    this.animFrame = null;
    this.animate();
  }

  resize() {
    const oldW = this.canvas.width;
    const oldH = this.canvas.height;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    
    // Resync objects on significant resize or orientation change
    if (oldW && (Math.abs(oldW - window.innerWidth) > 50 || Math.abs(oldH - window.innerHeight) > 50)) {
      if (this.currentTheme !== 'none') {
        this.spawnBlocks();
      }
    }
  }

  showTooltip(x, y, text) {
    this.tooltip.innerHTML = text;
    this.tooltip.style.left = x + 'px';
    this.tooltip.style.top = y + 'px';
    this.tooltip.style.display = 'block';
    this.tooltip.style.opacity = '1';

    if (this.tooltipTimeout) clearTimeout(this.tooltipTimeout);
    this.tooltipTimeout = setTimeout(() => {
      this.tooltip.style.opacity = '0';
      setTimeout(() => { this.tooltip.style.display = 'none'; }, 200);
    }, 2500);
  }

  setTheme(themeName) {
    this.currentTheme = themeName;
    this.spawnBlocks();
    // Do NOT modify the container's background here, letting the user's color choice persist.
  }

  spawnBlocks() {
    this.blocks = [];
    if (this.currentTheme === 'none') return; // No blocks by default
    
    const scale = Math.min(1, Math.min(this.W(), this.H()) / 800); // Responsive scale for mobile
    let count = 15;
    
    const isEn = typeof LoginView !== 'undefined' && LoginView.currentLang === 'en';
    
    // Theme Data
    const fruits = ['🍎', '🍌', '🍉', '🍇', '🍓', '🥝', '🍒', '🍍'];
    const planets = [
      { i: '☀️', n: isEn ? 'Sun' : 'Mặt trời', r: 0 },
      { i: '🌕', n: isEn ? 'Mercury' : 'Sao Thủy', r: 100 },
      { i: '🪐', n: isEn ? 'Venus' : 'Sao Kim', r: 170 },
      { i: '🌍', n: isEn ? 'Earth' : 'Trái Đất', r: 240 },
      { i: '🔴', n: isEn ? 'Mars' : 'Sao Hỏa', r: 310 },
      { i: '🌑', n: isEn ? 'Jupiter' : 'Sao Mộc', r: 400 }
    ];
    const unis = ['DUT', 'DUE', 'VKU', 'UFLS', 'UED', 'UMP', 'VNUK', 'UTE', 'DTU', 'DAU', 'DongA', 'FPT'];
    const uniNamesVi = {
      'DUT': 'Đại học Bách Khoa', 'DUE': 'Đại học Kinh tế', 'VKU': 'Đại học CNTT & TT Việt - Hàn',
      'UFLS': 'Đại học Ngoại ngữ', 'UED': 'Đại học Sư phạm', 'UMP': 'Khoa Y Dược', 'VNUK': 'Viện NC&ĐT Việt - Anh',
      'UTE': 'Đại học Sư phạm Kỹ thuật', 'DTU': 'Đại học Duy Tân', 'DAU': 'Đại học Kiến trúc Đà Nẵng', 
      'DongA': 'Đại học Đông Á', 'FPT': 'Đại học FPT Đà Nẵng'
    };
    const uniNamesEn = {
      'DUT': 'University of Science & Tech', 'DUE': 'University of Economics', 'VKU': 'Vietnam-Korea University of IT',
      'UFLS': 'University of Foreign Languages', 'UED': 'University of Education', 'UMP': 'School of Medicine & Pharmacy', 'VNUK': 'VNUK Institute',
      'UTE': 'University of Technical Education', 'DTU': 'Duy Tan University', 'DAU': 'Da Nang Architecture University', 
      'DongA': 'Dong A University', 'FPT': 'FPT University Da Nang'
    };
    const uniNames = isEn ? uniNamesEn : uniNamesVi;

    if (this.currentTheme === 'planets') {
      // Spawn Planets in orbit
      for (let i = 0; i < planets.length; i++) {
        const p = planets[i];
        this.createBlock(p.i, p.n, {
          isPlanet: true,
          orbitRadius: p.r * scale,
          angle: Math.random() * Math.PI * 2,
          orbitSpeed: p.r === 0 ? 0 : (0.5 + Math.random() * 1.5) / p.r, // Slower for further planets
          size: (p.r === 0 ? 90 : 50 + Math.random() * 20) * scale
        });
      }
      
      // Spawn Asteroids
      const asteroids = ['☄️', '🌑', '🪨', '✨'];
      for (let i = 0; i < 10; i++) {
        const ast = asteroids[Math.floor(Math.random() * asteroids.length)];
        this.createBlock(ast, null, {
          isPlanet: false,
          isAsteroid: true,
          size: (10 + Math.random() * 8) * scale, // Very small
          speed: 1.5 // Slow initial speed
        });
      }
    } else if (this.currentTheme === 'unis') {
      // Spawn Unis uniquely
      for (let i = 0; i < unis.length; i++) {
        const u = unis[i];
        this.createBlock(u, uniNames[u], { size: 60 * Math.max(0.6, scale), speed: 1.5 });
      }
    } else if (this.currentTheme === 'fruits') {
      // Fruits
      for (let i = 0; i < count; i++) {
        const f = fruits[Math.floor(Math.random() * fruits.length)];
        this.createBlock(f, null, { size: (40 + Math.random() * 30) * Math.max(0.6, scale), speed: 4 });
      }
    }
  }

  createBlock(iconText, infoText, options) {
    const size = options.size || 50;
    
    // Create offscreen canvas for crisp rendering
    const off = document.createElement('canvas');
    off.width = size * 2;
    off.height = size * 2;
    const oCtx = off.getContext('2d');
    oCtx.textBaseline = 'middle';
    oCtx.textAlign = 'center';
    
    if (this.currentTheme === 'unis') {
      // Draw University Logo block
      oCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      oCtx.beginPath();
      oCtx.roundRect(0, 0, off.width, off.height, 16);
      oCtx.fill();
      oCtx.strokeStyle = 'rgba(0,0,0,0.1)';
      oCtx.stroke();
      oCtx.fillStyle = '#1e293b';
      oCtx.font = `bold ${size * 0.6}px Inter, sans-serif`;
      oCtx.fillText(iconText, size, size);
    } else {
      // Draw Emoji
      oCtx.font = `${size * 1.2}px sans-serif`;
      oCtx.fillText(iconText, size, size * 1.1);
    }

    const block = {
      img: off,
      w: size,
      h: size,
      x: options.startX !== undefined ? options.startX : Math.random() * (this.W() - size),
      y: options.startY !== undefined ? options.startY : Math.random() * (this.H() - size),
      vx: (Math.random() - 0.5) * (options.speed || 0),
      vy: (Math.random() - 0.5) * (options.speed || 0),
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.05,
      opacity: 0.1 + Math.random() * 0.9,
      isDragging: false,
      info: infoText,
      // Types
      isPlanet: options.isPlanet,
      isAsteroid: options.isAsteroid,
      orbitRadius: options.orbitRadius,
      angle: options.angle,
      orbitSpeed: options.orbitSpeed
    };

    // Center Sun
    if (block.orbitRadius === 0) {
      block.x = this.W() / 2 - block.w / 2;
      block.y = this.H() / 2 - block.h / 2;
    }

    this.blocks.push(block);
  }

  bindEvents() {
    const handleDown = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      let clicked = false;
      for (let i = this.blocks.length - 1; i >= 0; i--) {
        const b = this.blocks[i];
        // Center based hit detection
        const cx = b.x + b.w/2;
        const cy = b.y + b.h/2;
        const dist = Math.sqrt(Math.pow(x - cx, 2) + Math.pow(y - cy, 2));
        
        if (dist <= b.w/2 + 10) { // Slight padding for easier grab
          b.isDragging = true;
          this.draggedBlock = b;
          this.dragOffsetX = x - b.x;
          this.dragOffsetY = y - b.y;
          b.vx = 0;
          b.vy = 0;
          this.lastPointerX = x;
          this.lastPointerY = y;
          clicked = true;
          
          if (b.info) {
            this.showTooltip(clientX, clientY, b.info);
          }
          break;
        }
      }
    };

    const handleMove = (e) => {
      if (!this.draggedBlock) return;
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      this.draggedBlock.x = x - this.dragOffsetX;
      this.draggedBlock.y = y - this.dragOffsetY;

      this.pointerVelX = x - this.lastPointerX;
      this.pointerVelY = y - this.lastPointerY;
      this.lastPointerX = x;
      this.lastPointerY = y;
    };

    const handleUp = () => {
      if (this.draggedBlock) {
        this.draggedBlock.isDragging = false;
        // Apply throwing momentum (cap speed to avoid crazy flying)
        if (!this.draggedBlock.isPlanet) {
          const limit = this.draggedBlock.isAsteroid ? 3 : 10; // Asteroids throw very slow
          const throwMul = this.draggedBlock.isAsteroid ? 0.2 : 0.4;
          this.draggedBlock.vx = Math.max(-limit, Math.min(limit, this.pointerVelX * throwMul));
          this.draggedBlock.vy = Math.max(-limit, Math.min(limit, this.pointerVelY * throwMul));
        }
        this.draggedBlock = null;
      }
    };

    this.canvas.addEventListener('mousedown', handleDown);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    this.canvas.addEventListener('touchstart', (e) => { e.preventDefault(); handleDown(e); }, { passive: false });
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleUp);
  }

  animate = () => {
    this.ctx.clearRect(0, 0, this.W(), this.H());
    const w = this.W();
    const h = this.H();

    this.ctx.imageSmoothingEnabled = true;

    const isFruits = this.currentTheme === 'fruits';
    const isPlanets = this.currentTheme === 'planets';
    
    // Center for planets
    const centerX = w / 2;
    const centerY = h / 2;

    if (isPlanets) {
      this.ctx.save();
      this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)'; // Vòng đen nhạt
      this.ctx.lineWidth = 1.5;
      this.ctx.setLineDash([6, 6]); // Nét đứt cho giống bản đồ sao
      
      const radii = new Set();
      this.blocks.forEach(b => {
        if (b.orbitRadius > 0) radii.add(b.orbitRadius);
      });
      
      radii.forEach(r => {
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        this.ctx.stroke();
      });
      this.ctx.restore();
    }

    for (let i = 0; i < this.blocks.length; i++) {
      const b = this.blocks[i];
      
      if (!b.isDragging) {
        if (isPlanets && b.isPlanet) {
          if (b.orbitRadius > 0) {
            b.angle += b.orbitSpeed;
            // Snap back to orbit softly if thrown or dragged
            const targetX = centerX + Math.cos(b.angle) * b.orbitRadius - b.w/2;
            const targetY = centerY + Math.sin(b.angle) * b.orbitRadius - b.h/2;
            b.x += (targetX - b.x) * 0.05;
            b.y += (targetY - b.y) * 0.05;
          } else {
            // Sun stays in center
            b.x = centerX - b.w/2;
            b.y = centerY - b.h/2;
          }
        } else {
          // Bouncy physics for Fruits, Unis, and Asteroids
          // Fluid friction (dampening)
          b.vx *= 0.995;
          b.vy *= 0.995;
          
          // Brownian motion / Wind drift for natural acceleration
          b.vx += (Math.random() - 0.5) * 0.05;
          b.vy += (Math.random() - 0.5) * 0.05;

          b.x += b.vx;
          b.y += b.vy;
          b.rotation += b.rotSpeed;

          // Wall bounce (Asteroids lose a lot of speed)
          const bnc = b.isAsteroid ? -0.5 : -1;
          if (b.x <= 0) { b.x = 0; b.vx *= bnc; }
          if (b.x + b.w >= w) { b.x = w - b.w; b.vx *= bnc; }
          if (b.y <= 0) { b.y = 0; b.vy *= bnc; }
          if (b.y + b.h >= h) { b.y = h - b.h; b.vy *= bnc; }
        }
      }

      // Recover squash
      if (b.squash && b.squash > 1) {
        b.squash -= 0.05;
        if (b.squash < 1) b.squash = 1;
      } else {
        b.squash = 1;
      }

      // Block collision (Elastic Circular Collision)
      for (let j = i + 1; j < this.blocks.length; j++) {
        const b2 = this.blocks[j];
        if (b.isDragging || b2.isDragging) continue;

        const cx1 = b.x + b.w / 2; const cy1 = b.y + b.h / 2;
        const cx2 = b2.x + b2.w / 2; const cy2 = b2.y + b2.h / 2;
        const dx = cx2 - cx1;
        const dy = cy2 - cy1;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = (b.w + b2.w) / 2;

        if (dist < minDist && dist > 0) {
          // Planets don't collide with each other
          if (b.isPlanet && b2.isPlanet) continue;

          // Normalize vector
          const nx = dx / dist;
          const ny = dy / dist;

          // Relative velocity
          const dvx = b.vx - b2.vx;
          const dvy = b.vy - b2.vy;
          const dotProduct = dvx * nx + dvy * ny;

          // Only resolve if moving towards each other
          if (dotProduct > 0) {
            const isAst = b.isAsteroid || b2.isAsteroid;
            const restitution = isAst ? 0.5 : 0.9; // Bounciness
            
            // Mass proportional to area (w^2)
            const m1 = b.w * b.w;
            const m2 = b2.w * b2.w;
            const mTotal = m1 + m2;
            
            if (b.isPlanet || b2.isPlanet) {
              const heavy = b.isPlanet ? b : b2;
              const light = b.isPlanet ? b2 : b;
              
              // Light object bounces off heavy object
              const lnx = light === b ? nx : -nx;
              const lny = light === b ? ny : -ny;
              const lightV = light.vx * lnx + light.vy * lny;
              
              light.vx -= 2 * lightV * lnx * restitution;
              light.vy -= 2 * lightV * lny * restitution;
              light.flash = 12;
            } else {
              // 1D elastic collision along normal
              const impulse = (2 * dotProduct) / mTotal;
              
              b.vx -= impulse * m2 * nx * restitution;
              b.vy -= impulse * m2 * ny * restitution;
              b2.vx += impulse * m1 * nx * restitution;
              b2.vy += impulse * m1 * ny * restitution;
              
              // Apply squashing effect
              b.squash = 1.15;
              b2.squash = 1.15;
              b.flash = 12; b2.flash = 12;
            }
          }

          // Positional correction to prevent sticking
          const overlap = minDist - dist;
          const correctionX = nx * (overlap / 2) * 0.5;
          const correctionY = ny * (overlap / 2) * 0.5;
          if (!b.isPlanet) { b.x -= correctionX; b.y -= correctionY; }
          if (!b2.isPlanet) { b2.x += correctionX; b2.y += correctionY; }
        }
      }

      // Draw
      this.ctx.save();
      const cx = b.x + b.w / 2;
      const cy = b.y + b.h / 2;
      this.ctx.translate(cx, cy);
      
      if (b.isDragging) {
        this.ctx.rotate(this.pointerVelX * 0.05);
        this.ctx.scale(1.1, 1.1);
      } else {
        this.ctx.rotate(b.rotation);
      }

      // Apply squash for slime bounce
      if (b.squash > 1) {
        this.ctx.scale(b.squash, 2 - b.squash); 
      }

      if (b.isDragging || (b.flash && b.flash > 0)) {
        this.ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
        this.ctx.shadowBlur = b.isDragging ? 30 : 20;
        if (b.flash) b.flash--;
      }

      const hw = b.w / 2;
      const hh = b.h / 2;
      this.ctx.drawImage(b.img, -hw, -hh, b.w, b.h);
      this.ctx.restore();
    }

    this.animFrame = requestAnimationFrame(this.animate);
  }

  destroy() {
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    if (this.tooltip) this.tooltip.remove();
  }
}
