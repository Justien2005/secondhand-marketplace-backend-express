import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import route from './route/route';

import { method1 } from './controller/controllers';

const PORT = process.env.PORT;
console.log(process.env.PORT);

const app = express();

app.use(cors({
    credentials: true,
    origin: ['http://localhost:4200']
}));

app.use(express.json());

app.use('/', route); 

app.get("/api/init", method1);

app.listen(PORT, (error) => {
    if(!error)
        console.log("Server is listening at http://localhost:" + PORT)
    else 
        console.log("Error occurred, server can't start", error);
    }
);

// app.get('/test-db', (req, res) => {
//     connection.query('SELECT 1 + 1 AS solution', (err, results: any) => {
//         if (err) {
//             console.error('❌ Error executing query:', err.message);
//             return res.status(500).json({ error: 'Database query failed' });
//         }

//         console.log("✅ Query result:", results); // Debugging log

//         res.json({ 
//             message: 'Database is working!',
//             solution: results[0].solution // Access the value correctly
//         });
//     });
// });
