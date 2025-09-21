# ragapp/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path("upload_pdf/", views.upload_pdf),
    path("chat/", views.chat),
    path("generate_questions/", views.generate_questions),
]
