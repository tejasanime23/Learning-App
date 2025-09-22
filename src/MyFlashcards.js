// src/MyFlashcards.js
import React, { useState, useEffect } from "react";
import "./Flashcards.css"; // reuse same styles

function MyFlashcards() {
  const [flashcards, setFlashcards] = useState([]);

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

  const [flipped, setFlipped] = useState({});
  const handleFlip = (index) => {
    setFlipped((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="flashcards-container">
      <h2>📖 My Flashcards</h2>
      <p>Click on a card to flip it!</p>

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
          <p>No flashcards saved yet.</p>
        )}
      </div>
    </div>
  );
}

export default MyFlashcards;
