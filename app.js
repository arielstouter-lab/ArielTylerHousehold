const { createClient } = window.supabase;

const supabaseClient = createClient(
  window.APP_CONFIG.supabaseUrl,
  window.APP_CONFIG.supabaseKey
);
window.supabaseClient = supabaseClient;

document.addEventListener("DOMContentLoaded", async () => {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  try {
    let {
      data: { session }
    } = await supabaseClient.auth.getSession();

    if (!session) {
      session = await bootstrapAuth();
    }

    const PUBLIC_PAGES = ["index.html", ""];

    if (PUBLIC_PAGES.includes(currentPage)) {
      if (session) {
        window.location.href = "app.html";
        return;
      }
      setupLogin();
      return;
    }

    if (!session) {
      window.location.href = "index.html";
      return;
    }
    setupApp(session);

  } catch (err) {
    console.error("Auth bootstrap failed:", err);
    if (currentPage !== "index.html" && currentPage !== "") {
      window.location.href = "index.html";
    } else {
      setupLogin();
    }
  }
});

/* -----------------------------
   Login
----------------------------- */

async function bootstrapAuth() {
  const { data: { session } } = await supabaseClient.auth.getSession()
  if (session) return session

  const { data, error } = await supabaseClient.functions.invoke('ip-login')
  if (error || !data?.token_hash) return null

  const { data: verified } = await supabaseClient.auth.verifyOtp({
    type: 'magiclink',
    token_hash: data.token_hash,
  })
  return verified?.session ?? null
}

function setupLogin() {
  const form = document.getElementById("login-form");
  const usernameInput = document.getElementById("username");
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

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
      showLoginError("Please enter your email and password.");
      return;
    }

    button.disabled = true;
    buttonText.textContent = "Signing in...";
    spinner.hidden = false;

    // Look up the email associated with the username
    const {
      data: email,
      error: lookupError
    } = await supabaseClient.rpc("get_email_for_username", {
      input_username: username
    });

    if (lookupError || !email) {
      showLoginError("Invalid username or password.");

      button.disabled = false;
      buttonText.textContent = "Sign in";
      spinner.hidden = true;

      return;
    }

    // Authenticate through Supabase Auth
    const { error: loginError } =
      await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

    if (loginError) {
      showLoginError("Invalid username or password.");

      button.disabled = false;
      buttonText.textContent = "Sign in";
      spinner.hidden = true;

      return;
    }

    window.location.href = "app.html";

      function showLoginError(message) {
        errorElement.textContent = message;
        errorElement.hidden = false;
      }
    });
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
  document.dispatchEvent(new CustomEvent('app:ready', { detail: { session } }));
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
