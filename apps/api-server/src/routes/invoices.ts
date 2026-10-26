import { Router, type IRouter } from "express";
import { InvoiceModel, NotificationModel, getNextSequence, type IInvoiceAuditEntry } from "@workspace/db";
import { logger } from "../lib/logger";
import {
  triggerPaymentReceipt,
  schedulePaymentDeadlineReminder,
} from "../services/notification-service";
import { triggerWhatsAppPaymentReceipt } from "../services/whatsapp";
import {
  calculateAuthoritativeTotals,
  validateInvoicePayload,
  parseInvoiceAuditTrail,
} from "../lib/invoiceCalculations";

const router: IRouter = Router();

function serializeDates<T extends { createdAt: Date; updatedAt: Date }>(row: T) {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// Generate guaranteed unique sequential invoice number e.g. ESC-INV-2026-0001
async function getUniqueInvoiceNumber(requested?: string): Promise<string> {
  const year = new Date().getFullYear();
  if (requested && requested.trim()) {
    const existing = await InvoiceModel.findOne({ invoiceNumber: requested.trim() }).lean();
    if (!existing) return requested.trim();
  }

  let seq = await getNextSequence("invoices");
  let candidate = `ESC-INV-${year}-${String(seq).padStart(4, "0")}`;
  let exists = await InvoiceModel.findOne({ invoiceNumber: candidate }).lean();
  while (exists) {
    seq = await getNextSequence("invoices");
    candidate = `ESC-INV-${year}-${String(seq).padStart(4, "0")}`;
    exists = await InvoiceModel.findOne({ invoiceNumber: candidate }).lean();
  }
  return candidate;
}

// Get next sequential invoice number preview
router.get("/invoices/next-number", async (_req, res): Promise<void> => {
  try {
    const year = new Date().getFullYear();
    const count = await InvoiceModel.countDocuments();
    const candidate = `ESC-INV-${year}-${String(count + 1).padStart(4, "0")}`;
    res.json({ invoiceNumber: candidate });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate invoice number" });
  }
});

router.get("/invoices", async (req, res): Promise<void> => {
  const { status, search } = req.query as { status?: string; search?: string };

  const filter: Record<string, any> = {};
  if (status && status !== "all") {
    filter.status = status;
  }
  if (search && typeof search === "string" && search.trim()) {
    const q = search.trim();
    filter.$or = [
      { invoiceNumber: { $regex: q, $options: "i" } },
      { customerName: { $regex: q, $options: "i" } },
      { customerEmail: { $regex: q, $options: "i" } },
      { title: { $regex: q, $options: "i" } },
      { destination: { $regex: q, $options: "i" } },
    ];
  }

  try {
    const invoices = await InvoiceModel.find(filter).sort({ id: -1 }).lean();
    res.json(invoices.map(serializeDates));
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
});

router.post("/invoices", async (req, res): Promise<void> => {
  try {
    // 1. Validate payload
    const validation = validateInvoicePayload(req.body);
    if (!validation.isValid) {
      res.status(400).json({ error: validation.error || "Invalid invoice data" });
      return;
    }

    // 2. Guaranteed sequence ID and unique invoice number
    const id = await getNextSequence("invoices");
    const invoiceNumber = await getUniqueInvoiceNumber(req.body.invoiceNumber);

    // 3. Authoritative calculation of line items, discounts, taxes, and totals
    const computed = calculateAuthoritativeTotals({
      items: req.body.items,
      discount: req.body.discount,
      discountType: req.body.discountType,
      taxRate: req.body.taxRate,
      taxType: req.body.taxType,
      paidAmount: req.body.paidAmount,
      payments: req.body.payments,
      dueDate: req.body.dueDate,
      status: req.body.status,
    });

    // 4. Initial audit entry
    const initialAudit: IInvoiceAuditEntry[] = [
      {
        timestamp: new Date().toISOString(),
        action: "created",
        user: req.body.createdBy || "Admin",
        details: `Invoice created with status "${computed.derivedStatus}" (Total: ₹${computed.totalAmount})`,
        newStatus: computed.derivedStatus,
      },
    ];

    const invoice = await InvoiceModel.create({
      ...req.body,
      id,
      invoiceNumber,
      items: computed.itemsJson,
      subtotal: computed.subtotal,
      discount: Number(req.body.discount) || 0,
      discountType: req.body.discountType || "fixed",
      taxType: computed.taxType,
      taxRate: computed.taxRate,
      taxableAmount: computed.taxableAmount,
      taxAmount: computed.taxAmount,
      cgstAmount: computed.cgstAmount,
      sgstAmount: computed.sgstAmount,
      igstAmount: computed.igstAmount,
      totalAmount: computed.totalAmount,
      paidAmount: computed.paidAmount,
      balanceDue: computed.balanceDue,
      payments: computed.paymentsJson,
      status: computed.derivedStatus,
      auditTrail: JSON.stringify(initialAudit),
      revision: 1,
    });

    const invoiceObj = invoice.toObject();

    // Schedule payment reminder if dueDate is set and balance is due
    if (invoiceObj.dueDate && invoiceObj.balanceDue > 0 && invoiceObj.status !== "draft") {
      schedulePaymentDeadlineReminder(invoiceObj).catch((err) => {
        logger.error({ err: err?.message, invoiceId: invoiceObj.id }, "[InvoiceRoute] Failed to schedule payment deadline reminder");
      });
    }

    res.status(201).json(serializeDates(invoiceObj));
  } catch (error: any) {
    console.error("Error creating invoice:", error);
    res.status(400).json({ error: error.message || "Failed to create invoice" });
  }
});

router.get("/invoices/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid invoice ID" });
    return;
  }

  try {
    const invoice = await InvoiceModel.findOne({ id }).lean();
    if (!invoice) {
      res.status(404).json({ error: "Invoice not found" });
      return;
    }
    res.json(serializeDates(invoice));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch invoice" });
  }
});

