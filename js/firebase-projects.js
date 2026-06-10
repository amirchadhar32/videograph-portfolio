/* Firebase init + Firestore project helpers */
'use strict';

window.BrainCoreFirebase = (function () {
  let app = null;
  let auth = null;
  let db = null;

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
    return true;
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
    await projectsRef().doc(id).delete();
  }

  async function seedDefaultProjects() {
    if (!init()) throw new Error('Firebase not configured');
    const existing = await projectsRef().limit(1).get();
    if (!existing.empty) return { seeded: false, message: 'Projects already exist.' };

    const batch = db.batch();
    DEFAULT_PROJECTS.forEach((p) => {
      const ref = projectsRef().doc();
      batch.set(ref, {
        ...p,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();
    return { seeded: true, message: 'Default projects imported.' };
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

  return {
    isConfigured,
    init,
    getPublishedProjects,
    getAllProjectsAdmin,
    saveProject,
    deleteProject,
    seedDefaultProjects,
    signIn,
    signOut,
    onAuthChange,
    DEFAULT_PROJECTS,
  };
})();
