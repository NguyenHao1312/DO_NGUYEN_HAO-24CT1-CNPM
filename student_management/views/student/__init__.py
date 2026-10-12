"""
student_management/views/student/__init__.py
Package chứa các views dành riêng cho Sinh viên.
"""
from student_management.views.student.portal import api_student_profile

__all__ = [
    'api_student_profile',
]
