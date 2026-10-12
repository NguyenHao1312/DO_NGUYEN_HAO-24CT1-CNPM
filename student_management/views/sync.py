"""
student_management/views/sync.py
Forwarder sang student_management/views/user/sync.py (Backward compatibility).
"""
from student_management.views.user.sync import (
    api_sync_down,
    api_sync_up,
)

__all__ = [
    'api_sync_down',
    'api_sync_up',
]
