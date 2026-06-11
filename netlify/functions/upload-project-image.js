/* Server-side project image upload (avoids browser Storage CORS) */
'use strict';

const admin = require('firebase-admin');
const crypto = require('crypto');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
};

function initAdmin() {
  if (admin.apps.length) return admin;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT is not set on Netlify. Add your Firebase service account JSON in Site settings → Environment variables.');
  }

  const cred = JSON.parse(raw);
  const bucket = process.env.FIREBASE_STORAGE_BUCKET
    || cred.storage_bucket
    || `${cred.project_id}.firebasestorage.app`;

  admin.initializeApp({
    credential: admin.credential.cert(cred),
    storageBucket: bucket,
  });

  return admin;
}

function storagePathFromUrl(url) {
  try {
    const u = new URL(url);
    if (!u.hostname.includes('firebasestorage.googleapis.com')) return null;
    const match = u.pathname.match(/\/o\/(.+)$/);
    if (!match) return null;
    const path = decodeURIComponent(match[1]);
    return path.startsWith('project-images/') ? path : null;
  } catch (error) {
    return null;
  }
}

async function buildDownloadUrl(bucket, path) {
  const file = bucket.file(path);
  const token = crypto.randomUUID();
  await file.setMetadata({
    metadata: { firebaseStorageDownloadTokens: token },
  });
  const bucketName = bucket.name;
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization || '';
    const idToken = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!idToken) {
      return {
        statusCode: 401,
        headers: CORS,
        body: JSON.stringify({ error: 'Login required. Sign in to admin again.' }),
      };
    }

    const adm = initAdmin();
    await adm.auth().verifyIdToken(idToken);
    const bucket = adm.storage().bucket();

    if (event.httpMethod === 'DELETE') {
      const body = JSON.parse(event.body || '{}');
      const path = body.path || storagePathFromUrl(body.url || '');
      if (!path) {
        return {
          statusCode: 400,
          headers: CORS,
          body: JSON.stringify({ error: 'Invalid image path or URL.' }),
        };
      }
      await bucket.file(path).delete({ ignoreNotFound: true });
      return {
        statusCode: 200,
        headers: { ...CORS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true }),
      };
    }

    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers: CORS,
        body: JSON.stringify({ error: 'Method not allowed' }),
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { projectId, imageBase64, contentType, fileName } = body;

    if (!projectId || !imageBase64) {
      return {
        statusCode: 400,
        headers: CORS,
        body: JSON.stringify({ error: 'projectId and imageBase64 are required.' }),
      };
    }

    const buffer = Buffer.from(imageBase64, 'base64');
    if (buffer.length > 5 * 1024 * 1024) {
      return {
        statusCode: 400,
        headers: CORS,
        body: JSON.stringify({ error: 'Image must be 5 MB or smaller.' }),
      };
    }

    const rawExt = String(fileName || 'mockup.jpg').split('.').pop().toLowerCase();
    const allowed = { jpg: 1, jpeg: 1, png: 1, webp: 1, gif: 1 };
    const ext = allowed[rawExt] ? rawExt.replace('jpeg', 'jpg') : 'jpg';
    const path = `project-images/${projectId}/mockup.${ext}`;
    const file = bucket.file(path);

    await file.save(buffer, {
      metadata: { contentType: contentType || 'image/jpeg' },
      resumable: false,
    });

    const url = await buildDownloadUrl(bucket, path);

    return {
      statusCode: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, path }),
    };
  } catch (error) {
    console.error('upload-project-image:', error);
    const message = error.message || 'Upload failed';
    const status = message.includes('FIREBASE_SERVICE_ACCOUNT') ? 503 : 500;
    return {
      statusCode: status,
      headers: CORS,
      body: JSON.stringify({ error: message }),
    };
  }
};
