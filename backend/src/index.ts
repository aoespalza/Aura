import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDatabase } from './infrastructure/database/prisma';
import routes from './interfaces/http/routes';

const app = express();
const PORT = process.env.PORT || 3007;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_, res) => res.json({ status: 'ok', app: 'Aura' }));
app.use('/api', routes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: 'JSON inválido' });
  }
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Error interno' });
});

process.on('uncaughtException', (err) => console.error('[uncaughtException]', err));
process.on('unhandledRejection', (reason) => console.error('[unhandledRejection]', reason));

async function start() {
  await connectDatabase();
  app.listen(PORT, () => console.log(`🌸 Aura backend en puerto ${PORT}`));
}

start().catch(console.error);
