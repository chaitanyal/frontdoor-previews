import { loadPracticeData } from './practice-data.mjs';

function configuredPracticeIds() {
  const value = JSON.parse(
    process.env.FRONTDOOR_ASTRO_PRACTICE_IDS ?? '[]',
  );
  if (!Array.isArray(value)) {
    throw new Error('FRONTDOOR_ASTRO_PRACTICE_IDS must be a JSON array.');
  }
  return value;
}

export function previewPracticePaths() {
  return configuredPracticeIds().map((practice) => ({
    params: { practice },
    props: { practice },
  }));
}

export async function previewProviderPaths(repoRoot) {
  const paths = [];
  for (const practice of configuredPracticeIds()) {
    const { config } = await loadPracticeData(repoRoot, practice);
    for (const provider of config.providers || []) {
      paths.push({
        params: { practice, provider: provider.slug },
        props: { practice, provider },
      });
    }
  }
  return paths;
}
