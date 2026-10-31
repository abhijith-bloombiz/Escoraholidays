import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import destinationsRouter from "./destinations";
import experiencesRouter from "./experiences";
import heroRouter from "./hero";
import packagesRouter from "./packages";
import ordersRouter from "./orders";
import journalRouter from "./journal";
import mediaRouter from "./media";
import dashboardRouter from "./dashboard";
import travelCategoriesRouter from "./travel-categories";
import testimonialsRouter from "./testimonials";
import enquiriesRouter from "./enquiries";
import itinerariesRouter from "./itineraries";
import itineraryTemplatesRouter from "./itinerary-templates";
import invoicesRouter from "./invoices";
import campaignsRouter from "./campaigns";
import notificationsRouter from "./notifications";
import whatsappRouter from "./whatsapp";
import whatsappWebhookRouter from "./whatsapp-webhook";
import aiRouter from "./ai";
import currencyRouter from "./currency";
import { requireAuth } from "../middleware/auth";
import { notFoundHandler } from "../middleware/not-found";

const router: IRouter = Router();

// Public: health + auth + AI foundation + currency + campaign unsubscribe
router.use(healthRouter);
router.use(authRouter);
router.use(aiRouter);
router.use(currencyRouter);
router.get("/campaigns/unsubscribe", campaignsRouter);
router.post("/campaigns/unsubscribe", campaignsRouter);
router.post("/campaigns/newsletter", campaignsRouter);
router.post("/newsletter/subscribe", campaignsRouter);
router.post("/campaigns/webhooks/resend", campaignsRouter);
router.use(whatsappWebhookRouter);


// Public GETs, protected writes — destinations, packages, journal
// GET /destinations, GET /destinations/:id  → public
// POST/PATCH/DELETE /destinations/*         → admin only
router.get("/destinations", destinationsRouter);
router.get("/destinations/:id", destinationsRouter);
router.post("/destinations", requireAuth, destinationsRouter);
router.patch("/destinations/:id", requireAuth, destinationsRouter);
router.delete("/destinations/:id", requireAuth, destinationsRouter);

router.get("/experiences", experiencesRouter);
router.get("/experiences/:id", experiencesRouter);
router.post("/experiences", requireAuth, experiencesRouter);
router.patch("/experiences/:id", requireAuth, experiencesRouter);
router.delete("/experiences/:id", requireAuth, experiencesRouter);

router.get("/hero/slides", heroRouter);
router.get("/hero/slides/:id", heroRouter);
router.post("/hero/slides", requireAuth, heroRouter);
router.patch("/hero/slides/:id", requireAuth, heroRouter);
router.delete("/hero/slides/:id", requireAuth, heroRouter);
router.get("/hero/config", heroRouter);
router.patch("/hero/config", requireAuth, heroRouter);

router.get("/packages", packagesRouter);
router.get("/packages/:id", packagesRouter);
router.post("/packages", requireAuth, packagesRouter);
router.patch("/packages/:id", requireAuth, packagesRouter);
router.delete("/packages/:id", requireAuth, packagesRouter);

router.get("/journal", journalRouter);
router.get("/journal/:id", journalRouter);
router.post("/journal/ai-assist", requireAuth, journalRouter);
router.post("/journal", requireAuth, journalRouter);
router.patch("/journal/:id", requireAuth, journalRouter);
router.delete("/journal/:id", requireAuth, journalRouter);

// Orders: Admin only (manual booking creation & management)
router.post("/orders", requireAuth, ordersRouter);
router.get("/orders/export", requireAuth, ordersRouter);
router.get("/orders", requireAuth, ordersRouter);
router.get("/orders/:id", requireAuth, ordersRouter);
router.patch("/orders/:id", requireAuth, ordersRouter);
router.delete("/orders/:id", requireAuth, ordersRouter);

// Contact enquiries: POST is public, rest needs auth
router.post("/enquiries", enquiriesRouter);
router.get("/enquiries", requireAuth, enquiriesRouter);
router.get("/enquiries/:id", requireAuth, enquiriesRouter);
router.get("/enquiries/:id/proposals", requireAuth, enquiriesRouter);
router.patch("/enquiries/:id", requireAuth, enquiriesRouter);
router.delete("/enquiries/:id", requireAuth, enquiriesRouter);
router.post("/enquiries/:id/ai-assist", requireAuth, enquiriesRouter);
router.post("/enquiries/:id/convert", requireAuth, enquiriesRouter);

// Itineraries: share-by-token lookup is public, everything else admin only
router.get("/itineraries/share/:token", itinerariesRouter);
router.get("/itineraries", requireAuth, itinerariesRouter);
router.post("/itineraries", requireAuth, itinerariesRouter);
router.post("/itineraries/ai-assist", requireAuth, itinerariesRouter);
router.get("/itineraries/:id", requireAuth, itinerariesRouter);
router.patch("/itineraries/:id", requireAuth, itinerariesRouter);
router.delete("/itineraries/:id", requireAuth, itinerariesRouter);

// Itinerary Templates: Admin only
router.get("/itinerary-templates", requireAuth, itineraryTemplatesRouter);
router.post("/itinerary-templates", requireAuth, itineraryTemplatesRouter);
router.get("/itinerary-templates/:id", requireAuth, itineraryTemplatesRouter);
router.patch("/itinerary-templates/:id", requireAuth, itineraryTemplatesRouter);
router.delete("/itinerary-templates/:id", requireAuth, itineraryTemplatesRouter);

// Invoices: admin only
router.get("/invoices", requireAuth, invoicesRouter);
router.post("/invoices", requireAuth, invoicesRouter);
router.get("/invoices/:id", requireAuth, invoicesRouter);
router.patch("/invoices/:id", requireAuth, invoicesRouter);
router.delete("/invoices/:id", requireAuth, invoicesRouter);

// Travel categories: public GETs, protected writes
router.get("/travel-categories", travelCategoriesRouter);
router.get("/travel-categories/:id", travelCategoriesRouter);
router.post("/travel-categories", requireAuth, travelCategoriesRouter);
router.patch("/travel-categories/:id", requireAuth, travelCategoriesRouter);
router.delete("/travel-categories/:id", requireAuth, travelCategoriesRouter);

// Testimonials: public GETs, protected writes
router.get("/testimonials", testimonialsRouter);
router.get("/testimonials/:id", testimonialsRouter);
router.post("/testimonials", requireAuth, testimonialsRouter);
router.patch("/testimonials/:id", requireAuth, testimonialsRouter);
router.delete("/testimonials/:id", requireAuth, testimonialsRouter);

// Media: uploaded files must be publicly servable
router.options("/media/files/:name", mediaRouter);
router.head("/media/files/:name", mediaRouter);
router.get("/media/files/:name", mediaRouter);
router.get("/media", requireAuth, mediaRouter);
router.post("/media/upload", requireAuth, mediaRouter);
router.post("/media", requireAuth, mediaRouter);
router.delete("/media/:id", requireAuth, mediaRouter);

// Campaigns: Admin only (drafting, audience resolution, approval, scheduling, sending)
router.use(requireAuth, campaignsRouter);

// Notifications & Delivery Audit: Admin only
router.use(requireAuth, notificationsRouter);

// WhatsApp Automation & Delivery Audit: Admin only
router.use(requireAuth, whatsappRouter);

// Admin dashboard stats
router.use("/dashboard", requireAuth, dashboardRouter);

// 404 for any unmatched /api/* route
router.use(notFoundHandler);

export default router;
