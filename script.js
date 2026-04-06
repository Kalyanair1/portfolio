const STORAGE_KEY = "portfolioContactResponses";
const THEME_KEY = "portfolioTheme";
const ADMIN_SESSION_KEY = "portfolioAdminLoggedIn";
const ADMIN_CREDENTIALS = {
  username: "admin",
  password: "portfolio123",
};

const themeToggle = document.getElementById("themeToggle");
const themeToggleText = document.querySelector(".theme-toggle__text");
const contactForm = document.getElementById("contactForm");
const emailInput = document.getElementById("email");
const emailError = document.getElementById("emailError");
const formStatus = document.getElementById("formStatus");
const adminLoginForm = document.getElementById("adminLoginForm");
const loginStatus = document.getElementById("loginStatus");
const adminPanel = document.getElementById("adminPanel");
const responsesContainer = document.getElementById("responsesContainer");
const adminLogout = document.getElementById("adminLogout");
const exportResponsesButton = document.getElementById("exportResponses");
const clearResponsesButton = document.getElementById("clearResponses");
const rawDataOutput = document.getElementById("rawDataOutput");
const responseCount = document.getElementById("responseCount");
const revealElements = document.querySelectorAll(".reveal");

function getStoredResponses() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return [];
  }

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveResponses(responses) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(responses));
}

function validateEmail(email) {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email.trim());
}

function setTheme(theme) {
  const isDark = theme === "dark";
  document.body.classList.toggle("dark-theme", isDark);
  themeToggleText.textContent = isDark ? "Light Mode" : "Dark Mode";
  localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
}

function renderResponses() {
  const responses = getStoredResponses().sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
  );
  responseCount.textContent = String(responses.length);
  rawDataOutput.textContent = JSON.stringify(responses, null, 2);

  if (responses.length === 0) {
    responsesContainer.innerHTML =
      '<div class="response-card"><h4>No messages yet</h4><p>Submit the contact form to populate this viewer.</p></div>';
    return;
  }

  responsesContainer.innerHTML = responses
    .map((response) => {
      const readableTime = new Date(response.timestamp).toLocaleString();

      return `
        <article class="response-card">
          <h4>${escapeHtml(response.name)}</h4>
          <p><strong>Email:</strong> ${escapeHtml(response.email)}</p>
          <p><strong>Submitted:</strong> ${escapeHtml(readableTime)}</p>
          <p><strong>Message:</strong> ${escapeHtml(response.message)}</p>
        </article>
      `;
    })
    .join("");
}

function toggleAdminView(isLoggedIn) {
  adminLoginForm.classList.toggle("hidden", isLoggedIn);
  adminPanel.classList.toggle("hidden", !isLoggedIn);

  if (isLoggedIn) {
    renderResponses();
  }
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

function exportResponses() {
  const responses = getStoredResponses();
  const blob = new Blob([JSON.stringify(responses, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "portfolio-contact-responses.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function setupRevealAnimations() {
  if (!("IntersectionObserver" in window)) {
    revealElements.forEach((element) => {
      element.classList.add("is-visible");
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.14,
      rootMargin: "0px 0px -40px 0px",
    },
  );

  revealElements.forEach((element) => observer.observe(element));
}

themeToggle.addEventListener("click", () => {
  const nextTheme = document.body.classList.contains("dark-theme") ? "light" : "dark";
  setTheme(nextTheme);
});

emailInput.addEventListener("input", () => {
  if (!emailInput.value.trim() || validateEmail(emailInput.value)) {
    emailError.textContent = "";
    return;
  }

  emailError.textContent = "Please enter a valid email address.";
});

contactForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(contactForm);
  const name = formData.get("name").toString().trim();
  const email = formData.get("email").toString().trim();
  const message = formData.get("message").toString().trim();

  if (!name || !message) {
    formStatus.textContent = "Please complete all fields before submitting.";
    emailError.textContent = "";
    return;
  }

  if (!validateEmail(email)) {
    emailError.textContent = "Please enter a valid email address.";
    formStatus.textContent = "Please correct the highlighted email field.";
    emailInput.focus();
    return;
  }

  emailError.textContent = "";

  const responses = getStoredResponses();
  responses.push({
    name,
    email,
    message,
    timestamp: new Date().toISOString(),
  });

  saveResponses(responses);
  formStatus.textContent = "Message saved successfully.";
  contactForm.reset();

  if (localStorage.getItem(ADMIN_SESSION_KEY) === "true") {
    renderResponses();
  }
});

adminLoginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(adminLoginForm);
  const username = formData.get("adminUsername").toString().trim();
  const password = formData.get("adminPassword").toString().trim();

  if (!username || !password) {
    loginStatus.textContent = "Please enter both username and password.";
    return;
  }

  if (
    username === ADMIN_CREDENTIALS.username &&
    password === ADMIN_CREDENTIALS.password
  ) {
    localStorage.setItem(ADMIN_SESSION_KEY, "true");
    loginStatus.textContent = "Login successful.";
    adminLoginForm.reset();
    toggleAdminView(true);
    return;
  }

  loginStatus.textContent = "Invalid username or password.";
});

adminLogout.addEventListener("click", () => {
  localStorage.removeItem(ADMIN_SESSION_KEY);
  loginStatus.textContent = "";
  toggleAdminView(false);
});

exportResponsesButton.addEventListener("click", () => {
  exportResponses();
});

clearResponsesButton.addEventListener("click", () => {
  const shouldClear = window.confirm(
    "Clear all saved contact messages from this browser?",
  );

  if (!shouldClear) {
    return;
  }

  saveResponses([]);
  renderResponses();
});

setTheme(localStorage.getItem(THEME_KEY) || "light");
toggleAdminView(localStorage.getItem(ADMIN_SESSION_KEY) === "true");
setupRevealAnimations();
