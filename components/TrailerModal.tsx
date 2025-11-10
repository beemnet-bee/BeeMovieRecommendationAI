import React, { useEffect, useState } from 'react';

interface TrailerModalProps {
  videoId: string;
  onClose: () => void;
}

const CloseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
);

const Spinner: React.FC = () => (
    <div className="w-16 h-16 border-4 border-slate-600 border-t-emerald-400 rounded-full animate-spin"></div>
);


export const TrailerModal: React.FC<TrailerModalProps> = ({ videoId, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  return (
    <div 
        className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="trailer-modal-title"
    >
      <div 
        className="relative bg-black rounded-lg shadow-xl w-full max-w-4xl aspect-video m-4 animate-slide-up"
        onClick={(e) => e.stopPropagation()} // Prevent clicks inside the modal from closing it
      >
        <h2 id="trailer-modal-title" className="sr-only">Movie Trailer</h2>
        <button 
            onClick={onClose}
            className="absolute -top-4 -right-4 z-20 w-10 h-10 flex items-center justify-center bg-white text-black rounded-full hover:bg-gray-200 transition-all duration-300 shadow-lg"
            aria-label="Close trailer"
        >
            <CloseIcon className="w-6 h-6" />
        </button>
        {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black rounded-lg">
                <Spinner />
            </div>
        )}
        <iframe
          className={`absolute top-0 left-0 w-full h-full rounded-lg transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={() => setIsLoading(false)}
        ></iframe>
      </div>
    </div>
  );
};