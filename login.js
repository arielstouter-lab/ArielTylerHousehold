const { createClient } = window.supabase;

const supabaseClient = createClient(
  window.APP_CONFIG.supabaseUrl,
  window.APP_CONFIG.supabaseKey
);

document.addEventListener("DOMContentLoaded", async () => {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  const {
    data: { session }
  } = await supabaseClient.auth.getSession();

  // Login page
  if (currentPage === "index.html" || currentPage === "") {
    if (session) {
      window.location.href = "app.html";
      return;
    }

    setupLogin();
    return;
  }

  // App page
  if (currentPage === "app.html") {
    if (!session) {
      window.location.href = "index.html";
      return;
    }

    setupApp(session);
  }
});


/* -----------------------------
   Login
----------------------------- */

function setupLogin() {
  const form = document.getElementById("login-form");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const togglePassword = document.getElementById("toggle-password");
  const errorElement = document.getElementById("login-error");
  const button = document.getElementById("login-button");
  const buttonText = document.getElementById("login-button-text");
  const spinner = document.getElementById("login-spinner");

  togglePassword.addEventListener("click", () => {
    const isPassword = passwordInput.type === "password";

    passwordInput.type = isPassword ? "text" : "password";
    togglePassword.textContent = isPassword ? "Hide" : "Show";
    togglePassword.setAttribute(
      "aria-label",
      isPassword ? "Hide password" : "Show password"
    );
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    errorElement.hidden = true;
    errorElement.textContent = "";

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showLoginError("Please enter your email and password.");
      return;
    }

    button.disabled = true;
    buttonText.textContent = "Signing in...";
    spinner.hidden = false;

    const { error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      showLoginError(getFriendlyAuthError(error));
      button.disabled = false;
      buttonText.textContent = "Sign in";
      spinner.hidden = true;
      return;
    }

    window.location.href = "app.html";
  });

  function showLoginError(message) {
    errorElement.textContent = message;
    errorElement.hidden = false;
  }
}


/* -----------------------------
   App
----------------------------- */

function setupApp(session) {
  const user = session.user;

  const emailElement = document.getElementById("user-email");
  const avatarElement = document.getElementById("user-avatar");
  const logoutButton = document.getElementById("logout-button");

  if (emailElement) {
    emailElement.textContent = user.email || "User";
  }

  if (avatarElement) {
    avatarElement.textContent = getInitial(user.email);
  }

  logoutButton?.addEventListener("click", async () => {
    logoutButton.disabled = true;

    const { error } = await supabaseClient.auth.signOut();

    if (error) {
      console.error("Logout failed:", error);
      logoutButton.disabled = false;
      return;
    }

    window.location.href = "index.html";
  });

  // Keep the UI in sync if the auth state changes elsewhere.
  supabaseClient.auth.onAuthStateChange((event, newSession) => {
    if (event === "SIGNED_OUT" || !newSession) {
      window.location.href = "index.html";
    }
  });
}


/* -----------------------------
   Helpers
----------------------------- */

function getInitial(email) {
  if (!email) return "U";

  return email
    .trim()
    .charAt(0)
    .toUpperCase();
}


function getFriendlyAuthError(error) {
  if (!error) {
    return "Something went wrong. Please try again.";
  }

  switch (error.message) {
    case "Invalid login credentials":
      return "Incorrect email or password.";

    case "Email not confirmed":
      return "Your account has not been confirmed.";

    default:
      return error.message || "Unable to sign in.";
  }
}

styles.css
:root {
  --bg: #f5f6f8;
  --surface: #ffffff;
  --border: #e5e7eb;
  --text: #111827;
  --muted: #6b7280;
  --primary: #111827;
  --primary-hover: #252b36;
  --danger: #b42318;
  --danger-bg: #fef3f2;
  --sidebar: #111827;
  --sidebar-text: #d1d5db;
  --sidebar-active: #ffffff;
  --radius: 12px;
  --shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
}

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  min-height: 100%;
  font-family:
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
  color: var(--text);
  background: var(--bg);
}

button,
input {
  font: inherit;
}


/* =========================
   Login
========================= */

.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background:
    radial-gradient(
      circle at top left,
      #e9edf5 0,
      transparent 35%
    ),
    var(--bg);
}

.auth-container {
  width: 100%;
  max-width: 420px;
}

.auth-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 40px;
  box-shadow: var(--shadow);
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 36px;
}

.brand h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
}

.brand-mark {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary);
  color: white;
  font-size: 15px;
  font-weight: 700;
}

.auth-header {
  margin-bottom: 28px;
}

.auth-header h2 {
  margin: 0 0 8px;
  font-size: 28px;
  letter-spacing: -0.5px;
}

