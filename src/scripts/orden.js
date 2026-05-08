import { renderCart, loadCart, openCartDialog, closeCartDialog, buyCart } from "./cart.js";

let currentItems = loadCart();
let products;

function fetchProductData() {
  fetch("/products").then(async (r) => {
    const data = await r.json();

    if (!r.ok) {
      throw new Error(data.error || "No se pudieron cargar los productos");
    }

    return (products = data);
  });
}
fetchProductData();

function init() {
  renderOrders();
  renderCart(currentItems);
}
document.addEventListener("DOMContentLoaded", init);

const formatPrice = (price) => price.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).replace(/\s/g, "");

function renderOrders() {
  const section = document.getElementById("orders-list");

  fetch("/orders")
    .then(async (r) => {
      const data = await r.json();

      if (!r.ok) {
        throw new Error(data.error || "No se pudieron cargar las ordenes");
      }

      return data;
    })
    .then((data) => {
      section.innerHTML = "";

      if (data.length === 0) {
        section.innerHTML = `<li class="orders__message">Todavia no tenes ordenes.</li>`;
        return;
      }

      data.forEach((order) => {
        const article = document.createElement("article");
        article.className = "order-card";

        const date = new Date(order.createdAt).toLocaleDateString("es-ES");
        const itemsList = order.items && order.items.length > 0 ? order.items.map((i) => `<li class="order-card__item"><span>${i.product.name} <strong class="order-card__category">${i.product.category.name}</strong></span><span>${formatPrice(i.price)}<strong class="order-card__quantity">x${i.quantity}</strong></span></li>`).join("") : `<li class="order-card__item">Sin productos</li>`;

        let totalPrice = 0;
        totalPrice += order.items.reduce((acc, i) => acc + i.price * i.quantity, 0);
        totalPrice = formatPrice(totalPrice);

        article.innerHTML = `
          <div class="order-card__header">
            <span class="order-card__title">Orden <strong class="order-card__number">#${order.id.toString().padStart(3, "0")}</strong></span>
            <p class="order-card__date">${date}</p>
          </div>
          <ul class="order-card__list">
            ${itemsList}
            ${
              order.items && order.items.length > 0
                ? `<li class="order-card__item order-card__item--total">
                    <span>Total</span><span>${totalPrice}</span>
                  </li>`
                : ""
            }
          </ul>
          <p class="order-card__user">${order.user.firstName} ${order.user.lastName}</p>
        `;
        section.appendChild(article);
      });
    })
    .catch((err) => {
      console.error("Error en la peticion:", err);
      section.innerHTML = `<li class="orders__message">${err.message}</li>`;
    });
}

const cartButton = document.getElementById("cart-open");

cartButton.addEventListener("click", () => {
  openCartDialog(currentItems, products);
});

const cartClose = document.getElementById("cart-close");
cartClose.addEventListener("click", () => {
  closeCartDialog();
});

const cartSubmit = document.getElementById("cart-submit");
cartSubmit.addEventListener("click", async () => {
  const success = await buyCart(currentItems);
  if (!success) return;
  currentItems = [];
  renderCart(currentItems);
  renderOrders();
});
