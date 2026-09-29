FROM python:3.13-slim

# Hạ mức bảo mật OpenSSL xuống 1 để tương thích với chứng chỉ nội bộ của SQL Server
RUN sed -i 's/DEFAULT:@SECLEVEL=2/DEFAULT:@SECLEVEL=0/g' /etc/ssl/openssl.cnf

# Cài đặt ODBC Driver 17 cho SQL Server
RUN apt-get update && apt-get install -y \
    curl apt-transport-https gnupg2 unixodbc-dev \
    && curl -fsSL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor -o /usr/share/keyrings/microsoft-prod.gpg \
    && curl -fsSL https://packages.microsoft.com/config/debian/12/prod.list > /etc/apt/sources.list.d/mssql-release.list \
    && apt-get update \
    && ACCEPT_EULA=Y apt-get install -y msodbcsql17 \
    && apt-get clean

WORKDIR /app
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt
COPY . /app/

RUN python manage.py collectstatic --noinput

# Chạy migrate lúc khởi động server, sau đó bật Gunicorn
CMD ["sh", "-c", "python manage.py migrate && gunicorn core.wsgi:application --bind 0.0.0.0:8000"]