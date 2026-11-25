// Local notification preferences and status alerts for the FixerUpper demo.
// This client-only prototype can notify this browser while the page is open;
// it cannot send alerts to other devices or real users without a backend.
(function () {
  "use strict";

  const JOBS_KEY = "fixerupperDemoJobs";
  const PREFS_KEY = "fixerupperNotificationPreferences";
  const selectors = [
    { role: "customer", label: "Customer notifications" },
    { role: "technician", label: "Technician notifications" }
  ];
  const settings = document.getElementById("settings");
  if (!settings) return;

  function readJSON(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "null");
      return value == null ? fallback : value;
    } catch (error) { return fallback; }
  }
  function readPreferences() {
    const stored = readJSON(PREFS_KEY, {});
    return {
      customer: stored.customer === true,
      technician: stored.technician === true
    };
  }
  function savePreferences(preferences) {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(preferences));
      return true;
    } catch (error) { return false; }
  }

  const panel = document.createElement("section");
  panel.className = "settings-list notification-settings";
  panel.setAttribute("aria-labelledby", "notification-heading");
  const heading = document.createElement("h2");
  heading.id = "notification-heading";
  heading.textContent = "Notification preferences";
  panel.appendChild(heading);
  const description = document.createElement("p");
  description.className = "prototype-note";
  description.textContent = "Choose which app role should receive browser alerts on this device. Allowing alerts may ask your browser for permission.";
  panel.appendChild(description);

  const preferences = readPreferences();
  const controls = {};
  selectors.forEach(function (item) {
    const label = document.createElement("label");
    label.className = "notification-option";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = preferences[item.role];
    checkbox.setAttribute("aria-label", item.label);
    const text = document.createElement("span");
    text.textContent = item.label;
    label.append(checkbox, text);
    panel.appendChild(label);
    controls[item.role] = checkbox;
  });

  const status = document.createElement("p");
  status.className = "form-status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  panel.appendChild(status);
  const firstDetails = settings.querySelector(".settings-list");
  if (firstDetails) firstDetails.insertAdjacentElement("afterend", panel);
  else settings.appendChild(panel);

  function permissionMessage() {
    if (!("Notification" in window)) return "Browser notifications are unavailable here. Keep this page open to use app updates.";
    if (Notification.permission === "denied") return "Notifications are blocked in browser settings. Change site permissions to allow them.";
    if (Notification.permission === "granted") return "Browser notifications are allowed on this device.";
    return "Notifications are off until you enable a role and grant browser permission.";
  }
  status.textContent = permissionMessage();

  selectors.forEach(function (item) {
    controls[item.role].addEventListener("change", function () {
      const next = readPreferences();
      if (controls[item.role].checked) {
        if (!("Notification" in window)) {
          controls[item.role].checked = false;
          next[item.role] = false;
          status.textContent = permissionMessage();
          return;
        }
        if (Notification.permission === "default") {
          Notification.requestPermission().then(function (permission) {
            next[item.role] = permission === "granted" && controls[item.role].checked;
            controls[item.role].checked = next[item.role];
            if (!savePreferences(next)) status.textContent = "Could not save your notification preference in this browser.";
            else status.textContent = permissionMessage();
          }).catch(function () {
            controls[item.role].checked = false;
            next[item.role] = false;
            savePreferences(next);
            status.textContent = "Browser permission could not be requested. Check your site settings.";
          });
          return;
        }
        if (Notification.permission !== "granted") {
          controls[item.role].checked = false;
          next[item.role] = false;
          status.textContent = permissionMessage();
          return;
        }
        next[item.role] = true;
      } else next[item.role] = false;

      if (!savePreferences(next)) status.textContent = "Could not save your notification preference in this browser.";
      else status.textContent = permissionMessage();
    });
  });

  function sendNotification(role, title, body, destination) {
    const current = readPreferences();
    if (!current[role] || !("Notification" in window) || Notification.permission !== "granted") return;
    try {
      const notification = new Notification(title, { body: body, tag: "fixerupper-" + role });
      notification.onclick = function () {
        window.focus();
        if (destination) window.location.hash = destination;
        notification.close();
      };
    } catch (error) { /* Browser may disallow notifications in this context. */ }
  }

  function readJobs() {
    const jobs = readJSON(JOBS_KEY, []);
    return Array.isArray(jobs) ? jobs : [];
  }
  function eventForChange(previous, current) {
    if (!previous) {
      return { role: "technician", title: "New repair request", body: current.appliance + " request from " + current.customer + ".", destination: "provider" };
    }
    if (previous.status === current.status) {
      if (!previous.rating && current.rating) {
        return { role: "technician", title: "Customer left a rating", body: "A customer rated the completed repair.", destination: "provider" };
      }
      return null;
    }
    if (current.status === "quote-sent") {
      return { role: "customer", title: "Quote received", body: "A technician sent a quote for your " + current.appliance + " request.", destination: "services" };
    }
    if (current.status === "accepted") {
      return { role: "technician", title: "Quote accepted", body: current.customer + " accepted your quote.", destination: "provider" };
    }
    if (current.status === "declined") {
      return { role: "technician", title: "Quote declined", body: current.customer + " declined your quote.", destination: "provider" };
    }
    if (current.status === "completed") {
      return { role: "technician", title: "Repair marked complete", body: "The customer marked the repair complete.", destination: "provider" };
    }
    return null;
  }

  // Seed the snapshot before polling so existing demo requests do not create alerts.
  let previousJobs = readJobs();
  function checkForUpdates() {
    const currentJobs = readJobs();
    const previousById = new Map(previousJobs.map(function (job) { return [job.id, job]; }));
    currentJobs.forEach(function (job) {
      const event = eventForChange(previousById.get(job.id), job);
      if (event) sendNotification(event.role, event.title, event.body, event.destination);
    });
    previousJobs = currentJobs;
  }
  window.setInterval(checkForUpdates, 1200);
  window.addEventListener("storage", function (event) {
    if (event.key === JOBS_KEY) checkForUpdates();
  });
})();