.auth-header p {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 7px;
  font-size: 14px;
  font-weight: 600;
}

.label-row {
  display: flex;
  justify-content: space-between;
}

.form-group input {
  width: 100%;
  height: 46px;
  padding: 0 13px;
  border: 1px solid #d1d5db;
  border-radius: 9px;
  outline: none;
  color: var(--text);
  background: white;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}

.form-group input::placeholder {
  color: #9ca3af;
}

.form-group input:focus {
  border-color: #6b7280;
  box-shadow: 0 0 0 3px rgba(17, 24, 39, 0.08);
}

.password-input {
  position: relative;
}

.password-input input {
  padding-right: 65px;
}

.password-toggle {
  position: absolute;
  top: 50%;
  right: 10px;
  transform: translateY(-50%);
  border: 0;
  background: transparent;
  color: var(--muted);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.password-toggle:hover {
  color: var(--text);
}

.button {
  width: 100%;
  height: 46px;
  border: 0;
  border-radius: 9px;
  cursor: pointer;
  font-weight: 600;
  transition:
    background 0.15s,
    opacity 0.15s;
}

.button:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.button-primary {
  background: var(--primary);
  color: white;
}

.button-primary:hover:not(:disabled) {
  background: var(--primary-hover);
}

.form-error {
  margin: -4px 0 16px;
  padding: 11px 12px;
  border-radius: 8px;
  background: var(--danger-bg);
  color: var(--danger);
  font-size: 13px;
}

.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  margin-left: 5px;
  vertical-align: -3px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}


/* =========================
   App shell
========================= */

.app-shell {
  min-height: 100vh;
  display: flex;
}

.sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  width: 250px;
  display: flex;
  flex-direction: column;
  padding: 22px 14px;
  background: var(--sidebar);
  color: var(--sidebar-text);
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 10px;
  margin-bottom: 34px;
  color: white;
  font-size: 16px;
  font-weight: 700;
}

.sidebar-brand .brand-mark {
  width: 32px;
  height: 32px;
  background: white;
  color: var(--sidebar);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 10px 11px;
  border-radius: 8px;
  color: var(--sidebar-text);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
}

.nav-item:hover {
  color: white;
  background: rgba(255, 255, 255, 0.07);
}

.nav-item.active {
  color: var(--sidebar-active);
  background: rgba(255, 255, 255, 0.1);
}

.nav-icon {
  width: 20px;
  text-align: center;
  opacity: 0.8;
}

.sidebar-bottom {
  margin-top: auto;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 10px 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.avatar {
  flex: 0 0 auto;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #374151;
  color: white;
  font-size: 13px;
  font-weight: 700;
}

.user-info {
  min-width: 0;
  flex: 1;
}

.user-info span {
  display: block;
  overflow: hidden;
  color: #e5e7eb;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.logout-button {
  border: 0;
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
  font-size: 18px;
}

.logout-button:hover {
  color: white;
}

.main-content {
  width: calc(100% - 250px);
  min-height: 100vh;
  margin-left: 250px;
}

.topbar {
  min-height: 88px;
  display: flex;
  align-items: center;
  padding: 20px 40px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}

.topbar h1 {
  margin: 0 0 3px;
  font-size: 22px;
  letter-spacing: -0.3px;
}

.topbar p {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
}

.content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px;
}

.welcome-card {
  padding: 30px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  box-shadow: var(--shadow);
}

.eyebrow {
  display: block;
  margin-bottom: 8px;
  color: #6b7280;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.welcome-card h2 {
  margin: 0 0 10px;
  font-size: 24px;
}

.welcome-card p {
  max-width: 600px;
  margin: 0;
  color: var(--muted);
  line-height: 1.6;
  font-size: 14px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 20px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 22px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
}

.stat-label {
  color: var(--muted);
  font-size: 12px;
}

.stat-card strong {
  font-size: 18px;
}


/* =========================
   Mobile
========================= */

@media (max-width: 760px) {
  .sidebar {
    width: 64px;
    padding: 18px 8px;
  }

  .sidebar-brand {
    justify-content: center;
    padding: 0;
  }

  .sidebar-brand span,
  .nav-item:not(.active)::after,
  .user-info {
    display: none;
  }

  .nav-item {
    justify-content: center;
    padding: 12px 8px;
  }

  .sidebar-bottom {
    display: flex;
    justify-content: center;
  }

  .user-card {
    border-top: 0;
    padding: 0;
  }

  .logout-button {
    display: none;
  }

  .main-content {
    width: calc(100% - 64px);
    margin-left: 64px;
  }

  .topbar {
    padding: 20px;
  }

  .content {
    padding: 20px;
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .auth-card {
    padding: 28px 22px;
  }
}
