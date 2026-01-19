import express from 'express';
import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import { entries, entryTags, tags, TagType } from '../db/schema';
import db from '../db';
import { eq, desc, asc } from 'drizzle-orm';
import sharp from 'sharp';
import JSZip from 'jszip';
import { resolve } from 'path';

const router = Router();

router.get('/', async (req, res) => res.render('admin', {
    user: req.user,
    authorised: req["authorised"],
    unlisted: await db.select().from(entries).where(eq(entries.listed, false)),
    recentTags: await db.select().from(tags).orderBy(desc(tags.created)).limit(5),
    allTags: await db.select({i: tags.id, n: tags.name, t: tags.type}).from(tags).orderBy(asc(tags.name)),
    backupDate: backupDone ? fs.statSync("backup.zip").mtimeMs : null,
    backupSize: backupDone ? fs.statSync("backup.zip").size : null,
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
            filename: req.body.name.toLowerCase(),
            filetype: req.body.extension.toLowerCase(),
            title: "",
            date: new Date(),
            listed: false,
            created: new Date(),
            createdBy: req.user['id'],
        }
        if ((await db.select().from(entries).where(eq(entries.filename, entry.filename))).length > 0)
            return res.status(400).send("Another entry with that filename already exists!");
        //fs.unlinkSync(req.files[i].path);
        for (let i of ['gallery', 'gallery/ogThumb', 'gallery/thumb', 'gallery/files'])
            if (!fs.existsSync(i))
                fs.mkdirSync(i);
        let filePath = `gallery/files/${entry.filename}.${entry.filetype}`;
        fs.renameSync(req.files['file'][0].path, filePath);
        let thumbPath = null;
        if (Array.isArray(req.files['thumb'])) {
            thumbPath = `gallery/ogThumb/${entry.filename}.png`;
            fs.renameSync(req.files['thumb'][0].path, thumbPath);
        }
        else if (entry.filetype == 'png' || entry.filetype == 'jpg')
            thumbPath = filePath;
        if (thumbPath != null)
            await sharp(thumbPath)
                .png({force: true, quality: 10})
                .resize({width: thumbnailSize, height: thumbnailSize, fit: 'inside' })
                .toFile(`gallery/thumb/${entry.filename}.png`);
        await db.insert(entries).values(entry);
        return res.sendStatus(201);
    });
});

