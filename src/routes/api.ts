
import { Router } from 'express';
import db from '../db';
import { eq, desc, asc } from 'drizzle-orm';
import { tags } from '../db/schema';

const router = Router();

router.get('/tag/:id', async (req, res) => {
    let id = Number.parseInt(req.params.id);
    if (Number.isNaN(id)) return res.status(400).send("id must be a number");
    let tag = await db.select({id: tags.id, name: tags.name, type: tags.type, description: tags.description}).from(tags).where(eq(tags.id, id));
    if (tag.length == 0) return res.sendStatus(404);
    res.json(tag[0]);
});

export default router;