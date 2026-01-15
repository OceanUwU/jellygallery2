import { Router } from 'express';
import auth from './auth';
import admin from './admin/index';

const router = Router();

router.use((req, res, next) => {
    res.locals = {
        test: "te|St"
    };
    next();
});
router.get('/', (req, res) => res.render('home'));
router.use('/auth/', auth);
router.use('/admin/', admin);

export default router;