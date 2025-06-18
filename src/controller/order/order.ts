import { Request, Response } from "express";
import connection from "../../database";
import { ResponseHandler } from "../../response/response";

export const createBid = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = req.body;
        const header = (req as any).user;
        const buyerId = header['buyer_id'] ? +header['buyer_id'] : null;

        if (!buyerId) {
            ResponseHandler.error(res, "Unauthorized access", { status: 401 });
            return;
        }

        await connection.query(
            `
                INSERT INTO tr_bid (buyer_id, product_id, bid_price, created_at)
                VALUES (?, ?, ?, ?)
            `,
            [buyerId, data.product_id, data.bid_price, new Date()]
        );

        ResponseHandler.success(res, null);
        
    } catch (error) {
        console.log("Failed to get order list", error);
        ResponseHandler.error(res, "Failed to create bid", error);
    }
}

export const buyerOrderList = async (req: Request, res: Response): Promise<void> => {
    try {

        const header = (req as any).user;
        const buyerId = header['buyer_id'] ? +header['buyer_id'] : null;

        if (!buyerId) {
            ResponseHandler.error(res, "Unauthorized access", { status: 401 });
            return;
        }

        const orderList = await getOrderList(buyerId);

        ResponseHandler.success(res, orderList);
        
    } catch (error) {
        console.log("Failed to get order list", error);
        ResponseHandler.error(res, "Failed to get order list", error);
    }
}

export const adminOrderList = async (req: Request, res: Response): Promise<void> => {
    try {

        const header = (req as any).user;
        const adminId = header['admin_id'] ? +header['admin_id'] : null;

        if (!adminId) {
            ResponseHandler.error(res, "Unauthorized access", { status: 401 });
            return;
        }

        const orderList = await getOrderListByAdmin();

        ResponseHandler.success(res, orderList);
        
    } catch (error) {
        console.log("Failed to get order list", error);
        ResponseHandler.error(res, "Failed to get order list", error);
    }
}

export const changeOrderStatus = async (req: Request, res: Response): Promise<void> => {
    try {

        const header = (req as any).user;
        const adminId = header['admin_id'] ? +header['admin_id'] : null;

        if (!adminId) {
            ResponseHandler.error(res, "Unauthorized access", { status: 401 });
            return;
        }

        await connection.query(
            `
                UPDATE tr_order
                SET order_status_id = ?, updated_at = ?
                WHERE order_id = ? AND deleted_at IS NULL
            `,
            [req.body.order_status_id, new Date(), req.body.order_id]
        );

        ResponseHandler.success(res, null);
        
    } catch (error) {
        console.log("Failed to get order list", error);
        ResponseHandler.error(res, "Failed to get order list", error);
    }
}

export const getOrderStatusOptions = async (req: Request, res: Response): Promise<void> => {
    try {

        const result = await connection.query(
            `
                SELECT order_status_id, status_type
                FROM ms_order_status
            `,
            []
        );

        ResponseHandler.success(res, result[0]);
        
    } catch (error) {
        console.log("Failed to get order list", error);
        ResponseHandler.error(res, "Failed to get order list", error);
    }
}

async function getOrderListByAdmin() {
    try {

        let query = `
            SELECT 
                tr_order.order_id,
                tr_order.order_time,
                tr_order.total_price,
                ms_order_status.status_type,
                ms_user.fullname,
                JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'order_item_id', tr_order_item.order_item_id,
                        'order_id', tr_order_item.order_id,
                        'product_id', tr_order_item.product_id,
                        'quantity', tr_order_item.quantity,
                        'price', tr_order_item.price,
                        'product_name', ms_product.product_name
                    )
                ) AS order_items
            FROM tr_order
            LEFT JOIN tr_order_item ON tr_order.order_id = tr_order_item.order_id
                AND tr_order_item.deleted_at IS NULL
            LEFT JOIN ms_order_status ON tr_order.order_status_id = ms_order_status.order_status_id
            LEFT JOIN ms_product ON tr_order_item.product_id = ms_product.product_id
                AND ms_product.deleted_at IS NULL
            LEFT JOIN ms_buyer ON tr_order.buyer_id = ms_buyer.buyer_id
            LEFT JOIN ms_user ON ms_buyer.user_id = ms_user.user_id
                AND ms_user.deleted_at IS NULL
            WHERE tr_order.deleted_at IS NULL
            GROUP BY tr_order.order_id, tr_order_item.order_item_id
        `;

        const [result]: any = await connection.query(query, []);

        return result;
    } catch (error) {
        throw new Error("Error [getOrderList]: " + error);
    }
}


