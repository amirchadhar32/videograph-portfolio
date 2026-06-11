'use strict';

(function () {
  const fb = window.BrainCoreFirebase;
  if (!fb) return;

  const path = window.location.pathname.replace(/\\/g, '/');

  if (path.endsWith('/admin/login.html') || path.endsWith('/admin/login')) {
    initLogin();
  }

  if (path.endsWith('/admin/dashboard.html') || path.endsWith('/admin/dashboard')) {
    initDashboard();
  }

  function formatAuthError(error) {
    const code = error && error.code ? error.code : '';
    const map = {
      'auth/configuration-not-found':
        'Email/Password login is not enabled in Firebase. Open Firebase Console → Authentication → Sign-in method → enable Email/Password, then try again.',
      'auth/invalid-credential':
        'Wrong email or password. If you have no user yet, add one in Firebase → Authentication → Users.',
      'auth/user-not-found':
        'No account with this email. Create admin user in Firebase → Authentication → Users → Add user.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/invalid-email': 'Invalid email address.',
      'auth/too-many-requests': 'Too many attempts. Wait a few minutes and try again.',
      'auth/network-request-failed': 'Network error. Check your internet connection.',
    };
    if (map[code]) return map[code];
    return (error && error.message) || 'Login failed. Check email and password.';
  }

  function initLogin() {
    const form = document.getElementById('adminLoginForm');
    const err = document.getElementById('adminLoginError');
    const cfgNote = document.getElementById('firebaseConfigNote');

    if (!fb.isConfigured()) {
      if (cfgNote) cfgNote.hidden = false;
      if (form) form.querySelector('button[type="submit"]').disabled = true;
      return;
    }

    fb.onAuthChange((user) => {
      if (user) window.location.href = 'dashboard.html';
    });

    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (err) { err.hidden = true; err.textContent = ''; }

      const email = form.email.value.trim();
      const password = form.password.value;

      try {
        await fb.signIn(email, password);
        window.location.href = 'dashboard.html';
      } catch (error) {
        if (err) {
          err.hidden = false;
          err.textContent = formatAuthError(error);
        }
      }
    });
  }

  function initDashboard() {
    const loginUrl = 'login.html';
    const form = document.getElementById('projectForm');
    const list = document.getElementById('adminProjectsList');
    const status = document.getElementById('adminStatus');
    const userEmail = document.getElementById('adminUserEmail');
    const logoutBtn = document.getElementById('adminLogout');
    const seedBtn = document.getElementById('seedProjectsBtn');
    const cancelBtn = document.getElementById('cancelEditBtn');
    const cfgNote = document.getElementById('firebaseConfigNote');
    const modal = document.getElementById('projectModal');
    const modalBackdrop = document.getElementById('projectModalBackdrop');
    const modalCard = document.getElementById('projectModalCard');
    const closeModalBtn = document.getElementById('closeProjectModal');
    const openModalBtns = [
      document.getElementById('openProjectModalBtn'),
      document.getElementById('openProjectModalBtn2'),
    ].filter(Boolean);
    const panelNavBtns = document.querySelectorAll('[data-panel-nav]');
    const panels = {
      dashboard: document.getElementById('panel-dashboard'),
      add: document.getElementById('panel-add'),
      projects: document.getElementById('panel-projects'),
    };

    let editingId = null;
    let activePanel = 'dashboard';

    function showStatus(msg, type) {
      if (!status) return;
      status.hidden = false;
      status.textContent = msg;
      const base = 'rounded-xl px-4 py-3 text-sm font-semibold border';
      if (type === 'success') status.className = `${base} bg-emerald-500/10 text-emerald-400 border-emerald-500/30`;
      else if (type === 'error') status.className = `${base} bg-red-500/10 text-red-400 border-red-500/30`;
      else status.className = `${base} bg-white/5 text-white/60 border-white/10`;
    }

    function updateStats(projects) {
      const totalEl = document.getElementById('statTotalProjects');
      const pubEl = document.getElementById('statPublishedProjects');
      const total = projects ? projects.length : 0;
      const published = projects ? projects.filter((p) => p.published !== false).length : 0;
      if (totalEl) totalEl.textContent = String(total);
      if (pubEl) pubEl.textContent = String(published);
    }

    function setActiveNav(panel) {
      panelNavBtns.forEach((btn) => {
        const isActive = btn.dataset.panelNav === panel;
        btn.classList.toggle('bg-brand/15', isActive);
        btn.classList.toggle('text-brand', isActive);
        btn.classList.toggle('font-semibold', isActive);
        btn.classList.toggle('border', isActive);
        btn.classList.toggle('border-brand/25', isActive);
        btn.classList.toggle('text-white/60', !isActive);
        btn.classList.toggle('font-medium', !isActive);
      });
    }

    function showPanel(panel) {
      activePanel = panel;
      Object.entries(panels).forEach(([key, el]) => {
        if (el) el.classList.toggle('hidden', key !== panel);
      });
      setActiveNav(panel);
    }

    const c1Picker = document.getElementById('c1Picker');
    const c2Picker = document.getElementById('c2Picker');
    const imageHidden = document.getElementById('image');
    const imageFileInput = document.getElementById('imageFile');
    const imagePreview = document.getElementById('imagePreview');
    const imagePreviewWrap = document.getElementById('imagePreviewWrap');
    const imagePreviewLabel = document.getElementById('imagePreviewLabel');
    let previewObjectUrl = null;

    function revokePreviewObjectUrl() {
      if (previewObjectUrl) {
        URL.revokeObjectURL(previewObjectUrl);
        previewObjectUrl = null;
      }
    }

    function updateImagePreview() {
      if (!imagePreview || !imagePreviewWrap) return;
      revokePreviewObjectUrl();

      const file = imageFileInput && imageFileInput.files && imageFileInput.files[0];
      const savedUrl = imageHidden ? imageHidden.value.trim() : '';

      if (file) {
        previewObjectUrl = URL.createObjectURL(file);
        imagePreview.src = previewObjectUrl;
        if (imagePreviewLabel) imagePreviewLabel.textContent = 'New upload preview';
        imagePreviewWrap.classList.remove('hidden');
        return;
      }

      if (savedUrl) {
        imagePreview.src = savedUrl;
        if (imagePreviewLabel) imagePreviewLabel.textContent = 'Current saved image';
        imagePreviewWrap.classList.remove('hidden');
        imagePreview.onerror = () => imagePreviewWrap.classList.add('hidden');
        return;
      }

      imagePreviewWrap.classList.add('hidden');
      imagePreview.removeAttribute('src');
    }

    if (imageFileInput) {
      imageFileInput.addEventListener('change', updateImagePreview);
    }

    function syncColorPickers() {
      if (!form) return;
      if (c1Picker && /^#[0-9A-Fa-f]{6}$/.test(form.c1.value)) c1Picker.value = form.c1.value;
      if (c2Picker && /^#[0-9A-Fa-f]{6}$/.test(form.c2.value)) c2Picker.value = form.c2.value;
    }

    if (c1Picker && form) {
      c1Picker.addEventListener('input', () => { form.c1.value = c1Picker.value; });
      form.c1.addEventListener('input', syncColorPickers);
    }
    if (c2Picker && form) {
      c2Picker.addEventListener('input', () => { form.c2.value = c2Picker.value; });
      form.c2.addEventListener('input', syncColorPickers);
    }

    function resetForm() {
      editingId = null;
      if (form) {
        form.reset();
        form.published.checked = true;
        form.c1.value = '#FF6B2B';
        form.c2.value = '#1a0a00';
        form.order.value = '0';
        if (imageHidden) imageHidden.value = '';
        if (imageFileInput) imageFileInput.value = '';
        syncColorPickers();
        updateImagePreview();
      }
      const titleEl = document.getElementById('projectFormTitle');
      if (titleEl) titleEl.textContent = 'Create Project';
      if (cancelBtn) cancelBtn.hidden = true;
    }

    function openProjectModal() {
      if (!modal) return;
      modal.classList.remove('hidden');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => {
        if (modalBackdrop) modalBackdrop.classList.replace('opacity-0', 'opacity-100');
        if (modalCard) {
          modalCard.classList.replace('scale-95', 'scale-100');
          modalCard.classList.replace('opacity-0', 'opacity-100');
        }
      });
      const firstInput = form && form.querySelector('input, textarea');
      if (firstInput) setTimeout(() => firstInput.focus(), 200);
    }

    function closeProjectModal() {
      if (!modal) return;
      if (modalBackdrop) modalBackdrop.classList.replace('opacity-100', 'opacity-0');
      if (modalCard) {
        modalCard.classList.replace('scale-100', 'scale-95');
        modalCard.classList.replace('opacity-100', 'opacity-0');
      }
      setTimeout(() => {
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        resetForm();
      }, 280);
    }

    panelNavBtns.forEach((btn) => {
      btn.addEventListener('click', () => showPanel(btn.dataset.panelNav));
    });

    openModalBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        resetForm();
        openProjectModal();
      });
    });

    if (closeModalBtn) closeModalBtn.addEventListener('click', closeProjectModal);
    if (modalBackdrop) modalBackdrop.addEventListener('click', closeProjectModal);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
        closeProjectModal();
      }
    });

    if (!fb.isConfigured()) {
      if (cfgNote) cfgNote.hidden = false;
      return;
    }

    fb.onAuthChange(async (user) => {
      if (!user) {
        window.location.href = loginUrl;
        return;
      }
      if (userEmail) userEmail.textContent = user.email;

      if (window.AUTO_SEED_PROJECTS !== false) {
        try {
          const auto = await fb.autoSeedIfEmpty();
          if (auto && auto.seeded) showStatus(auto.message, 'success');
        } catch (error) {
          console.warn('Auto-seed:', error);
        }
      }

      await loadProjects();
    });

    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        await fb.signOut();
        window.location.href = loginUrl;
      });
    }

    if (seedBtn) {
      seedBtn.addEventListener('click', async () => {
        try {
          const res = await fb.seedDefaultProjects({ merge: true });
          showStatus(res.message, res.seeded ? 'success' : 'info');
          await loadProjects();
        } catch (error) {
          showStatus(error.message, 'error');
        }
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', closeProjectModal);
    }

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const tags = form.tags.value.split(',').map((t) => t.trim()).filter(Boolean);
        const submitBtn = form.querySelector('button[type="submit"]');
        const file = imageFileInput && imageFileInput.files && imageFileInput.files[0];
        let imageUrl = imageHidden ? imageHidden.value.trim() : '';
        let projectId = editingId;

        const payload = {
          title: form.title.value,
          description: form.description.value,
          tags,
          category: form.category.value,
          c1: form.c1.value,
          c2: form.c2.value,
          url: form.url.value,
          order: form.order.value,
          featured: form.featured.checked,
          published: form.published.checked,
        };

        try {
          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = file ? 'Uploading...' : 'Saving...';
          }

          if (file) {
            if (!projectId) {
              projectId = await fb.saveProject({ ...payload, image: '' }, null);
            }
            imageUrl = await fb.uploadProjectImage(file, projectId);
          }

          await fb.saveProject({ ...payload, image: imageUrl }, projectId);

          showStatus(editingId ? 'Project updated.' : 'Project added.', 'success');
          closeProjectModal();
          showPanel('projects');
          await loadProjects();
        } catch (error) {
          showStatus(error.message, 'error');
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit';
          }
        }
      });
    }

    async function loadProjects() {
      if (!list) return;
      list.innerHTML = '<p class="text-white/40 text-sm py-6 text-center">Loading...</p>';

      try {
        const projects = await fb.getAllProjectsAdmin();
        updateStats(projects);

        if (!projects.length) {
          list.innerHTML = '<p class="text-white/40 text-sm py-6 text-center">No projects yet. Add one or click Import above.</p>';
          return;
        }

        list.innerHTML = projects.map((p) => {
          const isPublished = p.published !== false;
          const publishCheck = !isPublished ? `
            <label class="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 cursor-pointer shrink-0">
              <input type="checkbox" data-publish="${p.id}" class="w-4 h-4 rounded border-white/20 bg-white/5 text-brand focus:ring-brand cursor-pointer" />
              <span class="text-xs font-semibold text-amber-300">Publish</span>
            </label>
          ` : '';

          return `
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-brand/30 transition" data-id="${p.id}">
            <div class="min-w-0">
              <strong class="block text-white font-semibold truncate">${escape(p.title)}</strong>
              <span class="text-xs text-white/40 mt-1 block">${isPublished ? 'Published' : 'Draft'}${p.featured ? ' · Featured' : ''} · Order ${p.order || 0}</span>
            </div>
            <div class="flex flex-wrap items-center gap-2 shrink-0">
              ${publishCheck}
              <button type="button" data-edit="${p.id}" class="px-3 py-1.5 rounded-lg border border-white/15 text-xs font-semibold text-white/80 hover:border-brand hover:text-brand transition">Edit</button>
              <button type="button" data-delete="${p.id}" class="px-3 py-1.5 rounded-lg border border-red-500/30 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition">Delete</button>
            </div>
          </div>
        `;
        }).join('');

        list.querySelectorAll('[data-edit]').forEach((btn) => {
          btn.addEventListener('click', () => fillForm(projects.find((x) => x.id === btn.dataset.edit)));
        });

        list.querySelectorAll('[data-publish]').forEach((checkbox) => {
          checkbox.addEventListener('change', async () => {
            if (!checkbox.checked) return;
            const project = projects.find((x) => x.id === checkbox.dataset.publish);
            if (!project) return;

            checkbox.disabled = true;
            try {
              await fb.saveProject({
                title: project.title,
                description: project.description,
                tags: project.tags || [],
                category: project.category,
                image: project.image,
                c1: project.c1,
                c2: project.c2,
                url: project.url,
                order: project.order,
                featured: project.featured,
                published: true,
              }, project.id);
              showStatus(`"${project.title}" is now published.`, 'success');
              await loadProjects();
            } catch (error) {
              checkbox.checked = false;
              checkbox.disabled = false;
              showStatus(error.message, 'error');
            }
          });
        });

        list.querySelectorAll('[data-delete]').forEach((btn) => {
          btn.addEventListener('click', async () => {
            if (!confirm('Delete this project?')) return;
            try {
              await fb.deleteProject(btn.dataset.delete);
              showStatus('Project deleted.', 'success');
              await loadProjects();
            } catch (error) {
              showStatus(error.message, 'error');
            }
          });
        });
      } catch (error) {
        const msg = fb.isPermissionError(error)
          ? `${fb.permissionHelp()}`
          : escape(error.message);
        list.innerHTML = `<p class="text-red-400/80 text-sm py-6 text-center leading-relaxed">${msg}</p>`;
        updateStats([]);
        if (fb.isPermissionError(error)) showStatus(fb.permissionHelp(), 'error');
      }
    }

    function fillForm(project) {
      if (!project || !form) return;
      editingId = project.id;
      form.title.value = project.title || '';
      form.description.value = project.description || '';
      form.tags.value = (project.tags || []).join(', ');
      form.category.value = project.category || '';
      if (imageHidden) imageHidden.value = project.image || '';
      if (imageFileInput) imageFileInput.value = '';
      form.c1.value = project.c1 || '#FF6B2B';
      form.c2.value = project.c2 || '#1a0a00';
      syncColorPickers();
      updateImagePreview();
      form.url.value = project.url || '';
      form.order.value = project.order || 0;
      form.featured.checked = Boolean(project.featured);
      form.published.checked = project.published !== false;
      document.getElementById('projectFormTitle').textContent = 'Edit Project';
      if (cancelBtn) cancelBtn.hidden = false;
      openProjectModal();
    }

    function escape(s) {
      return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
  }
})();
