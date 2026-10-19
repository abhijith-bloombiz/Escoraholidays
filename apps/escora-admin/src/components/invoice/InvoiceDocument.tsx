import type { InvoiceData } from "@/lib/invoices";
import {
  parseInvoiceItems,
  parseInvoiceBankDetails,
  formatMoney,
  formatDate,
  numberToIndianWords,
} from "@/lib/invoices";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, Download, Pencil, CheckCircle2, Building, Calendar, Phone, Mail } from "lucide-react";
import escoraLogoMarkPath from "@assets/escora/escora-logo-mark.png";
import escoraWordmarkPath from "@assets/escora/escora-wordmark.png";

function statusBadge(status: string) {
  switch (status) {
    case "paid":
      return <Badge className="bg-emerald-800 hover:bg-emerald-900 text-white uppercase tracking-wider text-xs font-medium">Paid</Badge>;
    case "partially_paid":
      return <Badge className="bg-stone-700 hover:bg-stone-800 text-white uppercase tracking-wider text-xs font-medium">Partial</Badge>;
    case "overdue":
      return <Badge variant="destructive" className="uppercase tracking-wider text-xs font-medium">Overdue</Badge>;
    case "cancelled":
      return <Badge variant="outline" className="text-muted-foreground uppercase tracking-wider text-xs font-medium">Cancelled</Badge>;
    case "draft":
      return <Badge variant="secondary" className="uppercase tracking-wider text-xs font-medium">Draft</Badge>;
    default:
      return <Badge className="bg-[#183a27] hover:bg-[#122c1e] text-white uppercase tracking-wider text-xs font-medium">Issued</Badge>;
  }
}

