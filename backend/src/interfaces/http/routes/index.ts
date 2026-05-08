import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { EntryController } from '../controllers/EntryController';
import { PeriodController } from '../controllers/PeriodController';
import { authenticate } from '../middleware/auth';

const router = Router();
const auth = new AuthController();
const entry = new EntryController();
const period = new PeriodController();

// Auth
router.post('/auth/login', (req, res) => auth.login(req, res));
router.post('/auth/pin', authenticate, (req, res) => auth.changePin(req, res));

// Entradas diarias
router.get('/entries/stats', authenticate, (req, res) => entry.stats(req, res));
router.get('/entries', authenticate, (req, res) => entry.list(req, res));
router.get('/entries/:date', authenticate, (req, res) => entry.getByDate(req, res));
router.post('/entries', authenticate, (req, res) => entry.upsert(req, res));
router.delete('/entries/:date', authenticate, (req, res) => entry.remove(req, res));

// Ciclos menstruales
router.get('/period/next', authenticate, (req, res) => period.nextPrediction(req, res));
router.get('/period', authenticate, (req, res) => period.list(req, res));
router.post('/period', authenticate, (req, res) => period.create(req, res));
router.put('/period/:id', authenticate, (req, res) => period.update(req, res));
router.delete('/period/:id', authenticate, (req, res) => period.remove(req, res));

export default router;
