import express from 'express';
import cors from 'cors';
import { initDb } from './database';
import queries from './queries';
import authRouter from './auth';

const app = express();
const PORT = 3000;


//todo scenario 3 and 4 - if no DB found, show setup screen, allow custom path and initiation with empty database
initDb(true);

app.use(cors());
app.use(express.json());
app.use(queries);
app.use(authRouter);


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Version: ${VERSION}`);
});