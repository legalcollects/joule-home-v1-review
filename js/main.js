/* Joule Land Company — shared behavior
   Restrained by design: nav toggle, scroll reveals, form handling. */

(function () {
  "use strict";

  /* Contact form endpoint.
     Set this to your form service URL (Formspree, Basin, your own API, etc.)
     to activate live submissions. While empty, the form runs in demo mode. */
  var FORM_ENDPOINT = "";

  /* Mobile navigation */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* Subtle scroll reveals (skipped when reduced motion is preferred) */
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var revealed = document.querySelectorAll(".reveal");
  if (!reduced && "IntersectionObserver" in window && revealed.length) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealed.forEach(function (el) { observer.observe(el); });
  } else {
    revealed.forEach(function (el) { el.classList.add("in-view"); });
  }

  /* Footer year */
  var year = document.getElementById("footer-year");
  if (year) year.textContent = String(new Date().getFullYear());

  /* Contact form — designed validation + endpoint submission */
  var form = document.getElementById("contact-form");
  if (form) {
    var confirmBox = document.getElementById("form-confirm");

    function setFieldError(field, message) {
      var wrap = field.closest(".field");
      if (!wrap) return;
      var note = wrap.querySelector(".field-error");
      if (!note) {
        note = document.createElement("p");
        note.className = "field-error";
        wrap.appendChild(note);
      }
      if (message) {
        note.textContent = message;
        wrap.classList.add("has-error");
        field.classList.add("invalid");
      } else {
        wrap.classList.remove("has-error");
        field.classList.remove("invalid");
      }
    }

    function validate() {
      var ok = true;
      var firstBad = null;
      form.querySelectorAll("[required]").forEach(function (field) {
        var message = "";
        if (!field.value || (field.tagName === "SELECT" && field.value === "")) {
          message = "This field is required.";
        } else if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) {
          message = "Enter a valid email address.";
        }
        setFieldError(field, message);
        if (message && !firstBad) firstBad = field;
        if (message) ok = false;
      });
      if (firstBad) firstBad.focus();
      return ok;
    }

    form.querySelectorAll("[required]").forEach(function (field) {
      field.addEventListener("input", function () { setFieldError(field, ""); });
      field.addEventListener("change", function () { setFieldError(field, ""); });
    });

    function showConfirm(message, isError) {
      if (!confirmBox) return;
      confirmBox.textContent = message;
      confirmBox.classList.toggle("form-confirm--error", !!isError);
      confirmBox.hidden = false;
      confirmBox.focus();
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validate()) return;

      if (!FORM_ENDPOINT) {
        showConfirm("Thank you. Your inquiry has been recorded for this demonstration. Once the form endpoint is connected in js/main.js, submissions will reach the Joule team directly.");
        form.reset();
        return;
      }

      var button = form.querySelector('button[type="submit"]');
      if (button) button.disabled = true;
      fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { "Accept": "application/json" },
        body: new FormData(form)
      })
        .then(function (res) {
          if (!res.ok) throw new Error("Submission failed");
          showConfirm("Thank you. Your inquiry has been received; a Joule principal will respond directly.");
          form.reset();
        })
        .catch(function () {
          showConfirm("Something went wrong sending your inquiry. Please email info@joulelandco.com directly and we will respond.", true);
        })
        .finally(function () {
          if (button) button.disabled = false;
        });
    });
  }
})();
