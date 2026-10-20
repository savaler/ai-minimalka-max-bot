// Isolated staging server. Never initializes the MAX bot or sends MAX API requests.
import { createServer } from './server.mjs';
const bot = {
  authorized: () => false,
  api: async () => { throw new Error('MAX API disabled in staging'); },
  handle: async () => { throw new Error('MAX webhook disabled in staging'); }
};
createServer(bot).listen(Number(process.env.PORT || 10000), '0.0.0.0', () => {
  console.log('MINIK staging dry-run server started; live publication disabled');
});
