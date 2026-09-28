import re

with open(r'd:\24CT1-DO_NGUYEN_HAO\static\js\views\review.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove 'this._globalEventsBound = true;\n    }' from its current place
content = content.replace('      this._globalEventsBound = true;\n    }\n\n    // Intercept', '      // Intercept')

# Add it to the end of bindEvents()
content = content.replace('''    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideLoginModal();
        this.hideInfoModal();
      }
    });
  },''', '''    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideLoginModal();
        this.hideInfoModal();
      }
    });
    
    this._globalEventsBound = true;
    }
  },''')

with open(r'd:\24CT1-DO_NGUYEN_HAO\static\js\views\review.js', 'w', encoding='utf-8') as f:
    f.write(content)
