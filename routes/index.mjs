import pkg from '../generated/prisma/index.js';
import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
const { PrismaClient } = pkg;
import express from 'express';
import session from 'express-session';
import bcrypt from 'bcrypt';

const PORT = 3000;
const adapter = new PrismaMariaDb(getDatabaseConfig());
const prisma = new PrismaClient({ adapter });
const app = express();

function getDatabaseConfig() {
  const url = new URL(process.env.DATABASE_URL);

  return {
    host: url.hostname,
    port: Number(url.port) || 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace("/", ""),
    allowPublicKeyRetrieval: true
  };
}

app.use(express.json());
app.use(express.static('src'));

app.use(session({
  secret: 'dev_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

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
  if (!req.session.userId) {
    return res.status(401).json({ error: "Tenes que iniciar sesion para ver tus ordenes" });
  }

  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.session.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true
              }
            }
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

app.post("/checkout", async (req, res) => {
  const { currentItems } = req.body;

  if (!req.session.userId) {
    return res.status(401).json({ error: "Tenes que iniciar sesion para comprar" });
  }

  if (!Array.isArray(currentItems) || currentItems.length === 0) {
    return res.status(400).json({ error: "El carrito esta vacio" });
  }

  try {
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: { userId: req.session.userId }
      });

      for (const item of currentItems) {
        const product = await tx.product.findUnique({
          where: { id: item.id }
        });

        if (!product) throw new Error("Product not found");
        if (product.quantity < item.quantity) throw new Error("Not enough stock");
        if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
          throw new Error("Cantidad invalida");
        }

        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            productId: product.id,
            quantity: item.quantity,
            price: product.price
          }
        });

        await tx.product.update({
          where: { id: product.id },
          data: { quantity: { decrement: item.quantity } }
        });
      }

      return newOrder;
    });

    res.json({ success: true, orderId: order.id });
  } catch (error) {
    console.error("Checkout failed:", error);
    res.status(500).json({ error: error.message || "Checkout failed" });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Credenciales invalidas' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Credenciales invalidas' });
    req.session.userId = user.id;
    res.json({ id: user.id, firstName: user.firstName, lastName: user.lastName });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno' });
  }
});

app.post('/register', async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  try {
    const existing = await prisma.user.findFirst({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email ya registrado' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { firstName, lastName, email, password: hashed }
    });
    req.session.userId = user.id;
    res.json({ id: user.id, firstName: user.firstName, lastName: user.lastName });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno' });
  }
});

app.post('/logout', (req, res) => {
  req.session.destroy((error) => {
    if (error) return res.status(500).json({ error: 'No se pudo cerrar sesion' });
    res.json({ success: true });
  });
});

app.get('/me', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'No autenticado' });
  const user = await prisma.user.findUnique({ where: { id: req.session.userId } });
  if (!user) return res.status(401).json({ error: 'No autenticado' });
  res.json({ id: user.id, firstName: user.firstName, lastName: user.lastName });
});

app.listen(PORT, () => console.log('Server running on port ' + PORT));
