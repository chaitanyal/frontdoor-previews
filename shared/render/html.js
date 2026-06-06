function esc(value) {
  return String(value || '').replace(/[&<>"]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
  }[char]));
}

function escMultiline(value) {
  return esc(value).replace(/\n/g, '<br>');
}

function icon(name, cls = 'h-4 w-4') {
  return `<i data-lucide="${esc(name)}" class="${esc(cls)}" aria-hidden="true"></i>`;
}

function jsonLd(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

module.exports = {
  esc,
  escMultiline,
  icon,
  jsonLd,
};
