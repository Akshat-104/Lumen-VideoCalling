// Mock frontend-only auth using localStorage.
// Replace with real API calls when you wire up a backend.

const USERS_KEY = "vc_users";
const SESSION_KEY = "vc_session";
// const user = "";
function readUsers() {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || "[]"); } catch { return []; }
}
function writeUsers(u) { localStorage.setItem(USERS_KEY, JSON.stringify(u)); }

export function register(name, email, password) {
  const users = readUsers();
  if (users.some((u) => u.email === email)) throw new Error("Email already registered");
  const user = { id: crypto.randomUUID(), name, email, password };
  users.push(user);
  writeUsers(users);
  const { password: _pw, ...pub } = user;
  localStorage.setItem(SESSION_KEY, JSON.stringify(pub));
  return pub;
}

export function login(email, password) {
  const users = readUsers();
  const u = users.find((x) => x.email === email && x.password === password);
  if (!u) throw new Error("Invalid email or password");
  const { password: _pw, ...pub } = u;
  localStorage.setItem(SESSION_KEY, JSON.stringify(pub));
  return pub;
}

export function logout() { 
  localStorage.removeItem("token")
  localStorage.removeItem("user")
 }

export function getSession() {
  const user = localStorage.getItem("user");

  return user ? JSON.parse(user) : null;
}