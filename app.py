from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from google import genai
import os
import json
import uuid
from datetime import datetime
from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "team-advantage-secret-key-2025")

# Configure Gemini
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
client = genai.Client(api_key=GEMINI_API_KEY)

print("GEMINI KEY:", GEMINI_API_KEY[:10] + "..." if GEMINI_API_KEY else "NOT FOUND")

# ---------------------------------------------------------------------------
# In-memory store (replace with Firebase in production)
# ---------------------------------------------------------------------------
users_db = {}
matches_db = {}

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/questionnaire")
def questionnaire():
    return render_template("questionnaire.html")

@app.route("/dashboard")
def dashboard():
    user_id = session.get("user_id")
    if not user_id or user_id not in users_db:
        return redirect(url_for("index"))
    user = users_db[user_id]
    partner_id = matches_db.get(user_id)
    partner = users_db.get(partner_id) if partner_id else None
    return render_template("dashboard.html", user=user, partner=partner)

@app.route("/garden")
def garden():
    user_id = session.get("user_id")
    if not user_id or user_id not in users_db:
        return redirect(url_for("index"))
    user = users_db[user_id]
    partner_id = matches_db.get(user_id)
    partner = users_db.get(partner_id) if partner_id else None
    return render_template("garden.html", user=user, partner=partner)

# ---------------------------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------------------------

@app.route("/api/submit-profile", methods=["POST"])
def submit_profile():
    data = request.get_json()
    user_id = str(uuid.uuid4())
    session["user_id"] = user_id

    profile = {
        "id": user_id,
        "name": data.get("name", "Student"),
        "study_style": data.get("study_style"),
        "schedule": data.get("schedule"),
        "intensity": data.get("intensity"),
        "subjects": data.get("subjects", []),
        "goals": data.get("goals", ""),
        "tasks": data.get("tasks", [])[:3],
        "xp": 0,
        "streak": 0,
        "flowers": 0,
        "fruits": 0,
        "trees": 0,
        "joined": datetime.now().isoformat(),
        "online": True,
        "sessions_done": 0,
        "timer_preference": data.get("timer_preference", 25),
    }
    users_db[user_id] = profile

    matched_id = find_match(user_id, profile)
    if matched_id:
        matches_db[user_id] = matched_id
        matches_db[matched_id] = user_id
        match_explanation = generate_match_explanation(profile, users_db[matched_id])
    else:
        match_explanation = "We're looking for your perfect study partner — you'll be notified soon!"

    return jsonify({
        "success": True,
        "user_id": user_id,
        "matched": matched_id is not None,
        "match_explanation": match_explanation,
        "redirect": "/dashboard"
    })

@app.route("/api/motivation-quote", methods=["GET"])
def motivation_quote():
    user_id = session.get("user_id")
    name = users_db.get(user_id, {}).get("name", "friend")
    try:
        prompt = f"""Give a short, warm, cosy 1-2 sentence motivational quote for a student named {name} 
        who is about to start a study session. Make it feel like encouragement from a kind friend, 
        not a generic poster. No hashtags, no emojis. Just warm words."""
        response = client.models.generate_content(model="gemini-2.0-flash", contents=prompt)
        quote = response.text.strip()
    except Exception as e:
        print("Gemini error (quote):", e)
        quote = f"You've got this, {name}. Every small step today is a seed planted for tomorrow."
    return jsonify({"quote": quote})

@app.route("/api/suggest-tasks", methods=["POST"])
def suggest_tasks():
    data = request.get_json()
    subject = data.get("subject", "general studying")
    user_id = session.get("user_id")
    goals = users_db.get(user_id, {}).get("goals", "")
    try:
        prompt = f"""You are a helpful study coach. A student is studying {subject} and their goal is: "{goals}".

Suggest exactly 3 specific, actionable tasks they can do TODAY in one study session.
Make them concrete and different from each other (not just read, practice, summarise).
Think: flashcards, past paper questions, mind maps, teaching back a concept, watching a specific type of video, etc.

Return ONLY a JSON array of 3 strings. No explanation, no markdown, no backticks.
Example: ["Make flashcards for chapter 4 formulas", "Solve 5 past paper questions on motion", "Draw a mind map of Newton's laws"]"""
        response = client.models.generate_content(model="gemini-2.0-flash", contents=prompt)
        text = response.text.strip().replace("```json", "").replace("```", "").strip()
        tasks = json.loads(text)
    except Exception as e:
        print("Gemini error (tasks):", e)
        tasks = [f"Review your {subject} notes from last session", f"Test yourself on {subject} without looking", f"Summarise {subject} in your own words"]
    return jsonify({"tasks": tasks})

