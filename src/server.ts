import express from 'express';
import cors from 'cors';
import verifyToken from './middlewares/verifyToken';
import contractRouter from './routes/contractRoutes';
import userRouter from './routes/userRoutes';
import loginRouter from './routes/loginRoutes';
import budgetRouter from './routes/budgetRoutes';
import clientRouter from './routes/clientRoutes';

const app = express();

app.use(express.json())
app.use(cors({
    origin: process.env.URL_FRONT || 'http://localhost:3000', // frontend
    credentials: true, // permite cookies!
}));


app.get('/ping', async (req, res) => {
    res.json("pong")
})

app.use('/api', loginRouter)

// app.use(verifyToken);

app.use('/api', contractRouter)
app.use('/api', clientRouter)
app.use('/api', userRouter)
app.use('/api', budgetRouter)

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
