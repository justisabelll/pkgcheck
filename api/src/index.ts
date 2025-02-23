import { Hono, Context } from 'hono';
import { getPkgbuild, getPkgComments, getPkgMetadata, PkgData } from './utils';

const app = new Hono();

app.get('/', (c) => {
  return c.text('Hello Hono!');
});

app.post('/analyze', async (c: Context) => {
  const packageName = c.req.query('package');

  if (!packageName) {
    return c.text('Invalid request: Package name is required', 400);
  }

  const pkgbuild = await getPkgbuild(packageName);
  const comments = await getPkgComments(packageName);
  const metadata = await getPkgMetadata(packageName);
  console.log(metadata, packageName);

  const pkgData: PkgData = {
    build: pkgbuild,
    comments,
    metadata,
  };

  return c.json(pkgData);
});

export default app;
