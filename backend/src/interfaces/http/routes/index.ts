import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { EntryController } from '../controllers/EntryController';
import { PeriodController } from '../controllers/PeriodController';
import { SpecialDateController } from '../controllers/SpecialDateController';
import { PointsController } from '../controllers/PointsController';
import { SuggestionsController } from '../controllers/SuggestionsController';
import { WhatsappController } from '../controllers/WhatsappController';
import { authenticate } from '../middleware/auth';

const router = Router();
const auth = new AuthController();
const entry = new EntryController();
const period = new PeriodController();
const specialDate = new SpecialDateController();
const points = new PointsController();
const suggestions = new SuggestionsController();
const whatsapp = new WhatsappController();

// Auth
router.post('/auth/login', (req, res) => auth.login(req, res));
router.post('/auth/pin', authenticate, (req, res) => auth.changePin(req, res));

// Entradas diarias
router.get('/entries/stats', authenticate, (req, res) => entry.stats(req, res));
router.get('/entries', authenticate, (req, res) => entry.list(req, res));
router.get('/entries/:date', authenticate, (req, res) => entry.getByDate(req, res));
router.post('/entries', authenticate, (req, res) => entry.upsert(req, res));
router.delete('/entries/:date', authenticate, (req, res) => entry.remove(req, res));

// Fechas especiales
router.get('/special-dates/upcoming', authenticate, (req, res) => specialDate.upcoming(req, res));
router.get('/special-dates', authenticate, (req, res) => specialDate.list(req, res));
router.post('/special-dates', authenticate, (req, res) => specialDate.create(req, res));
router.put('/special-dates/:id', authenticate, (req, res) => specialDate.update(req, res));
router.delete('/special-dates/:id', authenticate, (req, res) => specialDate.remove(req, res));

// Matripuntos
router.get('/points', authenticate, (req, res) => points.get(req, res));

// Sugerencias
router.get('/suggestions', authenticate, (req, res) => suggestions.get(req, res));

// WhatsApp (CallMeBot)
router.get('/whatsapp/config', authenticate, (req, res) => whatsapp.getConfig(req, res));
router.post('/whatsapp/config', authenticate, (req, res) => whatsapp.saveConfig(req, res));
router.post('/whatsapp/test', authenticate, (req, res) => whatsapp.sendTest(req, res));

// Ciclos menstruales
router.get('/period/next', authenticate, (req, res) => period.nextPrediction(req, res));
router.get('/period', authenticate, (req, res) => period.list(req, res));
router.post('/period', authenticate, (req, res) => period.create(req, res));
router.put('/period/:id', authenticate, (req, res) => period.update(req, res));
router.delete('/period/:id', authenticate, (req, res) => period.remove(req, res));

export default router;
