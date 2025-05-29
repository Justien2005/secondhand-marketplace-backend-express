// controllers/authController.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import connection from "../../database";

// In-memory mock database
const JWT_SECRET = process.env.JWT_SECRET as string;

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = req.body;

        const hashed = await bcrypt.hash(data.password, 10);
        const query = `
            INSERT INTO
                users (username, password, email, fullname, created_at)
            VALUES (?, ?, ?, ?, ?)
        `;

        const queryParameters = [data.username, hashed, data.email, data.fullname, new Date()];

        await connection.query(query, queryParameters);

        res.status(201).json({
            message: "User registered"
        });
    } catch (error) {
        console.log("Failed to register user", error);
        res.status(400).json({
            message: "Failed to register user",
            error: error
        });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {

    try {
        const data = req.body;

        let user: any;

        user = await connection.query(`
            SELECT username, password, email
            FROM users WHERE username = ?`,
            [data.email]
        );

        const userData = user[0][0];

        console.log("User data", userData);

        if (!userData) {
            throw new Error("User not found");
        }

        if (!user || !(await bcrypt.compare(data.password, userData.password))) {
            throw new Error("Invalid credentials");
        }

        const token = jwt.sign({ username: userData.username }, JWT_SECRET, { expiresIn: "1h" });

        res.status(201).json({
            token: token
        });
    } catch (error: any) {
        console.log("Failed to login", error);
        res.status(401).json({
            message: "Failed to login",
            error: error.message
        });
    }

};

export const verifyToken = (req: Request, res: Response): void => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({
        message: "No token provided",
    });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err: any) => {
    if (err) {
        res.status(403).json({
            message: "Invalid token",
        });
      return;
    }

    res.status(201).json({
        status: true
    });
  });
};
