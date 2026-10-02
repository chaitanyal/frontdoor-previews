import {
  financialSectionMode,
  financialTitle,
  homeContent,
  patientResourceGroups,
} from './practice-view.mjs';
import { hasProviderDirectory } from './provider-team.mjs';

export const HOME_SECTION_IDS = Object.freeze({
  providers: 'providers',
  conditions: 'conditions',
  treatments: 'treatments',
  financial: 'insurance',
  contact: 'contact',
  resources: 'patient-resources',
  location: 'location',
  faq: 'faq',
});

export function homeSectionNavigation(config) {
  const content = homeContent(config);
  const sections = [
    {
      key: 'providers',
      id: HOME_SECTION_IDS.providers,
      label: content.navProvidersLabel,
      pagePath: hasProviderDirectory(config) ? 'providers/' : null,
      header: true,
      enabled: Boolean(config.providers?.length),
    },
    {
      key: 'conditions',
      id: HOME_SECTION_IDS.conditions,
      label: 'Conditions',
      header: true,
      enabled: Boolean(config.conditions?.length),
    },
    {
      key: 'treatments',
      id: HOME_SECTION_IDS.treatments,
      label: 'Treatments',
      header: true,
      enabled: Boolean(config.treatments?.length),
    },
    {
      key: 'financial',
      id: HOME_SECTION_IDS.financial,
      label: financialTitle(config.financialPolicy),
      header: true,
      enabled: Boolean(financialSectionMode(config)),
    },
    {
      key: 'contact',
      id: HOME_SECTION_IDS.contact,
      label: config.hero?.primaryCta || 'Request Appointment',
      header: true,
      cta: true,
      enabled: true,
    },
    {
      key: 'location',
      id: HOME_SECTION_IDS.location,
      label: 'Location & Hours',
      enabled: Boolean(config.location),
    },
    {
      key: 'faq',
      id: HOME_SECTION_IDS.faq,
      label: 'FAQs',
      header: true,
      enabled: Boolean(config.faqs?.length),
    },
    {
      key: 'resources',
      id: HOME_SECTION_IDS.resources,
      label: 'Patient Resources',
      enabled: patientResourceGroups(config).some(
        (group) => group.resources.length,
      ),
    },
  ];

  return sections.filter((section) => section.enabled);
}
