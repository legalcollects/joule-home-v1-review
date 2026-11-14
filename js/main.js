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

  /* Scroll reveals. Content is visible by default; only elements below the
     first screen are held back, and position is polled on a timer as well as
     on scroll because embedded and background views do not reliably deliver
     scroll callbacks. Nothing on the first screen ever depends on this. */
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var firstScreen = window.innerHeight || document.documentElement.clientHeight;
  var pending = [];
  var revealTimer = null;

  function checkReveals() {
    var root = document.documentElement;
    var vh = window.innerHeight || root.clientHeight;
    var atEnd = window.pageYOffset + vh >= root.scrollHeight - 2;
    pending = pending.filter(function (el) {
      if (atEnd || el.getBoundingClientRect().top < vh - 40) {
        el.classList.remove("is-waiting");
        return false;
      }
      return true;
    });
    if (!pending.length && revealTimer) {
      clearInterval(revealTimer);
      revealTimer = null;
      window.removeEventListener("scroll", checkReveals);
      window.removeEventListener("resize", checkReveals);
    }
  }

  if (!reduced && firstScreen > 0) {
    Array.prototype.forEach.call(document.querySelectorAll(".reveal"), function (el) {
      if (el.getBoundingClientRect().top >= firstScreen) {
        el.classList.add("is-waiting");
        pending.push(el);
      }
    });
    if (pending.length) {
      revealTimer = setInterval(checkReveals, 200);
      window.addEventListener("scroll", checkReveals, { passive: true });
      window.addEventListener("resize", checkReveals);
    }
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
        note.id = field.id + "-error";
        wrap.appendChild(note);
      }
      /* Link the message to its field so screen readers announce it */
      if (message) {
        note.textContent = message;
        wrap.classList.add("has-error");
        field.classList.add("invalid");
        field.setAttribute("aria-invalid", "true");
        field.setAttribute("aria-describedby", note.id);
      } else {
        wrap.classList.remove("has-error");
        field.classList.remove("invalid");
        field.removeAttribute("aria-invalid");
        field.removeAttribute("aria-describedby");
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

      /* Honeypot: bots fill the hidden field; drop silently with a success face */
      var hp = form.querySelector('[name="_gotcha"]');
      if (hp && hp.value) {
        showConfirm("Thank you. Your inquiry has been received.");
        form.reset();
        return;
      }

      if (!FORM_ENDPOINT) {
        /* No endpoint yet: open a prefilled email so real inquiries still arrive */
        var get = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ""; };
        var typeSel = document.getElementById("inquiry-type");
        var typeLabel = typeSel && typeSel.selectedIndex > 0 ? typeSel.options[typeSel.selectedIndex].text : "General Contact";
        var body =
          "Inquiry Type: " + typeLabel + "\n" +
          "Name: " + get("name") + "\n" +
          "Organization: " + get("organization") + "\n" +
          "Email: " + get("email") + "\n" +
          "Phone: " + get("phone") + "\n" +
          "Site / Market: " + get("location") + "\n\n" +
          get("message");
        window.location.href = "mailto:info@joulelandco.com" +
          "?subject=" + encodeURIComponent("Website Inquiry — " + typeLabel) +
          "&body=" + encodeURIComponent(body);
        showConfirm("Your inquiry has been prepared in your email application — press send to deliver it. You can also write to info@joulelandco.com directly.");
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
          showConfirm("Thank you. Your inquiry has been received.");
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
