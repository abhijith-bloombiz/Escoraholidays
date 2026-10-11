import Layout from "@/components/layout/Layout";
import { useGetJournalPost, getGetJournalPostQueryKey, useListJournalPosts } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { useState } from "react";
import { useSeo } from "@/hooks/useSeo";
import "./journal-detail.css";

/* ── Fallback mock articles (mirrors journal.tsx MOCK_POSTS, with full body) ── */
const MOCK_ARTICLES = [
  {
    id: 1,
    title: "The Art of Slow Travel in Kerala's Backwaters",
    category: "Travelogue",
    excerpt: "Discovering the unhurried rhythm of life along the meandering canals of Alleppey, where time stands still and nature reclaims the soul.",
    authorName: "Priya Menon",
    authorRole: "Senior Curator · Journeys",
    authorImageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80",
    readTimeMinutes: 5,
    imageUrl: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1600&q=80",
    publishedAt: "2024-10-15T10:00:00Z",
    content: `The engine cuts out somewhere past the third bend, and Rajan — who has piloted kettuvallam on the Vembanad for thirty-one years — says nothing. He doesn't need to. The silence does all the explaining.

We are moving at perhaps two kilometres per hour, pulled by a single pole pressed against the silted floor of a canal no wider than a village lane. On either bank, coconut palms lean over the water in the particular way that makes you feel the whole landscape is conspiring to slow you down further.

This is the Kerala backwaters as they were before the houseboats arrived with their satellite dishes and catered lunches. A country of water — over nine hundred kilometres of canals, rivers, lakes and lagoons stretching from Kasaragod to Thiruvananthapuram — that has been the artery of human movement in this state since before recorded history.

<blockquote>To travel by water in Kerala is to understand that the destination was never the point. The point was always the canal itself.</blockquote>

Rajan hands me a glass of black tea without being asked. On the bank, a woman beats laundry against a flat stone. Two children race a wooden toy boat beside our hull. A kingfisher, electric blue, holds a branch for four full seconds before dropping into the water and rising with something silver.

I have been on the backwaters many times. I was born in Kochi, and I have escorted more guests through Alleppey than I can accurately count. But I still find myself holding my breath at moments like this. The geometry of it — the green corridors, the flat bronze light of late afternoon, the absolute absence of urgency — defeats the part of the mind that is always trying to be somewhere else.

The slow-travel movement, such as it is, often arrives with a manifesto. A theory of place. A rejection of itinerary. But in Kerala, slowness is not a philosophy. It was never a choice. The water has always dictated the pace. The pace has always been water's pace.

Rajan poles us around a bend and the canal opens into a broader stretch of Vembanad Lake. The light changes immediately — brighter, more exposed, a wind moving across the surface in a way that makes small waves. A cormorant dries its wings on a floating log. An egret stands in the shallows, still as a painted bird, until it isn't.

"Thirty years," Rajan says, apropos of nothing. "Same lake. Different every day."

He is not being poetic. He means it as a factual report. I write it down anyway.`,
  },
  {
    id: 2,
    title: "Echoes of the Past: Fort Kochi's Colonial Legacy",
    category: "Heritage",
    excerpt: "A walk through the cobblestone streets of Fort Kochi, uncovering tales of spice merchants, Portuguese explorers, and Dutch architecture.",
    authorName: "David Silva",
    authorRole: "Heritage Writer",
    authorImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    readTimeMinutes: 7,
    imageUrl: "https://images.unsplash.com/photo-1556470478-98bd74cfc940?auto=format&fit=crop&w=1600&q=80",
    publishedAt: "2024-09-22T08:30:00Z",
    content: `Walk down Princess Street at seven in the morning and the city is still deciding what it wants to be. A coconut vendor passes a boutique hotel. A Chinese fishing net, counterweighted with river stones, lifts from the harbour with the mechanical patience it has shown since the fourteenth century. A woman in a sari pins her washing to a line strung between two colonial-era facades.

Fort Kochi is not a museum. It is a city that has never been able to forget its own history, because that history is structural. Literally embedded in its walls.

<blockquote>Five empires have left their signatures on this peninsula. None of them quite managed to erase the one before.</blockquote>

The Portuguese arrived in 1503 and built the first European fort in India on this narrow spit of land at the mouth of the Periyar estuary. They were followed by the Dutch, who dismantled that fort stone by stone and used the material to build their own. Then the British, who added a layer of neoclassical civic architecture to the Dutch-period warehouses and the Portuguese-era churches that had somehow survived the transitions.

What remains is an architectural palimpsest — a city written over itself so many times that the layers have become inseparable. The Dutch cemetery on Burial Road contains gravestones in four languages. The Church of St. Francis, built in 1503, holds the temporary tomb of Vasco da Gama within walls that are now maintained by the Church of South India. The Jewish Synagogue in Mattancherry, the oldest active synagogue in the Commonwealth, is tiled with hand-painted blue-and-white Canton porcelain imported from China in the eighteenth century.

None of this happens, of course, without the spice trade. Black pepper — worth more per weight than silver in medieval Europe — grew in the hills forty kilometres east of here. The whole elaborate apparatus of colonialism in south India can be traced back to that single commodity and the merchants who understood its value.

The Kochi-Muziris Biennale, held here every two years, has added a contemporary layer to this sedimented city. Artists from sixty countries have shown work in the warehouses of the Dutch era, in the streets of the Portuguese quarter, in the harbour spaces the British built.

Fort Kochi continues to be written over. That is perhaps the most honest thing you can say about it.`,
  },
  {
    id: 3,
    title: "Munnar's Green Carpet: The Story of Tea",
    category: "Culture",
    excerpt: "Journey into the misty hills of Munnar to understand the centuries-old tradition of tea cultivation and the people who nurture it.",
    authorName: "Ananya Krishnan",
    authorRole: "Field Correspondent",
    authorImageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    readTimeMinutes: 6,
    imageUrl: "https://images.unsplash.com/photo-1444927714506-8492d94b4e3d?auto=format&fit=crop&w=1600&q=80",
    publishedAt: "2024-11-05T14:15:00Z",
    content: `At 1,600 metres, the air changes texture. It becomes something you notice, a cool weight that settles on the skin and carries the particular smell of wet earth and tea leaf. The Western Ghats at this altitude are not warm. The tea bushes, clipped to chest height in geometric rows that follow every contour of the hillside, are coated in morning mist.

Lakshmibai has been plucking tea here since she was seventeen. She is fifty-three now, and her hands move between the rows with a speed and precision that seem automatic — two leaves and a bud, two leaves and a bud, the canonical unit of quality tea production, delivered at a rate of approximately twenty kilograms per day per skilled plucker.

"You take the third leaf and the flavour disappears," she tells me. "You take only one and the yield is too low. Two leaves and the bud is the correct answer. It has always been the correct answer."

<blockquote>The best Munnar teas taste like place. Not a generic place, but this specific hillside, at this altitude, in this mist.</blockquote>

Munnar's tea estates were established in the 1880s by the British planting companies, which cleared the existing shola forests and planted Assam seed varieties on the high ridges. What they could not have predicted was the terroir — the combination of altitude, rainfall, temperature variation and soil composition — that would produce a tea recognisably different from anything grown elsewhere.

The best Munnar teas are orthodox-processed: rolled by hand or by traditional machinery that mimics hand-rolling, then oxidised, dried, and graded by leaf size. The liquor is bright and astringent, with a muscatel character that the industry attributes to the attack of a small leafhopper called Empoasca flavescens. The insect damages the leaf slightly; the plant responds with chemicals that, when oxidised, produce a distinctive honey-and-apricot note.

The Tata Tea estate at Munnar is the largest in the region and runs a visitor programme that includes a factory tour. The smaller, family-run estates in Lockhart Gap and High Range produce single-estate teas sold directly to specialist buyers in Germany, Japan, and the United States.

Lakshmibai pours me a cup from the flask she carries. It is strong and sweet. Down the valley, cloud fills the lower hollows. Another day of mist is coming.`,
  },
  {
    id: 4,
    title: "Ayurveda: The Ancient Science of Healing",
    category: "Wellness",
    excerpt: "Exploring the roots of Ayurveda in Kerala and how traditional wellness practices are being preserved in modern retreats.",
    authorName: "Dr. Arun Kumar",
    authorRole: "Wellness Correspondent",
    authorImageUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=200&q=80",
    readTimeMinutes: 8,
    imageUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1600&q=80",
    publishedAt: "2024-08-10T09:45:00Z",
    content: `The physician's first question is not about symptoms. It is about appetite. How is it in the morning? After midday? At night? Does it vary with the season? With the direction of the wind?

Dr. Vasudevan Nambiar is a seventh-generation Ayurvedic practitioner from a family that has maintained a vaidyasala — a healing house — in the same location in north Kerala for two hundred and thirty years. He speaks Malayalam, Sanskrit, and a precise, formal English that he learned from his father, who learned it from his father, who treated British planters in the 1920s.

He does not have a waiting room. He has a verandah, with wooden benches worn smooth by the weight of generations, and a garden in which sixty-four of the eight hundred and forty-two medicinal plants mentioned in the Ashtangahridayam are currently growing.

<blockquote>Ayurveda does not treat disease. It treats the person who has the disease. These are different problems requiring different solutions.</blockquote>

The Ashtangahridayam — the Heart of the Eight Branches — is a seventh-century Sanskrit text that remains the primary reference work for classical Ayurvedic practice in Kerala. Where other Indian states moved toward the Charaka Samhita or the Sushruta Samhita, Kerala preserved and elaborated the Ashtangahridaya tradition, developing its own school of practice known as Ashtavaidya, practised by eight hereditary families.

Dr. Nambiar is from one of those families. His treatment protocols are derived from texts his ancestors annotated in palm-leaf manuscripts, many of which are now held in the manuscript libraries of Thiruvananthapuram.

The core principle is panchakarma: five cleansing procedures — oil massage, steam therapy, medicated enemas, nasal therapy, and bloodletting — that purge accumulated toxins and restore the balance of the three doshas. Modern Ayurvedic resorts have adapted these treatments for wellness tourism, but classical panchakarma as Dr. Nambiar practices it is a medically supervised fourteen to twenty-eight day intervention, not a spa experience.

The distinction matters to him. "There is nothing wrong with relaxation," he says, measuring dried herbs on a brass scale that belonged to his grandfather. "Relaxation is good. But it is not medicine."`,
  },
];

