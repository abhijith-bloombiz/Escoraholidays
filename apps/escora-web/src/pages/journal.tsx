import Layout from "@/components/layout/Layout";
import { useListJournalPosts } from "@workspace/api-client-react";
import { useState, useMemo, useRef, useEffect } from "react";
import { useSeo } from "@/hooks/useSeo";
import { Link } from "wouter";
import whyEscoraBg from "@assets/escora/why-escora-bg.jpeg";

const CATEGORIES = ["All", "Travelogue", "Culture", "Heritage", "Cuisine", "Wellness", "News"];

const MOCK_POSTS = [
  { id: 1, title: "The Art of Slow Travel in Kerala's Backwaters", category: "Travelogue", excerpt: "Discovering the unhurried rhythm of life along the meandering canals of Alleppey, where time stands still and nature reclaims the soul.", authorName: "Priya Menon", readTimeMinutes: 5, imageUrl: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80", publishedAt: "2023-10-15T10:00:00Z", slug: "slow-travel-backwaters", tags: "alleppey, backwaters, slow-travel, houseboat" },
  { id: 2, title: "Echoes of the Past: Fort Kochi's Colonial Legacy", category: "Heritage", excerpt: "A walk through the cobblestone streets of Fort Kochi, uncovering tales of spice merchants, Portuguese explorers, and Dutch architecture.", authorName: "David Silva", readTimeMinutes: 7, imageUrl: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80", publishedAt: "2023-09-22T08:30:00Z", slug: "fort-kochi-legacy", tags: "fort-kochi, heritage, arrival, travel-tips" },
  { id: 3, title: "Munnar's Green Carpet: The Story of Tea", category: "Culture", excerpt: "Journey into the misty hills of Munnar to understand the centuries-old tradition of tea cultivation and the people who nurture it.", authorName: "Ananya Krishnan", readTimeMinutes: 6, imageUrl: "https://images.unsplash.com/photo-1444927714506-8492d94b4e3d?auto=format&fit=crop&w=800&q=80", publishedAt: "2023-11-05T14:15:00Z", slug: "munnar-tea-story", tags: "munnar, monsoon, season-guide, cardamom-hills" },
  { id: 4, title: "Ayurveda: The Ancient Science of Healing", category: "Wellness", excerpt: "Exploring the roots of Ayurveda in Kerala and how traditional wellness practices are being preserved in modern retreats.", authorName: "Dr. Arun Kumar", readTimeMinutes: 8, imageUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80", publishedAt: "2023-08-10T09:45:00Z", slug: "ayurveda-healing", tags: "ayurveda, wellness, experience-guide" },
];

export default function Journal() {
  useSeo({
    title: "Kerala Travel Journal — Stories, Guides & Insider Dispatches",
    description: "The Escora Journal: in-depth Kerala travel guides, Ayurveda insights, backwater travelogues, heritage stories, and monsoon travel tips — written by specialists who live and travel Kerala deeply.",
    url: "https://www.escoraholidays.com/journal",
  });

  const [activeFilter, setActiveFilter] = useState("All");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [isTopicsOpen, setIsTopicsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close topic dropdown on outside click
  useEffect(() => {
    if (!isTopicsOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsTopicsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isTopicsOpen]);

  // Close topic dropdown on Escape
  useEffect(() => {
    if (!isTopicsOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsTopicsOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isTopicsOpen]);

  const queryParams = activeFilter !== "All" ? { category: activeFilter, published: true } : { published: true };
  const { data: apiPosts, isLoading } = useListJournalPosts(queryParams);

  const allPosts = apiPosts && apiPosts.length > 0 ? apiPosts :
    (activeFilter === "All" ? MOCK_POSTS : MOCK_POSTS.filter(p => p.category === activeFilter));

  const posts = useMemo(() => {
    if (!activeTag) return allPosts;
    return allPosts.filter(p => (p as any).tags?.split(",").map((t: string) => t.trim()).includes(activeTag));
  }, [allPosts, activeTag]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    allPosts.forEach(p => {
      const raw = (p as any).tags;
      if (raw) raw.split(",").forEach((t: string) => { const trimmed = t.trim(); if (trimmed) tagSet.add(trimmed); });
    });
    return Array.from(tagSet);
  }, [allPosts]);

  const featuredPost = posts[0];
  const gridPosts = posts.slice(1);

  return (
    <Layout>
      <div className="dest-page">
        {/* ── Page Hero (Matching Explore Kerala layout & decoration image) ── */}
        <section className="dest-hero-section">
          <div
            className="dest-hero-bg"
            style={{ backgroundImage: `url(${whyEscoraBg})` }}
            aria-hidden="true"
          />
          <div className="dest-hero-gradient" aria-hidden="true" />

          <div className="dest-wrap">
            <div className="dest-hero-content">
              <h1 className="dest-hero-title">
                Stories &<br />
                <em>Dispatches</em>
              </h1>
              <p className="dest-hero-desc">
                Stories, reflections, and insider dispatches from the backwaters, mist-shrouded ghats, and coastal heritage of God&apos;s Own Country.
              </p>
            </div>
          </div>
        </section>

        {/* ── Category & Topic Filters (Matching Explore Kerala chips style) ── */}
        <section className="dest-filters-section">
          <div className="dest-wrap">
            <div className="dest-chips" role="tablist" aria-label="Journal Categories">
              {/* Category pills */}
              {CATEGORIES.map(cat => {
                const isSelected = activeFilter === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setActiveFilter(cat);
                      setActiveTag(null);
                    }}
                    className={`dest-chip ${isSelected ? "is-active" : ""}`}
                    aria-pressed={isSelected}
                    role="tab"
                  >
                    {cat}
                  </button>
                );
              })}

              {/* "Explore topics" Dropdown Control */}
              {allTags.length > 0 && (
                <div className="relative inline-block" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsTopicsOpen(prev => !prev)}
                    className={`dest-chip inline-flex items-center gap-1.5 ${
                      activeTag
                        ? "is-active"
                        : isTopicsOpen
                        ? "!border-[#1A3F2C] !text-[#1A3F2C]"
                        : ""
                    }`}
                    aria-expanded={isTopicsOpen}
                    aria-haspopup="true"
                  >
                    <span>{activeTag ? `#${activeTag}` : "Explore topics"}</span>
                    <svg
                      className={`w-3.5 h-3.5 text-current transition-transform duration-200 ${isTopicsOpen ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Popover */}
                  {isTopicsOpen && (
                    <div className="absolute left-0 mt-2 z-50 w-72 sm:w-80 p-3.5 bg-white rounded-2xl border border-[#D5DFD8] shadow-lg animate-in fade-in zoom-in-95 duration-150">
                      <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#E2EAE4]">
                        <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#637568]">
                          Filter by topic
                        </span>
                        {activeTag && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTag(null);
                              setIsTopicsOpen(false);
                            }}
                            className="text-[11px] font-sans text-[#8C7355] hover:underline cursor-pointer"
                          >
                            Clear topic
                          </button>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto pr-1">
                        {allTags.map(tag => {
                          const isTagSelected = activeTag === tag;
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => {
                                setActiveTag(isTagSelected ? null : tag);
                                setIsTopicsOpen(false);
                              }}
                              className={`font-mono text-[11px] tracking-wide px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                                isTagSelected
                                  ? "bg-[#1A3F2C] text-white font-medium"
                                  : "bg-[#EFF4F0] hover:bg-[#E2EAE4] text-[#38483D] border border-transparent hover:border-[#D5DFD8]"
                              }`}
                            >
                              #{tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Active topic badge with quick remove ✕ */}
              {activeTag && (
                <button
                  type="button"
                  onClick={() => setActiveTag(null)}
                  className="dest-chip border-[#8C7355] text-[#8C7355] hover:bg-[#8C7355] hover:text-white inline-flex items-center gap-1.5"
                  title="Remove topic filter"
                >
                  <span>#{activeTag}</span>
                  <span className="text-xs leading-none font-semibold">✕</span>
                </button>
              )}

              {/* Reset button if any filter is active */}
              {(activeFilter !== "All" || activeTag !== null) && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveFilter("All");
                    setActiveTag(null);
                  }}
                  className="dest-chip border-[#8C7355] text-[#8C7355] hover:bg-[#8C7355] hover:text-white"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </section>

      {/* Featured Post */}
      {featuredPost && (
        <section className="pt-2 pb-14 bg-[#FAF8F5] border-b border-[#E2EAE4]">
          <div className="dest-wrap">
            <Link href={`/journal/${featuredPost.id}`} className="group block reveal-up portal-card">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="aspect-[4/3] w-full overflow-hidden relative rounded-2xl">
                  <img 
                    src={featuredPost.imageUrl || "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80"} 
                    alt={featuredPost.title} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  />
                  <div className="absolute top-5 left-5">
                    <span className="bg-bg/85 backdrop-blur text-gold font-mono text-[10px] uppercase tracking-widest px-3 py-1 rounded-full">
                      Featured • {featuredPost.category}
                    </span>
                  </div>
                </div>
                
                <div className="lg:pr-12">
                  <div className="flex items-center gap-4 text-xs font-mono uppercase tracking-widest text-ink-mute mb-6">
                    <span>{new Date(featuredPost.publishedAt || new Date()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    <span className="w-1 h-1 rounded-full bg-line" />
                    <span>{featuredPost.readTimeMinutes} Min Read</span>
                  </div>
                  
                  <h2 className="font-serif text-4xl md:text-5xl text-ink leading-tight mb-6 group-hover:text-gold transition-colors">
                    {featuredPost.title}
                  </h2>
                  
                  <p className="font-sans text-ink-soft text-lg leading-relaxed mb-8">
                    {featuredPost.excerpt}
                  </p>
                  
                  <div className="flex items-center gap-4">
                    {(featuredPost as { authorImageUrl?: string }).authorImageUrl ? (
                      <img src={(featuredPost as { authorImageUrl?: string }).authorImageUrl} alt={featuredPost.authorName || "Author"} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-bg-3 border border-line flex items-center justify-center text-gold font-serif">
                        {featuredPost.authorName?.charAt(0) || "A"}
                      </div>
                    )}
                    <div>
                      <p className="font-mono text-xs uppercase tracking-widest text-ink">{featuredPost.authorName || "Escora Editorial"}</p>
                      {(featuredPost as { authorRole?: string }).authorRole && <p className="font-sans text-xs text-ink-mute">{(featuredPost as { authorRole?: string }).authorRole}</p>}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* Grid Posts */}
      <section className="pt-8 pb-20 bg-[#FAF8F5]">
        <div className="dest-wrap">
          {isLoading ? (
            <div className="flex justify-center items-center py-32">
              <div className="w-12 h-12 border-t border-gold animate-spin rounded-full"></div>
            </div>
          ) : gridPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {gridPosts.map((post, i) => (
                <Link 
                  key={post.id} 
                  href={`/journal/${post.id}`}
                  className="group block reveal-up portal-card flex flex-col h-full"
                  style={{ transitionDelay: `${(i % 3) * 0.15}s` }}
                >
                  <div className="aspect-[4/3] w-full overflow-hidden relative mb-5 rounded-2xl">
                    <img 
                      src={post.imageUrl || "https://images.unsplash.com/photo-1444927714506-8492d94b4e3d?auto=format&fit=crop&w=800&q=80"} 
                      alt={post.title} 
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    />
                    <div className="absolute top-5 left-5">
                      <span className="bg-bg/85 backdrop-blur text-gold font-mono text-[10px] uppercase tracking-widest px-3 py-1 rounded-full">
                        {post.category}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest text-ink-mute mb-3">
                      <span>{new Date(post.publishedAt || new Date()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                      <span className="w-1 h-1 rounded-full bg-line" />
                      <span>{post.readTimeMinutes} Min Read</span>
                    </div>
                    
                    <h3 className="font-serif text-2xl text-ink leading-tight mb-3 group-hover:text-gold transition-colors line-clamp-3">
                      {post.title}
                    </h3>
                    
                    <p className="font-sans text-ink-soft text-sm leading-relaxed mb-5 line-clamp-3 flex-1">
                      {post.excerpt}
                    </p>
                    
                    <div className="mt-auto flex items-center gap-2.5 text-gold font-mono text-xs uppercase tracking-widest group-hover:text-[#183628] transition-colors">
                      <span>Read Story</span>
                      <span className="w-6 h-[1px] bg-current group-hover:w-10 transition-all duration-300" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-28 reveal-up">
              <p className="font-editorial text-2xl text-[#293D1F]">No stories found for this selection.</p>
              <button 
                onClick={() => { setActiveFilter("All"); setActiveTag(null); }}
                className="mt-6 font-sans text-xs uppercase tracking-widest text-white bg-[#183628] hover:bg-[#26533A] px-6 py-2.5 rounded-full transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </section>
      </div>
    </Layout>
  );
}
