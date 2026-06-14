// ---- Render Garden Plants ----
const FLOWER_EMOJIS = ["🌸", "🌺", "🌼", "🌻", "🌷", "💐"];
const FRUIT_EMOJIS  = ["🍓", "🍎", "🍊", "🍇", "🍒", "🫐"];
const TREE_EMOJIS   = ["🌳", "🌲", "🎄", "🌴"];

function renderGarden(flowers, fruits, trees) {
  const grid = document.getElementById("plant-grid");
  if (!grid) return;
  grid.innerHTML = "";

  const plants = [];

  // Trees first (biggest)
  for (let i = 0; i < trees; i++) {
    plants.push({ emoji: TREE_EMOJIS[i % TREE_EMOJIS.length], size: "3rem" });
  }
  // Fruits
  for (let i = 0; i < fruits; i++) {
    plants.push({ emoji: FRUIT_EMOJIS[i % FRUIT_EMOJIS.length], size: "2.2rem" });
  }
  // Flowers (most numerous)
  for (let i = 0; i < flowers; i++) {
    plants.push({ emoji: FLOWER_EMOJIS[i % FLOWER_EMOJIS.length], size: "1.8rem" });
  }

  if (plants.length === 0) {
    const msg = document.createElement("p");
    msg.style.cssText = "color:#7A6A5A;font-size:0.9rem;padding:20px;font-weight:600;";
    msg.textContent = "Your garden is empty — complete a session to plant your first flower! 🌱";
    grid.appendChild(msg);
    return;
  }

  // Shuffle for natural feel
  plants.sort(() => Math.random() - 0.5);

  plants.forEach((p, i) => {
    const span = document.createElement("span");
    span.className = "plant-item";
    span.textContent = p.emoji;
    span.style.fontSize = p.size;
    span.style.animationDelay = `${i * 0.05}s`;
    grid.appendChild(span);
  });
}

// Use values injected from Jinja
renderGarden(
  typeof flowerCount !== "undefined" ? flowerCount : 0,
  typeof fruitCount  !== "undefined" ? fruitCount  : 0,
  typeof treeCount   !== "undefined" ? treeCount   : 0
);