async function getOrderList(buyerId: any = null) {
    try {

        let query = `
            SELECT 
                tr_order.order_id,
                tr_order.order_time,
                tr_order.total_price,
                ms_order_status.status_type,
                JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'order_item_id', tr_order_item.order_item_id,
                        'order_id', tr_order_item.order_id,
                        'product_id', tr_order_item.product_id,
                        'quantity', tr_order_item.quantity,
                        'price', tr_order_item.price,
                        'product_name', ms_product.product_name,
                        'product_price', ms_product.price
                    )
                ) AS order_items
            FROM tr_order
            LEFT JOIN tr_order_item ON tr_order.order_id = tr_order_item.order_id
                AND tr_order_item.deleted_at IS NULL
            LEFT JOIN ms_order_status ON tr_order.order_status_id = ms_order_status.order_status_id
            LEFT JOIN ms_product ON tr_order_item.product_id = ms_product.product_id
                AND ms_product.deleted_at IS NULL
            WHERE tr_order.deleted_at IS NULL
                ${buyerId ? ' AND tr_order.buyer_id = ?' : ''}
            GROUP BY tr_order.order_id
        `;

        const queryParameter = buyerId ? [buyerId] : [];

        const [result]: any = await connection.query(query, queryParameter);

        return result;
    } catch (error) {
        throw new Error("Error [getOrderList]: " + error);
    }
}

export const makeOrder = async (req: Request, res: Response, responseOnly: any = false): Promise<void> => {
    try {

        const body = req.body;

        const header = (req as any).user;
        const buyerId = header['buyer_id'] ? +header['buyer_id'] : null;

        if (!buyerId) {
            ResponseHandler.error(res, "Unauthorized access", { status: 401 });
            return;
        }

        // validate request body
        if (!body.order_products) {
            ResponseHandler.error(res, "Invalid request body", { status: 400 });
            return;
        }

        // validate balance logic

        // create order
        const orderId = await createOrder(body, buyerId);
        
        // create order items
        for (const item of body.order_products) {

            const stocks: any = await connection.query(
                `   
                    SELECT count(ms_product_item.product_item_id) AS stock
                    FROM ms_product_item
                    WHERE ms_product_item.product_id = ?
                        AND ms_product_item.available = 1
                        AND ms_product_item.deleted_at IS NULL
                `,
                [body.order_products[0].product_id]
            );
            
            if (stocks[0].stock < body.order_products[0].quantity) {
                ResponseHandler.error(res, "Insufficient stock", { status: 400 });
                return;
            }

            const newOrderItemId = await createOrderItem(item, orderId);

            for (let i = 0; i < item.quantity; i++) {
                await connection.query(
                    `
                        UPDATE ms_product_item
                        SET available = 0, order_item_id = ?
                        WHERE product_id = ?
                            AND available = 1
                        LIMIT 1`,
                    [newOrderItemId, +item.product_id]
                );
            }
        }

        console.log(responseOnly === true)

        if (responseOnly === true) {
            return;
        };
        ResponseHandler.success(res, null);
        
    } catch (error) {
        console.log("Failed to create order", error);
        ResponseHandler.error(res, "Failed to create order", error);
    }
}

async function createOrder(data: any, buyerId: number) {
    try {

        const query = `
            INSERT INTO tr_order (buyer_id, created_at, order_time, order_status_id, total_price)
            VALUES (?, ?, ?, ?, ?)
        `;

        const queryParameter = [
            buyerId,
            new Date(),
            new Date(),
            4,
            data.total_price
        ];

        const [result]: any = await connection.query(query, queryParameter);
        const newOrderId = result.insertId;

        return newOrderId;
    } catch (error) {
        throw new Error("Error [createOrder]: " + error);
    }
};

async function createOrderItem(data: any, orderId: number) {
    try {

        const query = `
            INSERT INTO tr_order_item (order_id, product_id, quantity, created_at, price)
            VALUES (?, ?, ?, ?, ?)
        `;

        const queryParameter = [
            orderId,
            data.product_id,
            data.quantity,
            new Date(),
            data.price
        ];

        const [result]: any = await connection.query(query, queryParameter);
        const newOrderItemId = result.insertId;

        return newOrderItemId;
    } catch (error) {
        throw new Error("Error [createOrderItem]: " + error);
    }
};
