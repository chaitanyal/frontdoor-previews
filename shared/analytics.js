(function () {
  const ANALYTICS_ENDPOINT = "https://analytics.frontdoor.health/event";
  const CTA_EVENT_TYPES = {
    email: "email_click",
    phone: "phone_click",
    newPatient: "new_patient_click",
    existingPatient: "existing_patient_click",
    directions: "directions_click",
  };

  function isLocalPreview() {
    return (
      window.location.protocol === "file:" ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "::1" ||
      window.location.hostname === "[::1]"
    );
  }

  function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }

    return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
  }

  function getOrCreateId(storageName, key) {
    try {
      const storage = window[storageName];
      let value = storage.getItem(key);
      if (!value) {
        value = createId();
        storage.setItem(key, value);
      }
      return value;
    } catch (e) {
      return createId();
    }
  }

  function getPreviewSlug(pathname) {
    const parts = pathname.split("/").filter(Boolean);
    if (parts[0] !== "previews" || !parts[1]) return null;
    return parts[1];
  }

  function sendEvent(payload) {
    const body = JSON.stringify(payload);

    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(ANALYTICS_ENDPOINT, blob);
      return;
    }

    fetch(ANALYTICS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
      keepalive: true,
    }).catch(() => {});
  }

  function trackPreviewPageView() {
    try {
      if (isLocalPreview()) return;

      const path = window.location.pathname;
      const practiceSlug = getPreviewSlug(path);
      if (!practiceSlug) return;

      sendEvent({
        event: "page_view",
        path,
        practice_slug: practiceSlug,
        referrer: document.referrer || null,
        title: document.title || null,
        session_id: getOrCreateId("sessionStorage", "fdh_session_id"),
        visitor_id: getOrCreateId("localStorage", "fdh_visitor_id"),
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      // Analytics must never break page loading.
    }
  }

  window.frontdoorTrack = function (eventType, destinationUrl) {
    try {
      if (isLocalPreview() || !window.FRONTDOOR_PRACTICE_SLUG) return;

      const payload = {
        practice_slug: window.FRONTDOOR_PRACTICE_SLUG,
        event_type: eventType,
        page_path: window.location.pathname,
        destination_url: destinationUrl || "",
        referrer: document.referrer || "",
      };

      sendEvent(payload);
    } catch (e) {
      // Analytics must never break navigation.
    }
  };

  function destinationFor(element) {
    if (element.dataset.frontdoorDestination) {
      return element.dataset.frontdoorDestination;
    }
    if (element.href) {
      return element.href;
    }
    if (element.dataset.copyEmail) {
      return "mailto:" + element.dataset.copyEmail;
    }
    return "";
  }

  document.addEventListener("click", function (event) {
    try {
      const element = event.target.closest("[data-frontdoor-cta]");
      if (!element) return;

      const eventType = CTA_EVENT_TYPES[element.dataset.frontdoorCta];
      if (!eventType) return;

      window.frontdoorTrack(eventType, destinationFor(element));
    } catch (e) {
      // Analytics must never break click behavior.
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", trackPreviewPageView);
  } else {
    trackPreviewPageView();
  }
})();
