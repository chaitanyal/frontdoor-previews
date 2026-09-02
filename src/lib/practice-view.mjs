import {
  absoluteUrl,
  canonicalUrl,
  homepageImageMetadata,
  providerImageMetadata,
} from './seo.mjs';

const MEDICAL_SPECIALTY_MAP = new Map([
  ['https://schema.org/PrimaryCare', 'https://schema.org/PrimaryCare'],
  ['https://schema.org/Psychiatric', 'https://schema.org/Psychiatric'],
  ['https://schema.org/Pulmonary', 'https://schema.org/Pulmonary'],
  ['primary care', 'https://schema.org/PrimaryCare'],
  ['psychiatric', 'https://schema.org/Psychiatric'],
  ['psychiatry', 'https://schema.org/Psychiatric'],
  ['pulmonary', 'https://schema.org/Pulmonary'],
  ['pulmonary medicine', 'https://schema.org/Pulmonary'],
  ['pulmonary & critical care medicine', 'https://schema.org/Pulmonary'],
]);

export function schemaMedicalSpecialty(value) {
  const specialties = [value].flat().filter(Boolean).flatMap((specialty) => {
    const configured = String(specialty).trim();
    return [
      MEDICAL_SPECIALTY_MAP.get(configured),
      MEDICAL_SPECIALTY_MAP.get(configured.toLowerCase()),
    ].filter(Boolean).slice(0, 1);
  });
  const unique = [...new Set(specialties)];
  if (!unique.length) return undefined;
  return unique.length === 1 ? unique[0] : unique;
}

export function providerEntityType(provider) {
  const credentials = String(provider.credentials || '');
  const clinicalRole = [
    provider.name,
    provider.specialty,
    ...[provider.medicalSpecialty].flat(),
  ].filter(Boolean).join(' ');
  const isPhysician = /\b(?:m\.?d\.?|d\.?o\.?)\b/i.test(credentials) ||
    (/^Dr\.\s/i.test(String(provider.name || '')) &&
      /psychiatr|physician|pulmonary|medicine/i.test(clinicalRole));
  return isPhysician ? ['Person', 'Physician'] : ['Person'];
}

export function providerEntityId(config, provider) {
  const providers = config.providers || [];
  const isPhysician = providerEntityType(provider).includes('Physician');
  const entityName = isPhysician ? 'physician' : 'provider';
  const suffix = providers.length === 1
    ? entityName
    : `${entityName}-${provider.slug}`;
  return `${canonicalUrl(config)}#${suffix}`;
}

function postalAddress(address) {
  if (!address || typeof address !== 'object' || Array.isArray(address)) {
    return undefined;
  }
  return { '@type': 'PostalAddress', ...address };
}

export function homeContent(config) {
  return {
    navProvidersLabel: config.home?.navProvidersLabel || 'Providers',
    providerEyebrow: config.home?.providerEyebrow || 'Providers',
    providerTitle: config.home?.providerTitle || 'Meet the care team',
    providerCopy:
      config.home?.providerCopy ||
      'Warm, evidence-based care with a calm first step into treatment.',
    heroImageAlt: config.hero?.imageAlt || 'Practice hero image',
    telehealthNotice: config.location?.telehealthNotice,
  };
}

export function financialTitle(policy) {
  if (!policy || policy.paymentModel === 'insurance') return 'Insurance';
  if (policy.paymentModel === 'cash_only') return 'Private Pay';
  if (policy.paymentModel === 'out_of_network') return 'Fees & Insurance';
  return 'Insurance';
}

export function financialSectionMode(config) {
  const policy = config.financialPolicy;
  if (!policy) return config.insurance?.enabled ? 'insurance' : null;
  if (
    config.insurance?.enabled &&
    ['insurance', 'hybrid', 'mixed'].includes(policy.paymentModel)
  ) {
    return 'insurance';
  }
  return 'policy';
}

export function normalizedFees(policy) {
  if (policy?.fees?.length) return policy.fees;
  return (policy?.rates || []).map((rate) => ({
    label: rate.name,
    amount: new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(Number(rate.price || 0)),
    duration: rate.durationMinutes ? `${rate.durationMinutes} minutes` : '',
  }));
}

export function paymentMethodIcon(method) {
  const value = String(method || '').toLowerCase();
  if (value.includes('cash')) return 'Banknote';
  if (value.includes('check')) return 'FileCheck';
  if (value.includes('digital')) return 'Smartphone';
  return 'CreditCard';
}

