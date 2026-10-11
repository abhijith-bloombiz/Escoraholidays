import Layout from "@/components/layout/Layout";
import { useListJournalPosts } from "@workspace/api-client-react";
import { useState, useMemo } from "react";
import { useSeo } from "@/hooks/useSeo";
import { Link } from "wouter";

const CATEGORIES = ["All", "Travelogue", "Culture", "Heritage", "Cuisine", "Wellness", "News"];

const MOCK_POSTS = [
  { id: 1, title: "The Art of Slow Travel in Kerala's Backwaters", category: "Travelogue", excerpt: "Discovering the unhurried rhythm of life along the meandering canals of Alleppey, where time stands still and nature reclaims the soul.", authorName: "Priya Menon", readTimeMinutes: 5, imageUrl: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80", publishedAt: "2023-10-15T10:00:00Z", slug: "slow-travel-backwaters" },
  { id: 2, title: "Echoes of the Past: Fort Kochi's Colonial Legacy", category: "Heritage", excerpt: "A walk through the cobblestone streets of Fort Kochi, uncovering tales of spice merchants, Portuguese explorers, and Dutch architecture.", authorName: "David Silva", readTimeMinutes: 7, imageUrl: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80", publishedAt: "2023-09-22T08:30:00Z", slug: "fort-kochi-legacy" },
  { id: 3, title: "Munnar's Green Carpet: The Story of Tea", category: "Culture", excerpt: "Journey into the misty hills of Munnar to understand the centuries-old tradition of tea cultivation and the people who nurture it.", authorName: "Ananya Krishnan", readTimeMinutes: 6, imageUrl: "https://images.unsplash.com/photo-1444927714506-8492d94b4e3d?auto=format&fit=crop&w=800&q=80", publishedAt: "2023-11-05T14:15:00Z", slug: "munnar-tea-story" },
  { id: 4, title: "Ayurveda: The Ancient Science of Healing", category: "Wellness", excerpt: "Exploring the roots of Ayurveda in Kerala and how traditional wellness practices are being preserved in modern retreats.", authorName: "Dr. Arun Kumar", readTimeMinutes: 8, imageUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80", publishedAt: "2023-08-10T09:45:00Z", slug: "ayurveda-healing" },
];

export default function Journal() {
  useSeo({
    title: "Kerala Travel Journal — Stories, Guides & Insider Dispatches",
    description: "The Escora Journal: in-depth Kerala travel guides, Ayurveda insights, backwater travelogues, heritage stories, and monsoon travel tips — written by specialists who live and travel Kerala deeply.",
    url: "https://www.escoraholidays.com/journal",
  });

  const [activeFilter, setActiveFilter] = useState("All");
  const [activeTag, setActiveTag] = useState<string | null>(null);

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
    return Array.from(tagSet).slice(0, 12);
  }, [allPosts]);

  const featuredPost = posts[0];
  const gridPosts = posts.slice(1);

  return (
    <Layout>
      {/* Page Hero */}
      <section className="relative pt-32 pb-16 bg-bg border-b border-line">
        <div className="container mx-auto px-6 md:px-12 text-center reveal-up">
          <p className="font-mono text-gold text-sm tracking-[0.3em] uppercase mb-6 block">Travelogue</p>
          <h1 className="font-serif text-5xl md:text-7xl text-ink leading-[1.1] font-light max-w-4xl mx-auto mb-8">
            The Escora <em className="text-gold italic">Journal</em>
          </h1>
          <p className="font-sans text-ink-soft max-w-2xl mx-auto leading-relaxed">
            Stories, reflections, and dispatches from God's Own Country. 
          </p>
        </div>
      </section>

      {/* Filter section */}
      <section className="py-6 bg-bg-2 border-b border-line sticky top-[80px] z-40 backdrop-blur-md bg-bg-2/90">
        <div className="container mx-auto px-6 md:px-12 space-y-3">
          <div className="flex gap-4 overflow-x-auto no-scrollbar md:justify-center min-w-max mx-auto">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => { setActiveFilter(cat); setActiveTag(null); }}
                className={`font-mono text-xs uppercase tracking-widest px-6 py-3 rounded transition-colors ${
                  activeFilter === cat
                    ? "bg-gold text-bg"
                    : "border border-line text-ink-soft hover:border-gold hover:text-gold"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2 md:justify-center">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  className={`font-mono text-[10px] uppercase tracking-widest px-3 py-1 rounded-full transition-colors border ${
                    activeTag === tag
                      ? "bg-gold/20 border-gold text-gold"
                      : "border-line/60 text-ink-mute hover:border-gold/50 hover:text-ink-soft"
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Post */}
      {featuredPost && (
        <section className="py-24 bg-bg border-b border-line">
          <div className="container mx-auto px-6 md:px-12">
            <Link href={`/journal/${featuredPost.id}`} className="group block reveal-up">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="aspect-[4/3] w-full overflow-hidden relative">
                  <img 
                    src={featuredPost.imageUrl || "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80"} 
                    alt={featuredPost.title} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  />
                  <div className="absolute top-6 left-6">
                    <span className="bg-bg/80 backdrop-blur text-gold font-mono text-[10px] uppercase tracking-widest px-3 py-1">
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
                      <img src={(featuredPost as { authorImageUrl?: string }).authorImageUrl} alt={featuredPost.authorName || "Author"} className="w-10 h-10 rounded-full object-cover grayscale" />
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
      <section className="py-24 bg-bg">
        <div className="container mx-auto px-6 md:px-12">
          {isLoading ? (
            <div className="flex justify-center items-center py-32">
              <div className="w-12 h-12 border-t border-gold animate-spin rounded-full"></div>
            </div>
          ) : gridPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {gridPosts.map((post, i) => (
                <Link 
                  key={post.id} 
                  href={`/journal/${post.id}`}
                  className="group block reveal-up flex flex-col h-full"
                  style={{ transitionDelay: `${(i % 3) * 0.15}s` }}
                >
                  <div className="aspect-[4/3] w-full overflow-hidden relative mb-6">
                    <img 
                      src={post.imageUrl || "https://images.unsplash.com/photo-1444927714506-8492d94b4e3d?auto=format&fit=crop&w=800&q=80"} 
                      alt={post.title} 
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 grayscale group-hover:grayscale-0"
                    />
                    <div className="absolute top-6 left-6">
                      <span className="bg-bg/80 backdrop-blur text-gold font-mono text-[10px] uppercase tracking-widest px-3 py-1">
                        {post.category}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest text-ink-mute mb-4">
                      <span>{new Date(post.publishedAt || new Date()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                      <span className="w-1 h-1 rounded-full bg-line" />
                      <span>{post.readTimeMinutes} Min Read</span>
                    </div>
                    
                    <h3 className="font-serif text-2xl text-ink leading-tight mb-4 group-hover:text-gold transition-colors line-clamp-3">
                      {post.title}
                    </h3>
                    
                    <p className="font-sans text-ink-soft text-sm leading-relaxed mb-6 line-clamp-3 flex-1">
                      {post.excerpt}
                    </p>
                    
                    <div className="mt-auto flex items-center gap-3 text-gold font-mono text-xs uppercase tracking-widest">
                      <span>Read Story</span>
                      <span className="w-6 h-[1px] bg-gold group-hover:w-10 transition-all" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-32 reveal-up">
              <p className="font-serif text-2xl text-ink-soft">No stories found for this category.</p>
              <button 
                onClick={() => setActiveFilter("All")}
                className="mt-8 font-mono text-xs text-gold uppercase tracking-widest hover:text-gold-bright transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
