# -----------------------------
# Personalized Learning Chatbot Backend
# -----------------------------
# Required dependencies:
# pip install flask flask-cors google-genai python-dotenv schedule langsmith

import os
import time
import schedule
from datetime import datetime
import smtplib
from dotenv import load_dotenv
from google import genai
from google.genai import types
from langsmith import Client as LangGraphClient
from flask import Flask, request, jsonify
from flask_cors import CORS

# -----------------------------
# Load API Keys
# -----------------------------
load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")
LANGSMITH_API_KEY = os.getenv("LANGSMITH_API_KEY")
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")

# -----------------------------
# Initialize Clients
# -----------------------------
client = genai.Client(api_key=API_KEY)
model = "gemini-2.5-flash-lite"
langgraph_client = LangGraphClient(api_key=LANGSMITH_API_KEY)

# -----------------------------
# Initialize Flask App
# -----------------------------
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# -----------------------------
# Data Structures
# -----------------------------
chat_history = []
learning_log = []   # Stores {question, topic, status, last_attempt}
user_position = "Basics"  # Start learning journey

# -----------------------------
# Concept Graph (predefined roadmap)
# -----------------------------
concept_graph = {
    "Basics": ["Loops", "Functions"],
    "Loops": ["Recursion", "Sorting"],
    "Functions": ["OOP"],
    "Sorting": ["Searching", "Graphs"],
    "Recursion": ["Dynamic Programming"],
    "Graphs": ["Dynamic Programming"],
    "OOP": ["Design Patterns"],
    "Dynamic Programming": []
}

# -----------------------------
# Helper Functions
# -----------------------------
def classify_topic(question):
    """Classify question into topic using Gemini"""
    user_content = [
        types.Content(
            role="user",
            parts=[types.Part.from_text(text=f"Classify this question into a topic: {question}")]
        )
    ]
    response_text = ""
    for chunk in client.models.generate_content_stream(
        model=model,
        contents=user_content,
        config=types.GenerateContentConfig(
            temperature=0,
            top_p=1,
            response_mime_type="text/plain"
        )
    ):
        # Safe concatenation
        response_text += chunk.text or ""
    return response_text.strip()


def log_topic(question, topic, difficulty="medium"):
    """Log each question into learning log"""
    learning_log.append({
        "question": question,
        "topic": topic,
        "difficulty": difficulty,
        "status": "unattempted",
        "last_attempt": datetime.now()
    })


def update_progress(question, correct=False):
    """Update learning progress"""
    for entry in learning_log:
        if entry["question"] == question:
            entry["status"] = "mastered" if correct else "attempted"
            entry["last_attempt"] = datetime.now()


def get_progress_summary():
    """Summarize progress by topic"""
    summary = {}
    for entry in learning_log:
        topic = entry["topic"]
        if topic not in summary:
            summary[topic] = {"mastered": 0, "attempted": 0, "unattempted": 0}
        summary[topic][entry["status"]] += 1
    return summary


# -----------------------------
# LangGraph Features
# -----------------------------
def langgraph_suggest_next_topics():
    """Suggest next topics dynamically"""
    prompt = f"""
    You are a learning assistant.
    My learning log: {learning_log}
    Suggest 3 next topics I should focus on based on unattempted or weak topics.
    """
    try:
        response = langgraph_client.responses.create(input=prompt)
        return response.output_text or "No suggestions at this moment."
    except:
        return "No suggestions at this moment."


def langgraph_next_from_graph(current_topic):
    """Suggest next topics based on concept graph"""
    if current_topic in concept_graph:
        next_topics = concept_graph[current_topic]
        if next_topics:
            prompt = f"User has learned {current_topic}. Possible next topics: {next_topics}. Suggest the best one."
            try:
                response = langgraph_client.responses.create(input=prompt)
                return response.output_text or next_topics[0]
            except:
                return next_topics[0]
    return "🎉 You've completed the roadmap!"


