import { Router } from 'express';
import config from '../../config';

const router = Router();

router.use((req, res, next) => {
    req["authorised"] = req.hasOwnProperty('user') && config.authorisedUsers.includes(req.user["id"]);
    next();
})
router.get('/', (req, res) => res.render('admin', {
    user: req.user,
    authorised: req["authorised"],
}));

export default router;