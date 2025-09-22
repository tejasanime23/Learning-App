// src/App.js
import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import HomePage from "./HomePage";
import RagPage from "./RAGPage";
import Dashboard from "./Dashboard";
import Flashcards from "./Flashcards";
import MyFlashcards from "./MyFlashcards";
import UpdateApp from "./UpdateApp";   // 👈 routes for dashboard + uploads
import AuthPage from "./AuthPage";     // 👈 login/signup page

function App() {
  // Simulating login token (later we’ll hook this to backend + DB)
  const [token, setToken] = useState(null);

  return (
    <Router>
      {/* Navbar */}
      <nav style={{ padding: "1rem", background: "#333", color: "white" }}>
        <Link to="/" style={{ color: "white", marginRight: "1rem" }}>Home</Link>
        <Link to="/rag" style={{ color: "white", marginRight: "1rem" }}>Chatbot</Link>
        <Link to="/dashboard" style={{ color: "white", marginRight: "1rem" }}>Dashboard</Link>
        <Link to="/flashcards" style={{ color: "white", marginRight: "1rem" }}>Flashcards</Link>
        <Link to="/my-flashcards" style={{ color: "white", marginRight: "1rem" }}>My Flashcards</Link>
        {!token && <Link to="/auth" style={{ color: "white" }}>Login</Link>}
      </nav>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/rag" element={<RagPage />} />
        <Route path="/dashboard/*" element={<UpdateApp token={token} />} />
        <Route path="/flashcards" element={<Flashcards />} />
        <Route path="/my-flashcards" element={<MyFlashcards />} />
        <Route path="/auth" element={<AuthPage setToken={setToken} />} />
      </Routes>
    </Router>
  );
}

export default App;
