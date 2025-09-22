// src/Dashboard.js
import React from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>📚 Student Dashboard</h1>
      <p style={styles.subtext}>Welcome back! What would you like to do today?</p>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Upload & Learn</h2>
        <p style={styles.cardText}>
          Upload your curriculum or learning material and let us generate a study
          plan, flashcards, or worksheets for you.
        </p>
        <button style={styles.button} onClick={() => navigate("/upload-learn")}>
          Start Learning →
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
    fontSize: "2.5rem",
    marginBottom: "1rem",
    color: "#333",
  },
  subtext: {
    fontSize: "1.2rem",
    marginBottom: "2rem",
    color: "#666",
  },
  card: {
    background: "white",
    padding: "2rem",
    borderRadius: "12px",
    boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
    maxWidth: "500px",
    margin: "0 auto",
  },
  cardTitle: {
    fontSize: "1.5rem",
    marginBottom: "1rem",
  },
  cardText: {
    fontSize: "1rem",
    color: "#555",
    marginBottom: "1.5rem",
  },
  button: {
    padding: "0.8rem 1.5rem",
    fontSize: "1rem",
    background: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
};

export default Dashboard;
