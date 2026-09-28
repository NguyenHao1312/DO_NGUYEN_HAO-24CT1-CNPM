import re

with open(r'd:\24CT1-DO_NGUYEN_HAO\static\js\views\review.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix init method
content = re.sub(
    r'init\(\)\s*\{[^{}]*this\.renderTabs\(\);.*?\}',
    '''init() {
    this.initScrollQoL(); // MUST run before renderContent to initialize revealObserver
    this.renderTabs();
    this.renderContent();
    this.bindEvents();
    this.initClock();
    this.updateTranslations();

    if (window.location.hash === '#login') {
      setTimeout(() => this.showLoginModal(), 300);
    }
  }''',
    content,
    flags=re.DOTALL
)

with open(r'd:\24CT1-DO_NGUYEN_HAO\static\js\views\review.js', 'w', encoding='utf-8') as f:
    f.write(content)
