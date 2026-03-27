const PAYPAL_URL =
  'https://www.paypal.com/donate?token=m4ld99YqY75fhl96dRcSwlq_eay6RuFri7OTfucgIWOJZIlrQ7FZaFYVka9sdwSyguC9cqmvuEZrv_uS';

export function initDonateButtons() {
  document.querySelectorAll<HTMLElement>('[data-donate]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const w = 500, h = 600;
      const left = (screen.width - w) / 2;
      const top = (screen.height - h) / 2;
      window.open(
        PAYPAL_URL,
        'donate',
        `width=${w},height=${h},left=${left},top=${top},scrollbars=yes`,
      );
    });
  });
}
