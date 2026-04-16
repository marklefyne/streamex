export interface MediaItem {
  id: string;
  title: string;
  year: number;
  type: "Movie" | "TV Series" | "Documentary" | "Anime";
  rating: number;
  genres: string[];
  description: string;
  posterGradient: string;
  posterImage?: string;
  runtime?: string;
  seasons?: number;
  tmdb_id: number;
}

export const heroMedia: MediaItem = {
  id: "hero-1",
  title: "Dune: Part Two",
  year: 2024,
  type: "Movie",
  rating: 8.5,
  genres: ["Sci-Fi", "Adventure", "Drama"],
  description:
    "Paul Atreides unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the known universe, he endeavors to prevent a terrible future.",
  posterGradient: "from-amber-900 via-orange-900 to-slate-900",
  posterImage: "/streamex/hero-poster.png",
  runtime: "2h 46m",
  tmdb_id: 438631,
};

export const trendingNow: MediaItem[] = [
  {
    id: "t-1",
    title: "Severance",
    year: 2025,
    type: "TV Series",
    rating: 8.7,
    genres: ["Thriller", "Sci-Fi"],
    description: "Mark leads a team whose memories are surgically divided between work and personal lives.",
    posterGradient: "from-cyan-800 via-blue-900 to-slate-900",
    seasons: 2,
    tmdb_id: 92749,
  },
  {
    id: "t-2",
    title: "Nosferatu",
    year: 2024,
    type: "Movie",
    rating: 7.5,
    genres: ["Horror", "Mystery"],
    description: "A gothic tale of obsession between a haunted woman and a terrifying vampire.",
    posterGradient: "from-red-900 via-rose-900 to-slate-900",
    runtime: "2h 12m",
    tmdb_id: 614933,
  },
  {
    id: "t-3",
    title: "Fast X",
    year: 2023,
    type: "Movie",
    rating: 7.2,
    genres: ["Action", "Crime"],
    description: "Dom Toretto and his family are targeted by the vengeful son of drug kingpin Hernan Reyes.",
    posterGradient: "from-amber-800 via-orange-900 to-slate-900",
    runtime: "2h 21m",
    tmdb_id: 447365,
  },
  {
    id: "t-4",
    title: "Shogun",
    year: 2024,
    type: "TV Series",
    rating: 8.6,
    genres: ["Drama", "War"],
    description: "An English navigator becomes entangled in the political machinations of feudal Japan.",
    posterGradient: "from-emerald-800 via-teal-900 to-slate-900",
    seasons: 1,
    tmdb_id: 139537,
  },
  {
    id: "t-5",
    title: "The Prestige",
    year: 2006,
    type: "Movie",
    rating: 8.5,
    genres: ["Drama", "Mystery"],
    description: "Two rival magicians engage in a bitter battle for supremacy.",
    posterGradient: "from-violet-800 via-purple-900 to-slate-900",
    runtime: "2h 10m",
    tmdb_id: 11324,
  },
  {
    id: "t-6",
    title: "The Revenant",
    year: 2015,
    type: "Movie",
    rating: 7.8,
    genres: ["Action", "Drama"],
    description: "A frontiersman fights for survival after being left for dead in the wilderness.",
    posterGradient: "from-sky-800 via-cyan-900 to-slate-900",
    runtime: "2h 36m",
    tmdb_id: 281957,
  },
  {
    id: "t-7",
    title: "Your Name",
    year: 2016,
    type: "Anime",
    rating: 8.6,
    genres: ["Romance", "Animation"],
    description: "Two teenagers discover they are magically swapping bodies across time and space.",
    posterGradient: "from-pink-800 via-fuchsia-900 to-slate-900",
    seasons: 1,
    tmdb_id: 372058,
  },
  {
    id: "t-8",
    title: "Slow Horses",
    year: 2024,
    type: "TV Series",
    rating: 8.1,
    genres: ["Action", "Spy"],
    description: "MI5 agents relegated to a dumping ground department get a second chance.",
    posterGradient: "from-gray-700 via-zinc-800 to-slate-900",
    seasons: 4,
    tmdb_id: 119051,
  },
  {
    id: "t-9",
    title: "Everything Everywhere All at Once",
    year: 2022,
    type: "Movie",
    rating: 7.8,
    genres: ["Action", "Comedy", "Sci-Fi"],
    description: "An aging Chinese immigrant is swept up in an insane adventure where she can access the powers of her parallel universe selves.",
    posterGradient: "from-lime-800 via-green-900 to-slate-900",
    runtime: "2h 19m",
    tmdb_id: 545611,
  },
  {
    id: "t-10",
    title: "Blade Runner 2049",
    year: 2017,
    type: "Movie",
    rating: 7.5,
    genres: ["Sci-Fi", "Drama"],
    description: "A young blade runner discovers a long-buried secret that leads him to track down a former blade runner.",
    posterGradient: "from-fuchsia-800 via-pink-900 to-slate-900",
    runtime: "2h 44m",
    tmdb_id: 335984,
  },
];

