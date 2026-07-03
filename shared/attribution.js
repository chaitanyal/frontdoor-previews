(function () {
  const CAMPAIGN_KEY = "fdh_utm_campaign";
  const EXPIRES_KEY = "fdh_utm_campaign_expires_at";
  const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;

  function storage() {
    try {
      return window.localStorage;
    } catch (_error) {
      return null;
    }
  }

  function removeStoredCampaign() {
    const store = storage();
    if (!store) return;
    store.removeItem(CAMPAIGN_KEY);
    store.removeItem(EXPIRES_KEY);
  }

  function setUtmCampaign(value) {
    const campaign = String(value || "").trim();
    if (!campaign) {
      removeStoredCampaign();
      return;
    }

    const store = storage();
    if (!store) return;
    store.setItem(CAMPAIGN_KEY, campaign);
    store.setItem(EXPIRES_KEY, String(Date.now() + SIXTY_DAYS_MS));
  }

  function clearExpiredUtmCampaign() {
    const store = storage();
    if (!store) return;

    const expiresAt = Number(store.getItem(EXPIRES_KEY) || 0);
    if (!expiresAt || Date.now() >= expiresAt) {
      removeStoredCampaign();
    }
  }

  function getUtmCampaign() {
    clearExpiredUtmCampaign();

    const store = storage();
    if (!store) return null;

    const campaign = String(store.getItem(CAMPAIGN_KEY) || "").trim();
    return campaign || null;
  }

  function captureUtmCampaign() {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.has("utm_campaign")) {
        setUtmCampaign(params.get("utm_campaign"));
      } else {
        clearExpiredUtmCampaign();
      }
    } catch (_error) {
      clearExpiredUtmCampaign();
    }
  }

  window.FrontdoorAttribution = {
    getUtmCampaign,
    setUtmCampaign,
    clearExpiredUtmCampaign,
  };

  captureUtmCampaign();
})();
