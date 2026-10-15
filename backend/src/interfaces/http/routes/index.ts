import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { EntryController } from '../controllers/EntryController';
import { PeriodController } from '../controllers/PeriodController';
import { SpecialDateController } from '../controllers/SpecialDateController';
import { PointsController } from '../controllers/PointsController';
import { SuggestionsController } from '../controllers/SuggestionsController';
import { TelegramController } from '../controllers/TelegramController';
import { ConfigController } from '../controllers/ConfigController';
import { CoupleController } from '../controllers/CoupleController';
import { ActivityController } from '../controllers/ActivityController';
import { authenticate, requireCouple } from '../middleware/auth';

const router = Router();
const auth = new AuthController();
const entry = new EntryController();
const period = new PeriodController();
const specialDate = new SpecialDateController();
const points = new PointsController();
const suggestions = new SuggestionsController();
const telegram = new TelegramController();
const config = new ConfigController();
const couple = new CoupleController();
const activity = new ActivityController();

// Auth (email + contraseña)
router.post('/auth/register', (req, res) => auth.register(req, res));
router.post('/auth/login', (req, res) => auth.login(req, res));
router.get('/auth/me', authenticate, (req, res) => auth.me(req, res));
router.post('/auth/password', authenticate, (req, res) => auth.changePassword(req, res));

// Enlace de pareja
router.post('/couple/invite', authenticate, (req, res) => couple.invite(req, res));
router.get('/couple/invites', authenticate, (req, res) => couple.listForMe(req, res));
router.post('/couple/invites/:id/accept', authenticate, (req, res) => couple.accept(req, res));
router.post('/couple/invites/:id/reject', authenticate, (req, res) => couple.reject(req, res));

// Entradas diarias
router.get('/entries/stats', authenticate, requireCouple, (req, res) => entry.stats(req, res));
router.get('/entries', authenticate, requireCouple, (req, res) => entry.list(req, res));
router.get('/entries/:date', authenticate, requireCouple, (req, res) => entry.getByDate(req, res));
router.post('/entries', authenticate, requireCouple, (req, res) => entry.upsert(req, res));
router.delete('/entries/:date', authenticate, requireCouple, (req, res) => entry.remove(req, res));

// Fechas especiales
router.get('/special-dates/upcoming', authenticate, requireCouple, (req, res) => specialDate.upcoming(req, res));
router.get('/special-dates', authenticate, requireCouple, (req, res) => specialDate.list(req, res));
router.post('/special-dates', authenticate, requireCouple, (req, res) => specialDate.create(req, res));
router.put('/special-dates/:id', authenticate, requireCouple, (req, res) => specialDate.update(req, res));
router.delete('/special-dates/:id', authenticate, requireCouple, (req, res) => specialDate.remove(req, res));

// Matripuntos
router.get('/points', authenticate, requireCouple, (req, res) => points.get(req, res));

// Configuración (perfil: edad, edad máx, min/encuentro)
router.get('/config', authenticate, requireCouple, (req, res) => config.get(req, res));
router.post('/config', authenticate, requireCouple, (req, res) => config.set(req, res));

// Actividades (tiempo juntos)
router.get('/activities', authenticate, requireCouple, (req, res) => activity.list(req, res));
router.post('/activities', authenticate, requireCouple, (req, res) => activity.create(req, res));
router.put('/activities/:id', authenticate, requireCouple, (req, res) => activity.update(req, res));
router.delete('/activities/:id', authenticate, requireCouple, (req, res) => activity.remove(req, res));

// Sugerencias
router.get('/suggestions', authenticate, requireCouple, (req, res) => suggestions.get(req, res));

// Telegram (config y envíos por pareja)
router.get('/telegram/config', authenticate, requireCouple, (req, res) => telegram.getConfig(req, res));
router.post('/telegram/config', authenticate, requireCouple, (req, res) => telegram.saveConfig(req, res));
router.post('/telegram/test', authenticate, requireCouple, (req, res) => telegram.sendTest(req, res));

// Ciclos menstruales
router.get('/period/next', authenticate, requireCouple, (req, res) => period.nextPrediction(req, res));
router.get('/period', authenticate, requireCouple, (req, res) => period.list(req, res));
router.post('/period', authenticate, requireCouple, (req, res) => period.create(req, res));
router.put('/period/:id', authenticate, requireCouple, (req, res) => period.update(req, res));
router.delete('/period/:id', authenticate, requireCouple, (req, res) => period.remove(req, res));

export default router;
