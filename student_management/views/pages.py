"""
student_management/views/pages.py
Forwarder sang student_management/views/user/pages.py (Backward compatibility).
"""
from student_management.views.user.pages import (
    index,
    review,
)

__all__ = [
    'index',
    'review',
]
