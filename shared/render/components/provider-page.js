const { esc, escMultiline, icon, jsonLd } = require('../html');
const { appointmentSection } = require('./contact');
const { copyEmailScript } = require('../runtime-scripts');
const { absoluteUrl, canonicalUrl, relFromProvider } = require('../urls');
const { canonicalLink, robotsMeta } = require('../seo');
const { resolveTheme, themeCss } = require('../theme');

function chips(values, cls = 'badge-brand') {
  return (values || []).map(value => `<span class="${cls}">${esc(value)}</span>`).join('');
}

function checkChips(values, cls = 'badge-brand') {
  return (values || []).map(value => `<span class="${cls}">${icon('CheckCircle', 'h-3.5 w-3.5')} ${esc(value)}</span>`).join('');
}

function listCards(values) {
  return (values || []).map(value => (
    `<li class="flex min-h-[72px] items-center rounded-2xl border border-slate-200 bg-white p-5 text-base font-semibold leading-6 text-slate-800">${esc(value)}</li>`
  )).join('');
}

function careSteps(values) {
  return (values || []).map(value => (
    `<li class="flex gap-3 text-base leading-7 text-slate-700 md:text-lg md:leading-8"><span class="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-accent" aria-hidden="true"></span><span>${esc(value)}</span></li>`
  )).join('');
}

function isPsychiatry(_config, provider) {
  const haystack = [provider.specialty || '', provider.credentials || ''].join(' ').toLowerCase();
  return haystack.includes('psychiat');
}

function defaultExpectations(config, provider) {
  if (isPsychiatry(config, provider)) {
    return [
      'Thoughtful conversations about symptoms, stressors, and goals',
      'A clear treatment plan that may include medication and follow-up care',
      'A supportive setting for questions from patients and families',
    ];
  }
  return [
    'Thorough evaluation of breathing, sleep, and respiratory symptoms',
    'Clear communication about diagnosis, testing, and next steps',
    'Long-term treatment planning for chronic lung conditions',
  ];
}

function educationRows(provider) {
  const education = provider.education || {};
  const labels = [
    ['Board Certification', provider.certifications],
    ['Medical School', education.medicalSchool],
    ['Residency', education.residency],
    ['Fellowship', education.fellowship],
  ];
  return labels.map(([label, value]) => {
    if (!value) return '';
    const values = Array.isArray(value) ? value : [value];
    return `<div class="rounded-3xl border border-slate-200 bg-white p-6 md:p-7"><p class="text-xs font-semibold uppercase tracking-wide text-brand-accent">${esc(label)}</p><div class="mt-3 space-y-1.5 text-base leading-7 text-slate-700">${values.map(item => `<p>${escMultiline(item)}</p>`).join('')}</div></div>`;
  }).join('');
}

function providerProfileLabels(config, providerName) {
  const parts = String(providerName || '').split(/\s+/).filter(Boolean);
  const lastName = parts[parts.length - 1] || 'Provider';
  const defaults = {
    bookAppointment: 'Book Appointment',
    callOffice: 'Call Office',
    providers: 'Providers',
    conditions: 'Conditions',
    requestCare: 'Request care',
    requestAppointment: 'Request Appointment',
    conditionsTreated: 'Conditions Treated',
    treatmentServices: 'Treatment Services',
    educationTraining: 'Education & Training',
    hospitalAffiliations: 'Hospital Affiliations',
    hospitalAffiliationsIntro: 'Hospital and clinical affiliations.',
    professionalAffiliations: 'Professional Affiliations',
    howProviderHelps: `How Dr. ${lastName} helps`,
    telehealthAvailable: 'Telehealth available',
  };
  return { ...defaults, ...(config.providerProfileLabels || {}) };
}

function practiceTelehealthAvailable(config) {
  const location = config.location || {};
  if (location.telehealthNotice) return true;
  return Object.values(location.weeklyHours || {}).some(day => day.telehealthOnly === true);
}

function providerTelehealthAvailable(config, provider) {
  if (typeof provider.telehealthOverride === 'boolean') return provider.telehealthOverride;
  return practiceTelehealthAvailable(config);
}

function heroTrustItems(config, provider) {
  if (provider.heroTrustItems) return provider.heroTrustItems.slice(0, 3);
  const specialty = provider.specialty || String(provider.credentials || '').split('·').pop().trim();
  const certifications = provider.certifications || [];
  const affiliations = provider.hospitalAffiliations || provider['Hospital Affiliations'] || provider.affiliations || [];
  const items = [];

  if (certifications.length) {
    items.push(isPsychiatry(config, provider) ? 'Board Certified Psychiatrist' : certifications[0]);
  } else if (specialty) {
    items.push(specialty);
  }

  if (affiliations.length && !isPsychiatry(config, provider)) {
    items.push(affiliations[0]);
  } else if (providerTelehealthAvailable(config, provider)) {
    items.push('Telehealth Available');
  }

  if (provider.acceptsNewPatients !== false) items.push('Accepting New Patients');
  return items.slice(0, 3);
}

