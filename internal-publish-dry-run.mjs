import { timingSafeEqual } from 'node:crypto';

const equal = (a, b) => {
  if (!a || !b) return false;
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
};

// Isolated dry-run handler. No MAX API calls or live posts.
export async function handlePublishDryRun(req, res, {
  secret = process.env.INTERNAL_PUBLISH_SECRET,
  maxBytes = 16384
} = {}) {
  const reply = (status, body) => {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(body));
  };
  if (req.method !== 'POST') return reply(405, { ok: false, error: 'method_not_allowed' });
  if (!secret) return reply(503, { ok: false, error: 'not_configured' });
  if (!equal(req.headers['x-internal-publish-secret'], secret)) return reply(403, { ok: false, error: 'forbidden' });
  let size = 0;
  const chunks = [];
  try {
    for await (const chunk of req) {
      size += chunk.length;
      if (size > maxBytes) return reply(413, { ok: false, error: 'payload_too_large' });
      chunks.push(chunk);
    }
    const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!data || typeof data.id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(data.id) ||
        typeof data.text !== 'string' || data.text.length < 1 || data.text.length > 4000) {
      return reply(400, { ok: false, error: 'invalid_payload' });
    }
    // Never return content; no message is published.
    return reply(200, { ok: true, dry_run: true, publication_id: data.id, published: false });
  } catch {
    return reply(400, { ok: false, error: 'invalid_json' });
  }
}
