
import type { Movie } from '../types';
import { staticMovies } from '../data/staticMovies';

const MOVIES_PER_PAGE = 20;

// Helper to simulate network latency for a better user experience
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Simulates fetching movie recommendations by searching a static list of movies.
 * @param prompt The user's search query.
 * @param existingTitles A list of titles to exclude from the results.
 * @returns A promise that resolves to an array of Movie objects.
 */
export const getMovieRecommendations = async (prompt: string, existingTitles: string[] = []): Promise<Movie[]> => {
  // Simulate API loading time to provide a smoother UX
  await sleep(500);

  const query = prompt.toLowerCase().trim();

  try {
    const allMatches = staticMovies.filter(movie => {
      // Handle category searches like "Action movies" or "Popular movies"
      if (query.endsWith(' movies')) {
        const category = query.replace(' movies', '').toLowerCase();
        if (category === 'popular') {
          // For 'popular', return all movies initially, sorted by year descending
          return true;
        }
        return movie.genres.some(g => g.toLowerCase() === category);
      }

      // Handle general search queries against title, summary, and genres
      const titleMatch = movie.title.toLowerCase().includes(query);
      const summaryMatch = movie.summary.toLowerCase().includes(query);
      const genreMatch = movie.genres.some(g => g.toLowerCase().includes(query));

      return titleMatch || summaryMatch || genreMatch;
    });

    // For "Popular" category, sort by most recent year
    if (query === 'popular movies') {
        allMatches.sort((a, b) => b.year - a.year);
    }

    // Filter out movies that are already being displayed on the screen
    const newResults = allMatches.filter(movie => !existingTitles.includes(movie.title));

    // Return the next "page" of results
    return newResults.slice(0, MOVIES_PER_PAGE);

  } catch (error) {
    console.error("Error searching for movies:", error);
    // While unlikely with a static list, this provides a fallback.
    throw new Error("An unknown error occurred while searching for movies.");
  }
};
