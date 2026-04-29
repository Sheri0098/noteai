import cors from 'cors';
import express from 'express';
import { serverConfig } from './config';
import routes from './routes';
import { requireAuth } from './auth';

const app = express();

app.use(
  cors({
    origin: serverConfig.corsOrigin === '*' ? true : serverConfig.corsOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api', requireAuth, routes);

app.listen(serverConfig.port, () => {
  // eslint-disable-next-line no-console
  console.log(`API running at http://localhost:${serverConfig.port}`);
});
