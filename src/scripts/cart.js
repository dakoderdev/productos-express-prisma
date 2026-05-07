const formatPrice = (price) => price.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).replace(/\s/g, "");

function getTotalItems(currentItems) {
  return currentItems.reduce((acc, i) => acc + i.quantity, 0);
}
export function renderCart(currentItems) {
  const cartButton = document.getElementById("buy__order");
  const totalAmount = getTotalItems(currentItems);
  let signifier = cartButton.querySelector(".signifier");

  if (totalAmount === 0) {
    if (signifier) signifier.remove();
    return;
  }

  if (!signifier) {
    signifier = document.createElement("p");
    signifier.classList.add("signifier");
    cartButton.appendChild(signifier);
  }

  signifier.textContent = totalAmount;
}

export function loadCart() {
  const stored = localStorage.getItem("currentItems");
  return stored ? JSON.parse(stored) : [];
}

export function saveCart(currentItems) {
  localStorage.setItem("currentItems", JSON.stringify(currentItems));
}

export function openCartDialog(currentItems, products) {
  const menu = document.getElementById("buy__menu");
  renderCartItems(currentItems, products);
  menu.showModal();
}
export function closeCartDialog() {
  const menu = document.getElementById("buy__menu");
  menu.close();
}

function renderCartItems(currentItems, products) {
  const buyList = document.getElementById("buy__list");
  buyList.innerHTML = "";

  let totalPrice = 0;
  currentItems.forEach((item) => {
    const cartProducts = products.find((p) => p.id === item.id);
    if (!cartProducts) return;
    const li = document.createElement("li");
    totalPrice += item.quantity * cartProducts.price;

    li.className = "order__item";
    li.innerHTML = `
        <span>${cartProducts.name}</span>
        <span>${formatPrice(item.quantity * cartProducts.price)}
        <button id="lower__${item.id}" class="item__lower">-</button>
        <strong>${item.quantity}</strong>
        <button id="raise__${item.id}" class="item__raise">+</button></span>
        `;
    buyList.appendChild(li);
  });
  totalPrice = formatPrice(totalPrice);

  const total = document.createElement("li", "order__item order__item--total");
  total.innerHTML = `
      <li class="order__item order__item--total">
        <span>Total </span><span>${totalPrice}</span>
      </li>`;
  buyList.appendChild(total);
  handleQuantityButtons(currentItems, products);
}

export async function buyCart(currentItems) {
  const response = await fetch("/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: null, currentItems })
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
  const lowerButtons = document.querySelectorAll(".item__lower");
  const raiseButtons = document.querySelectorAll(".item__raise");

  lowerButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const id = parseInt(button.id.replace("lower__", ""));
      modifyQuantity(id, -1, currentItems, products);
    });
  });

  raiseButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const id = parseInt(button.id.replace("raise__", ""));
      modifyQuantity(id, 1, currentItems, products);
    });
  });
}