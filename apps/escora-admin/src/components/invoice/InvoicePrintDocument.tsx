import type { InvoiceData } from "@/lib/invoices";
import {
  parseInvoiceItems,
  parseInvoiceBankDetails,
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
  const amountWords = numberToIndianWords(invoice.totalAmount);
  const statusUpper = (invoice.status || "ISSUED").toUpperCase().replace("_", " ");

  return (
    <div id={id} className="print-invoice-wrapper" style={{ display: "none" }}>
      <section
        className="a4-page relative overflow-hidden"
        style={{
          width: PAGE_WIDTH_PX,
          minHeight: 1122.5,
          backgroundColor: PAPER_BG,
          fontFamily: "'Playfair Display', Georgia, serif",
          color: "#18201b",
          boxSizing: "border-box",
        }}
      >
        <div className="p-12 h-full flex flex-col justify-between" style={{ minHeight: 1122.5 }}>
          {/* Top Letterhead Header */}
          <div>
            <div className="flex justify-between items-start pb-6 border-b border-stone-200">
              <div className="space-y-1 max-w-[420px]">
                <img
                  src={escoraWordmarkPath}
                  alt="Escora"
                  className="h-8 w-auto mb-2 brightness-0 opacity-90"
                />
                <p className="text-[10px] font-mono tracking-[0.2em] uppercase font-bold text-[#153925]">
                  Escora Holidays Private Limited
                </p>
                <p className="text-[11px] leading-relaxed text-stone-600 font-sans">
                  Door No. 4/120, Mavoor Road, Kozhikode, Kerala - 673004, India<br />
                  GSTIN: 32AABCE9876K1Z9 | PAN: AABCE9876K<br />
                  Email: concierge@escoraholidays.com | Web: www.escoraholidays.com
                </p>
              </div>

              <div className="flex flex-col items-end">
                <img
                  src={escoraLogoMarkPath}
                  alt="Escora Seal"
                  className="h-16 w-auto mb-3"
                />
                <div className="text-right">
                  <h1 className="text-2xl font-serif font-bold tracking-widest uppercase text-stone-900">
                    Tax Invoice
                  </h1>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded text-[10px] font-mono tracking-wider uppercase font-semibold border border-stone-300 bg-stone-100 text-[#153925]">
                    {statusUpper}
                  </span>
                </div>
              </div>
            </div>

            {/* Meta Details: Invoice & Client */}
            <div className="grid grid-cols-2 gap-8 my-6 text-sm font-sans">
              {/* Billed To */}
              <div className="bg-stone-50/80 p-4 rounded border border-stone-200">
                <p className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#153925] mb-2">
                  Billed To
                </p>
                <p className="text-base font-serif font-bold text-stone-900 leading-snug">
                  {invoice.customerName}
                </p>
                {invoice.customerPhone && (
                  <p className="text-xs text-stone-600 mt-1">Tel: {invoice.customerPhone}</p>
                )}
                {invoice.customerEmail && (
                  <p className="text-xs text-stone-600">Email: {invoice.customerEmail}</p>
                )}
                {invoice.customerAddress && (
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed whitespace-pre-line">
                    {invoice.customerAddress}
                  </p>
                )}
                {invoice.customerGstin && (
                  <p className="text-xs font-mono text-stone-800 font-medium mt-1">
                    GSTIN: {invoice.customerGstin}
                  </p>
                )}
              </div>

              {/* Invoice Specifics */}
              <div className="bg-stone-50/80 p-4 rounded border border-stone-200 flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#153925] mb-2">
                    Invoice Details
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <div>
                      <span className="text-stone-500 block">Invoice Number:</span>
                      <span className="font-mono font-bold text-stone-900 text-sm">
                        {invoice.invoiceNumber}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-500 block">Date of Issue:</span>
                      <span className="font-medium text-stone-900">{formatDate(invoice.issueDate)}</span>
                    </div>
                    {invoice.dueDate && (
                      <div>
                        <span className="text-stone-500 block">Due Date:</span>
                        <span className="font-medium text-stone-900">{formatDate(invoice.dueDate)}</span>
                      </div>
                    )}
                    {invoice.destination && (
                      <div>
                        <span className="text-stone-500 block">Destination:</span>
                        <span className="font-medium text-stone-900">{invoice.destination}</span>
                      </div>
                    )}
                  </div>
                </div>

                {invoice.travelDates && (
                  <div className="pt-2 mt-2 border-t border-stone-200 text-xs text-stone-600">
                    <span className="text-stone-500">Travel Period: </span>
                    <span className="font-medium text-stone-900">{invoice.travelDates}</span>
                    {invoice.guestCount ? ` (${invoice.guestCount} Guests)` : ""}
                  </div>
                )}
              </div>
            </div>

            {/* Subject / Journey Title */}
            <div className="mb-6 px-4 py-2.5 rounded bg-stone-50 border-l-2 border-[#153925]">
              <span className="text-[10px] font-mono tracking-widest uppercase font-semibold text-[#153925] block">
                Journey / Service Reference
              </span>
              <p className="text-sm font-serif font-bold text-stone-900">{invoice.title}</p>
            </div>

            {/* Line Items Table */}
            <div className="rounded border border-stone-200 overflow-hidden bg-white mb-6">
              <table className="w-full text-left font-sans text-xs">
                <thead>
                  <tr className="bg-[#153925] text-white font-mono text-[10px] uppercase tracking-wider">
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-4">Service Description</th>
                    <th className="py-2.5 px-3 w-20 text-center">HSN/SAC</th>
                    <th className="py-2.5 px-3 w-14 text-center">Qty</th>
                    <th className="py-2.5 px-4 w-28 text-right">Rate ({invoice.currency})</th>
                    <th className="py-2.5 px-4 w-28 text-right">Amount ({invoice.currency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-stone-400 italic">
                        No line items specified.
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-stone-50/50">
                        <td className="py-3 px-3 text-center text-stone-500 font-mono">{idx + 1}</td>
                        <td className="py-3 px-4 font-medium text-stone-900 whitespace-pre-line leading-relaxed">
                          {item.description}
                        </td>
                        <td className="py-3 px-3 text-center text-stone-500 font-mono">
                          {item.hsnSac || "998555"}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-stone-700">
                          {item.quantity || 1}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-stone-800">
                          {formatMoney(item.rate, invoice.currency)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-stone-900">
                          {formatMoney(item.amount || item.quantity * item.rate, invoice.currency)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Totals Section */}
              <div className="border-t border-stone-200 bg-stone-50/80 p-4 font-sans text-xs">
                <div className="flex justify-between items-start">
                  {/* Amount in words */}
                  <div className="max-w-[420px] pr-4 space-y-1">
                    <span className="text-[10px] font-mono tracking-wider uppercase font-semibold text-[#153925] block">
                      Amount Chargeable (in words):
                    </span>
                    <p className="text-xs font-serif italic text-stone-800 leading-snug font-semibold">
                      {amountWords}
                    </p>
                  </div>

                  {/* Calculations breakdown */}
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between text-stone-600">
                      <span>Subtotal:</span>
                      <span className="font-mono font-medium">{formatMoney(invoice.subtotal, invoice.currency)}</span>
                    </div>

                    {invoice.discount > 0 && (
                      <div className="flex justify-between text-stone-600">
                        <span>
                          Discount {invoice.discountType === "percentage" ? `(${invoice.discount}%)` : ""}:
                        </span>
                        <span className="font-mono font-medium">
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
                      <div className="flex justify-between text-stone-600">
                        <span>GST ({invoice.taxRate}% Tour Operator):</span>
                        <span className="font-mono font-medium">{formatMoney(invoice.taxAmount, invoice.currency)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-sm font-bold text-[#153925] pt-2 border-t border-stone-200">
                      <span>Grand Total:</span>
                      <span className="font-mono text-base font-bold text-[#153925]">
                        {formatMoney(invoice.totalAmount, invoice.currency)}
                      </span>
                    </div>

                    {invoice.paidAmount > 0 && (
                      <div className="flex justify-between text-stone-600 pt-1 border-t border-stone-200">
                        <span>Paid Amount:</span>
                        <span className="font-mono text-emerald-800 font-semibold">
                          {formatMoney(invoice.paidAmount, invoice.currency)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between text-xs font-bold text-stone-900 pt-1">
                      <span>Balance Due:</span>
                      <span className="font-mono text-[#153925]">
                        {formatMoney(invoice.balanceDue, invoice.currency)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bank Transfer Details & Signatory */}
            <div className="grid grid-cols-2 gap-6 my-4 font-sans text-xs">
              <div className="bg-stone-50/80 p-3.5 rounded border border-stone-200 space-y-1.5">
                <p className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#153925]">
                  Bank Settlement Details
                </p>
                <div className="grid grid-cols-2 gap-1 text-[11px] text-stone-700">
                  <span className="text-stone-500">Bank:</span>
                  <span className="font-medium">{bank.bankName}</span>
                  <span className="text-stone-500">Account Name:</span>
                  <span className="font-medium text-[10px] truncate">{bank.accountName}</span>
                  <span className="text-stone-500">Account No:</span>
                  <span className="font-mono font-bold text-stone-900">{bank.accountNumber}</span>
                  <span className="text-stone-500">IFSC Code:</span>
                  <span className="font-mono font-bold text-stone-900">{bank.ifsc}</span>
                  {bank.upiId && (
                    <>
                      <span className="text-stone-500">UPI ID:</span>
                      <span className="font-mono text-stone-900">{bank.upiId}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="bg-stone-50/80 p-3.5 rounded border border-stone-200 flex flex-col justify-between items-end text-right">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#153925]">
                    For Escora Holidays Pvt Ltd
                  </p>
                  <p className="text-[10px] text-stone-500 mt-0.5">Authorised Signatory</p>
                </div>
                <div className="pt-8">
                  <div className="border-t border-stone-400 w-44 inline-block pt-1 text-[10px] text-stone-500 font-sans">
                    Authorised Signature &amp; Stamp
                  </div>
                </div>
              </div>
            </div>

            {/* Terms and Notes */}
            {(invoice.terms || invoice.notes) && (
              <div className="mt-4 pt-3 border-t border-stone-200 font-sans text-[10px] text-stone-600 space-y-1">
                {invoice.notes && <p className="italic text-stone-700">{invoice.notes}</p>}
                {invoice.terms && (
                  <div className="space-y-0.5 text-stone-500">
                    <span className="font-semibold text-stone-700 uppercase tracking-wider block">
                      Terms &amp; Conditions:
                    </span>
                    <p className="whitespace-pre-line leading-relaxed">{invoice.terms}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Note */}
          <div className="pt-4 border-t border-stone-200 text-center font-mono text-[9px] uppercase tracking-widest text-stone-500">
            Escora Holidays Private Limited · Bespoke Curated Travel · Kozhikode, Kerala, India
          </div>
        </div>
      </section>
    </div>
  );
}
