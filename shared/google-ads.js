(function () {
  const PREVIEW_REQUEST_SEND_TO = "AW-18297020270/AokmCOPin8ocEO6-2ZRE";

  function trackGoogleAdsPreviewRequestConversion() {
    if (typeof window === "undefined") return;
    if (typeof window.gtag !== "function") return;

    try {
      window.gtag("event", "conversion", {
        send_to: PREVIEW_REQUEST_SEND_TO,
      });
    } catch (_error) {
      // Google Ads tracking should never block the preview request success flow.
    }
  }

  if (typeof window !== "undefined") {
    window.FrontdoorGoogleAds = {
      trackGoogleAdsPreviewRequestConversion,
    };
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      trackGoogleAdsPreviewRequestConversion,
    };
  }
})();
