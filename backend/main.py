import os
import pickle
import faiss
from dotenv import load_dotenv
from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import google.generativeai as genai

# Load env
load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise ValueError("❌ GOOGLE_API_KEY missing in .env")

genai.configure(api_key=GOOGLE_API_KEY)

# Load FAISS index
with open("faiss_index.pkl", "rb") as f:
    index, documents = pickle.load(f)

# Load embedder
embedder = SentenceTransformer("all-MiniLM-L6-v2")

app = FastAPI()

class Query(BaseModel):
    question: str

@app.post("/ask")
def ask(query: Query):
    q_emb = embedder.encode([query.question])
    D, I = index.search(q_emb, 3)  # top 3 results
    retrieved_docs = [documents[i] for i in I[0]]

    context = "\n".join(retrieved_docs)
    prompt = f"Answer the question using the context:\n\n{context}\n\nQ: {query.question}\nA:"

    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content(prompt)

    return {"answer": response.text, "context": retrieved_docs}