export const topRated: MediaItem[] = [
  {
    id: "tr-1",
    title: "The Shawshank Redemption",
    year: 1994,
    type: "Movie",
    rating: 8.7,
    genres: ["Drama"],
    description: "A banker convicted of uxoricide forms a transformative friendship with a fellow inmate.",
    posterGradient: "from-amber-900 via-yellow-900 to-stone-900",
    runtime: "2h 22m",
    tmdb_id: 278,
  },
  {
    id: "tr-2",
    title: "Breaking Bad",
    year: 2008,
    type: "TV Series",
    rating: 8.9,
    genres: ["Crime", "Drama", "Thriller"],
    description: "A chemistry teacher turned methamphetamine manufacturer partners with a former student.",
    posterGradient: "from-orange-800 via-amber-900 to-stone-900",
    seasons: 5,
    tmdb_id: 1396,
  },
  {
    id: "tr-3",
    title: "The Dark Knight",
    year: 2008,
    type: "Movie",
    rating: 8.5,
    genres: ["Action", "Crime", "Drama"],
    description: "Batman faces the Joker, a criminal mastermind who seeks to plunge Gotham into anarchy.",
    posterGradient: "from-indigo-800 via-blue-900 to-stone-900",
    runtime: "2h 32m",
    tmdb_id: 155,
  },
  {
    id: "tr-4",
    title: "Whiplash",
    year: 2014,
    type: "Movie",
    rating: 8.5,
    genres: ["Drama", "Music"],
    description: "A promising young drummer pushes himself to the limit under an abusive instructor.",
    posterGradient: "from-slate-700 via-gray-800 to-neutral-900",
    runtime: "1h 46m",
    tmdb_id: 244786,
  },
  {
    id: "tr-5",
    title: "Parasite",
    year: 2019,
    type: "Movie",
    rating: 8.5,
    genres: ["Comedy", "Drama", "Thriller"],
    description: "Greed and class discrimination threaten a symbiotic relationship between a wealthy family and a destitute clan.",
    posterGradient: "from-yellow-800 via-orange-900 to-stone-900",
    runtime: "2h 12m",
    tmdb_id: 496243,
  },
  {
    id: "tr-6",
    title: "Mr. Robot",
    year: 2015,
    type: "TV Series",
    rating: 8.2,
    genres: ["Crime", "Drama", "Thriller"],
    description: "A young programmer with social anxiety disorder hacks into corporations.",
    posterGradient: "from-green-800 via-emerald-900 to-stone-900",
    seasons: 4,
    tmdb_id: 62560,
  },
  {
    id: "tr-7",
    title: "Interstellar",
    year: 2014,
    type: "Movie",
    rating: 8.4,
    genres: ["Adventure", "Drama", "Sci-Fi"],
    description: "A team of explorers travel through a wormhole in space to ensure humanity's survival.",
    posterGradient: "from-rose-800 via-red-900 to-stone-900",
    runtime: "2h 49m",
    tmdb_id: 157336,
  },
  {
    id: "tr-8",
    title: "Oppenheimer",
    year: 2023,
    type: "Movie",
    rating: 8.3,
    genres: ["Drama", "History"],
    description: "The story of American scientist J. Robert Oppenheimer and his role in developing the atomic bomb.",
    posterGradient: "from-blue-900 via-slate-900 to-black",
    runtime: "3h 0m",
    tmdb_id: 872585,
  },
  {
    id: "tr-9",
    title: "Spirited Away",
    year: 2001,
    type: "Anime",
    rating: 8.6,
    genres: ["Animation", "Adventure", "Family"],
    description: "A young girl enters a world ruled by gods, witches, and spirits.",
    posterGradient: "from-pink-700 via-rose-800 to-stone-900",
    seasons: 1,
    tmdb_id: 129,
  },
  {
    id: "tr-10",
    title: "Gladiator",
    year: 2000,
    type: "Movie",
    rating: 8.0,
    genres: ["Action", "Drama"],
    description: "A former Roman General sets out to exact vengeance against the corrupt emperor who murdered his family.",
    posterGradient: "from-stone-700 via-zinc-800 to-neutral-900",
    runtime: "2h 35m",
    tmdb_id: 98,
  },
];

