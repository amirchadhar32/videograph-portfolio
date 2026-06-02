/**
 * LinkedIn feed settings
 * Profile: https://www.linkedin.com/in/braincore
 *
 * AUTO SYNC (optional, after LinkedIn Developer setup on Netlify):
 *   LINKEDIN_ACCESS_TOKEN
 *   LINKEDIN_AUTHOR_URN   e.g. urn:li:person:XXXXXXXX
 *
 * Without API keys the site uses linkedin-posts.json (update when you post,
 * or automate with Zapier/Make → edit JSON in GitHub).
 */
window.LINKEDIN_PROFILE_URL = 'https://www.linkedin.com/in/braincore';
window.LINKEDIN_POSTS_FILE = 'linkedin-posts.json';
window.LINKEDIN_FEED_API = '/.netlify/functions/linkedin-feed';
