import { Request, Response } from "express";
import connection from "../../database";
import { ResponseHandler } from "../../response/response";
import { makeOrder } from "../order/order";

export const productBySeller = async (req: Request, res: Response): Promise<void> => {
    try {

        const sellerId = +req.params.seller_id;

        const result = await queryProductList(sellerId);

        ResponseHandler.success(res, result);
        
    } catch (error) {
        console.log("Failed to fetch seller products", error);
        ResponseHandler.error(res, "Failed to fetch seller products", error);
    }
}

export const productAll = async (req: Request, res: Response): Promise<void> => {
    try {

        const products: any = await queryProductList();

        ResponseHandler.success(res, products);
        
    } catch (error) {
        console.log("Failed to fetch products", error);
        ResponseHandler.error(res, "Failed to fetch products", error);
    }
}

export const productCatalog = async (req: Request, res: Response): Promise<void> => {
    try {

        const products: any = await queryProductCatalog();

        const productAll = products.map((product: any) => {
            let photoDataUrl = null;
            if (product.photo_data && product.photo_mime_type) {
                const base64Image = product.photo_data.toString('base64');
                photoDataUrl = `data:${product.photo_mime_type};base64,${base64Image}`;
            }

            return {
                product_id: product.product_id,
                product_name: product.product_name,
                price: product.price,
                stock: product.stock,
                location: product.location,
                condition_type: product.condition_type,
                photoDataUrl: photoDataUrl
            };
        });

        ResponseHandler.success(res, productAll);
        
    } catch (error) {
        console.log("Failed to fetch product catalog", error);
        ResponseHandler.error(res, "Failed to fetch product catalog", error);
    }
}

export const productDetail = async (req: Request, res: Response): Promise<void> => {
    try {
        const product: any = await queryProductCatalog(+req.params.product_id);

        const detail = product[0];

        let photoDataUrl = null;
        if (detail.photo_data && detail.photo_mime_type) {
            const base64Image = detail.photo_data.toString('base64');
            photoDataUrl = `data:${detail.photo_mime_type};base64,${base64Image}`;
        }

        detail.photoDataUrl = photoDataUrl;

        const result = {
            product_id: detail.product_id,
            product_name: detail.product_name,
            price: detail.price,
            stock: detail.stock,
            location: detail.location,
            condition_type: detail.condition_type,
            description: detail.description || null,
            category_name: detail.category_name || null,
            photoDataUrl: photoDataUrl,
            bids: detail.bids.length > 0 ? detail.bids[0].bid_id ? detail.bids : [] : []
        }

        ResponseHandler.success(res, result);
        
    } catch (error) {
        console.log("Failed to fetch detail product", error);
        ResponseHandler.error(res, "Failed to fetch detail product", error);
    }
}

export const productStatusChange = async (req: Request, res: Response): Promise<void> => {
    try {
        const productId = +req.params.product_id;
        const status = req.params.status;

        const insertStatus = status === 'true' ? 1 : 0;

        await connection.query(`
            UPDATE ms_product
            SET approved = ?
            WHERE product_id = ?
        `, [+insertStatus, productId]);

        ResponseHandler.success(res, null);
        
    } catch (error) {
        console.log("Failed to change product status", error);
        ResponseHandler.error(res, "Failed to change product status", error);
    }
}

export const productPriceChange = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = req.body;

        await connection.query(`
            UPDATE ms_product
            SET price = ?
            WHERE product_id = ?
        `, [+data.new_price, +data.product_id]);

        ResponseHandler.success(res, null);
        
    } catch (error) {
        console.log("Failed to change product price", error);
        ResponseHandler.error(res, "Failed to change product price", error);
    }
}

export const buyerWishlist = async (req: Request, res: Response): Promise<void> => {
    try {
        const header = (req as any).user;
        const buyerId = header['buyer_id'] ? +header['buyer_id'] : null;

        const query = await connection.query(`
            SELECT tr_wishlist.product_id,
                ms_product.product_name,
                count(ms_product_item.product_id) AS stock,
                ms_product.location,
                ms_product.photo_data,
                ms_product.photo_mime_type
            FROM tr_wishlist
            LEFT JOIN ms_product ON tr_wishlist.product_id = ms_product.product_id
                AND ms_product.deleted_at IS NULL
            LEFT JOIN ms_product_item ON ms_product.product_id = ms_product_item.product_id
                AND ms_product_item.deleted_at IS NULL
                AND ms_product_item.available = 1
            WHERE tr_wishlist.buyer_id = ?
                AND tr_wishlist.deleted_at IS NULL
            GROUP BY tr_wishlist.product_id,
                ms_product.product_name
        `, [buyerId]);

        const wishlist: any = query[0];

        const result = wishlist.map((item: any) => {
            let photoDataUrl = null;
            if (item.photo_data && item.photo_mime_type) {
                const base64Image = item.photo_data.toString('base64');
                photoDataUrl = `data:${item.photo_mime_type};base64,${base64Image}`;
            }

            return {
                product_id: item.product_id,
                product_name: item.product_name,
                stock: item.stock,
                location: item.location,
                photoDataUrl: photoDataUrl
            };
        });

        ResponseHandler.success(res, result);
        
    } catch (error) {
        console.log("Failed to get buyer wishlist", error);
        ResponseHandler.error(res, "Failed to get buyer wishlist", error);
    }
}