function providerPage(config, provider) {
  const practice = config.practice;
  const contactOverride = provider.contactOverride || {};
  const theme = resolveTheme(config);
  const name = provider.name || 'Provider';
  const labels = providerProfileLabels(config, name);
  const title = `${name} | ${practice.name}`;
  const heroTitle = provider.heroTitle || '';
  const description = provider.tagline || config.seo?.description || '';
  const conditions = provider.conditions || provider.specialties || config.conditions || [];
  const services = provider.services || ['Evaluation', 'Treatment Planning', 'Ongoing Care'];
  const bioParagraphs = provider.bioParagraphs || [];
  const expectations = provider.whatToExpect || defaultExpectations(config, provider);
  const hospitalAffiliations = provider.hospitalAffiliations || provider['Hospital Affiliations'] || [];
  const professionalAffiliations = provider.affiliations || [];
  const academic = provider.academicAppointments || [];
  const awards = provider.awards || [];
  const professionalCredentials = [...professionalAffiliations, ...academic, ...awards];
  const phone = contactOverride.phone || practice.phone || '';
  const phoneHref = contactOverride.phoneHref || practice.phoneHref || '';
  const email = contactOverride.email || practice.email || '';
  const officeLines = contactOverride.addressLines || practice.addressLines || [];
  const office = officeLines.join(', ');
  const appointmentUrl = provider.appointmentUrl || practice.defaultAppointmentUrl || '';
  const patientPortalUrl = practice.patientPortalUrl || '';
  const emergencyNotice = practice.emergencyNotice || '';
  const specialty = provider.specialty || String(provider.credentials || '').split('·').pop().trim();
  const aboutHeading = provider.aboutHeading || (isPsychiatry(config, provider) ? 'Personalized Psychiatric Care' : 'Individualized Pulmonary Care');
  const providerSlug = provider.slug || '';
  const heroTitleHtml = heroTitle ? `<p class="mt-4 text-lg font-semibold text-brand-primary">${esc(heroTitle)}</p>` : '';
  const education = educationRows(provider) || '<div class="soft-card rounded-3xl p-6 text-lg leading-8 text-slate-700 md:p-7">Please contact the office for additional training details.</div>';

  let affiliationSection = '';
  if (hospitalAffiliations.length) {
    affiliationSection = `<section class="bg-warm-50 px-6 py-12 lg:px-8 lg:py-20"><div class="mx-auto max-w-6xl"><div class="soft-card rounded-3xl p-6 md:p-8"><h2 class="text-4xl font-bold leading-tight tracking-tight text-slate-950 md:text-5xl">${esc(labels.hospitalAffiliations)}</h2><p class="mt-3 text-base text-slate-600">${esc(labels.hospitalAffiliationsIntro)}</p><ul class="mt-7 grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">${listCards(hospitalAffiliations)}</ul></div></div></section>`;
  } else if (professionalCredentials.length && !isPsychiatry(config, provider)) {
    affiliationSection = `<section class="bg-warm-50 px-6 py-12 lg:px-8 lg:py-20"><div class="mx-auto max-w-6xl"><div class="soft-card rounded-3xl p-6 md:p-8"><h2 class="text-4xl font-bold leading-tight tracking-tight text-slate-950 md:text-5xl">${esc(labels.professionalAffiliations)}</h2><ul class="mt-7 grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">${listCards(professionalCredentials)}</ul></div></div></section>`;
  }

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Physician',
    name,
    url: canonicalUrl(config, `providers/${providerSlug}`),
    medicalSpecialty: specialty,
    image: absoluteUrl(config, provider.image),
    telephone: phone,
    email,
    address: office,
    worksFor: {
      '@type': 'MedicalClinic',
      name: practice.name,
      url: canonicalUrl(config),
    },
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />
${robotsMeta(config)}${canonicalLink(config, `providers/${providerSlug}`)}  <link rel="stylesheet" href="../../assets/styles.css" />
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>:root{${themeCss(theme)}}</style>
</head>
<body class="bg-surface pb-24 font-sans text-slate-950 antialiased md:pb-0">
  <a href="#main-content" class="skip-link">Skip to main content</a>
  <header class="sticky top-0 z-50 border-b border-slate-200 bg-white/95">
    <div class="page-shell flex items-center justify-between py-3 md:py-4">
      <a href="../../" class="flex items-center gap-3" aria-label="${esc(practice.name)} home"><div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-primary text-base font-semibold text-white shadow-sm">${esc(practice.name[0])}</div><div><p class="text-base font-semibold text-slate-950">${esc(practice.name)}</p><p class="text-xs leading-5 text-slate-500">${esc(practice.tagline)}</p></div></a>
      <nav class="hidden items-center gap-8 md:flex" aria-label="Provider navigation"><a href="../../#providers" class="nav-link">${esc(labels.providers)}</a><a href="../../#conditions" class="nav-link">${esc(labels.conditions)}</a><a href="#appointment" class="btn-primary px-4 py-2.5 text-sm">${esc(labels.bookAppointment)}</a></nav>
      <a href="${esc(phoneHref)}" class="btn-secondary min-h-[44px] px-3 py-2 text-sm md:hidden">${esc(labels.callOffice)}</a>
    </div>
  </header>
  <main id="main-content" tabindex="-1">
    <section class="section bg-warm-50">
      <div class="section-shell">
        <nav class="mb-8 text-sm font-medium text-slate-500" aria-label="Breadcrumb"><a class="hover:text-slate-950" href="../../">Home</a><span class="mx-2">/</span><a class="hover:text-slate-950" href="../../#providers">Providers</a><span class="mx-2">/</span><span class="text-slate-800">${esc(name)}</span></nav>
        <div class="grid grid-cols-1 gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div class="mx-auto w-full max-w-md lg:max-w-none"><div class="aspect-[4/5] overflow-hidden rounded-[36px] border border-slate-200 bg-white"><img src="${esc(relFromProvider(provider.image))}" alt="Portrait of ${esc(name)}" class="image-treatment h-full w-full object-cover object-top" width="720" height="900" /></div></div>
          <div class="soft-card rounded-3xl p-8 md:p-10">
            <h1 class="text-4xl font-bold leading-tight tracking-tight text-slate-950 md:text-6xl">${esc(name)}</h1>
            ${heroTitleHtml}
            <p class="mt-6 max-w-2xl text-lg leading-8 text-slate-700">${esc(provider.tagline || description)}</p>
            <div class="mt-8 flex flex-wrap gap-2">${checkChips(heroTrustItems(config, provider))}</div>
            <div class="mt-8 flex flex-col gap-3 sm:flex-row"><a href="#appointment" class="btn-primary">${esc(labels.bookAppointment)}</a><a href="${esc(phoneHref)}" class="btn-secondary">${esc(labels.callOffice)}</a></div>
          </div>
        </div>
      </div>
    </section>
    <section class="bg-white px-6 py-12 lg:px-8 lg:py-20"><div class="mx-auto max-w-6xl"><h2 class="max-w-3xl text-4xl font-bold leading-tight tracking-tight text-slate-950 md:text-5xl">${esc(aboutHeading)}</h2><div class="mt-7 max-w-3xl space-y-5 text-lg leading-9 text-slate-700 md:text-xl md:leading-10">${bioParagraphs.slice(0, 2).map(paragraph => `<p>${esc(paragraph)}</p>`).join('')}</div><div class="mt-10 max-w-3xl rounded-3xl bg-warm-50 p-6 md:p-8"><h3 class="text-xl font-bold tracking-tight text-slate-950 md:text-2xl">${esc(labels.howProviderHelps)}</h3><ul class="mt-5 space-y-4">${careSteps(expectations)}</ul></div></div></section>
    <section class="bg-warm-50 px-6 py-12 lg:px-8 lg:py-20"><div class="mx-auto max-w-6xl"><h2 class="text-4xl font-bold leading-tight tracking-tight text-slate-950 md:text-5xl">${esc(labels.conditionsTreated)}</h2><ul class="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3">${listCards(conditions)}</ul></div></section>
    <section class="bg-white px-6 py-12 lg:px-8 lg:py-20"><div class="mx-auto max-w-6xl"><h2 class="text-4xl font-bold leading-tight tracking-tight text-slate-950 md:text-5xl">${esc(labels.treatmentServices)}</h2><ul class="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3">${listCards(services)}</ul></div></section>
    <section class="bg-warm-50 px-6 py-12 lg:px-8 lg:py-20"><div class="mx-auto max-w-6xl"><h2 class="text-4xl font-bold leading-tight tracking-tight text-slate-950 md:text-5xl">${esc(labels.educationTraining)}</h2><div class="mt-7 grid grid-cols-1 gap-4 md:grid-cols-2">${education}</div></div></section>${affiliationSection}
    ${appointmentSection({ appointmentUrl, patientPortalUrl, phone, phoneHref, email, emergencyNotice, sectionId: 'appointment' })}
  </main>
  <div class="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white p-3 md:hidden"><div class="mx-auto grid max-w-md grid-cols-2 gap-3"><a href="#appointment" class="btn-primary min-h-[44px] px-3 py-2 text-sm">${esc(labels.bookAppointment)}</a><a href="${esc(phoneHref)}" class="btn-secondary min-h-[44px] px-3 py-2 text-sm">${esc(labels.callOffice)}</a></div></div>
  <div data-copy-toast class="pointer-events-none fixed inset-x-4 bottom-24 z-[60] mx-auto hidden max-w-sm rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-950 shadow-lg md:bottom-6" role="status" aria-live="polite">Email copied</div>
  <script type="application/ld+json">${jsonLd(schema)}</script>
  ${copyEmailScript()}
  <script>lucide.createIcons();</script>
</body>
</html>
`;
}

module.exports = {
  providerPage,
};
