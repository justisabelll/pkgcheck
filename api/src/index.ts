import { Hono } from 'hono';
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

  const analysis: AnalysisResults = {
    report: await generateReport(pkgData, c.env),
    summary: await summarizeReport(await generateReport(pkgData, c.env), c.env),
  };

  return c.json(analysis);
});

export default app;
