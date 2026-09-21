/* ==========================================================================
   ANALYTICS
   Google Analytics (GA4) loader. The measurement ID lives here once —
   every page just links this file, so switching properties or removing
   tracking later is a one-line change instead of a find-and-replace
   across every HTML file.
   ========================================================================== */

(function () {
  var GA_MEASUREMENT_ID = "G-FDRKDMXT3K";

  var gaScript = document.createElement("script");
  gaScript.async = true;
  gaScript.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_MEASUREMENT_ID;
  document.head.appendChild(gaScript);

  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;

  gtag("js", new Date());
  gtag("config", GA_MEASUREMENT_ID);
})();
