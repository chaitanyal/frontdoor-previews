#!/usr/bin/env node
const { renderProviderPages } = require('./render_provider_pages');
const { renderPracticeHomePages } = require('./prerender_practice_pages');
const { renderLegalPages } = require('./render_legal_pages');

function renderPracticePages(root = 'dist') {
  renderProviderPages(root);
  renderPracticeHomePages(root);
  renderLegalPages(root);
}

if (require.main === module) {
  renderPracticePages(process.argv[2] || 'dist');
}

module.exports = {
  renderPracticePages,
};
