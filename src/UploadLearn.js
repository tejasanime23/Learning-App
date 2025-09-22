// src/UploadLearn.js
import React from "react";
import { useNavigate } from "react-router-dom";

function UploadLearn() {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>📂 Upload & Learn</h1>
      <p style={styles.subtext}>
        Choose what you want to upload. We’ll help you generate study plans, flashcards, or worksheets.
      </p>

      <div style={styles.buttons}>
        <button style={styles.button} onClick={() => navigate("/upload-curriculum")}>
          📘 Upload Curriculum
        </button>
        <button style={styles.buttonAlt} onClick={() => navigate("/upload-content")}>
          📄 Upload Content
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "3rem",
    textAlign: "center",
    background: "#f9f9f9",
    minHeight: "100vh",
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
  buttons: {
    display: "flex",
    justifyContent: "center",
    gap: "2rem",
  },
  button: {
    padding: "1rem 2rem",
    fontSize: "1.1rem",
    background: "#28a745",
    color: "white",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
  },
  buttonAlt: {
    padding: "1rem 2rem",
    fontSize: "1.1rem",
    background: "#17a2b8",
    color: "white",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
  },
};

export default UploadLearn;
