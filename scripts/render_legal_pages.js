#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { accessibilityPage, privacyPage } = require('../shared/render/components/legal');

function generateForPractice(practiceDir) {
  const configPath = path.join(practiceDir, 'practice.json');
  if (!fs.existsSync(configPath)) return;

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const pages = {
    privacy: privacyPage(config),
    accessibility: accessibilityPage(config),
  };

  for (const [slug, html] of Object.entries(pages)) {
    const pageDir = path.join(practiceDir, slug);
    fs.mkdirSync(pageDir, { recursive: true });
    fs.writeFileSync(path.join(pageDir, 'index.html'), html, 'utf8');
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

function renderLegalPages(root = 'dist') {
  visit(root);
}

if (require.main === module) {
  renderLegalPages(process.argv[2] || 'dist');
}

module.exports = {
  renderLegalPages,
};
