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

    let editingId = null;

    function showStatus(msg, type) {
      if (!status) return;
      status.hidden = false;
      status.textContent = msg;
      status.className = 'admin-status' + (type ? ` is-${type}` : '');
    }

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
      cancelBtn.addEventListener('click', () => {
        editingId = null;
        if (form) form.reset();
        document.getElementById('projectFormTitle').textContent = 'Add project';
        cancelBtn.hidden = true;
      });
    }

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const tags = form.tags.value.split(',').map((t) => t.trim()).filter(Boolean);

        try {
          await fb.saveProject({
            title: form.title.value,
            description: form.description.value,
            tags,
            c1: form.c1.value,
            c2: form.c2.value,
            url: form.url.value,
            order: form.order.value,
            featured: form.featured.checked,
            published: form.published.checked,
          }, editingId);

          showStatus(editingId ? 'Project updated.' : 'Project added.', 'success');
          editingId = null;
          form.reset();
          form.published.checked = true;
          document.getElementById('projectFormTitle').textContent = 'Add project';
          if (cancelBtn) cancelBtn.hidden = true;
          await loadProjects();
        } catch (error) {
          showStatus(error.message, 'error');
        }
      });
    }

    async function loadProjects() {
      if (!list) return;
      list.innerHTML = '<p class="admin-loading">Loading...</p>';

      try {
        const projects = await fb.getAllProjectsAdmin();
        if (!projects.length) {
          list.innerHTML = '<p class="admin-empty">No projects yet. Add one or import defaults.</p>';
          return;
        }

        list.innerHTML = projects.map((p) => `
          <div class="admin-project-row" data-id="${p.id}">
            <div class="admin-project-main">
              <strong>${escape(p.title)}</strong>
              <span>${p.published ? 'Published' : 'Draft'}${p.featured ? ' · Featured' : ''} · Order ${p.order || 0}</span>
            </div>
            <div class="admin-project-actions">
              <button type="button" class="admin-btn-sm" data-edit="${p.id}">Edit</button>
              <button type="button" class="admin-btn-sm is-danger" data-delete="${p.id}">Delete</button>
            </div>
          </div>
        `).join('');

        list.querySelectorAll('[data-edit]').forEach((btn) => {
          btn.addEventListener('click', () => fillForm(projects.find((x) => x.id === btn.dataset.edit)));
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
        list.innerHTML = `<p class="admin-empty">${msg}</p>`;
        if (fb.isPermissionError(error)) showStatus(fb.permissionHelp(), 'error');
      }
    }

    function fillForm(project) {
      if (!project || !form) return;
      editingId = project.id;
      form.title.value = project.title || '';
      form.description.value = project.description || '';
      form.tags.value = (project.tags || []).join(', ');
      form.c1.value = project.c1 || '#FF6B2B';
      form.c2.value = project.c2 || '#1a0a00';
      form.url.value = project.url || '';
      form.order.value = project.order || 0;
      form.featured.checked = Boolean(project.featured);
      form.published.checked = project.published !== false;
      document.getElementById('projectFormTitle').textContent = 'Edit project';
      if (cancelBtn) cancelBtn.hidden = false;
      form.scrollIntoView({ behavior: 'smooth' });
    }

    function escape(s) {
      return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
  }
})();
