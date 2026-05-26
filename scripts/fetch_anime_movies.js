const fs = require('fs');
const path = require('path');
const https = require('https');

const YOUTUBE_API_KEY = 'AIzaSyBiEkLi9koBFz3HpBCgeIfcJvjDnA-ZXDs';

// Diccionario de animes y sus películas reales (muestra extensiva para las franquicias de TOP_50_ANIMES)
const ANIME_MOVIES_DB = {
  1: { name: 'Dragon Ball', movies: ['Dragon Ball Z: La Batalla de los Dioses', 'Dragon Ball Z: La Resurrección de F', 'Dragon Ball Super: Broly', 'Dragon Ball Super: Super Hero', 'Dragon Ball Z: El ataque del dragón'] },
  2: { name: 'Naruto', movies: ['Naruto: El Rescate de la Princesa de la Nieve', 'Naruto Shippuden: Kizuna', 'Naruto Shippuden: The Lost Tower', 'Road to Ninja: Naruto the Movie', 'The Last: Naruto the Movie'] },
  3: { name: 'One Piece', movies: ['One Piece Film: Strong World', 'One Piece Film: Z', 'One Piece Film: Gold', 'One Piece: Stampede', 'One Piece Film: Red'] },
  4: { name: 'Attack on Titan', movies: ['Shingeki no Kyojin: Guren no Yumiya', 'Shingeki no Kyojin: Jiyuu no Tsubasa', 'Shingeki no Kyojin: Kakusei no Houkou'] },
  5: { name: 'Death Note', movies: ['Death Note Relight 1: Visions of a God', 'Death Note Relight 2: L\'s Successors'] },
  6: { name: 'Fullmetal Alchemist', movies: ['Fullmetal Alchemist: Conquistador de Shamballa', 'Fullmetal Alchemist: La Estrella Sagrada de Milos'] },
  7: { name: 'Demon Slayer', movies: ['Kimetsu no Yaiba: Mugen Ressha-hen', 'Kimetsu no Yaiba: Rumbo a la Aldea de los Herreros', 'Kimetsu no Yaiba: Rumbo al Entrenamiento de los Pilares'] },
  8: { name: 'Hunter x Hunter', movies: ['Hunter x Hunter: Phantom Rouge', 'Hunter x Hunter: The Last Mission'] },
  9: { name: 'Bleach', movies: ['Bleach: Memories of Nobody', 'Bleach: The DiamondDust Rebellion', 'Bleach: Fade to Black', 'Bleach: Hell Verse'] },
  10: { name: 'My Hero Academia', movies: ['Boku no Hero Academia: Two Heroes', 'Boku no Hero Academia: Heroes Rising', 'Boku no Hero Academia: World Heroes\' Mission', 'Boku no Hero Academia: You\'re Next'] },
  11: { name: 'Jujutsu Kaisen', movies: ['Jujutsu Kaisen 0'] },
  12: { name: 'Sword Art Online', movies: ['Sword Art Online: Extra Edition', 'Sword Art Online: Ordinal Scale'] },
  13: { name: 'Evangelion', movies: ['Evangelion: 1.0 You Are (Not) Alone', 'Evangelion: 2.0 You Can (Not) Advance', 'Evangelion: 3.0 You Can (Not) Redo', 'Evangelion: 3.0+1.0 Thrice Upon a Time', 'The End of Evangelion'] },
  14: { name: 'Spirited Away', movies: ['El viaje de Chihiro'] },
  15: { name: 'Your Name', movies: ['Kimi no Na wa (Your Name)'] },
  16: { name: 'Cowboy Bebop', movies: ['Cowboy Bebop: Llamando a las puertas del cielo'] },
  17: { name: 'Ghost in the Shell', movies: ['Ghost in the Shell (1995)', 'Ghost in the Shell 2: Innocence'] },
  18: { name: 'Princess Mononoke', movies: ['La Princesa Mononoke'] },
  19: { name: 'Akira', movies: ['Akira (1988)'] },
  20: { name: 'JoJo Bizarre Adventure', movies: ['JoJo\'s Bizarre Adventure: Phantom Blood (Pelicula)'] },
  21: { name: 'One Punch Man', movies: ['One Punch Man: Road to Hero'] },
  22: { name: 'Code Geass', movies: ['Code Geass: Lelouch of the Resurrection', 'Code Geass: Akito the Exiled'] },
  23: { name: 'Steins;Gate', movies: ['Steins;Gate: Fuka Ryouiki no Déjà vu'] },
  24: { name: 'Re:Zero', movies: ['Re:Zero Memory Snow', 'Re:Zero Hyouketsu no Kizuna'] },
  25: { name: 'Tokyo Ghoul', movies: ['Tokyo Ghoul: Pinto', 'Tokyo Ghoul: Jack'] },
  26: { name: 'Fairy Tail', movies: ['Fairy Tail: Houou no Miko', 'Fairy Tail: Dragon Cry'] },
  27: { name: 'Mob Psycho 100', movies: ['Mob Psycho 100 Reigen: Shirarezaru Kiseki no Reinouryokusha'] },
  28: { name: 'Chainsaw Man', movies: ['Chainsaw Man: Película (Próximamente)'] },
  29: { name: 'Vinland Saga', movies: ['Vinland Saga Recap Movie'] },
  30: { name: 'Berserk', movies: ['Berserk: El Huevo del Rey Conquistador', 'Berserk: La Batalla de Doldrey', 'Berserk: El Advenimiento'] },
  31: { name: 'Overlord', movies: ['Overlord: The Undead King', 'Overlord: The Dark Warrior', 'Overlord: Sei Oukoku-hen'] },
  32: { name: 'Black Clover', movies: ['Black Clover: La espada del rey mago'] },
  33: { name: 'Haikyuu', movies: ['Haikyuu!!: Owari to Hajimari', 'Haikyuu!!: Shousha to Haisha', 'Haikyuu!!: Gomisuteba no Kessen'] },
  34: { name: 'Slam Dunk', movies: ['The First Slam Dunk', 'Slam Dunk: Película 1', 'Slam Dunk: Película 2'] },
  35: { name: 'Blue Lock', movies: ['Blue Lock: Episode Nagi'] },
  36: { name: 'Inuyasha', movies: ['Inuyasha: El amor a través del tiempo', 'Inuyasha: El castillo de los sueños', 'Inuyasha: La espada conquistadora', 'Inuyasha: Fuego en la isla mística'] },
  37: { name: 'Yu Yu Hakusho', movies: ['Yu Yu Hakusho: The Movie', 'Yu Yu Hakusho: Poltergeist Report'] },
  38: { name: 'Sailor Moon', movies: ['Sailor Moon R: The Movie', 'Sailor Moon S: The Movie', 'Sailor Moon SuperS: The Movie', 'Sailor Moon Cosmos'] },
  39: { name: 'Hellsing', movies: ['Hellsing Ultimate OVA'] },
  40: { name: 'Trigun', movies: ['Trigun: Badlands Rumble'] },
  41: { name: 'Pokémon', movies: ['Pokémon: Mewtwo vs. Mew', 'Pokémon: El poder de uno', 'Pokémon: El hechizo de los Unown', 'Pokémon: Lucario y el misterio de Mew'] },
  42: { name: 'Digimon', movies: ['Digimon Adventure: La película', 'Digimon Adventure: Nuestro juego de guerra', 'Digimon Adventure tri.', 'Digimon Adventure: Last Evolution Kizuna'] },
  43: { name: 'Cardcaptor Sakura', movies: ['Cardcaptor Sakura: La película', 'Cardcaptor Sakura: La carta sellada'] },
  44: { name: 'Doraemon', movies: ['Doraemon: Stand by Me', 'Doraemon: Stand by Me 2'] },
  45: { name: 'Detective Conan', movies: ['Detective Conan: El rascacielos del tiempo', 'Detective Conan: La decimocuarta víctima', 'Detective Conan: El último mago del siglo'] },
  46: { name: 'Dragon Ball Super', movies: ['Dragon Ball Super: Broly', 'Dragon Ball Super: Super Hero'] },
  47: { name: 'Sword Art Online Alicization', movies: ['Sword Art Online: Alicization - War of Underworld Recap'] },
  48: { name: 'Gurren Lagann', movies: ['Gurren Lagann: Gurren-hen', 'Gurren Lagann: Lagann-hen'] },
  49: { name: 'Toradora', movies: ['Toradora! Bento Battle (OVA)'] },
  50: { name: 'Sword Art Online Progressive', movies: ['Sword Art Online Progressive: Aria of a Starless Night', 'Sword Art Online Progressive: Scherzo of Deep Night'] },
};

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(null); }
      });
    }).on('error', reject);
  });
}

