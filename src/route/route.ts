import { Router } from 'express';
import { method1, method2 } from '../controller/controllers';
import * as auth from '../controller/auth/auth-controller';

// Initialization
const router = Router();

// Requests
router.get('/api', method1);
router.post('/', method2);

// AUTH
router.post('/register', auth.register);
router.post("/login", auth.login);
router.get('/verify-token', auth.verifyToken);

export default router;
