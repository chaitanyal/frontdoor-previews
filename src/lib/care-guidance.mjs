/** Shared educational copy; selection and practice claims stay in practice.json. */
import content from '../../shared/content/care-guidance.json' with { type: 'json' };

export function careGuidanceContent(config) {
  const selection = config.careGuidance;
  if (!selection) return null;
  const entries = selection.contentKeys.map((key) => {
    if (!Object.hasOwn(content, key)) throw new Error(`Unknown care guidance content: ${key}`);
    return content[key];
  });
  const concerns = new Map();
  for (const entry of entries) {
    for (const concern of entry.concerns) {
      if (!concerns.has(concern.id)) concerns.set(concern.id, concern);
    }
  }
  return {
    heading: selection.heading || entries[0].heading,
    introduction: selection.introduction || entries[0].introduction,
    concerns: selection.concernIds
      ? selection.concernIds.map((id) => concerns.get(id))
      : entries[0].defaultConcernIds
        ? entries[0].defaultConcernIds.map((id) => concerns.get(id))
        : [...concerns.values()],
    practiceHelp: selection.practiceHelp,
  };
}
