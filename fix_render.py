import re

with open(r'd:\24CT1-DO_NGUYEN_HAO\static\js\views\review.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('''  renderContent() {
    const content = document.getElementById('review-content');
    if (!content) return;
    
    // Add fade-in reset by cloning and replacing
    const newContent = content.cloneNode(false);
    content.parentNode.replaceChild(newContent, content);''', '''  renderContent() {
    const content = document.getElementById('review-content');
    if (!content) return;
    
    // Reset fade-in animation safely without destroying DOM node
    content.style.animation = 'none';
    void content.offsetWidth; // trigger reflow
    content.style.animation = 'rvFadeIn 0.3s ease';
    
    const newContent = content;''')

with open(r'd:\24CT1-DO_NGUYEN_HAO\static\js\views\review.js', 'w', encoding='utf-8') as f:
    f.write(content)
