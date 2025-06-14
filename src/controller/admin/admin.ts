import { Request, Response } from "express";
import connection from "../../database";
import { ResponseHandler } from "../../response/response";

export const getAdminFees = async (req: Request, res: Response): Promise<void> => {
    try {

        const result: any = await connection.query(
            `
                SELECT ms_setup.setup_id,
                    ms_setup.admin_fees
                FROM ms_setup
            `,
            []
        );

        ResponseHandler.success(res, result[0][0] || []);
        
    } catch (error) {
        console.log("Failed to change get admin fees", error);
        ResponseHandler.error(res, "Failed to change get admin fees", error);
    }
}

export const changeAdminFees = async (req: Request, res: Response): Promise<void> => {
    try {
        const header = (req as any).user;
        const adminId = header['admin_id'] ? +header['admin_id'] : null;
        const data = req.body;

        if (!adminId) {
            ResponseHandler.error(res, "Unauthorized access", { status: 401 });
            return;
        }

        const result: any = await connection.query(
            `
                UPDATE ms_setup
                SET admin_fees = ?
                WHERE setup_id = 1
            `,
            [+data.new_fee]
        );

        ResponseHandler.success(res, result[0][0] || []);
        
    } catch (error) {
        console.log("Failed to change admin fees", error);
        ResponseHandler.error(res, "Failed to change admin fees", error);
    }
}
