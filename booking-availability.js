// Date/time picker integration for the local FixerUpper demo.
// Dates are illustrative suggestions, not live or confirmed appointments.
(function () {
  "use strict";

  const form = document.getElementById("booking-form");
  const technicianPrompt = document.getElementById("booking-technician");
  if (!form || !technicianPrompt || !Array.isArray(TECHNICIANS)) return;

  const fields = document.createElement("div");
  fields.className = "booking-schedule-fields wide-field";
  fields.innerHTML = "<label for=\"booking-date\">Choose an available date</label><select id=\"booking-date\" name=\"bookingDate\" required><option value=\"\">Select a technician first</option></select><label for=\"booking-time\">Preferred time</label><select id=\"booking-time\" name=\"bookingTime\" required><option value=\"\">Choose a time</option><option>Morning (8 AM–12 PM)</option><option>Afternoon (12 PM–4 PM)</option><option>Evening (4 PM–8 PM)</option><option>Any available time</option></select><p class=\"field-hint\">Dates are hypothetical openings for the next 30 days. The technician must confirm your requested appointment.</p>";
  const dateSelect = fields.querySelector("#booking-date");
  const timeSelect = fields.querySelector("#booking-time");
  const applianceLabel = form.querySelector("[name=\"appliance\"]").closest("label");
  applianceLabel.insertAdjacentElement("afterend", fields);

  function localDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
  }

  function displayDate(value) {
    const date = new Date(value + "T00:00:00");
    return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  }

  function selectedTechnician() {
    return TECHNICIANS.find(function (person) { return technicianPrompt.textContent.indexOf(person.name) !== -1; });
  }

  function populateDates() {
    const person = selectedTechnician();
    dateSelect.replaceChildren();
    const prompt = document.createElement("option");
    prompt.value = "";
    prompt.textContent = person ? "Choose an available date" : "Select a technician first";
    dateSelect.appendChild(prompt);
    if (!person) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    (person.availableDateOffsets || []).forEach(function (offset) {
      if (!Number.isInteger(offset) || offset < 0 || offset > 30) return;
      const date = new Date(today);
      date.setDate(date.getDate() + offset);
      const value = localDate(date);
      const option = document.createElement("option");
      option.value = value;
      option.textContent = displayDate(value);
      dateSelect.appendChild(option);
    });
  }

  // The app sets this text when a customer clicks the booking link in a profile.
  document.addEventListener("click", function (event) {
    const link = event.target.closest && event.target.closest('a[href="#booking"]');
    if (link) window.setTimeout(populateDates, 0);
  });

  function appendSchedule(card, job) {
    if (!card || !job || !job.preferredDate || card.querySelector(".requested-schedule")) return;
    const note = document.createElement("p");
    note.className = "requested-schedule job-meta";
    const date = new Date(job.preferredDate + "T00:00:00");
    const formatted = Number.isNaN(date.getTime()) ? job.preferredDate : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    note.textContent = "Preferred appointment: " + formatted + " · " + (job.preferredTime || "Time not selected") + " (pending technician confirmation)";
    card.appendChild(note);
  }

  form.addEventListener("submit", function (event) {
    const person = selectedTechnician();
    const chosenDate = dateSelect.value;
    const availableValues = dateSelect.options;
    const isListedDate = Array.prototype.some.call(availableValues, function (option) { return option.value === chosenDate; });
    if (!person || !chosenDate || !timeSelect.value || !isListedDate) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!person) technicianPrompt.textContent = "Please return to a technician profile and choose Book service before sending a request.";
      else form.reportValidity();
      return;
    }

    const chosenTime = timeSelect.value;
    const customerJobs = document.getElementById("customer-jobs");
    const providerJobs = document.getElementById("provider-jobs");
    window.setTimeout(function () {
      try {
        const jobs = JSON.parse(localStorage.getItem("fixerupperDemoJobs") || "[]");
        const job = jobs[0];
        // Only attach preferences to the request just submitted by this technician.
        if (!Array.isArray(jobs) || !job || job.technicianId !== person.id) return;
        job.preferredDate = chosenDate;
        job.preferredTime = chosenTime;
        localStorage.setItem("fixerupperDemoJobs", JSON.stringify(jobs));
        appendSchedule(customerJobs && customerJobs.querySelector(".job-card"), job);
        appendSchedule(providerJobs && providerJobs.querySelector(".job-card"), job);
      } catch (error) {
        const status = document.getElementById("booking-status");
        if (status) status.textContent = "The request could not be saved in this browser. Please check local storage settings and try again.";
      }
    }, 0);
  }, true);

  // Restore visible preferred dates after the app renders requests from local storage.
  window.setTimeout(function () {
    try {
      const jobs = JSON.parse(localStorage.getItem("fixerupperDemoJobs") || "[]");
      if (!Array.isArray(jobs)) return;
      const customerCards = document.querySelectorAll("#customer-jobs .job-card");
      const providerCards = document.querySelectorAll("#provider-jobs .job-card");
      jobs.forEach(function (job, index) {
        appendSchedule(customerCards[index], job);
        appendSchedule(providerCards[index], job);
      });
    } catch (error) { /* local storage unavailable */ }
  }, 0);
})();
