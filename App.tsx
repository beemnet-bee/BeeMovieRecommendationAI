import React, { useState, useRef, useEffect, lazy, Suspense } from 'react';
import type { Movie } from './types';
import { getMovieRecommendations } from './services/geminiService';
import { SearchBar } from './components/SearchBar';
import { MovieCard } from './components/MovieCard';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorDisplay } from './components/ErrorDisplay';
import { HeroSection } from './components/HeroSection';
import { Categories } from './components/Categories';

const TrailerModal = lazy(() => import('./components/TrailerModal').then(module => ({ default: module.TrailerModal })));

const App: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isShowingMore, setIsShowingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [currentQuery, setCurrentQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('Popular');
  const [selectedTrailerId, setSelectedTrailerId] = useState<string | null>(null);

  // State for "Find Similar" feature
  const [similarMovies, setSimilarMovies] = useState<Movie[]>([]);
  const [isLoadingSimilar, setIsLoadingSimilar] = useState<boolean>(false);
  const [similarMoviesError, setSimilarMoviesError] = useState<string | null>(null);
  const [originalQueryTitle, setOriginalQueryTitle] = useState<string | null>(null);


  const resultsRef = useRef<HTMLDivElement>(null);

  // Initial Load Effect
  useEffect(() => {
    handleCategorySelect('Popular');
  }, []);


  // Fast thumbnail prefetching
  useEffect(() => {
    // Prefetch images when the movie list changes to ensure they are cached.
    movies.forEach(movie => {
      if (movie.posterUrl) {
        const img = new Image();
        img.src = movie.posterUrl;
      }
    });
  }, [movies]);

  // Cursor spotlight effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);


  const handleSearch = async (query: string) => {
    setIsLoading(true);
    setError(null);
    setMovies([]);
    setSimilarMovies([]); // Clear similar movies on new search
    setOriginalQueryTitle(null);
    setSimilarMoviesError(null);
    setHasSearched(true);
    setCurrentQuery(query);

    // Don't scroll on the very first load
    if (movies.length > 0) {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    
    try {
      const results = await getMovieRecommendations(query);
      setMovies(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategorySelect = (category: string) => {
    setActiveCategory(category);
    const query = category === 'Popular' ? 'popular movies' : `${category} movies`;
    handleSearch(query);
  };

  const handleShowMore = async () => {
    if (!currentQuery) return;

    setIsShowingMore(true);
    setError(null);
    try {
      const existingTitles = movies.map(movie => movie.title);
      const results = await getMovieRecommendations(currentQuery, existingTitles);
      setMovies(prevMovies => [...prevMovies, ...results]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsShowingMore(false);
    }
  };

  const handleFindSimilar = async (movie: Movie) => {
    setIsLoadingSimilar(true);
    setSimilarMoviesError(null);
    setSimilarMovies([]);
    setOriginalQueryTitle(movie.title);

    // Use a timeout to allow the UI to update before scrolling
    setTimeout(() => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth'
      });
    }, 100);

    try {
        const prompt = `Find movies that are similar in tone, genre, and style to "${movie.title}". The movie is described as: "${movie.summary}" and its genres are ${movie.genres.join(', ')}.`;
        const existingTitles = [...movies.map(m => m.title), ...similarMovies.map(m => m.title), movie.title];
        const results = await getMovieRecommendations(prompt, existingTitles);
        setSimilarMovies(results);
    } catch (err) {
        setSimilarMoviesError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
        setIsLoadingSimilar(false);
    }
  };

  const handleOpenTrailer = (videoId: string) => {
    setSelectedTrailerId(videoId);
  };

  const handleCloseTrailer = () => {
    setSelectedTrailerId(null);
  };

  const renderContent = () => {
    if (isLoading) {
      return <LoadingSpinner />;
    }
    if (error && movies.length === 0) {
      return <div className="max-w-2xl mx-auto"><ErrorDisplay message={error} /></div>;
    }
    if (movies.length > 0) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
          {movies.map((movie, index) => (
            <MovieCard 
              key={`${movie.title}-${index}`} 
              movie={movie} 
              index={index}
              onWatchTrailer={handleOpenTrailer}
              onFindSimilar={handleFindSimilar}
            />
          ))}
        </div>
      );
    }
    if (hasSearched) {
      return (
        <div className="text-center text-slate-400 animate-fade-in py-16">
          <p className="text-lg">No movies found. Try a different search!</p>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <div className="relative min-h-screen bg-black text-white flex flex-col items-center p-4 sm:p-6 md:p-8 overflow-hidden">
        {/* Film grain overlay */}
        <div className="film-grain fixed inset-0 w-full h-full pointer-events-none z-50"></div>
        {/* Animated Aurora Background */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-black via-slate-800/30 to-black animate-aurora bg-[size:400%_400%] pointer-events-none"></div>

        <header className="fixed top-0 left-0 right-0 z-20 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <SearchBar onSearch={handleSearch} isLoading={isLoading || isShowingMore} initialQuery={''} />
          </div>
        </header>

        <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col gap-8 pt-28 [perspective:2000px]">
          {hasSearched ? (
            <Categories activeCategory={activeCategory} onSelectCategory={handleCategorySelect} />
          ) : (
            // This is shown very briefly before the initial load kicks in
            <HeroSection onExampleClick={handleSearch} />
          )}

          <main ref={resultsRef} className="flex-grow flex flex-col justify-center min-h-[50vh]">
              {renderContent()}
          </main>

          {movies.length > 0 && !isLoading && (
            <div className="text-center mt-8 animate-fade-in">
              {error && <div className="max-w-2xl mx-auto mb-4"><ErrorDisplay message={error} /></div>}
              <button
                onClick={handleShowMore}
                disabled={isShowingMore}
                className="px-8 py-3 bg-gradient-to-r from-emerald-400 to-[#00cc88] text-white font-bold rounded-full hover:scale-105 active:scale-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-[#00cc88] transition-all duration-300 disabled:bg-slate-600 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed"
              >
                {isShowingMore ? 'Loading More...' : 'Show More'}
              </button>
            </div>
          )}

          {/* Similar Movies Section */}
          {(originalQueryTitle || isLoadingSimilar || similarMoviesError) && (
            <div className="mt-16 w-full animate-fade-in">
              {originalQueryTitle && <h2 className="text-3xl font-bold text-slate-200 mb-8 text-center">Because you liked {originalQueryTitle}...</h2>}
              
              {isLoadingSimilar && <LoadingSpinner />}
              
              {similarMoviesError && !isLoadingSimilar && <div className="max-w-2xl mx-auto"><ErrorDisplay message={similarMoviesError} /></div>}
              
              {similarMovies.length > 0 && !isLoadingSimilar && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
                  {similarMovies.map((movie, index) => (
                    <MovieCard
                      key={`similar-${movie.title}-${index}`}
                      movie={movie}
                      index={index}
                      onWatchTrailer={handleOpenTrailer}
                      onFindSimilar={handleFindSimilar}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {selectedTrailerId && (
        <Suspense fallback={<div />}>
          <TrailerModal videoId={selectedTrailerId} onClose={handleCloseTrailer} />
        </Suspense>
      )}
    </>
  );
};

export default App;