export const createWishlist = async (req: Request, res: Response): Promise<void> => {
    try {
        const header = (req as any).user;
        const buyerId = header['buyer_id'] ? +header['buyer_id'] : null;
        const productId = +req.params.product_id;

        await connection.query(`
            INSERT INTO tr_wishlist (buyer_id, product_id, created_at)
            VALUES (?, ?, ?)
        `, [buyerId, productId, new Date()]);

        ResponseHandler.success(res, null);
        
    } catch (error) {
        console.log("Failed to create buyer wishlist", error);
        ResponseHandler.error(res, "Failed to create buyer wishlist", error);
    }
}

export const deleteWishlist = async (req: Request, res: Response): Promise<void> => {
    try {
        const header = (req as any).user;
        const buyerId = header['buyer_id'] ? +header['buyer_id'] : null;
        const productId = +req.params.product_id;

        await connection.query(`
            UPDATE tr_wishlist
            SET deleted_at = ?
            WHERE buyer_id = ? AND product_id = ?
        `, [new Date(), buyerId, productId]);

        ResponseHandler.success(res, null);
        
    } catch (error) {
        console.log("Failed to create buyer wishlist", error);
        ResponseHandler.error(res, "Failed to create buyer wishlist", error);
    }
}

export const productConditions = async (req: Request, res: Response): Promise<void> => {
    try {

        const result = await connection.query(`
            SELECT condition_id, condition_type
            FROM product_condition
        `);

        ResponseHandler.success(res, result[0]);
        
    } catch (error) {
        console.log("Failed to get product conditions", error);
        ResponseHandler.error(res, "Failed to get product conditions", error);
    }
}

export const productCategories = async (req: Request, res: Response): Promise<void> => {
    try {

        const result = await connection.query(`
            SELECT category_id, category_name
            FROM ms_product_category
            WHERE deleted_at IS NULL
        `);

        ResponseHandler.success(res, result[0]);
        
    } catch (error) {
        console.log("Failed to get product categories", error);
        ResponseHandler.error(res, "Failed to get product categories", error);
    }
}

