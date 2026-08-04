/* ============================================
   SEED — datos demo cuando DB esta vacia
   ============================================ */

const Seed = (() => {

  function maybeSeed() {
    const db = State.get();
    if (db.config.nombreGranja && db.ubicaciones.length === 0 && db.aves.length === 0) {
      const uId = Storage.newId("ubi");
      const m1 = Storage.newId("mod");
      const m2 = Storage.newId("mod");
      db.ubicaciones.push({ id: uId, nombre: "Finca principal", direccion: "", notas: "Lote principal" });
      db.modulos.push({ id: m1, nombre: "Modulo A", ubicacionId: uId, capacidad: 100, notas: "Modulo de hembras postura", creadoEn: new Date().toISOString() });
      db.modulos.push({ id: m2, nombre: "Modulo Machos B", ubicacionId: uId, capacidad: 100, notas: "Machos en engorde", creadoEn: new Date().toISOString() });

      // 10 gallinas demo + 2 gallos
      const hoy = new Date();
      for (let i = 0; i < 10; i++) {
        const nac = new Date(hoy); nac.setDate(nac.getDate() - 200 - i);
        db.aves.push({
          id: Storage.newId("ave"),
          placa: `G-${String(i + 1).padStart(3, "0")}`,
          sexo: "hembra",
          raza: "Leghorn",
          moduloId: m1,
          nacimiento: nac.toISOString(),
          estado: "activa",
          notas: "",
          ultimaPostura: null,
          posturas: [],
          peso: 1.8,
          vendida: false,
          muerta: false,
        });
      }
      for (let i = 0; i < 2; i++) {
        const nac = new Date(hoy); nac.setDate(nac.getDate() - 150 - i);
        db.aves.push({
          id: Storage.newId("ave"),
          placa: `M-${String(i + 1).padStart(3, "0")}`,
          sexo: "macho",
          raza: "Rhode Island",
          moduloId: m2,
          nacimiento: nac.toISOString(),
          estado: "activo",
          notas: "Macho reproductor",
          ultimaPostura: null,
          posturas: [],
          peso: 2.5,
          vendida: false,
          muerta: false,
        });
      }
      Storage.save(db);
      State.reload();
    }
  }

  return { maybeSeed };

})();
