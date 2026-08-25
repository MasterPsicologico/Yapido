/**
 * AnimeStream - Top 10 Famous Anime Series Data
 * Estructura: id, title, year, status, genres, poster, synopsis, episodes[]
 * Los episodios se pueden poblar automáticamente o manualmente
 */

export const TOP_10_ANIME = [
  {
    id: 'attack-on-titan',
    title: 'Attack on Titan',
    titleJp: '進撃の巨人',
    year: 2013,
    status: 'completed',
    genres: ['acción', 'drama', 'fantasía oscura', 'post-apocalíptico', 'shonen'],
    poster: 'https://image.tmdb.org/t/p/w300/1ZIJpHVGhjF6rcSHFZfJ76JrHF.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w1280/1ZIJpHVGhjF6rcSHFZfJ76JrHF.jpg',
    synopsis: 'La humanidad vive tras murallas gigantescas para protegerse de los Titanes, criaturas devoradoras de humanos. Cuando un Titán Colosal rompe la muralla, Eren Yeager jura exterminarlos a todos.',
    totalEpisodes: 89,
    seasons: 4,
    malId: 16498,
    anilistId: 16498,
    episodes: []
  },
  {
    id: 'fullmetal-alchemist-brotherhood',
    title: 'Fullmetal Alchemist: Brotherhood',
    titleJp: '鋼の錬金術師 FULLMETAL ALCHEMIST',
    year: 2009,
    status: 'completed',
    genres: ['acción', 'aventura', 'fantasía', 'steampunk', 'shonen'],
    poster: 'https://image.tmdb.org/t/p/w300/edLUfLwHZzJfZ7gN2C7U9JV3VK.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w1280/edLUfLwHZzJfZ7gN2C7U9JV3VK.jpg',
    synopsis: 'Dos hermanos alquimistas buscan la Piedra Filosofal para recuperar sus cuerpos tras un ritual fallido. Una historia de redención, sacrificio y la verdad detrás de la alquimia.',
    totalEpisodes: 64,
    seasons: 1,
    malId: 5114,
    anilistId: 5114,
    episodes: []
  },
  {
    id: 'death-note',
    title: 'Death Note',
    titleJp: 'デスノート',
    year: 2006,
    status: 'completed',
    genres: ['misterio', 'psicológico', 'sobrenatural', 'thriller', 'seinen'],
    poster: 'https://image.tmdb.org/t/p/w300/ccLj9hWOyqx1d4vuo7zUd5T2q7H.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w1280/ccLj9hWOyqx1d4vuo7zUd5T2q7H.jpg',
    synopsis: 'Light Yagami encuentra un cuaderno que mata a cualquiera cuyo nombre se escriba en él. Decide crear un "mundo perfecto" eliminando criminales, pero el detective L le da caza.',
    totalEpisodes: 37,
    seasons: 1,
    malId: 1535,
    anilistId: 1535,
    episodes: []
  },
  {
    id: 'one-piece',
    title: 'One Piece',
    titleJp: 'ワンピース',
    year: 1999,
    status: 'airing',
    genres: ['aventura', 'comedia', 'fantasía', 'shonen', 'piratas'],
    poster: 'https://image.tmdb.org/t/p/w300/9Yz1fX8U5vE8F2JwK7R5P9Q2zL.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w1280/9Yz1fX8U5vE8F2JwK7R5P9Q2zL.jpg',
    synopsis: 'Monkey D. Luffy y su tripulación de los Sombrero de Paja surcan el Grand Line en busca del tesoro definitivo, el One Piece, para convertirse en el Rey de los Piratas.',
    totalEpisodes: 1100,
    seasons: 20,
    malId: 21,
    anilistId: 21,
    episodes: []
  },
  {
    id: 'naruto-shippuden',
    title: 'Naruto Shippuden',
    titleJp: 'ナルト 疾風伝',
    year: 2007,
    status: 'completed',
    genres: ['acción', 'aventura', 'ninja', 'shonen', 'superpoderes'],
    poster: 'https://image.tmdb.org/t/p/w300/kVQYqE5LK8JqJ9H8Y9J8H8Y9J8H.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w1280/kVQYqE5LK8JqJ9H8Y9J8H8Y9J8H.jpg',
    synopsis: 'Naruto Uzumaki regresa a la Aldea Oculta de la Hoja tras dos años de entrenamiento. Debe enfrentar a la Akatsuki y salvar a su amigo Sasuke mientras persigue su sueño de ser Hokage.',
    totalEpisodes: 500,
    seasons: 21,
    malId: 1735,
    anilistId: 1735,
    episodes: []
  },
  {
    id: 'demon-slayer',
    title: 'Demon Slayer: Kimetsu no Yaiba',
    titleJp: '鬼滅の刃',
    year: 2019,
    status: 'airing',
    genres: ['acción', 'histórico', 'sobrenatural', 'shonen', 'demonios'],
    poster: 'https://image.tmdb.org/t/p/w300/xUfRZu2mi8jH6SzQEJGP6tjBU5I.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w1280/xUfRZu2mi8jH6SzQEJGP6tjBU5I.jpg',
    synopsis: 'Tanjiro Kamado se une al Cuerpo de Cazadores de Demonios para vengar a su familia y curar a su hermana Nezuko, convertida en demonio. Una historia de determinación y lazos fraternales.',
    totalEpisodes: 63,
    seasons: 4,
    malId: 38000,
    anilistId: 101922,
    episodes: []
  },
  {
    id: 'jujutsu-kaisen',
    title: 'Jujutsu Kaisen',
    titleJp: '呪術廻戦',
    year: 2020,
    status: 'airing',
    genres: ['acción', 'sobrenatural', 'escolar', 'shonen', 'maldiciones'],
    poster: 'https://image.tmdb.org/t/p/w300/lFx9dGc5F3bV9Y8Y9J8H8Y9J8H8.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w1280/lFx9dGc5F3bV9Y8Y9J8H8Y9J8H8.jpg',
    synopsis: 'Yuji Itadori ingiere un dedo maldito y se convierte en recipiente de Ryomen Sukuna. Se une a la Escuela de Hechicería de Jujutsu para combatir maldiciones y controlar su poder.',
    totalEpisodes: 47,
    seasons: 2,
    malId: 40748,
    anilistId: 117569,
    episodes: []
  },
  {
    id: 'my-hero-academia',
    title: 'My Hero Academia',
    titleJp: '僕のヒーローアカデミア',
    year: 2016,
    status: 'airing',
    genres: ['acción', 'escolar', 'superhéroes', 'shonen', 'superpoderes'],
    poster: 'https://image.tmdb.org/t/p/w300/5XWZlY8Y9J8H8Y9J8H8Y9J8H8Y9.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w1280/5XWZlY8Y9J8H8Y9J8H8Y9J8H8Y9.jpg',
    synopsis: 'En un mundo donde el 80% tiene "Quirks" (superpoderes), Izuku Midoriya nace sin uno. Tras heredar el poder del héroe #1, entra en la U.A. High para convertirse en el mayor héroe.',
    totalEpisodes: 159,
    seasons: 7,
    malId: 31964,
    anilistId: 21583,
    episodes: []
  },
  {
    id: 'hunter-x-hunter-2011',
    title: 'Hunter x Hunter (2011)',
    titleJp: 'HUNTER×HUNTER',
    year: 2011,
    status: 'completed',
    genres: ['acción', 'aventura', 'fantasía', 'shonen', 'torneos'],
    poster: 'https://image.tmdb.org/t/p/w300/9Yz1fX8U5vE8F2JwK7R5P9Q2zL2.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w1280/9Yz1fX8U5vE8F2JwK7R5P9Q2zL2.jpg',
    synopsis: 'Gon Freecss descubre que su padre está vivo y es un Hunter legendario. Decide seguir sus pasos, enfrentar el Examen Hunter y explorar un mundo de bestias, magia y misterios.',
    totalEpisodes: 148,
    seasons: 6,
    malId: 11061,
    anilistId: 11061,
    episodes: []
  },
  {
    id: 'steins-gate',
    title: 'Steins;Gate',
    titleJp: 'シュタインズ・ゲート',
    year: 2011,
    status: 'completed',
    genres: ['ciencia ficción', 'thriller', 'psicológico', 'viajes en el tiempo', 'seinen'],
    poster: 'https://image.tmdb.org/t/p/w300/8Yz1fX8U5vE8F2JwK7R5P9Q2zL3.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w1280/8Yz1fX8U5vE8F2JwK7R5P9Q2zL3.jpg',
    synopsis: 'Rintaro Okabe y su "Laboratorio de Gadgets del Futuro" descubren cómo enviar mensajes al pasado. Un error desencadena una cadena de eventos que amenaza la existencia de sus amigos.',
    totalEpisodes: 24,
    seasons: 1,
    malId: 9253,
    anilistId: 9253,
    episodes: []
  }
];

