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

router.get('/api/assembly_lines/:id/workstations', (req, res) => {
    const workstations = db.prepare(`
        SELECT w.*, assembly_line_workstations.order_index
        FROM workstations w
        JOIN assembly_line_workstations ON w.id = assembly_line_workstations.workstation_id
        WHERE assembly_line_workstations.assembly_line_id = ?
        ORDER BY assembly_line_workstations.order_index
    `).all(req.params.id);
    res.json(workstations);
});

router.get('/api/assembly_lines/:id/workstations/unassigned', (req, res) => {
    const workstations = db.prepare(`
        SELECT w.*
        FROM workstations w
        WHERE w.id NOT IN (
            SELECT workstation_id
            FROM assembly_line_workstations
            WHERE assembly_line_id = ?
        )
    `).all(req.params.id);
    res.json(workstations);
});


export default router;