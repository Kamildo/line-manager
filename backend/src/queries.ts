import { Router } from 'express';
import db from './database';

const router = Router();

router.get('/api/products', (req, res) => {
    // TODO: add try/catch + proper error handling
    const products = db.prepare('SELECT * FROM products').all();
    res.json(products);
});

router.get('/api/assembly_lines', (req, res) => {
    // TODO: add try/catch + proper error handling
    const assemblyLines = db.prepare('SELECT * FROM assembly_lines').all();
    res.json(assemblyLines);
});

router.get('/api/workstations', (req, res) => {
    // TODO: add try/catch + proper error handling
    const workstations = db.prepare('SELECT * FROM workstations').all();
    res.json(workstations);
});

export default router;