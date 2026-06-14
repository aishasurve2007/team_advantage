# 🌿 The Team Advantage

> *Study together, grow together.* — A cosy, collaborative study partner platform.

---

## Project Structure

```
team-advantage/
├── app.py                  # Flask backend (routes + API endpoints)
├── requirements.txt
├── .env.example
├── templates/
│   ├── base.html           # Shared nav + layout
│   ├── index.html          # Landing page
│   ├── questionnaire.html  # Onboarding (4 steps)
│   ├── dashboard.html      # Main study hub
│   └── garden.html         # Shared visual garden
└── static/
    ├── css/
    │   └── main.css        # Cosy garden theme
    └── js/
        ├── main.js
        ├── questionnaire.js  # Step logic + AI task suggestions
        ├── dashboard.js      # Timer + session + task completion
        └── garden.js         # Plant rendering
```

---

## Setup

```bash
# 1. Clone / open the folder
cd team-advantage

# 2. Create virtual environment
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Set up environment variables
cp .env.example .env
# → Edit .env and paste your Gemini API key

# 5. Run
python app.py
# → Open http://localhost:5000
```

---

## Features

| Feature | Status |
|---------|--------|
| 4-step onboarding questionnaire | ✅ |
| AI partner matching (schedule, style, intensity) | ✅ |
| Gemini AI match explanation | ✅ |
| AI task suggestions (Gemini) | ✅ |
| Daily motivation quotes (Gemini) | ✅ |
| Countdown timer (15/25/45/60 min) | ✅ |
| Task completion with XP | ✅ |
| Session completion with XP for both partners | ✅ |
| Shared garden (flowers / fruits / trees) | ✅ |
| Analytics dashboard | ✅ |
| Firebase integration | 🔜 Replace in-memory `users_db` |
| User auth (login/signup) | 🔜 Add Flask-Login |
| Real-time partner status | 🔜 Add Flask-SocketIO |
| Calendar integration | 🔜 Google Calendar API |
| Shared virtual garden (animated) | ✅ |

---

## Gemini API Usage

- **Match Explanation** — `POST /api/submit-profile` calls Gemini to write a warm 2-sentence partner intro
- **Task Suggestions** — `POST /api/suggest-tasks` returns 3 subject-specific tasks as JSON
- **Motivation Quotes** — `GET /api/motivation-quote` gives a personalised daily quote

---

## Garden Reward Logic

| Event | Reward |
|-------|--------|
| Complete a task | 🌸 Flower (you + partner) |
| Complete a session | 🌸 Flower + XP for both |
| Every 3rd session | 🍓 Fruit |
| Every 5th session | 🌳 Tree |

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | HTML, CSS, Vanilla JS |
| Backend | Flask (Python) |
| AI/ML | Gemini 1.5 Flash API |
| Database | In-memory (→ Firebase in prod) |
| Fonts | Nunito + Lora (Google Fonts) |
