// ---- Timer ----
let timerMinutes = parseInt(document.getElementById("timer-time")?.textContent?.split(":")[0]) || 25;
let timerSeconds = 0;
let timerInterval = null;
let timerRunning = false;

function setTimer(mins) {
  if (timerRunning) return;
  timerMinutes = mins;
  timerSeconds = 0;
  updateTimerDisplay();
  document.querySelectorAll(".preset-btn").forEach(b => b.classList.remove("active"));
  document.querySelector(`.preset-btn[onclick="setTimer(${mins})"]`)?.classList.add("active");
}

function updateTimerDisplay() {
  const m = String(timerMinutes).padStart(2, "0");
  const s = String(timerSeconds).padStart(2, "0");
  document.getElementById("timer-time").textContent = `${m}:${s}`;
}

function startTimer() {
  if (timerRunning) {
    // Pause
    clearInterval(timerInterval);
    timerRunning = false;
    document.getElementById("start-btn").textContent = "▶ Resume Session";
    return;
  }
  timerRunning = true;
  document.getElementById("start-btn").textContent = "⏸ Pause";
  document.getElementById("reset-btn").style.display = "inline-block";
  document.getElementById("session-complete").classList.add("hidden");

  const totalMins = timerMinutes + (timerSeconds > 0 ? 1 : 0);
  let remaining = timerMinutes * 60 + timerSeconds;

  timerInterval = setInterval(() => {
    remaining--;
    if (remaining <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      timerMinutes = 0;
      timerSeconds = 0;
      updateTimerDisplay();
      onSessionComplete(totalMins);
      return;
    }
    timerMinutes = Math.floor(remaining / 60);
    timerSeconds = remaining % 60;
    updateTimerDisplay();
  }, 1000);
}

function resetTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  timerMinutes = 25;
  timerSeconds = 0;
  updateTimerDisplay();
  document.getElementById("start-btn").textContent = "▶ Start Session";
  document.getElementById("reset-btn").style.display = "none";
  document.getElementById("session-complete").classList.add("hidden");
}

async function onSessionComplete(minutes) {
  document.getElementById("start-btn").textContent = "▶ Start Session";
  document.getElementById("reset-btn").style.display = "none";

  try {
    const res = await fetch("/api/complete-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ minutes })
    });
    const data = await res.json();
    const rewardEmoji = data.reward === "tree" ? "🌳" : data.reward === "fruit" ? "🍓" : "🌸";
    document.getElementById("reward-reveal").textContent = `+${data.xp_earned} XP · ${rewardEmoji} New plant in your garden!`;
    document.getElementById("session-complete").classList.remove("hidden");
  } catch (e) {
    document.getElementById("reward-reveal").textContent = "Session saved!";
    document.getElementById("session-complete").classList.remove("hidden");
  }
}

// ---- Tasks ----
async function completeTask(index) {
  try {
    const res = await fetch("/api/complete-task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task_index: index })
    });
    const data = await res.json();
    if (data.success) {
      const item = document.querySelector(`.task-item[data-index="${index}"]`);
      if (item) {
        item.classList.add("done");
        item.querySelector(".task-check").textContent = "✅";
      }
    }
  } catch (e) {
    console.error(e);
  }
}

// ---- Motivation Quote ----
async function loadMotivationQuote() {
  try {
    const res = await fetch("/api/motivation-quote");
    const data = await res.json();
    const el = document.getElementById("motivation-quote");
    if (el && data.quote) el.textContent = `"${data.quote}"`;
  } catch (e) {
    const el = document.getElementById("motivation-quote");
    if (el) el.textContent = '"Every session is a seed planted. Keep going. 🌱"';
  }
}

loadMotivationQuote();
