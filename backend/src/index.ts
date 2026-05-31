import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3000;
const VERSION = '0.0.2';

app.use(cors());
app.use(express.json());


app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Version: ${VERSION}`);
});

app.get('/api/items', (req, res) => {
    res.json([
        { id: 1, name: 'Item One' },
        { id: 2, name: 'Item Two' },
        { id: 3, name: 'Item Three' }
    ]);
});

app.get('/api/items2', (req, res) => {
    res.json([
        { id: 4, name: 'Alt Item One' },
        { id: 5, name: 'Alt Item Two' },
        { id: 6, name: 'Alt Item Three' }
    ]);
});

