// Browser-side forms for FixerUpper's server authentication prototype.
// Passwords are sent only to the same-origin server and never saved locally.
// Demo 2-step verification is intentionally simulated and is not real MFA.
(function () {
  "use strict";

  const frame = document.querySelector(".app-frame");
  if (!frame) return;

  let csrfToken = "";
  let currentUser = null;
  let mode = "login";
  let verificationEmail = "";
  let gateMessage = "";
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
    return window.location.protocol === "https:"
      ? "Secure connection (HTTPS). Passwords are verified by the server and are not saved by this page."
      : "Development connection only. Do not enter a real or reused password unless this site is using HTTPS.";
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
    const title = mode === "login" ? "Welcome back" : mode === "register" ? "Create your account" : "2-factor-verification";
    node(gate, "p", "eyebrow", "FIXERUPPER ACCOUNT");
    node(gate, "h1", "", title).id = "auth-title";
    node(gate, "p", "auth-intro", mode === "verification"
      ? "Enter the one-time demo code to finish signing in."
      : "Sign in to continue as a customer or independent technician.");

    const connection = node(gate, "p", "security-status", securityMessage());
    connection.setAttribute("role", "status");
    connection.setAttribute("aria-live", "polite");
    if (window.location.protocol !== "https:") connection.classList.add("security-warning");

    if (mode === "login" || mode === "register") {
      const tabs = node(gate, "div", "auth-tabs");
      tabs.setAttribute("role", "tablist");
      [["login", "Sign in"], ["register", "Create account"]].forEach(function (item) {
        const button = node(tabs, "button", "", item[1]);
        button.type = "button";
        button.setAttribute("role", "tab");
        button.setAttribute("aria-selected", mode === item[0] ? "true" : "false");
        button.addEventListener("click", function () {
          if (mode !== item[0]) { mode = item[0]; gateMessage = ""; updateGate(); }
        });
      });
    }

    if (gateMessage) {
      const message = node(gate, "p", "demo-code-notice", gateMessage);
      message.setAttribute("role", "status");
      message.setAttribute("aria-live", "polite");
    }

    const form = node(gate, "form", "auth-form");
    form.autocomplete = "on";
    if (mode === "verification") {
      const note = node(form, "p", "demo-warning", "Simulation only: this code is displayed here instead of being sent by SMS or email. This does not provide real two-factor security.");
      note.setAttribute("role", "note");
      const codeLabel = node(form, "label", "auth-field", "One-time verification code");
      const code = document.createElement("input");
      code.name = "verificationCode";
      code.type = "text";
      code.required = true;
      code.inputMode = "numeric";
      code.autocomplete = "one-time-code";
      code.pattern = "[0-9]{6}";
      code.maxLength = 6;
      code.placeholder = "6-digit code";
      code.setAttribute("aria-describedby", "verification-help");
      codeLabel.appendChild(code);
      node(form, "small", "auth-note", "The demo code expires after five minutes.").id = "verification-help";
    } else {
      const emailLabel = node(form, "label", "auth-field", "Email address");
      const email = document.createElement("input");
      email.type = "email";
      email.name = "email";
      email.required = true;
      email.maxLength = 254;
      email.autocomplete = "username";
      email.inputMode = "email";
      email.autocapitalize = "none";
      email.value = mode === "login" ? verificationEmail : "";
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

      const password = addPasswordField(form, {
        label: "Password",
        name: "password",
        autocomplete: mode === "register" ? "new-password" : "current-password",
        minLength: mode === "register" ? 12 : 1,
        describedBy: mode === "register" ? "password-hint password-strength" : "password-hint"
      });
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
        const confirmation = addPasswordField(form, {
          label: "Confirm password",
          name: "confirmPassword",
          autocomplete: "new-password",
          minLength: 12,
          describedBy: "password-match"
        });
        const match = node(form, "small", "password-match auth-note", "Re-enter the same password to confirm it.");
        match.id = "password-match";
        node(form, "p", "auth-note password-manager-note", "Your browser may offer to save your password after sign-up if its password manager is enabled. FixerUpper never saves your password on this device.");
        function refreshPasswordFeedback() {
          const score = passwordScore(password.value);
          const labels = ["Enter a password", "Weak", "Fair", "Good", "Strong"];
          meter.setAttribute("aria-valuenow", String(score));
          fill.style.width = (score * 25) + "%";
          meterWrap.dataset.strength = String(score);
          meterLabel.textContent = "Password strength: " + labels[score] + (password.value.length < 12 && password.value ? " — use at least 12 characters" : "");
          const matches = confirmation.value.length > 0 && confirmation.value === password.value;
          confirmation.setCustomValidity(confirmation.value && !matches ? "Passwords do not match." : "");
          match.textContent = !confirmation.value ? "Re-enter the same password to confirm it." : matches ? "Passwords match." : "Passwords do not match yet.";
          match.classList.toggle("match-success", matches);
          match.classList.toggle("match-error", Boolean(confirmation.value) && !matches);
        }
        password.addEventListener("input", refreshPasswordFeedback);
        confirmation.addEventListener("input", refreshPasswordFeedback);
      } else {
        node(form, "small", "auth-note", "Use the password you chose when creating your account.").id = "password-hint";
      }
    }

    const error = node(form, "p", "auth-error", "");
    error.setAttribute("role", "alert");
    const submit = node(form, "button", "button", mode === "login" ? "Sign in" : mode === "register" ? "Create account" : "Verify and continue");
    submit.type = "submit";
    if (mode === "verification") {
      const back = node(form, "button", "auth-back-button", "Cancel and return to sign in");
      back.type = "button";
      back.addEventListener("click", function () {
        mode = "login";
        gateMessage = "";
        verificationEmail = "";
        updateGate();
      });
    }

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      error.textContent = "";
      const submitMode = mode;
      if (submitMode === "register") {
        const passwordInput = form.elements.password;
        const confirmationInput = form.elements.confirmPassword;
        if (passwordInput.value !== confirmationInput.value) confirmationInput.setCustomValidity("Passwords do not match.");
      }
      if (!form.reportValidity()) return;
      submit.disabled = true;
      submit.textContent = submitMode === "login" ? "Signing in…" : submitMode === "register" ? "Creating account…" : "Verifying…";
      try {
        let response;
        if (submitMode === "verification") {
          response = await fetch("/api/auth/verify-demo-2fa", {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
            body: JSON.stringify({ code: form.elements.verificationCode.value.trim() })
          });
        } else {
          const body = { email: form.elements.email.value.trim(), password: form.elements.password.value };
          if (submitMode === "register") body.role = form.elements.role.value;
          response = await fetch("/api/auth/" + (submitMode === "login" ? "login" : "register"), {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
            body: JSON.stringify(body)
          });
        }
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Unable to authenticate.");
        csrfToken = result.csrfToken || csrfToken;
        if (submitMode === "login" && result.requiresDemoVerification) {
          verificationEmail = form.elements.email.value.trim();
          mode = "verification";
          gateMessage = "Your simulated verification code is " + result.demoVerificationCode + ". Enter it below to finish sign-in.";
          updateGate();
          const codeInput = gate.querySelector('[name="verificationCode"]');
          if (codeInput) codeInput.focus();
        } else {
          gateMessage = "";
          activate(result.user);
        }
      } catch (problem) {
        error.textContent = problem.message || "Could not reach the authentication server. Make sure the Node server is running.";
      } finally {
        submit.disabled = false;
        submit.textContent = submitMode === "login" ? "Sign in" : submitMode === "register" ? "Create account" : "Verify and continue";
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
    verificationEmail = "";
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
      if (response.ok) activate((await response.json()).user);
    } catch (problem) {
      const notice = document.createElement("p");
      notice.className = "auth-error-banner";
      notice.textContent = "Authentication server unavailable. Run this site through the FixerUpper Node server; static GitHub Pages cannot provide server authentication.";
      gate.prepend(notice);
    }
  }
  start();
})();