router.post('/edit-entry', express.json(), async (req, res) => {
    if (!req["authorised"]) return res.sendStatus(403);
    if (req.body == undefined) return res.status(400).send("unknown error");
    if (typeof req.body.id !== 'string' || req.body.id.length > 128 || req.body.id.length < 1 || typeof req.body.oldId !== 'string' || req.body.oldId.length < 1)
        return res.status(400).send("Filename too long (max 128 chars) or too short");
    if (!req.body.id.match(/^([0-9]|[a-z]|-)+([0-9a-z]+)$/i))
        return res.status(400).send("Filename must include only letters, numbers, or dashes");
    let entriesFound = await db.select().from(entries).where(eq(entries.filename, req.body.oldId));
    if (entriesFound.length == 0)
        return res.status(400).send("Entry with that filename does not exist!");
    let newName = req.body.id !== req.body.oldId;
    if (newName && (await db.select().from(entries).where(eq(entries.filename, req.body.id))).length > 0)
        return res.status(400).send("Another entry with the new filename already exists!");
    let entry = entriesFound[0];
    if (typeof req.body.title !== 'string' || req.body.title.length > 128 || req.body.title.length < 1)
        return res.status(400).send("Title too long (max 250 chars) or too short");
    if (!req.body.title.match(/^([0-9a-z -_\.,\(\)&\/\!\?\'\"]*)$/i))
        return res.status(400).send("Title must include only letters, spaces, or the following symbols: .,&-()/!?\"");
    if (!Number.isInteger(req.body.date) || Number.isNaN(new Date(req.body.date)))
        return res.status(400).send("Invalid date");
    if (typeof req.body.description !== 'string' || req.body.description.length > 4000)
        return res.status(400).send("Description too long (max 4000 chars)");
    if (typeof req.body.tags !== 'string')
        return res.status(400).send("Invalid tags field");
    let tagsToAdd = req.body.tags == '' ? [] : req.body.tags.split(',').map(t => Number.parseInt(t));
    tagsToAdd = tagsToAdd.filter((t, i) => tagsToAdd.indexOf(t) === i);
    if (tagsToAdd.length == 0)
        return res.status(400).send("Must add at least one tag.");
    for (let t of tagsToAdd) {
        let valid = !Number.isNaN(t);
        if (valid) valid = (await db.select().from(tags).where(eq(tags.id, t))).length == 1;
        if (!valid)
            return res.status(400).send("Unknown tag found: "+t);
    }
    if (newName) {
        if (fs.existsSync(`gallery/files/${entry.filename}.${entry.filetype}`)) fs.renameSync(`gallery/files/${entry.filename}.${entry.filetype}`, `gallery/files/${req.body.id.trim()}.${entry.filetype}`);
        if (fs.existsSync(`gallery/thumb/${entry.filename}.png`)) fs.renameSync(`gallery/thumb/${entry.filename}.png`, `gallery/thumb/${req.body.id.trim()}.png`);
        if (fs.existsSync(`gallery/ogThumb/${entry.filename}.png`)) fs.renameSync(`gallery/ogThumb/${entry.filename}.png`, `gallery/ogThumb/${req.body.id.trim()}.png`);
    }
    await db.update(entries).set({
        filename: req.body.id.trim(),
        title: req.body.title.trim(),
        listed: req.body.listed,
        date: new Date(req.body.date),
        description: req.body.description == '' ? null : req.body.description.trim(),
    }).where(eq(entries.filename, req.body.oldId));
    await db.delete(entryTags).where(eq(entryTags.entry, entry.id));
    for (let i in tagsToAdd) {
        await db.insert(entryTags).values({
            order: Number.parseInt(i),
            entry: entry.id,
            tag: tagsToAdd[i],
        });
    }
    return res.sendStatus(201);
});

router.post('/delete-entry/:id', express.json(), async (req, res) => {
    if (!req["authorised"]) return res.sendStatus(403);
    let entry = await db.select().from(entries).where(eq(entries.filename, req.params.id));
    if (entry.length == 0) return res.sendStatus(404);
    let e = entry[0];
    if (fs.existsSync(`gallery/files/${e.filename}.${e.filetype}`)) fs.rmSync(`gallery/files/${e.filename}.${e.filetype}`);
    if (fs.existsSync(`gallery/thumb/${e.filename}.png`)) fs.rmSync(`gallery/thumb/${e.filename}.png`);
    if (fs.existsSync(`gallery/ogThumb/${e.filename}.png`)) fs.rmSync(`gallery/ogThumb/${e.filename}.png`);
    await db.delete(entries).where(eq(entries.id, e.id));
    await db.delete(entryTags).where(eq(entryTags.entry, e.id));
    return res.sendStatus(200);
});


router.post('/create-tag', express.json(), async (req, res) => {
    if (!req["authorised"]) return res.sendStatus(403);
    if (req.body == undefined) return res.status(400).send("unknown error");
    if (typeof req.body.name !== 'string' || req.body.name.length > 32 || req.body.name.length < 1 || !Number.isInteger(req.body.type) || req.body.type < 0 || req.body.type >= TagType.Max)
        return res.status(400).send("Name too long (max 32 chars) or too short");
    if (!req.body.name.match(/^([0-9a-z ]*)$/i))
        return res.status(400).send("Tag name must include only letters, numbers, or spaces");
    const tag: typeof tags.$inferInsert = {
        name: req.body.name.trim(),
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
    if (!req.body.name.match(/^([0-9a-z ]*)$/i))
        return res.status(400).send("Tag name must include only letters, numbers, or spaces");
    if (typeof req.body.description !== 'string' || req.body.description.length > 2000)
        return res.status(400).send("Description too long (max 2000 chars)");
    await db.update(tags).set({
        name: req.body.name.trim(),
        type: req.body.type,
        description: req.body.description == '' ? null : req.body.description,
    }).where(eq(tags.id, req.body.id));
    return res.sendStatus(201);
});

router.post('/delete-tag/:id', express.json(), async (req, res) => {
    if (!req["authorised"]) return res.sendStatus(403);
    let id = Number.parseInt(req.params.id);
    if (Number.isNaN(id)) return res.status(400).send("id must be a number");
    await db.delete(tags).where(eq(tags.id, id));
    await db.delete(entryTags).where(eq(entryTags.tag, id));
    return res.sendStatus(200);
});

function zipRecursive(zip, path, fullPath) {
    if (fullPath == null) fullPath = path;
    let folder = zip.folder(path);
    for (let item of fs.readdirSync(fullPath))
        if (item.includes('.'))
            folder.file(item, fs.readFileSync(`${fullPath}/${item}`));
        else
            zipRecursive(folder, item, `${fullPath}/${item}`);
}

let backupProgress = -1;
let backupDone = fs.existsSync("backup.zip");

router.get('/generate-backup', async (req, res) => {
    backupProgress = 0;
    backupDone = false;
    const zip = new JSZip();
    zip.file("data.db", fs.readFileSync("data.db"));
    zipRecursive(zip, "gallery", null);
    res.status(202);
    let generated = await zip.generateAsync({type: 'blob'}, data => backupProgress = data.percent);
    backupDone = true;
    fs.createWriteStream("backup.zip").write(Buffer.from(await generated.arrayBuffer()));
});

router.get('/backup-progress', (req, res) => res.json(backupDone ? 101 : backupProgress));
router.get('/jellgall-backup.zip', (req, res) => res.sendFile(resolve() + "/backup.zip"));

export default router;