# App ORM - Trabajo Practico Integrador

Proyecto de e-commerce que permite registrarte, iniciar sesión, agregar items al carrito y ver tus ordenes exitosas.

El objetivo principal fue aprender a como trabajar en un proyecto con Prisma ORM, Express y MySQL. Y como crear un espacio front-end que permita ver y modificar los valores de las tablas.

## Modelo de datos

- `Category`: representa una categoria de productos.
- `Product`: representa un producto disponible para comprar.
- `User`: representa un usuario del sistema.
- `Order`: representa una compra realizada por un usuario.
- `OrderItem`: representa cada producto incluido dentro de una orden.

## Relaciones

- `Category 1:N Product`
  Una categoria puede tener muchos productos, y cada producto pertenece a una categoria.

- `User 1:N Order`
  Un usuario puede tener muchas ordenes, y cada orden pertenece a un usuario.

- `Order 1:N OrderItem`
  Una orden puede tener muchos items, y cada item pertenece a una orden.

- `Product 1:N OrderItem`
  Un producto puede aparecer en muchos items de orden.

De esta forma, la relacion muchos a muchos entre `Order` y `Product` queda resuelta mediante la entidad intermedia `OrderItem`.

## Tecnologias

- Node.js
- Express
- Prisma ORM
- MySQL
- MariaDB driver adapter para Prisma

## Configuracion

Instalar dependencias:

```bash
npm install
```

Crear un archivo `.env` con la URL de conexion a MySQL:

```env
DATABASE_URL="mysql://root:password@localhost:3306/app_orm"
```

En este proyecto local se uso:

```env
DATABASE_URL="mysql://root:brat@localhost:3306/app_orm"
```

Si la base `app_orm` no existe, crearla en MySQL antes de correr las migraciones:

```sql
CREATE DATABASE app_orm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## Migraciones

Aplicar las migraciones:

```bash
npx prisma migrate dev
```

Generar el cliente de Prisma:

```bash
npx prisma generate
```

## Endpoints principales

- `GET /products`: obtiene productos con su categoria.
- `GET /categories`: obtiene categorias con sus productos.
- `GET /orders`: obtiene las ordenes del usuario autenticado, incluyendo items, productos y categorias.
- `POST /register`: crea un usuario.
- `POST /login`: inicia sesion.
- `POST /logout`: cierra sesion.
- `POST /checkout`: crea una orden para el usuario autenticado.

## Estado del trabajo

El proyecto cumple con:

- Definicion de las entidades requeridas.
- Relaciones con claves foraneas.
- Uso de Prisma Migrate.
- Conexion a MySQL.
- Cliente Prisma generado.
- Seed con datos de prueba.
- Consulta profunda de orden, usuario, productos y categorias.
