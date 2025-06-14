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
                ms_user (username, password, email, fullname, created_at, role_id)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        const queryParameters = [data.username, hashed, data.email, data.fullname, new Date(), data.role_id];

        let tableRoleInsertion;

        if (+data.role_id === 1) {
            tableRoleInsertion = 'ms_admin';
        } else if (+data.role_id === 2) {
            tableRoleInsertion = 'ms_seller';
        } else if (+data.role_id === 3) {
            tableRoleInsertion = 'ms_buyer';
        }

        const queryRole = `
            INSERT INTO
                ${tableRoleInsertion} (user_id)
            VALUES (?)
        `;
        // insert users
        const [result]: any = await connection.query(query, queryParameters);
        const newUserId = result.insertId;

        const queryRoleParameters = [+newUserId];

        // insert role
        await connection.query(queryRole, queryRoleParameters);

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
            SELECT username, password, email, user_id
            FROM ms_user WHERE username = ?`,
            [data.email]
        );

        const userData = user[0][0];

        if (!userData) {
            throw new Error("User not found");
        }

        if (!user || !(await bcrypt.compare(data.password, userData.password))) {
            throw new Error("Invalid credentials");
        }
        
        // check role & permissions
        const role: any = (await connection.query(`   
            SELECT
                ms_role.role_id,
                ms_role.role_name,
                ms_admin.admin_id,
                ms_seller.seller_id,
                ms_buyer.buyer_id,
                json_arrayagg(ms_permission.permission_name) as permissions
            FROM ms_user
            JOIN ms_role ON ms_user.role_id = ms_role.role_id
                AND ms_role.deleted_at IS NULL
            LEFT JOIN ms_admin ON ms_user.user_id = ms_admin.user_id
            LEFT JOIN ms_seller ON ms_user.user_id = ms_seller.user_id
            LEFT JOIN ms_buyer ON ms_user.user_id = ms_buyer.user_id
            LEFT JOIN ms_permission ON ms_role.role_id = ms_permission.role_id
            WHERE ms_user.deleted_at IS NULL
                AND ms_user.user_id = ?
            GROUP BY  ms_role.role_id,
                ms_role.role_name,
                ms_admin.admin_id,
                ms_seller.seller_id,
                ms_buyer.buyer_id
        `, [userData.user_id]))[0];

        const token = jwt.sign({
            username: userData.username,
            admin_id: role[0].admin_id,
            seller_id: role[0].seller_id,
            buyer_id: role[0].buyer_id
        }, JWT_SECRET, { expiresIn: "1h" });

        res.status(201).json({
            token: token,
            username: userData.username,
            email: userData.email,
            user_id: userData.user_id,
            roles : role[0]
        });
    } catch (error: any) {
        console.log("Failed to login", error);
        res.status(401).json({
            message: "Failed to login",
            error: error.message
        });
    }

};

export const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        res.status(401).json({
        message: "No token provided",
        });
        return;
    }

    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
        if (err) {
        res.status(403).json({
            message: "Invalid token, please login again",
        });
        return;
        }

        (req as any).user = decoded;
        next();
    });
};
