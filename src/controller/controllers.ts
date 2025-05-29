import { Request, Response } from 'express';

// Methods to be executed on routes
const method1 = (req: Request, res: Response): void => {
    console.log('Hello, Welcome to our PageD');
    res.send("Hello, Welcome to our Page");
}

const method2 = (req: Request, res: Response): void => {
    res.send("Hello, This was a post Request");
}

// Export of all methods as object
export {
    method1,
    method2
};
