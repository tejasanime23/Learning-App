# studyapp/models.py
from django.db import models
from django.contrib.auth.models import User


class Curriculum(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="curriculums")
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to="curriculums/", null=True, blank=True)  # allow empty initially
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.user.username})"


class Content(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="contents")
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to="contents/", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.user.username})"


class Flashcard(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="flashcards")
    topic = models.CharField(max_length=255)
    question = models.TextField()
    answer = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Flashcard: {self.topic} - {self.question[:30]}"


class Worksheet(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="worksheets")
    topic = models.CharField(max_length=255)
    question = models.TextField()
    answer = models.TextField(null=True, blank=True)  # let user fill later
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Worksheet: {self.topic} - {self.question[:30]}"
