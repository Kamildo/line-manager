import express from 'express';
import { Request, Response } from 'express';
import cors from 'cors';
import { initDb, getHealth, reconfigure, resetToDefaultPath, isOnline } from './database';
import queries from './queries';
import authRouter from './auth';
import { safe } from './queries';
import { requireAdmin, requireAuth } from './auth';
const app = express();
const PORT = 3000;

if (isOnline) initDb(true);//online demo version always starts with seeded data, since it uses in-memory db that resets on each restart

app.use(cors());
app.use(express.json());
app.use(queries);
app.use(authRouter);


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

app.get('/health', (req: Request, res: Response) => {
    res.json(getHealth());
});

app.post('/admin/reconfigure', requireAdmin, safe((req: Request, res: Response) => {
    const { dbPath } = req.body;
    if (!dbPath) { res.status(400).json({ error: 'dbPath required' }); return; }
    try {
        const result = reconfigure(dbPath);
        res.json(result);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
}));

app.post('/admin/reset-path', requireAdmin, safe((req: Request, res: Response) => {
    res.json(resetToDefaultPath());
}));

app.post('/initdb', requireAuth, safe((req: Request, res: Response) => {
    const { mode } = req.body;
    initDb(mode === 'seed');
    res.json(getHealth());
}));