@app.route("/api/complete-session", methods=["POST"])
def complete_session():
    user_id = session.get("user_id")
    if not user_id or user_id not in users_db:
        return jsonify({"error": "Not logged in"}), 401
    data = request.get_json()
    minutes = data.get("minutes", 25)

    user = users_db[user_id]
    xp_earned = minutes * 2
    user["xp"] += xp_earned
    user["sessions_done"] += 1
    user["streak"] += 1

    reward_type = "flower"
    if user["sessions_done"] % 5 == 0:
        user["trees"] += 1
        reward_type = "tree"
    elif user["sessions_done"] % 3 == 0:
        user["fruits"] += 1
        reward_type = "fruit"
    else:
        user["flowers"] += 1

    partner_id = matches_db.get(user_id)
    if partner_id and partner_id in users_db:
        users_db[partner_id]["xp"] += xp_earned // 2
        if reward_type == "flower":
            users_db[partner_id]["flowers"] += 1
        elif reward_type == "fruit":
            users_db[partner_id]["fruits"] += 1

    return jsonify({
        "xp_earned": xp_earned,
        "total_xp": user["xp"],
        "reward": reward_type,
        "streak": user["streak"],
        "garden": {
            "flowers": user["flowers"],
            "fruits": user["fruits"],
            "trees": user["trees"]
        }
    })

@app.route("/api/complete-task", methods=["POST"])
def complete_task():
    user_id = session.get("user_id")
    if not user_id or user_id not in users_db:
        return jsonify({"error": "Not logged in"}), 401
    data = request.get_json()
    task_index = data.get("task_index", 0)
    user = users_db[user_id]
    tasks = user.get("tasks", [])
    if task_index < len(tasks):
        tasks[task_index] = {
            "text": tasks[task_index] if isinstance(tasks[task_index], str) else tasks[task_index].get("text", ""),
            "done": True
        }
        user["tasks"] = tasks
        user["xp"] += 10
        user["flowers"] += 1
    partner_id = matches_db.get(user_id)
    if partner_id and partner_id in users_db:
        users_db[partner_id]["xp"] += 5
    return jsonify({"success": True, "xp": user["xp"], "flowers": user["flowers"]})

@app.route("/api/profile", methods=["GET"])
def get_profile():
    user_id = session.get("user_id")
    if not user_id or user_id not in users_db:
        return jsonify({"error": "Not logged in"}), 401
    user = users_db[user_id].copy()
    partner_id = matches_db.get(user_id)
    partner = users_db.get(partner_id, {}) if partner_id else {}
    return jsonify({"user": user, "partner": partner})

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def find_match(user_id, profile):
    best_match = None
    best_score = -1
    for uid, u in users_db.items():
        if uid == user_id:
            continue
        if uid in matches_db:
            continue
        score = 0
        if u.get("schedule") == profile.get("schedule"):
            score += 3
        if u.get("intensity") == profile.get("intensity"):
            score += 2
        if u.get("study_style") != profile.get("study_style"):
            score += 1
        common_subjects = set(u.get("subjects", [])) & set(profile.get("subjects", []))
        score += len(common_subjects)
        if score > best_score:
            best_score = score
            best_match = uid
    return best_match

def generate_match_explanation(user, partner):
    try:
        prompt = f"""Two students are being matched as study partners. Write a warm, 2-sentence explanation 
        of why they're a great match. Keep it cosy and encouraging.
        Student 1: studies in the {user.get('schedule')}, {user.get('intensity')} intensity, style: {user.get('study_style')}
        Student 2: studies in the {partner.get('schedule')}, {partner.get('intensity')} intensity, style: {partner.get('study_style')}
        No emojis. Sound like a caring friend making an introduction."""
        response = client.models.generate_content(model="gemini-2.0-flash", contents=prompt)
        return response.text.strip()
    except Exception as e:
        print("Gemini error (match):", e)
        return f"You and {partner.get('name', 'your partner')} share the same study schedule and energy — you're going to keep each other on track!"

if __name__ == "__main__":
    app.run(debug=True, port=5000)
