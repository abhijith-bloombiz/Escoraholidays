import { Router, type IRouter } from "express";
import {
  DestinationModel,
  PackageModel,
  OrderModel,
  JournalPostModel,
  EnquiryModel,
  InvoiceModel,
  type Destination,
  type Package,
  type Order,
  type JournalPost,
  type Enquiry,
  type IInvoice,
} from "@workspace/db";
import { GetDashboardStatsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

function serializeDates<T extends { createdAt: Date; updatedAt: Date; convertedAt?: any; [key: string]: any }>(row: T) {
  return {
    ...row,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
    convertedAt: row.convertedAt
      ? (row.convertedAt instanceof Date ? row.convertedAt.toISOString() : String(row.convertedAt))
      : null,
  };
}

router.get("/stats", async (_req, res, next): Promise<void> => {
  try {
    let destinations: Destination[] = [];
    let packages: Package[] = [];
    let orders: Order[] = [];
    let journalPosts: JournalPost[] = [];
    let contactEnquiries: Enquiry[] = [];
    let invoices: IInvoice[] = [];

    try {
      [destinations, packages, orders, journalPosts, contactEnquiries, invoices] = await Promise.all([
        DestinationModel.find().lean(),
        PackageModel.find().lean(),
        OrderModel.find().lean(),
        JournalPostModel.find().lean(),
        EnquiryModel.find().lean(),
        InvoiceModel.find({ status: { $nin: ["cancelled", "draft"] } }).lean(),
      ]);
    } catch {
      // DB unavailable — return zeroed stats
    }

    const enquiries = orders.filter((o) => o.status === "enquiry").length;
    const confirmed = orders.filter((o) => o.status === "confirmed").length;
    // Actual collected revenue: Sum of verified paidAmount across non-cancelled, non-draft invoices
    const totalRevenue = invoices.reduce(
      (sum, inv) => sum + Math.max(0, Number(inv.paidAmount) || 0),
      0
    );
    const newContactEnquiries = contactEnquiries.filter((e) => e.status === "new").length;

    const recentOrders = orders
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(serializeDates);

    const statusCounts = orders.reduce<Record<string, number>>((acc, o) => {
      acc[o.status] = (acc[o.status] ?? 0) + 1;
      return acc;
    }, {});

    const ordersByStatus = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

    const stats = {
      totalDestinations: destinations.length,
      publishedDestinations: destinations.filter((d) => d.published).length,
      totalPackages: packages.length,
      publishedPackages: packages.filter((p) => p.published).length,
      totalOrders: orders.length,
      enquiries,
      confirmed,
      totalRevenue,
      newContactEnquiries,
      totalJournalPosts: journalPosts.length,
      publishedJournalPosts: journalPosts.filter((p) => p.published).length,
      recentOrders,
      ordersByStatus,
    };

    res.json(GetDashboardStatsResponse.parse(stats));
  } catch (err) {
    next(err);
  }
});

export default router;
