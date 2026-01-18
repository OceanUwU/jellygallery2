import express from 'express';
import { Router } from 'express';
import config from '../config';
import multer from 'multer';
import fs from 'fs';
import { entries, tags, TagType } from '../db/schema';
import db from '../db';
import { eq, desc, asc } from 'drizzle-orm';
import sharp from 'sharp';

const router = Router();

router.use((req, res, next) => {
    req["authorised"] = req.hasOwnProperty('user') && config.authorisedUsers.includes(req.user["id"]);
    next();
})
router.get('/', async (req, res) => res.render('admin', {
    user: req.user,
    authorised: req["authorised"],
    unlisted: await db.select().from(entries).where(eq(entries.listed, false)),
    recent: await db.select().from(entries).where(eq(entries.listed, true)).orderBy(desc(entries.created)).limit(3),
    recentTags: await db.select().from(tags).orderBy(desc(tags.created)).limit(5),
    allTags: await db.select({i: tags.id, n: tags.name, t: tags.type}).from(tags).orderBy(asc(tags.name)),
}));

const fileLimit = 50;
let upload = multer({
    dest: "temp",
    limits: {
        fileSize: fileLimit * 1024 * 1024,
    }
}).fields([
    { name: 'file', maxCount: 1 },
    { name: 'thumb', maxCount: 1 },
]);
const thumbnailSize = 128;


router.post('/upload', express.urlencoded({ extended: false }), (req, res) => {
    if (!req["authorised"]) return res.sendStatus(403);
    upload(req, res, async err => {
        if (err instanceof multer.MulterError) {
            if (err.code == 'LIMIT_FILE_SIZE')
                return res.status(400).send(`Max file size is ${fileLimit} MiB`);
            console.error(err);
            return res.status(400).send("Error uploading file");
        }
        if (req.body == undefined) return res.status(400).send("unknown error");
        if (req.files == undefined || !Array.isArray(req.files['file']))
            return res.status(400).send("No file received?");
        if (typeof req.body.name !== 'string' || req.body.name.length > 128 || req.body.name.length < 1 || typeof req.body.extension !== 'string' || req.body.extension.length > 128 || req.body.extension.length < 1)
            return res.status(400).send("Filename too long (max 128 chars) or too short");
        if (!req.body.name.match(/^([0-9]|[a-z]|-)+([0-9a-z]+)$/i) || !req.body.extension.match(/^([0-9]|[a-z])+([0-9a-z]+)$/i))
            return res.status(400).send("Filename must include only letters, numbers, or dashes");
        const entry: typeof entries.$inferInsert = {
            id: req.body.name.toLowerCase(),
            filetype: req.body.extension.toLowerCase(),
            title: "",
            date: new Date(),
            listed: false,
            created: new Date(),
            createdBy: req.user['id'],
        }
        if ((await db.select().from(entries).where(eq(entries.id, entry.id))).length > 0)
            return res.status(400).send("Entry with that filename already exists!");
        //fs.unlinkSync(req.files[i].path);
        for (let i of ['gallery', 'gallery/ogThumb', 'gallery/thumb', 'gallery/files'])
            if (!fs.existsSync(i))
                fs.mkdirSync(i);
        let filePath = `gallery/files/${entry.id}.${entry.filetype}`;
        fs.renameSync(req.files['file'][0].path, filePath);
        let thumbPath = null;
        if (Array.isArray(req.files['thumb'])) {
            thumbPath = `gallery/ogThumb/${entry.id}.png`;
            fs.renameSync(req.files['thumb'][0].path, thumbPath);
        }
        else if (entry.filetype == 'png' || entry.filetype == 'jpg')
            thumbPath = filePath;
        if (thumbPath != null)
            await sharp(thumbPath)
                .png({force: true, quality: 10})
                .resize({width: thumbnailSize, height: thumbnailSize, fit: 'inside' })
                .toFile(`gallery/thumb/${entry.id}.png`);
        await db.insert(entries).values(entry);
        return res.sendStatus(201);
    });
});


router.post('/create-tag', express.json(), async (req, res) => {
    if (!req["authorised"]) return res.sendStatus(403);
    if (req.body == undefined) return res.status(400).send("unknown error");
    if (typeof req.body.name !== 'string' || req.body.name.length > 32 || req.body.name.length < 1 || !Number.isInteger(req.body.type) || req.body.type < 0 || req.body.type >= TagType.Max)
        return res.status(400).send("Name too long (max 32 chars) or too short");
    if (!req.body.name.match(/^([0-9a-z]+)$/i))
        return res.status(400).send("Name must include only letters and numbers");
    const tag: typeof tags.$inferInsert = {
        name: req.body.name,
        type: req.body.type,
        created: new Date(),
        createdBy: req.user['id'],
    }
    if ((await db.select().from(tags).where(eq(tags.name, tag.name))).length > 0)
        return res.status(400).send("Tag with that name already exists!");
    await db.insert(tags).values(tag);
    return res.sendStatus(201);
});


router.post('/edit-tag', express.json(), async (req, res) => {
    if (!req["authorised"]) return res.sendStatus(403);
    if (req.body == undefined) return res.status(400).send("unknown error");
    if (typeof req.body.name !== 'string' || req.body.name.length > 32 || req.body.name.length < 1 || !Number.isInteger(req.body.type) || req.body.type < 0 || req.body.type >= TagType.Max)
        return res.status(400).send("Name too long (max 32 chars) or too short");
    if (!req.body.name.match(/^([0-9a-z]+)$/i))
        return res.status(400).send("Name must include only letters and numbers");
    if (typeof req.body.description !== 'string' || req.body.description.length > 2000)
        return res.status(400).send("Description too long (max 2000 chars)");
    await db.update(tags).set({
        name: req.body.name,
        type: req.body.type,
        description: req.body.description == '' ? null : req.body.description,
    }).where(eq(tags.id, req.body.id));
    return res.sendStatus(201);
});

export default router;