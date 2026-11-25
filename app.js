// FixerUpper demo interactions. This front-end prototype uses localStorage;
// it does not provide real accounts, messaging, payments, or cross-device sync.
(function () {
  "use strict";

  const STORE_KEY = "fixerupperDemoJobs";
  const storage = {
    get: function (key, fallback) {
      try { const value = localStorage.getItem(key); return value === null ? fallback : JSON.parse(value); }
      catch (error) { return fallback; }
    },
    set: function (key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (error) { /* storage unavailable */ }
    }
  };
  let jobs = storage.get(STORE_KEY, []);
  if (!Array.isArray(jobs)) jobs = [];
  let selectedTechnician = null;

  function saveJobs() { storage.set(STORE_KEY, jobs); }
  function escapeText(value) { return String(value == null ? "" : value); }
  function addText(parent, tag, className, value) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    node.textContent = escapeText(value);
    parent.appendChild(node);
    return node;
  }
  function findTechnician(id) { return TECHNICIANS.find(function (person) { return person.id === id; }); }
  function localDateString(date) {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }
  function getAvailableDates(person) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return (person.availableDateOffsets || []).filter(function (offset) {
      return Number.isInteger(offset) && offset >= 0 && offset <= 30;
    }).map(function (offset) {
      const date = new Date(today);
      date.setDate(date.getDate() + offset);
      return localDateString(date);
    });
  }
  function formatPreferredDate(dateValue) {
    if (!dateValue) return "Date not selected";
    const date = new Date(dateValue + "T00:00:00");
    if (Number.isNaN(date.getTime())) return dateValue;
    return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }
  function populateAvailableDates(person) {
    const dateSelect = document.getElementById("preferred-date");
    dateSelect.replaceChildren();
    const prompt = document.createElement("option");
    prompt.value = "";
    prompt.textContent = "Choose an available date";
    dateSelect.appendChild(prompt);
    getAvailableDates(person).forEach(function (dateValue) {
      const option = document.createElement("option");
      option.value = dateValue;
      option.textContent = formatPreferredDate(dateValue);
      dateSelect.appendChild(option);
    });
    if (dateSelect.options.length === 1) {
      const unavailable = document.createElement("option");
      unavailable.disabled = true;
      unavailable.textContent = "No dates listed — contact the technician";
      dateSelect.appendChild(unavailable);
    }
  }

  function showView() {
    const requested = (window.location.hash || "#home").slice(1);
    const views = document.querySelectorAll("[data-view]");
    const allowed = Array.prototype.some.call(views, function (view) { return view.id === requested; });
    const current = allowed ? requested : "home";
    views.forEach(function (view) { view.hidden = view.id !== current; });
    document.querySelectorAll(".bottom-nav a").forEach(function (tab) {
      if (tab.dataset.tab === current || (current === "profile" || current === "booking") && tab.dataset.tab === "services") tab.setAttribute("aria-current", "page");
      else tab.removeAttribute("aria-current");
    });
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", showView);

  function technicianMatches(person) {
    const search = document.getElementById("provider-search").value.trim().toLowerCase();
    const specialty = document.getElementById("specialty-filter").value;
    const availability = document.getElementById("availability-filter").value;
    const searchable = (person.name + " " + person.area + " " + person.specialty).toLowerCase();
    const matchesSearch = !search || searchable.indexOf(search) !== -1;
    const matchesSpecialty = !specialty || person.appliances.indexOf(specialty) !== -1;
    const matchesAvailability = !availability || (availability === "today" ? person.arrivalHours <= 8 : availability === "tomorrow" ? person.arrivalHours <= 24 : person.arrivalHours <= 168);
    return matchesSearch && matchesSpecialty && matchesAvailability;
  }

  function renderTechnicians() {
    const grid = document.getElementById("provider-grid");
    const sort = document.getElementById("sort-filter").value;
    const filtered = TECHNICIANS.filter(technicianMatches).slice();
    filtered.sort(function (a, b) { return sort === "rating" ? Number(b.rating) - Number(a.rating) : a.arrivalHours - b.arrivalHours; });
    grid.replaceChildren();
    document.getElementById("provider-results-count").textContent = filtered.length + (filtered.length === 1 ? " technician available" : " technicians available");
    document.getElementById("provider-empty").hidden = filtered.length !== 0;
    filtered.forEach(function (person) {
      const card = document.createElement("article");
      card.className = "provider-card";
      const header = document.createElement("div");
      header.className = "provider-card-header";
      const avatar = addText(header, "span", "avatar " + person.color, person.initials);
      avatar.setAttribute("aria-hidden", "true");
      addText(header, "span", "arrival-pill", person.arrivalLabel);
      card.appendChild(header);
      addText(card, "h2", "", person.name);
      addText(card, "p", "provider-specialty", person.specialty);
      addText(card, "p", "provider-area", "⌖ " + person.area);
      addText(card, "p", "provider-rating", "★ " + person.rating + " · " + person.reviewCount + " reviews");
      const button = addText(card, "a", "button", "View profile");
      button.href = "#profile";
      button.addEventListener("click", function () { selectedTechnician = person.id; renderProfile(); });
      grid.appendChild(card);
    });
  }

  function renderProfile() {
    const person = findTechnician(selectedTechnician);
    const content = document.getElementById("profile-content");
    content.replaceChildren();
    if (!person) { addText(content, "p", "empty-state", "Select a technician from the list to see their profile."); return; }
    const card = document.createElement("article");
    card.className = "profile-card";
    const avatar = addText(card, "div", "avatar profile-avatar " + person.color, person.initials);
    avatar.setAttribute("aria-hidden", "true");
    addText(card, "p", "eyebrow", "Independent service provider");
    addText(card, "h1", "", person.name);
    addText(card, "p", "provider-specialty", person.specialty);
    addText(card, "p", "provider-rating", "★ " + person.rating + " · " + person.reviewCount + " reviews");
    addText(card, "p", "provider-area", "⌖ Serves " + person.area);
    addText(card, "p", "availability-detail", "Usually available " + person.arrivalLabel.toLowerCase() + ". Estimated arrival window depends on the repair and is confirmed directly with the technician.");
    addText(card, "h2", "profile-subheading", "About their service");
    addText(card, "p", "", person.bio);
    const button = addText(card, "a", "button", "Book service / request a quote →");
    button.href = "#booking";
    button.addEventListener("click", function () {
      document.getElementById("booking-technician").textContent = "Send a request to " + person.name + ". Choose one of their illustrative available days in the next 30 days; they will confirm the appointment directly.";
      populateAvailableDates(person);
    });
    content.appendChild(card);
  }

  document.querySelectorAll("#provider-search, #specialty-filter, #availability-filter, #sort-filter").forEach(function (control) {
    control.addEventListener("input", renderTechnicians);
    control.addEventListener("change", renderTechnicians);
  });

  document.getElementById("booking-form").addEventListener("submit", function (event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity() || !selectedTechnician) return;
    const values = new FormData(form);
    const person = findTechnician(selectedTechnician);
    const preferredDate = String(values.get("preferredDate"));
    if (!person || getAvailableDates(person).indexOf(preferredDate) === -1) {
      document.getElementById("booking-status").textContent = "Please choose one of the technician's listed available dates.";
      return;
    }
    jobs.unshift({
      id: "job-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      technicianId: person.id,
      technicianName: person.name,
      customer: String(values.get("customer")).trim(),
      area: String(values.get("area")).trim(),
      appliance: String(values.get("appliance")),
      preferredDate: preferredDate,
      preferredTime: String(values.get("preferredTime")),
      timing: String(values.get("timing")),
      description: String(values.get("description")).trim(),
      status: "awaiting-quote",
      quote: null,
      rating: null,
      createdAt: new Date().toISOString()
    });
    saveJobs();
    form.reset();
    document.getElementById("booking-status").textContent = "Quote request sent in this demo. You can check for a technician reply under My repair requests.";
    renderAll();
    window.location.hash = "services";
  });

  function statusLabel(status) {
    return { "awaiting-quote": "Waiting for quote", "quote-sent": "Quote received", accepted: "Quote accepted", declined: "Quote declined", completed: "Repair complete" }[status] || status;
  }

  function renderCustomerJobs() {
    const list = document.getElementById("customer-jobs");
    const count = document.getElementById("my-jobs-count");
    list.replaceChildren();
    count.textContent = jobs.length + (jobs.length === 1 ? " request" : " requests");
    if (!jobs.length) { addText(list, "p", "subtle-empty", "Your quote requests and technician replies will appear here."); return; }
    jobs.forEach(function (job) {
      const card = document.createElement("article");
      card.className = "job-card";
      const top = document.createElement("div"); top.className = "job-top";
      addText(top, "span", "tag", job.appliance);
      addText(top, "span", "job-status status-" + job.status, statusLabel(job.status));
      card.appendChild(top);
      addText(card, "h3", "", "Request for " + job.technicianName);
      addText(card, "p", "job-meta", job.area + " · " + job.timing);
      addText(card, "p", "preferred-schedule", "Preferred: " + formatPreferredDate(job.preferredDate) + " · " + (job.preferredTime || "Time not selected"));
      addText(card, "p", "", job.description);
      if (job.quote) {
        const quote = document.createElement("div"); quote.className = "quote-box";
        addText(quote, "p", "quote-price", job.quote.amount);
        addText(quote, "p", "", job.quote.message);
        addText(quote, "p", "job-meta", "Quote from " + job.quote.technician);
        if (job.status === "quote-sent") {
          const actions = document.createElement("div"); actions.className = "decision-actions";
          const accept = addText(actions, "button", "button", "Accept quote"); accept.type = "button";
          accept.addEventListener("click", function () { job.status = "accepted"; saveJobs(); renderAll(); });
          const decline = addText(actions, "button", "button secondary", "Decline"); decline.type = "button";
          decline.addEventListener("click", function () { job.status = "declined"; saveJobs(); renderAll(); });
          quote.appendChild(actions);
        } else if (job.status === "accepted") {
          addText(quote, "p", "accepted-note", "Quote accepted. Arrange the visit directly with the technician; FixerUpper does not attend or manage repairs.");
          const completed = addText(quote, "button", "button secondary", "Mark repair complete"); completed.type = "button";
          completed.addEventListener("click", function () { job.status = "completed"; saveJobs(); renderAll(); });
        } else if (job.status === "completed") {
          if (job.rating) addText(quote, "p", "provider-rating", "Your rating: " + "★".repeat(job.rating) + "☆".repeat(5 - job.rating));
          else {
            const ratingWrap = document.createElement("div"); ratingWrap.className = "rating-control";
            addText(ratingWrap, "span", "", "Rate this technician:");
            for (let score = 1; score <= 5; score += 1) {
              const rate = addText(ratingWrap, "button", "star-button", "★"); rate.type = "button"; rate.setAttribute("aria-label", "Rate " + score + " out of 5");
              rate.addEventListener("click", function () { job.rating = score; saveJobs(); updateTechnicianRating(job.technicianId); renderAll(); });
            }
            quote.appendChild(ratingWrap);
          }
        }
        card.appendChild(quote);
      } else if (job.status === "awaiting-quote") addText(card, "p", "job-meta", "The provider can reply with a quote from the Provide services screen.");
      list.appendChild(card);
    });
  }

  function updateTechnicianRating(technicianId) {
    const person = findTechnician(technicianId);
    const ratings = jobs.filter(function (job) { return job.technicianId === technicianId && job.rating; }).map(function (job) { return job.rating; });
    if (!person || !ratings.length) return;
    const baseScore = Number(person.baseRating || person.rating);
    const baseCount = Number(person.baseReviewCount || person.reviewCount);
    person.rating = ((baseScore * baseCount + ratings.reduce(function (sum, rating) { return sum + rating; }, 0)) / (baseCount + ratings.length)).toFixed(1);
    person.reviewCount = baseCount + ratings.length;
  }

  function renderProviderJobs() {
    const list = document.getElementById("provider-jobs");
    const empty = document.getElementById("provider-jobs-empty");
    const query = document.getElementById("job-area-filter").value.trim().toLowerCase();
    const filtered = jobs.filter(function (job) { return !query || job.area.toLowerCase().indexOf(query) !== -1; });
    list.replaceChildren();
    empty.hidden = filtered.length !== 0;
    filtered.forEach(function (job) {
      const card = document.createElement("article"); card.className = "job-card";
      const top = document.createElement("div"); top.className = "job-top";
      addText(top, "span", "tag", job.appliance);
      addText(top, "span", "job-status status-" + job.status, statusLabel(job.status));
      card.appendChild(top);
      addText(card, "h2", "", job.appliance + " repair request");
      addText(card, "p", "job-meta", job.area + " · " + job.timing + " · Customer: " + job.customer);
      addText(card, "p", "preferred-schedule", "Preferred: " + formatPreferredDate(job.preferredDate) + " · " + (job.preferredTime || "Time not selected"));
      addText(card, "p", "", job.description);
      if (!job.quote && job.status === "awaiting-quote") {
        const form = document.createElement("form"); form.className = "quote-form";
        addText(form, "h3", "", "Send a quote");
        const fields = document.createElement("div"); fields.className = "quote-fields";
        const nameLabel = document.createElement("label"); nameLabel.textContent = "Your technician name";
        const nameInput = document.createElement("input"); nameInput.name = "technician"; nameInput.required = true; nameInput.maxLength = 60; nameInput.value = job.technicianName; nameLabel.appendChild(nameInput);
        const amountLabel = document.createElement("label"); amountLabel.textContent = "Estimated price";
        const amountInput = document.createElement("input"); amountInput.name = "amount"; amountInput.required = true; amountInput.maxLength = 40; amountInput.placeholder = "e.g. $80–$120"; amountLabel.appendChild(amountInput);
        const messageLabel = document.createElement("label"); messageLabel.className = "wide-field"; messageLabel.textContent = "Message / what's included";
        const messageInput = document.createElement("textarea"); messageInput.name = "message"; messageInput.required = true; messageInput.maxLength = 400; messageInput.rows = 2; messageInput.placeholder = "Explain the visit, parts, or next steps"; messageLabel.appendChild(messageInput);
        fields.append(nameLabel, amountLabel, messageLabel);
        const submit = addText(form, "button", "button", "Send quote"); submit.type = "submit";
        form.append(fields, submit);
        form.addEventListener("submit", function (event) {
          event.preventDefault(); if (!form.reportValidity()) return;
          const data = new FormData(form);
          job.technicianName = String(data.get("technician")).trim();
          job.quote = { technician: job.technicianName, amount: String(data.get("amount")).trim(), message: String(data.get("message")).trim() };
          job.status = "quote-sent"; saveJobs(); renderAll();
        });
        card.appendChild(form);
      } else if (job.quote) {
        const quote = document.createElement("div"); quote.className = "quote-box";
        addText(quote, "p", "quote-price", job.quote.amount);
        addText(quote, "p", "", job.quote.message);
        addText(quote, "p", "job-meta", "Quote sent by " + job.quote.technician);
        card.appendChild(quote);
      }
      list.appendChild(card);
    });
  }

  function renderAll() { renderTechnicians(); renderCustomerJobs(); renderProviderJobs(); }
  document.getElementById("job-area-filter").addEventListener("input", renderProviderJobs);
  document.getElementById("clear-demo-data").addEventListener("click", function () {
    jobs = []; saveJobs();
    TECHNICIANS.forEach(function (person) { person.rating = person.baseRating; person.reviewCount = person.baseReviewCount; });
    document.getElementById("settings-status").textContent = "Demo requests and ratings cleared from this browser.";
    renderAll();
  });

  renderAll();
  showView();
})();
