import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from './server.mjs';

const bot = { authorized: () => false, api: async () => { throw new Error('MAX must not be called'); }, handle: async () => { throw new Error('Webhook must not run'); } };
async function withServer(fn) {
  const server = createServer(bot);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try { await fn('http://127.0.0.1:' + server.address().port); }
  finally { await new Promise(resolve => server.close(resolve)); }
}
async function post(base, body, secret) {
  return fetch(base + '/internal/publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(secret ? { 'x-internal-publish-secret': secret } : {}) },
    body: typeof body === 'string' ? body : JSON.stringify(body)
  });
}
test('dry-run route is disabled without configured secret', async () => {
  const old = process.env.INTERNAL_PUBLISH_SECRET;
  delete process.env.INTERNAL_PUBLISH_SECRET;
  try { await withServer(async base => assert.equal((await post(base, { id:'p1', text:'test' }, 'key')).status, 503)); }
  finally { if (old === undefined) delete process.env.INTERNAL_PUBLISH_SECRET; else process.env.INTERNAL_PUBLISH_SECRET = old; }
});
test('auth, validation and no live delivery', async () => {
  const old = process.env.INTERNAL_PUBLISH_SECRET;
  process.env.INTERNAL_PUBLISH_SECRET = 'test-only-secret';
  try {
    await withServer(async base => {
      assert.equal((await post(base, { id:'p1', text:'test' })).status, 403);
      assert.equal((await post(base, { id:'p1', text:'test' }, 'wrong')).status, 403);
      assert.equal((await post(base, '{', 'test-only-secret')).status, 400);
      assert.equal((await post(base, { id:'bad id', text:'test' }, 'test-only-secret')).status, 400);
      assert.equal((await post(base, { id:'p1', text:'x'.repeat(17000) }, 'test-only-secret')).status, 413);
      const r = await post(base, { id:'p1', text:'test' }, 'test-only-secret');
      assert.equal(r.status, 200);
      assert.deepEqual(await r.json(), { ok:true, dry_run:true, publication_id:'p1', published:false });
      assert.equal((await fetch(base + '/internal/publish')).status, 405);
      assert.equal((await fetch(base + '/')).status, 200);
    });
  } finally { if (old === undefined) delete process.env.INTERNAL_PUBLISH_SECRET; else process.env.INTERNAL_PUBLISH_SECRET = old; }
});
