import mysql from 'mysql2/promise';

// Create a MySQL connection
const connection = mysql.createPool({
  host: process.env.DB_HOST as string,
  user: process.env.DB_USER as string,
  password: process.env.DB_PASSWORD as string,
  database: 'secondhand_marketplace',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined,
});

export default connection;