async function searchYouTube(title) {
  const query = encodeURIComponent(`${title} pelicula completa español`);
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&videoDuration=long&maxResults=1&relevanceLanguage=es&key=${YOUTUBE_API_KEY}`;
  const data = await fetchJSON(url);
  
  if (data && data.items && data.items.length > 0) {
    const item = data.items[0];
    return {
      youtubeId: item.id.videoId,
      archiveId: null,
      poster: item.snippet.thumbnails.high ? item.snippet.thumbnails.high.url : item.snippet.thumbnails.medium.url
    };
  }
  return null;
}

async function searchArchive(title) {
  const query = encodeURIComponent(`title:("${title}") AND mediatype:movies`);
  const url = `https://archive.org/advancedsearch.php?q=${query}&fl[]=identifier&output=json&rows=1`;
  const data = await fetchJSON(url);
  
  if (data && data.response && data.response.docs && data.response.docs.length > 0) {
    return {
      youtubeId: null,
      archiveId: data.response.docs[0].identifier,
      poster: `https://archive.org/services/img/${data.response.docs[0].identifier}`
    };
  }
  return null;
}

async function main() {
  console.log('Iniciando búsqueda de películas reales de anime...');
  const results = {};

  for (const rank in ANIME_MOVIES_DB) {
    const anime = ANIME_MOVIES_DB[rank];
    console.log(`Procesando #${rank} - ${anime.name}...`);
    results[rank] = [];

    for (const movieTitle of anime.movies) {
      console.log(`  Buscando: ${movieTitle}`);
      
      let videoData = await searchYouTube(movieTitle);
      
      if (!videoData) {
        console.log(`    No encontrado en YouTube. Buscando en Archive.org...`);
        videoData = await searchArchive(movieTitle);
      }

      if (videoData) {
        results[rank].push({
          title: movieTitle,
          youtubeId: videoData.youtubeId,
          archiveId: videoData.archiveId,
          poster: videoData.poster || `https://picsum.photos/seed/${encodeURIComponent(movieTitle)}/300/450`
        });
        console.log(`    ✅ Encontrado: ${videoData.youtubeId ? 'YouTube' : 'Archive.org'}`);
      } else {
        // Fallback genérico si no se encuentra en ninguna API, para que la app no quede vacía.
        results[rank].push({
          title: movieTitle,
          youtubeId: "dQw4w9WgXcQ", // Placeholder de rickroll si falla completamente
          archiveId: null,
          poster: `https://picsum.photos/seed/${encodeURIComponent(movieTitle)}/300/450`
        });
        console.log(`    ❌ No encontrado. Usando placeholder.`);
      }
      
      // Delay to avoid hitting rate limits
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  const outputPath = path.join(__dirname, '..', 'public', 'p', 'anime-movies-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n¡Búsqueda completada! Datos guardados en: ${outputPath}`);
}

main().catch(console.error);
