"""
Django settings for core project.
UniMS — Hệ thống Quản lý Đại học.
Django 6.1 + SQL Server (MSSQL)
"""
import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')

SECRET_KEY = os.environ.get(
    'DJANGO_SECRET_KEY',
    'django-insecure-k2-ap(nb_1tf1we0+!$a)k11eg0as#rbx_duzr47dd9disue4%'
)

DEBUG = os.environ.get('DJANGO_DEBUG', 'True').lower() in ('true', '1', 'yes')

_raw_hosts = os.environ.get(
    'DJANGO_ALLOWED_HOSTS',
    'unims-ssm.onrender.com,localhost,127.0.0.1,.ngrok-free.app,.ngrok.io,testserver'
).split(',')
ALLOWED_HOSTS = [h.strip().lstrip('*') for h in _raw_hosts if h.strip()]

# CSRF Trusted Origins — bắt buộc cho Ngrok, Render và các proxy khác
CSRF_TRUSTED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get(
        'CSRF_TRUSTED_ORIGINS',
        'https://*.ngrok-free.app,https://*.ngrok.io,https://*.onrender.com'
    ).split(',')
]

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'student_management',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    # --- UniMS: Global Audit Logging & Anomaly Tracking (Ghi nhận toàn bộ tấn công/lỗi) ---
    'student_management.middleware.GlobalAuditMiddleware',
    # --- UniMS: Cô lập Admin chỉ cho phép truy cập qua Localhost (404 trên Tunnel) ---
    'student_management.middleware.LocalOnlyAdminMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    # --- UniMS: Single-session enforcement ---
    'student_management.middleware.SingleSessionMiddleware',
]

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'

# Database — SQL Server (MSSQL)
_db_options = {
    'driver': os.environ.get('DB_DRIVER', 'ODBC Driver 17 for SQL Server'),
    'extra_params': 'TrustServerCertificate=yes;Encrypt=no;',
}
# Local dev: dùng Windows Auth (Trusted_Connection)
# Production: dùng DB_USER + DB_PASSWORD
#if not os.environ.get('DB_USER'):
#    _db_options['extra_params'] = 'TrustServerCertificate=yes;Trusted_Connection=yes;'

DATABASES = {
    'default': {
        'ENGINE': 'mssql',
        'NAME': os.environ.get('DB_NAME', 'unims_db'),
        'HOST': os.environ.get('DB_HOST', r'.\SQLEXPRESS'),
        'USER': os.environ.get('DB_USER', ''),
        'PASSWORD': os.environ.get('DB_PASSWORD', ''),
        'PORT': os.environ.get('DB_PORT', ''),
        'OPTIONS': _db_options,
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Internationalization
LANGUAGE_CODE = 'vi'
TIME_ZONE = 'Asia/Ho_Chi_Minh'
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = '/static/'
STATICFILES_DIRS = [BASE_DIR / 'static']
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Custom User Model
AUTH_USER_MODEL = 'student_management.CustomUser'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Session configuration
SESSION_ENGINE = 'django.contrib.sessions.backends.db'
SESSION_COOKIE_AGE = 86400  # 24 hours

# Email configuration (Gmail SMTP)
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_TIMEOUT = 5  # Giới hạn 5s chống nghẽn đường truyền
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', f'UniMS Tuyển Sinh <{EMAIL_HOST_USER}>' if EMAIL_HOST_USER else 'UniMS Tuyển Sinh <noreply@unims.edu.vn>')

# Static files storage — tự hash file tĩnh khi collectstatic
STORAGES = {
    'staticfiles': {
        'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage',
    },
}

# Reverse Proxy tin cậy (Nginx / Docker Gateway / Localhost)
_raw_proxies = os.environ.get('TRUSTED_PROXIES', '127.0.0.1,::1,172.16.0.0/12,192.168.0.0/16,10.0.0.0/8').split(',')
TRUSTED_PROXIES = [p.strip() for p in _raw_proxies if p.strip()]

# Cache backend — hỗ trợ Redis phân tán cho Rate Limiting & Session Blacklist
# Tự động fallback về LocMemCache nếu chưa cấu hình REDIS_URL
REDIS_URL = os.environ.get('REDIS_URL', '')
if REDIS_URL:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.redis.RedisCache',
            'LOCATION': REDIS_URL,
        }
    }
else:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'unims-rate-limit',
        }
    }

# ============================================================
#  PRODUCTION SECURITY — chỉ kích hoạt khi DEBUG=False
# ============================================================
if not DEBUG:
    # HTTPS — có thể tắt khi dùng Ngrok (Ngrok tự xử lý HTTPS)
    SECURE_SSL_REDIRECT = os.environ.get('SECURE_SSL_REDIRECT', 'True').lower() in ('true', '1', 'yes')
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

    # HSTS — buộc trình duyệt chỉ truy cập HTTPS trong 1 năm
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

    # Secure Cookies
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

    # Chặn XSS, content sniffing
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'
