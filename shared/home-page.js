(() => {
  const defaultTheme = {
    primary: '#1E3A5F',
    primaryHover: '#16304F',
    secondarySage: '#DCE8E2',
    surfaceWarm: '#FAF8F5',
    cardBackground: '#FFFFFF',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    border: '#E2E8F0',
    success: '#2F855A',
    fontHeading: 'Inter',
    fontBody: 'Inter',
  };

  const icon = (name, cls = 'h-4 w-4') => `<i data-lucide="${name}" class="${cls}" aria-hidden="true"></i>`;
  const esc = (value) => String(value ?? '').replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
  const money = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(value || 0));
  const linkedPhoneText = (template, practice) => esc(template).replace('{phone}', `<a href="${esc(practice.phoneHref)}" class="font-medium text-inherit underline decoration-slate-300 underline-offset-4 hover:text-brand-primary">${esc(practice.phone)}</a>`);

  function financialTitle(policy) {
    if (!policy) return 'Insurance';
    if (policy.paymentModel === 'cash_only') return 'Fees & Payment';
    if (policy.paymentModel === 'out_of_network') return 'Fees & Insurance';
    return 'Insurance';
  }

  function homeContent(config) {
    return {
      navProvidersLabel: config.home?.navProvidersLabel || 'Providers',
      providerEyebrow: config.home?.providerEyebrow || 'Providers',
      providerTitle: config.home?.providerTitle || 'Meet the care team',
      providerCopy: config.home?.providerCopy || 'Warm, evidence-based care with a calm first step into treatment.',
      insuranceFallback: config.home?.insuranceFallback || 'Please contact the office to confirm insurance and payment options.',
      heroImageAlt: config.hero?.imageAlt || 'Practice hero image',
      telehealthNotice: config.location?.telehealthNotice,
    };
  }

  function applyTheme(config) {
    const theme = config.themeTokens || defaultTheme;
    document.documentElement.style.setProperty('--color-primary', theme.primary);
    document.documentElement.style.setProperty('--color-primary-hover', theme.primaryHover);
    document.documentElement.style.setProperty('--color-sage', theme.secondarySage);
    document.documentElement.style.setProperty('--color-surface', theme.surfaceWarm);
    document.documentElement.style.setProperty('--color-card', theme.cardBackground);
    document.documentElement.style.setProperty('--color-text-primary', theme.textPrimary);
    document.documentElement.style.setProperty('--color-text-secondary', theme.textSecondary);
    document.documentElement.style.setProperty('--color-border', theme.border);
    document.documentElement.style.setProperty('--color-success', theme.success);
    document.documentElement.style.setProperty('--brand-primary', theme.primary);
    document.documentElement.style.setProperty('--brand-accent', theme.success);
    document.documentElement.style.setProperty('--brand-800', theme.primaryHover);
    document.documentElement.style.setProperty('--brand-900', theme.textPrimary);
    document.documentElement.style.setProperty('--surface', theme.surfaceWarm);
    document.documentElement.style.setProperty('--font-heading', theme.fontHeading);
    document.documentElement.style.setProperty('--font-body', theme.fontBody);
    document.title = config.seo.title;
    document.querySelector('meta[name="description"]').setAttribute('content', config.seo.description);
  }

  function Header(config) {
    const { practice, hero } = config;
    const content = homeContent(config);
    return `
      <a href="#main-content" class="skip-link">Skip to main content</a>
      <header class="sticky top-0 z-50 border-b border-slate-200 bg-white/95">
        <div class="page-shell flex items-center justify-between py-3 md:py-4">
          <a href="#" class="flex items-center gap-3" aria-label="${esc(practice.name)} home">
            <div class="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-primary text-sm font-semibold text-white shadow-sm md:h-10 md:w-10 md:text-base">${esc(practice.name[0])}</div>
            <div><p class="text-base font-semibold text-slate-950">${esc(practice.name)}</p><p class="text-xs leading-5 text-slate-500">${esc(practice.tagline)}</p></div>
          </a>
          <nav class="hidden items-center gap-8 md:flex" aria-label="Primary navigation">
            <a href="#providers" class="nav-link">${esc(content.navProvidersLabel)}</a><a href="#conditions" class="nav-link">Conditions</a><a href="#insurance" class="nav-link">${esc(financialTitle(config.financialPolicy))}</a><a href="#faq" class="nav-link">FAQ</a>
            <a href="#contact" class="btn-primary px-4 py-2.5 text-sm">${esc(hero.primaryCta)}</a>
          </nav>
          <a href="#contact" class="btn-secondary min-h-[44px] px-3 py-2 text-sm md:hidden">Contact</a>
        </div>
      </header>`;
  }

  function HeroSection(config) {
    const { practice, hero } = config;
    const content = homeContent(config);
    return `
      <section class="fade-in-up relative isolate min-h-[680px] overflow-hidden bg-warm-50 sm:min-h-[760px]">
        <img src="${esc(hero.image)}" alt="${esc(content.heroImageAlt)}" class="image-treatment absolute inset-0 -z-20 h-full w-full object-cover object-[62%_center]" />
        <div class="absolute inset-0 -z-10 bg-gradient-to-r from-warm-50/90 via-white/55 to-sage-50/20 sm:from-warm-50/95 sm:via-white/45 sm:to-transparent"></div>
        <div class="absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-gradient-to-t from-warm-50/55 via-white/10 to-transparent"></div>
        <div class="page-shell flex min-h-[680px] flex-col justify-center py-16 sm:min-h-[760px] lg:py-24">
          <div class="max-w-4xl space-y-6">
            <div class="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white/85 px-4 py-2.5 text-sm font-semibold text-brand-primary sm:px-5 sm:py-3 sm:text-base">
              <span class="icon-chip h-8 w-8 rounded-full">${icon('MapPin')}</span> ${esc(practice.locationLabel)}
            </div>
            <div class="max-w-4xl rounded-[32px] border border-slate-200 bg-white/85 p-6 sm:p-8 lg:bg-white/80">
              <h1 class="max-w-3xl text-[2.5rem] font-semibold leading-[1.04] tracking-tight text-slate-950 sm:text-5xl md:text-6xl lg:text-7xl">${esc(hero.title)}</h1>
              <p class="mt-6 max-w-2xl text-lg leading-8 text-slate-700 sm:text-xl sm:leading-9 md:text-2xl md:leading-10">${esc(hero.copy)}</p>
              <div class="mt-8 flex flex-col gap-4 sm:flex-row">
                <a href="#contact" class="btn-primary w-full sm:w-auto">${icon('CalendarCheck')} ${esc(hero.primaryCta)}</a>
                <a href="#providers" class="btn-secondary w-full sm:w-auto">${esc(hero.secondaryCta)}</a>
              </div>
            </div>
          </div>
        </div>
      </section>`;
  }

  function TrustStrip({ trustItems }) {
    if (!trustItems?.length) return '';
    return `<section class="border-y border-white/60 bg-gradient-to-r from-warm-50 via-white to-sage-50"><div class="page-shell grid grid-cols-1 gap-3 py-6 sm:grid-cols-2 md:grid-cols-4 md:py-8">${trustItems.map(item => `
      <div class="reassurance-row">${icon(item.icon, 'h-4 w-4 text-brand-accent')}<span>${esc(item.text)}</span></div>`).join('')}</div></section>`;
  }

  function ProviderGrid(config) {
    const { providers } = config;
    if (!providers?.length) return '';
    const content = homeContent(config);
    return `<section id="providers" class="section border-t border-white/60 bg-warm-50"><div class="section-shell"><div class="max-w-2xl"><p class="eyebrow">${esc(content.providerEyebrow)}</p><h2 class="section-title">${esc(content.providerTitle)}</h2><p class="section-copy">${esc(content.providerCopy)}</p></div><div class="mt-12 grid grid-cols-1 gap-y-8 gap-x-6 md:grid-cols-2">${providers.map(provider => `
      <article class="fade-in-up editorial-card interactive-card"><div class="aspect-[5/4] overflow-hidden rounded-[28px]"><img loading="lazy" src="${esc(provider.image)}" alt="${esc(provider.name)}" class="image-treatment h-full w-full object-cover object-top" /></div><div class="mt-6"><h3 class="text-2xl font-semibold text-slate-950">${esc(provider.name)}</h3><p class="mt-1 text-sm leading-6 text-slate-500">${esc(provider.credentials)}</p><p class="mt-4 text-lg leading-8 text-slate-700">${esc(provider.cardDescription || '')}</p><div class="mt-5 flex flex-wrap gap-2">${(provider.specialties || []).map(s => `<span class="badge-brand">${icon('CheckCircle', 'h-3.5 w-3.5')} ${esc(s)}</span>`).join('')}</div><a href="./providers/${esc(provider.slug)}/" class="btn-secondary mt-6 px-4 py-2.5 text-sm">View Profile<span class="sr-only"> for ${esc(provider.name)}</span></a></div></article>`).join('')}</div></div></section>`;
  }

  function BotanicalAccent() {
    return `<svg aria-hidden="true" class="conditions-leaf pointer-events-none absolute right-4 top-8 h-72 w-72 text-slate-950 opacity-[0.05] md:right-12 md:top-12" viewBox="0 0 220 220" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M109 188C109 133 109 76 109 32" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M109 82C86 58 64 47 42 49C45 74 62 91 109 102" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M110 110C139 78 164 66 190 69C186 98 165 119 110 132" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M109 145C82 120 58 109 35 113C40 140 61 158 109 166" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }

  function ConditionsSection({ conditions, conditionsIntro }) {
    return `<section id="conditions" class="section relative overflow-hidden border-t border-white/60 bg-warm-50">${BotanicalAccent()}<div class="section-shell relative"><div class="max-w-3xl"><p class="eyebrow">Areas of care</p><h2 class="section-title">Conditions We Treat</h2><p class="section-copy">${esc(conditionsIntro)}</p></div><ul class="mt-14 grid grid-cols-1 gap-x-12 sm:grid-cols-2 lg:grid-cols-3" aria-label="Conditions treated">${conditions.map(condition => `<li class="border-t border-slate-200 py-5"><h3 class="text-lg font-semibold tracking-tight text-slate-950">${esc(condition)}</h3></li>`).join('')}</ul></div></section>`;
  }

  function InsuranceCoverageSection(config) {
    const { insurance, practice } = config;
    if (!insurance?.enabled) return '';
    const coverageBadges = (insurance.coverage_types || []).map(type => `<span class="badge-brand px-5 py-2.5 text-[0.95rem]">${esc(type)}</span>`).join('');
    const carriers = insurance.carrier_sentence
      ? `<p class="mt-6 max-w-[800px] text-[0.95rem] leading-[1.6] text-slate-600 opacity-85">${esc(insurance.carrier_sentence)}</p>`
      : '';
    const verification = insurance.verification?.enabled
      ? `<div class="mt-6 max-w-[800px] rounded-[28px] border border-slate-200 bg-warm-50 p-6 md:px-8 md:py-6"><h3 class="text-xl font-semibold tracking-tight text-slate-950">${esc(insurance.verification.headline)}</h3><p class="mt-3 text-base leading-7 text-slate-700">${linkedPhoneText(insurance.verification.description || '', practice)}</p></div>`
      : '';
    return `<section id="insurance" class="section border-t border-white/60 bg-sage-100"><div class="section-shell soft-card p-8 md:p-12"><div class="max-w-3xl"><p class="eyebrow">${esc(insurance.section_label || '')}</p><h2 class="section-title">${esc(insurance.headline || '')}</h2><p class="mt-6 text-lg leading-8 text-slate-600">${esc(insurance.summary || '')}</p></div>${coverageBadges ? `<div class="mt-6"><p class="text-[0.95rem] font-medium leading-[1.6] text-slate-600 opacity-85">Accepted coverage types</p><div class="mt-3 flex flex-wrap gap-3">${coverageBadges}</div></div>` : ''}${carriers}${verification}${insurance.disclaimer ? `<p class="mt-6 text-sm leading-6 text-slate-500">${esc(insurance.disclaimer)}</p>` : ''}</div></section>`;
  }

  function PricingTable(rates) {
    if (!rates?.length) return '';
    return `<div class="overflow-hidden rounded-[28px] border border-slate-200 bg-white"><div class="grid grid-cols-12 gap-4 border-b border-slate-100 bg-slate-50/80 px-5 py-4 text-sm font-semibold uppercase tracking-wide text-slate-500"><div class="col-span-7">Service</div><div class="col-span-2 text-right">Duration</div><div class="col-span-3 text-right">Fee</div></div>${rates.map(rate => `<div class="grid grid-cols-12 gap-4 border-b border-slate-100 px-5 py-5 last:border-b-0"><div class="col-span-12 text-lg font-semibold text-slate-950 sm:col-span-7">${esc(rate.name)}</div><div class="col-span-5 text-base text-slate-600 sm:col-span-2 sm:text-right">${rate.durationMinutes ? `${esc(rate.durationMinutes)} min` : '—'}</div><div class="col-span-7 text-right text-lg font-semibold text-brand-primary sm:col-span-3">${money(rate.price)}</div></div>`).join('')}</div>`;
  }

  function ContactForRatesCard(config, policy) {
    const message = policy.contactForRatesMessage || 'Please call our office for current rates and payment options.';
    return `<div class="mt-6 max-w-[800px] rounded-[28px] border border-slate-200 bg-warm-50 p-6 md:px-8 md:py-6"><h3 class="text-xl font-semibold tracking-tight text-slate-950">Questions about fees or payment?</h3><p class="mt-3 text-base leading-7 text-slate-700">${esc(message)}</p><a href="${esc(config.practice.phoneHref)}" class="btn-secondary mt-5 px-4 py-2.5 text-sm">${icon('Phone')} ${esc(config.practice.phone)}</a></div>`;
  }

  function paymentMethodIcon(method) {
    const value = String(method || '').toLowerCase();
    if (value.includes('cash')) return 'Banknote';
    if (value.includes('check')) return 'FileCheck';
    return 'CreditCard';
  }

  function PaymentMethods(methods) {
    if (!methods?.length) return '';
    return `<div class="mt-6"><p class="text-[0.95rem] font-medium leading-[1.6] text-slate-600 opacity-85">Accepted payment methods</p><div class="mt-3 flex flex-wrap gap-3">${methods.map(method => `<span class="badge-brand px-5 py-2.5 text-[0.95rem]">${icon(paymentMethodIcon(method), 'h-3.5 w-3.5')} ${esc(method)}</span>`).join('')}</div></div>`;
  }

  function FinancialPolicySection(config) {
    const policy = config.financialPolicy;
    if (!policy) return InsuranceCoverageSection(config);
    if (['insurance', 'hybrid'].includes(policy.paymentModel) && config.insurance?.enabled) return InsuranceCoverageSection(config);
    const title = financialTitle(policy);
    const intro = {
      cash_only: ['Private Pay Practice', 'This practice operates on a self-pay basis and does not participate in insurance networks.'],
      out_of_network: ['Out-of-Network Insurance', 'This practice is out-of-network with insurance providers.'],
      hybrid: ['Insurance & Self-Pay Options', 'This practice accepts select insurance plans and also offers self-pay options.'],
      insurance: ['Insurance', 'Please contact the office to confirm insurance and payment options.'],
    }[policy.paymentModel] || ['Payment Information', 'Please contact the office to confirm insurance and payment options.'];
    const pricing = policy.pricingDisplay === 'published'
      ? PricingTable(policy.rates || [])
      : policy.pricingDisplay === 'contact_for_rates'
        ? ContactForRatesCard(config, policy)
        : '';
    return `<section id="insurance" class="section border-t border-white/60 bg-sage-100"><div class="section-shell soft-card p-8 md:p-12"><div class="max-w-3xl"><p class="eyebrow">${esc(title)}</p><h2 class="section-title">${esc(intro[0])}</h2><p class="mt-6 text-lg leading-8 text-slate-600">${esc(intro[1])}</p></div>${PaymentMethods(policy.paymentMethods)}${pricing}${policy.superbillAvailable ? `<p class="mt-6 max-w-[800px] text-sm leading-6 text-slate-500">Superbills are available for patients seeking reimbursement through out-of-network benefits.</p>` : ''}</div></section>`;
  }

  function FAQSection({ faqs }) {
    return `<section id="faq" class="section border-t border-white/60 bg-warm-50"><div class="mx-auto max-w-4xl"><div class="max-w-2xl"><p class="eyebrow">FAQ</p><h2 class="section-title">Common questions</h2></div><div class="mt-12 soft-card divide-y divide-slate-100/80 overflow-hidden">${faqs.map((faq, index) => `<details class="group p-7 transition-all duration-300 hover:bg-white/70" ${index === 0 ? 'open' : ''}><summary class="flex min-h-[44px] cursor-pointer list-none items-center justify-between rounded-xl text-base font-semibold text-slate-950 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-300">${esc(faq.question)}<span class="icon-chip h-8 w-8 transition duration-300 group-open:rotate-45" aria-hidden="true">+</span></summary><p class="mt-4 text-base leading-7 text-slate-600">${esc(faq.answer)}</p></details>`).join('')}</div></div></section>`;
  }

  function ContactSection({ contact, hero }) {
    return `<section id="contact" class="fade-in-up section relative overflow-hidden border-t border-white/60 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-primary py-20" aria-labelledby="contact-title"><div class="section-shell relative grid grid-cols-1 gap-12 lg:grid-cols-2"><div><p class="text-sm font-semibold uppercase tracking-wide text-sage-100">${esc(contact.eyebrow)}</p><h2 id="contact-title" class="mt-4 text-3xl font-semibold leading-tight tracking-tight text-white md:text-5xl">${esc(contact.title)}</h2><p class="mt-6 max-w-2xl text-lg leading-8 text-slate-300">${esc(contact.copy)}</p></div><form class="dark-section-card p-7 md:p-8" aria-describedby="contact-disclaimer"><div class="grid grid-cols-1 gap-6 sm:grid-cols-2"><div><label for="first-name" class="form-label">First name</label><input id="first-name" name="first-name" autocomplete="given-name" class="form-control" placeholder="Jane" /></div><div><label for="last-name" class="form-label">Last name</label><input id="last-name" name="last-name" autocomplete="family-name" class="form-control" placeholder="Doe" /></div><div class="sm:col-span-2"><label for="email" class="form-label">Email</label><input id="email" name="email" type="email" autocomplete="email" class="form-control" placeholder="jane@example.com" /></div><div class="sm:col-span-2"><label for="message" class="form-label">What can we help with?</label><textarea id="message" name="message" rows="4" class="form-control" placeholder="Briefly describe what you are looking for..."></textarea></div></div><button type="submit" class="btn-primary mt-6 w-full">${icon('CalendarCheck')} ${esc(hero.primaryCta)}</button><p id="contact-disclaimer" class="mt-4 text-sm leading-6 text-slate-500">${esc(contact.disclaimer)}</p></form></div></section>`;
  }

  function officeStatus(location) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: location.timeZone,
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date());
    const value = (type) => parts.find(part => part.type === type)?.value;
    const today = location.weeklyHours?.[value('weekday')];

    if (!today) return { label: 'Call for Hours', className: 'bg-slate-100 text-slate-600' };
    if (today.closed) return { label: 'Closed Today', className: 'bg-slate-100 text-slate-600' };
    if (today.telehealthOnly) return { label: 'Telehealth Today', className: 'bg-sage-50 text-brand-accent' };
    if (!today.open || !today.close) return { label: 'Call for Hours', className: 'bg-slate-100 text-slate-600' };

    const nowMinutes = Number(value('hour')) * 60 + Number(value('minute'));
    const toMinutes = (time) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };
    const isOpen = nowMinutes >= toMinutes(today.open) && nowMinutes < toMinutes(today.close);
    return isOpen
      ? { label: 'Open Now', className: 'bg-sage-50 text-brand-accent' }
      : { label: 'Closed Now', className: 'bg-slate-100 text-slate-600' };
  }

  function TelehealthNotice(config) {
    const notice = homeContent(config).telehealthNotice;
    if (!notice) return '';
    return `<div class="mt-8 rounded-[28px] border border-white/60 bg-sage-50 p-5"><p class="flex items-center gap-3 text-sm font-semibold text-brand-accent"><span class="icon-chip bg-white/80">${icon('Video')}</span> ${esc(notice)}</p></div>`;
  }

  function LocationSection(config, options = {}) {
    const { practice, location } = config;
    const status = options.staticOfficeStatus
      ? { label: 'Hours Listed', className: 'bg-slate-100 text-slate-600' }
      : officeStatus(location);
    return `<section id="location" class="section border-t border-white/60 bg-warm-100"><div class="section-shell"><div class="max-w-2xl"><p class="eyebrow">Visit the office</p><h2 class="section-title">${esc(location.title)}</h2></div><div class="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2"><div class="soft-card overflow-hidden"><div class="relative h-72 overflow-hidden"><img src="${esc(location.officeImage)}" alt="${esc(location.officeImageAlt)}" loading="lazy" class="image-treatment h-full w-full object-cover" /><div class="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-950/15 to-transparent" aria-hidden="true"></div></div><div class="p-8"><h3 class="text-2xl font-semibold tracking-tight text-slate-950">${esc(practice.name)}</h3><div class="mt-6 space-y-5 text-base leading-7 text-slate-600"><div class="flex gap-3"><span class="icon-chip">${icon('MapPin')}</span><div><p class="font-semibold text-slate-950">Address</p>${practice.addressLines.map(line => `<p>${esc(line)}</p>`).join('')}</div></div><div class="flex gap-3"><span class="icon-chip">${icon('Phone')}</span><div><p class="font-semibold text-slate-950">Phone</p><p>${esc(practice.phone)}</p></div></div><div class="flex gap-3"><span class="icon-chip">${icon('Mail')}</span><div><p class="font-semibold text-slate-950">Email</p><p>${esc(practice.email)}</p></div></div></div><div class="mt-8 flex flex-col gap-3 sm:flex-row"><a href="${esc(location.directionsHref)}" class="btn-primary">${icon('MapPin')} Get Directions</a><a href="${esc(practice.phoneHref)}" class="btn-secondary">Call Office</a></div></div></div><div class="soft-card p-8"><div class="flex items-center justify-between gap-3"><h3 class="flex items-center gap-2 whitespace-nowrap text-xl font-semibold tracking-tight text-slate-950 sm:gap-3 sm:text-2xl"><span class="icon-chip h-9 w-9 sm:h-10 sm:w-10">${icon('Clock3', 'h-5 w-5')}</span> Office Hours</h3><span class="whitespace-nowrap rounded-full px-3 py-1 text-sm font-medium ${esc(status.className)}" data-office-status data-time-zone="${esc(location.timeZone)}" data-weekly-hours="${esc(JSON.stringify(location.weeklyHours || {}))}">${esc(status.label)}</span></div><div class="mt-8 space-y-5">${location.hours.map(([day, hours], index) => `<div class="${index === location.hours.length - 1 ? 'flex items-center justify-between' : 'hours-row'}"><p class="text-base font-medium text-slate-700">${esc(day)}</p><p class="text-base font-semibold text-slate-950">${esc(hours)}</p></div>`).join('')}</div>${TelehealthNotice(config)}</div></div></div></section>`;
  }

  function FooterSection({ practice, footer }) {
    const address = practice.addressLines.map(line => `<p>${esc(line)}</p>`).join('');
    return `<footer class="border-t border-white/60 bg-warm-200 px-6 py-12 lg:px-8"><div class="mx-auto flex max-w-7xl flex-col gap-8 border-t border-white/60 pt-8 md:flex-row md:items-center md:justify-between"><div><p class="text-base font-semibold text-slate-950">${esc(practice.name)}</p><div class="mt-2 text-sm leading-6 text-slate-500">${address}<p>${esc(practice.phone)}</p></div></div><div class="flex gap-6 text-sm font-medium text-slate-600">${footer.links.map(link => `<a class="transition hover:text-slate-950" href="#">${esc(link)}</a>`).join('')}</div></div></footer>`;
  }

  function StickyMobileCta({ practice, hero }) {
    return `<div class="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white p-3 md:hidden"><div class="mx-auto grid max-w-md grid-cols-2 gap-3"><a href="#contact" class="btn-primary min-h-[44px] px-3 py-2 text-sm">${esc(hero.primaryCta)}</a><a href="${esc(practice.phoneHref)}" class="btn-secondary min-h-[44px] px-3 py-2 text-sm">Call Office</a></div></div>`;
  }

  function schema(config) {
    const data = {
      '@context': 'https://schema.org',
      '@type': 'MedicalClinic',
      name: config.practice.name,
      telephone: config.practice.phone,
      email: config.practice.email,
      address: config.practice.addressLines.join(', '),
      image: config.hero.image,
      medicalSpecialty: config.conditions,
    };
    return '<' + 'script type="application/ld+json">' + JSON.stringify(data).replace(/</g, '\\u003c') + '<' + '/script>';
  }

  function render(config, options = {}) {
    applyTheme(config);
    document.getElementById('app').innerHTML = `
      ${Header(config)}
      <main id="main-content" tabindex="-1">
        ${HeroSection(config)}
        ${TrustStrip(config)}
        ${ProviderGrid(config)}
        ${ConditionsSection(config)}
        ${FinancialPolicySection(config)}
        ${ContactSection(config)}
        ${LocationSection(config, options)}
        ${FAQSection(config)}
      </main>
      ${FooterSection(config)}
      ${StickyMobileCta(config)}
      ${schema(config)}
    `;
    lucide.createIcons();
  }

  window.FrontdoorHome = { render };
})();
