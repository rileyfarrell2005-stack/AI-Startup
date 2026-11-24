// Browser-side forms for the server-backed FixerUpper authentication prototype.
// The server owns passwords and sessions. This file never stores credentials.
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
  gate.innerHTML = "";

  function node(parent, tag, className, value) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = value;
    parent.appendChild(element);
    return element;
  }
  function updateGate() {
    gate.replaceChildren();
    node(gate, "p", "eyebrow", "FIXERUPPER ACCOUNT");
    node(gate, "h1", "", mode === "login" ? "Welcome back" : "Create your account");
    node(gate, "p", "", "Sign in to continue as a customer or independent technician.");

    const tabs = document.createElement("div");
    tabs.className = "auth-tabs";
    [ ["login", "Sign in"], ["register", "Create account"] ].forEach(function (item) {
      const button = node(tabs, "button", "", item[1]);
      button.type = "button";
      button.setAttribute("aria-selected", mode === item[0] ? "true" : "false");
      button.addEventListener("click", function () { mode = item[0]; updateGate(); });
    });
    gate.appendChild(tabs);

    const form = document.createElement("form");
    form.className = "auth-form";
    form.autocomplete = mode === "login" ? "on" : "off";
    const emailLabel = node(form, "label", "", "Email address");
    const email = document.createElement("input");
    email.type = "email"; email.name = "email"; email.required = true; email.maxLength = 254; email.autocomplete = "email";
    emailLabel.appendChild(email);
    if (mode === "register") {
      const roleLabel = node(form, "label", "", "I am joining as");
      const role = document.createElement("select"); role.name = "role"; role.required = true;
      [ ["customer", "Customer"], ["technician", "Technician"] ].forEach(function (choice) {
        const option = document.createElement("option"); option.value = choice[0]; option.textContent = choice[1]; role.appendChild(option);
      });
      roleLabel.appendChild(role);
    }
    const passwordLabel = node(form, "label", "", "Password");
    const password = document.createElement("input");
    password.type = "password"; password.name = "password"; password.required = true; password.minLength = mode === "register" ? 12 : 1; password.maxLength = 72; password.autocomplete = mode === "login" ? "current-password" : "new-password";
    passwordLabel.appendChild(password);
    if (mode === "register") node(form, "small", "auth-note", "Use at least 12 characters. Technician sign-up does not verify identity, qualifications, or licensing.");
    const error = node(form, "p", "auth-error", "");
    error.setAttribute("role", "alert");
    const submit = node(form, "button", "button", mode === "login" ? "Sign in" : "Create account");
    submit.type = "submit";
    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      error.textContent = "";
      submit.disabled = true;
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
      } finally { submit.disabled = false; }
    });
    gate.appendChild(form);
    node(gate, "p", "auth-note", "Prototype account data is stored by the server. Use a unique password; do not reuse your banking password.");
  }

  function addAccountBar(user) {
    const existing = document.querySelector(".auth-account-bar");
    if (existing) existing.remove();
    const bar = document.createElement("div");
    bar.className = "auth-account-bar";
    node(bar, "span", "", "Signed in as " + user.email + " · " + (user.role === "customer" ? "Customer" : "Technician"));
    const logout = node(bar, "button", "", "Sign out");
    logout.type = "button";
    logout.addEventListener("click", async function () {
      try {
        const response = await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin", headers: { "X-CSRF-Token": csrfToken } });
        if (!response.ok) throw new Error("Sign out failed. Try again.");
        currentUser = null;
        document.body.removeAttribute("data-account-role");
        document.body.classList.add("auth-locked");
        window.location.hash = "home";
        bar.remove();
        updateGate();
      } catch (error) { window.alert(error.message); }
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
    } catch (error) {
      const notice = document.createElement("p");
      notice.className = "auth-error-banner";
      notice.textContent = "Authentication server unavailable. Run this site through the FixerUpper Node server; static GitHub Pages cannot provide server authentication.";
      gate.prepend(notice);
    }
  }
  start();
})();
