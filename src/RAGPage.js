// src/RagPage.js
import React, { useState } from "react";

function RagPage() {
  const [file, setFile] = useState(null);
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");

  const handleUpload = async () => {
    if (!file) return alert("Please select a file");
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("http://127.0.0.1:8000/api/upload_pdf/", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    alert("PDF Uploaded: " + JSON.stringify(data));
  };

  const handleAsk = async () => {
    const res = await fetch("http://127.0.0.1:8000/api/chat/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });

    const data = await res.json();
    setResponse(data.answer || "No response");
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>📚 RAG Q&A Chatbot</h1>

      <div>
        <input type="file" onChange={(e) => setFile(e.target.files[0])} />
        <button onClick={handleUpload}>Upload PDF</button>
      </div>

      <div style={{ marginTop: "1rem" }}>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question..."
        />
        <button onClick={handleAsk}>Ask</button>
      </div>

      <div style={{ marginTop: "1rem" }}>
        <h3>Answer:</h3>
        <p>{response}</p>
      </div>
    </div>
  );
}

export default RagPage;
