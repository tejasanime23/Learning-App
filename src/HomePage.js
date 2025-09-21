import React from "react";
import "./HomePage.css";

function HomePage() {
  return (
    <div className="homepage">
      <header className="hero">
        <h1 className="hero-title">Welcome to Your Learning App 🚀</h1>
        <p className="hero-subtitle">
          Personalized learning powered by <span>AI + RAG</span>
        </p>
        <div className="hero-buttons">
          <button className="btn primary">Get Started</button>
          <button className="btn secondary">Learn More</button>
        </div>
      </header>
    </div>
  );
}

export default HomePage;
