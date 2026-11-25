// Account activity display for the FixerUpper prototype.
// This page does not retain actual sign-in audit data; past records below are examples.
(function () {
  "use strict";

  const DEMO_KEY_PREFIX = "fixerupperDemoLoginActivity:";
  const panelId = "account-activity-panel";
  const settings = document.getElementById("settings");
  if (!settings) return;

  function create(parent, tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    parent.appendChild(element);
    return element;
  }
  function getAccount() {
    if (!document.body.dataset.accountRole) return null;
    const summary = document.querySelector(".auth-account-summary");
    const text = summary ? summary.textContent : document.querySelector(".auth-account-bar")?.textContent || "";
    const match = text.match(/Signed in as\s+([^·]+)/);
    return { email: match ? match[1].trim() : "Current account", role: document.body.dataset.accountRole };
  }
  function browserLabel() {
    const ua = navigator.userAgent || "";
    if (/Edg\//.test(ua)) return "Microsoft Edge";
    if (/Firefox\//.test(ua)) return "Firefox";
    if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) return "Chrome";
    if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return "Safari";
    return "This browser";
  }
  function demoHistory(email) {
    const key = DEMO_KEY_PREFIX + encodeURIComponent(email.toLowerCase());
    try {
      const existing = JSON.parse(localStorage.getItem(key) || "null");
      if (Array.isArray(existing) && existing.length) return existing;
      const now = Date.now();
      const examples = [
        { timestamp: new Date(now - 24 * 60 * 60 * 1000).toISOString(), device: "Desktop browser (example)", result: "Successful sign-in · simulated" },
        { timestamp: new Date(now - 4 * 24 * 60 * 60 * 1000).toISOString(), device: "Mobile browser (example)", result: "Successful sign-in · simulated" }
      ];
      localStorage.setItem(key, JSON.stringify(examples));
      return examples;
    } catch (error) {
      return [
        { timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), device: "Desktop browser (example)", result: "Successful sign-in · simulated" },
        { timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), device: "Mobile browser (example)", result: "Successful sign-in · simulated" }
      ];
    }
  }
  function formatDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Example date" : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  }
  function render() {
    const account = getAccount();
    const old = document.getElementById(panelId);
    if (!account) {
      if (old) old.remove();
      return;
    }
    if (old) return;

    const panel = document.createElement("section");
    panel.id = panelId;
    panel.className = "account-activity-panel";
    panel.setAttribute("aria-labelledby", "account-activity-heading");
    create(panel, "h2", "", "Recent login activity & devices");
    create(panel, "p", "activity-disclaimer", "Prototype display: past activity below is simulated example data, not a verified security log. Session/device details are limited to this browser.");

    const current = create(panel, "article", "activity-entry current-session");
    create(current, "h3", "", "Current session · Active");
    create(current, "p", "", "Device: " + browserLabel() + " on this device");
    create(current, "p", "", "Account: " + account.email + " · " + (account.role === "technician" ? "Technician" : "Customer"));
    create(current, "p", "", "Session status: signed in. The session cookie is HTTP-only; its identifier is not shown.");

    const history = create(panel, "div", "activity-history");
    create(history, "h3", "", "Example recent activity");
    demoHistory(account.email).forEach(function (item) {
      const entry = create(history, "article", "activity-entry simulated-entry");
      create(entry, "p", "activity-date", formatDate(item.timestamp));
      create(entry, "p", "", item.device);
      create(entry, "p", "", item.result);
    });
    const note = create(panel, "p", "activity-note", "Other devices and actual login history are not tracked by this prototype. These example records are stored in local browser storage and can be cleared here.");
    const clear = create(panel, "button", "button secondary", "Clear simulated activity");
    clear.type = "button";
    clear.addEventListener("click", function () {
      try { localStorage.removeItem(DEMO_KEY_PREFIX + encodeURIComponent(account.email.toLowerCase())); } catch (error) { /* storage may be unavailable */ }
      panel.remove();
      render();
    });

    const firstSettingsList = settings.querySelector(".settings-list");
    if (firstSettingsList) firstSettingsList.insertAdjacentElement("afterend", panel);
    else settings.appendChild(panel);
    void note;
  }

  const observer = new MutationObserver(render);
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-account-role"] });
  window.addEventListener("hashchange", render);
  render();
})();