router.patch("/invoices/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid invoice ID" });
    return;
  }

  try {
    const existing = await InvoiceModel.findOne({ id }).lean();
    if (!existing) {
      res.status(404).json({ error: "Invoice not found" });
      return;
    }

    // Check unique invoice number if updating number
    if (req.body.invoiceNumber && req.body.invoiceNumber.trim() !== existing.invoiceNumber) {
      const duplicate = await InvoiceModel.findOne({
        invoiceNumber: req.body.invoiceNumber.trim(),
        id: { $ne: id },
      }).lean();
      if (duplicate) {
        res.status(400).json({ error: `Invoice number "${req.body.invoiceNumber}" is already in use by another invoice.` });
        return;
      }
    }

    // 1. Authoritative recalculation of all financial fields
    const computed = calculateAuthoritativeTotals({
      items: req.body.items !== undefined ? req.body.items : existing.items,
      discount: req.body.discount !== undefined ? req.body.discount : existing.discount,
      discountType: req.body.discountType !== undefined ? req.body.discountType : existing.discountType,
      taxRate: req.body.taxRate !== undefined ? req.body.taxRate : existing.taxRate,
      taxType: req.body.taxType !== undefined ? req.body.taxType : existing.taxType,
      paidAmount: req.body.paidAmount !== undefined ? req.body.paidAmount : existing.paidAmount,
      payments: req.body.payments !== undefined ? req.body.payments : existing.payments,
      dueDate: req.body.dueDate !== undefined ? req.body.dueDate : existing.dueDate,
      status: req.body.status !== undefined ? req.body.status : existing.status,
    });

    // 2. Audit Trail & Revision Management
    const auditEntries = parseInvoiceAuditTrail(existing.auditTrail);
    const revisionReason = req.body.revisionReason || req.body.cancellationReason;
    const isIssuedState = existing.status !== "draft";
    let nextRevision = existing.revision || 1;

    let auditAction = "updated";
    let auditDetails = revisionReason || "Invoice updated";

    const oldPaid = Number(existing.paidAmount) || 0;
    const newPaid = computed.paidAmount;

    if (newPaid > oldPaid) {
      auditAction = "payment_recorded";
      auditDetails = `Payment of ₹${newPaid - oldPaid} recorded. New balance: ₹${computed.balanceDue}`;
    } else if (req.body.status === "cancelled" && existing.status !== "cancelled") {
      auditAction = "cancelled";
      auditDetails = `Invoice cancelled. Reason: ${req.body.cancellationReason || "No reason specified"}`;
    } else if (req.body.status && req.body.status !== existing.status) {
      auditAction = "status_changed";
      auditDetails = `Status changed from "${existing.status}" to "${computed.derivedStatus}"`;
    } else if (isIssuedState) {
      nextRevision += 1;
      auditAction = "revised";
      auditDetails = revisionReason || `Revision ${nextRevision} applied`;
    }

    auditEntries.push({
      timestamp: new Date().toISOString(),
      action: auditAction,
      user: req.body.createdBy || "Admin",
      details: auditDetails,
      previousStatus: existing.status,
      newStatus: computed.derivedStatus,
    });

    const updates: Record<string, any> = {
      ...req.body,
      items: computed.itemsJson,
      subtotal: computed.subtotal,
      discount: req.body.discount !== undefined ? Number(req.body.discount) : existing.discount,
      discountType: req.body.discountType !== undefined ? req.body.discountType : existing.discountType,
      taxType: computed.taxType,
      taxRate: computed.taxRate,
      taxableAmount: computed.taxableAmount,
      taxAmount: computed.taxAmount,
      cgstAmount: computed.cgstAmount,
      sgstAmount: computed.sgstAmount,
      igstAmount: computed.igstAmount,
      totalAmount: computed.totalAmount,
      paidAmount: computed.paidAmount,
      balanceDue: computed.balanceDue,
      payments: computed.paymentsJson,
      status: computed.derivedStatus,
      auditTrail: JSON.stringify(auditEntries),
      revision: nextRevision,
      updatedAt: new Date(),
    };

    const updated = await InvoiceModel.findOneAndUpdate({ id }, { $set: updates }, { new: true }).lean();
    if (!updated) {
      res.status(404).json({ error: "Invoice not found" });
      return;
    }

    // Trigger payment receipt if payment recorded or invoice transitioned to paid/partially_paid
    const newPaidAmount = Number(updated.paidAmount) || 0;
    const oldPaidAmount = Number(existing.paidAmount) || 0;
    const paymentOccurred = newPaidAmount > oldPaidAmount || (existing.status !== "paid" && updated.status === "paid");

    if (paymentOccurred && newPaidAmount > 0) {
      const amountPaidNow = newPaidAmount > oldPaidAmount ? newPaidAmount - oldPaidAmount : newPaidAmount;
      triggerPaymentReceipt(updated, amountPaidNow).catch((err) => {
        logger.error({ err: err?.message, invoiceId: updated.id }, "[InvoiceRoute] Payment receipt trigger error");
      });
      triggerWhatsAppPaymentReceipt(updated).catch((err) => {
        logger.error({ err: err?.message, invoiceId: updated.id }, "[InvoiceRoute] WhatsApp payment receipt trigger error");
      });
    }

    // If dueDate changed and balance is still due, reschedule payment reminder
    if (updates.dueDate && updated.balanceDue > 0 && updated.status !== "paid" && updated.status !== "cancelled") {
      schedulePaymentDeadlineReminder(updated).catch(() => {});
    }

    // Safeguard: Invalidate scheduled payment reminders if invoice is paid, settled, or cancelled
    if (updated.status === "paid" || updated.status === "cancelled" || updated.balanceDue <= 0) {
      NotificationModel.updateMany(
        {
          relatedType: "invoice",
          relatedId: updated.id,
          type: "payment_deadline_reminder",
          status: "pending",
        },
        {
          $set: {
            status: "cancelled",
            error: `Invoice balance settled or cancelled (status: ${updated.status})`,
            updatedAt: new Date(),
          },
        }
      ).catch(() => {});
    }

    res.json(serializeDates(updated));
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Failed to update invoice" });
  }
});

router.delete("/invoices/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid invoice ID" });
    return;
  }

  try {
    const deleted = await InvoiceModel.findOneAndDelete({ id }).lean();
    if (!deleted) {
      res.status(404).json({ error: "Invoice not found" });
      return;
    }
    res.json({ success: true, id });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete invoice" });
  }
});

export default router;
