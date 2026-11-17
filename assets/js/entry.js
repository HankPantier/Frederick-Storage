// Holiday giveaway entry form → Google Sheet (via Apps Script web app).
(function () {
  "use strict";

  var form = document.getElementById("entry-form");
  if (!form) return;
  var errorBox = document.getElementById("form-error");
  var thanks = document.getElementById("thanks");
  var thanksOptIn = document.getElementById("thanks-optin");
  var button = form.querySelector('button[type="submit"]');
  var UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign"];

  // Keep the tracking tags for the visit, even if the person lands, browses and comes back.
  var params = new URLSearchParams(window.location.search);
  UTM_KEYS.forEach(function (key) {
    var value = params.get(key);
    try {
      if (value) sessionStorage.setItem("fs_" + key, value);
      else value = sessionStorage.getItem("fs_" + key);
    } catch (e) { /* storage blocked: use the URL value only */ }
    if (value) form.elements[key].value = value.slice(0, 120);
  });
  form.elements.referrer.value = document.referrer ? document.referrer.slice(0, 300) : "";
  form.elements.page.value = window.location.pathname;

  function showError(message, field) {
    errorBox.textContent = message;
    if (field) {
      field.setAttribute("aria-invalid", "true");
      field.focus();
    }
  }

  form.addEventListener("input", function (event) {
    if (event.target.hasAttribute("aria-invalid")) event.target.removeAttribute("aria-invalid");
    if (errorBox.textContent) errorBox.textContent = "";
  });

  function validate() {
    var el = form.elements;
    var checks = [
      [el.first_name, function (v) { return v.trim() !== ""; }, "Please enter your first name."],
      [el.last_name, function (v) { return v.trim() !== ""; }, "Please enter your last name."],
      [el.email, function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); }, "Please enter an email address we can reach you at."]
    ];
    for (var i = 0; i < checks.length; i++) {
      if (!checks[i][1](checks[i][0].value)) { showError(checks[i][2], checks[i][0]); return false; }
    }
    if (!el.agree.checked) { showError("Please confirm you're 18 or older and agree to the official rules.", el.agree); return false; }
    return true;
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    errorBox.textContent = "";
    if (!validate()) return;

    // Bots fill in the hidden field. Pretend it worked and send nothing.
    if (form.elements.company.value) { done(); return; }

    var endpoint = (window.FS_CONFIG && window.FS_CONFIG.endpoint) || "";
    if (!endpoint) {
      showError("The entry form isn't connected yet. Please try again soon.");
      return;
    }

    var data = new URLSearchParams();
    Array.prototype.forEach.call(form.elements, function (field) {
      if (!field.name || field.name === "company") return;
      if (field.type === "checkbox") data.append(field.name, field.checked ? "yes" : "no");
      else data.append(field.name, field.value.trim());
    });

    button.disabled = true;
    button.textContent = "Sending…";

    // A form-encoded POST is a "simple" request, so the browser sends no preflight,
    // and Apps Script's JSON response comes back with CORS allowed.
    fetch(endpoint, { method: "POST", body: data })
      .then(function (response) { return response.json(); })
      .then(function (result) {
        if (result && result.ok) done();
        else throw new Error((result && result.error) || "failed");
      })
      .catch(function () {
        button.disabled = false;
        button.textContent = "Enter the giveaway";
        showError("Something went wrong and your entry didn't go through. Please try again, or email us at frederickcostorage@gmail.com.");
      });
  });

  function done() {
    thanksOptIn.hidden = !form.elements.opt_in.checked;
    form.hidden = true;
    thanks.hidden = false;
    thanks.focus();
    if (typeof window.gtag === "function") window.gtag("event", "giveaway_entry");
  }
})();
