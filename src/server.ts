import express from 'express';
import cors from 'cors';
import contractRouter from './routes/contractRoutes';
import userRouter from './routes/userRoutes';
import loginRouter from './routes/loginRoutes';
import budgetRouter from './routes/budgetRoutes';
import clientRouter from './routes/clientRoutes';
import cookieParser from 'cookie-parser'
import tenantRoutes from './routes/tenantRoutes';

const app = express();

app.use(cookieParser())
app.use(express.json({ limit: '10mb'}))
app.use(cors({
    origin: process.env.URL_FRONT || 'http://localhost:3000', // frontend
    credentials: true, // permite cookies!
}));

app.use('/api/users', userRouter)
app.use('/api/tenants', tenantRoutes)
app.use('/api/login', loginRouter)
app.use('/api/contracts', contractRouter)
app.use('/api/clients', clientRouter)
app.use('/api/budgets', budgetRouter)

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
