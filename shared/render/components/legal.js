const { esc } = require('../html');
const { canonicalLink, robotsMeta } = require('../seo');

function legalShell({ config, slug, title, description, body }) {
  const practice = config.practice || {};
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(title)} | ${esc(practice.name)}</title>
  <meta name="description" content="${esc(description)}" />
${robotsMeta(config)}${canonicalLink(config, slug)}  <link rel="stylesheet" href="../assets/styles.css" />
</head>
<body class="bg-surface font-sans text-slate-950 antialiased">
  <main class="section min-h-screen bg-warm-50">
    <div class="section-shell max-w-3xl">
      <p class="eyebrow">${esc(title)}</p>
      <h1 class="section-title">${esc(title)}</h1>
      <div class="soft-card mt-10 space-y-8 p-8 md:p-10">
        ${body}
        <section class="border-t border-slate-200 pt-8">
          <h2 class="text-2xl font-semibold tracking-tight text-slate-950">Contact Information</h2>
          <div class="mt-4 space-y-2 text-base leading-7 text-slate-600">
            <p><span class="font-semibold text-slate-950">Phone:</span> ${esc(practice.phone)}</p>
            <p><span class="font-semibold text-slate-950">Email:</span> ${esc(practice.email)}</p>
          </div>
        </section>
      </div>
    </div>
  </main>
  <footer class="border-t border-white/60 bg-warm-200 px-6 py-10 lg:px-8"><nav class="mx-auto flex max-w-7xl justify-center gap-8 text-sm font-medium text-slate-600" aria-label="Footer navigation"><a class="transition hover:text-slate-950" href="../privacy/">Privacy</a><a class="transition hover:text-slate-950" href="../accessibility/">Accessibility</a></nav></footer>
</body>
</html>
`;
}

function privacyPage(config) {
  const practice = config.practice || {};
  return legalShell({
    config,
    slug: 'privacy',
    title: 'Privacy',
    description: `Privacy information for ${practice.name || 'the practice'}.`,
    body: `<section class="space-y-4 text-base leading-7 text-slate-600">
          <h2 class="text-2xl font-semibold tracking-tight text-slate-950">${esc(practice.name)}</h2>
          <p>This website provides general information about the practice and may include contact information, office details, provider information, and links to third-party appointment or patient portal systems.</p>
          <p>Appointment requests and patient portal activity may be handled by third-party systems. Please avoid sending medical information by email or through unsecured communication channels.</p>
          <p>If you have questions about privacy or how to contact the office, please use the contact information below.</p>
        </section>`,
  });
}

function accessibilityPage(config) {
  const practice = config.practice || {};
  return legalShell({
    config,
    slug: 'accessibility',
    title: 'Accessibility',
    description: `Accessibility information for ${practice.name || 'the practice'}.`,
    body: `<section class="space-y-4 text-base leading-7 text-slate-600">
          <h2 class="text-2xl font-semibold tracking-tight text-slate-950">${esc(practice.name)}</h2>
          <p>The practice is committed to providing an accessible website experience for patients, families, and visitors.</p>
          <p>If you experience difficulty accessing information on this website, please contact the office so the team can assist you.</p>
          <p>This website may be updated over time as accessibility, usability, and content improvements are made.</p>
        </section>`,
  });
}

module.exports = {
  accessibilityPage,
  privacyPage,
};
