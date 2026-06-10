'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('homeProjectsGrid');
  if (!grid || !window.BrainCoreFirebase || !window.BrainCoreProjectsUI) return;

  const limit = Number(window.PROJECTS_HOME_LIMIT) || 6;

  try {
    const all = await window.BrainCoreFirebase.getPublishedProjects();
    const projects = all.slice(0, limit);
    window.BrainCoreProjectsUI.renderGrid(projects, grid, { delayBase: 0 });

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const delay = entry.target.dataset.delay || 0;
        setTimeout(() => entry.target.classList.add('visible'), parseInt(delay, 10));
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    grid.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));
  } catch (err) {
    console.error(err);
    window.BrainCoreProjectsUI.renderGrid(
      window.BrainCoreFirebase.DEFAULT_PROJECTS.slice(0, limit),
      grid,
      { delayBase: 0 }
    );
  }
});
