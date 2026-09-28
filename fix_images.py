import re

with open(r'd:\24CT1-DO_NGUYEN_HAO\static\js\views\review.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace 1: BGD.jfif in newsData
content = re.sub(
    r"title:\s*'Nhiều trường Đại học công bố phương án tuyển sinh 2026',(.+?)imgUrl:\s*'https://images\.unsplash\.com/photo-1523050854058-8df90110c9f1\?w=800&q=80'",
    r"title: 'Nhiều trường Đại học công bố phương án tuyển sinh 2026',\1imgUrl: '/static/assets/logos/BGD.jfif'",
    content,
    flags=re.DOTALL
)

# Replace 2: MTHT.jfif in Môi trường học tập
content = re.sub(
    r'<img src="https://images\.unsplash\.com/photo-1523050854058-8df90110c9f1\?w=800&q=80" alt="Môi trường học tập"',
    r'<img src="/static/assets/logos/MTHT.jfif" alt="Môi trường học tập"',
    content
)

# Replace 3: KNDN.jfif in Kết nối doanh nghiệp
content = re.sub(
    r'<img src="https://images\.unsplash\.com/photo-1517245386807-bb43f82c33c4\?w=800&q=80" alt="Kết nối việc làm"',
    r'<img src="/static/assets/logos/KNDN.jfif" alt="Kết nối việc làm"',
    content
)

with open(r'd:\24CT1-DO_NGUYEN_HAO\static\js\views\review.js', 'w', encoding='utf-8') as f:
    f.write(content)