export function paymentMethodLabel(method) {
  const value = String(method || '').trim();
  const normalized = value.toLowerCase();
  if (['credit cards', 'credit card'].includes(normalized)) return 'Credit Cards';
  if (normalized === 'cash') return 'Cash';
  if (['checks', 'check'].includes(normalized)) return 'Checks';
  if (['digital payment apps', 'digital payments'].includes(normalized)) {
    return 'Digital Payment Apps';
  }
  return value.replace(/\w\S*/g, (word) =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

export function policyParagraphs(message) {
  return String(message || '')
    .replace(/\. +(?=[A-Z])/g, '.\n')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function patientResourceGroups(config) {
  if (config.resourceGroups?.length) {
    return config.resourceGroups
      .map((group) => ({
        title: group.title,
        resources: (group.resources || []).filter(
          (resource) => resource?.title && resource?.url,
        ),
      }))
      .filter((group) => group.title && group.resources.length);
  }
  if (!config.resources?.length) return [];
  return [{
    title: 'Patient Forms',
    resources: config.resources.filter(
      (resource) => resource?.title && resource?.url,
    ),
  }].filter((group) => group.resources.length);
}

export function isExternalUrl(url) {
  return /^https?:\/\//i.test(String(url || ''));
}

export function isPdfUrl(url) {
  return String(url || '').split('?')[0].toLowerCase().endsWith('.pdf');
}

export function providerProfile(config, provider) {
  const practice = config.practice;
  const contactOverride = provider.contactOverride || {};
  const name = provider.name || 'Provider';
  const nameParts = name.split(/\s+/).filter(Boolean);
  const lastName = nameParts.at(-1) || 'Provider';
  const configuredSpecialties = [
    provider.medicalSpecialty,
    practice.medicalSpecialty,
  ].flat().filter(Boolean);
  const psychiatry = configuredSpecialties.some((value) =>
    String(value).toLowerCase().includes('psychiat')) ||
    [provider.specialty || '', provider.credentials || '']
      .join(' ')
      .toLowerCase()
      .includes('psychiat');
  const labels = {
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
    ...(config.providerProfileLabels || {}),
  };
  const providerSeo = provider.seo || {};
  const title = providerSeo.title || `${name} | ${practice.name}`;
  const description =
    providerSeo.description ||
    provider.tagline ||
    config.seo?.description ||
    '';
  const conditions =
    provider.conditions || provider.specialties || config.conditions || [];
  const services =
    provider.services || ['Evaluation', 'Treatment Planning', 'Ongoing Care'];
  const bioParagraphs = provider.bioParagraphs?.length
    ? provider.bioParagraphs
    : provider.bio
      ? [provider.bio]
      : [];
  const expectations = provider.whatToExpect || (psychiatry
    ? [
        'Thoughtful conversations about symptoms, stressors, and goals',
        'A clear treatment plan that may include medication and follow-up care',
        'A supportive setting for questions from patients and families',
      ]
    : [
        'A thoughtful conversation about symptoms, concerns, and care goals',
        'Clear recommendations about evaluation, treatment, and next steps',
        'An individualized plan with time for questions and follow-up care',
      ]);
  const hospitalAffiliations =
    provider.hospitalAffiliations ||
    provider['Hospital Affiliations'] ||
    [];
  const professionalCredentials = [
    ...(provider.affiliations || []),
    ...(provider.academicAppointments || []),
    ...(provider.awards || []),
  ];
  const phone = contactOverride.phone || practice.phone || '';
  const phoneHref = contactOverride.phoneHref || practice.phoneHref || '';
  const email = contactOverride.email || practice.email || '';
  const address = contactOverride.address
    ? postalAddress(contactOverride.address)
    : contactOverride.addressLines?.length
      ? undefined
      : postalAddress(practice.address);
  const appointmentUrl =
    provider.appointmentUrl || practice.defaultAppointmentUrl || '';
  const location = config.location || {};
  const practiceTelehealth = Boolean(
    location.telehealthNotice ||
      Object.values(location.weeklyHours || {}).some(
        (day) => day.telehealthOnly === true,
      ),
  );
  const telehealthAvailable =
    typeof provider.telehealthOverride === 'boolean'
      ? provider.telehealthOverride
      : practiceTelehealth;
  const specialty =
    provider.specialty ||
    String(provider.credentials || '').split('·').at(-1)?.trim();
  const trustItems = provider.heroTrustItems
    ? provider.heroTrustItems.slice(0, 3)
    : [
        provider.certifications?.length
          ? psychiatry
            ? 'Board Certified Psychiatrist'
            : provider.certifications[0]
          : specialty,
        hospitalAffiliations.length && !psychiatry
          ? hospitalAffiliations[0]
          : telehealthAvailable
            ? 'Telehealth Available'
            : null,
        provider.acceptsNewPatients !== false
          ? 'Accepting New Patients'
          : null,
      ].filter(Boolean).slice(0, 3);
  const providerSlug = provider.slug || '';
  const medicalSpecialty = schemaMedicalSpecialty(
    provider.medicalSpecialty || practice.medicalSpecialty,
  );
  const socialImage = providerImageMetadata(provider);
  const schemaConditions = provider.conditions || provider.specialties || [];
  const entityTypes = providerEntityType(provider);

  return {
    aboutHeading:
      provider.aboutHeading ||
      (psychiatry
        ? 'Personalized Psychiatric Care'
        : 'Personalized Specialty Care'),
    address,
    appointmentUrl,
    bioParagraphs,
    conditions,
    description,
    education: provider.education || {},
    email,
    emergencyNotice: practice.emergencyNotice || '',
    expectations,
    hospitalAffiliations,
    isPsychiatry: psychiatry,
    labels,
    name,
    image: socialImage.image,
    imageAlt: socialImage.imageAlt,
    patientPortalUrl: practice.patientPortalUrl || '',
    phone,
    phoneHref,
    professionalCredentials,
    services,
    title,
    trustItems,
    schema: {
      '@context': 'https://schema.org',
      '@type': entityTypes.length === 1 ? entityTypes[0] : entityTypes,
      '@id': providerEntityId(config, provider),
      name,
      ...(provider.specialty ? { jobTitle: provider.specialty } : {}),
      url: canonicalUrl(config, `providers/${providerSlug}`),
      description,
      image: absoluteUrl(config, socialImage.image),
      telephone: phone,
      ...(email ? { email } : {}),
      address,
      ...(medicalSpecialty ? { medicalSpecialty } : {}),
      ...(schemaConditions.length ? { knowsAbout: schemaConditions } : {}),
      ...(typeof provider.acceptsNewPatients === 'boolean'
        ? { isAcceptingNewPatients: provider.acceptsNewPatients }
        : {}),
      ...(provider.sameAs?.length ? { sameAs: provider.sameAs } : {}),
      worksFor: {
        '@id': `${canonicalUrl(config)}#clinic`,
        '@type': 'MedicalClinic',
        name: practice.name,
        url: canonicalUrl(config),
      },
    },
  };
}

export function providerAffiliationMode(profile) {
  if (profile.hospitalAffiliations.length) return 'hospital';
  if (!profile.isPsychiatry && profile.professionalCredentials.length) {
    return 'professional';
  }
  return '';
}

function formatNaturalList(values) {
  if (values.length === 1) return values[0];
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(', ')}, and ${values.at(-1)}`;
}

export function practiceServiceArea(config) {
  const serviceArea = config.practice.serviceArea;
  if (!serviceArea) return null;

  const office = {
    name: config.practice.address.addressLocality,
    region: config.practice.address.addressRegion,
  };
  const communities = serviceArea.communities;

  return {
    summary: `Our ${office.name} practice welcomes patients from across ${serviceArea.regionLabel}, including ${formatNaturalList(communities.map((community) => community.name))}.`,
    schema: [office, ...communities].map(
      (community) => `${community.name}, ${community.region}`,
    ),
  };
}

export function practiceSchema(config, providerSchemas = []) {
  const openingHoursSpecification = Object.entries(
    config.location?.weeklyHours || {},
  ).flatMap(([dayOfWeek, hours]) => {
    if (
      hours.closed ||
      hours.telehealthOnly ||
      !hours.open ||
      !hours.close
    ) {
      return [];
    }
    return [{
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: `https://schema.org/${dayOfWeek}`,
      opens: hours.open,
      closes: hours.close,
    }];
  });
  const canonical = canonicalUrl(config);
  const image = absoluteUrl(config, homepageImageMetadata(config).image);
  const serviceArea = practiceServiceArea(config);
  const medicalSpecialty = schemaMedicalSpecialty(
    config.practice.medicalSpecialty,
  );

  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalClinic',
    ...(canonical ? { '@id': `${canonical}#clinic`, url: canonical } : {}),
    name: config.practice.name,
    description: config.seo?.description,
    telephone: config.practice.phone,
    ...(config.practice.email ? { email: config.practice.email } : {}),
    address: postalAddress(config.practice.address),
    ...(config.practice.geo
      ? {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: config.practice.geo.latitude,
            longitude: config.practice.geo.longitude,
          },
        }
      : {}),
    ...(serviceArea ? { areaServed: serviceArea.schema } : {}),
    ...(image ? { image } : {}),
    ...(config.practice.logo
      ? { logo: absoluteUrl(config, config.practice.logo) }
      : {}),
    ...(medicalSpecialty ? { medicalSpecialty } : {}),
    ...(config.conditions?.length ? { knowsAbout: config.conditions } : {}),
    ...(openingHoursSpecification.length ? { openingHoursSpecification } : {}),
    ...(typeof config.practice.acceptsNewPatients === 'boolean'
      ? { isAcceptingNewPatients: config.practice.acceptsNewPatients }
      : {}),
    ...(providerSchemas.length
      ? {
          member: providerSchemas.map((provider) => ({
            '@id': provider['@id'],
          })),
        }
      : {}),
  };
}

export function practiceHomepageSchemas(config) {
  const providerSchemas = (config.providers || []).map(
    (provider) => providerProfile(config, provider).schema,
  );
  const clinic = practiceSchema(config, providerSchemas);
  return providerSchemas.length === 1
    ? [providerSchemas[0], clinic]
    : [clinic, ...providerSchemas];
}
