/**
 * FUTURETECH SUMMIT 2026 — script.js
 * =============================================
 * Backend Features (Anthropic API):
 *   1. AI Chat Assistant (FAQ Bot) — real Claude responses
 *   2. AI Registration Confirmation — personalised summary
 *
 * Frontend Features:
 *   3. Sticky navbar + mobile menu toggle
 *   4. Animated stat counters (IntersectionObserver)
 *   5. Scroll reveal animations
 *   6. FAQ accordion
 *   7. Schedule day tabs
 *   8. Back-to-top button
 *   9. Particle canvas (hero background)
 * =============================================
 */

/* ============================================================
   0. ANTHROPIC API — SHARED HELPER
   ============================================================ */

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";

/**
 * callClaude — sends a prompt to the Anthropic API and returns text.
 * @param {string} systemPrompt  — the system instruction
 * @param {Array}  messages      — [{role:"user"|"assistant", content:"..."}]
 * @returns {Promise<string>}    — Claude's reply text
 */
async function callClaude(systemPrompt, messages) {
  const res = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1000,
      system: systemPrompt,
      messages,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${res.status}`);
  }

  const data = await res.json();
  // Extract text from content blocks
  return data.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");
}

/* ============================================================
   1. AI CHAT ASSISTANT
   ============================================================ */

const CHAT_SYSTEM = `You are the official AI assistant for FutureTech Summit 2026, the world's premier technology conference.

Event details:
- Dates: September 15–17, 2026
- Location: Moscone Center, San Francisco, CA
- Attendees: 5000+ from 50+ countries
- 100+ speakers including Dr. Rachel Kim (DeepMind), Marcus Johnson (Tesla Robotics), Aisha Zuberi (CrowdStrike), Kevin Liu (QuantumLeap), Sofia Petrov (AWS), Tomas Ortega (Meta Reality Labs)

Tracks: AI, Machine Learning, Cybersecurity, Cloud Computing, Robotics/IoT, Web Development

Tickets:
  - Basic Pass: $299 (Conference access + Digital materials)
  - Professional Pass: $599 (+ Workshops + Networking events)
  - VIP Pass: $1299 (+ VIP Lounge + Speaker Meet & Greet)
  Early bird savings up to 40% (ends August 1st)

Schedule highlights:
  Day 1: AI Keynote (Dr. Rachel Kim), Global Networking Session, Welcome Reception
  Day 2: Cybersecurity Workshop (Aisha Zuberi), Startup Showcase
  Day 3: Future Technology Panel (all speakers), Closing Ceremony & Awards Gala

FAQ:
  - Workshops included in Professional and VIP passes
  - No accommodation included but partner hotel rates available
  - All keynotes recorded; available for 12 months
  - Full refund 30 days before event

Answer questions helpfully, concisely, and enthusiastically. Keep replies to 2–4 sentences unless a longer answer is genuinely needed. Always end with a subtle call-to-action when relevant (e.g., "Register now at early-bird pricing!").`;

// Store conversation history for multi-turn chat
const chatHistory = [];

const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const chatSend = document.getElementById("chatSend");

function appendMessage(role, text) {
  const div = document.createElement("div");
  div.className = `chat-msg ${role}`;
  const bubble = document.createElement("div");
  bubble.className = "msg-bubble";
  bubble.textContent = text;
  div.appendChild(bubble);
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return bubble;
}

async function sendChat(userText) {
  if (!userText.trim()) return;

  chatInput.value = "";
  chatSend.disabled = true;
  appendMessage("user", userText);

  // Add to history
  chatHistory.push({ role: "user", content: userText });

  // Show loading indicator
  const loadingBubble = appendMessage("bot", "⚡ Thinking...");
  loadingBubble.classList.add("loading");

  try {
    const reply = await callClaude(CHAT_SYSTEM, chatHistory);

    // Replace loading bubble with real reply
    loadingBubble.classList.remove("loading");
    loadingBubble.textContent = reply;

    // Add assistant reply to history
    chatHistory.push({ role: "assistant", content: reply });
  } catch (err) {
    loadingBubble.classList.remove("loading");
    loadingBubble.textContent =
      "Sorry, I'm having trouble connecting right now. Please try again or email hello@futuretech2026.com for help!";
    console.error("Chat error:", err);
  }

  chatSend.disabled = false;
  chatInput.focus();
}

chatSend.addEventListener("click", () => sendChat(chatInput.value));
chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendChat(chatInput.value);
  }
});

// Suggestion chips (also called from inline onclick in HTML)
function sendSuggestion(text) {
  chatInput.value = text;
  sendChat(text);
}
window.sendSuggestion = sendSuggestion;

/* ============================================================
   2. AI REGISTRATION CONFIRMATION
   ============================================================ */

const REGISTER_SYSTEM = `You are the registration system for FutureTech Summit 2026.

When given attendee details, generate a warm, personalised, professional registration confirmation message.

Include:
1. A personalised welcome using their name
2. Confirm their ticket type and what's included
3. Key dates (Sept 15–17, 2026, Moscone Center SF)
4. One exciting thing they should look forward to based on their ticket
5. A note to check their email for the official ticket (fictional — just mention it)
6. End with an enthusiastic sign-off from the FutureTech team

Keep it to 5–7 sentences. Warm, professional, exciting tone. No markdown, plain text only.`;

const registerForm = document.getElementById("registerForm");
const registerSuccess = document.getElementById("registerSuccess");
const successMsg = document.getElementById("successMsg");
const submitBtn = document.getElementById("submitBtn");

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("regName").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const company = document.getElementById("regCompany").value.trim() || "Independent";
  const ticket = document.getElementById("regTicket").value;
  const message = document.getElementById("regMessage").value.trim();

  if (!name || !email || !ticket) return;

  submitBtn.disabled = true;
  submitBtn.textContent = "⏳ Processing Registration...";

  const prompt = `Attendee Name: ${name}
Company: ${company}
Email: ${email}
Ticket Type: ${ticket}
Special Requirements: ${message || "None"}

Generate their personalised confirmation message.`;

  try {
    const confirmation = await callClaude(REGISTER_SYSTEM, [
      { role: "user", content: prompt },
    ]);

    // Hide form, show success
    registerForm.classList.add("hidden");
    registerSuccess.classList.remove("hidden");
    successMsg.textContent = confirmation;
  } catch (err) {
    // Fallback confirmation if API fails
    registerForm.classList.add("hidden");
    registerSuccess.classList.remove("hidden");
    successMsg.textContent = `Welcome aboard, ${name}! Your ${ticket} registration for FutureTech Summit 2026 has been received. We'll see you at the Moscone Center, San Francisco on September 15–17, 2026. Check your email at ${email} for your official ticket. We can't wait to welcome you — the future starts here!`;
    console.error("Registration API error:", err);
  }

  submitBtn.disabled = false;
  submitBtn.textContent = "🚀 Complete Registration";
});

function resetForm() {
  registerForm.reset();
  registerForm.classList.remove("hidden");
  registerSuccess.classList.add("hidden");
}
window.resetForm = resetForm;

/* ============================================================
   3. STICKY NAVBAR + MOBILE MENU
   ============================================================ */

const navbar = document.getElementById("navbar");
const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("navLinks");

window.addEventListener("scroll", () => {
  navbar.classList.toggle("scrolled", window.scrollY > 50);
});

hamburger.addEventListener("click", () => {
  hamburger.classList.toggle("open");
  navLinks.classList.toggle("open");
});

// Close mobile menu when a link is clicked
navLinks.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    hamburger.classList.remove("open");
    navLinks.classList.remove("open");
  });
});

/* ============================================================
   4. ANIMATED STAT COUNTERS
   ============================================================ */

function animateCounter(el) {
  const target = parseInt(el.getAttribute("data-target"), 10);
  const duration = 1800;
  const step = Math.ceil(target / (duration / 16));
  let current = 0;

  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current.toLocaleString();
    if (current >= target) clearInterval(timer);
  }, 16);
}

const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.5 }
);

document.querySelectorAll(".stat-num").forEach((el) => counterObserver.observe(el));

/* ============================================================
   5. SCROLL REVEAL ANIMATIONS
   ============================================================ */

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // Staggered delay for sibling cards
        const siblings = entry.target.parentElement.querySelectorAll(".reveal");
        let delay = 0;
        siblings.forEach((sib, idx) => {
          if (sib === entry.target) delay = idx * 80;
        });
        setTimeout(() => entry.target.classList.add("visible"), delay);
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
);

document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

/* ============================================================
   6. FAQ ACCORDION
   ============================================================ */

document.querySelectorAll(".faq-question").forEach((btn) => {
  btn.addEventListener("click", () => {
    const item = btn.closest(".faq-item");
    const isOpen = item.classList.contains("open");

    // Close all others
    document.querySelectorAll(".faq-item.open").forEach((open) => {
      if (open !== item) open.classList.remove("open");
    });

    item.classList.toggle("open", !isOpen);
  });
});

/* ============================================================
   7. SCHEDULE DAY TABS
   ============================================================ */

const tabBtns = document.querySelectorAll(".tab-btn");
const dayContents = document.querySelectorAll(".day-content");

tabBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const day = btn.getAttribute("data-day");

    tabBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    dayContents.forEach((content) => {
      content.classList.toggle("active", content.getAttribute("data-day") === day);
    });
  });
});

/* ============================================================
   8. BACK TO TOP
   ============================================================ */

const backToTop = document.getElementById("backToTop");

window.addEventListener("scroll", () => {
  backToTop.classList.toggle("visible", window.scrollY > 500);
});

backToTop.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

/* ============================================================
   9. HERO PARTICLE CANVAS
   ============================================================ */

(function initCanvas() {
  const canvas = document.getElementById("heroCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let particles = [];
  let W, H;

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function createParticle() {
    return {
      x: rand(0, W),
      y: rand(0, H),
      r: rand(1, 2.5),
      dx: rand(-0.3, 0.3),
      dy: rand(-0.5, -0.15),
      alpha: rand(0.3, 0.9),
      color: Math.random() > 0.5 ? "0,229,255" : "123,47,247",
    };
  }

  for (let i = 0; i < 90; i++) particles.push(createParticle());

  function draw() {
    ctx.clearRect(0, 0, W, H);

    particles.forEach((p, i) => {
      p.x += p.dx;
      p.y += p.dy;
      p.alpha -= 0.001;

      if (p.y < 0 || p.alpha <= 0) particles[i] = createParticle();

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color},${p.alpha})`;
      ctx.fill();
    });

    // Draw connecting lines between nearby particles
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(0,229,255,${0.06 * (1 - dist / 100)})`;
          ctx.lineWidth = 0.5;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(draw);
  }

  draw();
})();

/* ============================================================
   10. ACTIVE NAV LINK HIGHLIGHT ON SCROLL
   ============================================================ */

const sections = document.querySelectorAll("section[id]");
const navLinkItems = document.querySelectorAll(".nav-links a");

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        navLinkItems.forEach((link) => {
          link.style.color =
            link.getAttribute("href") === `#${entry.target.id}`
              ? "var(--cyan)"
              : "";
        });
      }
    });
  },
  { threshold: 0.4 }
);

sections.forEach((s) => sectionObserver.observe(s));
