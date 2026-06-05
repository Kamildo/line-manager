import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { users } from './users';

const router = Router();

// TODO: move to env var before any real deployment
const JWT_SECRET = 'line-manager-dev-secret';
const JWT_EXPIRES = '8h';

export interface AuthRequest extends Request {
    user?: { username: string; role: string };
}

router.post('/api/auth/login', (req: Request, res: Response) => {
    const { username, password } = req.body;

    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
    }

    const token = jwt.sign(
        { username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES }
    );

    res.json({ token, role: user.role });
});


export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.split(' ')[1] : null;
    if (!token) { res.status(401).json({ error: 'No token' }); return; }
    try {
        req.user = jwt.verify(token, JWT_SECRET) as unknown as { username: string; role: string };
        next();
    } catch {
        res.status(401).json({ error: 'Invalid token' });
    }
};
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    requireAuth(req, res, () => {
        if (req.user?.role !== 'admin') {
            res.status(403).json({ error: 'Admin only' }); return;
        }
        next();
    });
};

export default router;