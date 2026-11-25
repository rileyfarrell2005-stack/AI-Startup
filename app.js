// FixerUpper front-end demo. Requests are saved only in this browser's localStorage.
(function () {
  "use strict";

  const STORE_KEY = "fixerupperDemoJobs";
  const $ = function (selector) { return document.querySelector(selector); };
  const getJobs = function () {
    try {
      const stored = JSON.parse(localStorage.getItem(STORE_KEY) || "[]");
      return Array.isArray(stored) ? stored : [];
    } catch (error) { return []; }
  };
  let jobs = getJobs();
  let selectedTechnicianId = null;

  function saveJobs() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(jobs));
      return true;
    } catch (error) { return false; }
  }
  function addText(parent, tag, className, value) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    node.textContent = String(value == null ? "" : value);
    parent.appendChild(node);
    return node;
  }
  function findTechnician(id) {
    return TECHNICIANS.find(function (person) { return person.id === id; });
  }
  function localDateString(date) {
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
  }
  function availableDates(person) {
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
  function formatDate(value, options) {
    if (!value) return "Date not selected";
    const date = new Date(value + "T00:00:00");
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, options || { year: "numeric", month: "short", day: "numeric" });
  }
  function showView() {
    const requested = (window.location.hash || "#home").slice(1);
    const views = document.querySelectorAll("[data-view]");
    const current = Array.prototype.some.call(views, function (view) { return view.id === requested; }) ? requested : "home";
    views.forEach(function (view) { view.hidden = view.id !== current; });
    document.querySelectorAll(".bottom-nav a").forEach(function (tab) {
      const isCustomerPage = current === "profile" || current === "booking";
      if (tab.dataset.tab === current || (isCustomerPage && tab.dataset.tab === "services")) tab.setAttribute("aria-current", "page");
      else tab.removeAttribute("aria-current");
    });
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", showView);

  function populateDateOptions(person) {
    const select = $("#preferred-date");
    select.replaceChildren();
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Choose an available date";
    select.appendChild(placeholder);
    availableDates(person).forEach(function (value) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = formatDate(value, { weekday: "short", month: "short", day: "numeric" });
      select.appendChild(option);
    });
    if (select.options.length === 1) {
      placeholder.textContent = "No dates currently listed";
      select.disabled = true;
    } else select.disabled = false;
  }

  function technicianMatches(person) {
    const search = $("#provider-search").value.trim().toLowerCase();
    const area = $("#area-filter").value.trim().toLowerCase();
    const specialty = $("#specialty-filter").value;
    const minRating = Number($("#rating-filter").value || 0);
    const availability = $("#availability-filter").value;
    const nameSearchMatches = !search || person.name.toLowerCase().includes(search);
    const areaMatches = !area || person.area.toLowerCase().includes(area);
    const specialtyMatches = !specialty || person.appliances.includes(specialty);
    const ratingMatches = Number(person.rating) >= minRating;
    const availabilityMatches = !availability || (availability === "today" ? person.arrivalHours <= 8 : availability === "tomorrow" ? person.arrivalHours <= 24 : person.arrivalHours <= 168);
    return nameSearchMatches && areaMatches && specialtyMatches && ratingMatches && availabilityMatches;
  }
  function renderTechnicians() {
    const grid = $("#provider-grid");
    const sort = $("#sort-filter").value;
    const people = TECHNICIANS.filter(technicianMatches).slice();
    people.sort(function (a, b) { return sort === "rating" ? Number(b.rating) - Number(a.rating) : a.arrivalHours - b.arrivalHours; });
    grid.replaceChildren();
    $("#provider-results-count").textContent = people.length + (people.length === 1 ? " technician matches your filters" : " technicians match your filters");
    $("#provider-empty").hidden = people.length > 0;
    people.forEach(function (person) {
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
      button.addEventListener("click", function () { selectedTechnicianId = person.id; renderProfile(); });
      grid.appendChild(card);
    });
  }

  function renderProfile() {
    const person = findTechnician(selectedTechnicianId);
    const content = $("#profile-content");
    content.replaceChildren();
    if (!person) { addText(content, "p", "empty-state", "Choose a technician from the list to view their profile."); return; }
    const card = document.createElement("article");
    card.className = "profile-card";
    const avatar = addText(card, "div", "avatar profile-avatar " + person.color, person.initials);
    avatar.setAttribute("aria-hidden", "true");
    addText(card, "p", "eyebrow", "Independent service provider");
    addText(card, "h1", "", person.name);
    addText(card, "p", "provider-specialty", person.specialty);
    addText(card, "p", "provider-rating", "★ " + person.rating + " · " + person.reviewCount + " reviews");
    addText(card, "p", "provider-area", "⌖ Serves " + person.area);
    addText(card, "p", "availability-detail", "Usually available " + person.arrivalLabel.toLowerCase() + ". Dates and times are suggestions and must be confirmed directly.");
    addText(card, "h2", "profile-subheading", "About their service");
    addText(card, "p", "", person.bio);
    const book = addText(card, "a", "button", "Request a quote →");
    book.href = "#booking";
    book.addEventListener("click", function () {
      $("#booking-technician").textContent = "Request a quote from " + person.name + ". Select one of their suggested dates and a preferred time; the technician will confirm.";
      populateDateOptions(person);
      $("#booking-status").textContent = "";
    });
    content.appendChild(card);
  }

  document.querySelectorAll("#provider-search, #area-filter, #specialty-filter, #rating-filter, #availability-filter, #sort-filter").forEach(function (control) {
    control.addEventListener("input", renderTechnicians);
    control.addEventListener("change", renderTechnicians);
  });
  $("#clear-filters").addEventListener("click", function () {
    $("#provider-search").value = "";
    $("#area-filter").value = "";
    $("#specialty-filter").value = "";
    $("#rating-filter").value = "";
    $("#availability-filter").value = "";
    $("#sort-filter").value = "soonest";
    renderTechnicians();
  });

  $("#booking-form").addEventListener("submit", function (event) {
    event.preventDefault();
    const status = $("#booking-status");
    const person = findTechnician(selectedTechnicianId);
    if (!person) {
      status.textContent = "Please choose a technician from Request services before submitting.";
      return;
    }
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const values = new FormData(form);
    const date = String(values.get("preferredDate") || "");
    if (!availableDates(person).includes(date)) {
      status.textContent = "Please select one of this technician's listed dates.";
      return;
    }
    const job = {
      id: "job-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      technicianId: person.id,
      technicianName: person.name,
      customer: String(values.get("customer") || "").trim(),
      area: String(values.get("area") || "").trim(),
      appliance: String(values.get("appliance") || ""),
      preferredDate: date,
      preferredTime: String(values.get("preferredTime") || ""),
      timing: String(values.get("timing") || ""),
      description: String(values.get("description") || "").trim(),
      status: "awaiting-quote",
      quote: null,
      rating: null,
      createdAt: new Date().toISOString()
    };
    jobs.unshift(job);
    if (!saveJobs()) {
      jobs.shift();
      status.textContent = "Could not save your request in this browser. Check storage settings and try again.";
      return;
    }
    form.reset();
    status.textContent = "Request submitted and saved in this browser. The technician can review it under Provide services.";
    renderAll();
    window.location.hash = "services";
  });

  function statusLabel(status) {
    return { "awaiting-quote": "Waiting for quote", "quote-sent": "Quote received", accepted: "Quote accepted", declined: "Quote declined", completed: "Repair complete" }[status] || status;
  }
  function renderCustomerJobs() {
    const list = $("#customer-jobs");
    list.replaceChildren();
    $("#my-jobs-count").textContent = jobs.length + (jobs.length === 1 ? " request" : " requests");
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
      addText(card, "p", "job-meta", "Preferred appointment: " + formatDate(job.preferredDate) + " · " + (job.preferredTime || "Any time") + " (pending confirmation)");
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
          addText(quote, "p", "accepted-note", "Quote accepted. Arrange and confirm the visit directly with the technician.");
          const complete = addText(quote, "button", "button secondary", "Mark repair complete"); complete.type = "button";
          complete.addEventListener("click", function () { job.status = "completed"; saveJobs(); renderAll(); });
        } else if (job.status === "completed") {
          if (job.rating) addText(quote, "p", "provider-rating", "Your rating: " + "★".repeat(job.rating) + "☆".repeat(5 - job.rating));
          else {
            const rating = document.createElement("div"); rating.className = "rating-control";
            addText(rating, "span", "", "Rate this technician:");
            for (let score = 1; score <= 5; score += 1) {
              const button = addText(rating, "button", "star-button", "★"); button.type = "button"; button.setAttribute("aria-label", "Rate " + score + " out of 5");
              button.addEventListener("click", function () { job.rating = score; updateTechnicianRating(job.technicianId); saveJobs(); renderAll(); });
            }
            quote.appendChild(rating);
          }
        }
        card.appendChild(quote);
      } else if (job.status === "awaiting-quote") addText(card, "p", "job-meta", "The provider can review this request under Provide services.");
      list.appendChild(card);
    });
  }
  function updateTechnicianRating(technicianId) {
    const person = findTechnician(technicianId);
    if (!person) return;
    const ratings = jobs.filter(function (job) { return job.technicianId === technicianId && Number.isInteger(job.rating); }).map(function (job) { return job.rating; });
    const baseScore = Number(person.baseRating || person.rating);
    const baseCount = Number(person.baseReviewCount || person.reviewCount);
    person.rating = ratings.length ? ((baseScore * baseCount + ratings.reduce(function (sum, rating) { return sum + rating; }, 0)) / (baseCount + ratings.length)).toFixed(1) : person.baseRating;
    person.reviewCount = baseCount + ratings.length;
  }
  function renderProviderJobs() {
    const list = $("#provider-jobs");
    const query = $("#job-area-filter").value.trim().toLowerCase();
    const filtered = jobs.filter(function (job) { return !query || job.area.toLowerCase().includes(query); });
    list.replaceChildren();
    $("#provider-jobs-empty").hidden = filtered.length > 0;
    filtered.forEach(function (job) {
      const card = document.createElement("article"); card.className = "job-card";
      const top = document.createElement("div"); top.className = "job-top";
      addText(top, "span", "tag", job.appliance);
      addText(top, "span", "job-status status-" + job.status, statusLabel(job.status));
      card.appendChild(top);
      addText(card, "h2", "", job.appliance + " repair request");
      addText(card, "p", "job-meta", job.area + " · " + job.timing + " · Customer: " + job.customer);
      addText(card, "p", "job-meta", "Preferred appointment: " + formatDate(job.preferredDate) + " · " + (job.preferredTime || "Any time") + " (pending confirmation)");
      addText(card, "p", "", job.description);
      if (!job.quote && job.status === "awaiting-quote") {
        const form = document.createElement("form"); form.className = "quote-form";
        addText(form, "h3", "", "Send a quote");
        const fields = document.createElement("div"); fields.className = "quote-fields";
        function addInput(labelText, name, value, placeholder) {
          const label = document.createElement("label"); label.textContent = labelText;
          const input = document.createElement("input"); input.name = name; input.required = true; input.maxLength = name === "message" ? 400 : 60; input.value = value || ""; input.placeholder = placeholder || "";
          label.appendChild(input); fields.appendChild(label); return input;
        }
        addInput("Your technician name", "technician", job.technicianName);
        addInput("Estimated price", "amount", "", "e.g. $80–$120");
        const messageLabel = document.createElement("label"); messageLabel.className = "wide-field"; messageLabel.textContent = "Message / what's included";
        const message = document.createElement("textarea"); message.name = "message"; message.required = true; message.maxLength = 400; message.rows = 2; message.placeholder = "Explain what's included or next steps";
        messageLabel.appendChild(message); fields.appendChild(messageLabel);
        const submit = addText(form, "button", "button", "Send quote"); submit.type = "submit";
        form.append(fields, submit);
        form.addEventListener("submit", function (event) {
          event.preventDefault();
          if (!form.reportValidity()) return;
          const values = new FormData(form);
          job.technicianName = String(values.get("technician")).trim();
          job.quote = { technician: job.technicianName, amount: String(values.get("amount")).trim(), message: String(values.get("message")).trim() };
          job.status = "quote-sent";
          saveJobs(); renderAll();
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

  $("#job-area-filter").addEventListener("input", renderProviderJobs);
  $("#clear-demo-data").addEventListener("click", function () {
    jobs = [];
    saveJobs();
    TECHNICIANS.forEach(function (person) { person.rating = person.baseRating; person.reviewCount = person.baseReviewCount; });
    $("#settings-status").textContent = "Demo requests and ratings cleared from this browser.";
    renderAll();
  });

  jobs.forEach(function (job) { updateTechnicianRating(job.technicianId); });
  renderAll();
  showView();
})();
