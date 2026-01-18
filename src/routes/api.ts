
import { Router } from 'express';
import db from '../db';
import { eq, desc, asc } from 'drizzle-orm';
import { tags } from '../db/schema';

const router = Router();

router.get('/tag/:id', async (req, res) => {
    let tag = await db.select({id: tags.id, name: tags.name, type: tags.type, description: tags.description}).from(tags).where(eq(tags.id, Number.parseInt(req.params.id)));
    if (tag.length == 0) return res.sendStatus(404);
    res.send(JSON.stringify(tag[0]));
});

export default router;