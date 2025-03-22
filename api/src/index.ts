import { Hono, Context, Next } from 'hono';
import {
  AnalysisResults,
  getPkgbuild,
  getPkgComments,
  getPkgMetadata,
  PkgData,
} from './utils';
import { summarizeReport, generateReport } from './ai';
import { Env } from '../env.config';

export const app = new Hono<{ Bindings: Env }>();

const bearerAuth = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized: No bearer token provided' }, 401);
  }

  const token = authHeader.split(' ')[1];

  // Verify the token matches the expected value from environment variables
  if (token !== c.env.API_TOKEN) {
    return c.json({ error: 'Unauthorized: Invalid bearer token' }, 401);
  }

  await next();
};

app.get('/', (c) => {
  return c.text('Hello Hono!');
});

app.post('/analyze', bearerAuth, async (c) => {
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

  const analysis: AnalysisResults = {
    report: await generateReport(pkgData, c.env),
    summary: await summarizeReport(await generateReport(pkgData, c.env), c.env),
  };

  return c.json(analysis);
});

export default app;
