/**
 * auth.js — Firebase SSO para Yapido Ecosystem
 * Maneja el estado de autenticación compartido en todo el dominio .yapido.click
 * Usa localStorage como cookie-sharing SSO bridge entre subdominios estáticos.
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";

// ---- Config pública de Firebase (seguro para frontend) ----
const firebaseConfig = {
  projectId: "studio-4796645076-6f375",
  appId: "1:294212274372:web:57e201d54dc62a72152191",
  apiKey: "AIzaSyB3UPA2BTY-BT6YripgFmf5VX_BT9XIwGo",
  authDomain: "studio-4796645076-6f375.firebaseapp.com",
  messagingSenderId: "294212274372",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// ---- SSO Bridge: persist user info en localStorage ----
const SSO_KEY = "yapido_user";

function saveSSOUser(user) {
  if (!user) { localStorage.removeItem(SSO_KEY); return; }
  localStorage.setItem(SSO_KEY, JSON.stringify({
    uid: user.uid,
    name: user.displayName,
    email: user.email,
    photo: user.photoURL,
  }));
}

// ---- UI Helpers ----
const overlay = document.getElementById("auth-overlay");
const loginBtn = document.getElementById("btn-login-nav");
const avatarBtn = document.getElementById("user-avatar-btn");
const userPhoto = document.getElementById("user-photo");
const userNameShort = document.getElementById("user-name-short");
const dropdown = document.getElementById("user-dropdown");
const btnLogout = document.getElementById("btn-logout");
const btnGoogleLogin = document.getElementById("btn-google");
const btnModalClose = document.getElementById("btn-modal-close");

function openAuthModal() {
  overlay.classList.add("is-open");
}

function closeAuthModal() {
  overlay.classList.remove("is-open");
}

function setLoggedIn(user) {
  // Hide login button, show avatar
  if (loginBtn) loginBtn.style.display = "none";
  if (avatarBtn) {
    avatarBtn.classList.add("visible");
    const firstName = (user.displayName || user.email || "").split(" ")[0];
    userNameShort.textContent = firstName;
    if (user.photoURL) {
      userPhoto.src = user.photoURL;
      userPhoto.alt = user.displayName || "Avatar";
    } else {
      userPhoto.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email)}&background=F2FF00&color=111&bold=true`;
    }
  }
  closeAuthModal();
}

function setLoggedOut() {
  if (loginBtn) loginBtn.style.display = "";
  if (avatarBtn) avatarBtn.classList.remove("visible");
  if (dropdown) dropdown.classList.remove("is-open");
}

// ---- Auth State Listener ----
onAuthStateChanged(auth, (user) => {
  saveSSOUser(user);
  if (user) {
    setLoggedIn(user);
  } else {
    setLoggedOut();
  }
});

// ---- Event Listeners ----
if (loginBtn) {
  loginBtn.addEventListener("click", openAuthModal);
}

if (btnGoogleLogin) {
  btnGoogleLogin.addEventListener("click", async () => {
    btnGoogleLogin.disabled = true;
    btnGoogleLogin.textContent = "Conectando…";
    try {
      await signInWithPopup(auth, provider);
      // onAuthStateChanged will handle the rest
    } catch (err) {
      console.error("[Auth] Error signing in:", err);
      btnGoogleLogin.disabled = false;
      btnGoogleLogin.innerHTML = `
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="22" height="22"/>
        Reintentar con Google
      `;
    }
  });
}

if (btnModalClose) {
  btnModalClose.addEventListener("click", closeAuthModal);
}

if (overlay) {
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeAuthModal();
  });
}

if (avatarBtn) {
  avatarBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("is-open");
  });
}

document.addEventListener("click", (e) => {
  if (dropdown && !avatarBtn.contains(e.target)) {
    dropdown.classList.remove("is-open");
  }
});

if (btnLogout) {
  btnLogout.addEventListener("click", async () => {
    await signOut(auth);
    dropdown.classList.remove("is-open");
  });
}

// ---- Keyboard trap for modal ----
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeAuthModal();
});
