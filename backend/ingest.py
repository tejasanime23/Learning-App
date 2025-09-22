import os
from dotenv import load_dotenv
from PyPDF2 import PdfReader
from sentence_transformers import SentenceTransformer
import faiss
import pickle

# Load environment variables
load_dotenv()
print("✅ Loaded .env")

# Paths
DOCS_DIR = "docs"
INDEX_FILE = "faiss_index.pkl"

# Load local embedding model
embedder = SentenceTransformer("all-MiniLM-L6-v2")

# Create FAISS index
dimension = 384  # embedding size of MiniLM
index = faiss.IndexFlatL2(dimension)
documents = []


def extract_text_from_pdf(path):
    reader = PdfReader(path)
    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""
    return text


def split_text(text, chunk_size=500, overlap=50):
    """Split text into overlapping chunks"""
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return chunks


# Ingest all PDFs
for filename in os.listdir(DOCS_DIR):
    if filename.endswith(".pdf"):
        path = os.path.join(DOCS_DIR, filename)
        print(f"📄 Processing {filename}")
        text = extract_text_from_pdf(path)
        chunks = split_text(text)

        # Embed chunks
        embeddings = embedder.encode(chunks)
        index.add(embeddings)
        documents.extend(chunks)

# Save FAISS index + documents
with open(INDEX_FILE, "wb") as f:
    pickle.dump((index, documents), f)

print("✅ Ingestion complete! Indexed", len(documents), "chunks.")
