FROM python:3.13-slim

# Cài đặt ODBC Driver 17 cho SQL Server
RUN apt-get update && apt-get install -y \
    curl apt-transport-https gnupg2 unixodbc-dev \
    && curl https://packages.microsoft.com/keys/microsoft.asc | apt-key add - \
    && curl https://packages.microsoft.com/config/debian/11/prod.list > /etc/apt/sources.list.d/mssql-release.list \
    && apt-get update \
    && ACCEPT_EULA=Y apt-get install -y msodbcsql17 \
    && apt-get clean

WORKDIR /app
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt
COPY . /app/

RUN python manage.py collectstatic --noinput
RUN python manage.py migrate

# Khởi chạy server (Đã điều chỉnh thành core.wsgi dựa theo file settings.py của anh)
CMD ["gunicorn", "core.wsgi:application", "--bind", "0.0.0.0:8000"]