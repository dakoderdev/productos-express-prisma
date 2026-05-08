require("dotenv/config");

const bcrypt = require("bcrypt");
const { PrismaClient } = require("../generated/prisma");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(getDatabaseConfig())
});

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

async function main() {
  const moda = await findOrCreateCategory("Moda");
  const electronica = await findOrCreateCategory("Electronica");
  const hogar = await findOrCreateCategory("Hogar");

  const products = [
    await findOrCreateProduct({
      name: "Remera oversize",
      price: 14999,
      quantity: 25,
      categoryId: moda.id
    }),
    await findOrCreateProduct({
      name: "Auriculares Bluetooth",
      price: 39999,
      quantity: 18,
      categoryId: electronica.id
    }),
    await findOrCreateProduct({
      name: "Lampara de escritorio",
      price: 24999,
      quantity: 12,
      categoryId: hogar.id
    })
  ];

  const user = await findOrCreateUser({
    firstName: "David",
    lastName: "Demo",
    email: "david.demo@app-orm.com",
    password: "123456"
  });

  const order = await findOrCreateOrder(user.id, [
    { product: products[0], quantity: 2 },
    { product: products[1], quantity: 1 }
  ]);

  const orderWithRelations = await prisma.order.findUnique({
    where: { id: order.id },
    include: {
      user: true,
      items: {
        include: {
          product: {
            include: {
              category: true
            }
          }
        }
      }
    }
  });

  console.log("Seed completed");
  console.log(JSON.stringify(orderWithRelations, null, 2));
}

async function findOrCreateCategory(name) {
  const category = await prisma.category.findFirst({ where: { name } });
  if (category) return category;

  return prisma.category.create({
    data: { name }
  });
}

async function findOrCreateProduct(data) {
  const product = await prisma.product.findFirst({
    where: { name: data.name }
  });

  if (product) {
    return prisma.product.update({
      where: { id: product.id },
      data: {
        price: data.price,
        quantity: data.quantity,
        categoryId: data.categoryId
      }
    });
  }

  return prisma.product.create({ data });
}

async function findOrCreateUser(data) {
  const user = await prisma.user.findFirst({
    where: { email: data.email }
  });

  if (user) return user;

  const hashedPassword = await bcrypt.hash(data.password, 10);

  return prisma.user.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: hashedPassword
    }
  });
}

async function findOrCreateOrder(userId, items) {
  const existingOrder = await prisma.order.findFirst({
    where: { userId },
    include: { items: true }
  });

  if (existingOrder && existingOrder.items.length >= 2) return existingOrder;

  return prisma.order.create({
    data: {
      userId,
      items: {
        create: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price
        }))
      }
    }
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
