// ---- Questionnaire State ----
const state = {
  currentStep: 1,
  totalSteps: 4,
  data: {
    name: "",
    goals: "",
    subjects: [],
    schedule: null,
    study_style: null,
    intensity: null,
    timer_preference: 25,
    tasks: []
  }
};

const stepTitles = [
  "Let's get to know you 🌿",
  "When & how do you study?",
  "Your pace & rhythm 🍵",
  "What's on your plate today? ✅"
];
const stepSubs = [
  "We'll use this to find your perfect study partner.",
  "We match you with someone on the same schedule.",
  "We look for complementary intensities and preferences.",
  "Start with up to 3 tasks — or let AI help you pick."
];

// ---- Navigation ----
document.getElementById("next-btn").addEventListener("click", goNext);
document.getElementById("prev-btn").addEventListener("click", goPrev);

function goNext() {
  if (!validateStep(state.currentStep)) return;
  collectStep(state.currentStep);
  if (state.currentStep === state.totalSteps) {
    submitProfile();
    return;
  }
  state.currentStep++;
  renderStep();
}

function goPrev() {
  if (state.currentStep === 1) return;
  state.currentStep--;
  renderStep();
}

function renderStep() {
  document.querySelectorAll(".q-step").forEach(el => el.classList.remove("active"));
  document.getElementById(`step-${state.currentStep}`).classList.add("active");
  document.getElementById("step-num").textContent = state.currentStep;
  document.getElementById("q-title").textContent = stepTitles[state.currentStep - 1];
  document.getElementById("q-subtitle").textContent = stepSubs[state.currentStep - 1];
  document.getElementById("progress-fill").style.width = `${(state.currentStep / state.totalSteps) * 100}%`;
  document.getElementById("prev-btn").style.display = state.currentStep > 1 ? "inline-block" : "none";
  document.getElementById("next-btn").textContent = state.currentStep === state.totalSteps ? "Find My Partner 🌱" : "Next →";
}

// ---- Validation ----
function validateStep(step) {
  if (step === 1) {
    const name = document.getElementById("input-name").value.trim();
    if (!name) { alert("Please enter your name 🌿"); return false; }
  }
  if (step === 2) {
    if (!state.data.schedule) { alert("Please pick when you study 📅"); return false; }
    if (!state.data.study_style) { alert("Please pick your study style 📖"); return false; }
  }
  if (step === 3) {
    if (!state.data.intensity) { alert("Please pick your study intensity ⚡"); return false; }
  }
  return true;
}

// ---- Collect Data ----
function collectStep(step) {
  if (step === 1) {
    state.data.name = document.getElementById("input-name").value.trim();
    state.data.goals = document.getElementById("input-goals").value.trim();
  }
  if (step === 4) {
    const inputs = document.querySelectorAll(".task-input");
    state.data.tasks = Array.from(inputs)
      .map(i => i.value.trim())
      .filter(Boolean)
      .slice(0, 3);
  }
}

// ---- Pills (multi-select) ----
document.querySelectorAll("#subjects-group .pill").forEach(btn => {
  btn.addEventListener("click", () => {
    btn.classList.toggle("selected");
    const val = btn.dataset.val;
    if (btn.classList.contains("selected")) {
      state.data.subjects.push(val);
    } else {
      state.data.subjects = state.data.subjects.filter(s => s !== val);
    }
  });
});

// Timer pills
document.querySelectorAll("#timer-group .pill").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#timer-group .pill").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    state.data.timer_preference = parseInt(btn.dataset.val);
  });
});
// Pre-select 25 min
document.querySelector('#timer-group .pill[data-val="25"]')?.classList.add("selected");

// ---- Cards (single-select per group) ----
document.querySelectorAll(".q-card").forEach(card => {
  card.addEventListener("click", () => {
    const group = card.dataset.group;
    document.querySelectorAll(`.q-card[data-group="${group}"]`).forEach(c => c.classList.remove("selected"));
    card.classList.add("selected");
    state.data[group] = card.dataset.val;
  });
});

// ---- AI Task Suggestions ----
document.getElementById("suggest-tasks-btn").addEventListener("click", async () => {
  const btn = document.getElementById("suggest-tasks-btn");
  btn.textContent = "✨ Thinking...";
  btn.disabled = true;
  try {
    const subject = state.data.subjects[0] || "general";
    const res = await fetch("/api/suggest-tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, goals: state.data.goals })
    });
    const data = await res.json();
    const container = document.getElementById("ai-task-suggestions");
    container.innerHTML = `<p>AI suggestions — click to use:</p>`;
    container.classList.remove("hidden");
    data.tasks.forEach((task, i) => {
      const b = document.createElement("button");
      b.className = "ai-task-btn";
      b.textContent = `✅ ${task}`;
      b.onclick = () => {
        const inputs = document.querySelectorAll(".task-input");
        if (inputs[i]) inputs[i].value = task;
      };
      container.appendChild(b);
    });
  } catch (e) {
    console.error(e);
  }
  btn.textContent = "✨ Let AI suggest tasks";
  btn.disabled = false;
});

// ---- Submit ----
async function submitProfile() {
  collectStep(4);
  const btn = document.getElementById("next-btn");
  btn.textContent = "Finding your match... 🌿";
  btn.disabled = true;
  try {
    const res = await fetch("/api/submit-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state.data)
    });
    const result = await res.json();
    if (result.success) {
      window.location.href = result.redirect;
    }
  } catch (e) {
    btn.textContent = "Find My Partner 🌱";
    btn.disabled = false;
    alert("Something went wrong. Please try again.");
  }
}
