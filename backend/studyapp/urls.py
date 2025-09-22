from django.urls import path
from . import views

urlpatterns = [
    path("signup/", views.signup),
    path("login/", views.login),

    path("upload_curriculum/", views.upload_curriculum),
    path("generate_study_plan/", views.generate_study_plan),

    path("upload_content_and_generate/", views.upload_content_and_generate),

    path("my_flashcards/", views.my_flashcards),
    path("my_worksheets/", views.my_worksheets),
    path("my_studyplans/", views.my_studyplans),
]
