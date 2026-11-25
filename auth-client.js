// Browser-side forms for the server-backed FixerUpper authentication prototype.
// Passwords are sent only to the server over the same origin; never stored locally.
(function () {
  "use strict";

  const frame = document.querySelector(".app-frame");
  if (!frame) return;

  let csrfToken = "";
  let currentUser = null;
  let mode = "login";
  const gate = document.createElement("section");
  gate.className = "auth-gate";
  gate.setAttribute("aria-labelledby", "auth-title");

  function node(parent, tag, className, value) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (value !== undefined) element.textContent = value;
    parent.appendChild(element);
    return element;
  }

  function securityMessage() {
    if (window.location.protocol === "https:") {
      return "Secure connection (HTTPS). Passwords are verified by the server and are not saved by this page.";
    }
    return "Development connection only. Do not enter a real or reused password unless this site is using HTTPS.";
  }

  function addPasswordField(form, options) {
    const label = node(form, "label", "auth-field", options.label);
    const row = node(label, "span", "password-control");
    const input = document.createElement("input");
    input.type = "password";
    input.name = options.name;
    input.required = true;
    input.maxLength = 72;
    input.autocomplete = options.autocomplete;
    input.setAttribute("aria-describedby", options.describedBy || "");
    if (options.minLength) input.minLength = options.minLength;
    row.appendChild(input);

    const toggle = node(row, "button", "password-toggle", "Show");
    toggle.type = "button";
    toggle.setAttribute("aria-label", "Show " + options.label.toLowerCase());
    toggle.setAttribute("aria-pressed", "false");
    toggle.addEventListener("click", function () {
      const reveal = input.type === "password";
      input.type = reveal ? "text" : "password";
      toggle.textContent = reveal ? "Hide" : "Show";
      toggle.setAttribute("aria-pressed", String(reveal));
      toggle.setAttribute("aria-label", (reveal ? "Hide " : "Show ") + options.label.toLowerCase());
      input.focus();
    });
    return input;
  }

  function passwordScore(value) {
    let score = 0;
    if (value.length >= 12) score += 1;
    if (value.length >= 16) score += 1;
    if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
    if (/[0-9]/.test(value) && /[^A-Za-z0-9]/.test(value)) score += 1;
    return score;
  }

  function updateGate() {
    gate.replaceChildren();
    node(gate, "p", "eyebrow", "FIXERUPPER ACCOUNT");
    node(gate, "h1", "", mode === "login" ? "Welcome back" : "Create your account").id = "auth-title";
    node(gate, "p", "auth-intro", "Sign in to continue as a customer or independent technician.");

    const connection = node(gate, "p", "security-status", securityMessage());
    connection.setAttribute("role", "status");
    connection.setAttribute("aria-live", "polite");
    if (window.location.protocol !== "https:") connection.classList.add("security-warning");

    const tabs = node(gate, "div", "auth-tabs");
    tabs.setAttribute("role", "tablist");
    [["login", "Sign in"], ["register", "Create account"]].forEach(function (item) {
      const button = node(tabs, "button", "", item[1]);
      button.type = "button";
      button.setAttribute("role", "tab");
      button.setAttribute("aria-selected", mode === item[0] ? "true" : "false");
      button.addEventListener("click", function () {
        if (mode !== item[0]) { mode = item[0]; updateGate(); }
      });
    });

    const form = node(gate, "form", "auth-form");
    form.autocomplete = "on";
    const emailLabel = node(form, "label", "auth-field", "Email address");
    const email = document.createElement("input");
    email.type = "email";
    email.name = "email";
    email.required = true;
    email.maxLength = 254;
    email.autocomplete = "username";
    email.inputMode = "email";
    email.autocapitalize = "none";
    emailLabel.appendChild(email);

    if (mode === "register") {
      const roleLabel = node(form, "label", "auth-field", "I am joining as");
      const role = document.createElement("select");
      role.name = "role";
      role.required = true;
      [["customer", "Customer"], ["technician", "Technician"]].forEach(function (choice) {
        const option = document.createElement("option");
        option.value = choice[0];
        option.textContent = choice[1];
        role.appendChild(option);
      });
      roleLabel.appendChild(role);
    }

    const passwordId = "auth-password";
    const password = addPasswordField(form, {
      label: "Password",
      name: "password",
      autocomplete: mode === "register" ? "new-password" : "current-password",
      minLength: mode === "register" ? 12 : 1,
      describedBy: mode === "register" ? "password-hint password-strength" : "password-hint"
    });
    password.id = passwordId;

    let confirmation = null;
    let strengthText = null;
    if (mode === "register") {
      node(form, "small", "auth-note", "Use at least 12 characters. Longer, less predictable passwords are safer.").id = "password-hint";
      const meterWrap = node(form, "div", "password-strength");
      meterWrap.id = "password-strength";
      const meterLabel = node(meterWrap, "span", "strength-label", "Password strength: enter a password");
      const meter = node(meterWrap, "span", "strength-meter");
      meter.setAttribute("role", "meter");
      meter.setAttribute("aria-label", "Password strength");
      meter.setAttribute("aria-valuemin", "0");
      meter.setAttribute("aria-valuemax", "4");
      meter.setAttribute("aria-valuenow", "0");
      const fill = node(meter, "span", "strength-fill");
      strengthText = meterLabel;

      confirmation = addPasswordField(form, {
        label: "Confirm password",
        name: "confirmPassword",
        autocomplete: "new-password",
        minLength: 12,
        describedBy: "password-match"
      });
      const match = node(form, "small", "password-match auth-note", "Re-enter the same password to confirm it.");
      match.id = "password-match";
      const savedPasswordInfo = node(form, "p", "auth-note password-manager-note", "Your browser may offer to save your password after sign-up if its password manager is enabled. FixerUpper never saves your password on this device.");

      function refreshPasswordFeedback() {
        const score = passwordScore(password.value);
        const labels = ["Enter a password", "Weak", "Fair", "Good", "Strong"];
        meter.setAttribute("aria-valuenow", String(score));
        fill.style.width = (score * 25) + "%";
        meterWrap.dataset.strength = String(score);
        strengthText.textContent = "Password strength: " + labels[score] + (password.value.length < 12 && password.value ? " — use at least 12 characters" : "");

        const matches = confirmation.value.length > 0 && confirmation.value === password.value;
        confirmation.setCustomValidity(confirmation.value && !matches ? "Passwords do not match." : "");
        match.textContent = !confirmation.value ? "Re-enter the same password to confirm it." : matches ? "Passwords match." : "Passwords do not match yet.";
        match.classList.toggle("match-success", matches);
        match.classList.toggle("match-error", Boolean(confirmation.value) && !matches);
      }
      password.addEventListener("input", refreshPasswordFeedback);
      confirmation.addEventListener("input", refreshPasswordFeedback);
      // Keep references for a straightforward, accessible UI without retaining credentials.
      void savedPasswordInfo;
    } else {
      node(form, "small", "auth-note", "Use the password you chose when creating your account.").id = "password-hint";
    }

    const error = node(form, "p", "auth-error", "");
    error.setAttribute("role", "alert");
    const submit = node(form, "button", "button", mode === "login" ? "Sign in" : "Create account");
    submit.type = "submit";

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      error.textContent = "";
      if (mode === "register" && password.value !== confirmation.value) {
        confirmation.setCustomValidity("Passwords do not match.");
      }
      if (!form.reportValidity()) return;
      submit.disabled = true;
      submit.textContent = mode === "login" ? "Signing in…" : "Creating account…";
      try {
        const body = { email: email.value.trim(), password: password.value };
        if (mode === "register") body.role = form.elements.role.value;
        const response = await fetch("/api/auth/" + (mode === "login" ? "login" : "register"), {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
          body: JSON.stringify(body)
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Unable to authenticate.");
        csrfToken = result.csrfToken || csrfToken;
        activate(result.user);
      } catch (problem) {
        error.textContent = problem.message || "Could not reach the authentication server. Make sure the Node server is running.";
      } finally {
        submit.disabled = false;
        submit.textContent = mode === "login" ? "Sign in" : "Create account";
      }
    });
    node(gate, "p", "auth-note auth-footer-note", "Passwords are sent to the authentication server and never stored in browser localStorage. Technician sign-up does not verify identity, qualifications, or licensing.");
  }

  function addAccountBar(user) {
    const existing = document.querySelector(".auth-account-bar");
    if (existing) existing.remove();
    const bar = document.createElement("div");
    bar.className = "auth-account-bar";
    node(bar, "span", "auth-account-summary", "Signed in as " + user.email + " · " + (user.role === "customer" ? "Customer" : "Technician"));
    const security = node(bar, "span", "account-security", window.location.protocol === "https:" ? "Account security: HTTPS connection" : "Account security: development HTTP connection");
    security.setAttribute("role", "status");
    if (window.location.protocol !== "https:") security.classList.add("security-warning");
    const logout = node(bar, "button", "", "Sign out");
    logout.type = "button";
    logout.addEventListener("click", async function () {
      logout.disabled = true;
      try {
        const response = await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin", headers: { "X-CSRF-Token": csrfToken } });
        if (!response.ok) throw new Error("Sign out failed. Try again.");
        currentUser = null;
        document.body.removeAttribute("data-account-role");
        document.body.classList.add("auth-locked");
        window.location.hash = "home";
        bar.remove();
        mode = "login";
        updateGate();
        frame.insertBefore(gate, frame.querySelector("main"));
      } catch (problem) {
        window.alert(problem.message);
        logout.disabled = false;
      }
    });
    frame.insertBefore(bar, frame.querySelector("main"));
  }

  function activate(user) {
    currentUser = user;
    document.body.dataset.accountRole = user.role;
    document.body.classList.remove("auth-locked");
    gate.remove();
    addAccountBar(user);
    const desired = user.role === "technician" ? "provider" : "services";
    if (window.location.hash === "" || window.location.hash === "#home") window.location.hash = desired;
    else enforceRoleRoute();
  }

  function enforceRoleRoute() {
    if (!currentUser) return;
    const requested = (window.location.hash || "#home").slice(1);
    const customerOnly = ["services", "profile", "booking"];
    if (currentUser.role === "customer" && requested === "provider") window.location.hash = "services";
    if (currentUser.role === "technician" && customerOnly.indexOf(requested) !== -1) window.location.hash = "provider";
  }
  window.addEventListener("hashchange", enforceRoleRoute);

  async function start() {
    frame.insertBefore(gate, frame.querySelector("main"));
    updateGate();
    try {
      const tokenResponse = await fetch("/api/auth/csrf", { credentials: "same-origin", cache: "no-store" });
      if (!tokenResponse.ok) throw new Error("Could not initialize a secure session.");
      csrfToken = (await tokenResponse.json()).csrfToken;
      const response = await fetch("/api/auth/me", { credentials: "same-origin", cache: "no-store" });
      if (response.ok) {
        const data = await response.json();
        activate(data.user);
      }
    } catch (problem) {
      const notice = document.createElement("p");
      notice.className = "auth-error-banner";
      notice.textContent = "Authentication server unavailable. Run this site through the FixerUpper Node server; static GitHub Pages cannot provide server authentication.";
      gate.prepend(notice);
    }
  }

  start();
})();
