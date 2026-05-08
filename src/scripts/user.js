const userButton = document.querySelector(".nav__button");
const userName = document.querySelector(".nav__name");
const userImg = document.querySelector(".nav__avatar");

const DEFAULT_USER = {
  firstName: "Iniciar",
  lastName: "sesion",
  img: "https://i.pravatar.cc/300?img=0"
};

function initUser() {
  if (!userButton || !userName || !userImg) return;
  setLoadingState();
  checkSession();
}

async function checkSession() {
  const res = await requestData("/me");

  if (!res.ok) {
    setLoggedOutState();
    return;
  }

  setLoggedInState(res.data);
}

async function login() {
  const choice = prompt("1. Iniciar sesion\n2. Registrarse");

  if (choice === null) return;
  if (choice === "1") await handleLogin();
  else if (choice === "2") await handleRegister();
  else alert("Opcion invalida");
}

async function handleLogin() {
  const email = askRequired("Email:");
  if (!email) return;

  const password = askRequired("Contrasena:");
  if (!password) return;

  const res = await sendData("/login", { email, password });
  handleAuthResponse(res);
}

async function handleRegister() {
  const firstName = askRequired("Nombre:");
  if (!firstName) return;

  const lastName = askRequired("Apellido:");
  if (!lastName) return;

  const email = askRequired("Email:");
  if (!email) return;

  const password = askRequired("Contrasena:");
  if (!password) return;

  const res = await sendData("/register", { firstName, lastName, email, password });
  handleAuthResponse(res);
}

async function logout() {
  setLoadingState();

  const res = await sendData("/logout");

  if (!res.ok) {
    alert(res.data.error || "No se pudo cerrar sesion");
    checkSession();
    return;
  }

  setLoggedOutState();
}

async function handleAuthResponse(res) {
  if (!res.ok) {
    alert(res.data.error || "No se pudo iniciar sesion");
    return;
  }

  setLoggedInState(res.data);
}

async function requestData(url) {
  try {
    const response = await fetch(url);
    const data = await parseResponse(response);
    return { ok: response.ok, data };
  } catch (error) {
    return { ok: false, data: { error: error.message } };
  }
}

async function sendData(url, body) {
  try {
    const options = { method: "POST" };

    if (body) {
      options.headers = { "Content-Type": "application/json" };
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await parseResponse(response);
    return { ok: response.ok, data };
  } catch (error) {
    return { ok: false, data: { error: error.message } };
  }
}

async function parseResponse(response) {
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

function askRequired(message) {
  const value = prompt(message);
  if (value === null) return null;

  const cleanValue = value.trim();
  if (!cleanValue) {
    alert("Este campo es obligatorio");
    return null;
  }

  return cleanValue;
}

function setLoggedInState(user) {
  updateName(user.firstName, user.lastName);
  updateImg(user.id);
  updateButtonState("logged-in");
  userButton.onclick = logout;
}

function setLoggedOutState() {
  updateName(DEFAULT_USER.firstName, DEFAULT_USER.lastName);
  userImg.setAttribute("src", DEFAULT_USER.img);
  updateButtonState("logged-out");
  userButton.onclick = login;
}

function setLoadingState() {
  updateName("Cargando", "...");
  updateButtonState("loading");
  userButton.onclick = null;
}

function updateButtonState(state) {
  userButton.classList.remove("nav__button--logged-in", "nav__button--logged-out", "nav__button--loading");
  userButton.classList.add(`nav__button--${state}`);
}

function updateName(firstName, lastName) {
  userName.replaceChildren(document.createTextNode(firstName), document.createElement("br"), document.createTextNode(lastName));
}

function updateImg(userId) {
  userImg.setAttribute("src", `https://i.pravatar.cc/300?img=${userId || 0}`);
}

document.addEventListener("DOMContentLoaded", initUser);
