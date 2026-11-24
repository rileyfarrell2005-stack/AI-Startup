// ============================================================
// app.js — FixerUpper prototype interactions.
// Requests and replies are stored only in this browser. A real
// service needs a secure server, accounts, and a database.
// ============================================================
(function () {
  "use strict";

  const storage = {
    get: function (key, fallback) {
      try {
        const saved = localStorage.getItem(key);
        return saved === null ? fallback : JSON.parse(saved);
      } catch (error) {
        return fallback;
      }
    },
    set: function (key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (error) { /* storage unavailable */ }
    }
  };

  let requests = storage.get("fixerupperRequests", []);
  if (!Array.isArray(requests)) requests = [];

  document.title = STARTUP.name + " | Appliance repair, made easier";
  document.getElementById("brand-name").textContent = STARTUP.name;
  document.getElementById("tagline").textContent = STARTUP.tagline;
  document.getElementById("pitch").textContent = STARTUP.pitch;

  function showView() {
    const requested = (window.location.hash || "#home").slice(1);
    const views = document.querySelectorAll("[data-view]");
    const exists = Array.prototype.some.call(views, function (view) { return view.id === requested; });
    const current = exists ? requested : "home";
    views.forEach(function (view) { view.hidden = view.id !== current; });
    document.querySelectorAll("nav a").forEach(function (link) {
      if (link.getAttribute("href") === "#" + current) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", showView);

  const technicianGrid = document.getElementById("technician-grid");
  TECHNICIANS.forEach(function (technician) {
    const card = document.createElement("article");
    card.className = "technician-card";
    const avatar = document.createElement("div");
    avatar.className = "avatar " + technician.color;
    avatar.textContent = technician.initials;
    avatar.setAttribute("aria-hidden", "true");
    const details = document.createElement("div");
    details.className = "technician-details";
    const name = document.createElement("h2");
    name.textContent = technician.name;
    const specialty = document.createElement("p");
    specialty.className = "specialty";
    specialty.textContent = technician.specialty;
    const meta = document.createElement("p");
    meta.className = "technician-meta";
    meta.textContent = technician.experience + " · " + technician.area;
    const rating = document.createElement("span");
    rating.className = "rating";
    rating.textContent = "★ " + technician.rating + " sample rating";
    details.append(name, specialty, meta, rating);
    card.append(avatar, details);
    technicianGrid.appendChild(card);
  });

  const requestForm = document.getElementById("request-form");
  requestForm.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!requestForm.reportValidity()) return;
    const fields = new FormData(requestForm);
    const request = {
      id: "request-" + Date.now(),
      customer: String(fields.get("customer")).trim(),
      appliance: String(fields.get("appliance")),
      description: String(fields.get("description")).trim(),
      timing: String(fields.get("timing")),
      area: String(fields.get("area")).trim(),
      createdAt: new Date().toISOString(),
      replies: []
    };
    requests.unshift(request);
    storage.set("fixerupperRequests", requests);
    requestForm.reset();
    document.getElementById("request-status").textContent = "Request posted! It's now on the repair board in this browser.";
    renderRequests();
    window.location.hash = "requests";
  });

  function addText(parent, tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    element.textContent = text;
    parent.appendChild(element);
    return element;
  }

  function renderRequests() {
    const list = document.getElementById("request-list");
    list.replaceChildren();
    if (!requests.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      addText(empty, "div", "empty-icon", "✳");
      addText(empty, "h2", "", "No repair requests yet");
      addText(empty, "p", "", "Be the first to post a repair request. Technicians can reply here with a message and estimate.");
      const link = addText(empty, "a", "button", "Post a request →");
      link.href = "#request";
      list.appendChild(empty);
      return;
    }

    requests.forEach(function (request) {
      const card = document.createElement("article");
      card.className = "request-card";
      const top = document.createElement("div");
      top.className = "request-topline";
      addText(top, "span", "tag", request.appliance);
      addText(top, "span", "request-area", request.area + " · " + request.timing);
      card.appendChild(top);
      addText(card, "h2", "request-title", request.appliance + " repair needed");
      addText(card, "p", "request-description", request.description);
      addText(card, "p", "request-byline", "Posted by " + request.customer);

      const replies = document.createElement("div");
      replies.className = "replies";
      addText(replies, "h3", "replies-heading", "Technician replies (" + request.replies.length + ")");
      request.replies.forEach(function (reply) {
        const replyCard = document.createElement("div");
        replyCard.className = "reply-card";
        const replyHeader = document.createElement("div");
        replyHeader.className = "reply-header";
        addText(replyHeader, "strong", "", reply.technician);
        if (reply.estimate) addText(replyHeader, "span", "estimate", reply.estimate);
        replyCard.appendChild(replyHeader);
        addText(replyCard, "p", "", reply.message);
        replies.appendChild(replyCard);
      });

      const form = document.createElement("form");
      form.className = "reply-form";
      form.setAttribute("aria-label", "Reply to " + request.customer + "'s repair request");
      const formGrid = document.createElement("div");
      formGrid.className = "reply-fields";
      const nameLabel = document.createElement("label");
      nameLabel.textContent = "Technician name";
      const nameInput = document.createElement("input");
      nameInput.name = "technician";
      nameInput.required = true;
      nameInput.maxLength = 60;
      nameInput.placeholder = "Your first name";
      nameLabel.appendChild(nameInput);
      const estimateLabel = document.createElement("label");
      estimateLabel.textContent = "Estimate (optional)";
      const estimateInput = document.createElement("input");
      estimateInput.name = "estimate";
      estimateInput.maxLength = 40;
      estimateInput.placeholder = "e.g. $80–$120";
      estimateLabel.appendChild(estimateInput);
      const messageLabel = document.createElement("label");
      messageLabel.className = "reply-message-label";
      messageLabel.textContent = "Message";
      const messageInput = document.createElement("textarea");
      messageInput.name = "message";
      messageInput.required = true;
      messageInput.maxLength = 400;
      messageInput.rows = 2;
      messageInput.placeholder = "Ask a question or let them know how you can help…";
      messageLabel.appendChild(messageInput);
      formGrid.append(nameLabel, estimateLabel, messageLabel);
      const submit = document.createElement("button");
      submit.type = "submit";
      submit.className = "button secondary";
      submit.textContent = "Send reply";
      form.append(formGrid, submit);
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        if (!form.reportValidity()) return;
        const values = new FormData(form);
        const target = requests.find(function (item) { return item.id === request.id; });
        if (!target) return;
        target.replies.push({
          technician: String(values.get("technician")).trim(),
          estimate: String(values.get("estimate")).trim(),
          message: String(values.get("message")).trim()
        });
        storage.set("fixerupperRequests", requests);
        renderRequests();
      });
      replies.appendChild(form);
      card.appendChild(replies);
      list.appendChild(card);
    });
  }

  renderRequests();
  showView();
})();
