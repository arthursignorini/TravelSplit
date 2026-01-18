import express from 'express';
import cors from 'cors';

const app = express();

// Middleware -> é um software intermediário que processa requisições antes de chegar nas rotas
app.use(cors());
app.use(express.json());

export default app;