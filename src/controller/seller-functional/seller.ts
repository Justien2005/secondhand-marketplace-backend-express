import { Request, Response } from "express";
import connection from "../../database";
import { ResponseHandler } from "../../response/response";

export const sellerList = async (req: Request, res: Response): Promise<void> => {
    try {

        const result = await querySellerList();

        ResponseHandler.success(res, result);
        
    } catch (error) {
        console.log("Failed to fetch sellers", error);
        ResponseHandler.error(res, "Failed to fetch sellers", error);
    }
}

export const sellerDetail = async (req: Request, res: Response): Promise<void> => {
    try {

        const sellerId = +req.params.seller_id;

        const result = await querySellerDetail(sellerId);

        ResponseHandler.success(res, result);
        
    } catch (error) {
        console.log("Failed to fetch seller details", error);
        ResponseHandler.error(res, "Failed to fetch seller details", error);
    }
}

async function querySellerList() {
    try {
        const query = `
            SELECT ms_user.username,
                ms_user.email,
                ms_user.fullname,
                ms_seller.seller_id
            FROM ms_seller
            JOIN ms_user ON ms_seller.user_id = ms_user.user_id
                AND ms_user.deleted_at IS NULL
            WHERE ms_seller.deleted_at IS NULL
        `;

        const result = await connection.query(query, []);

        return result[0] || [];
    } catch (error) {
        throw new Error("Error [querySellerList]: " + error);
    }
};

async function querySellerDetail(sellerId: number) {
    try {
        const query = `
            SELECT ms_user.username,
                ms_user.email,
                ms_user.fullname,
                ms_seller.seller_id,
                ms_seller.location,
                ms_seller.description,
                ms_seller.contact
            FROM ms_seller
            JOIN ms_user ON ms_seller.user_id = ms_user.user_id
                AND ms_user.deleted_at IS NULL
            WHERE ms_seller.deleted_at IS NULL
                AND ms_seller.seller_id = ?
        `;

        const result = await connection.query(query, [+sellerId]);

        return result[0] || [];
    } catch (error) {
        throw new Error("Error [querySellerDetail]: " + error);
    }
};
