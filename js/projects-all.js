'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('allProjectsGrid');
  const pagination = document.getElementById('projectsPagination');
  if (!grid || !window.BrainCoreFirebase || !window.BrainCoreProjectsUI) return;

  const pageSize = Number(window.PROJECTS_PAGE_SIZE) || 9;
  let allProjects = [];
  let currentPage = 1;

  function getPageFromUrl() {
    const p = new URLSearchParams(window.location.search).get('page');
    const n = Number(p);
    return n > 0 ? n : 1;
  }

  function setPageInUrl(page) {
    const url = new URL(window.location.href);
    if (page <= 1) url.searchParams.delete('page');
    else url.searchParams.set('page', String(page));
    window.history.replaceState({}, '', url);
  }

  function renderPage(page) {
    currentPage = page;
    const totalPages = Math.max(1, Math.ceil(allProjects.length / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * pageSize;
    const slice = allProjects.slice(start, start + pageSize);

    window.BrainCoreProjectsUI.renderGrid(slice, grid, {
      layout: 'showcase',
      delayBase: 0,
      visible: true,
      noReveal: false,
      cardAsLink: true,
      animate: true,
    });

    grid.querySelectorAll('.reveal').forEach((el) => el.classList.add('visible'));

    window.BrainCoreProjectsUI.renderPagination(pagination, safePage, totalPages, (p) => {
      setPageInUrl(p);
      renderPage(p);
      grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    const countEl = document.getElementById('projectsCount');
    if (countEl) {
      countEl.textContent = `${allProjects.length} project${allProjects.length === 1 ? '' : 's'}`;
    }
  }

  try {
    allProjects = await window.BrainCoreFirebase.getPublishedProjects();
    renderPage(getPageFromUrl());
  } catch (err) {
    console.error(err);
    allProjects = window.BrainCoreFirebase.DEFAULT_PROJECTS;
    renderPage(1);
  }
});