export const newReleases: MediaItem[] = [
  {
    id: "nr-1",
    title: "Mission: Impossible - The Final Reckoning",
    year: 2025,
    type: "Movie",
    rating: 7.6,
    genres: ["Action", "Adventure", "Thriller"],
    description: "Ethan Hunt and his IMF team must track down a terrifying new weapon that threatens all of humanity.",
    posterGradient: "from-red-700 via-orange-800 to-slate-900",
    runtime: "2h 49m",
    tmdb_id: 298618,
  },
  {
    id: "nr-2",
    title: "The White Lotus",
    year: 2025,
    type: "TV Series",
    rating: 7.8,
    genres: ["Comedy", "Drama"],
    description: "Guests at a luxurious tropical resort face dark secrets and unexpected twists.",
    posterGradient: "from-teal-700 via-cyan-800 to-slate-900",
    seasons: 3,
    tmdb_id: 92282,
  },
  {
    id: "nr-3",
    title: "Conclave",
    year: 2024,
    type: "Movie",
    rating: 7.9,
    genres: ["Drama", "Mystery", "Thriller"],
    description: "Cardinals locked in the Vatican must choose a new Pope after the sudden death of the previous one.",
    posterGradient: "from-slate-600 via-gray-700 to-neutral-800",
    runtime: "2h 0m",
    tmdb_id: 840430,
  },
  {
    id: "nr-4",
    title: "Demon Slayer: Infinity Castle",
    year: 2025,
    type: "Anime",
    rating: 8.3,
    genres: ["Animation", "Action", "Fantasy"],
    description: "Tanjiro and his companions face their most powerful enemy in the Infinity Castle.",
    posterGradient: "from-violet-700 via-purple-800 to-slate-900",
    seasons: 1,
    tmdb_id: 1013793,
  },
  {
    id: "nr-5",
    title: "A Complete Unknown",
    year: 2024,
    type: "Movie",
    rating: 7.5,
    genres: ["Biography", "Drama", "Music"],
    description: "The story of a young Bob Dylan emerging in the 1960s New York music scene.",
    posterGradient: "from-amber-700 via-yellow-800 to-slate-900",
    runtime: "2h 21m",
    tmdb_id: 872585,
  },
  {
    id: "nr-6",
    title: "Flow",
    year: 2024,
    type: "Anime",
    rating: 8.2,
    genres: ["Animation", "Adventure"],
    description: "A black cat navigates a flooded world alongside a band of animals on a sailboat.",
    posterGradient: "from-sky-700 via-blue-800 to-slate-900",
    runtime: "1h 25m",
    tmdb_id: 1012731,
  },
  {
    id: "nr-7",
    title: "Black Mirror",
    year: 2025,
    type: "TV Series",
    rating: 7.4,
    genres: ["Drama", "Sci-Fi", "Thriller"],
    description: "An anthology series exploring a twisted high-tech multiverse where humanity's innovations and darkest instincts collide.",
    posterGradient: "from-emerald-700 via-green-800 to-slate-900",
    seasons: 7,
    tmdb_id: 42083,
  },
  {
    id: "nr-8",
    title: "The Monkey",
    year: 2025,
    type: "Movie",
    rating: 6.6,
    genres: ["Horror", "Mystery", "Thriller"],
    description: "Twin brothers face a cursed toy monkey that brings death to anyone nearby.",
    posterGradient: "from-zinc-700 via-neutral-800 to-stone-900",
    runtime: "1h 38m",
    tmdb_id: 945610,
  },
  {
    id: "nr-9",
    title: "Mickey 17",
    year: 2025,
    type: "Movie",
    rating: 7.3,
    genres: ["Comedy", "Drama", "Sci-Fi"],
    description: "An expendable employee on a human expedition to colonize a distant planet.",
    posterGradient: "from-orange-700 via-red-800 to-slate-900",
    runtime: "2h 17m",
    tmdb_id: 653346,
  },
  {
    id: "nr-10",
    title: "Sinners",
    year: 2025,
    type: "Movie",
    rating: 7.5,
    genres: ["Action", "Drama", "Horror"],
    description: "Twin brothers return to their hometown in 1930s Mississippi, only to face a supernatural threat.",
    posterGradient: "from-yellow-700 via-amber-800 to-slate-900",
    runtime: "2h 17m",
    tmdb_id: 933260,
  },
];

