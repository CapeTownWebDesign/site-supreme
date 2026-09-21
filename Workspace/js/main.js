/* ==========================================================================
   MAIN.JS
   Site-wide behavior. Kept dependency-free on purpose — as the site grows
   past a handful of interactive pieces, this is the natural point to
   introduce a bundler or framework rather than before.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", function () {
  var menuBtn = document.getElementById("menu-btn");
  var mobileMenu = document.getElementById("mobile-menu");
  var iconOpen = document.getElementById("icon-open");
  var iconClose = document.getElementById("icon-close");

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener("click", function () {
      var isOpen = mobileMenu.classList.contains("is-open");

      mobileMenu.classList.toggle("is-open");
      iconOpen.classList.toggle("u-hidden");
      iconClose.classList.toggle("u-hidden");
      menuBtn.setAttribute("aria-expanded", String(!isOpen));
    });
  }

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- Scroll reveal ----
  // Fades and lifts elements in as they enter the viewport. Skipped
  // entirely (elements just render visible) if the browser doesn't
  // support IntersectionObserver, or the visitor prefers less motion.
  var revealEls = document.querySelectorAll(".reveal");

  if (revealEls.length && "IntersectionObserver" in window && !prefersReducedMotion) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    revealEls.forEach(function (el) { observer.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  // ---- Hero parallax ----
  // Subtle grid drift on mouse move. Only on devices with a fine
  // pointer (skips touch), and skipped for reduced-motion visitors.
  var hero = document.querySelector(".hero");
  var heroGrid = hero ? hero.querySelector(".hero__grid") : null;
  var hasFinePointer = window.matchMedia("(pointer: fine)").matches;

  if (hero && heroGrid && hasFinePointer && !prefersReducedMotion) {
    hero.addEventListener("mousemove", function (e) {
      var rect = hero.getBoundingClientRect();
      var relX = (e.clientX - rect.left) / rect.width - 0.5;
      var relY = (e.clientY - rect.top) / rect.height - 0.5;
      var shiftX = relX * -12;
      var shiftY = relY * -12;
      heroGrid.style.transform = "translate(" + shiftX + "px, " + shiftY + "px)";
    });

    hero.addEventListener("mouseleave", function () {
      heroGrid.style.transform = "translate(0, 0)";
    });
  }

  // ---- Business type picker ----
  // Clicking a chip scrolls to and briefly highlights the matching
  // service card, and writes a short tailored line under the chips.
  var pickerChips = document.querySelectorAll(".picker-chip");
  var pickerResult = document.getElementById("picker-result");

  var recommendations = {
    "service-booking": "Most businesses like yours start with a booking system so customers can reserve a table, slot, or service without a phone call.",
    "service-portal": "A client portal usually fits best here — a secure place for patients or clients to see documents and details.",
    "service-store": "An online store is usually the right starting point, so you can sell and take payment without a third-party marketplace fee.",
    "service-website": "A clear business website usually does the job — explain what you do, build trust, make it easy to get in touch.",
  };

  pickerChips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      pickerChips.forEach(function (c) { c.setAttribute("aria-pressed", "false"); });
      chip.setAttribute("aria-pressed", "true");

      var targetId = chip.getAttribute("data-service");
      var target = document.getElementById(targetId);

      if (pickerResult && recommendations[targetId]) {
        pickerResult.textContent = recommendations[targetId];
      }

      if (target) {
        target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "center" });
        target.classList.add("service-card--highlight");
        setTimeout(function () { target.classList.remove("service-card--highlight"); }, 1600);
      }
    });
  });

  // ---- Rotating hero readout ----
  // Small technical-style annotation in the hero corner cycles through
  // a short list, picked once per browser session — stable while you
  // browse, different next time you visit.
  var annotation = document.querySelector(".hero__annotation");
  if (annotation) {
    var readouts = [
      ["33.9249\u00B0S&nbsp; 18.4241\u00B0E", "CAPE TOWN, ZA"],
      ["AVG. BUILD TIME", "2\u20134 WEEKS"],
      ["CURRENTLY ACCEPTING", "NEW PROJECTS"],
      ["ONE DEVELOPER", "ONE POINT OF CONTACT"],
    ];
    var STORAGE_KEY = "wbdHeroReadoutIndex";
    var idx;
    try {
      idx = sessionStorage.getItem(STORAGE_KEY);
      if (idx === null) {
        idx = Math.floor(Math.random() * readouts.length);
        sessionStorage.setItem(STORAGE_KEY, String(idx));
      } else {
        idx = parseInt(idx, 10);
      }
    } catch (e) {
      idx = 0;
    }
    var chosen = readouts[idx] || readouts[0];
    annotation.innerHTML = "<p>" + chosen[0] + "</p><p>" + chosen[1] + "</p>";
  }
});
