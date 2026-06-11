/* Shared project card rendering */
'use strict';

window.BrainCoreProjectsUI = (function () {
  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function projectCategory(project) {
    if (project.category && String(project.category).trim()) return String(project.category).trim();
    const tags = project.tags || [];
    return tags[0] || 'Website';
  }

  function screenMarkup(project) {
    const img = (project.image || '').trim();
    if (img) {
      const safe = escapeHtml(img);
      return {
        className: 'device-screen image-screen',
        style: `background-image:url("${safe}");`,
      };
    }
    const c1 = escapeHtml(project.c1 || '#FF6B2B');
    const c2 = escapeHtml(project.c2 || '#1a0a00');
    return {
      className: 'device-screen color-screen',
      style: `--c1:${c1};--c2:${c2};`,
    };
  }

  function renderShowcaseCard(project, index, options) {
    const opts = options || {};
    const variant = (index % 3) + 1;
    const delay = opts.delayBase != null ? (opts.delayBase + (index % 3) * 120) : index * 120;
    const reveal = opts.noReveal ? '' : ` reveal${opts.visible ? ' visible' : ''}`;
    const delayAttr = opts.noReveal ? '' : ` data-delay="${delay}"`;
    const floatDelay = (index % 6) * 0.55;
    const title = escapeHtml(project.title);
    const category = escapeHtml(projectCategory(project));
    const screen = screenMarkup(project);
    const url = (project.url || '').trim();
    const animAttr = opts.animate !== false ? ` style="--float-delay:${floatDelay}s"` : '';

    const mockup = `
      <div class="creation-mockup mock-v${variant}"${animAttr}>
        <div class="mock-stage">
          ${variant === 1 ? `
            <div class="device-laptop mock-float">
              <div class="device-bezel"><div class="${screen.className}" style="${screen.style}"></div></div>
              <div class="device-base"></div>
            </div>
            <div class="device-phone mock-float-slow">
              <div class="${screen.className}" style="${screen.style}"></div>
            </div>
          ` : variant === 2 ? `
            <div class="device-monitor mock-float">
              <div class="device-bezel"><div class="${screen.className}" style="${screen.style}"></div></div>
              <div class="device-stand"></div>
            </div>
            <div class="device-phone mock-float-slow">
              <div class="${screen.className}" style="${screen.style}"></div>
            </div>
          ` : `
            <div class="device-pedestal mock-float">
              <div class="pedestal-top"></div>
              <div class="device-laptop compact">
                <div class="device-bezel"><div class="${screen.className}" style="${screen.style}"></div></div>
              </div>
              <div class="device-phone front">
                <div class="${screen.className}" style="${screen.style}"></div>
              </div>
            </div>
          `}
        </div>
      </div>
      <div class="creation-info">
        <h3>${title}</h3>
        <p>${category}</p>
      </div>`;

    const cardClass = `creation-card${reveal}`;

    if (url && opts.cardAsLink) {
      return `<a class="${cardClass}"${delayAttr} href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${mockup}</a>`;
    }

    return `<article class="${cardClass}"${delayAttr}>${mockup}</article>`;
  }

  function renderProjectCard(project, index, options) {
    const opts = options || {};
    if (opts.layout === 'showcase') {
      return renderShowcaseCard(project, index, options);
    }

    const num = String(index + 1).padStart(2, '0');
    const large = project.featured ? ' large' : '';
    const delay = opts.delayBase != null ? (opts.delayBase + (index % 3) * 100) : index * 100;
    const reveal = opts.noReveal ? '' : ` reveal${opts.visible ? ' visible' : ''}`;
    const delayAttr = opts.noReveal ? '' : ` data-delay="${delay}"`;

    const tags = (project.tags || []).map((t) => `<span>${escapeHtml(t)}</span>`).join('');
    const url = (project.url || '').trim();
    const linkHtml = url
      ? `<a class="proj-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">View Project <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M7 7h10v10"/></svg></a>`
      : `<div class="proj-link">View Project <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M7 7h10v10"/></svg></div>`;

    const cardInner = `
      <div class="proj-bg" style="--c1:${escapeHtml(project.c1)};--c2:${escapeHtml(project.c2)}"></div>
      <div class="proj-content">
        <div class="proj-top">
          <span class="proj-num">${num}</span>
          <div class="proj-tags">${tags}</div>
        </div>
        <h3>${escapeHtml(project.title)}</h3>
        <p>${escapeHtml(project.description)}</p>
        ${linkHtml}
      </div>`;

    if (url && opts.cardAsLink) {
      return `<a class="proj-card${large}${reveal}"${delayAttr} href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${cardInner}</a>`;
    }

    return `<article class="proj-card${large}${reveal}"${delayAttr}>${cardInner}</article>`;
  }

  function renderGrid(projects, container, options) {
    if (!container) return;
    const opts = options || {};
    if (opts.layout === 'showcase') {
      container.classList.add('creations-grid');
      container.classList.remove('projects-grid');
    }

    if (!projects.length) {
      container.innerHTML = '<p class="projects-empty">No projects yet. Check back soon.</p>';
      return;
    }
    container.innerHTML = projects.map((p, i) => renderProjectCard(p, i, options)).join('');
  }

  function renderPagination(container, page, totalPages, onPage) {
    if (!container || totalPages <= 1) {
      if (container) container.innerHTML = '';
      return;
    }

    let html = '';
    if (page > 1) {
      html += `<button type="button" class="page-btn" data-page="${page - 1}" aria-label="Previous page">←</button>`;
    }

    for (let i = 1; i <= totalPages; i += 1) {
      const active = i === page ? ' is-active' : '';
      html += `<button type="button" class="page-btn${active}" data-page="${i}">${i}</button>`;
    }

    if (page < totalPages) {
      html += `<button type="button" class="page-btn" data-page="${page + 1}" aria-label="Next page">→</button>`;
    }

    container.innerHTML = html;
    container.querySelectorAll('[data-page]').forEach((btn) => {
      btn.addEventListener('click', () => onPage(Number(btn.dataset.page)));
    });
  }

  return { renderGrid, renderPagination, renderProjectCard, escapeHtml };
})();
