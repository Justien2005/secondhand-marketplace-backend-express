import { Router } from 'express';
import { method1, method2 } from '../controller/controllers';

// Initialization
const router = Router();

// Requests
router.get('/api', method1);
router.post('/', method2);

export default router;
