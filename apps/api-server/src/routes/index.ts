import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import destinationsRouter from "./destinations";
import packagesRouter from "./packages";
import ordersRouter from "./orders";
import journalRouter from "./journal";
import mediaRouter from "./media";
import dashboardRouter from "./dashboard";
import travelCategoriesRouter from "./travel-categories";
import enquiriesRouter from "./enquiries";
import itinerariesRouter from "./itineraries";
import aiRouter from "./ai";
import invoicesRouter from "./invoices";
import { requireAuth } from "../middleware/auth";
import { notFoundHandler } from "../middleware/not-found";

const router: IRouter = Router();

// Public: health + auth + AI foundation
router.use(healthRouter);
router.use(authRouter);
router.use(aiRouter);

// Public GETs, protected writes — destinations, packages, journal
// GET /destinations, GET /destinations/:id  → public
// POST/PATCH/DELETE /destinations/*         → admin only
router.get("/destinations", destinationsRouter);
router.get("/destinations/:id", destinationsRouter);
router.post("/destinations", requireAuth, destinationsRouter);
router.patch("/destinations/:id", requireAuth, destinationsRouter);
router.delete("/destinations/:id", requireAuth, destinationsRouter);

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

// Orders: POST is public (enquiry from customer site), rest needs auth
router.post("/orders", ordersRouter);
router.get("/orders/export", requireAuth, ordersRouter);
router.get("/orders", requireAuth, ordersRouter);
router.get("/orders/:id", requireAuth, ordersRouter);
router.patch("/orders/:id", requireAuth, ordersRouter);
router.delete("/orders/:id", requireAuth, ordersRouter);

// Contact enquiries: POST is public, rest needs auth
router.post("/enquiries", enquiriesRouter);
router.get("/enquiries", requireAuth, enquiriesRouter);
router.get("/enquiries/:id", requireAuth, enquiriesRouter);
router.patch("/enquiries/:id", requireAuth, enquiriesRouter);
router.delete("/enquiries/:id", requireAuth, enquiriesRouter);
router.post("/enquiries/:id/ai-assist", requireAuth, enquiriesRouter);

// Itineraries: share-by-token lookup is public, everything else admin only
router.get("/itineraries/share/:token", itinerariesRouter);
router.get("/itineraries", requireAuth, itinerariesRouter);
router.post("/itineraries", requireAuth, itinerariesRouter);
router.post("/itineraries/ai-assist", requireAuth, itinerariesRouter);
router.get("/itineraries/:id", requireAuth, itinerariesRouter);
router.patch("/itineraries/:id", requireAuth, itinerariesRouter);
router.delete("/itineraries/:id", requireAuth, itinerariesRouter);

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

// Media: uploaded files must be publicly servable
router.get("/media/files/:name", mediaRouter);
router.get("/media", requireAuth, mediaRouter);
router.post("/media/upload", requireAuth, mediaRouter);
router.post("/media", requireAuth, mediaRouter);
router.delete("/media/:id", requireAuth, mediaRouter);

// Admin dashboard stats
router.use("/dashboard", requireAuth, dashboardRouter);

// 404 for any unmatched /api/* route
router.use(notFoundHandler);

export default router;
