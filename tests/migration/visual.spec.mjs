import { test, expect } from '@playwright/test';
import {
  installDeterministicBrowser,
  installMockNetwork,
  waitForStablePage,
} from './helpers/static-site.mjs';

const pages = [
  {
    name: 'marketing-home',
    url: 'https://frontdoor.health/',
  },
  {
    name: 'marketing-case-study',
    url: 'https://frontdoor.health/case-studies/drdronavalli/',
  },
  {
    name: 'practice-home',
    url: 'https://drdronavalli.com/',
  },
  {
    name: 'practice-provider',
    url: 'https://drdronavalli.com/providers/goutham-dronavalli/',
  },
  {
    name: 'preview-northhillspsychiatry-home',
    url: 'https://frontdoor.health/previews/northhillspsychiatry/',
  },
];

const viewports = [
  {
    name: 'desktop',
    size: { width: 1440, height: 1000 },
  },
  {
    name: 'iphone',
    size: { width: 390, height: 844 },
  },
];

for (const pageCase of pages) {
  for (const viewport of viewports) {
    test(`@visual ${pageCase.name} ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport.size);
      await installDeterministicBrowser(page);
      const network = await installMockNetwork(page);
      await page.goto(pageCase.url);
      await waitForStablePage(page);

      await expect(page).toHaveScreenshot(`${pageCase.name}-${viewport.name}.png`, {
        fullPage: true,
      });
      expect(network.unexpectedRequests).toEqual([]);
    });
  }
}
