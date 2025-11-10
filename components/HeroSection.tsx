import React from 'react';

interface HeroSectionProps {
  onExampleClick: (prompt: string) => void;
}

const examplePrompts = [
  "A mind-bending sci-fi thriller",
  "A feel-good comedy from the 80s",
  "A visually stunning animated fantasy",
  "A gritty neo-noir detective story"
];

export const HeroSection: React.FC<HeroSectionProps> = ({ onExampleClick }) => (
  <div className="text-center animate-fade-in py-16">
    <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-300 via-[#00cc88] to-teal-400 bg-[size:200%_auto] animate-shimmer mb-4 tracking-tighter">
      Movie AI
    </h1>
    <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto">
      Tell me what you're in the mood for, and I'll find the perfect movie for you.
    </p>
    <div className="mt-8 flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
      {examplePrompts.map((prompt) => (
        <button
          key={prompt}
          onClick={() => onExampleClick(prompt)}
          className="px-4 py-2 bg-slate-800/50 text-slate-300 border border-slate-700 rounded-full text-sm font-medium transition-all duration-300 hover:border-[#00cc88] hover:text-white hover:shadow-[0_0_15px_-3px_rgba(0,204,136,0.5)]"
        >
          {prompt}
        </button>
      ))}
    </div>
  </div>
);