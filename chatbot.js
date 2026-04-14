const BACKEND_URL = "/api/chat";

// ── DOM refs ──────────────────────────────────────────────
const chatWindow = document.getElementById("chat-window");
const userInput  = document.getElementById("user-input");
const sendBtn    = document.getElementById("send-btn");

// ── Conversation history ──────────────────────────────────
let conversationHistory = [];

// ── Helpers ───────────────────────────────────────────────

function scrollToBottom() {
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function appendMessage(role, text) {
  const wrapper = document.createElement("div");
  wrapper.classList.add("message", role);

  const avatar = document.createElement("div");
  avatar.classList.add("msg-avatar");
  avatar.textContent = role === "bot" ? "P" : "U";

  const bubble = document.createElement("div");
  bubble.classList.add("msg-bubble");
  bubble.innerHTML = formatText(text);

  wrapper.appendChild(avatar);
  wrapper.appendChild(bubble);
  chatWindow.appendChild(wrapper);
  scrollToBottom();
  return wrapper;
}

function formatText(text) {
  const lines = text.split("\n");
  let html = "";
  let inList = false;

  for (let line of lines) {
    const bulletMatch = line.match(/^[\-\*•]\s+(.+)/);
    if (bulletMatch) {
      if (!inList) { html += "<ul style='padding-left:18px;margin:6px 0'>"; inList = true; }
      html += `<li>${applyInlineFormat(bulletMatch[1])}</li>`;
    } else {
      if (inList) { html += "</ul>"; inList = false; }
      if (line.trim() === "") {
        html += "<br>";
      } else {
        html += applyInlineFormat(line) + "<br>";
      }
    }
  }
  if (inList) html += "</ul>";
  return html;
}

function applyInlineFormat(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

function showTyping() {
  const wrapper = document.createElement("div");
  wrapper.classList.add("typing-indicator");
  wrapper.id = "typing";

  const avatar = document.createElement("div");
  avatar.classList.add("msg-avatar");
  avatar.textContent = "P";

  const dots = document.createElement("div");
  dots.classList.add("typing-dots");
  dots.innerHTML = "<span></span><span></span><span></span>";

  wrapper.appendChild(avatar);
  wrapper.appendChild(dots);
  chatWindow.appendChild(wrapper);
  scrollToBottom();
}

function hideTyping() {
  const el = document.getElementById("typing");
  if (el) el.remove();
}

function showError(msg) {
  const wrapper = document.createElement("div");
  wrapper.classList.add("message", "bot");

  const avatar = document.createElement("div");
  avatar.classList.add("msg-avatar");
  avatar.textContent = "P";

  const bubble = document.createElement("div");
  bubble.classList.add("msg-bubble");
  bubble.style.cssText = "background:#FFF0F0;border-color:#F87171;color:#991B1B";
  bubble.textContent = msg;

  wrapper.appendChild(avatar);
  wrapper.appendChild(bubble);
  chatWindow.appendChild(wrapper);
  scrollToBottom();
}

// ── Main send function ────────────────────────────────────

async function sendMessage(text) {
  text = text.trim();
  if (!text) return;

  userInput.value    = "";
  sendBtn.disabled   = true;
  userInput.disabled = true;

  appendMessage("user", text);
  conversationHistory.push({ role: "user", content: text });
  showTyping();

  try {
    const response = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: conversationHistory }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || "Server error: " + response.status);
    }

    const reply = data.reply || "Sorry, I could not generate a response.";
    hideTyping();
    appendMessage("bot", reply);
    conversationHistory.push({ role: "assistant", content: reply });

  } catch (err) {
    hideTyping();
    console.error("Chatbot error:", err);
    showError("⚠️ " + err.message);
    conversationHistory.pop();
  } finally {
    sendBtn.disabled   = false;
    userInput.disabled = false;
    userInput.focus();
  }
}

// ── Event Listeners ───────────────────────────────────────

// ── Welcome message on load ──────────────────────────────
window.addEventListener("DOMContentLoaded", () => {
  appendMessage("bot",
    "Kumusta, Iskolar! 👋 I'm your **PUP AI Assistant**. Ask me anything about the Polytechnic University of the Philippines — admissions, courses, campuses, scholarships, and more. Click any question below or type your own!"
  );
});

sendBtn.addEventListener("click", () => sendMessage(userInput.value));

userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage(userInput.value);
  }
});

// ── Suggestion Chips ──────────────────────────────────────

function sendChip(chipEl) {
  const text = chipEl.textContent.trim();
  sendMessage(text);
}