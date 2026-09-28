from django.contrib import admin
from django.urls import path, include
from student_management import views

urlpatterns = [
    path('', include('student_management.urls')),
    path('admin/', admin.site.urls),
    path('', views.index, name='index'),
    path('review/', views.review, name='review'),
]