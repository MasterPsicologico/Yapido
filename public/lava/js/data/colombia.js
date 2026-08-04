/**
 * colombia.js
 * Datos completos de departamentos y municipios/ciudades de Colombia.
 * Estructura jerárquica: departamento -> [ciudades]
 */

const COLOMBIA_DATA = {
  "Amazonas": ["Leticia", "El Encanto", "La Chorrera", "La Pedrera", "Mirití - Paraná", "Puerto Alegría", "Puerto Arica", "Puerto Nariño", "Puerto Santander", "Tarapacá"],
  "Antioquia": ["Medellín", "Abejorral", "Abriaquí", "Alejandría", "Amagá", "Amalfi", "Andes", "Angelópolis", "Angostura", "Anorí", "Salgar", "Sonsón", "Sopetrán", "Támesis", "Tarazá", "Titiribí", "Toledo", "Turbo", "Urrao", "Valdivia", "Valparaíso", "Vegachí", "Venecia", "Vigía del Fuerte", "Yalí", "Yarumal", "Yolombó", "Yondó", "Zaragoza"],
  "Arauca": ["Arauca", "Arauquita", "Cravo Norte", "Fortul", "Puerto Rondón", "Saravena", "Tame"],
  "Atlántico": ["Barranquilla", "Baranoa", "Campo de la Cruz", "Candelaria", "Galapa", "Juan de Acosta", "Luruaco", "Malambo", "Manatí", "Palmar de Varela", "Piojó", "Polonuevo", "Ponedera", "Puerto Colombia", "Repelón", "Sabanagrande", "Sabanalarga", "Santa Lucía", "Santo Tomás", "Soledad", "Suan", "Tubarco", "Usiacurí"],
  "Bolívar": ["Cartagena", "Achí", "Altos del Rosario", "Arenal", "Arjona", "Arroyohondo", "Barranco de Loba", "Calamar", "Cantagallo", "Carmen de Bolívar", "Cicuco", "Clemencia", "Córdoba", "El Guamo", "El Peñón", "Hatillo de Loba", "Magangué", "Mahates", "Margarita", "María La Baja", "Montecristo", "Morales", "Norosí", "Pinillos", "Regidor", "Río Viejo", "San Cristóbal", "San Estanislao", "San Fernando", "San Jacinto", "San Juan Nepomuceno", "San Martín de Loba", "San Pablo", "Santa Catalina", "Santa Rosa", "Simití", "Sincé", "Tiquisio", "Turbaco", "Turbaná", "Villanueva", "Zambrano"],
  "Boyacá": ["Tunja", "Almeida", "Aquitania", "Arcabuco", "Belén", "Berbeo", "Beteitiva", "Boyacá", "Briceño", " Buenavista", "Caldas", "Campohermoso", "Cerinza", "Chinavita", "Chiquinquirá", "Chiscas", "Chita", "Chitaraque", "Chivatá", "Ciénega", "Chiquinquirá", "Chiscas", "Chita", "Ciénega", "Combo", "Coper", "Corrales", "Covarachía", "Cubará", "Cucaita", "Cuitiva", "Duitama", "El Cocuy", "El Espino", "Firavitoba", "Floresta", "Gachantivá", "Gámeza", "Guacamayas", "Guateque", "Guayatá", "Güicán", "Iza", "Jericó", "Labranzagrande", "La Capilla", "La Uvita", "Villa de Leyva", "Macanal", "Maripí", "Miraflores", "Mongua", "Monguí", "Moniquirá", "Motavita", "Muzo", "Nobsa", "Nuevo Colón", "Oicatá", "Otanche", "Pachavita", "Páez", "Paipa", "Pajarito", "Panqueba", "Pauna", "Paya", "Pesca", "Petea", "Pisba", "Puerto Boyacá", "Quípama", "Ramiriquí", "Ráquira", "Rondón", "Saboyá", "Sáchica", "Samacá", "San José de Pare", "San Luis de Gaceno", "San Mateo", "San Miguel de Sema", "San Pablo de Borbur", "Santa María", "Santa Rosa de Viterbo", "Santa Sofía", "Santana", "Sitio Nuevo", "Soatá", "Socotá", "Socha", "Sotaquirá", "Soracá", "Sotaquirá", "Sutarmachán", "Susacón", "Sutatenza", "Tasco", "Tenza", "Tibaná", "Tinjacá", "Tipacoque", "Toca", "Togüí", "Tópaga", "Tota", "Tununguá", "Turmequé", "Tuta", "Tutazá", "Útica", "Villa de Leyva", "Villapinzón", "Viracachá", "Zetaquira"],
  "Caldas": ["Manizales", "Aguadas", "Anserma", "Aranzazu", "La Dorada", "La Merced", "Manzanares", "Marquetalia", "Marulanda", "Marmato", "Montenegro", "Pácora", "Palestina", "Pensilvania", "Riosucio", "Risaralda", "Salamina", "Samaná", "Supía", "Victoria", "Villamaría", "Viterbo"],
  "Caquetá": ["Florencia", "Albania", "Belén de los Andaquíes", "Cartagena del Chairá", "Curillo", "El Doncello", "El Paujil", "La Montañita", "Milán", "Morelia", "Puerto Rico", "San José del Fragua", "San Vicente del Caguán", "Solano", "Solita", "Valparaíso"],
  "Casanare": ["Yopal", "Aguazul", "Chámeza", "Hato Corozal", "La Salina", "Maní", "Monterrey", "Nunchía", "Öira", "Paz de Ariporo", "Pore", "Recetor", "Sácama", "San Luis de Palenque", "Támara", "Tauramena", "Trinidad", "Villanueva"],
  "Cauca": ["Popayán", "Almaguer", "Argelia", "Balboa", "Bolívar", "Buenos Aires", "Cajibío", " Caldono", "Caloto", "Corinto", "Florecia", " El Tambo", "Florencia", "Guachené", "Guapí", "Inzá", "Jambaló", "La Sierra", "La Vega", "López de Micay", "Mercaderes", "Miranda", "Morales", "Padilla", "Páez", "Patía", "Piamonte", "Piendamó", "Puerto Tejada", "Puracé", "Rosas", "San Sebastián", "Santa Rosa", "Santander de Quilichao", "Silvia", "Sotara", "Suárez", "Sucre", "Timbío", "Timbiquí", "Toribío", "Totoró", "Villa Rica"],
  "Cesar": ["Valledupar", "Aguachica", "Astrea", "Becerril", "Bosconia", "Chimichagua", "Chiriguaná", "Codazzi", "Curumaní", "El Copey", "El Paso", "Gamarra", "González", "La Gloria", "La Jagua de Ibirico", "Manaure", "Pailitas", "Pelaya", "Pueblo Bello", "Río de Oro", "San Alberto", "San Diego", "San Martín", "San Roque", "Tamalameque", "Valle de Upar"],
  "Chocó": ["Quibdó", "Acandí", "Alto Baudó", "Atrato", "Bagadó", "Bahía Solano", "Bajo Baudó", "Bojayá", "Carmelo", "Cértegui", "Condoto", "El Cantón del San Pablo", "El Carmen del Atrato", "Eleuterio Penague", "Istmina", "Juradó", "Litoral del San Juan", "Lloró", "Medio Atrato", "Medio Baudó", "Medio San Juan", "Nuquí", "Río Iró", "Río Quito", "Riosucio", "San José del Palmar", "Sipí", "Tadó", "Unguía", "Unión Panamericana"],
  "Córdoba": ["Montería", "Ayapel", "Buenavista", "Canalete", "Cereté", "Chimá", "Chinú", "Cotorra", "Coveñas", "Ciénaga de Oro", "La Apartada", "Lorica", "Los Córdobas", "Momil", "Montelíbano", "Montería", "Moñitos", "Planeta Rica", "Pueblo Nuevo", "Puerto Escondido", "Puerto Libertador", "San Andrés de Sotavento", "San Antero", "San Bernardo del Viento", "San Carlos", "San Pelayo", "Tierralta", "Tuchín", "Valencia"],
  "Cundinamarca": ["Bogotá D.C.", "Agua de Dios", "Albán", "Anapoima", "Anolaima", "Arbeláez", "Beltrán", "Bituima", "Bosa", "Bojacá", "Cabrera", "Cachipay", "Cajicá", "Caparrapí", "Cáqueza", "Carmen de Carupa", "Chaguaní", "Chía", "Chipaque", "Choachí", "Chocontá", "Cogua", "Cota", "Cucunubá", "El Colegio", "El Peñón", "Facatativá", "Fómeque", "Fosca", "Funza", "Fúquene", "Fusagasugá", "Gachalá", "Gachetá", "Gama", "Girardot", "Granada", "Guachetá", "Guaduas", "Guasca", "Guataquí", "Guatavita", "Guayabal de Siquima", "Guayabetal", "Gutiérrez", "Jerusalén", "Junín", "La Calera", "La Mesa", "La Palma", "La Peña", "La Vega", "Lenguazaque", "Machetá", "Manta", "Medina", "Mosquera", "Nariño", "Nemocón", "Nilo", "Nimaima", "Nocaima", "Pacho", "Paime", "Pandi", "Pasca", "Puerto Salgar", "Pulí", "Quebradanegra", "Quetame", "Quipile", "Ricaurte", "San Antonio del Tequendama", "San Bernardo", "San Cayetano", "San Francisco", "San Juan de Rioseco", "Sasaima", " Sesquilé", "Sibaté", "Silvania", "Simijaca", "Soacha", "Sopó", "Subachoque", "Suesca", "Supatá", "Susa", "Sutatausa", "Tabio", "Tausa", "Tena", "Tenjo", "Tibacuy", "Tibirita", "Tocaima", "Tocancipá", "Topaipí", "Tota", "Tubajá", "Ubalá", "Ubaque", "Une", "Útica", "Venecia", "Vergara", "Vianí", "Villagómez", "Villapinzón", "Villeta", "Viotá", "Yacopí", "Zipacón", "Zipaquirá"],
  "Guainía": ["Inírida", "Barranco Minas", "Cacahual", "El Retorno", "La Guadalupe", "Morichal", "Pana Pana", "Puerto Colombia", "San Felipe"],
  "Guaviare": ["San José del Guaviare", "Calamar", "El Retorno", "Miraflores", "Mapiripán", "San José del Guaviare"],
  "Huila": ["Neiva", "Acevedo", "Agrado", "Aipe", "Algeciras", "Altamira", "Baraya", "Campoalegre", "Colombia", "Elías", "Garzón", "Gigante", "Guadalupe", "Hato", "Íquira", "Isnos", "La Argentina", "La Plata", "Nátaga", "Oporapa", "Paicol", "Palermo", "Palestina", "Pital", "Pitalito", "Rivera", "Saladoblanco", "San Agustín", "Santa María", "Suaza", "Tarqui", "Tello", "Teruel", "Tesalia", "Villavieja", "Yaguará"],
  "La Guajira": ["Riohacha", "Albania", "Barrancas", "Dibulla", "Distracción", "El Cerrito", "Fonseca", "Hatonuevo", "La Jagua del Pilar", "Maicao", "Manaure", "San Juan del Cesar", "Uribia", "Urumita", "Villanueva"],
  "Magdalena": ["Santa Marta", "Algarrobo", "Aracataca", "Ariguaní", "Cerro de San Antonio", "Chibolo", "Ciénaga", "Concordia", "El Banco", "El Piñón", "El Retén", "Fundación", "Guamal", "Nueva Granada", "Pedraza", "Pijiño del Carmen", "Pivijay", "Plato", "Puebloviejo", "Remolino", "Sabanas de San Ángel", "Salamina", "San Sebastián de Buenavista", "San Zenón", "Santa Ana", "Santa Bárbara de Pinto", "Sitionuevo", "Tenerife", "Zapayán", "Zona Bananera"],
  "Meta": ["Villavicencio", "Acacías", "Barranca de Upía", "Cabuyaro", "Castilla La Nueva", "Cubarral", "Cumaribo", "El Calvario", "El Castillo", "El Dorado", "Fuente de Oro", "Granada", "Guamal", "La Macarena", "Lejanías", "Mapiripán", "Mesetas", "Puerto Concordia", "Puerto Gaitán", "Puerto Lleras", "Puerto López", "Puerto Rico", "Restrepo", "San Carlos de Guaroa", "San Juan de Arama", "San Juanito", "San Martín", "San Vicente del Caguán", "Uribe", "Vistahermosa", "Villanueva"],
  "Nariño": ["Pasto", "Albania", "Aldana", "Ancuyá", "Arboleda", "Barbacoas", "Belén", "Buesaco", "Chachagüí", "Colón", "Consacá", "Contamiento", "Cuaspud", "Cumbal", "Cumbitara", "El Charco", "El Peñol", "El Rosario", "El Tablón", "Francisco Pizarro", "Funes", "Guachucal", "Guaitarilla", "Gualmatán", "Iles", "Imués", "Ipiales", "La Cruz", "La Florida", "La Llanada", "La Tola", "La Unión", "Leiva", "Linares", "Los Andes", "Magüí", "Mallama", "Mosquera", "Nariño", "Olaya Herrera", "Ospina", "Pasto", "Policarpa", "Potosí", "Providencia", "Puerres", "Pupiales", "Ricaurte", "Roberts", "Samaniego", "Sandoná", "San Bernardino", "San Lorenzo", "San Pablo", "San Pedro de Cartago", "San Andrés de Tumaco", "Santacruz", "Sapuyes", "Taminango", "Tangua", "Tumaco", "Tuquerres", "Yacuanquer"],
  "Norte de Santander": ["Cúcuta", "Abrego", "Arboledas", "Bochalema", "Bucarasica", "Cácota", "Cáchira", "Chinácota", "Chitagá", "Convención", "Cucutilla", "Durania", "El Carmen", "El Tarra", "Gramalote", "Hacarí", "Herrán", "Labateca", "La Esperanza", "La Playa", "Lourdes", "Los Patios", "Mutiscua", "Ocaña", "Pamplona", "Pamplonita", "Puerto Santander", "Ragonvalia", "Salazar", "San Calixto", "San Cayetano", "Santiago", "Sardinata", "Silos", "Teorama", "Tibú", "Toledo", "Villa Caro", "Villa del Rosario", "Zulia"],
  "Putumayo": ["Mocoa", "Colón", "Orito", "Puerto Asís", "Puerto Caicedo", "Puerto Guzmán", "Puerto Leguízamo", "San Francisco", "San Miguel", "Santiago", "Sibundoy", "Valle del Guamuez", "Villagarzón"],
  "Quindío": ["Armenia", "Buenos Aires", "Calarcá", "Circasia", "Córdoba", "Filandia", "Génova", "La Tebaida", "Montenegro", "Pijao", "Quimbaya", "Salento", "Sevilla"],
  "Risaralda": ["Pereira", "Apía", "Balboa", "Belén de Umbría", "Dosquebradas", "Guática", "La Celina", "La Virginia", "Marsella", "Mistrato", "Pueblo Rico", "Quinchía", "Santa Rosa de Cabal", "Santuario"],
  "San Andrés y Providencia": ["San Andrés", "Providencia", "Santa Catalina"],
  "Santander": ["Bucaramanga", "Aguada", "Albania", "Aratoca", "Barbosa", "Barichara", "Barrancabermeja", "Betulia", "Bolívar", "Bucaramanga", "Cabrera", "California", "Capitanejo", "Carcasí", "Cepitá", "Cerrito", "Charalá", "Charta", "Chima", "Chipatá", "Cimitarra", "Concepción", "Confines", "Contratación", "Coromoro", "Curití", "El Carmen", "El Guacamayo", "El Peñón", "El Playón", "Encino", "Enciso", "Florián", "Floridablanca", "Galán", "Gámbita", "Girón", "Guaca", "Guadalupe", "Guapotá", "Guavatá", "Güepsa", "Hato", "Jesús María", "Jordán", "La Belleza", "Landázuri", "La Paz", "Lebríja", "Los Santos", "Macaravita", "Málaga", "Matanza", "Mogotes", "Molagavita", "Ocamonte", "Oiba", "Onzaga", "Palmas del Socorro", "Palmar", "Páramo", "Piedecuesta", "Pinchote", "Puente Nacional", "Puerto Parra", "Puerto Wilches", "Rionegro", "Sabana de Torres", "San Andrés", "San Benito", "San Gil", "San Joaquín", "San José de Miranda", "San Miguel", "San Vicente de Chucurí", "Santa Bárbara", "Santa Helena del Opón", "Simacota", "Socorro", "Suaita", "Sucre", "Suratá", "Tona", "Valle de San José", "Vélez", "Vetas", "Villanueva", "Zapatoca"],
  "Sucre": ["Sincelejo", "Buenavista", "Caimito", "Chalán", "Colosó", "Corozó", "Coveñas", "El Roble", "Galeras", "Guaranda", "La Unión", "Los Palmitos", "Majagual", "Morroa", "Ovejas", "Palmito", "Sampués", "San Benito Abad", "San Juan de Betulia", "San Marcos", "San Pedro", "San Onofre", "San Luis de Sincé", "Santiago de Tolú", "Sincelejo", "Sucre", "Tolú Viejo"],
  "Tolima": ["Ibagué", "Alpujarra", "Alvarado", "Ambalema", "Anzoátegui", "Armero Guayabal", "Ataco", "Cajamarca", "Carmen de Apicalá", "Casablanca", "Chaparral", "Coello", "Coyaima", "Cundinamarca", "Dolores", "Espinal", "Falan", "Flandes", "Fresno", "Guamo", "Herveo", "Honda", "Ibagué", "Icononzo", "Lérida", "Líbano", "Mariquita", "Melgar", "Murillo", "Natagaima", "Ortega", "Palocabildo", "Piedras", "Planadas", "Prado", "Purificación", "Rioblanco", "Roncesvalles", "Rovira", "Saldaña", "San Antonio", "San Luis", "Santa Isabel", "Suárez", "Valle de San Juan", "Venadillo", "Villahermosa", "Villarrica"],
  "Valle del Cauca": ["Cali", "Alcalá", "Andalucía", "Argelia", "Bolívar", "Buenaventura", "Bugalagrande", "Buga", "Caicedonia", "Calima", "Cali", "Candelaria", "Cartago", "Dagua", "El Águila", "El Cairo", "El Cerrito", "El Dovio", "Florida", "Ginebra", "Guacarí", "Guadalajara de Buga", "Jamundí", "La Cumbre", "La Unión", "La Victoria", "Obando", "Palmira", "Pradera", "Restrepo", "Riofrío", "Roldanillo", "San Pedro", "Sevilla", "Toro", "Trujillo", "Tuluá", "Ulloa", "Versalles", "Vijes", "Yotoco", "Yumbo", "Zarzal"],
  "Vaupés": ["Mitú", "Carurú", "Pacoa", "Taraira", "Yavaraté", "Papunahua", "Cumaribo"],
  "Vichada": ["Puerto Carreño", "La Primavera", "Santa Rosalía", "Cumaribo"]
};

/**
 * Obtiene lista de departamentos ordenados alfabéticamente.
 * @returns {string[]}
 */
function getDepartamentos() {
  return Object.keys(COLOMBIA_DATA).sort((a, b) => a.localeCompare(b, 'es'));
}

/**
 * Obtiene las ciudades de un departamento.
 * @param {string} departamento
 * @returns {string[]}
 */
function getCiudadesByDepartamento(departamento) {
  const ciudades = COLOMBIA_DATA[departamento];
  if (!ciudades) return [];
  return [...new Set(ciudades)].sort((a, b) => a.localeCompare(b, 'es'));
}

/**
 * Busca el departmento al que pertenece una ciudad.
 * @param {string} ciudad
 * @returns {string|null}
 */
function getDepartamentoByCiudad(ciudad) {
  for (const [dep, ciudades] of Object.entries(COLOMBIA_DATA)) {
    if (ciudades.some(c => c.toLowerCase() === ciudad.toLowerCase())) {
      return dep;
    }
  }
  return null;
}

window.ColombiaData = {
  COLOMBIA_DATA,
  getDepartamentos,
  getCiudadesByDepartamento,
  getDepartamentoByCiudad
};
