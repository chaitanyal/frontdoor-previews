const { esc, icon } = require('../html');

function contactCard({ type, label, value, href = '', variant = 'lg' }) {
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
  if (isEmail) {
    return `<button type="button" data-copy-email="${esc(value)}" class="${base} ${size}" aria-label="Copy ${esc(label.toLowerCase())} ${esc(value)}">${content}</button>`;
  }
  return `<a href="${esc(href)}" class="${base} ${size}" aria-label="${esc(label)} ${esc(value)}">${content}</a>`;
}

function contactCards(practice, variant = 'lg', labels = {}) {
  const emailCard = practice.email ? contactCard({ type: 'email', label: labels.email || 'Email', value: practice.email, variant }) : '';
  const phoneCard = contactCard({ type: 'phone', label: labels.phone || 'Call Office', value: practice.phone, href: practice.phoneHref, variant });
  return `<div class="mt-5 grid gap-3 ${variant === 'sm' && emailCard ? 'sm:grid-cols-2' : ''}">${phoneCard}${emailCard}</div>`;
}

function appointmentActions({ appointmentUrl, patientPortalUrl }) {
  const actions = [
    appointmentUrl ? { label: 'New Patient Appointment', url: appointmentUrl, primary: true, iconName: 'CalendarCheck' } : null,
    patientPortalUrl ? { label: 'Existing Patient? Log In', url: patientPortalUrl, primary: false, iconName: 'LogIn' } : null,
  ].filter(Boolean);
  if (!actions.length) return '';
  return `<div class="space-y-3">${actions.map(action => `<a href="${esc(action.url)}" target="_blank" rel="noopener noreferrer" class="${action.primary ? 'btn-primary' : 'btn-secondary'} w-full justify-center px-5 py-4 text-base">${icon(action.iconName)} ${esc(action.label)} ${icon('ExternalLink', 'h-3.5 w-3.5')}</a>`).join('')}</div>`;
}

function appointmentSection({ appointmentUrl, patientPortalUrl, phone, phoneHref, email, emergencyNotice, sectionId = 'appointment' }) {
  const actions = appointmentActions({ appointmentUrl, patientPortalUrl });
  const contactClass = actions ? 'mt-8 border-t border-slate-200 pt-7' : '';
  const notice = emergencyNotice
    ? `<p class="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium leading-6 text-amber-900">${esc(emergencyNotice)}</p>`
    : '';
  return `<section id="${esc(sectionId)}" class="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-primary px-6 py-16 md:py-24 lg:px-8"><div class="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center"><div><p class="text-sm font-semibold uppercase tracking-wide text-sage-100">REQUEST CARE</p><h2 class="mt-4 text-3xl font-semibold leading-tight tracking-tight text-white md:text-5xl">Ready to schedule a visit?</h2><p class="mt-6 text-lg leading-8 text-slate-300">Contact the office directly or request an appointment online.</p></div><div class="dark-section-card p-7 md:p-8">${actions}<div class="${contactClass}"><h3 class="text-2xl font-semibold tracking-tight text-slate-950">Contact the Office</h3>${contactCards({ phone, phoneHref, email }, 'lg')}</div>${notice}</div></div></section>`;
}

module.exports = {
  appointmentActions,
  appointmentSection,
  contactCard,
  contactCards,
};
