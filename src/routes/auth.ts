
import { Router } from 'express';
import passport from 'passport';

const router = Router();

router.get('/login', passport.authenticate('discord'));
router.get('/cb', passport.authenticate('discord', {failureRedirect: '/login'}), (req, res) => res.redirect('/admin'));
router.get('/logout', (req, res) => {
    req.logout(() => res.redirect('/admin'));
});

export default router;