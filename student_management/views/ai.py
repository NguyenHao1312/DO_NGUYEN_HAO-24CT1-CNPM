"""
student_management/views/ai.py
Forwarder sang student_management/views/user/ai.py (Backward compatibility).
"""
from student_management.views.user.ai import (
    api_ai_chat,
)

__all__ = [
    'api_ai_chat',
]
