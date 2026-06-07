(function () {
  const ANALYTICS_ENDPOINT = "https://analytics.frontdoor.health/event";
  const CTA_EVENT_TYPES = {
    email: "email_click",
    phone: "phone_click",
    newPatient: "new_patient_click",
    existingPatient: "existing_patient_click",
    directions: "directions_click",
  };

  window.frontdoorTrack = function (eventType, destinationUrl) {
    try {
      const payload = {
        practice_slug: window.FRONTDOOR_PRACTICE_SLUG,
        event_type: eventType,
        page_path: window.location.pathname,
        destination_url: destinationUrl || "",
        referrer: document.referrer || "",
      };

      const body = JSON.stringify(payload);

      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          ANALYTICS_ENDPOINT,
          new Blob([body], { type: "application/json" })
        );
      } else {
        fetch(ANALYTICS_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body,
          keepalive: true,
        }).catch(() => {});
      }
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
})();
