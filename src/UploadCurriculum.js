import React, { useState } from "react";

function UploadCurriculum() {
  const [file, setFile] = useState(null);
  const [duration, setDuration] = useState("");
  const [studyPlan, setStudyPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file || !duration) {
      alert("Please upload a curriculum and select study duration!");
      return;
    }

    setLoading(true);
    setStudyPlan(null);

    try {
      // Step 1: Upload the file to backend
      const formData = new FormData();
      formData.append("file", file);
      formData.append("source", "curriculum");

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

      // Step 2: Generate study plan
      const planResponse = await fetch("http://127.0.0.1:8000/api/study/generate_study_plan/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duration }),
      });

      const planData = await planResponse.json();
      if (planData.error) {
        alert("Error generating study plan: " + planData.error);
        setLoading(false);
        return;
      }

      setStudyPlan(planData);
    } catch (error) {
      console.error(error);
      alert("Something went wrong while generating study plan!");
    }

    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>📘 Upload Curriculum</h1>
      <p style={styles.subtext}>
        Upload your syllabus/curriculum and select how long you want to study.
      </p>

      <input
        type="file"
        accept=".pdf"
        onChange={(e) => setFile(e.target.files[0])}
        style={styles.input}
      />

      <div style={styles.durationBox}>
        <label style={styles.label}>Study Duration:</label>
        <input
          type="text"
          placeholder="e.g. 14 days"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          style={styles.input}
        />
      </div>

      <button style={styles.button} onClick={handleUpload} disabled={loading}>
        {loading ? "Generating..." : "Generate Study Plan"}
      </button>

      {studyPlan && (
        <div style={styles.resultBox}>
          <h2>📌 Extracted Topics</h2>
          <ul>
            {studyPlan.topics && studyPlan.topics.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
          <h2>🗓 Study Plan</h2>
          <p>{studyPlan.plan}</p>
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
  durationBox: {
    margin: "1rem 0",
  },
  label: {
    marginRight: "1rem",
    fontWeight: "bold",
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

export default UploadCurriculum;
