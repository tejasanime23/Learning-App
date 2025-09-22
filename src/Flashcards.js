// src/Flashcards.js
import React, { useState, useEffect } from "react";
import "./Flashcards.css"; // we’ll create this file

function Flashcards() {
  const [topic, setTopic] = useState("");
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(false);

  // Track flip states
  const [flipped, setFlipped] = useState({});

  // Fetch saved flashcards on page load
  useEffect(() => {
    const fetchFlashcards = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/study/get_flashcards/");
        const data = await response.json();
        if (data.flashcards) {
          setFlashcards(data.flashcards);
        }
      } catch (error) {
        console.error("Error fetching flashcards:", error);
      }
    };
    fetchFlashcards();
  }, []);

  // Generate new flashcards
  const handleGenerate = async () => {
    if (!topic) {
      alert("Please enter a topic!");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/study/generate_flashcards/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });

      const data = await response.json();
      if (data.flashcards) {
        setFlashcards((prev) => [...data.flashcards, ...prev]);
      } else {
        alert("Error generating flashcards: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to connect to backend");
    }

    setLoading(false);
  };

  // Toggle flip
  const handleFlip = (index) => {
    setFlipped((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="flashcards-container">
      <h2>📚 Flashcards Generator</h2>

      {/* Input + Button */}
      <div className="flashcards-input">
        <input
          type="text"
          placeholder="Enter a topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
        <button onClick={handleGenerate} disabled={loading}>
          {loading ? "Generating..." : "Generate Flashcards"}
        </button>
      </div>

      {/* Flashcards grid */}
      <div className="flashcards-grid">
        {flashcards.length > 0 ? (
          flashcards.map((card, index) => (
            <div
              key={index}
              className={`flashcard ${flipped[index] ? "flipped" : ""}`}
              onClick={() => handleFlip(index)}
            >
              <div className="flashcard-inner">
                <div className="flashcard-front">
                  <p><strong>Q:</strong> {card.question}</p>
                  <p className="topic">Topic: {card.topic}</p>
                </div>
                <div className="flashcard-back">
                  <p><strong>A:</strong> {card.answer}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p>No flashcards yet. Generate some!</p>
        )}
      </div>
    </div>
  );
}

export default Flashcards;
