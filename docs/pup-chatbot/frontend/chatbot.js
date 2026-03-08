// ============================================================
//  chatbot.js — PUP AI Assistant Frontend Logic
//  ⚠️  UPDATE the BACKEND_URL below with your Vercel URL!
// ============================================================

const BACKEND_URL = "https://pup-chatbot.vercel.app/";
//               

// ── DOM refs ──────────────────────────────────────────────
const chatWindow = document.getElementById("chat-window");
const userInput  = document.getElementById("user-input");
const sendBtn    = document.getElementById("send-btn");

// ── Conversation history (sent to backend each turn) ──────
let conversationHistory = [];

// ── Helpers ───────────────────────────────────────────────

/** Scroll chat to the bottom */
function scrollToBottom() {
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/** Append a message bubble to the chat window */
function appendMessage(role, text) {
  const wrapper = document.createElement("div");
  wrapper.classList.add("message", role);

  const avatar = document.createElement("div");
  avatar.classList.add("msg-avatar");
  avatar.textContent = role === "bot" ? "P" : "U";

  const bubble = document.createElement("div");
  bubble.classList.add("msg-bubble");
  bubble.innerHTML = formatText(text); // light markdown-ish formatting

  wrapper.appendChild(avatar);
  wrapper.appendChild(bubble);
  chatWindow.appendChild(wrapper);
  scrollToBottom();
  return wrapper;
}

/**
 * Very lightweight formatter:
 * - **bold** → <strong>
 * - *italic* → <em>
 * - newlines → <br>
 * - bullet lines (- item) → wrapped in <ul><li>
 */
function formatText(text) {
  // Convert bullet lines to HTML list
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
    .replace(/\*(.+?)\*/g,     "<em>$1</em>");
}

/** Show the animated typing indicator */
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

/** Remove the typing indicator */
function hideTyping() {
  const el = document.getElementById("typing");
  if (el) el.remove();
}

/** Show an error message bubble */
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

  // Disable input while processing
  userInput.value     = "";
  sendBtn.disabled    = true;
  userInput.disabled  = true;

  // Show user message
  appendMessage("user", text);

  // Add to history
  conversationHistory.push({ role: "user", content: text });

  // Show typing
  showTyping();

  try {
    const response = await fetch(BACKEND_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: conversationHistory }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Server error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.reply || "Sorry, I couldn't generate a response.";

    hideTyping();
    appendMessage("bot", reply);

    // Add assistant reply to history
    conversationHistory.push({ role: "assistant", content: reply });

  } catch (err) {
    hideTyping();
    console.error("Chatbot error:", err);

    if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
      showError("⚠️ Cannot reach the server. Please check your internet connection or the backend URL in chatbot.js.");
    } else {
      showError(`⚠️ ${err.message}`);
    }

    // Remove failed user message from history
    conversationHistory.pop();
  } finally {
    sendBtn.disabled   = false;
    userInput.disabled = false;
    userInput.focus();
  }
}

// ── Event Listeners ───────────────────────────────────────

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
  // Fade out all chips after one is clicked
  const allChips = document.querySelectorAll(".chip");
  allChips.forEach(c => { c.style.pointerEvents = "none"; c.style.opacity = "0.5"; });
  sendMessage(text);
}