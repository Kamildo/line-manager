import { Router } from 'express';
import db from './database';

const router = Router();

router.get('/api/products', (req, res) => {
    const products = db.prepare('SELECT * FROM products').all();
    res.json(products);
});

router.get('/api/assembly_lines', (req, res) => {
    const assemblyLines = db.prepare('SELECT * FROM assembly_lines').all();
    res.json(assemblyLines);
});

router.get('/api/workstations', (req, res) => {
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

// assembly line management endpoints

router.get('/api/assembly_lines_with_products', (req, res) => {
    const lines = db.prepare(`
    SELECT al.*, p.name as product_name
    FROM assembly_lines al
    LEFT JOIN products p ON al.product_id = p.id
  `).all();
    res.json(lines);
});

router.post('/api/assembly_lines', (req, res) => {
    const { name, active, product_id } = req.body;
    const result = db.prepare(
        'INSERT INTO assembly_lines (name, active, product_id) VALUES (?, ?, ?)'
    ).run(name, active ? 1 : 0, product_id ?? null);
    res.json({ id: result.lastInsertRowid, name, active, product_id });
});

router.put('/api/assembly_lines/:id', (req, res) => {
    const { name, active, product_id } = req.body;
    db.prepare(
        'UPDATE assembly_lines SET name=?, active=?, product_id=? WHERE id=?'
    ).run(name, active ? 1 : 0, product_id ?? null, req.params.id);
    res.json({ id: Number(req.params.id), name, active, product_id });
});

router.delete('/api/assembly_lines/:id', (req, res) => {
    db.prepare('DELETE FROM assembly_lines WHERE id=?').run(req.params.id);
    res.json({ success: true });
});

router.get('/api/assembly_lines_with_workstation_flag', (req, res) => {
    const lines = db.prepare(`
    SELECT al.*, p.name as product_name,
      CASE WHEN EXISTS (
        SELECT 1 FROM assembly_line_workstations WHERE assembly_line_id = al.id
      ) THEN 1 ELSE 0 END as has_workstations
    FROM assembly_lines al
    LEFT JOIN products p ON al.product_id = p.id
  `).all();
    res.json(lines);
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