/* ── Helpers ── */
function parseParagraphs(content: string) {
  return content.split("\n\n").filter(Boolean);
}

interface MockPost {
  id: number;
  title: string;
  category: string;
  excerpt: string;
  authorName: string;
  authorRole: string;
  authorImageUrl: string;
  readTimeMinutes: number;
  imageUrl: string;
  publishedAt: string;
  content: string;
}

function isHtmlContent(content: string): boolean {
  return /<[a-z][\s\S]*>/i.test(content);
}

function ArticleContent({ paragraphs, rawContent }: { paragraphs: string[]; rawContent?: string }) {
  if (rawContent && isHtmlContent(rawContent)) {
    return (
      <div
        className="jd-body"
        // Content is admin-entered and trusted
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: rawContent }}
      />
    );
  }
  return (
    <div className="jd-body">
      {paragraphs.map((para, i) => {
        if (para.startsWith("<blockquote>")) {
          const text = para.replace(/<\/?blockquote>/g, "");
          return <blockquote key={i} className="jd-pullquote">{text}</blockquote>;
        }
        return (
          <p key={i} className={i === 0 ? "jd-p jd-dropcap" : "jd-p"}>
            {para}
          </p>
        );
      })}
    </div>
  );
}

function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const encoded = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  function copyLink() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="jd-share-btns">
      <a
        href={`https://wa.me/?text=${encodeURIComponent(title + " — " + url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="jd-share-btn"
        aria-label="Share on WhatsApp"
        title="WhatsApp"
      >
        WA
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encoded}`}
        target="_blank"
        rel="noopener noreferrer"
        className="jd-share-btn"
        aria-label="Share on Facebook"
        title="Facebook"
      >
        Fb
      </a>
      <a
        href={`https://twitter.com/intent/tweet?url=${encoded}&text=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        className="jd-share-btn"
        aria-label="Share on X"
        title="X (Twitter)"
      >
        𝕏
      </a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`}
        target="_blank"
        rel="noopener noreferrer"
        className="jd-share-btn"
        aria-label="Share on LinkedIn"
        title="LinkedIn"
      >
        In
      </a>
      <button
        onClick={copyLink}
        className="jd-share-btn"
        aria-label="Copy link"
        title={copied ? "Copied!" : "Copy link"}
      >
        {copied ? "✓" : "⌘"}
      </button>
    </div>
  );
}

