const API_BASE = "http://127.0.0.1:8000/api";

export async function uploadPDF(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/upload_pdf/`, {
    method: "POST",
    body: formData,
  });

  return res.json();
}

export async function askQuestion(question) {
  const res = await fetch(`${API_BASE}/chat/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });

  return res.json();
}
