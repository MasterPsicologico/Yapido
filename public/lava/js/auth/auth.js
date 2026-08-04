/**
 * auth.js
 * Sistema de autenticación — soporta Google Sign-In, teléfono (OTP simulado) y anónimo.
 * Emula Firebase Auth con LocalStorage para no requerir backend.
 */

const Auth = (function () {
  const CURRENT_KEY = "lavago_current_user";

  let _currentUser = null;
  const _listeners = [];

  /**
   * Carga el usuario actual desde localStorage al inicializar.
   */
  function _init() {
    const raw = localStorage.getItem(CURRENT_KEY);
    if (raw) {
      try { _currentUser = JSON.parse(raw); } catch {}
    }
  }

  function _persist() {
    if (_currentUser) localStorage.setItem(CURRENT_KEY, JSON.stringify(_currentUser));
    else localStorage.removeItem(CURRENT_KEY);
    _listeners.forEach(cb => cb(_currentUser));
  }

  /**
   * Crea o actualiza un perfil de usuario en la colección "usuarios".
   */
  async function _saveProfile(user) {
    await Store.set("usuarios", {
      ...user,
      updatedAt: Date.now()
    });
  }

  /**
   * Sign-In con Google.
   * En producción se usaría Firebase Auth + Google Provider.
   * Aquí se simula con Google Identity Services (GIS) si está cargado el script,
   * o se piden los datos manualmente.
   */
  async function signInWithGoogle() {
    // En producción: window.google.accounts.id.initialize({...})
    if (window.google && window.google.accounts && window.google.accounts.id) {
      return new Promise((resolve, reject) => {
        window.google.accounts.id.initialize({
          client_id: APP_CONFIG.firebase.apiKey,
          callback: async (response) => {
            try {
              const payload = JSON.parse(atob(response.credential.split(".")[1]));
              _currentUser = {
                uid: "google_" + payload.sub,
                email: payload.email,
                displayName: payload.name,
                photoURL: payload.picture,
                phone: null,
                provider: APP_CONFIG.authProviders.GOOGLE,
                role: APP_CONFIG.roles.CLIENTE
              };
              await _saveProfile({ ..._currentUser, createdAt: Date.now() });
              _persist();
              resolve(_currentUser);
            } catch (e) { reject(e); }
          }
        });
        window.google.accounts.id.prompt();
      });
    }

    // Fallback: login simulado con email
    const email = prompt("Ingresa tu correo de Google:");
    if (!email || !email.includes("@")) throw new Error("Email inválido");
    const name = prompt("Tu nombre:", "") || "";
    _currentUser = {
      uid: "google_" + btoa(email).slice(0, 12),
      email,
      displayName: name,
      photoURL: null,
      phone: null,
      provider: APP_CONFIG.authProviders.GOOGLE,
      role: APP_CONFIG.roles.CLIENTE,
      createdAt: Date.now()
    };
    await _saveProfile(_currentUser);
    _persist();
    return _currentUser;
  }

  /**
   * Sign-In con teléfono — OTP de 6 dígitos simulado.
   * En producción se usaría Firebase phone auth con reCAPTCHA.
   */
  async function signInWithPhone(phoneNumber) {
    // Normaliza número — requiere indicativo +57 para Colombia
    let phone = phoneNumber.replace(/\s+/g, "");
    if (!phone.startsWith("+")) {
      phone = phone.startsWith("57") ? "+" + phone : "+57" + phone;
    }

    // Simula el envío de OTP
    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    console.info("[DEV] OTP simulado para", phone, ":", otpCode);

    // En producción, Firebase envía SMS.
    // Aquí lo pedimos y validamos.
    const entered = prompt(`Se ha enviado un código de verificación a ${phone}.\n(DEV: usa ${otpCode})\n\nIngresa el código de 6 dígitos:`);
    if (!entered) throw new Error("Verificación cancelada");
    if (entered.trim() !== otpCode) throw new Error("Código incorrecto");

    _currentUser = {
      uid: "phone_" + phone.replace(/[^\d]/g, ""),
      email: null,
      displayName: null,
      photoURL: null,
      phone,
      provider: APP_CONFIG.authProviders.TELEFONO,
      role: APP_CONFIG.roles.CLIENTE,
      createdAt: Date.now()
    };
    await _saveProfile(_currentUser);
    _persist();
    return _currentUser;
  }

  /**
   * Ingreso anónimo — para usuarios que solo quieren ver tiendas.
   */
  async function signInAnonymously() {
    const anonId = "anon_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    _currentUser = {
      uid: anonId,
      email: null,
      displayName: "Invitado",
      photoURL: null,
      phone: null,
      provider: APP_CONFIG.authProviders.ANONIMO,
      role: APP_CONFIG.roles.CLIENTE,
      isAnonymous: true,
      createdAt: Date.now()
    };
    await _saveProfile(_currentUser);
    _persist();
    return _currentUser;
  }

  /**
   * Actualiza el rol del usuario actual.
   * Si es repartidor o dueño, se debe completar el perfil.
   */
  async function updateRole(role, extra = {}) {
    if (!_currentUser) throw new Error("No hay sesión");
    _currentUser = { ..._currentUser, role, ...extra };
    await _saveProfile(_currentUser);
    _persist();
    return _currentUser;
  }

  /**
   * Actualiza campos del perfil del usuario actual.
   */
  async function updateProfile(updates) {
    if (!_currentUser) throw new Error("No hay sesión");
    _currentUser = { ..._currentUser, ...updates };
    await _saveProfile(_currentUser);
    _persist();
    return _currentUser;
  }

  /**
   * Cierra sesión.
   */
  function signOut() {
    _currentUser = null;
    _persist();
  }

  /**
   * Devuelve el usuario actual.
   */
  function currentUser() {
    return _currentUser;
  }

  /**
   * Indica si hay sesión activa.
   */
  function isSignedIn() {
    return _currentUser !== null;
  }

  /**
   * Suscripción a cambios de sesión.
   */
  function onChanged(cb) {
    _listeners.push(cb);
    cb(_currentUser);
    return () => {
      const idx = _listeners.indexOf(cb);
      if (idx !== -1) _listeners.splice(idx, 1);
    };
  }

  _init();

  return {
    signInWithGoogle,
    signInWithPhone,
    signInAnonymously,
    updateProfile,
    updateRole,
    signOut,
    currentUser,
    isSignedIn,
    onChanged
  };
})();

window.Auth = Auth;
