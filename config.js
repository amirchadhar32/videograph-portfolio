/**
 * BrainCore Solutions — site configuration (edit this file only)
 */

/* ---- LinkedIn feed ---- */
// Profile: https://www.linkedin.com/in/braincore
// Auto sync (optional): set LINKEDIN_ACCESS_TOKEN + LINKEDIN_AUTHOR_URN in Netlify env
window.LINKEDIN_PROFILE_URL = 'https://www.linkedin.com/in/braincore';
window.LINKEDIN_POSTS_FILE = 'linkedin-posts.json';
window.LINKEDIN_FEED_API = '/.netlify/functions/linkedin-feed';

/* ---- reCAPTCHA v3 (contact form) ---- */
// https://www.google.com/recaptcha/admin/create — leave '' to disable
window.RECAPTCHA_SITE_KEY = '6Ld5wfgsAAAAAJO4boml-dJjesZIhpdhGcqXDTeT';
window.RECAPTCHA_ACTION = 'contact_submit';

/* ---- tawk.to live chat ---- */
// https://tawk.to — embed URL: https://embed.tawk.to/PROPERTY_ID/WIDGET_ID
window.TAWK_PROPERTY_ID = '6a1ff45ec45f451c2fc9c16d';
window.TAWK_WIDGET_ID = '1jq6d557k';
