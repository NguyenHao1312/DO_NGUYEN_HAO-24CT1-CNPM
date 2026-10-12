"""
student_management/views/teacher/__init__.py
Package chứa các views dành riêng cho Giáo viên (và Admin).
"""
from student_management.views.teacher.attendance import (
    api_attendance,
    api_attendance_summarize,
)

__all__ = [
    'api_attendance',
    'api_attendance_summarize',
]
