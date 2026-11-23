/* ==========================================================================
   ANALYTICS + CONSENT
   Google Analytics (GA4) is loaded ONLY after the visitor accepts. The
   choice is remembered in localStorage ("wbdConsent": granted | denied).
   The measurement ID lives here once, so switching properties or removing
   tracking later is a one-line change.

   Any element with [data-consent-reset] (e.g. on privacy.html) clears the
   saved choice and shows the banner again.
   ========================================================================== */

(function () {
  var GA_MEASUREMENT_ID = "G-FDRKDMXT3K";
  var STORAGE_KEY = "wbdConsent";
  var loaded = false;

  function readChoice() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }

  function saveChoice(value) {
    try {
      if (value === null) localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, value);
    } catch (e) { /* storage unavailable — choice applies to this page view only */ }
  }

  function loadAnalytics() {
    if (loaded) return;
    loaded = true;

    var gaScript = document.createElement("script");
    gaScript.async = true;
    gaScript.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_MEASUREMENT_ID;
    document.head.appendChild(gaScript);

    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    window.gtag = gtag;

    gtag("js", new Date());
    gtag("config", GA_MEASUREMENT_ID);
  }

  function removeBanner() {
    var existing = document.getElementById("consent-banner");
    if (existing) existing.remove();
  }

  function showBanner() {
    removeBanner();

    var banner = document.createElement("div");
    banner.id = "consent-banner";
    banner.className = "consent-banner";
    banner.setAttribute("role", "region");
    banner.setAttribute("aria-label", "Cookie and analytics consent");
    banner.innerHTML =
      '<p class="consent-banner__text">We use Google Analytics to understand how the site is used. ' +
      'It only runs if you accept. <a href="privacy.html">Privacy details</a></p>' +
      '<div class="consent-banner__actions">' +
      '<button type="button" class="btn btn--outline consent-banner__btn" data-consent="denied">Decline</button>' +
      '<button type="button" class="btn btn--primary consent-banner__btn" data-consent="granted">Accept</button>' +
      '</div>';

    banner.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-consent]");
      if (!btn) return;
      var choice = btn.getAttribute("data-consent");
      saveChoice(choice);
      if (choice === "granted") loadAnalytics();
      removeBanner();
    });

    document.body.appendChild(banner);
  }

  function init() {
    var choice = readChoice();
    if (choice === "granted") loadAnalytics();
    else if (choice !== "denied") showBanner();

    document.addEventListener("click", function (e) {
      if (e.target.closest("[data-consent-reset]")) {
        saveChoice(null);
        showBanner();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
