import { Router } from 'express';
import { method1, method2 } from '../controller/controllers';
import * as auth from '../controller/auth/auth-controller';
import * as sellers from '../controller/seller-functional/seller';
import * as product from '../controller/product/product';
import * as order from '../controller/order/order';
import * as role from '../controller/role/role';
import * as admin from '../controller/admin/admin';
import { upload } from '../middleware/multer-config';

// Initialization
const router = Router();

// Requests
router.get('/api', method1);
router.post('/', method2);

// AUTH
router.post('/register', auth.register);
router.post('/login', auth.login);
router.get('/verify-token', auth.verifyToken, (req, res) => {
  res.json({ valid: true, user: (req as any).user });
});

// Seller Functional
router.get('/sellers', auth.verifyToken, sellers.sellerList);
router.get('/sellers/:seller_id', auth.verifyToken, sellers.sellerDetail);

// Products
router.get('/product/:seller_id', auth.verifyToken, product.productBySeller);
router.get('/product-all', auth.verifyToken, product.productAll);
router.get('/product-conditions', auth.verifyToken, product.productConditions);
router.get('/product-categories', auth.verifyToken, product.productCategories);
router.post('/product-save', auth.verifyToken, upload.single('photo'), product.saveProduct);
router.post('/product-catalog', auth.verifyToken, product.productCatalog);
router.get('/product-detail/:product_id', auth.verifyToken, product.productDetail);
router.post('/product-status/:product_id/:status', auth.verifyToken, product.productStatusChange);
router.post('/product-price-change', auth.verifyToken, product.productPriceChange);

// Buyer Cart
router.get('/cart', auth.verifyToken, product.getBuyerCartList);
router.get('/cart/:cart_id', auth.verifyToken, product.deleteBuyerCart);
router.post('/cart', auth.verifyToken, product.addBuyerCart);
router.get('/purchase-cart', auth.verifyToken, product.checkOutAllFromCart);

// Admin
router.get('/admin-fees', auth.verifyToken, admin.getAdminFees);
router.post('/admin-fees', auth.verifyToken, admin.changeAdminFees);

// Order
router.post('/purchase', auth.verifyToken, order.makeOrder);
router.get('/purchase', auth.verifyToken, order.buyerOrderList);
router.get('/order-list', auth.verifyToken, order.adminOrderList);
router.post('/order-status', auth.verifyToken, order.changeOrderStatus);
router.get('/order-status-options', auth.verifyToken, order.getOrderStatusOptions);

// Bid
router.post('/bid', auth.verifyToken, order.createBid);

// Wish List
router.get('/wishlist', auth.verifyToken, product.buyerWishlist);
router.get('/wishlist/:product_id', auth.verifyToken, product.createWishlist);
router.get('/delete-wishlist/:product_id', auth.verifyToken, product.deleteWishlist);

// Role
router.get('/roles', role.roleList);

// Admin Dashboard
router.get('/dashboard-data', admin.dashboardData);

export default router;
