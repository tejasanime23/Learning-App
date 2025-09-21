from django.shortcuts import render


# ragapp/views.py
import os
import json
import numpy as np
import faiss
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.files.storage import default_storage
from django.utils import timezone
from PyPDF2 import PdfReader
from sentence_transformers import SentenceTransformer
import google.generativeai as genai

# --- CONFIG ---
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

FAISS_DIR = os.path.join(settings.BASE_DIR, "faiss_index")
os.makedirs(FAISS_DIR, exist_ok=True)
INDEX_PATH = os.path.join(FAISS_DIR, "index.faiss")
META_PATH = os.path.join(FAISS_DIR, "meta.json")

# embedding model
embedder = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
EMB_DIM = embedder.get_sentence_embedding_dimension()

# --- HELPERS ---
def load_or_create_index():
    if os.path.exists(INDEX_PATH) and os.path.exists(META_PATH):
        index = faiss.read_index(INDEX_PATH)
        with open(META_PATH, "r", encoding="utf-8") as f:
            meta = json.load(f)
        return index, meta
    else:
        index = faiss.IndexIDMap2(faiss.IndexFlatIP(EMB_DIM))
        meta = {"next_id": 1, "items": {}}
        return index, meta

def save_index_meta(index, meta):
    faiss.write_index(index, INDEX_PATH)
    with open(META_PATH, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)

def extract_text_from_pdf(path):
    reader = PdfReader(path)
    text = []
    for page in reader.pages:
        t = page.extract_text()
        if t:
            text.append(t)
    return "\n".join(text)

def chunk_text(text, chunk_size=500, overlap=80):
    tokens = text.split()
    chunks = []
    i = 0
    while i < len(tokens):
        chunk = tokens[i:i+chunk_size]
        chunks.append(" ".join(chunk))
        i += chunk_size - overlap
    return chunks

def create_embedding(text):
    vec = embedder.encode([text], normalize_embeddings=True)[0]
    return np.array(vec, dtype="float32")

def gemini_chat(messages, model="gemini-1.5-flash", max_output_tokens=500, temperature=0.3):
    # Flatten messages into one prompt
    system_prompt = ""
    user_prompt = ""
    for m in messages:
        if m["role"] == "system":
            system_prompt += m["content"] + "\n"
        elif m["role"] == "user":
            user_prompt += m["content"] + "\n"

    prompt = system_prompt + "\n" + user_prompt
    model = genai.GenerativeModel(model)
    response = model.generate_content(prompt, generation_config={
        "max_output_tokens": max_output_tokens,
        "temperature": temperature
    })
    return response.text

# --- VIEWS ---
@csrf_exempt
def upload_pdf(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    uploaded_file = request.FILES.get("file")
    source = request.POST.get("source", "unknown")

    if not uploaded_file:
        return JsonResponse({"error": "no file uploaded"}, status=400)

    filename = f"uploads/{timezone.now().strftime('%Y%m%d%H%M%S')}_{uploaded_file.name}"
    saved_path = default_storage.save(filename, uploaded_file)
    full_path = os.path.join(settings.MEDIA_ROOT, filename)

    text = extract_text_from_pdf(full_path)
    if not text.strip():
        return JsonResponse({"error": "no text in PDF"}, status=400)

    chunks = chunk_text(text)

    index, meta = load_or_create_index()
    vectors, ids = [], []
    for chunk in chunks:
        emb = create_embedding(chunk)
        _id = meta["next_id"]
        meta["items"][str(_id)] = {"text": chunk, "source": source, "file": uploaded_file.name}
        meta["next_id"] += 1
        vectors.append(emb)
        ids.append(_id)

    if vectors:
        arr = np.vstack(vectors).astype("float32")
        faiss.normalize_L2(arr)
        index.add_with_ids(arr, np.array(ids, dtype="int64"))

    save_index_meta(index, meta)
    return JsonResponse({"message": "file indexed", "chunks": len(chunks)})

@csrf_exempt
def chat(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    data = json.loads(request.body)
    question = data.get("question", "")
    if not question:
        return JsonResponse({"error": "question required"}, status=400)

    index, meta = load_or_create_index()
    q_emb = create_embedding(question).reshape(1, -1)
    D, I = index.search(q_emb, 3)
    matched = [meta["items"][str(int(idx))]["text"] for idx in I[0] if str(int(idx)) in meta["items"]]

    context = "\n\n---\n\n".join(matched)
    system_prompt = "You are a helpful tutor. Use only the provided context to answer."
    user_prompt = f"Context:\n{context}\n\nQuestion: {question}"

    answer = gemini_chat(
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]
    )
    return JsonResponse({"answer": answer, "context_used": len(matched)})

@csrf_exempt
def generate_questions(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    data = json.loads(request.body)
    prompt = data.get("prompt", "")
    count = int(data.get("count", 5))

    index, meta = load_or_create_index()
    if not meta["items"]:
        return JsonResponse({"error": "no indexed documents"}, status=400)

    first_text = next(iter(meta["items"].values()))["text"]
    q_emb = create_embedding(prompt or first_text).reshape(1, -1)
    D, I = index.search(q_emb, 5)
    matched = [meta["items"][str(int(idx))]["text"] for idx in I[0] if str(int(idx)) in meta["items"]]

    context = "\n\n---\n\n".join(matched)
    system_prompt = "You are an exam generator. Create exam-style questions from the context."
    user_prompt = f"Context:\n{context}\n\nTask: Generate {count} exam-style questions."

    questions = gemini_chat(
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        max_output_tokens=700,
        temperature=0.6,
    )
    return JsonResponse({"questions": questions})
