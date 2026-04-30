import pkg from '../generated/prisma/index.js';
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
const { PrismaClient } = pkg;
import express from 'express';

const PORT = 3000;
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({
  adapter,
});
const app = express();

app.use(express.json());
app.use(express.static('src'));

app.get('/products', async (req, res) => {
  const products = await prisma.product.findMany({
    include: { category: true }
  });
  res.json(products);
});

app.listen(PORT, () => console.log('Server running on port ' + PORT));
