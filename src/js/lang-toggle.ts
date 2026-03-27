document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('langToggle');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const path = window.location.pathname;
    let newPath: string;

    if (path.startsWith('/es/')) {
      newPath = path.replace(/^\/es\//, '/en/');
    } else if (path.startsWith('/en/')) {
      newPath = path.replace(/^\/en\//, '/es/');
    } else {
      // Default: assume English, switch to Spanish
      newPath = '/es' + path;
    }

    window.location.pathname = newPath;
  });
});