export default function JournalDetail() {
  const { id } = useParams();
  const postId = Number(id);

  const { data: apiPost, isLoading } = useGetJournalPost(postId, {
    query: { enabled: !!postId, queryKey: getGetJournalPostQueryKey(postId) },
  });
  const { data: relatedApiData } = useListJournalPosts({ published: true });

  /* Prefer API data; fall back to mock */
  const mockPost = MOCK_ARTICLES.find((a) => a.id === postId) ?? MOCK_ARTICLES[0];
  const post = apiPost ?? mockPost;

  const relatedMock = MOCK_ARTICLES.filter((a) => a.id !== postId).slice(0, 3);
  const relatedPosts =
    relatedApiData && relatedApiData.length > 0
      ? relatedApiData.filter((p) => p.id !== postId).slice(0, 3)
      : relatedMock;

  const authorName = (post as any).authorName ?? "Escora Editorial";
  const authorRole = (post as MockPost).authorRole ?? "Escora Editorial";
  const authorImageUrl = (post as any).authorImageUrl ?? null;
  const publishedDate = new Date((post as any).publishedAt ?? Date.now()).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });
  const readTime = (post as any).readTimeMinutes;
  const rawContent = (post as any).content ?? "";
  const paragraphs = parseParagraphs(rawContent);
  const pageUrl = typeof window !== "undefined" ? window.location.href : `https://www.escoraholidays.com/journal/${postId}`;

  useSeo({
    title: post.title,
    description: post.excerpt ?? undefined,
    image: (post as any).imageUrl ?? undefined,
    url: pageUrl,
    type: "article",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: post.excerpt,
      image: (post as any).imageUrl,
      author: { "@type": "Person", name: authorName },
      publisher: { "@type": "Organization", name: "Escora" },
      datePublished: (post as any).publishedAt,
      url: pageUrl,
    },
  });

  return (
    <Layout>
      {/* ── Breadcrumb / eyebrow ── */}
      <div className="jd-crumb">
        <Link href="/journal">Journal</Link>
        <span className="jd-crumb-sep" />
        <span>{post.category}</span>
      </div>

      {/* ── Article header ── */}
      <header className="jd-header">
        <div className="jd-header-inner">
          <div className="jd-meta-row">
            <span className="jd-category">{post.category}</span>
            <span className="jd-dot" />
            <span className="jd-date">{publishedDate}</span>
            {readTime && (
              <>
                <span className="jd-dot" />
                <span className="jd-date">{readTime} min read</span>
              </>
            )}
          </div>

          <h1 className="jd-title">{post.title}</h1>
          <p className="jd-excerpt">{post.excerpt}</p>

          <div className="jd-author">
            {authorImageUrl ? (
              <img src={authorImageUrl} alt={authorName} className="jd-author-av" />
            ) : (
              <div className="jd-author-av jd-author-av-placeholder">
                {authorName.charAt(0)}
              </div>
            )}
            <div>
              <div className="jd-author-name">{authorName}</div>
              {authorRole && <div className="jd-author-role">{authorRole}</div>}
            </div>
          </div>
        </div>
      </header>

      {/* ── Hero image ── */}
      <div className="jd-hero-img-wrap">
        <img
          src={(post as any).imageUrl ?? "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1600&q=80"}
          alt={post.title}
          className="jd-hero-img"
        />
        <div className="jd-hero-img-caption">
          {post.category} · Kerala, India
        </div>
      </div>

      {/* ── Article body ── */}
      <div className="jd-article-wrap">
        <aside className="jd-sidebar">
          <div className="jd-sidebar-sticky">
            <div className="jd-sidebar-label">Share</div>
            <ShareButtons url={pageUrl} title={post.title} />
            <div className="jd-sidebar-divider" />
            <div className="jd-sidebar-label">Category</div>
            <div className="jd-sidebar-category">{post.category}</div>
          </div>
        </aside>

        <article className="jd-content">
          {paragraphs.length > 0 ? (
            <ArticleContent paragraphs={paragraphs} rawContent={rawContent} />
          ) : (
            <p className="jd-p">The full story is being composed in our journals. Please check back soon.</p>
          )}

          {/* Share footer */}
          <div className="jd-share-footer">
            <span className="jd-share-footer-label">Share this story</span>
            <ShareButtons url={pageUrl} title={post.title} />
          </div>
        </article>
      </div>

      {/* ── Author card ── */}
      <div className="jd-author-card-wrap">
        <div className="jd-author-card">
          {authorImageUrl ? (
            <img src={authorImageUrl} alt={authorName} className="jd-author-card-av" />
          ) : (
            <div className="jd-author-card-av jd-author-av-placeholder">
              {authorName.charAt(0)}
            </div>
          )}
          <div className="jd-author-card-body">
            <div className="jd-author-card-role">About the author</div>
            <div className="jd-author-card-name">{authorName}</div>
            <p className="jd-author-card-bio">
              {authorRole} — part of the Escora editorial team, writing from the ground across Kerala's most storied landscapes and communities.
            </p>
          </div>
        </div>
      </div>

      {/* ── Related posts ── */}
      {relatedPosts.length > 0 && (
        <section className="jd-related">
          <div className="jd-related-inner">
            <div className="jd-related-head">
              <div className="jd-related-eyebrow"><span className="jd-dot" />More from the Journal</div>
              <Link href="/journal" className="jd-related-all">View all →</Link>
            </div>
            <div className="jd-related-grid">
              {relatedPosts.map((rp, i) => (
                <Link key={(rp as any).id} href={`/journal/${(rp as any).id}`} className="jd-rcard">
                  <div className="jd-rcard-img-wrap">
                    <img
                      src={(rp as any).imageUrl ?? "https://images.unsplash.com/photo-1444927714506-8492d94b4e3d?auto=format&fit=crop&w=800&q=80"}
                      alt={(rp as any).title}
                      className="jd-rcard-img"
                    />
                    <span className="jd-rcard-num">0{i + 1}</span>
                  </div>
                  <div className="jd-rcard-body">
                    <div className="jd-rcard-cat">{rp.category}</div>
                    <h3 className="jd-rcard-title">{(rp as any).title}</h3>
                    <div className="jd-rcard-time">{(rp as any).readTimeMinutes} min read</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
}
