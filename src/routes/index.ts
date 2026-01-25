import { Router } from 'express';
import auth from './auth';
import admin from './admin';
import api from './api';
import entry from './entry';
import cached from '../cached';

const router = Router();

router.use((req, res, next) => {
    res.locals = {
        url: req.url
    };
    next();
});
router.get('/', (req, res) => res.render('home'));
router.get('/entries', (req, res) => res.render('entries', { tags: cached.tags }));
router.get('/arcs', (req, res) => res.render('arcs'));
router.get('/characters', (req, res) => res.render('characters'));
router.use('/api/', api);
router.use('/auth/', auth);
router.use('/admin/', admin);
router.use('/e/', entry);

export default router;