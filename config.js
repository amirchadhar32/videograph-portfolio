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

/* ---- tawk.to live chat (bottom-left on site) ---- */
// https://tawk.to — also set Widget → Appearance → Position: Bottom Left in dashboard
window.TAWK_PROPERTY_ID = '6a1ff45ec45f451c2fc9c16d';
window.TAWK_WIDGET_ID = '1jq6d557k';
window.TAWK_POSITION = 'bl'; // bl = bottom-left | br = bottom-right
window.TAWK_OFFSET_X = 20;
window.TAWK_OFFSET_Y = 20;