export const allMedia: MediaItem[] = [
  heroMedia,
  ...trendingNow,
  ...topRated,
  ...newReleases,
];

export function searchMedia(query: string): MediaItem[] {
  const lower = query.toLowerCase();
  return allMedia.filter(
    (item) =>
      item.title.toLowerCase().includes(lower) ||
      item.genres.some((g) => g.toLowerCase().includes(lower)) ||
      item.type.toLowerCase().includes(lower) ||
      item.description.toLowerCase().includes(lower)
  );
}

/** Build an embed URL for a given media item and server. */
export function getEmbedUrl(
  tmdbId: number,
  mediaType: "movie" | "tv",
  serverId: string,
  season?: number,
  episode?: number
): string {
  const s = season ?? 1;
  const e = episode ?? 1;

  switch (serverId) {
    case "vidsrc":
      return mediaType === "movie"
        ? `https://vidsrc.to/embed/movie/${tmdbId}`
        : `https://vidsrc.to/embed/tv/${tmdbId}/${s}/${e}`;
    case "vidsrc2":
      return mediaType === "movie"
        ? `https://vidsrc.cc/v2/embed/movie/${tmdbId}`
        : `https://vidsrc.cc/v2/embed/tv/${tmdbId}/${s}/${e}`;
    case "autoembed":
      return mediaType === "movie"
        ? `https://player.autoembed.cc/embed/movie/${tmdbId}`
        : `https://player.autoembed.cc/embed/tv/${tmdbId}/${s}/${e}`;
    case "movieapi":
      return mediaType === "movie"
        ? `https://moviesapi.club/movie/${tmdbId}`
        : `https://moviesapi.club/tv/${tmdbId}-${s}-${e}`;
    case "vidsrcxyz":
      return mediaType === "movie"
        ? `https://vidsrc.xyz/embed/movie/${tmdbId}`
        : `https://vidsrc.xyz/embed/tv/${tmdbId}/${s}/${e}`;
    case "embedsu":
      return mediaType === "movie"
        ? `https://embed.su/embed/movie/${tmdbId}`
        : `https://embed.su/embed/tv/${tmdbId}/${s}/${e}`;
    default:
      return mediaType === "movie"
        ? `https://vidsrc.to/embed/movie/${tmdbId}`
        : `https://vidsrc.to/embed/tv/${tmdbId}/${s}/${e}`;
  }
}

export interface ServerOption {
  id: string;
  name: string;
  description: string;
}

export const SERVERS: ServerOption[] = [
  { id: "vidsrc", name: "Server 1", description: "VidSrc" },
  { id: "vidsrc2", name: "Server 2", description: "VidSrc CC" },
  { id: "autoembed", name: "Server 3", description: "AutoEmbed" },
  { id: "movieapi", name: "Server 4", description: "MoviesAPI" },
  { id: "vidsrcxyz", name: "Server 5", description: "VidSrc XYZ" },
  { id: "embedsu", name: "Server 6", description: "Embed.su" },
];
