import React, { useState, useRef } from 'react';
import type { Movie } from '../types';

interface MovieCardProps {
  movie: Movie;
  index: number;
  onWatchTrailer: (videoId: string) => void;
}

const FilmReelPlaceholder: React.FC = () => (
    <div className="w-full h-full bg-slate-800 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-slate-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9A2.25 2.25 0 0 0 13.5 5.25h-9a2.25 2.25 0 0 0-2.25 2.25v9A2.25 2.25 0 0 0 4.5 18.75Z" />
        </svg>
    </div>
);

const ShimmerPlaceholder: React.FC = () => (
    <div className="absolute inset-0 bg-slate-700">
        <div className="w-full h-full bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 bg-[length:200%_100%] animate-placeholder-shimmer"></div>
    </div>
);

const PlayIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.647c1.295.742 1.295 2.545 0 3.286L7.279 20.99c-1.25.717-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
    </svg>
);


export const MovieCard: React.FC<MovieCardProps> = ({ movie, index, onWatchTrailer }) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const animationDelay = `${index * 80}ms`;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const { left, top, width, height } = cardRef.current.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;
    const rotateX = ((y / height) - 0.5) * -25; // Invert for natural feel
    const rotateY = ((x / width) - 0.5) * 25;
    
    cardRef.current.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
  };

  const handleMouseLeave = () => {
      if (!cardRef.current) return;
      cardRef.current.style.transform = 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group relative bg-slate-800 rounded-2xl overflow-hidden shadow-2xl shadow-black/30 opacity-0 animate-card-enter transition-transform duration-100 ease-out [transform-style:preserve-3d]"
      style={{ animationDelay }}
    >
      <div className="relative w-full bg-slate-800 aspect-[2/3] overflow-hidden [transform:translateZ(20px)] transition-transform duration-300 group-hover:[transform:translateZ(0px)]">
        {movie.posterUrl && !imgError ? (
            <>
                {!isImageLoaded && <ShimmerPlaceholder />}
                <img
                    src={movie.posterUrl}
                    alt={`Poster for ${movie.title}`}
                    className={`w-full h-full object-cover transition-opacity duration-500 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => setIsImageLoaded(true)}
                    onError={() => setImgError(true)}
                    loading="lazy"
                />
            </>
        ) : (
            <FilmReelPlaceholder />
        )}
        {/* Inner border */}
        <div className="absolute inset-0 ring-1 ring-inset ring-black/20 pointer-events-none"></div>
      </div>
      
      {/* Permanent Title Overlay */}
      <div className="absolute bottom-0 inset-x-0 p-4 pt-8 bg-gradient-to-t from-black/90 to-transparent pointer-events-none [transform:translateZ(60px)]">
        <h2 className="text-xl font-bold text-white drop-shadow-lg leading-tight">{movie.title}</h2>
        <p className="text-sm font-semibold text-emerald-300 drop-shadow-md">{movie.year}</p>
      </div>

      {/* Hover Details Overlay */}
      <div className="absolute inset-0 flex flex-col justify-end p-4 bg-black/70 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out [transform:translateZ(40px)]">
        <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 ease-in-out">
            <p className="text-slate-300 text-sm mb-3 max-h-24 overflow-y-auto">
              {movie.summary}
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {movie.genres.map(genre => (
                  <span key={genre} className="inline-block bg-slate-700 text-slate-300 text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                    {genre}
                  </span>
              ))}
            </div>
            {movie.youtubeVideoId && (
              <button
                  onClick={() => onWatchTrailer(movie.youtubeVideoId!)}
                  className="w-full flex items-center justify-center gap-2 text-sm text-white bg-gradient-to-r from-emerald-400 to-[#00cc88] hover:opacity-90 px-4 py-2.5 rounded-lg font-bold transition-opacity duration-300"
              >
                  <PlayIcon className="w-5 h-5" />
                  <span>Watch Trailer</span>
              </button>
            )}
        </div>
      </div>

      {/* Glow effect on hover */}
      <div className="absolute inset-0 rounded-2xl ring-2 ring-inset ring-transparent group-hover:ring-[#00cc88]/50 transition-all duration-300 pointer-events-none"></div>
    </div>
  );
};