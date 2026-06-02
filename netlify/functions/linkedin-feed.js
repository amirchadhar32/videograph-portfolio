/**
 * Optional LinkedIn auto-fetch (Netlify environment variables).
 * Requires LinkedIn Developer app + approved access to read your posts.
 *
 * LINKEDIN_ACCESS_TOKEN
 * LINKEDIN_AUTHOR_URN  (urn:li:person:... or urn:li:organization:...)
 * LINKEDIN_API_VERSION (optional, default 202405)
 */

const API_VERSION = process.env.LINKEDIN_API_VERSION || '202405';
const PROFILE_FALLBACK = 'https://www.linkedin.com/in/braincore';

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(body),
  };
}

function extractText(commentary) {
  if (!commentary) return '';
  if (typeof commentary === 'string') return commentary.trim();
  if (typeof commentary.text === 'string') return commentary.text.trim();
  return '';
}

function mapPost(element) {
  const text = extractText(element.commentary);
  const created = element.createdAt || element.publishedAt || element.lastModifiedAt;
  const date = created
    ? new Date(Number(created)).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  return {
    id: element.id || element.urn || String(created || Date.now()),
    date,
    text: text || 'View this update on LinkedIn.',
    url: element.permalink || element.shareUrl || PROFILE_FALLBACK,
  };
}

exports.handler = async function handler() {
  const token = process.env.LINKEDIN_ACCESS_TOKEN;
  const author = process.env.LINKEDIN_AUTHOR_URN;

  if (!token || !author) {
    return json(503, {
      configured: false,
      message: 'LinkedIn API not configured. Using linkedin-posts.json on the site.',
    });
  }

  const authorEncoded = encodeURIComponent(author);
  const url = `https://api.linkedin.com/rest/posts?q=author&author=${authorEncoded}&count=12&sortBy=LAST_MODIFIED`;

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'LinkedIn-Version': API_VERSION,
        'X-Restli-Protocol-Version': '2.0.0',
      },
    });

    const raw = await res.text();
    let data = {};

    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      data = { raw };
    }

    if (!res.ok) {
      return json(res.status, {
        configured: true,
        error: 'linkedin_api_error',
        status: res.status,
        detail: data,
      });
    }

    const elements = data.elements || data.data || [];
    const posts = elements.map(mapPost).filter((p) => p.text || p.url);

    return json(200, {
      configured: true,
      source: 'api',
      profileUrl: PROFILE_FALLBACK,
      posts,
    });
  } catch (err) {
    return json(500, {
      configured: true,
      error: 'fetch_failed',
      message: err.message,
    });
  }
};
