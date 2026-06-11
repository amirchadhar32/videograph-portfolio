/* Firebase init + Firestore project helpers */
'use strict';

window.BrainCoreFirebase = (function () {
  let app = null;
  let auth = null;
  let db = null;
  let storage = null;

  const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
  const IMAGE_FOLDER = 'project-images';

  const DEFAULT_PROJECTS = [
    { title: 'Reguease', description: 'AI-powered regulatory compliance platform with intelligent document processing and real-time compliance tracking.', tags: ['Laravel', 'Vue.js', 'ChatGPT API'], c1: '#FF6B2B', c2: '#1a0a00', url: '', featured: true, published: true, order: 1 },
    { title: 'SenderAustralia', description: 'Shipping & logistics platform with real-time courier rates and Stripe payments.', tags: ['Laravel', 'Stripe'], c1: '#2B7FFF', c2: '#000a1a', url: '', featured: false, published: true, order: 2 },
    { title: 'Clyvion', description: 'Modern SaaS platform with Python backend and Nuxt.js frontend on PostgreSQL.', tags: ['Python', 'Nuxt.js'], c1: '#8B2BFF', c2: '#0a0014', url: '', featured: false, published: true, order: 3 },
    { title: 'ArtTicketing', description: 'Event ticketing for art exhibitions with dual payment gateways and QR codes.', tags: ['PHP', 'Stripe', 'PayPal'], c1: '#FF2B6B', c2: '#1a0010', url: '', featured: false, published: true, order: 4 },
    { title: 'Lock8 Equipment ERP', description: 'Enterprise resource planning for equipment management with inventory tracking, maintenance scheduling, and third-party API integrations.', tags: ['PHP', 'jQuery', 'ERP'], c1: '#2BFF8B', c2: '#001a0a', url: '', featured: true, published: true, order: 5 },
    { title: 'ISO Platform', description: 'Modern web platform with real-time features and optimized API performance.', tags: ['Node.js', 'React'], c1: '#FFB02B', c2: '#1a0e00', url: '', featured: false, published: true, order: 6 },
  ];

  function isConfigured() {
    const c = window.FIREBASE_CONFIG || {};
    return Boolean(c.apiKey && c.projectId && c.appId);
  }

  function init() {
    if (!isConfigured()) return false;
    if (app) return true;
    if (typeof firebase === 'undefined') return false;

    app = firebase.initializeApp(window.FIREBASE_CONFIG);
    auth = firebase.auth();
    db = firebase.firestore();
    if (typeof firebase.storage === 'function') {
      storage = firebase.storage();
    }
    return true;
  }

  function isHostedProjectImage(url) {
    if (!url) return false;
    const bucket = (window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.storageBucket) || '';
    return url.includes('firebasestorage.googleapis.com')
      || (bucket && url.includes(bucket));
  }

  function storagePathFromUrl(url) {
    try {
      const u = new URL(url);
      if (!u.hostname.includes('firebasestorage.googleapis.com')) return null;
      const match = u.pathname.match(/\/o\/(.+)$/);
      if (!match) return null;
      const path = decodeURIComponent(match[1]);
      return path.startsWith(`${IMAGE_FOLDER}/`) ? path : null;
    } catch (error) {
      return null;
    }
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || '');
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Could not read image file.'));
      reader.readAsDataURL(file);
    });
  }

  function formatStorageError(error) {
    const code = error && error.code ? error.code : '';
    const msg = (error && error.message) || 'Upload failed';
    if (msg.includes('CORS') || code === 'storage/unauthorized') {
      return 'Image upload blocked. Enable Firebase Storage, publish storage.rules, add braincoredev.netlify.app to Firebase Auth → Authorized domains, and set FIREBASE_SERVICE_ACCOUNT on Netlify (see admin notes).';
    }
    return msg;
  }

  async function apiUploadImage(file, projectId, method, extra) {
    if (!auth || !auth.currentUser) {
      throw new Error('Please log in again before uploading images.');
    }
    const idToken = await auth.currentUser.getIdToken(true);
    const payload = extra || {};

    if (method === 'POST') {
      payload.projectId = projectId;
      payload.imageBase64 = await fileToBase64(file);
      payload.contentType = file.type || 'image/jpeg';
      payload.fileName = file.name || 'mockup.jpg';
    }

    const res = await fetch('/.netlify/functions/upload-project-image', {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `Server upload failed (${res.status})`);
    }
    return data;
  }

  async function deleteProjectImageByUrl(url) {
    if (!url) return;
    const path = storagePathFromUrl(url);

    if (auth && auth.currentUser && path) {
      try {
        await apiUploadImage(null, null, 'DELETE', { path, url });
        return;
      } catch (error) {
        console.warn('Server image delete failed, trying client:', error.message);
      }
    }

    if (!init() || !storage || !path) return;
    try {
      await storage.ref(path).delete();
    } catch (error) {
      console.warn('Old project image delete skipped:', error.message);
    }
  }

  async function uploadProjectImage(file, projectId) {
    if (!init()) throw new Error('Firebase not configured');
    if (!file || !projectId) throw new Error('Image file and project ID are required');

    if (file.size > IMAGE_MAX_BYTES) {
      throw new Error('Image must be 5 MB or smaller.');
    }

    const type = String(file.type || '');
    if (!type.startsWith('image/')) {
      throw new Error('Please upload an image file (PNG, JPG, or WebP).');
    }

    try {
      const data = await apiUploadImage(file, projectId, 'POST');
      if (data.url) return data.url;
    } catch (serverError) {
      if (!storage) throw serverError;

      try {
        const rawExt = (file.name.split('.').pop() || 'jpg').toLowerCase();
        const allowed = { jpg: 1, jpeg: 1, png: 1, webp: 1, gif: 1 };
        const ext = allowed[rawExt] ? rawExt.replace('jpeg', 'jpg') : 'jpg';
        const path = `${IMAGE_FOLDER}/${projectId}/mockup.${ext}`;
        const ref = storage.ref(path);
        await ref.put(file, { contentType: type });
        return ref.getDownloadURL();
      } catch (clientError) {
        throw new Error(formatStorageError(clientError) || serverError.message);
      }
    }

    throw new Error('Upload failed.');
  }

  function projectsRef() {
    return db.collection('projects');
  }

  async function getPublishedProjects() {
    if (!init()) return DEFAULT_PROJECTS;

    const snap = await projectsRef()
      .where('published', '==', true)
      .get();

    const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    list.sort((a, b) => (a.order || 0) - (b.order || 0));
    return list.length ? list : DEFAULT_PROJECTS;
  }

  async function getAllProjectsAdmin() {
    if (!init()) throw new Error('Firebase not configured');
    const snap = await projectsRef().get();
    const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    list.sort((a, b) => (a.order || 0) - (b.order || 0));
    return list;
  }

  async function saveProject(data, id) {
    if (!init()) throw new Error('Firebase not configured');
    const payload = {
      title: String(data.title || '').trim(),
      description: String(data.description || '').trim(),
      tags: Array.isArray(data.tags) ? data.tags : [],
      category: String(data.category || '').trim(),
      image: String(data.image || '').trim(),
      c1: data.c1 || '#FF6B2B',
      c2: data.c2 || '#1a0a00',
      url: String(data.url || '').trim(),
      featured: Boolean(data.featured),
      published: Boolean(data.published),
      order: Number(data.order) || 0,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    if (id) {
      await projectsRef().doc(id).update(payload);
      return id;
    }

    payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    const ref = await projectsRef().add(payload);
    return ref.id;
  }

  async function deleteProject(id) {
    if (!init()) throw new Error('Firebase not configured');
    const doc = await projectsRef().doc(id).get();
    if (doc.exists && doc.data().image) {
      await deleteProjectImageByUrl(doc.data().image);
    }
    await projectsRef().doc(id).delete();
  }

  async function seedDefaultProjects(options) {
    if (!init()) throw new Error('Firebase not configured');

    const opts = options || {};
    const merge = opts.merge !== false;
    const snap = await projectsRef().get();
    const existingByTitle = new Map();

    snap.docs.forEach((doc) => {
      const title = String(doc.data().title || '').trim().toLowerCase();
      if (title) existingByTitle.set(title, doc.id);
    });

    if (!merge && !snap.empty) {
      return { seeded: false, added: 0, skipped: snap.size, message: 'Projects already exist. Use merge import instead.' };
    }

    const batch = db.batch();
    let added = 0;
    let skipped = 0;

    DEFAULT_PROJECTS.forEach((p) => {
      const key = String(p.title || '').trim().toLowerCase();
      if (merge && existingByTitle.has(key)) {
        skipped += 1;
        return;
      }

      const ref = projectsRef().doc();
      batch.set(ref, {
        ...p,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      added += 1;
    });

    if (added === 0) {
      return {
        seeded: false,
        added: 0,
        skipped,
        message: skipped
          ? `All ${DEFAULT_PROJECTS.length} portfolio projects are already in Firebase.`
          : 'No projects to import.',
      };
    }

    await batch.commit();
    return {
      seeded: true,
      added,
      skipped,
      message: `Imported ${added} project(s)${skipped ? ` (${skipped} already existed)` : ''}. Refresh your site to see them.`,
    };
  }

  async function autoSeedIfEmpty() {
    if (!init()) return null;
    const snap = await projectsRef().limit(1).get();
    if (!snap.empty) return null;
    return seedDefaultProjects({ merge: true });
  }

  function signIn(email, password) {
    if (!init()) return Promise.reject(new Error('Firebase not configured'));
    return auth.signInWithEmailAndPassword(email, password);
  }

  function signOut() {
    if (!auth) return Promise.resolve();
    return auth.signOut();
  }

  function onAuthChange(cb) {
    if (!init()) {
      cb(null);
      return function () {};
    }
    return auth.onAuthStateChanged(cb);
  }

  function isPermissionError(error) {
    const code = error && error.code ? error.code : '';
    const msg = error && error.message ? error.message : '';
    return code === 'permission-denied'
      || msg.toLowerCase().includes('insufficient permissions')
      || msg.toLowerCase().includes('missing or insufficient permissions');
  }

  function permissionHelp() {
    return 'Permission denied. In Firebase Console publish firestore.rules and storage.rules from your project folder, enable Storage, then log in again.';
  }

  return {
    isConfigured,
    init,
    getPublishedProjects,
    getAllProjectsAdmin,
    saveProject,
    deleteProject,
    uploadProjectImage,
    deleteProjectImageByUrl,
    isHostedProjectImage,
    seedDefaultProjects,
    autoSeedIfEmpty,
    signIn,
    signOut,
    onAuthChange,
    isPermissionError,
    permissionHelp,
    DEFAULT_PROJECTS,
  };
})();
