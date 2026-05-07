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
  renderProducts();
  renderCart(currentItems);
}
document.addEventListener("DOMContentLoaded", init);

function addItem(productId) {
  let currentItem = currentItems.find((i) => i.id === productId);
  if (currentItem) {
    currentItem.quantity++;
  } else {
    currentItems.push({ id: productId, quantity: 1 });
  }
  console.log(currentItems);
  saveCart(currentItems);
}

const formatPrice = (price) => price.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).replace(/\s/g, "");

function renderProducts() {
  const ul = document.getElementById("list__product");

  fetch("/products")
    .then((r) => r.json())
    .then((data) => {
      data.forEach((p) => {
        const li = document.createElement("li");
        li.className = "li__card";

        li.innerHTML = `
        <div>
          <span class="li__name">${p.name}</span>
          <span class="li__tag li__tag--${p.category.name.toLowerCase()}">${p.category.name}</span>
        </div>
        <div>
          <span class="li__price">${formatPrice(p.price)}</span>
          <button id="li__${p.id}" class="li__button li__button--add">Agregar al carrito</button>
        </div>
      `;

        ul.appendChild(li);
      });

      const buttons = document.querySelectorAll(".li__button--add");

      if (buttons) {
        buttons.forEach((button) => {
          button.addEventListener("click", () => {
            handleAddClick(button.id);
          });
        });
      }
    })
    .catch((err) => {
      ul.innerHTML = `<li>${err.message}</li>`;
    });
}

function handleAddClick(productId) {
  productId = parseInt(productId.replace("li__", ""));
  addItem(productId);
  renderCart(currentItems);
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
});

