
import { Router } from 'express';
import session, { SessionData } from 'express-session';
import passport from 'passport';

const router = Router();

interface ResponseSession extends SessionData {
  returnTo?: string;
}

router.get('/login', (req, res, next) => {
    const { session }: { session: session.Session & Partial<ResponseSession> } = req;
    session.returnTo = undefined;
    if (Object.hasOwn(req.query, 'returnTo'))
        session.returnTo = req.query.returnTo as string;
    next();
}, passport.authenticate('discord'));
router.get('/cb', (req, res, next) => {
    const { session }: { session: session.Session & Partial<ResponseSession> } = req;
    res.locals.returnTo = session.returnTo;
    next();
}, passport.authenticate('discord', {failureRedirect: '/login'}), (req, res) => {
    res.redirect(res.locals.returnTo ?? "/");
});
router.get('/logout', (req, res) => {
    if (Object.hasOwn(req.query, 'returnTo'))
        req.logout(() => res.redirect(req.query.returnTo as string));
    else
        req.logout(() => res.redirect('/'));
});

export default router;