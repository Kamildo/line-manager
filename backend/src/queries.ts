import { Router, Request, Response } from 'express';
import { db } from './database';
import { requireAuth, requireAdmin } from './auth';

const router = Router();

export const safe = (fn: any) => (req: Request, res: Response) => {
    try {
        fn(req, res);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};


router.get('/api/products', safe((req: Request, res: Response) => {
    const products = db.instance.prepare('SELECT * FROM products').all();
    res.json(products);
}));

router.get('/api/assembly_lines', safe((req: Request, res: Response) => {
    const assemblyLines = db.instance.prepare('SELECT * FROM assembly_lines').all();
    res.json(assemblyLines);
}));

router.get('/api/workstations', safe((req: Request, res: Response) => {
    const workstations = db.instance.prepare('SELECT * FROM workstations').all();
    res.json(workstations);
}));

router.get('/api/assembly_lines/:id/workstations', safe((req: Request, res: Response) => {
    const workstations = db.instance.prepare(`
        SELECT w.*, assembly_line_workstations.order_index
        FROM workstations w
        JOIN assembly_line_workstations ON w.id = assembly_line_workstations.workstation_id
        WHERE assembly_line_workstations.assembly_line_id = ?
        ORDER BY assembly_line_workstations.order_index
    `).all(req.params.id);
    res.json(workstations);
}));

router.get('/api/assembly_lines/:id/workstations/unassigned', safe((req: Request, res: Response) => {
    const workstations = db.instance.prepare(`
        SELECT w.*
        FROM workstations w
        WHERE w.id NOT IN (
            SELECT workstation_id
            FROM assembly_line_workstations
            WHERE assembly_line_id = ?
        )
    `).all(req.params.id);
    res.json(workstations);
}));



//workstations endpoints
router.delete('/api/workstations/workstations_assembly_line_unassign_all/:id', requireAdmin, safe((req: Request, res: Response) => {
    console.log('DELETE id:', req.params.id);
    db.instance.prepare('DELETE FROM assembly_line_workstations WHERE workstation_id = ?').run(req.params.id);
    res.json({ success: true });
}));//not in use yet can be used for unassign all


router.get('/api/workstations/:id/assembly_lines', safe((req: Request, res: Response) => {
    const lines = db.instance.prepare(`
    SELECT al.*, p.name as product_name
    FROM assembly_lines al
    LEFT JOIN products p ON al.product_id = p.id
    WHERE al.id IN (SELECT assembly_line_id FROM assembly_line_workstations WHERE workstation_id = ?)
  `).all(req.params.id);
    res.json(lines);
}));

router.post('/api/workstations', requireAuth, safe((req: Request, res: Response) => {
    const { name, short_name, pc_name } = req.body;
    const result = db.instance.prepare(
        'INSERT INTO workstations (name, short_name, pc_name) VALUES (?, ?, ?)'
    ).run(name, short_name, pc_name);
    res.json({ id: result.lastInsertRowid, name, short_name, pc_name });
}));

router.put('/api/workstations/:id', requireAuth, safe((req: Request, res: Response) => {
    const { name, short_name, pc_name } = req.body;
    db.instance.prepare(
        'UPDATE workstations SET name=?, short_name=?, pc_name=? WHERE id=?'
    ).run(name, short_name, pc_name, req.params.id);
    res.json({ id: Number(req.params.id), name, short_name, pc_name });
}));

router.delete('/api/workstations/:id', requireAdmin, safe((req: Request, res: Response) => {
    db.instance.prepare('DELETE FROM workstations WHERE id=?').run(req.params.id);
    res.json({ success: true });
}));

router.get('/api/workstations_with_assembly_lines_flag', safe((req: Request, res: Response) => {
    const lines = db.instance.prepare(`
    SELECT w.*, 
      CASE WHEN EXISTS (
        SELECT 1 FROM assembly_line_workstations WHERE workstation_id = w.id
      ) THEN 1 ELSE 0 END as has_assembly_lines
    FROM workstations w
  `).all();
    res.json(lines);
}));


// assembly line management endpoints

router.delete(
    '/api/assembly_lines/workstations_assembly_line_unassign_all_and_delete/:id', requireAdmin,
    safe((req: Request, res: Response) => {
        console.log('DELETE id:', req.params.id);
        db.instance.prepare('DELETE FROM assembly_line_workstations WHERE assembly_line_id = ?').run(req.params.id);
        db.instance.prepare('DELETE FROM assembly_lines WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    })
);

router.get('/api/assembly_lines_with_products', safe((req: Request, res: Response) => {
    const lines = db.instance.prepare(`
    SELECT al.*, p.name as product_name
    FROM assembly_lines al
    LEFT JOIN products p ON al.product_id = p.id
  `).all();
    res.json(lines);
}));

router.post('/api/assembly_lines', requireAuth, safe((req: Request, res: Response) => {
    const { name, active, product_id } = req.body;
    const result = db.instance.prepare(
        'INSERT INTO assembly_lines (name, active, product_id) VALUES (?, ?, ?)'
    ).run(name, active ? 1 : 0, product_id ?? null);
    res.json({ id: result.lastInsertRowid, name, active, product_id });
}));

router.put('/api/assembly_lines/:id', requireAuth, safe((req: Request, res: Response) => {
    const { name, active, product_id } = req.body;
    db.instance.prepare(
        'UPDATE assembly_lines SET name=?, active=?, product_id=? WHERE id=?'
    ).run(name, active ? 1 : 0, product_id ?? null, req.params.id);
    res.json({ id: Number(req.params.id), name, active, product_id });
}));

router.delete('/api/assembly_lines/:id', requireAdmin, safe((req: Request, res: Response) => {
    db.instance.prepare('DELETE FROM assembly_lines WHERE id=?').run(req.params.id);
    res.json({ success: true });
}));

router.get('/api/assembly_lines_with_workstation_flag', safe((req: Request, res: Response) => {
    const lines = db.instance.prepare(`
    SELECT al.*, p.name as product_name,
      CASE WHEN EXISTS (
        SELECT 1 FROM assembly_line_workstations WHERE assembly_line_id = al.id
      ) THEN 1 ELSE 0 END as has_workstations
    FROM assembly_lines al
    LEFT JOIN products p ON al.product_id = p.id
  `).all();
    res.json(lines);
}));

//assignments endpoints

router.put('/api/assembly_lines/assign-products', requireAuth, safe((req: Request, res: Response) => {
    const { product_id, al_ids } = req.body;
    const update = db.instance.transaction(() => {
        db.instance.prepare(`
        UPDATE assembly_lines SET product_id = NULL
        WHERE product_id = ?
        ${al_ids.length > 0 ? `AND id NOT IN (${al_ids.map(() => '?').join(',')})` : ''}
        `).run(product_id, ...al_ids);
        if (al_ids.length > 0) {
            const assign = db.instance.prepare(`
                UPDATE assembly_lines SET product_id = ? WHERE id = ?
                AND (product_id IS NULL OR product_id != ?)
            `);
            al_ids.forEach((id: number) => assign.run(product_id, id, product_id));
        }
    });
    update();
    res.json({ success: true });
}));

router.put('/api/assembly_lines/:id/workstations', requireAuth, safe((req: Request, res: Response) => {
    const alId = Number(req.params.id);
    const workstations: { id: number, order_index: number }[] = req.body;
    const update = db.instance.transaction(() => {
        db.instance.prepare(`DELETE FROM assembly_line_workstations WHERE assembly_line_id = ?`).run(alId);
        if (workstations.length > 0) {
            const insert = db.instance.prepare(`
                INSERT INTO assembly_line_workstations (assembly_line_id, workstation_id, order_index)
                VALUES (?, ?, ?)
            `);
            workstations.forEach(ws => insert.run(alId, ws.id, ws.order_index));
        }
    });
    update();
    res.json({ success: true });
}));

//products endpoints

router.delete('/api/products/:id',requireAdmin,
    safe((req: Request, res: Response) => {
        console.log('DELETE id:', req.params.id);
        db.instance.prepare('UPDATE assembly_lines set product_id = NULL WHERE product_id = ?').run(req.params.id);
        db.instance.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    })
);

router.post('/api/products', requireAuth, safe((req: Request, res: Response) => {
    const { name} = req.body;
    const result = db.instance.prepare(
        'INSERT INTO products (name) VALUES (?)'
    ).run(name);
    res.json({ id: result.lastInsertRowid, name });

}));

router.put('/api/products/:id', requireAuth, safe((req: Request, res: Response) => {
    const { name} = req.body;
    db.instance.prepare(
        'UPDATE products SET name=? WHERE id=?'
    ).run(name, req.params.id);
    res.json({ id: Number(req.params.id), name });
}));


export default router;