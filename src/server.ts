import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import verifyToken from './middlewares/verifyToken';
import contractRouter from './routes/contractRoutes';
import userRouter from './routes/userRoutes';
import loginRouter from './routes/loginRoutes';
import budgetRouter from './routes/budgetRoutes';

const app = express();

app.use(bodyParser.json());
app.use(cors());

app.get('/ping', async (req, res) => {
    res.json("pong")
})

app.use(loginRouter)

app.use(verifyToken);

app.use(contractRouter)
app.use(userRouter)
app.use(budgetRouter)

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
