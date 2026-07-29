import { readdir } from 'node:fs/promises';
import path from 'node:path';

export async function discoverIndexRoutes(
  root,
  { excludePrefixes = [] } = {},
) {
  const routes = [];

  async function walk(directory, relativeDirectory = '') {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) {
        if (entry.isFile() && entry.name === 'index.html') {
          const route = relativeDirectory
            ? `${relativeDirectory.split(path.sep).join('/')}/`
            : '';
          if (!excludePrefixes.some((prefix) => route.startsWith(prefix))) {
            routes.push(route);
          }
        }
        continue;
      }
      await walk(
        path.join(directory, entry.name),
        path.join(relativeDirectory, entry.name),
      );
    }
  }

  await walk(root);
  return routes.sort();
}

export function renderSitemap(site, routes) {
  const siteUrl = String(site).replace(/\/+$/, '');
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...routes.map((route) => `  <url><loc>${siteUrl}/${route}</loc></url>`),
    '</urlset>',
    '',
  ].join('\n');
}
