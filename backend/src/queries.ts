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


//assignments endpoints

router.put('/api/assembly_lines/assign-products', (req, res) => {
    const { product_id, al_ids } = req.body;
    const update = db.transaction(() => {
        db.prepare(`
        UPDATE assembly_lines SET product_id = NULL
        WHERE product_id = ?
        ${al_ids.length > 0 ? `AND id NOT IN (${al_ids.map(() => '?').join(',')})` : ''}
        `).run(product_id, ...al_ids);
        if (al_ids.length > 0) {
            const assign = db.prepare(`
                UPDATE assembly_lines SET product_id = ? WHERE id = ?
                AND (product_id IS NULL OR product_id != ?)
            `);
            al_ids.forEach((id: number) => assign.run(product_id, id, product_id));
        }
    });
    update();
    res.json({ success: true });
});

router.put('/api/assembly_lines/:id/workstations', (req, res) => {
    const alId = Number(req.params.id);
    const workstations: { id: number, order_index: number }[] = req.body;
    const update = db.transaction(() => {
        db.prepare(`DELETE FROM assembly_line_workstations WHERE assembly_line_id = ?`).run(alId);
        if (workstations.length > 0) {
            const insert = db.prepare(`
                INSERT INTO assembly_line_workstations (assembly_line_id, workstation_id, order_index)
                VALUES (?, ?, ?)
            `);
            workstations.forEach(ws => insert.run(alId, ws.id, ws.order_index));
        }
    });
    update();
    res.json({ success: true });
});



export default router;