def langgraph_revision_planner():
    """Generate a revision plan based on weak/old topics"""
    weak_topics = []
    now = datetime.now()
    for entry in learning_log:
        if entry["last_attempt"]:
            days_since = (now - entry["last_attempt"]).days
            if entry["status"] != "mastered" or days_since > 3:
                weak_topics.append({
                    "topic": entry["topic"],
                    "status": entry["status"],
                    "last_attempt_days": days_since
                })

    if not weak_topics:
        return "✅ All topics are fresh. No revision needed today."

    prompt = f"""
    Weak or old topics: {weak_topics}
    Create a 2-day revision plan.
    Example:
    - Day 1: Review X, Y
    - Day 2: Practice Z before new topics
    """
    try:
        response = langgraph_client.responses.create(input=prompt)
        return response.output_text or "Could not generate revision plan."
    except:
        return "Could not generate revision plan."


# -----------------------------
# Email Reminder
# -----------------------------
def send_email_reminder():
    progress = get_progress_summary()
    msg = f"Subject: Daily Learning Reminder\n\nTime to revise! Here is your progress summary:\n{progress}"
    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(EMAIL_USER, EMAIL_PASS)
        server.sendmail(EMAIL_USER, EMAIL_USER, msg)
        server.quit()
        print("✅ Revision email sent!")
    except Exception as e:
        print("⚠️ Failed to send email:", e)


schedule.every().day.at("15:04").do(send_email_reminder)


def run_scheduler():
    """Background scheduler"""
    while True:
        schedule.run_pending()
        time.sleep(60)


# -----------------------------
# Flask API Routes
# -----------------------------
@app.route('/api/chat', methods=['POST'])
def chat_api():
    global user_position
    data = request.get_json()
    user_input = data.get('message', '')
    
    # Classify & log
    topic = classify_topic(user_input)
    log_topic(user_input, topic)
    user_position = topic  # Update graph position

    # Generate Gemini response
    chat_history.append(types.Content(role="user", parts=[types.Part.from_text(text=user_input)]))
    
    generate_content_config = types.GenerateContentConfig(
        temperature=1,
        top_p=1,
        response_mime_type="text/plain",
        system_instruction=[types.Part.from_text(text="""
You are an interactive learning chatbot.
- Ask questions, give quizzes, evaluate answers, act as a teacher.
- Generate study timetables, provide notes, and grade responses.
- Always stay helpful and engaging.
""")],
    )

    response_text = ""
    for chunk in client.models.generate_content_stream(
        model=model,
        contents=chat_history,
        config=generate_content_config,
    ):
        # Safe concatenation
        response_text += chunk.text or ""

    # Add model reply
    chat_history.append(types.Content(role="model", parts=[types.Part.from_text(text=response_text)]))

    # Mark as attempted
    update_progress(user_input, correct=False)

    return jsonify({
        'success': True,
        'response': response_text
    })


@app.route('/api/history', methods=['GET'])
def history_api():
    summary = get_progress_summary()
    return jsonify({
        'success': True,
        'history': learning_log,
        'summary': summary
    })


@app.route('/api/next-topics', methods=['GET'])
def next_topics_api():
    suggestions = langgraph_suggest_next_topics()
    graph_suggestion = langgraph_next_from_graph(user_position)
    return jsonify({
        'success': True,
        'suggestions': suggestions,
        'graph_suggestion': graph_suggestion
    })


@app.route('/api/revision-plan', methods=['GET'])
def revision_plan_api():
    plan = langgraph_revision_planner()
    return jsonify({
        'success': True,
        'plan': plan
    })


@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'success': True,
        'message': 'Server is running'
    })


# -----------------------------
# Run Everything
# -----------------------------
if __name__ == "__main__":
    import threading
    
    # Start scheduler in background thread
    scheduler_thread = threading.Thread(target=run_scheduler, daemon=True)
    scheduler_thread.start()
    
    # Start Flask server
    print("Starting Intellio backend server on http://localhost:5000")
    app.run(debug=True, port=5000)