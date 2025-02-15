import express from 'express';
import cors from 'cors';
import route from './route/route';
import dotenv from 'dotenv';

dotenv.config();
const PORT = process.env.PORT;
console.log(process.env.PORT);

const app = express();

app.use(cors({
    credentials: true,
    origin: ['http://localhost:4200']
}));

app.use(express.json());

app.use('/', route); 

app.get("api/foods", (req, res) => {
    res.send("Hello world!");
})

app.listen(PORT, (error) => {
    if(!error)
        console.log("Server is listening at http://localhost:" + PORT)
    else 
        console.log("Error occurred, server can't start", error);
    }
);
