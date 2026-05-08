const formatPrice = (price) => price.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).replace(/\s/g, "");

function getTotalItems(currentItems) {
  return currentItems.reduce((acc, i) => acc + i.quantity, 0);
}

export function renderCart(currentItems) {
  const cartButton = document.getElementById("cart-open");
  const totalAmount = getTotalItems(currentItems);
  let badge = cartButton.querySelector(".cart__badge");

  if (totalAmount === 0) {
    if (badge) badge.remove();
    return;
  }

  if (!badge) {
    badge = document.createElement("p");
    badge.classList.add("cart__badge");
    cartButton.appendChild(badge);
  }

  badge.textContent = totalAmount;
}

export function loadCart() {
  const stored = localStorage.getItem("currentItems");
  return stored ? JSON.parse(stored) : [];
}

export function saveCart(currentItems) {
  localStorage.setItem("currentItems", JSON.stringify(currentItems));
}

export function openCartDialog(currentItems, products) {
  const menu = document.getElementById("cart-dialog");
  renderCartItems(currentItems, products || []);
  menu.showModal();
}

export function closeCartDialog() {
  const menu = document.getElementById("cart-dialog");
  menu.close();
}

function renderCartItems(currentItems, products) {
  const cartList = document.getElementById("cart-list");
  cartList.innerHTML = "";

  let totalPrice = 0;
  currentItems.forEach((item) => {
    const cartProduct = products.find((p) => p.id === item.id);
    if (!cartProduct) return;

    const li = document.createElement("li");
    totalPrice += item.quantity * cartProduct.price;

    li.className = "cart-item";
    li.innerHTML = `
      <span>${cartProduct.name}</span>
      <span class="cart-item__actions">
        ${formatPrice(item.quantity * cartProduct.price)}
        <button id="cart-decrease-${item.id}" class="cart-item__button cart-item__button--decrease">-</button>
        <strong>${item.quantity}</strong>
        <button id="cart-increase-${item.id}" class="cart-item__button cart-item__button--increase">+</button>
      </span>
    `;
    cartList.appendChild(li);
  });

  const total = document.createElement("li");
  total.className = "cart-item cart-item--total";
  total.innerHTML = `<span>Total</span><span>${formatPrice(totalPrice)}</span>`;
  cartList.appendChild(total);
  handleQuantityButtons(currentItems, products);
}

export async function buyCart(currentItems) {
  const response = await fetch("/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentItems })
  });
  const data = await response.json();
  if (!response.ok) {
    alert(data.error || "Error al procesar la compra");
    return false;
  }
  localStorage.removeItem("currentItems");
  closeCartDialog();
  return true;
}

function modifyQuantity(id, amount, currentItems, products) {
  const index = currentItems.findIndex((i) => i.id === id);
  currentItems[index].quantity += amount;
  if (currentItems[index].quantity <= 0) {
    currentItems.splice(index, 1);
  }
  saveCart(currentItems);
  renderCart(currentItems);
  renderCartItems(currentItems, products);
}

function handleQuantityButtons(currentItems, products) {
  const lowerButtons = document.querySelectorAll(".cart-item__button--decrease");
  const raiseButtons = document.querySelectorAll(".cart-item__button--increase");

  lowerButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const id = parseInt(button.id.replace("cart-decrease-", ""));
      modifyQuantity(id, -1, currentItems, products);
    });
  });

  raiseButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const id = parseInt(button.id.replace("cart-increase-", ""));
      modifyQuantity(id, 1, currentItems, products);
    });
  });
}
