import express from 'express';
import cors from 'cors';
import { initDb } from './database';
import queries from './queries';

const app = express();
const PORT = 3000;
const VERSION = '0.0.4';

//todo scenario 3 and 4 - if no DB found, show setup screen, allow custom path and initiation with empty database
initDb(true);

app.use(cors());
app.use(express.json());
app.use(queries);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', version: VERSION });
});


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Version: ${VERSION}`);
});