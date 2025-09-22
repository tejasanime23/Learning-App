// src/UploadContent.js
import React, { useState } from "react";

function UploadContent() {
  const [file, setFile] = useState(null);
  const [choice, setChoice] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleProcess = async () => {
    if (!file || !choice) {
      alert("Please upload content and select an option!");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Step 1: Upload the file
      const formData = new FormData();
      formData.append("file", file);
      formData.append("source", "content");

      const uploadResponse = await fetch("http://127.0.0.1:8000/api/study/upload_pdf/", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadResponse.json();
      if (uploadData.error) {
        alert("Error uploading file: " + uploadData.error);
        setLoading(false);
        return;
      }

      // Step 2: Generate based on choice
      if (choice === "flashcards") {
        const response = await fetch("http://127.0.0.1:8000/api/study/generate_flashcards/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic: file.name }),
        });
        const data = await response.json();
        setResult({ type: "Flashcards", flashcards: data.flashcards || [] });
      } else {
        const response = await fetch("http://127.0.0.1:8000/api/study/generate_questions/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: file.name, count: 5 }),
        });
        const data = await response.json();
        setResult({ type: "Worksheet", questions: data.questions || [] });
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong while generating!");
    }

    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>📄 Upload Content</h1>
      <p style={styles.subtext}>
        Upload your learning material and choose whether you want Flashcards or a Worksheet.
      </p>

      <input
        type="file"
        accept=".pdf"
        onChange={(e) => setFile(e.target.files[0])}
        style={styles.input}
      />

      <div style={styles.choiceBox}>
        <label>
          <input
            type="radio"
            name="choice"
            value="flashcards"
            onChange={(e) => setChoice(e.target.value)}
          />
          Flashcards
        </label>
        <label style={{ marginLeft: "2rem" }}>
          <input
            type="radio"
            name="choice"
            value="worksheet"
            onChange={(e) => setChoice(e.target.value)}
          />
          Worksheet
        </label>
      </div>

      <button style={styles.button} onClick={handleProcess} disabled={loading}>
        {loading ? "Generating..." : "Generate"}
      </button>

      {result && (
        <div style={styles.resultBox}>
          <h2>✅ {result.type} Generated</h2>

          {result.type === "Flashcards" ? (
            <ul>
              {result.flashcards.map((c, i) => (
                <li key={i} style={{ marginBottom: "1rem" }}>
                  <strong>Q:</strong> {c.question} <br />
                  <strong>A:</strong> {c.answer}
                </li>
              ))}
            </ul>
          ) : (
            <ol>
              {Array.isArray(result.questions)
                ? result.questions.map((q, i) => <li key={i}>{q}</li>)
                : <p>{result.questions}</p>}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "3rem",
    background: "#f9f9f9",
    minHeight: "100vh",
    textAlign: "center",
  },
  heading: {
    fontSize: "2rem",
    marginBottom: "1rem",
    color: "#333",
  },
  subtext: {
    fontSize: "1.1rem",
    marginBottom: "2rem",
    color: "#666",
  },
  input: {
    margin: "1rem 0",
    padding: "0.7rem",
    borderRadius: "8px",
    border: "1px solid #ccc",
  },
  choiceBox: {
    margin: "1.5rem 0",
    fontSize: "1.1rem",
  },
  button: {
    padding: "0.8rem 1.5rem",
    background: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "1rem",
  },
  resultBox: {
    marginTop: "2rem",
    background: "white",
    padding: "1.5rem",
    borderRadius: "10px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    textAlign: "left",
    maxWidth: "600px",
    margin: "2rem auto",
  },
};

export default UploadContent;
