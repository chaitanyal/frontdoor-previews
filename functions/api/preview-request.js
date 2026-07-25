const RESEND_ENDPOINT = "https://api.resend.com/emails";
const TURNSTILE_ENDPOINT = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const REQUEST_TO = "chaitanya@frontdoor.health";
const REQUEST_FROM = "FrontDoor Health <chaitanya@frontdoor.health>";

// Keep this allowlist synchronized with the specialty options in marketing/index.html.
const ALLOWED_SPECIALTIES = new Set([
  "Cardiology",
  "Dermatology",
  "Endocrinology",
  "ENT / Otolaryngology",
  "Gastroenterology",
  "Internal Medicine",
  "Neurology",
  "OB/GYN",
  "Ophthalmology",
  "Orthopedics",
  "Pain Management",
  "Pediatrics",
  "Physical Therapy",
  "Plastic Surgery",
  "Primary Care / Family Medicine",
  "Psychiatry",
  "Psychology",
  "Pulmonology",
  "Rheumatology",
  "Sleep Medicine",
  "Therapy / Counseling",
  "Urgent Care",
  "Urology",
  "Other",
]);

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function normalizeSingleLine(value) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function normalizeWebsiteUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(candidate);
    if (!["http:", "https:"].includes(url.protocol)) return "";
    if (!url.hostname.includes(".") || url.username || url.password) return "";
    url.hash = "";
    return url.toString();
  } catch (_error) {
    return "";
  }
}

function isValidEmail(value) {
  const email = String(value || "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeUtmCampaign(value) {
  const campaign = normalizeSingleLine(value);
  return campaign ? campaign.slice(0, 500) : null;
}

function textEmail({ name, practiceName, specialty, email, website, utmCampaign, submittedAt }) {
  return [
    "New preview request",
    "",
    `Name: ${name}`,
    `Practice: ${practiceName}`,
    `Specialty: ${specialty}`,
    `Email: ${email}`,
    `Website: ${website || "Not provided"}`,
    "",
    "Source: frontdoor.health",
    `UTM Campaign: ${utmCampaign || "None"}`,
    `Submitted at: ${submittedAt}`,
  ].join("\n");
}

async function verifyTurnstile({ token, secret, ip }) {
  const formData = new FormData();
  formData.append("secret", secret);
  formData.append("response", token);
  if (ip) formData.append("remoteip", ip);

  const response = await fetch(TURNSTILE_ENDPOINT, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) return false;
  const result = await response.json();
  return result.success === true;
}

async function sendPreviewRequestEmail({
  apiKey,
  name,
  practiceName,
  specialty,
  email,
  website,
  utmCampaign,
  submittedAt,
}) {
  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: REQUEST_FROM,
      to: [REQUEST_TO],
      reply_to: email,
      subject: `[Preview Request] ${practiceName}`,
      text: textEmail({
        name,
        practiceName,
        specialty,
        email,
        website,
        utmCampaign,
        submittedAt,
      }),
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("Resend email request failed", response.status, detail);
    return false;
  }

  return true;
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 16_384) {
    return jsonResponse({ ok: false, error: "Request too large." }, 413);
  }

  if (!env.RESEND_API_KEY || !env.TURNSTILE_SECRET_KEY) {
    console.error("Missing RESEND_API_KEY or TURNSTILE_SECRET_KEY");
    return jsonResponse({ ok: false, error: "Preview requests are temporarily unavailable." }, 500);
  }

  let payload;
  try {
    payload = await request.json();
  } catch (_error) {
    return jsonResponse({ ok: false, error: "Invalid request." }, 400);
  }

  const honeypot = String(payload.companyWebsite || "").trim();
  if (honeypot) {
    return jsonResponse({ ok: true, accepted: false });
  }

  const name = normalizeSingleLine(payload.name);
  const practiceName = normalizeSingleLine(payload.practiceName);
  const specialty = normalizeSingleLine(payload.specialty);
  const email = normalizeSingleLine(payload.email);
  const websiteInput = String(payload.websiteUrl || "").trim();
  const website = normalizeWebsiteUrl(websiteInput);
  const utmCampaign = normalizeUtmCampaign(payload.utm_campaign);
  const turnstileToken = String(payload.turnstileToken || "").trim();

  if (!name || name.length > 100) {
    return jsonResponse({ ok: false, error: "Enter your name." }, 400);
  }
  if (!practiceName) {
    return jsonResponse({ ok: false, error: "Please enter your practice name." }, 400);
  }
  if (practiceName.length > 150) {
    return jsonResponse({ ok: false, error: "Practice name must be 150 characters or fewer." }, 400);
  }
  if (specialty.length > 100 || !ALLOWED_SPECIALTIES.has(specialty)) {
    return jsonResponse({ ok: false, error: "Please select a specialty." }, 400);
  }
  if (!isValidEmail(email) || email.length > 254) {
    return jsonResponse({ ok: false, error: "Enter a valid email address." }, 400);
  }
  if ((websiteInput && !website) || website.length > 500) {
    return jsonResponse({ ok: false, error: "Please enter a valid website URL." }, 400);
  }
  if (!turnstileToken) {
    return jsonResponse({ ok: false, error: "Verification is required." }, 400);
  }

  const ip = request.headers.get("CF-Connecting-IP") || "";
  const turnstileOk = await verifyTurnstile({
    token: turnstileToken,
    secret: env.TURNSTILE_SECRET_KEY,
    ip,
  });

  if (!turnstileOk) {
    return jsonResponse({ ok: false, error: "Verification failed. Please try again." }, 400);
  }

  const submittedAt = new Date().toISOString();
  const sent = await sendPreviewRequestEmail({
    apiKey: env.RESEND_API_KEY,
    name,
    practiceName,
    specialty,
    email,
    website,
    utmCampaign,
    submittedAt,
  });

  if (!sent) {
    return jsonResponse({ ok: false, error: "Unable to send request right now." }, 502);
  }

  return jsonResponse({ ok: true, accepted: true });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      allow: "POST, OPTIONS",
    },
  });
}
