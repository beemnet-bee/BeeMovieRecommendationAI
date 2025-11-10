
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

    const fullPrompt = `Based on the following user request, recommend 20 movies. ${exclusionPrompt} User request: "${prompt}"

Return the result as a raw JSON array of objects with the following structure: { "title": string, "year": number, "summary": string, "genres": string[], "tmdbPosterPath": string | null, "youtubeVideoId": string | null }. Do not wrap the JSON in markdown backticks or any other text.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullPrompt,
      config: {
        systemInstruction: "You are a movie recommendation AI. Your goal is to return a raw JSON array of movie objects. For each movie, use Google Search to find accurate information. For 'tmdbPosterPath', find the movie on 'The Movie Database (TMDb)' and return the exact value of the 'poster_path' field (e.g., '/path/to/image.jpg'). For 'youtubeVideoId', find the official trailer on YouTube and return only its video ID. If a value cannot be reliably found, return null for that field. Your response MUST be only the raw JSON array, without any surrounding text, markdown, or explanations.",
        tools: [{googleSearch: {}}],
      },
    });

    // Handle cases where the response might be blocked due to safety settings.
    if (!response.text && response.promptFeedback?.blockReason) {
        const { blockReason, blockReasonMessage } = response.promptFeedback;
        console.error(`API response blocked. Reason: ${blockReason}`, blockReasonMessage);
        throw new Error(`Your request was blocked for safety reasons (${blockReason}). Please try a different, more general query.`);
    }

    const rawResponseText = response.text;

    if (!rawResponseText || rawResponseText.trim() === '') {
        console.error("Received empty response from API. This could be due to a content filter or other issue.");
        throw new Error("The AI returned an empty response. This can happen if the search query is too restrictive or triggers a content filter. Please try a different query.");
    }
    
    // Clean the response to ensure it's valid JSON, as the model might still wrap it in markdown.
    const jsonMatch = rawResponseText.match(/(\[[\s\S]*\])/);
    if (!jsonMatch || jsonMatch.length < 2) {
        console.error("Invalid JSON array format from API:", rawResponseText);
        throw new Error("The AI returned data in an unexpected format that could not be parsed.");
    }
    const jsonString = jsonMatch[1];
    
    const recommendationsFromApi: MovieFromAPI[] = JSON.parse(jsonString);
    
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
        throw new Error("Failed to parse movie recommendations. The AI returned an invalid JSON format.");
    }
    if (error instanceof Error) {
        // Pass our custom errors or Gemini API errors through directly
        throw error;
    }
    throw new Error("An unknown error occurred while fetching recommendations.");
  }
};