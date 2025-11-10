import { GoogleGenAI } from "@google/genai";
import type { Movie } from '../types';

// Initialize the Google AI client with the API key from the environment
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

// The structure we're asking the AI to return
interface GeminiResponse {
  recommendations: MovieFromAPI[];
}

export const getMovieRecommendations = async (prompt: string, existingTitles: string[] = []): Promise<Movie[]> => {
  try {
    const exclusionPrompt = existingTitles.length > 0
      ? `Please exclude the following movies from the recommendations: ${existingTitles.join(', ')}.`
      : '';

    // A detailed prompt instructing the AI to use its tools to find accurate data and return a clean JSON object.
    const fullPrompt = `
      You are a movie recommendation AI. Your goal is to return a raw JSON object.
      The object must have a single key "recommendations" which is an array of movie objects.
      For each movie, leverage Google Search to find the most accurate and up-to-date information.
      
      For the 'tmdbPosterPath', search 'The Movie Database (TMDb)' for the movie and return the exact value of the 'poster_path' field (e.g., '/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg').
      For 'youtubeVideoId', search YouTube for the movie's official trailer and return only its video ID (e.g., 'dQw4w9WgXcQ').
      If a value cannot be reliably found for any field, you MUST return null for that specific field.
      Your response MUST be only the raw JSON object, without any surrounding text, markdown code blocks (like \`\`\`json), or explanations.

      Based on the following user request, recommend 20 movies. ${exclusionPrompt}
      User request: "${prompt}"
    `;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: fullPrompt,
        config: {
          tools: [{googleSearch: {}}],
        },
    });

    // --- Error Handling and Response Validation ---

    // Check for safety blocks or other reasons for no response
    if (response.candidates?.[0]?.finishReason && response.candidates[0].finishReason !== 'STOP') {
        const reason = response.candidates[0].finishReason;
        const blockReason = response.promptFeedback?.blockReason;
        throw new Error(`The AI response was stopped. Reason: ${reason}${blockReason ? ` (${blockReason})` : ''}. Please adjust your query.`);
    }

    const rawResponseText = response.text;
    if (!rawResponseText || rawResponseText.trim() === '') {
        console.error("Received empty response from API. This might be due to a safety block.", response.promptFeedback);
        throw new Error("The AI returned an empty response. This can happen if the search query is blocked for safety reasons. Please try a different query.");
    }

    // --- JSON Parsing and Sanitization ---
    
    // Clean the raw text response to ensure it's valid JSON
    let cleanedJsonString = rawResponseText.trim();
    if (cleanedJsonString.startsWith('```json')) {
      cleanedJsonString = cleanedJsonString.substring(7, cleanedJsonString.length - 3).trim();
    } else if (cleanedJsonString.startsWith('```')) {
      cleanedJsonString = cleanedJsonString.substring(3, cleanedJsonString.length - 3).trim();
    }
    
    const parsedJson: GeminiResponse = JSON.parse(cleanedJsonString);
    const recommendationsFromApi: MovieFromAPI[] = parsedJson.recommendations;
    
    if (!recommendationsFromApi || !Array.isArray(recommendationsFromApi)) {
       console.error("Invalid JSON structure from API:", cleanedJsonString);
       throw new Error("The AI returned data in an unexpected format that could not be parsed.");
    }

    // --- Data Transformation ---

    const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w780';

    // Map the API response to our app's Movie type, with defensive checks.
    const recommendations: Movie[] = recommendationsFromApi
        .filter(movie => movie && typeof movie === 'object' && movie.title) // Ensure movie is a valid object with a title
        .map(movie => ({
            title: movie.title,
            year: movie.year || new Date().getFullYear(), // Default to current year if missing
            summary: movie.summary || 'No summary available.',
            genres: Array.isArray(movie.genres) ? movie.genres : [], // IMPORTANT: Ensure genres is always an array
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
        // Pass our custom errors or API errors through directly
        throw error;
    }
    throw new Error("An unknown error occurred while fetching recommendations.");
  }
};
