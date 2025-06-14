import { Request, Response } from "express";
import connection from "../../database";
import { ResponseHandler } from "../../response/response";

export const roleList = async (req: Request, res: Response): Promise<void> => {
    try {

        const result = await queryRoleList();

        ResponseHandler.success(res, result);
        
    } catch (error) {
        console.log("Failed to get roles", error);
        ResponseHandler.error(res, "Failed to get roles", error);
    }
}

async function queryRoleList() {
    try {
        const query = `
            select ms_role.role_id,
                ms_role.role_name
            from ms_role
            where ms_role.deleted_at is null
        `;

        const result = await connection.query(query, []);

        return result[0] || [];
    } catch (error) {
        throw new Error("Error [queryRoleList]: " + error);
    }
};
