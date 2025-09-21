// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import HomePage from "./HomePage";
import RagPage from "./RAGPage"; // chatbot page (we made earlier)
import Dashboard from "./dashboard"; // placeholder, we’ll make this later

function App() {
  return (
    <Router>
      {/* Simple Navbar */}
      <nav style={{ padding: "1rem", background: "#333", color: "white" }}>
        <Link to="/" style={{ color: "white", marginRight: "1rem" }}>Home</Link>
        <Link to="/rag" style={{ color: "white", marginRight: "1rem" }}>Chatbot</Link>
        <Link to="/dashboard" style={{ color: "white" }}>Dashboard</Link>
      </nav>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/rag" element={<RagPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
