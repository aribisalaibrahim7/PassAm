"use client";

import { useState } from "react";
import { Library, Search, ExternalLink, Download, FileText, Video, Loader2, Check } from "lucide-react";

type SearchResult = {
  id: string;
  url: string;
  title: string;
  text: string;
  author?: string;
};

export default function Resources() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, category }),
      });
      
      const data = await res.json();
      if (data.results) {
        setResults(data.results);
      }
    } catch (error) {
      console.error("Search failed:", error);
      alert("Failed to fetch resources.");
    } finally {
      setIsSearching(false);
    }
  };

  const categories = ["All", "Past Questions", "Textbooks", "Video Tutorials", "Articles"];

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-500 min-h-[calc(100vh-4rem)] flex flex-col">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Resource Library</h1>
          <p className="text-muted-foreground">Curated academic papers, textbook citations, and video links.</p>
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search size={20} className="text-muted-foreground" />
        </div>
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for past questions, textbooks, or topics..." 
          className="w-full pl-12 pr-24 py-4 glass rounded-2xl border border-border focus:outline-none focus:border-primary/50 transition-colors"
          disabled={isSearching}
        />
        <div className="absolute inset-y-0 right-2 flex items-center">
          {isSearching ? (
             <div className="px-3 py-1 bg-primary/10 rounded flex items-center gap-2 text-xs font-medium text-primary">
               <Loader2 size={14} className="animate-spin" /> Searching
             </div>
          ) : (
            <span className="text-[10px] font-medium text-muted-foreground bg-foreground/5 px-2 py-1 rounded border border-border">Exa AI</span>
          )}
        </div>
      </form>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat) => (
          <button 
            key={cat} 
            type="button"
            onClick={() => {
              setCategory(cat);
              if (query.trim()) handleSearch();
            }}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              category === cat
                ? "bg-primary text-primary-foreground" 
                : "glass border border-border hover:bg-foreground/5"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Results Area */}
      <div className="flex-1">
        {!hasSearched ? (
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground opacity-50 text-center">
            <Library size={48} className="mb-4 text-foreground/20" />
            <p>Enter a topic above to search the neural web.</p>
          </div>
        ) : results.length === 0 && !isSearching ? (
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground opacity-50 text-center">
            <Search size={48} className="mb-4 text-foreground/20" />
            <p>No highly relevant results found. Try another query.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((result, idx) => {
              const isVideo = result.url.includes("youtube.com") || result.url.includes("vimeo");
              const isPdf = result.url.endsWith(".pdf") || result.url.includes("pdf");
              
              // State for individual offline save triggers
              return (
                <LibraryCard key={idx} result={result} isVideo={isVideo} isPdf={isPdf} />
              )
            })}
          </div>
        )}
      </div>

    </div>
  );
}

// Stateful Sub-component for individual card actions and glowing styles
function LibraryCard({ result, isVideo, isPdf }: { result: SearchResult; isVideo: boolean; isPdf: boolean }) {
  const [isSaved, setIsSaved] = useState(false);

  const triggerSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const domain = new URL(result.url).hostname.replace("www.", "");

  let typeStyle = "border-cyan-500/20 bg-cyan-500/5 group-hover:border-cyan-500/50 text-cyan-400";
  let badgeLabel = "Article";
  if (isVideo) {
    typeStyle = "border-rose-500/20 bg-rose-500/5 group-hover:border-rose-500/50 text-rose-400";
    badgeLabel = "Video Course";
  } else if (isPdf) {
    typeStyle = "border-indigo-500/20 bg-indigo-500/5 group-hover:border-indigo-500/50 text-indigo-400";
    badgeLabel = "Calculus PDF";
  }

  return (
    <div className={`glass p-5 rounded-3xl border flex flex-col group transition-all duration-300 hover:scale-[1.02] hover:shadow-lg relative overflow-hidden ${typeStyle}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-30 pointer-events-none" />
      
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className={`p-2.5 rounded-xl ${isVideo ? "bg-rose-500/10" : isPdf ? "bg-indigo-500/10" : "bg-cyan-500/10"}`}>
          {isVideo ? <Video size={18} /> : isPdf ? <FileText size={18} /> : <Library size={18} />}
        </div>
        <span className="text-[9px] uppercase font-black tracking-widest bg-foreground/10 px-2 py-0.5 rounded-md border border-border/50 max-w-[120px] truncate">
          {domain}
        </span>
      </div>
      
      <h3 className="font-extrabold text-base mb-1.5 leading-snug line-clamp-2 group-hover:text-primary transition-colors relative z-10">{result.title || "Untitled Document"}</h3>
      <p className="text-xs text-muted-foreground mb-4 line-clamp-3 leading-relaxed relative z-10">
        {result.text}
      </p>
      
      <div className="mt-auto pt-4 border-t border-border/20 flex items-center justify-between relative z-10">
        <button 
          onClick={triggerSave}
          className={`flex items-center gap-1 text-xs font-bold transition-all cursor-pointer ${
            isSaved ? "text-green-400 animate-bounce" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {isSaved ? (
            <><Check size={14} /> Saved Offline</>
          ) : (
            <><Download size={14} /> Keep Offline</>
          )}
        </button>
        <a 
          href={result.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className={`flex items-center gap-1 text-xs font-bold transition-colors ${
            isVideo ? "text-rose-400 hover:text-rose-300" : "text-foreground hover:text-primary"
          }`}
        >
          {isVideo ? "Stream Lecture" : "View Paper"} <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
}
