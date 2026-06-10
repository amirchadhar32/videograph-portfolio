/**
 * BrainCore Solutions — site configuration (edit this file only)
 */

/* ---- SEO (Google, social sharing, analytics) ---- */
// Set siteUrl to your live domain (e.g. https://braincoresolutions.com or your Netlify URL)
window.SEO_CONFIG = {
  siteUrl: 'https://braincoredev.netlify.app',
  siteName: 'BrainCore Solutions',
  tagline: 'Full Stack Dev Agency',
  defaultDescription:
    'BrainCore Solutions — A small, sharp full-stack development team building modern web applications, CRMs, and digital products.',
  ogImage: '/assets/chatbot-robot-static.png',
  twitterHandle: '', // e.g. '@braincore' (optional)
  googleSiteVerification: 'dKxyvvEx-zydfO9lUF_-iKuqhgnxfQVCSxDrjlAvp18',
  locale: 'en_US',
  ga4MeasurementId: 'G-MDB6VBLVLK',
  contactEmail: 'braincore.solutions.dev@gmail.com',
  linkedInUrl: 'https://www.linkedin.com/in/braincore',
};

/* ---- Firebase (projects + admin) ---- */
// https://console.firebase.google.com → Project settings → Your apps → Web app
window.FIREBASE_CONFIG = {
  apiKey: 'AIzaSyCb5RY8t4ydu8aAONkaKGIdKiiZY5mq7GM',
  authDomain: 'braincore-8ae0b.firebaseapp.com',
  projectId: 'braincore-8ae0b',
  storageBucket: 'braincore-8ae0b.firebasestorage.app',
  messagingSenderId: '998041529628',
  appId: '1:998041529628:web:1a13400155f3d72f385ed9',
  measurementId: "G-MDB6VBLVLK"
};

/* ---- LinkedIn feed ---- */
window.LINKEDIN_PROFILE_URL = 'https://www.linkedin.com/in/braincore';
window.LINKEDIN_POSTS_FILE = 'linkedin-posts.json';
window.LINKEDIN_FEED_API = '/.netlify/functions/linkedin-feed';

/* ---- reCAPTCHA v3 (contact form) ---- */
window.RECAPTCHA_SITE_KEY = '6Ld5wfgsAAAAAJO4boml-dJjesZIhpdhGcqXDTeT';
window.RECAPTCHA_ACTION = 'contact_submit';

/* ---- tawk.to live chat ---- */
window.TAWK_PROPERTY_ID = '6a1ff45ec45f451c2fc9c16d';
window.TAWK_WIDGET_ID = '1jq6d557k';
window.TAWK_POSITION = 'bl';
window.TAWK_OFFSET_X = 20;
window.TAWK_OFFSET_Y = 20;
window.TAWK_HIDE_ATTENTION_GRABBER = true;

/* ---- Projects ---- */
window.PROJECTS_HOME_LIMIT = 6;
window.PROJECTS_PAGE_SIZE = 9;
window.AUTO_SEED_PROJECTS = true; // auto-import 6 projects when Firestore is empty (first dashboard visit)