// Datos de episodios de ejemplo para demostración
// En producción, estos se obtendrían de APIs como Jikan, AniList, o se añaden manualmente
export const SAMPLE_EPISODES = {
  'attack-on-titan': [
    { number: 1, season: 1, title: 'A ti, dentro de 2000 años: La caída de Shiganshina (1)', videoUrl: '', thumbnail: '', duration: 1440, tags: ['canon'], synopsis: 'Los titanes rompen la muralla Maria. Eren ve a su madre devorada y jura venganza.' },
    { number: 2, season: 1, title: 'A ti, dentro de 2000 años: La caída de Shiganshina (2)', videoUrl: '', thumbnail: '', duration: 1440, tags: ['canon'], synopsis: 'Los refugiados huyen hacia la muralla Rose. Eren, Mikasa y Armin se alistan en el ejército.' },
    { number: 3, season: 1, title: 'Una luz en la oscuridad: La ceremonia de graduación', videoUrl: '', thumbnail: '', duration: 1440, tags: ['canon'], synopsis: 'Entrenamiento del 104º Cuerpo de Cadetes. Eren lucha con el equipo de maniobra tridimensional.' },
    { number: 4, season: 1, title: 'La noche del clausura: La batalla de Trost', videoUrl: '', thumbnail: '', duration: 1440, tags: ['canon'], synopsis: 'Los titanes invaden Trost. Eren descubre su habilidad de transformarse.' },
  ],
  'fullmetal-alchemist-brotherhood': [
    { number: 1, season: 1, title: 'El alquimista de acero', videoUrl: '', thumbnail: '', duration: 1440, tags: ['canon'], synopsis: 'Los hermanos Elric intentan resucitar a su madre con alquimia. Edward pierde una pierna, Alphonse su cuerpo.' },
    { number: 2, season: 1, title: 'Cuerpo de acero', videoUrl: '', thumbnail: '', duration: 1440, tags: ['canon'], synopsis: 'Edward sacrifica su brazo para unir el alma de Alphonse a una armadura. Se convierten en alquimistas estatales.' },
    { number: 3, season: 1, title: 'La ciudad de la herejía', videoUrl: '', thumbnail: '', duration: 1440, tags: ['canon'], synopsis: 'Investigan a Cornello en Liore. Descubren la Piedra Filosofal falsa.' },
  ],
  'death-note': [
    { number: 1, season: 1, title: 'Renacimiento', videoUrl: '', thumbnail: '', duration: 1440, tags: ['canon'], synopsis: 'Light Yagami encuentra la Death Note. Prueba su poder matando a criminales. Ryuk aparece.' },
    { number: 2, season: 1, title: 'Confrontación', videoUrl: '', thumbnail: '', duration: 1440, tags: ['canon'], synopsis: 'El detective L hace su primera transmisión. Light mata a un imitador de L. Comienza el juego.' },
    { number: 3, season: 1, title: 'Trato', videoUrl: '', thumbnail: '', duration: 1440, tags: ['canon'], synopsis: 'Light conoce a la Segunda Kira (Misa). Hace un trato con Rem. L sospecha de Light.' },
  ],
  'demon-slayer': [
    { number: 1, season: 1, title: 'Crueldad', videoUrl: '', thumbnail: '', duration: 1440, tags: ['canon'], synopsis: 'Tanjiro vuelve a casa y encuentra a su familia masacrada. Solo Nezuko sobrevive, pero es un demonio.' },
    { number: 2, season: 1, title: 'Entrenador Sakonji Urokodaki', videoUrl: '', thumbnail: '', duration: 1440, tags: ['canon'], synopsis: 'Tanjiro conoce a Giyu Tomioka. Es enviado a entrenar con Urokodaki en la montaña.' },
    { number: 3, season: 1, title: 'Saburo y el demonio', videoUrl: '', thumbnail: '', duration: 1440, tags: ['canon'], synopsis: 'Tanjiro aprende la Respiración del Agua. Se prepara para la Selección Final.' },
  ],
  'jujutsu-kaisen': [
    { number: 1, season: 1, title: 'Ryomen Sukuna', videoUrl: '', thumbnail: '', duration: 1440, tags: ['canon'], synopsis: 'Yuji Itadori ingiere el dedo de Sukuna. Gojo Satoru lo recluta para Jujutsu High.' },
    { number: 2, season: 1, title: 'Por mí mismo', videoUrl: '', thumbnail: '', duration: 1440, tags: ['canon'], synopsis: 'Yuji conoce a Megumi y Nobara. Primera misión: exorcizar un útero maldito.' },
  ]
};

// Configuración de fuentes para auto-obtención
export const FETCH_SOURCES = {
  jikan: 'https://api.jikan.moe/v4',
  anilist: 'https://graphql.anilist.co',
  mal: 'https://api.myanimelist.net/v2',
  tmdb: 'https://api.themoviedb.org/3'
};

// Utilidades
export function generateId(title) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function formatDuration(seconds) {
  if (!seconds) return '--:--';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function getNextEpisodeNumber(episodes) {
  if (!episodes.length) return 1;
  return Math.max(...episodes.map(e => e.number)) + 1;
}

export function sortEpisodes(episodes) {
  return [...episodes].sort((a, b) => {
    if (a.season !== b.season) return a.season - b.season;
    return a.number - b.number;
  });
}

export function groupBySeason(episodes) {
  const grouped = {};
  episodes.forEach(ep => {
    const season = ep.season || 1;
    if (!grouped[season]) grouped[season] = [];
    grouped[season].push(ep);
  });
  return grouped;
}