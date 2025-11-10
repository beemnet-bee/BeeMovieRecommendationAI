import { GoogleGenAI } from "@google/genai";
import type { Movie } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Internal type for the raw API response to make processing more robust
interface MovieFromAPI {
  title: string;
  year: number;
  summary: string;
  genres: string[];
  tmdbPosterPath: string | null; // The unique path for the poster from TMDb
  youtubeVideoId: string | null;
}


export const getMovieRecommendations = async (prompt: string, existingTitles: string[] = []): Promise<Movie[]> => {
  try {
    const exclusionPrompt = existingTitles.length > 0 
      ? `Please exclude the following movies from the recommendations: ${existingTitles.join(', ')}.` 
      : '';

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Based on the following user request, recommend 20 movies. ${exclusionPrompt} User request: "${prompt}"`,
      config: {
        systemInstruction: "You are a movie recommendation AI. Your goal is to return a valid JSON array of movie objects. Each object must have these properties: 'title', 'year', 'summary', 'genres', 'tmdbPosterPath', and 'youtubeVideoId'. For the 'tmdbPosterPath', you must use Google Search to find the movie on 'The Movie Database (TMDb)' and return the exact value of the 'poster_path' field for that movie. It should be a string starting with a forward slash, like '/path/to/image.jpg'. If you cannot find a valid TMDb poster path, return null. For all other data, use Google Search to ensure accuracy. Respond ONLY with the JSON array, without any additional text or markdown.",
        tools: [{googleSearch: {}}],
      },
    });

    const rawResponseText = response.text;

    if (!rawResponseText || rawResponseText.trim() === '') {
        console.error("Received empty response from API. This might be due to a safety block.");
        throw new Error("The AI returned an empty response. This can happen if the search query is blocked for safety reasons. Please try a different query.");
    }
    
    const trimmedText = rawResponseText.trim();
    
    // The model might wrap the JSON in markdown or add explanatory text.
    // We'll find the start of the array '[' and the end of the array ']' to extract the JSON.
    const startIndex = trimmedText.indexOf('[');
    const endIndex = trimmedText.lastIndexOf(']');
    
    if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
        console.error("Invalid response format received from API:", trimmedText);
        throw new Error("Failed to parse movie recommendations. The AI returned an unexpected format without a valid JSON array.");
    }

    const jsonText = trimmedText.substring(startIndex, endIndex + 1);
    
    const recommendationsFromApi: MovieFromAPI[] = JSON.parse(jsonText);
    
    const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w780';

    // Map the API response to our app's Movie type.
    const recommendations: Movie[] = recommendationsFromApi.map(movie => ({
        title: movie.title,
        year: movie.year,
        summary: movie.summary,
        genres: movie.genres,
        youtubeVideoId: movie.youtubeVideoId,
        // Construct the full, reliable poster URL from the TMDb path
        posterUrl: movie.tmdbPosterPath ? `${TMDB_IMAGE_BASE_URL}${movie.tmdbPosterPath}` : '',
    }));

    return recommendations;

  } catch (error) {
    console.error("Error fetching movie recommendations:", error);
    if (error instanceof SyntaxError) {
        throw new Error("Failed to parse movie recommendations. The AI returned an invalid format.");
    }
    if (error instanceof Error) {
        throw new Error(`Failed to get recommendations from Gemini API: ${error.message}`);
    }
    throw new Error("An unknown error occurred while fetching recommendations.");
  }
};