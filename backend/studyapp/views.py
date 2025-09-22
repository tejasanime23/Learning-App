# backend/studyapp/views.py
import os
import json
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import User
from django.core.files.storage import default_storage
from django.utils import timezone

from rest_framework.authtoken.models import Token

from .models import Curriculum, Content, Flashcard, Worksheet

# Import your RAG helpers from ragapp (gemini_chat, extract_text_from_pdf)
# Adjust the import path if your rag app name is different.
from ragapp.views import gemini_chat, extract_text_from_pdf

# helper: get user from Authorization header "Token <token>"
def get_user_from_request(request):
    auth = request.META.get("HTTP_AUTHORIZATION")
    if not auth:
        return None
    parts = auth.split()
    if len(parts) != 2 or parts[0].lower() != "token":
        return None
    token_key = parts[1]
    try:
        token = Token.objects.get(key=token_key)
        return token.user
    except Token.DoesNotExist:
        return None

# -------- Auth endpoints --------
@csrf_exempt
def signup(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)
    try:
        data = json.loads(request.body)
        username = data.get("username")
        password = data.get("password")
        if not username or not password:
            return JsonResponse({"error": "username and password required"}, status=400)
        if User.objects.filter(username=username).exists():
            return JsonResponse({"error": "username exists"}, status=400)
        user = User.objects.create_user(username=username, password=password)
        token = Token.objects.create(user=user)
        return JsonResponse({"message": "user created", "token": token.key, "username": user.username})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def login(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)
    try:
        data = json.loads(request.body)
        username = data.get("username")
        password = data.get("password")
        if not username or not password:
            return JsonResponse({"error": "username and password required"}, status=400)
        user = User.objects.filter(username=username).first()
        if not user or not user.check_password(password):
            return JsonResponse({"error": "invalid credentials"}, status=400)
        token, _ = Token.objects.get_or_create(user=user)
        return JsonResponse({"message": "login success", "token": token.key, "username": user.username})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

# -------- Upload curriculum --------
@csrf_exempt
def upload_curriculum(request):
    """
    Accepts: multipart/form-data with "file" and optionally "duration".
    Requires Authorization header: Token <token>
    Saves Curriculum model, extracts text, and returns doc_id.
    """
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    user = get_user_from_request(request)
    if not user:
        return JsonResponse({"error": "Unauthorized (provide Token header)"}, status=401)

    uploaded_file = request.FILES.get("file")
    duration = request.POST.get("duration", "")

    if not uploaded_file:
        return JsonResponse({"error": "no file uploaded"}, status=400)

    # Save Curriculum model
    cur = Curriculum.objects.create(
        user=user,
        title=uploaded_file.name,
        file=uploaded_file,
        duration=duration or ""
    )

    # Save file path (Django will handle saving), then extract text using rag helper
    file_path = cur.file.path  # full path
    try:
        text = extract_text_from_pdf(file_path)
    except Exception as e:
        text = ""
        # don't fail; still return doc id
    return JsonResponse({"message": "curriculum uploaded", "doc_id": cur.id})

# -------- Generate study plan (uses gemini_chat) --------
@csrf_exempt
def generate_study_plan(request):
    """
    Expects JSON: {"doc_id": <id>, "duration": "<14 days or 2 weeks>"}
    Requires Authorization header.
    Saves the generated study_plan JSON into Curriculum.study_plan and returns it.
    """
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    user = get_user_from_request(request)
    if not user:
        return JsonResponse({"error": "Unauthorized (provide Token header)"}, status=401)

    try:
        data = json.loads(request.body)
        doc_id = data.get("doc_id")
        duration = data.get("duration", "2 weeks")

        cur = Curriculum.objects.filter(id=doc_id, user=user).first()
        if not cur:
            return JsonResponse({"error": "curriculum not found for user"}, status=404)

        # Extract text from saved file (use rag helper)
        text = ""
        try:
            text = extract_text_from_pdf(cur.file.path)
        except Exception:
            text = ""

        system_prompt = "You are a study planner. Always respond with valid JSON."
        user_prompt = f"""
Create a study plan using the curriculum below. Duration: {duration}.
Use the curriculum text to extract the important topics and create a daily (or weekly) study schedule.
Return ONLY valid JSON in this format:
{{
  "topics": ["Topic1", "Topic2", ...],
  "plan": "A readable plan string or an object with day->topics mapping"
}}
Curriculum TEXT:
\"\"\"{text[:2000]}\"\"\"   # (we keep a snippet in prompt to avoid extremely long prompt)
        """

        plan_raw = gemini_chat(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            max_output_tokens=800,
            temperature=0.3,
        )

        # clean and parse
        try:
            study_plan = json.loads(plan_raw)
        except Exception:
            cleaned = plan_raw.strip().replace("```json", "").replace("```", "")
            study_plan = json.loads(cleaned)

        # Save into Curriculum
        cur.duration = duration
        cur.study_plan = study_plan
        cur.save()

        return JsonResponse({"doc_id": cur.id, "study_plan": study_plan})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

