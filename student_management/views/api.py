"""
student_management/views/api.py
Forwarder sang student_management/views/user/api.py (Backward compatibility).
"""
from student_management.views.user.api import (
    api_grade_lock_status,
    api_semesters,
)

__all__ = [
    'api_grade_lock_status',
    'api_semesters',
]
