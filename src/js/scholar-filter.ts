document.addEventListener('DOMContentLoaded', () => {
  const uniFilter = document.getElementById('uni-filter') as HTMLSelectElement;
  const degreeFilter = document.getElementById('degree-filter') as HTMLSelectElement;
  const cards = document.querySelectorAll<HTMLElement>('.scholar-card');
  const countEl = document.getElementById('scholar-count');

  function applyFilters() {
    const uni = uniFilter?.value || '';
    const degree = degreeFilter?.value || '';
    let visible = 0;

    cards.forEach(card => {
      const matchUni = !uni || card.dataset.university === uni;
      const matchDegree = !degree || card.dataset.degree === degree;
      const show = matchUni && matchDegree;
      card.style.display = show ? '' : 'none';
      if (show) visible++;
    });

    if (countEl) {
      countEl.textContent = `${visible}`;
    }
  }

  uniFilter?.addEventListener('change', applyFilters);
  degreeFilter?.addEventListener('change', applyFilters);
});
