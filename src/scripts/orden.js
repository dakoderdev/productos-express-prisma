import { renderCart, loadCart, saveCart, openCartDialog, closeCartDialog, buyCart } from "./cart.js";

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
  const section = document.getElementById("section__order");

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

      data.forEach((order) => {
        const article = document.createElement("article");
        article.className = "article__order";

        const date = new Date(order.createdAt).toLocaleDateString("es-ES");
        const itemsList = order.items && order.items.length > 0 ? order.items.map((i) => `<li class="order__item"><span>${i.product.name} <strong>x${i.quantity}</strong></span><span>${formatPrice(i.price)}</span></li>`).join("") : "<li>Sin productos</li>";

        let totalPrice = 0;
        totalPrice += order.items.reduce((acc, i) => acc + i.price * i.quantity, 0);
        totalPrice = formatPrice(totalPrice);

        article.innerHTML = `
        <div class="li__container">
        <div class="li__header">
        <span class="li__title">Orden <strong class="li__number">#${order.id.toString().padStart(3, '0')}</strong></span>
        <p class="li__date">${date}</p>
        </div>
        <ul class="order__list">
            ${itemsList}
            ${
              order.items && order.items.length > 0
                ? `<li class="order__item order__item--total">
                    <span>Total </span><span>${totalPrice}</span>
                    </li>`
                : ""
            }    
        </ul>
        <p class="li__user">${order.user.firstName} ${order.user.lastName}</p>
    </div>
`;
        section.appendChild(article);
      });
    })
    .catch((err) => {
      console.error("Error en la peticion:", err);
      const section = document.getElementById("section__order");
      section.innerHTML = `<article class="article__order">${err.message}</article>`;
    });
}

const cartButton = document.getElementById("buy__order");

cartButton.addEventListener("click", () => {
  openCartDialog(currentItems, products);
});

const buyClose = document.getElementById("buy__close");
buyClose.addEventListener("click", () => {
  closeCartDialog();
});

const buyButton = document.getElementById("buy__button");
buyButton.addEventListener("click", async () => {
  const success = await buyCart(currentItems);
  if (!success) return;
  currentItems = [];
  renderCart(currentItems);
  renderOrders();
});