# -------- Upload content (flashcards/worksheet generation) --------
@csrf_exempt
def upload_content_and_generate(request):
    """
    Accepts multipart/form-data with "file" and "choice" (flashcards|worksheet).
    Requires Authorization header.
    Saves Content model then calls generator and saves Flashcards/Worksheets in DB.
    """
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    user = get_user_from_request(request)
    if not user:
        return JsonResponse({"error": "Unauthorized (provide Token header)"}, status=401)

    uploaded_file = request.FILES.get("file")
    choice = request.POST.get("choice", "")

    if not uploaded_file or choice not in ("flashcards", "worksheet"):
        return JsonResponse({"error": "file and valid choice required"}, status=400)

    # Save content model
    cont = Content.objects.create(
        user=user,
        title=uploaded_file.name,
        file=uploaded_file,
        choice=choice
    )

    # Extract text
    try:
        text = extract_text_from_pdf(cont.file.path)
    except Exception:
        text = ""

    if choice == "flashcards":
        # Ask Gemini to produce JSON array of {question,answer}
        system_prompt = "You are a flashcard generator. Always respond ONLY with valid JSON."
        user_prompt = f"""
Create 5 concise Q&A flashcards from the following content. Return a JSON array:
[{{"question":"Q1", "answer":"A1"}}, ...]
Content snippet:
\"\"\"{text[:2000]}\"\"\" 
"""
        raw = gemini_chat(
            messages=[{"role":"system","content":system_prompt},{"role":"user","content":user_prompt}],
            max_output_tokens=600,
            temperature=0.4
        )
        try:
            flashcards = json.loads(raw)
        except Exception:
            cleaned = raw.strip().replace("```json","").replace("```","")
            flashcards = json.loads(cleaned)

        created = []
        for f in flashcards:
            q = f.get("question","")
            a = f.get("answer","")
            fc = Flashcard.objects.create(content=cont, question=q, answer=a)
            created.append({"id": fc.id, "question": q, "answer": a})

        return JsonResponse({"content_id": cont.id, "flashcards": created})

    else:  # worksheet
        system_prompt = "You are an exam/worksheet generator. Respond with JSON."
        user_prompt = f"""
Generate {5} exam-style questions (mix of MCQ/short-answer) from the content below.
Return a JSON list of strings (questions).
Content snippet:
\"\"\"{text[:2000]}\"\"\" 
"""
        raw = gemini_chat(
            messages=[{"role":"system","content":system_prompt},{"role":"user","content":user_prompt}],
            max_output_tokens=700,
            temperature=0.5
        )
        try:
            questions = json.loads(raw)
        except Exception:
            cleaned = raw.strip().replace("```json","").replace("```","")
            questions = json.loads(cleaned)

        created = []
        for q in questions:
            w = Worksheet.objects.create(content=cont, question=q)
            created.append({"id": w.id, "question": q})

        return JsonResponse({"content_id": cont.id, "questions": created})

# -------- Get user's flashcards / worksheets / studyplans --------
@csrf_exempt
def my_flashcards(request):
    if request.method != "GET":
        return JsonResponse({"error": "GET only"}, status=405)
    user = get_user_from_request(request)
    if not user:
        return JsonResponse({"error":"Unauthorized"}, status=401)
    out = []
    for fc in Flashcard.objects.filter(content__user=user).order_by("-created_at"):
        out.append({
            "id": fc.id,
            "content_id": fc.content.id,
            "title": fc.content.title,
            "question": fc.question,
            "answer": fc.answer,
            "created_at": fc.created_at.isoformat()
        })
    return JsonResponse({"flashcards": out})

@csrf_exempt
def my_worksheets(request):
    if request.method != "GET":
        return JsonResponse({"error": "GET only"}, status=405)
    user = get_user_from_request(request)
    if not user:
        return JsonResponse({"error":"Unauthorized"}, status=401)
    out = []
    for w in Worksheet.objects.filter(content__user=user).order_by("-created_at"):
        out.append({
            "id": w.id,
            "content_id": w.content.id,
            "title": w.content.title,
            "question": w.question,
            "created_at": w.created_at.isoformat()
        })
    return JsonResponse({"worksheets": out})

@csrf_exempt
def my_studyplans(request):
    if request.method != "GET":
        return JsonResponse({"error": "GET only"}, status=405)
    user = get_user_from_request(request)
    if not user:
        return JsonResponse({"error":"Unauthorized"}, status=401)
    out = []
    for cur in Curriculum.objects.filter(user=user).order_by("-created_at"):
        out.append({
            "id": cur.id,
            "title": cur.title,
            "duration": cur.duration,
            "study_plan": cur.study_plan,
            "created_at": cur.created_at.isoformat()
        })
    return JsonResponse({"studyplans": out})
