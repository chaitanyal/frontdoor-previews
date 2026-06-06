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

  function ContactCard({ type, label, value, href, variant = 'lg' }) {
    const isEmail = type === 'email';
    const isCompact = variant === 'sm';
    const iconName = isEmail ? 'Mail' : 'Phone';
    const base = 'group flex w-full min-w-0 items-center border border-slate-200 bg-white/85 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-brand-primary hover:bg-white hover:shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-300';
    const size = isCompact
      ? 'min-h-[52px] gap-3 rounded-2xl px-4 py-3'
      : 'min-h-[72px] gap-4 rounded-[24px] p-4';
    const iconClass = isCompact ? 'icon-chip h-8 w-8 shrink-0 bg-warm-50' : 'icon-chip shrink-0 bg-warm-50';
    const labelClass = isCompact ? 'sr-only' : 'block text-sm font-semibold uppercase tracking-wide text-slate-500';
    const valueClass = isCompact
      ? 'block break-words text-sm font-semibold leading-5 text-slate-700 sm:text-base'
      : `mt-1 block break-words ${isEmail ? 'text-base font-medium text-slate-700' : 'text-lg font-semibold text-slate-950'}`;
    const content = `<span class="${iconClass}">${icon(iconName)}</span><span class="min-w-0"><span class="${labelClass}">${esc(label)}</span><span class="${valueClass}">${esc(value)}</span></span>`;
    if (isEmail) return `<button type="button" data-copy-email="${esc(value)}" class="${base} ${size}" aria-label="Copy ${esc(label.toLowerCase())} ${esc(value)}">${content}</button>`;
    return `<a href="${esc(href)}" class="${base} ${size}" aria-label="${esc(label)} ${esc(value)}">${content}</a>`;
  }

  function ContactCards(practice, variant = 'lg', labels = {}) {
    const emailCard = practice.email ? ContactCard({ type: 'email', label: labels.email || 'Email', value: practice.email, variant }) : '';
    return `<div class="mt-5 grid gap-3 ${variant === 'sm' && emailCard ? 'sm:grid-cols-2' : ''}">${ContactCard({ type: 'phone', label: labels.phone || 'Call Office', value: practice.phone, href: practice.phoneHref, variant })}${emailCard}</div>`;
  }

  function financialTitle(policy) {
    if (!policy) return 'Insurance';
    if (policy.paymentModel === 'cash_only') return 'Private Pay';
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
      <article class="fade-in-up editorial-card interactive-card cursor-pointer transition duration-200 hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.995] focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-300" tabindex="0" role="link" data-card-href="./providers/${esc(provider.slug)}/" aria-label="View profile for ${esc(provider.name)}"><div class="aspect-[5/4] overflow-hidden rounded-[28px]"><img loading="lazy" src="${esc(provider.image)}" alt="${esc(provider.name)}" class="image-treatment h-full w-full object-cover object-top" /></div><div class="mt-6"><h3 class="text-2xl font-semibold text-slate-950">${esc(provider.name)}</h3><p class="mt-1 text-sm leading-6 text-slate-500">${esc(provider.credentials)}</p><p class="mt-4 text-lg leading-8 text-slate-700">${esc(provider.tagline || '')}</p><div class="mt-5 flex flex-wrap gap-2">${(provider.heroTrustItems || provider.specialties || []).slice(0, 3).map(s => `<span class="badge-brand">${icon('CheckCircle', 'h-3.5 w-3.5')} ${esc(s)}</span>`).join('')}</div><span class="btn-secondary mt-6 px-4 py-2.5 text-sm" aria-hidden="true">View Profile</span></div></article>`).join('')}</div></div></section>`;
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
      ? `<div class="mt-6 max-w-[800px] rounded-[28px] border border-slate-200 bg-warm-50 px-6 pb-6 pt-6 md:px-8 md:pb-6 md:pt-6"><p class="text-base leading-7 text-slate-700">${esc(insurance.verification.description || '')}</p>${ContactCards(practice, 'sm')}</div>`
      : '';
    return `<section id="insurance" class="section border-t border-white/60 bg-sage-100"><div class="section-shell soft-card p-8 md:p-12"><div class="max-w-3xl"><p class="eyebrow">${esc(insurance.section_label || '')}</p><h2 class="section-title">${esc(insurance.headline || '')}</h2><p class="mt-6 text-lg leading-8 text-slate-600">${esc(insurance.summary || '')}</p></div>${coverageBadges ? `<div class="mt-6 flex flex-wrap gap-3">${coverageBadges}</div>` : ''}${carriers}${verification}${insurance.disclaimer ? `<p class="mt-6 text-sm leading-6 text-slate-500">${esc(insurance.disclaimer)}</p>` : ''}</div></section>`;
  }

  function normalizedFees(policy) {
    if (policy.fees?.length) return policy.fees;
    return (policy.rates || []).map(rate => ({
      label: rate.name,
      amount: money(rate.price),
      duration: rate.durationMinutes ? `${rate.durationMinutes} minutes` : '',
    }));
  }

  function FeeCards(policy) {
    const fees = normalizedFees(policy);
    if (!fees.length) return '';
    return `<div class="mt-6 space-y-4">${fees.map(fee => `<div class="rounded-[28px] border border-slate-200 bg-white px-5 py-3.5 md:px-5 md:py-4"><div class="flex items-start justify-between gap-4"><p class="text-base font-semibold leading-7 text-slate-950">${esc(fee.label)}</p><p class="shrink-0 text-right text-xl font-semibold text-brand-primary">${esc(fee.amount)}</p></div>${fee.duration ? `<p class="mt-1 text-sm leading-6 text-slate-500">${esc(fee.duration)}</p>` : ''}</div>`).join('')}</div>`;
  }

  function ContactForRatesMessage() {
    return `<div class="mt-6 max-w-[800px] rounded-[28px] border border-slate-200 bg-white px-5 py-3.5 md:py-4"><p class="text-base leading-7 text-slate-700">Please call the office for current rates and payment options.</p></div>`;
  }

  function paymentMethodIcon(method) {
    const value = String(method || '').toLowerCase();
    if (value.includes('cash')) return 'Banknote';
    if (value.includes('check')) return 'FileCheck';
    return 'CreditCard';
  }

  function paymentMethodLabel(method) {
    const value = String(method || '').trim();
    const normalized = value.toLowerCase();
    if (normalized === 'credit cards' || normalized === 'credit card') return 'Credit Cards';
    if (normalized === 'cash') return 'Cash';
    if (normalized === 'checks' || normalized === 'check') return 'Checks';
    if (normalized === 'digital payment apps' || normalized === 'digital payments') return 'Digital Payment Apps';
    return value.replace(/\w\S*/g, word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
  }

  function PaymentMethods(methods) {
    if (!methods?.length) return '';
    return `<div class="mt-8 border-t border-slate-200 pt-6"><p class="text-sm font-medium leading-6 text-slate-500">Payment Methods</p><div class="mt-1 flex flex-wrap gap-2.5">${methods.map(method => `<span class="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-transparent px-4 py-2 text-[0.875rem] font-medium text-slate-600 transition hover:bg-warm-50">${icon(paymentMethodIcon(method), 'h-3.5 w-3.5')} ${esc(paymentMethodLabel(method))}</span>`).join('')}</div></div>`;
  }

  function PolicyNote(message) {
    if (!message) return '';
    const paragraphs = String(message)
      .replace(/\. +(?=[A-Z])/g, '.\n')
      .split(/\n+/)
      .map(line => line.trim())
      .filter(Boolean);
    return `<div class="mt-6 max-w-2xl space-y-3 text-sm leading-6 text-slate-500">${paragraphs.map(paragraph => `<p>${esc(paragraph)}</p>`).join('')}</div>`;
  }

  function FinancialPolicySection(config) {
    const policy = config.financialPolicy;
    if (!policy) return InsuranceCoverageSection(config);
    if (['insurance', 'hybrid', 'mixed'].includes(policy.paymentModel) && config.insurance?.enabled) return InsuranceCoverageSection(config);
    const title = policy.paymentModel === 'cash_only' ? 'Private Pay' : financialTitle(policy);
    const summary = policy.summary || {
      cash_only: 'This practice operates on a self-pay basis and does not participate in insurance networks.',
      out_of_network: 'This practice is out-of-network with insurance providers.',
      hybrid: 'This practice accepts select insurance plans and also offers self-pay options.',
      mixed: 'This practice accepts select insurance plans and also offers self-pay options.',
      insurance: 'Please contact the office to confirm insurance and payment options.',
    }[policy.paymentModel] || 'Please contact the office to confirm insurance and payment options.';
    const pricing = ['listed', 'published'].includes(policy.pricingDisplay)
      ? FeeCards(policy)
      : policy.pricingDisplay === 'contact_for_rates'
        ? ContactForRatesMessage()
        : '';
    const policyNote = policy.contactForRatesMessage
      ? PolicyNote(policy.contactForRatesMessage)
      : policy.superbillAvailable
        ? PolicyNote('Superbills are available for patients seeking reimbursement through out-of-network benefits.')
        : '';
    return `<section id="insurance" class="section border-t border-white/60 bg-sage-100"><div class="section-shell soft-card p-8 md:p-12"><div class="max-w-3xl"><h2 class="section-title">${esc(title)}</h2><p class="mt-6 text-lg leading-8 text-slate-600">${esc(summary)}</p></div>${pricing}${PaymentMethods(policy.paymentMethods)}${policyNote}</div></section>`;
  }

  function FAQAnswer(answer) {
    return String(answer || '').split('\n').filter(Boolean).map(line => `<p>${esc(line)}</p>`).join('');
  }

  function FAQSection({ faqs }) {
    return `<section id="faq" class="section border-t border-white/60 bg-warm-50"><div class="mx-auto max-w-4xl"><div class="max-w-2xl"><p class="eyebrow">FAQ</p><h2 class="section-title">Common questions</h2></div><div class="mt-12 soft-card divide-y divide-slate-100/80 overflow-hidden">${faqs.map((faq, index) => `<details class="group p-7 transition-all duration-300 hover:bg-white/70" ${index === 0 ? 'open' : ''}><summary class="flex min-h-[44px] cursor-pointer list-none items-center justify-between rounded-xl text-base font-semibold text-slate-950 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-300">${esc(faq.question)}<span class="icon-chip h-8 w-8 transition duration-300 group-open:rotate-45" aria-hidden="true">+</span></summary><div class="mt-4 space-y-3 text-base leading-7 text-slate-600">${FAQAnswer(faq.answer)}</div></details>`).join('')}</div></div></section>`;
  }

  function AppointmentWorkflowActions({ appointmentUrl, patientPortalUrl }) {
    const actions = [
      appointmentUrl ? { label: 'New Patient Appointment', url: appointmentUrl, primary: true, iconName: 'CalendarCheck' } : null,
      patientPortalUrl ? { label: 'Existing Patient? Log In', url: patientPortalUrl, primary: false, iconName: 'LogIn' } : null,
    ].filter(Boolean);
    if (!actions.length) return '';
    return `<div class="space-y-3">${actions.map(action => `<a href="${esc(action.url)}" target="_blank" rel="noopener noreferrer" class="${action.primary ? 'btn-primary' : 'btn-secondary'} w-full justify-center px-5 py-4 text-base">${icon(action.iconName)} ${esc(action.label)} ${icon('ExternalLink', 'h-3.5 w-3.5')}</a>`).join('')}</div>`;
  }

  function EmergencyNotice(value) {
    if (!value) return '';
    return `<p class="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium leading-6 text-amber-900">${esc(value)}</p>`;
  }

  function AppointmentSection({ appointmentUrl, patientPortalUrl, phone, phoneHref, email, emergencyNotice }) {
    const hasActions = Boolean(appointmentUrl || patientPortalUrl);
    const practice = { phone, phoneHref, email };
    return `<section id="contact" class="fade-in-up section relative overflow-hidden border-t border-white/60 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-primary py-20" aria-labelledby="contact-title"><div class="section-shell relative grid grid-cols-1 gap-12 lg:grid-cols-2"><div><p class="text-sm font-semibold uppercase tracking-wide text-sage-100">REQUEST CARE</p><h2 id="contact-title" class="mt-4 text-3xl font-semibold leading-tight tracking-tight text-white md:text-5xl">Ready to schedule a visit?</h2><p class="mt-6 max-w-2xl text-lg leading-8 text-slate-300">Contact the office directly or request an appointment online.</p></div><div class="dark-section-card p-7 md:p-8">${AppointmentWorkflowActions({ appointmentUrl, patientPortalUrl })}<div class="${hasActions ? 'mt-8 border-t border-slate-200 pt-7' : ''}"><h3 class="text-2xl font-semibold tracking-tight text-slate-950">Contact the Office</h3>${ContactCards(practice, 'lg')}</div>${EmergencyNotice(emergencyNotice)}</div></div></section>`;
  }

  async function copyText(value) {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return true;
    }

    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    const copied = document.execCommand('copy');
    textarea.remove();
    return copied;
  }

  function CopyToast() {
    return `<div data-copy-toast class="pointer-events-none fixed inset-x-4 bottom-24 z-[60] mx-auto hidden max-w-sm rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-950 shadow-lg md:bottom-6" role="status" aria-live="polite">✓ Email copied</div>`;
  }

  function showCopyToast() {
    const toast = document.querySelector('[data-copy-toast]');
    if (!toast) return;
    toast.classList.remove('hidden');
    window.clearTimeout(showCopyToast.timeoutId);
    showCopyToast.timeoutId = window.setTimeout(() => toast.classList.add('hidden'), 2500);
  }

  function bindProviderCards() {
    if (typeof document.querySelectorAll !== 'function') return;
    document.querySelectorAll('[data-card-href]').forEach(card => {
      card.addEventListener('click', () => {
        window.location.href = card.getAttribute('data-card-href');
      });
      card.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        window.location.href = card.getAttribute('data-card-href');
      });
    });
  }

  function bindCopyEmailActions() {
    if (typeof document.querySelectorAll !== 'function') return;
    document.querySelectorAll('[data-copy-email]').forEach(button => {
      button.addEventListener('click', async () => {
        const email = button.getAttribute('data-copy-email') || '';
        try {
          if (!await copyText(email)) throw new Error('Copy command failed');
          showCopyToast();
        } catch (_error) {
          window.prompt('Copy email address:', email);
        }
      });
    });
  }

  function ContactSection(config) {
    const { practice } = config;
    return AppointmentSection({
      appointmentUrl: practice.defaultAppointmentUrl,
      patientPortalUrl: practice.patientPortalUrl,
      phone: practice.phone,
      phoneHref: practice.phoneHref,
      email: practice.email,
      emergencyNotice: practice.emergencyNotice,
    });
  }

  function isExternalUrl(url) {
    return /^https?:\/\//i.test(String(url || ''));
  }

  function isPdfUrl(url) {
    return String(url || '').split('?')[0].toLowerCase().endsWith('.pdf');
  }

  function patientResourceGroups(config) {
    if (config.resourceGroups?.length) {
      return config.resourceGroups
        .map(group => ({
          title: group.title,
          resources: (group.resources || []).filter(resource => resource?.title && resource?.url),
        }))
        .filter(group => group.title && group.resources.length);
    }
    if (!config.resources?.length) return [];
    return [{
      title: 'Patient Forms',
      resources: config.resources.filter(resource => resource?.title && resource?.url),
    }].filter(group => group.resources.length);
  }

  function patientResources(config) {
    return patientResourceGroups(config).flatMap(group => group.resources);
  }

  function patientResourceCopy(resourceCount) {
    return resourceCount >= 5
      ? 'Download forms and questionnaires before your visit.'
      : 'Download forms before your visit.';
  }

  function PatientResourceRow(resource) {
    const external = isExternalUrl(resource.url);
    const isPdf = isPdfUrl(resource.url);
    const fileIcon = isPdf ? 'FileText' : 'Link';
    const pdfBadge = isPdf ? '<span class="rounded-full bg-slate-50/60 px-1.5 py-0.5 text-[0.65rem] font-medium text-slate-500">PDF</span>' : '';
    return `<a href="${esc(resource.url)}" target="_blank" rel="noopener noreferrer" class="group/resource -mx-2 flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-xl px-2 py-1 text-base font-medium leading-6 text-slate-700 transition duration-200 hover:bg-warm-50 hover:text-slate-950 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-300"><span class="shrink-0 text-slate-500 group-hover/resource:text-brand-primary">${icon(fileIcon, 'h-5 w-5')}</span><span class="min-w-0 flex-1">${esc(resource.title)}</span>${pdfBadge}${external ? icon('ExternalLink', 'h-4 w-4 shrink-0 text-slate-500') : ''}</a>`;
  }

  function PatientResourceCard(resource) {
    const external = isExternalUrl(resource.url);
    const isPdf = isPdfUrl(resource.url);
    const fileIcon = isPdf ? 'FileText' : 'Link';
    const pdfBadge = isPdf ? '<span class="rounded-full bg-slate-50/60 px-1.5 py-0.5 text-[0.65rem] font-medium text-slate-500">PDF</span>' : '';
    return `<a href="${esc(resource.url)}" target="_blank" rel="noopener noreferrer" class="group/resource mt-4 flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-[28px] border border-slate-100/70 bg-white px-5 py-3.5 text-base font-medium leading-6 text-slate-700 transition duration-200 hover:bg-warm-50 hover:text-slate-950 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-300 sm:px-7"><span class="shrink-0 text-slate-500 group-hover/resource:text-brand-primary">${icon(fileIcon, 'h-5 w-5')}</span><span class="min-w-0 flex-1">${esc(resource.title)}</span>${pdfBadge}${external ? icon('ExternalLink', 'h-4 w-4 shrink-0 text-slate-500') : ''}</a>`;
  }

  function PatientResourceGroup(group) {
    return `<section class="border-t border-slate-100/70 px-5 py-3.5 first:border-t-0 sm:px-7"><h3 class="text-[0.95rem] font-semibold leading-6 text-slate-950">${esc(group.title)}</h3><div class="mt-1.5">${group.resources.map(resource => PatientResourceRow(resource)).join('')}</div></section>`;
  }

  function PatientResourcesSection(config) {
    const groups = patientResourceGroups(config);
    const resources = patientResources(config);
    const resourceCount = resources.length;
    if (!resourceCount) return '';
    const body = resourceCount === 1
      ? PatientResourceCard(resources[0])
      : resourceCount <= 4
        ? `<div class="mt-4 overflow-hidden rounded-[28px] border border-slate-100/70 bg-white px-5 py-3.5 sm:px-7">${resources.map(resource => PatientResourceRow(resource)).join('')}</div>`
        : `<div class="mt-4 overflow-hidden rounded-[28px] border border-slate-100/70 bg-white">${groups.map(group => PatientResourceGroup(group)).join('')}</div>`;
    return `<section id="patient-resources" class="border-t border-white/60 bg-warm-50 px-6 py-8 lg:px-8 lg:py-9"><div class="mx-auto max-w-4xl"><div class="max-w-2xl"><h2 class="text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">Patient Resources</h2><p class="mt-2 text-base leading-7 text-slate-600">${patientResourceCopy(resourceCount)}</p></div>${body}</div></section>`;
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
    const emailRow = practice.email ? `<div class="flex gap-3"><span class="icon-chip">${icon('Mail')}</span><div><p class="font-semibold text-slate-950">Email</p><p>${esc(practice.email)}</p></div></div>` : '';
    return `<section id="location" class="section section-surface-location border-t border-white/60"><div class="section-shell"><div class="max-w-2xl"><p class="eyebrow">Visit the office</p><h2 class="section-title">${esc(location.title)}</h2></div><div class="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2"><div class="soft-card overflow-hidden"><div class="relative h-72 overflow-hidden"><img src="${esc(location.officeImage)}" alt="${esc(location.officeImageAlt)}" loading="lazy" class="image-treatment h-full w-full object-cover" /><div class="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-950/15 to-transparent" aria-hidden="true"></div></div><div class="p-8"><h3 class="text-2xl font-semibold tracking-tight text-slate-950">${esc(practice.name)}</h3><div class="mt-6 space-y-5 text-base leading-7 text-slate-600"><div class="flex gap-3"><span class="icon-chip">${icon('MapPin')}</span><div><p class="font-semibold text-slate-950">Address</p>${practice.addressLines.map(line => `<p>${esc(line)}</p>`).join('')}</div></div><div class="flex gap-3"><span class="icon-chip">${icon('Phone')}</span><div><p class="font-semibold text-slate-950">Phone</p><p>${esc(practice.phone)}</p></div></div>${emailRow}</div><div class="mt-8 flex flex-col gap-3 sm:flex-row"><a href="${esc(location.directionsHref)}" class="btn-primary">${icon('MapPin')} Get Directions</a><a href="${esc(practice.phoneHref)}" class="btn-secondary">Call Office</a></div></div></div><div class="soft-card p-8"><div class="flex items-center justify-between gap-3"><h3 class="flex items-center gap-2 whitespace-nowrap text-xl font-semibold tracking-tight text-slate-950 sm:gap-3 sm:text-2xl"><span class="icon-chip h-9 w-9 sm:h-10 sm:w-10">${icon('Clock3', 'h-5 w-5')}</span> Office Hours</h3><span class="whitespace-nowrap rounded-full px-3 py-1 text-sm font-medium ${esc(status.className)}" data-office-status data-time-zone="${esc(location.timeZone)}" data-weekly-hours="${esc(JSON.stringify(location.weeklyHours || {}))}">${esc(status.label)}</span></div><div class="mt-8 space-y-5">${location.hours.map(([day, hours], index) => `<div class="${index === location.hours.length - 1 ? 'flex items-center justify-between' : 'hours-row'}"><p class="text-base font-medium text-slate-700">${esc(day)}</p><p class="text-base font-semibold text-slate-950">${esc(hours)}</p></div>`).join('')}</div>${TelehealthNotice(config)}</div></div></div></section>`;
  }

  function FooterSection() {
    return `<footer class="border-t border-white/60 bg-warm-200 px-6 py-10 lg:px-8"><nav class="mx-auto flex max-w-7xl justify-center gap-8 text-sm font-medium text-slate-600" aria-label="Footer navigation"><a class="transition hover:text-slate-950" href="./privacy/">Privacy</a><a class="transition hover:text-slate-950" href="./accessibility/">Accessibility</a></nav></footer>`;
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
        ${PatientResourcesSection(config)}
        ${LocationSection(config, options)}
        ${FAQSection(config)}
      </main>
      ${FooterSection(config)}
      ${StickyMobileCta(config)}
      ${CopyToast()}
      ${schema(config)}
    `;
    lucide.createIcons();
    bindProviderCards();
    bindCopyEmailActions();
  }

  window.FrontdoorHome = { render };
})();
