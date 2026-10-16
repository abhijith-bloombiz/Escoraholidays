import { Router, type IRouter } from "express";
import { InvoiceModel, getNextSequence } from "@workspace/db";
import { logger } from "../lib/logger";
import {
  triggerPaymentReceipt,
  schedulePaymentDeadlineReminder,
} from "../services/notification-service";

const router: IRouter = Router();

function serializeDates<T extends { createdAt: Date; updatedAt: Date }>(row: T) {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// Format invoice number e.g. ESC-INV-2026-0001
function generateInvoiceNumber(sequence: number): string {
  const year = new Date().getFullYear();
  const padded = String(sequence).padStart(4, "0");
  return `ESC-INV-${year}-${padded}`;
}

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
    const id = await getNextSequence("invoices");
    const invoiceNumber = req.body.invoiceNumber?.trim() || generateInvoiceNumber(id);

    // Compute balance due if not provided
    const totalAmount = Number(req.body.totalAmount) || 0;
    const paidAmount = Number(req.body.paidAmount) || 0;
    const balanceDue = req.body.balanceDue !== undefined ? Number(req.body.balanceDue) : Math.max(0, totalAmount - paidAmount);

    const invoice = await InvoiceModel.create({
      ...req.body,
      id,
      invoiceNumber,
      totalAmount,
      paidAmount,
      balanceDue,
    });

    const invoiceObj = invoice.toObject();

    if (invoiceObj.dueDate && invoiceObj.balanceDue > 0) {
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

    const updates = { ...req.body, updatedAt: new Date() };
    if (updates.totalAmount !== undefined || updates.paidAmount !== undefined) {
      const total = updates.totalAmount !== undefined ? Number(updates.totalAmount) : existing.totalAmount;
      const paid = updates.paidAmount !== undefined ? Number(updates.paidAmount) : existing.paidAmount;
      updates.balanceDue = Math.max(0, total - paid);
      if (updates.status === undefined) {
        if (updates.balanceDue === 0 && total > 0) {
          updates.status = "paid";
        } else if (paid > 0 && updates.balanceDue > 0) {
          updates.status = "partially_paid";
        }
      }
    }

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
    }

    // If dueDate changed and balance is still due, reschedule payment reminder
    if (updates.dueDate && updated.balanceDue > 0 && updated.status !== "paid") {
      schedulePaymentDeadlineReminder(updated).catch(() => {});
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