export const saveProduct = async (req: Request, res: Response): Promise<void> => {
    try {

        const data = req.body;
        const photoFile = req.file;
        const header = (req as any).user;
        const sellerId = header['seller_id'] ? +header['seller_id'] : null;

        if (sellerId === null) {
            ResponseHandler.error(res, "Seller data is missing");
            return;
        }

        if (data.stock <= 0) {
            ResponseHandler.error(res, "Stock must be greater than 0");
            return;
        }

        let photoDataBuffer: Buffer | null = null;
        let photoMimeType: string | null = null;

        if (photoFile) {
            photoDataBuffer = photoFile.buffer;
            photoMimeType = photoFile.mimetype;
        }

        const query = `
            INSERT INTO ms_product (
                product_name,
                price,
                listing_date,
                location,
                condition_id,
                category_id,
                seller_id,
                description,
                created_at,
                photo_data,
                photo_mime_type
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const queryParameter = [
            data.product_name,
            data.price,
            new Date(),
            data.location,
            data.condition_id,
            data.category_id,
            sellerId,
            data.description,
            new Date(),
            photoDataBuffer,
            photoMimeType
        ];

        const [result]: any = await connection.query(query, queryParameter);
        const newProductId = result.insertId;

        for (let i = 0; i < data.stock; i++) {
            await querySaveProductItem(newProductId);
        }

        ResponseHandler.success(res, null);
        
    } catch (error) {
        console.log("Failed to save product", error);
        ResponseHandler.error(res, "Failed to save product", error);
    }
}

export const getBuyerCartList = async (req: Request, res: Response): Promise<void> => {
    try {

        const header = (req as any).user;
        const buyerId = header['buyer_id'] ? +header['buyer_id'] : null;
        
        const query = `
            SELECT *
                from tr_cart
            WHERE buyer_id = ?
                AND deleted_at IS NULL
        `;

        const result = await connection.query(query, [buyerId]);
        
        ResponseHandler.success(res, result[0]);
        
    } catch (error) {
        console.log("Failed to get buyer cart", error);
        ResponseHandler.error(res, "Failed to get buyer cart", error);
    }
}

export const deleteBuyerCart = async (req: Request, res: Response): Promise<void> => {
    try {

        const cartId = +req.params.cart_id;
        
        const query = `
            UPDATE tr_cart
            SET deleted_at = ?
            WHERE cart_id = ?
        `;

        await connection.query(query, [new Date(), cartId]);
        
        ResponseHandler.success(res, null);
        
    } catch (error) {
        console.log("Failed to delete product from cart", error);
        ResponseHandler.error(res, "Failed to delete product from cart", error);
    }
}

export const addBuyerCart = async (req: Request, res: Response): Promise<void> => {
    try {

        const header = (req as any).user;
        const buyerId = header['buyer_id'] ? +header['buyer_id'] : null;
        
        const data = req.body;

        const query = `
            INSERT INTO tr_cart (buyer_id, product_id, quantity, created_at)
            VALUES (?, ?, ?, ?)                
        `;

        const queryParameter = [
            buyerId,
            +data.product_id,
            +data.quantity,
            new Date()
        ];

        await connection.query(query, queryParameter);
        
        ResponseHandler.success(res, null);
        
    } catch (error) {
        console.log("Failed to add product into cart", error);
        ResponseHandler.error(res, "Failed to add product into cart", error);
    }
}

export const checkOutAllFromCart = async (req: Request, res: Response): Promise<void> => {
    try {
        
        const header = (req as any).user;
        const buyerId = header['buyer_id'] ? +header['buyer_id'] : null;

        const query1 = `
            SELECT *
                from tr_cart
            WHERE buyer_id = ?
                AND deleted_at IS NULL
        `;

        const result1 = await connection.query(query1, [buyerId]);

        const allCart: any = result1[0] || [];

        const products: any = await queryProductCatalog();

        const unavailableProducts: any = [];
        const availableProducts: any = [];

        if (allCart.length === 0) {
            ResponseHandler.error(res, "No items in cart");
            return;
        }

        // check if product in cart stock is available
        for (const cartItem of allCart) {
            const product = products.find((p: any) => +p.product_id === +cartItem.product_id);
            if (!product || product.stock < cartItem.quantity) {
                unavailableProducts.push({
                    product_id: cartItem.product_id,
                    product_name: product ? product.product_name : "Unknown Product",
                    requested_quantity: cartItem.quantity,
                    available_stock: product ? product.stock : 0
                });
            } else {
                availableProducts.push({
                    product_id: cartItem.product_id,
                    product_name: product.product_name,
                    quantity: cartItem.quantity,
                    price: product.price,
                    cart_id: cartItem.cart_id
                });
            }
        }

        const totalPrice = availableProducts.reduce((total: number, item: any) => {
            return total + (item.price * item.quantity);
        }, 0);

        // modify request
        req.body = {
            order_products: availableProducts,
            total_price: +totalPrice,
        }

        // make order
        await makeOrder(req, res, true);

        // remove cart items
        for (const element of availableProducts) {
            await queryDeleteCartItem(+element.cart_id);
        }
        
        ResponseHandler.success(res, unavailableProducts);
        
    } catch (error) {
        console.log("Failed to checkout cart", error);
        ResponseHandler.error(res, "Failed to checkout cart", error);
    }
}

async function queryDeleteCartItem(cartId: number): Promise<void> {
    try {

        const query = `
            UPDATE tr_cart
            SET deleted_at = ?
            WHERE cart_id = ?
        `;

        const queryParameter = [
            new Date(), +cartId
        ]

        await connection.query(query, queryParameter);

    } catch (error) {
        throw new Error("Error [queryDeleteCartItem]: " + error);
    }
}

async function querySaveProductItem(productId: number): Promise<void> {
    try {

        const query = `
            INSERT INTO ms_product_item (product_id, created_at, available)
            VALUES (?, ?, ?)
        `;

        const queryParameter = [
            productId,
            new Date(),
            1
        ]

        await connection.query(query, queryParameter);

    } catch (error) {
        throw new Error("Error [querySaveProductItem]: " + error);
    }
}

async function queryProductList(sellerId: any = null) {
    try {

        const queryParameter = [];
        let queryUser = '';

        if (sellerId) {
            queryUser = ' AND ms_product.seller_id = ? ';
            queryParameter.push(+sellerId); 
        }

        const query = `
            SELECT ms_product.product_id,
                ms_product.product_name,
                ms_product.price,
                count(ms_product_item.product_id) AS stock,
                ms_product.listing_date,
                ms_product.location,
                product_condition.condition_type,
                ms_product_category.category_name,
                ms_product.approved,
                ms_product.photo_data,
                ms_product.photo_mime_type,
                JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'bid_id', tr_bid.bid_id,
                        'bid_price', tr_bid.bid_price,
                        'bid_date', tr_bid.created_at,
                        'buyer_id', ms_buyer.buyer_id,
                        'buyer_name', ms_user.fullname
                    )
                ) AS bids
            FROM ms_product
            JOIN ms_product_category ON ms_product.category_id = ms_product_category.category_id
                AND ms_product_category.deleted_at IS NULL
            JOIN ms_seller ON ms_product.seller_id = ms_seller.seller_id
                AND ms_seller.deleted_at IS NULL
            JOIN product_condition ON ms_product.condition_id = product_condition.condition_id
            LEFT JOIN ms_product_item ON ms_product.product_id = ms_product_item.product_id
                AND ms_product_item.deleted_at IS NULL
                AND ms_product_item.available = 1
            LEFT JOIN tr_bid ON ms_product.product_id = tr_bid.product_id
            LEFT JOIN ms_buyer ON tr_bid.buyer_id = ms_buyer.buyer_id
            LEFT JOIN ms_user ON ms_buyer.user_id = ms_user.user_id
                AND ms_user.deleted_at IS NULL                
            WHERE ms_product.deleted_at IS NULL
                ${queryUser}
            GROUP BY ms_product.product_id,
                ms_product.product_name,
                ms_product.price,
                ms_product.listing_date,
                ms_product.location,
                product_condition.condition_type,
                ms_product_category.category_name
        `;

        const result = await connection.query(query, queryParameter);

        const final: any = result[0] || [];

        let productAll: any = [];
        
        if (final.length !== 0) {
            productAll = final.map((product: any) => {
                let photoDataUrl = null;
                if (product.photo_data && product.photo_mime_type) {
                    const base64Image = product.photo_data.toString('base64');
                    photoDataUrl = `data:${product.photo_mime_type};base64,${base64Image}`;
                }

                return {
                    product_id: product.product_id,
                    product_name: product.product_name,
                    price: product.price,
                    stock: product.stock,
                    listing_date: product.listing_date,
                    location: product.location,
                    condition_type: product.condition_type,
                    category_name: product.category_name,
                    approved: product.approved,
                    photoDataUrl: photoDataUrl,
                    bids: product.bids[0].bid_id ? product.bids : [],
                };
            });
        }

        return productAll.length !== 0 ? productAll : [];
    } catch (error) {
        throw new Error("Error [queryProductList]: " + error);
    }
};

async function getProductBids(productId: number) {
    const bidQuery = `
        SELECT tr_bid.bid_id, tr_bid.bid_price, tr_bid.created_at AS bid_date,
               ms_buyer.buyer_id, ms_user.fullname AS buyer_name
        FROM tr_bid
        LEFT JOIN ms_buyer ON tr_bid.buyer_id = ms_buyer.buyer_id
        LEFT JOIN ms_user ON ms_buyer.user_id = ms_user.user_id AND ms_user.deleted_at IS NULL
        WHERE tr_bid.product_id = ?
    `;
    const [bids]: any = await connection.query(bidQuery, [productId]);
    return bids || [];
}

async function queryProductCatalog(productId: any = null) {
    try {
        const queryParameter: any = [];
        let queryProduct = '';
        let queryMore = '';
        if (productId) {
            queryProduct = ' AND ms_product.product_id = ? ';
            queryMore = ' , ms_product.description, ms_product_category.category_name ';
            queryParameter.push(+productId);
        }

        const query = `
            SELECT ms_product.product_id,
                ms_product.product_name,
                ms_product.price,
                count(ms_product_item.product_id) AS stock,
                ms_product.location,
                product_condition.condition_type,
                ms_product.photo_data,
                ms_product.photo_mime_type
                ${queryMore}
            FROM ms_product
            JOIN ms_product_category ON ms_product.category_id = ms_product_category.category_id
                AND ms_product_category.deleted_at IS NULL
            JOIN ms_seller ON ms_product.seller_id = ms_seller.seller_id
                AND ms_seller.deleted_at IS NULL
            JOIN product_condition ON ms_product.condition_id = product_condition.condition_id
            LEFT JOIN ms_product_item ON ms_product.product_id = ms_product_item.product_id
                AND ms_product_item.deleted_at IS NULL
                AND ms_product_item.available = 1
            WHERE ms_product.deleted_at IS NULL
                AND ms_product.approved = 1
                ${queryProduct}
            GROUP BY ms_product.product_id,
                ms_product.product_name,
                ms_product.price,
                ms_product.location,
                ms_product.photo_data,
                ms_product.photo_mime_type,
                product_condition.condition_type
        `;

        const [products]: any = await connection.query(query, queryParameter);

        if (productId && products && products.length > 0) {
            const bids = await getProductBids(productId);
            products[0].bids = bids;
        } else if (!productId && products && products.length > 0) {
            products.forEach((p: any) => p.bids = []);
        }

        return products;
    } catch (error) {
        throw new Error("Error [queryProductCatalog]: " + error);
    }
};
