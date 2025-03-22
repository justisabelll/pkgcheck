import { Hono } from 'hono';
import { getPkgbuild, getPkgComments, getPkgMetadata, PkgData } from './utils';
import { compareModels } from './ai';
import { Env, EnvStore } from '../env.config';

export const app = new Hono<{ Bindings: Env }>();

app.use('*', async (c, next) => {
  EnvStore.set(c);
  await next();
});

app.get('/', (c) => {
  return c.text('Hello Hono!');
});

app.post('/analyze', async (c) => {
  const packageName = c.req.query('package');

  if (!packageName) {
    return c.text('Invalid request: Package name is required', 400);
  }

  const pkgbuild = await getPkgbuild(packageName);
  const comments = await getPkgComments(packageName);
  const metadata = await getPkgMetadata(packageName);

  const pkgData: PkgData = {
    build: pkgbuild,
    comments,
    metadata,
  };

  const results = await compareModels(pkgData);

  return c.json({
    results,
  });
});

export default app;
