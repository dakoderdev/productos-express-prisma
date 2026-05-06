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

app.get('/categories', async (req, res) => {
  const categories = await prisma.category.findMany({
    include: { products: true }
  });
  res.json(categories);
});

app.get('/orders', async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: { 
          include: {
            product: true 
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            createdAt: true
          }
        } 
      }
    });
    res.json(orders);
  } catch (error) {
    console.error("Error al obtener ordenes:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

app.listen(PORT, () => console.log('Server running on port ' + PORT));
