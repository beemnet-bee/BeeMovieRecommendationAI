import React, { useState, useEffect } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  initialQuery?: string;
}

const SearchIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
);


export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading, initialQuery = '' }) => {
  const [query, setQuery] = useState(initialQuery);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="relative group">
        <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-300">
          <SearchIcon className={`w-5 h-5 ${isFocused ? 'text-[#00cc88]' : 'text-slate-500'}`} />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Describe your perfect movie..."
          disabled={isLoading}
          className="w-full pl-12 pr-28 py-4 text-white bg-slate-800/80 backdrop-blur-sm border-2 border-slate-700 rounded-full shadow-inner shadow-black/20 focus:ring-4 focus:ring-[#00cc88]/50 focus:border-[#00cc88] focus:bg-slate-800 transition-all duration-300 placeholder-slate-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-3 bg-gradient-to-r from-emerald-400 to-[#00cc88] text-white font-bold rounded-full hover:scale-105 active:scale-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-[#00cc88] transition-all duration-300 disabled:bg-slate-600 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed"
        >
          <span>Find</span>
        </button>
      </div>
    </form>
  );
};