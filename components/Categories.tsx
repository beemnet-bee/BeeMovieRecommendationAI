import React from 'react';

const categories = [
  "Popular", "Action", "Comedy", "Sci-Fi", "Horror", "Drama", "Animation", "Thriller"
];

interface CategoriesProps {
  activeCategory: string;
  onSelectCategory: (category: string) => void;
}

export const Categories: React.FC<CategoriesProps> = ({ activeCategory, onSelectCategory }) => {
  return (
    <div className="w-full flex justify-center py-4 animate-fade-in">
      <div className="flex flex-wrap justify-center gap-3">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => onSelectCategory(category)}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ease-in-out
              ${activeCategory === category 
                ? 'bg-gradient-to-r from-emerald-400 to-[#00cc88] text-white shadow-lg shadow-emerald-500/20'
                : 'bg-slate-800/80 text-slate-300 border border-slate-700 hover:border-[#00cc88] hover:text-white'
              }
            `}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
};
