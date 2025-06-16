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

export const dashboardData = async (req: Request, res: Response): Promise<void> => {
    try {

        let result;

        const salesDailyQuery: any = await connection.query(`
            SELECT SUM(tr_order.total_price) AS total_sales
            FROM tr_order
                JOIN ms_order_status ON tr_order.order_status_id = ms_order_status.order_status_id
            WHERE tr_order.order_status_id = 1
                AND DATE(tr_order.created_at) = CURDATE()
        `, []);

        const salesMonthlyQuery: any = await connection.query(`
            SELECT SUM(tr_order.total_price) AS total_sales
            FROM tr_order
                JOIN ms_order_status ON tr_order.order_status_id = ms_order_status.order_status_id
            WHERE tr_order.order_status_id = 1
                AND MONTH(tr_order.created_at) = MONTH(CURDATE())
        `, []);

        const adminFees: any = await connection.query(
            `
                SELECT ms_setup.setup_id,
                    ms_setup.admin_fees
                FROM ms_setup
            `,
            []
        );

        // perday in 1 week (show all days, even without sales)
        const salesPerDayQuery: any = await connection.query(`
            WITH RECURSIVE dates AS (
                SELECT CURDATE() - INTERVAL 6 DAY AS order_date
                UNION ALL
                SELECT order_date + INTERVAL 1 DAY FROM dates WHERE order_date + INTERVAL 1 DAY <= CURDATE()
            )
            SELECT 
                d.order_date, 
                COALESCE(SUM(tr_order.total_price), 0) AS total_sales
            FROM dates d
            LEFT JOIN tr_order ON DATE(tr_order.created_at) = d.order_date AND tr_order.order_status_id = 1
            GROUP BY d.order_date
            ORDER BY d.order_date ASC
        `, []);

        const target = 5000000;

        const totalSales = {
            daily: +salesDailyQuery[0][0]?.total_sales || 0,
            daily_percentage: +(salesDailyQuery[0][0]?.total_sales / target * 100),
            monthly: +salesMonthlyQuery[0][0]?.total_sales || 0,
            monthly_percentage: +(salesMonthlyQuery[0][0]?.total_sales / target * 100),
            admin_sales_monthly: +(salesMonthlyQuery[0][0]?.total_sales * (adminFees[0][0]?.admin_fees || 0) / 100),
            admin_percentage: +(salesMonthlyQuery[0][0]?.total_sales / target * 100),
            sales_per_day: salesPerDayQuery[0].map((item: any) => ({
                date: item.order_date,
                total_sales: +item.total_sales || 0
            })),
        };

        ResponseHandler.success(res, totalSales || null);
        
    } catch (error) {
        console.log("Failed to get dashboard data", error);
        ResponseHandler.error(res, "Failed to get dashboard data", error);
    }
}
