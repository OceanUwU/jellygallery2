import { Router } from 'express';
import admin from './admin/index.js';

const router = Router();

router.use((req, res, next) => {
    res.locals = {
        test: "te|St"
    };
    next();
});
router.get('/', (req, res) => res.render('home'));
router.use('/admin/', admin);

export default router;