#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { providerPage } = require('../shared/render/components/provider-page');

function generateForPractice(practiceDir) {
  const configPath = path.join(practiceDir, 'practice.json');
  if (!fs.existsSync(configPath)) return;

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  config.practice.slug = config.practice.slug || path.basename(practiceDir);
  const providers = config.providers || [];
  const providersDir = path.join(practiceDir, 'providers');
  fs.mkdirSync(providersDir, { recursive: true });

  for (const provider of providers) {
    if (!provider.slug) continue;
    const pageDir = path.join(providersDir, provider.slug);
    fs.mkdirSync(pageDir, { recursive: true });
    fs.writeFileSync(path.join(pageDir, 'index.html'), providerPage(config, provider), 'utf8');
  }
}

function visit(directory) {
  if (fs.existsSync(path.join(directory, 'practice.json'))) {
    generateForPractice(directory);
    return;
  }
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) visit(path.join(directory, entry.name));
  }
}

function renderProviderPages(root = 'dist') {
  visit(root);
}

if (require.main === module) {
  renderProviderPages(process.argv[2] || 'dist');
}

module.exports = {
  renderProviderPages,
};
