import type { InvoiceData } from "@/lib/invoices";
import {
  parseInvoiceItems,
  parseInvoiceBankDetails,
  parseInvoicePayments,
  calculateInvoiceTotals,
  formatMoney,
  formatDate,
  numberToIndianWords,
} from "@/lib/invoices";
import { PAGE_WIDTH_PX } from "@/lib/measurePagination";
import escoraLogoMarkPath from "@assets/escora/escora-logo-mark.png";
import escoraWordmarkPath from "@assets/escora/escora-wordmark.png";

const PAPER_BG = "#ffffff";

export default function InvoicePrintDocument({
  invoice,
  id = "invoice-print-target",
}: {
  invoice: InvoiceData;
  id?: string;
}) {
  const items = parseInvoiceItems(invoice.items);
  const bank = parseInvoiceBankDetails(invoice.bankDetails);
  const payments = parseInvoicePayments(invoice.payments);

  // Authoritative calculations matching editor and backend
  const totals = calculateInvoiceTotals({
    items,
    discount: invoice.discount || 0,
    discountType: invoice.discountType || "fixed",
    taxRate: invoice.taxRate ?? 5,
    taxType: invoice.taxType || "cgst_sgst",
    paidAmount: invoice.paidAmount,
    payments,
    dueDate: invoice.dueDate,
    status: invoice.status,
  });

  const totalWords = numberToIndianWords(totals.totalAmount);
  const payableWords = numberToIndianWords(totals.balanceDue > 0 ? totals.balanceDue : totals.totalAmount);
  const statusUpper = (invoice.status || totals.derivedStatus || "ISSUED")
    .toUpperCase()
    .replace("_", " ");

  return (
    <div id={id} className="print-invoice-wrapper" style={{ display: "none" }}>
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0 !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            height: 297mm !important;
            max-height: 297mm !important;
            overflow: hidden !important;
            background: #ffffff !important;
          }
          #${id} {
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          #${id} .invoice-print-sheet {
            width: 210mm !important;
            height: 297mm !important;
            max-height: 297mm !important;
            overflow: hidden !important;
            box-sizing: border-box !important;
            background: #ffffff !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          #${id} tr {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          #${id} .avoid-break {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      <section
        className="invoice-print-sheet a4-page relative"
        style={{
          width: PAGE_WIDTH_PX,
          height: 1122.5,
          maxHeight: 1122.5,
          overflow: "hidden",
          backgroundColor: PAPER_BG,
          fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          color: "#18201b",
          boxSizing: "border-box",
        }}
      >
        <div className="px-9 py-6 h-full flex flex-col justify-between" style={{ height: "100%", boxSizing: "border-box" }}>
          <div className="space-y-3">
            {/* Top Letterhead Header */}
            <div className="flex justify-between items-start pb-3 border-b border-stone-200">
              <div className="space-y-1 max-w-[420px]">
                <img
                  src={escoraWordmarkPath}
                  alt="Escora"
                  className="h-6 w-auto mb-1 brightness-0 opacity-90"
                />
                <p className="text-[10px] font-sans tracking-[0.2em] uppercase font-bold text-[#153925]">
                  Escora Holidays Private Limited
                </p>
                <p className="text-[10px] leading-relaxed text-stone-600 font-sans">
                  Door No. 4/120, Mavoor Road, Kozhikode, Kerala - 673004, India<br />
                  GSTIN: 32AABCE9876K1Z9 | PAN: AABCE9876K<br />
                  Email: concierge@escoraholidays.com | Web: www.escoraholidays.com
                </p>
              </div>

              <div className="flex flex-col items-end">
                <img
                  src={escoraLogoMarkPath}
                  alt="Escora Seal"
                  className="h-12 w-auto mb-1.5"
                />
                <div className="text-right">
                  <h1 className="text-xl font-serif font-bold tracking-widest uppercase text-stone-900 leading-tight">
                    Tax Invoice
                  </h1>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[9.5px] font-sans tracking-wider uppercase font-semibold border border-stone-300 bg-stone-100 text-[#153925]">
                    {statusUpper}
                  </span>
                </div>
              </div>
            </div>

            {/* Meta Details: Invoice & Client */}
            <div className="grid grid-cols-2 gap-4 text-xs font-sans avoid-break">
              {/* Billed To */}
              <div className="bg-stone-50/80 p-3 rounded border border-stone-200">
                <p className="text-[9.5px] font-sans uppercase tracking-widest font-bold text-[#153925] mb-1">
                  Billed To
                </p>
                <p className="text-sm font-serif font-bold text-stone-900 leading-snug">
                  {invoice.customerName}
                </p>
                {invoice.customerPhone && (
                  <p className="text-[11px] text-stone-600 mt-0.5">Tel: {invoice.customerPhone}</p>
                )}
                {invoice.customerEmail && (
                  <p className="text-[11px] text-stone-600">Email: {invoice.customerEmail}</p>
                )}
                {invoice.customerAddress && (
                  <p className="text-[10.5px] text-stone-600 mt-0.5 leading-snug whitespace-pre-line">
                    {invoice.customerAddress}
                  </p>
                )}
                {invoice.customerGstin && (
                  <p className="text-[10.5px] font-mono text-stone-800 font-medium mt-0.5">
                    GSTIN: {invoice.customerGstin}
                  </p>
                )}
              </div>

              {/* Invoice Specifics */}
              <div className="bg-stone-50/80 p-3 rounded border border-stone-200 flex flex-col justify-between">
                <div>
                  <p className="text-[9.5px] font-sans uppercase tracking-widest font-bold text-[#153925] mb-1">
                    Invoice Details
                  </p>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                    <div>
                      <span className="text-stone-500 block text-[10px]">Invoice Number:</span>
                      <span className="font-mono font-bold text-stone-900 text-xs">
                        {invoice.invoiceNumber}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-500 block text-[10px]">Date of Issue:</span>
                      <span className="font-medium text-stone-900">{formatDate(invoice.issueDate)}</span>
                    </div>
                    {invoice.dueDate && (
                      <div>
                        <span className="text-stone-500 block text-[10px]">Due Date:</span>
                        <span className="font-medium text-stone-900">{formatDate(invoice.dueDate)}</span>
                      </div>
                    )}
                    {invoice.destination && (
                      <div>
                        <span className="text-stone-500 block text-[10px]">Destination:</span>
                        <span className="font-medium text-stone-900">{invoice.destination}</span>
                      </div>
                    )}
                    <div className="col-span-2">
                      <span className="text-stone-500 block text-[10px]">Tax Category:</span>
                      <span className="font-medium text-stone-900 capitalize">
                        {totals.taxType === "igst"
                          ? "Inter-State (IGST)"
                          : totals.taxType === "exempt"
                          ? "Exempt / Nil Rated"
                          : "Intra-State (CGST + SGST)"}
                      </span>
                    </div>
                  </div>
                </div>

                {invoice.travelDates && (
                  <div className="pt-1.5 mt-1 border-t border-stone-200 text-[10.5px] text-stone-600">
                    <span className="text-stone-500">Travel Period: </span>
                    <span className="font-medium text-stone-900">{invoice.travelDates}</span>
                    {invoice.guestCount ? ` (${invoice.guestCount} Guests)` : ""}
                  </div>
                )}
              </div>
            </div>

            {/* Subject / Journey Title */}
            <div className="px-3.5 py-1.5 rounded bg-stone-50 border-l-2 border-[#153925] avoid-break">
              <span className="text-[9px] font-sans tracking-widest uppercase font-semibold text-[#153925] block">
                Package Details
              </span>
              <p className="text-xs font-serif font-bold text-stone-900">{invoice.title}</p>
            </div>

            {/* Line Items Table */}
            <div className="rounded border border-stone-200 overflow-hidden bg-white">
              <table className="w-full text-left font-sans text-[11px]">
                <thead>
                  <tr className="bg-[#153925] text-white font-sans text-[9.5px] font-bold uppercase tracking-wider">
                    <th className="py-1.5 px-2.5 w-8 text-center">#</th>
                    <th className="py-1.5 px-3">Service Description</th>
                    <th className="py-1.5 px-2.5 w-16 text-center">HSN/SAC</th>
                    <th className="py-1.5 px-2.5 w-12 text-center">Qty</th>
                    <th className="py-1.5 px-3 w-24 text-right">Rate ({invoice.currency})</th>
                    <th className="py-1.5 px-3 w-24 text-right">Amount ({invoice.currency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {totals.items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-stone-400 italic">
                        No line items specified.
                      </td>
                    </tr>
                  ) : (
                    totals.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-stone-50/50">
                        <td className="py-2 px-2.5 text-center text-stone-500 font-mono">{idx + 1}</td>
                        <td className="py-2 px-3 font-medium text-stone-900 whitespace-pre-line leading-relaxed">
                          {item.description}
                        </td>
                        <td className="py-2 px-2.5 text-center text-stone-500 font-mono">
                          {item.hsnSac || "998555"}
                        </td>
                        <td className="py-2 px-2.5 text-center font-mono text-stone-700">
                          {item.quantity}
                        </td>
                        <td className="py-2 px-3 text-right font-sans text-stone-800 tabular-nums">
                          {formatMoney(item.rate, invoice.currency)}
                        </td>
                        <td className="py-2 px-3 text-right font-sans font-semibold text-stone-900 tabular-nums">
                          {formatMoney(item.amount, invoice.currency)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Totals Section */}
              <div className="border-t border-stone-200 bg-stone-50/80 p-3 font-sans text-[11px] avoid-break">
                <div className="flex justify-between items-start gap-4">
                  {/* Amount in words */}
                  <div className="max-w-[380px] pr-3 space-y-1.5">
                    <div>
                      <span className="text-[9.5px] font-sans tracking-wider uppercase font-semibold text-[#153925] block">
                        Amount Chargeable (in words):
                      </span>
                      <p className="text-[11px] font-serif italic text-stone-800 leading-snug font-semibold mt-0.5">
                        {totalWords}
                      </p>
                    </div>

                    {totals.balanceDue > 0 && totals.balanceDue !== totals.totalAmount && (
                      <div className="pt-1 border-t border-stone-200">
                        <span className="text-[9.5px] font-sans tracking-wider uppercase font-semibold text-[#153925] block">
                          Amount Currently Payable (Balance Due):
                        </span>
                        <p className="text-[11px] font-serif italic text-[#153925] leading-snug font-bold mt-0.5">
                          {payableWords}
                        </p>
                      </div>
                    )}

                    {/* Payment Schedule breakdown */}
                    <div className="pt-1 text-[10px] text-stone-600 space-y-0.5">
                      <p className="font-semibold text-stone-800">Agreed Payment Schedule:</p>
                      <p>• 50% Advance Booking Deposit: <strong>{formatMoney(totals.advance50Amount, invoice.currency)}</strong></p>
                      <p>• 50% Balance (Settlement): <strong>{formatMoney(totals.balance50Amount, invoice.currency)}</strong></p>
                    </div>
                  </div>

                  {/* Calculations breakdown */}
                  <div className="w-64 space-y-1">
                    <div className="flex justify-between text-stone-600">
                      <span>Subtotal:</span>
                      <span className="font-sans font-medium tabular-nums">{formatMoney(totals.subtotal, invoice.currency)}</span>
                    </div>

                    {totals.discountAmount > 0 && (
                      <div className="flex justify-between text-stone-600">
                        <span>
                          Discount {invoice.discountType === "percentage" ? `(${invoice.discount}%)` : ""}:
                        </span>
                        <span className="font-sans font-medium tabular-nums text-rose-800">
                          -{formatMoney(totals.discountAmount, invoice.currency)}
                        </span>
                      </div>
                    )}

                    {totals.discountAmount > 0 && (
                      <div className="flex justify-between text-stone-600 border-t border-dashed border-stone-200 pt-0.5">
                        <span>Taxable Value:</span>
                        <span className="font-sans font-medium tabular-nums">{formatMoney(totals.taxableAmount, invoice.currency)}</span>
                      </div>
                    )}

                    {/* Tax Breakdown */}
                    {totals.taxRate > 0 && totals.taxType === "cgst_sgst" && (
                      <>
                        <div className="flex justify-between text-stone-600">
                          <span>CGST ({totals.cgstRate}%):</span>
                          <span className="font-sans font-medium tabular-nums">+{formatMoney(totals.cgstAmount, invoice.currency)}</span>
                        </div>
                        <div className="flex justify-between text-stone-600">
                          <span>SGST ({totals.sgstRate}%):</span>
                          <span className="font-sans font-medium tabular-nums">+{formatMoney(totals.sgstAmount, invoice.currency)}</span>
                        </div>
                      </>
                    )}

                    {totals.taxRate > 0 && totals.taxType === "igst" && (
                      <div className="flex justify-between text-stone-600">
                        <span>IGST ({totals.igstRate}%):</span>
                        <span className="font-sans font-medium tabular-nums">+{formatMoney(totals.igstAmount, invoice.currency)}</span>
                      </div>
                    )}

                    {totals.taxRate === 0 && (
                      <div className="flex justify-between text-stone-600">
                        <span>GST (0% - Nil/Exempt):</span>
                        <span className="font-sans font-medium tabular-nums">₹0.00</span>
                      </div>
                    )}

                    <div className="flex justify-between text-xs font-bold text-[#153925] pt-1.5 border-t border-stone-200">
                      <span>Grand Total:</span>
                      <span className="font-sans text-sm font-bold text-[#153925] tabular-nums">
                        {formatMoney(totals.totalAmount, invoice.currency)}
                      </span>
                    </div>

                    {totals.paidAmount > 0 && (
                      <div className="flex justify-between text-stone-600 pt-0.5 border-t border-stone-200">
                        <span>Total Paid:</span>
                        <span className="font-sans text-emerald-800 font-semibold tabular-nums">
                          {formatMoney(totals.paidAmount, invoice.currency)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between text-xs font-bold text-stone-900 pt-1 border-t border-stone-300">
                      <span>Amount Payable:</span>
                      <span className="font-sans text-[#153925] text-xs font-bold tabular-nums">
                        {formatMoney(totals.balanceDue, invoice.currency)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recorded Payments History Table if payments exist */}
            {payments && payments.length > 0 && (
              <div className="rounded border border-stone-200 bg-stone-50/50 p-2.5 avoid-break">
                <p className="text-[9px] font-sans uppercase tracking-widest font-bold text-[#153925] mb-1">
                  Payment Settlement Acknowledgements
                </p>
                <table className="w-full text-left font-sans text-[10.5px]">
                  <thead>
                    <tr className="text-stone-500 border-b border-stone-200 text-[9px] uppercase">
                      <th className="py-0.5 px-2">Date</th>
                      <th className="py-0.5 px-2">Payment Method</th>
                      <th className="py-0.5 px-2">Reference / UTR</th>
                      <th className="py-0.5 px-2 text-right">Amount Received</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {payments.map((p, pIdx) => (
                      <tr key={pIdx}>
                        <td className="py-1 px-2 font-medium">{formatDate(p.date)}</td>
                        <td className="py-1 px-2 capitalize">{p.method?.replace("_", " ")}</td>
                        <td className="py-1 px-2 font-mono text-[10px]">{p.reference || "—"}</td>
                        <td className="py-1 px-2 text-right font-semibold text-emerald-800">
                          {formatMoney(p.amount, invoice.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Bank Transfer Details */}
            <div className="my-2 bg-stone-50/80 p-3 rounded border border-stone-200 font-sans text-[11px] avoid-break space-y-2">
              <div className="border-b border-stone-200/80 pb-1.5">
                <p className="text-[9.5px] font-sans uppercase tracking-widest font-bold text-[#153925]">
                  Bank Settlement Details
                </p>
              </div>
              <div className="grid grid-cols-3 gap-x-4 gap-y-1.5 text-[10px] text-stone-700">
                <div>
                  <span className="text-stone-500 block text-[9px]">Bank:</span>
                  <span className="font-medium text-stone-900">{bank.bankName}</span>
                </div>
                <div>
                  <span className="text-stone-500 block text-[9px]">Account Name:</span>
                  <span className="font-medium text-stone-900 truncate block">{bank.accountName}</span>
                </div>
                <div>
                  <span className="text-stone-500 block text-[9px]">Account No:</span>
                  <span className="font-mono font-bold text-stone-900">{bank.accountNumber}</span>
                </div>
                <div>
                  <span className="text-stone-500 block text-[9px]">IFSC Code:</span>
                  <span className="font-mono font-bold text-stone-900">{bank.ifsc}</span>
                </div>
                {bank.branch && (
                  <div>
                    <span className="text-stone-500 block text-[9px]">Branch:</span>
                    <span className="font-medium text-stone-900">{bank.branch}</span>
                  </div>
                )}
                {bank.upiId && (
                  <div>
                    <span className="text-stone-500 block text-[9px]">UPI ID:</span>
                    <span className="font-mono font-bold text-stone-900">{bank.upiId}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Terms and Notes */}
            {(invoice.terms || invoice.notes) && (
              <div className="mt-2 pt-1.5 border-t border-stone-200 font-sans text-[9.5px] text-stone-600 space-y-0.5 avoid-break">
                {invoice.notes && <p className="italic text-stone-700">{invoice.notes}</p>}
                {invoice.terms && (
                  <div className="space-y-0.5 text-stone-500">
                    <span className="font-semibold text-stone-700 uppercase tracking-wider block text-[9px]">
                      Terms &amp; Conditions:
                    </span>
                    <p className="whitespace-pre-line leading-tight">{invoice.terms}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Note */}
          <div className="pt-2 border-t border-stone-200 text-center font-sans text-[8.5px] uppercase tracking-widest text-stone-500 font-medium avoid-break">
            Escora Holidays Private Limited · Bespoke Curated Travel · Kozhikode, Kerala, India
          </div>
        </div>
      </section>
    </div>
  );
}
