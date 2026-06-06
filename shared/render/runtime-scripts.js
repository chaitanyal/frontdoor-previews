function copyEmailScript() {
  return `<script>
(() => {
  async function copyText(value) {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return true;
    }
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    const copied = document.execCommand('copy');
    textarea.remove();
    return copied;
  }
  function showCopyToast() {
    const toast = document.querySelector('[data-copy-toast]');
    if (!toast) return;
    toast.classList.remove('hidden');
    window.clearTimeout(showCopyToast.timeoutId);
    showCopyToast.timeoutId = window.setTimeout(() => toast.classList.add('hidden'), 2500);
  }
  document.querySelectorAll('[data-copy-email]').forEach(button => {
    button.addEventListener('click', async () => {
      const email = button.getAttribute('data-copy-email') || '';
      try {
        if (!await copyText(email)) throw new Error('Copy command failed');
        showCopyToast();
      } catch (_error) {
        window.prompt('Copy email address:', email);
      }
    });
  });
})();
</script>`;
}

module.exports = {
  copyEmailScript,
};
