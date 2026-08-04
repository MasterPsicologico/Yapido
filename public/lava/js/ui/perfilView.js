/**
 * perfilView.js
 * Vista de perfil del usuario - muestra:
 *  - Datos del usuario
 *  - Botones para convertirse en dueno de tienda o en repartidor (introducir codigo)
 *  - Si esta vinculado como repartidor, ver info de la tienda y boton para desvincularse / ir al panel
 *  - Configuracion (vibracion, sonido, permisos)
 */

const PerfilView = (function () {

  async function render() {
    const user = Auth.currentUser();
    if (!user) return;

    const wrap = UI.el("div.perfil-view");
    wrap.appendChild(UI.el("h2", {}, ["Mi perfil"]));

    const card = UI.el("div.user-card");
    if (user.photoURL) {
      card.appendChild(UI.el("img", { src: user.photoURL, class: "avatar" }));
    }
    card.appendChild(UI.el("div.user-name", {}, [user.displayName || "Invitado"]));
    card.appendChild(UI.el("div.user-meta", {}, [user.email || user.phone || "Anonimo"]));
    card.appendChild(UI.el("div.user-rol", {}, ["Rol: " + UI.labelRol(user.role)]));
    if (user.provider === APP_CONFIG.authProviders.ANONIMO) {
      card.appendChild(UI.el("p.note", {}, ["Cuenta anonima. Para alquilar una lavadora necesitas Google o telefono."]));
    }
    wrap.appendChild(card);

    // Editar nombre / telefono
    const btnEditar = UI.el("button.btn.btn-secondary", {
      onclick: () => {
        const newName = prompt("Nombre (actual):", user.displayName || "");
        const newPhone = prompt("Telefono / WhatsApp (dejar igual si no):", (user.phone || "").replace("+57", ""));
        if (newName === null && newPhone === null) return;
        const updates = {};
        if (newName !== null) updates.displayName = newName;
        if (newPhone !== "") {
          let phone = newPhone.trim();
          if (phone && !phone.startsWith("+")) phone = phone.startsWith("57") ? "+" + phone : "+57" + phone;
          if (phone) updates.phone = phone;
        }
        Auth.updateProfile(updates).then(() => { UI.toast("Perfil actualizado"); render(); });
      }
    }, ["Editar perfil"]);
    wrap.appendChild(btnEditar);

    // Convertirse en dueno de tienda
    if (user.role === APP_CONFIG.roles.CLIENTE) {
      wrap.appendChild(UI.el("div.action-block", {}, [
        UI.el("h3", {}, ["Quiero ser dueno de tienda"]),
        UI.el("p", {}, ["Registra tu tienda de alquiler de lavadoras y empieza a recibir pedidos."]),
        UI.el("button.btn.btn-primary", {
          onclick: async () => {
            await Auth.updateRole(APP_CONFIG.roles.DUENO_TIENDA);
            DuenoView.render();
          }
        }, ["Registrar mi tienda"])
      ]));
    }

    // Vincularse como repartidor con codigo de 6 digitos
    if (!user.tiendaId) {
      const wrapCod = UI.el("div.action-block");
      wrapCod.appendChild(UI.el("h3", {}, ["Tengo un codigo de repartidor"]));
      wrapCod.appendChild(UI.el("p", {}, ["Si un dueno de tienda te dio un codigo de 6 digitos, ingresalo para vincularte como repartidor a su tienda."]));
      const inp = UI.el("input.input", { type: "text", maxlength: "6", placeholder: "Codigo de 6 digitos" });
      wrapCod.appendChild(UI.el("label", {}, ["Codigo"]));
      wrapCod.appendChild(inp);
      wrapCod.appendChild(UI.el("button.btn.btn-primary", {
        onclick: async () => {
          if (!inp.value || inp.value.length !== 6) { UI.toast("Ingresa un codigo valido.", "error"); return; }
          try {
            await RepartidorService.vincularConCodigo(inp.value.trim());
            UI.toast("Vinculado como repartidor!");
            render();
          } catch (e) { UI.toast(e.message, "error"); }
        }
      }, ["Vincularme como repartidor"]));
      wrap.appendChild(wrapCod);
    } else {
      // Ya esta vinculado: mostrar info de la tienda y acceso al panel
      const tienda = await Store.get("tiendas", user.tiendaId);
      if (tienda) {
        const block = UI.el("div.action-block");
        block.appendChild(UI.el("h3", {}, ["Tu tienda"]));
        block.appendChild(UI.el("div.tienda-info-summary", {
          onclick: () => {
            if (user.role === APP_CONFIG.roles.REPARTIDOR) RepartidorView.render();
            else if (user.role === APP_CONFIG.roles.DUENO_TIENDA) DuenoView.render();
          }
        }, [
          UI.el("strong", {}, [tienda.nombre]),
          UI.el("div", {}, [tienda.ciudad + ", " + tienda.departamento]),
          UI.el("div.sub", {}, ["(Toca para abrir el panel)"])
        ]));
        if (user.role === APP_CONFIG.roles.REPARTIDOR) {
          block.appendChild(UI.el("button.btn.btn-secondary", {
            onclick: async () => {
              if (!confirm("Seguro que deseas desvincularte? Podras volver a vincularte con el mismo codigo cuando quieras.")) return;
              try {
                await RepartidorService.desvincular();
                UI.toast("Desvinculado.");
                render();
              } catch (e) { UI.toast(e.message, "error"); }
            }
          }, ["Desvincularme como repartidor"]));
        }
        wrap.appendChild(block);
      }
    }

    // Boton admin (oculto, con codigo)
    wrap.appendChild(UI.el("button.btn.btn-ghost", {
      onclick: () => AdminView.render()
    }, ["Acceso administrador principal"]));

    // Configuracion notificaciones
    wrap.appendChild(UI.el("div.config-block"));
    const config = UI.el("div.config-block");
    config.appendChild(UI.el("h3", {}, ["Configuracion"]));
    const chkVib = UI.el("input", { type: "checkbox", checked: true });
    const lblVib = UI.el("label.switch", {}, [chkVib, UI.el("span", {}, [" Vibracion en alertas"])]);
    chkVib.onchange = () => Notificaciones.setVibration(chkVib.checked);
    config.appendChild(lblVib);
    const chkSonido = UI.el("input", { type: "checkbox", checked: true });
    const lblSonido = UI.el("label.switch", {}, [chkSonido, UI.el("span", {}, [" Sonido en alertas"])]);
    chkSonido.onchange = () => Notificaciones.setSound(chkSonido.checked);
    config.appendChild(lblSonido);
    wrap.appendChild(config);

    // Cerrar sesion
    wrap.appendChild(UI.el("button.btn.btn-danger", {
      onclick: () => {
        if (!confirm("Cerrar sesion?")) return;
        Auth.signOut();
        location.reload();
      }
    }, ["Cerrar sesion"]));

    UI.setVista(wrap, "perfil");
  }

  return { render };
})();

window.PerfilView = PerfilView;
