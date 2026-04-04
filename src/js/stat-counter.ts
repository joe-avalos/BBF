function easeInOutCubic(t: number): number {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function animateCounters(container: Element): void {
  const counters = container.querySelectorAll<HTMLElement>('.stat-counter');
  if (counters.length === 0) return;

  const duration = 2000;
  const startTime = performance.now();

  function tick(now: number): void {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeInOutCubic(progress);

    counters.forEach(counter => {
      const target = parseInt(counter.dataset.target ?? '0', 10);
      const current = Math.round(eased * target);
      const display = counter.querySelector('.stat-display');
      if (display) display.textContent = current.toLocaleString();
    });

    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  }

  requestAnimationFrame(tick);
}

function init(): void {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll<HTMLElement>('.stats-section').forEach(section => {
    if (prefersReducedMotion) {
      section.querySelectorAll<HTMLElement>('.stat-counter').forEach(counter => {
        const target = parseInt(counter.dataset.target ?? '0', 10);
        const display = counter.querySelector('.stat-display');
        if (display) display.textContent = target.toLocaleString();
      });
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            animateCounters(section);
            observer.unobserve(section);
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(section);
  });
}

document.addEventListener('DOMContentLoaded', init);