export default function InvoiceDocument({
  invoice,
  onPrint,
  onEdit,
}: {
  invoice: InvoiceData;
  onPrint?: () => void;
  onEdit?: () => void;
}) {
  const items = parseInvoiceItems(invoice.items);
  const bank = parseInvoiceBankDetails(invoice.bankDetails);
  const amountWords = numberToIndianWords(invoice.totalAmount);

  return (
    <div className="bg-card border border-border rounded-xl shadow-lg max-w-4xl mx-auto overflow-hidden">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between px-6 py-4 border-b border-border bg-muted/40">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {invoice.invoiceNumber}
          </span>
          {statusBadge(invoice.status)}
        </div>
        <div className="flex items-center gap-2">
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit} className="gap-1.5">
              <Pencil className="h-3.5 w-3.5" />
              Edit Invoice
            </Button>
          )}
          {onPrint && (
            <Button size="sm" onClick={onPrint} className="gap-1.5 font-medium">
              <Printer className="h-3.5 w-3.5" />
              Print / PDF
            </Button>
          )}
        </div>
      </div>

      {/* Invoice Document Body */}
      <div className="p-8 md:p-12 space-y-8 bg-card text-foreground">
        {/* Header: Escora branding & Invoice Title */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-border pb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <img src={escoraWordmarkPath} alt="Escora" className="h-7 w-auto brightness-200" />
            </div>
            <p className="text-xs tracking-widest uppercase font-semibold text-[#183a27] dark:text-[#a3d9b5]">
              Escora Holidays Private Limited
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
              Door No. 4/120, Mavoor Road, Kozhikode, Kerala - 673004, India<br />
              GSTIN: 32AABCE9876K1Z9 | concierge@escoraholidays.com
            </p>
          </div>

          <div className="flex flex-col sm:items-end text-left sm:text-right">
            <img src={escoraLogoMarkPath} alt="Escora Seal" className="h-12 w-auto mb-2 opacity-90" />
            <h1 className="text-3xl font-serif font-bold tracking-tight text-foreground">
              TAX INVOICE
            </h1>
            <p className="font-mono text-sm font-semibold text-muted-foreground">{invoice.invoiceNumber}</p>
          </div>
        </div>

        {/* Client & Invoice Meta */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-lg border border-border/80 bg-muted/20 space-y-2">
            <p className="text-xs uppercase tracking-widest text-[#183a27] dark:text-[#a3d9b5] font-semibold">
              Billed To
            </p>
            <h3 className="text-lg font-serif font-bold text-foreground">{invoice.customerName}</h3>
            {invoice.customerPhone && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Phone className="h-3 w-3 text-muted-foreground" /> {invoice.customerPhone}
              </p>
            )}
            {invoice.customerEmail && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Mail className="h-3 w-3 text-muted-foreground" /> {invoice.customerEmail}
              </p>
            )}
            {invoice.customerAddress && (
              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line pt-1">
                {invoice.customerAddress}
              </p>
            )}
            {invoice.customerGstin && (
              <p className="text-xs font-mono font-medium text-foreground pt-1">
                GSTIN: {invoice.customerGstin}
              </p>
            )}
          </div>

          <div className="p-5 rounded-lg border border-border/80 bg-muted/20 space-y-3 flex flex-col justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-[#183a27] dark:text-[#a3d9b5] font-semibold mb-2">
                Trip Details
              </p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground block">Issue Date:</span>
                  <span className="font-medium text-foreground">{formatDate(invoice.issueDate)}</span>
                </div>
                {invoice.dueDate && (
                  <div>
                    <span className="text-muted-foreground block">Due Date:</span>
                    <span className="font-medium text-foreground">{formatDate(invoice.dueDate)}</span>
                  </div>
                )}
                {invoice.destination && (
                  <div>
                    <span className="text-muted-foreground block">Destination:</span>
                    <span className="font-medium text-foreground">{invoice.destination}</span>
                  </div>
                )}
                {invoice.guestCount && (
                  <div>
                    <span className="text-muted-foreground block">Guests:</span>
                    <span className="font-medium text-foreground">{invoice.guestCount} Travelers</span>
                  </div>
                )}
              </div>
            </div>

            {invoice.travelDates && (
              <div className="pt-2 border-t border-border/60 text-xs text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <span>Travel Dates: <strong className="text-foreground">{invoice.travelDates}</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* Journey Subject Reference */}
        <div className="p-4 rounded-lg bg-muted/30 border border-border">
          <span className="text-[11px] uppercase tracking-widest font-semibold text-[#183a27] dark:text-[#a3d9b5] block mb-0.5">
            Package Details
          </span>
          <p className="text-base font-serif font-semibold text-foreground">{invoice.title}</p>
        </div>

        {/* Line Items Table */}
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/60 text-muted-foreground text-xs uppercase tracking-wider font-semibold border-b border-border">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Service Description</th>
                <th className="py-3 px-3 w-24 text-center">SAC Code</th>
                <th className="py-3 px-3 w-16 text-center">Qty</th>
                <th className="py-3 px-4 w-32 text-right">Rate</th>
                <th className="py-3 px-4 w-32 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-muted-foreground italic">
                    No items added.
                  </td>
                </tr>
              ) : (
                items.map((item, i) => (
                  <tr key={i} className="hover:bg-muted/20">
                    <td className="py-3.5 px-4 text-center font-mono text-xs text-muted-foreground">{i + 1}</td>
                    <td className="py-3.5 px-4 font-medium text-foreground whitespace-pre-line leading-relaxed">
                      {item.description}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono text-xs text-muted-foreground">
                      {item.hsnSac || "998555"}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono text-foreground">{item.quantity}</td>
                    <td className="py-3.5 px-4 text-right text-muted-foreground tabular-nums">
                      {formatMoney(item.rate, invoice.currency)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-foreground tabular-nums">
                      {formatMoney(item.amount || item.quantity * item.rate, invoice.currency)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Breakdown & Amount in Words */}
          <div className="bg-muted/30 border-t border-border p-6">
            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
              <div className="space-y-2 max-w-md">
                <span className="text-xs uppercase tracking-widest text-[#183a27] dark:text-[#a3d9b5] font-semibold block">
                  Amount Chargeable (in words)
                </span>
                <p className="text-sm font-serif italic text-foreground font-semibold leading-relaxed">
                  {amountWords}
                </p>
                {invoice.paymentTerms && (
                  <p className="text-xs text-muted-foreground pt-2">
                    <strong>Payment Terms:</strong> {invoice.paymentTerms}
                  </p>
                )}
              </div>

              <div className="w-full md:w-72 space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal:</span>
                  <span className="tabular-nums font-medium text-foreground">{formatMoney(invoice.subtotal, invoice.currency)}</span>
                </div>

                {invoice.discount > 0 && (
                  <div className="flex justify-between text-stone-600">
                    <span>Discount {invoice.discountType === "percentage" ? `(${invoice.discount}%)` : ""}:</span>
                    <span className="tabular-nums font-medium">
                      -{formatMoney(
                        invoice.discountType === "percentage"
                          ? (invoice.subtotal * invoice.discount) / 100
                          : invoice.discount,
                        invoice.currency
                      )}
                    </span>
                  </div>
                )}

                {invoice.taxRate > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>GST ({invoice.taxRate}%):</span>
                    <span className="tabular-nums font-medium text-foreground">{formatMoney(invoice.taxAmount, invoice.currency)}</span>
                  </div>
                )}

                <div className="flex justify-between text-base font-bold text-foreground pt-3 border-t border-border">
                  <span>Total Amount:</span>
                  <span className="text-lg text-foreground font-bold tabular-nums">
                    {formatMoney(invoice.totalAmount, invoice.currency)}
                  </span>
                </div>

                {invoice.paidAmount > 0 && (
                  <div className="flex justify-between text-muted-foreground pt-1">
                    <span>Paid to date:</span>
                    <span className="text-emerald-600 font-semibold tabular-nums">
                      {formatMoney(invoice.paidAmount, invoice.currency)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-sm font-bold text-foreground pt-1 border-t border-border/50">
                  <span>Balance Due:</span>
                  <span className="text-[#183a27] dark:text-[#a3d9b5] font-bold tabular-nums">
                    {formatMoney(invoice.balanceDue, invoice.currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bank & Settlement Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-lg border border-border/80 bg-muted/20 space-y-2">
            <p className="text-xs uppercase tracking-widest text-[#183a27] dark:text-[#a3d9b5] font-semibold flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5" /> Bank Wire Details
            </p>
            <div className="grid grid-cols-2 gap-y-1 text-xs pt-1 text-muted-foreground">
              <span>Bank Name:</span>
              <strong className="text-foreground">{bank.bankName}</strong>
              <span>Account Name:</span>
              <strong className="text-foreground truncate">{bank.accountName}</strong>
              <span>Account Number:</span>
              <strong className="font-mono text-foreground">{bank.accountNumber}</strong>
              <span>IFSC Code:</span>
              <strong className="font-mono text-foreground">{bank.ifsc}</strong>
              {bank.upiId && (
                <>
                  <span>UPI ID:</span>
                  <strong className="font-mono text-foreground">{bank.upiId}</strong>
                </>
              )}
            </div>
          </div>

          <div className="p-5 rounded-lg border border-border/80 bg-muted/20 flex flex-col justify-between text-right">
            <div>
              <p className="text-xs uppercase tracking-widest text-[#183a27] dark:text-[#a3d9b5] font-semibold">
                Escora Holidays Pvt Ltd
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Authorised Signature</p>
            </div>
            <div className="pt-6">
              <div className="border-t border-border w-48 inline-block pt-1 text-[11px] text-muted-foreground font-medium">
                Certified Digital Document
              </div>
            </div>
          </div>
        </div>

        {/* Terms & Notes */}
        {(invoice.notes || invoice.terms) && (
          <div className="pt-4 border-t border-border space-y-3 text-xs text-muted-foreground">
            {invoice.notes && <p className="italic text-foreground/80">{invoice.notes}</p>}
            {invoice.terms && (
              <div className="space-y-1">
                <span className="uppercase tracking-wider text-[#183a27] dark:text-[#a3d9b5] block text-[11px] font-semibold">
                  Terms &amp; Conditions
                </span>
                <p className="whitespace-pre-line leading-relaxed">{invoice.terms}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
