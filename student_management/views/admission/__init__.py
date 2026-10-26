"""
student_management/views/admission/__init__.py
"""
from .views import (
    admission_page,
    api_admission_universities,
    api_admission_apply,
    api_admission_check_duplicate,
    api_admission_verify_otp,
    api_admission_resend_otp,
    api_admission_check_status,
)

__all__ = [
    'admission_page',
    'api_admission_universities',
    'api_admission_apply',
    'api_admission_check_duplicate',
    'api_admission_verify_otp',
    'api_admission_resend_otp',
    'api_admission_check_status',
]
