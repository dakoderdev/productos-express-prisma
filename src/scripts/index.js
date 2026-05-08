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
  saveCart(currentItems);
}

const formatPrice = (price) => price.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).replace(/\s/g, "");

function getCategoryModifier(categoryName) {
  return categoryName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function renderProducts() {
  const ul = document.getElementById("products-list");

  fetch("/products")
    .then((r) => r.json())
    .then((data) => {
      data.forEach((p) => {
        const li = document.createElement("li");
        li.className = "product-card";

        const categoryModifier = getCategoryModifier(p.category.name);

        li.innerHTML = `
          <div class="product-card__header">
            <span class="product-card__name">${p.name}</span>
            <span class="product-card__tag product-card__tag--${categoryModifier}">${p.category.name}</span>
          </div>
          <div class="product-card__footer">
            <span class="product-card__price">${formatPrice(p.price)}</span>
            <button id="product-add-${p.id}" class="product-card__button product-card__button--add">Agregar al carrito</button>
          </div>
        `;

        ul.appendChild(li);
      });

      const buttons = document.querySelectorAll(".product-card__button--add");

      if (buttons) {
        buttons.forEach((button) => {
          button.addEventListener("click", () => {
            handleAddClick(button.id);
          });
        });
      }
    })
    .catch((err) => {
      ul.innerHTML = `<li class="orders__message">${err.message}</li>`;
    });
}

function handleAddClick(productId) {
  productId = parseInt(productId.replace("product-add-", ""));
  addItem(productId);
  renderCart(currentItems);
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
});
