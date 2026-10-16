import type { IOrder, IItinerary, IEnquiry, IInvoice } from "@workspace/db";
import { config } from "../config/env";

export interface RenderedEmail {
  subject: string;
  html: string;
}

const BRAND_HEADER = `
  <div style="font-family: monospace; font-size: 11px; letter-spacing: 0.2em; color: #cbab6e; text-transform: uppercase; margin-bottom: 24px;">
    Escora · Kerala
  </div>
`;

const BRAND_FOOTER = `
  <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e8dcc4; font-family: monospace; font-size: 11px; color: #9c8c7c; letter-spacing: 0.1em; line-height: 1.6;">
    Escora Holidays · Heritage House, 1/284 River Road, Fort Kochi, Kerala 682001 · +91 8157 003 344
  </div>
`;

function escapeHtml(str?: string | null): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Generates the official Booking Confirmation email for confirmed orders.
 * Triggered only when a booking first transitions to "confirmed".
 */
export function renderBookingConfirmationEmail(order: IOrder): RenderedEmail {
  const reference = `#${order.id}`;
  const subject = `Booking Confirmed: Kerala Slow Journey — Ref ${reference}`;

  const formattedAmount =
    order.totalAmount !== undefined && order.totalAmount !== null
      ? `₹${order.totalAmount.toLocaleString("en-IN")}`
      : "To be finalized with curator";

  const datesDisplay = [order.travelDate, order.departureDate].filter(Boolean).join(" to ") || "Flexible";

  const html = `
    <div style="font-family: Georgia, serif; max-width: 620px; margin: 0 auto; color: #1a1410; background: #faf9f7; padding: 44px 36px; border-radius: 8px;">
      ${BRAND_HEADER}
      <h1 style="font-weight: 300; font-size: 28px; line-height: 1.25; margin: 0 0 12px; color: #1a1410;">
        Your journey is confirmed, ${escapeHtml(order.guestName)}.
      </h1>
      <p style="color: #6b5d4f; margin: 0 0 32px; font-size: 15px; line-height: 1.6;">
        We are honored to confirm your Kerala slow-luxury journey. Below is your booking summary and confirmed travel details.
      </p>

      <div style="background: #ffffff; border: 1px solid #e8dcc4; border-radius: 6px; padding: 24px; margin-bottom: 32px;">
        <div style="font-family: monospace; font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: #cbab6e; margin-bottom: 16px;">
          Confirmed Booking Summary
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 9px 0; border-bottom: 1px solid #f0ece4; color: #8c7e6c; width: 150px;">Booking Ref</td>
            <td style="padding: 9px 0; border-bottom: 1px solid #f0ece4; font-family: monospace; font-weight: 600; color: #1a1410;">${reference}</td>
          </tr>
          ${order.packageName ? `
          <tr>
            <td style="padding: 9px 0; border-bottom: 1px solid #f0ece4; color: #8c7e6c;">Journey / Package</td>
            <td style="padding: 9px 0; border-bottom: 1px solid #f0ece4; font-weight: 500; color: #1a1410;">${escapeHtml(order.packageName)}</td>
          </tr>` : ""}
          ${order.destinations ? `
          <tr>
            <td style="padding: 9px 0; border-bottom: 1px solid #f0ece4; color: #8c7e6c;">Destinations</td>
            <td style="padding: 9px 0; border-bottom: 1px solid #f0ece4; color: #1a1410;">${escapeHtml(order.destinations)}</td>
          </tr>` : ""}
          <tr>
            <td style="padding: 9px 0; border-bottom: 1px solid #f0ece4; color: #8c7e6c;">Travel Dates</td>
            <td style="padding: 9px 0; border-bottom: 1px solid #f0ece4; color: #1a1410;">${escapeHtml(datesDisplay)}</td>
          </tr>
          ${order.guestCount ? `
          <tr>
            <td style="padding: 9px 0; border-bottom: 1px solid #f0ece4; color: #8c7e6c;">Guests</td>
            <td style="padding: 9px 0; border-bottom: 1px solid #f0ece4; color: #1a1410;">${order.guestCount} ${order.guestCount === 1 ? "Traveler" : "Travelers"}</td>
          </tr>` : ""}
          ${order.travelStyle ? `
          <tr>
            <td style="padding: 9px 0; border-bottom: 1px solid #f0ece4; color: #8c7e6c;">Travel Style</td>
            <td style="padding: 9px 0; border-bottom: 1px solid #f0ece4; color: #1a1410;">${escapeHtml(order.travelStyle)}</td>
          </tr>` : ""}
          <tr>
            <td style="padding: 9px 0; color: #8c7e6c;">Total Amount</td>
            <td style="padding: 9px 0; font-weight: 600; color: #1a1410;">${formattedAmount}</td>
          </tr>
        </table>
      </div>

      ${order.specialRequests ? `
      <div style="background: #f0ece4; border-left: 3px solid #cbab6e; padding: 16px 20px; margin-bottom: 32px; font-size: 13px; color: #4a3d30;">
        <strong style="display: block; margin-bottom: 4px; font-size: 12px; font-family: monospace; text-transform: uppercase; letter-spacing: 0.1em; color: #8c7e6c;">Your Special Preferences:</strong>
        ${escapeHtml(order.specialRequests)}
      </div>` : ""}

      <div style="border-top: 1px solid #e8dcc4; padding-top: 24px; margin-bottom: 32px;">
        <h3 style="font-size: 15px; font-weight: 600; margin: 0 0 8px; color: #1a1410;">What Happens Next</h3>
        <p style="color: #6b5d4f; font-size: 14px; line-height: 1.6; margin: 0 0 12px;">
          Your dedicated journey curator will reach out prior to your arrival to finalize private transfer logistics, dietary preferences, and personal touches.
        </p>
        <p style="color: #6b5d4f; font-size: 14px; line-height: 1.6; margin: 0;">
          If you need to make changes or speak to us directly, reply to this email or call us at <strong>+91 8157 003 344</strong>.
        </p>
      </div>

      ${BRAND_FOOTER}
    </div>
  `;

  return { subject, html };
}

/**
 * Generates an Itinerary Update notification for confirmed itineraries that experienced meaningful changes.
 */
export function renderItineraryUpdateEmail(
  itinerary: IItinerary,
  changesSummary: string[]
): RenderedEmail {
  const shareUrl = `${config.publicUrl.replace(/\/$/, "")}/itinerary/${itinerary.shareToken}`;
  const subject = `Updated Itinerary: ${itinerary.title} — Escora Holidays`;

  const datesDisplay = [itinerary.startDate, itinerary.endDate].filter(Boolean).join(" to ") || "Flexible";

  const changesListHtml = changesSummary
    .map(
      (c) =>
        `<li style="margin: 6px 0; color: #3d3227; font-size: 14px;">${escapeHtml(c)}</li>`
    )
    .join("");

  const html = `
    <div style="font-family: Georgia, serif; max-width: 620px; margin: 0 auto; color: #1a1410; background: #faf9f7; padding: 44px 36px; border-radius: 8px;">
      ${BRAND_HEADER}
      <h1 style="font-weight: 300; font-size: 26px; line-height: 1.3; margin: 0 0 12px; color: #1a1410;">
        Refinements to your itinerary, ${escapeHtml(itinerary.customerName)}.
      </h1>
      <p style="color: #6b5d4f; margin: 0 0 28px; font-size: 15px; line-height: 1.6;">
        Your journey designer has updated details for your confirmed Kerala journey: <strong>${escapeHtml(itinerary.title)}</strong>.
      </p>

      <div style="background: #ffffff; border: 1px solid #e8dcc4; border-radius: 6px; padding: 20px 24px; margin-bottom: 28px;">
        <div style="font-family: monospace; font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: #cbab6e; margin-bottom: 12px;">
          Summary of Updates
        </div>
        <ul style="margin: 0; padding-left: 20px;">
          ${changesListHtml}
        </ul>
      </div>

      <div style="background: #fdfbf7; border: 1px solid #e8dcc4; border-radius: 6px; padding: 20px 24px; margin-bottom: 32px; font-size: 14px;">
        <p style="margin: 0 0 8px;"><strong>Destination:</strong> ${escapeHtml(itinerary.destination || "Kerala")}</p>
        <p style="margin: 0 0 8px;"><strong>Dates:</strong> ${escapeHtml(datesDisplay)}</p>
        ${itinerary.curatorName ? `<p style="margin: 0;"><strong>Curator:</strong> ${escapeHtml(itinerary.curatorName)}</p>` : ""}
      </div>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${shareUrl}" style="background: #1a1410; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 4px; font-size: 14px; font-weight: 500; display: inline-block; letter-spacing: 0.05em;">
          View Your Updated Itinerary Online →
        </a>
      </div>

      <p style="color: #6b5d4f; font-size: 13px; line-height: 1.6; margin: 24px 0 0;">
        Have questions about these updates? Simply reply to this email to coordinate directly with your journey team.
      </p>

      ${BRAND_FOOTER}
    </div>
  `;

  return { subject, html };
}

/**
 * Generates an Enquiry Follow-Up email.
 * Non-intrusive, slow-luxury check-in for customers whose enquiry is pending.
 */
export function renderEnquiryFollowupEmail(
  enquiry: { name: string; email: string },
  unsubscribeUrl: string
): RenderedEmail {
  const subject = `Following up on your Kerala journey inquiry — Escora Holidays`;

  const html = `
    <div style="font-family: Georgia, serif; max-width: 620px; margin: 0 auto; color: #1a1410; background: #faf9f7; padding: 44px 36px; border-radius: 8px;">
      ${BRAND_HEADER}
      <h1 style="font-weight: 300; font-size: 26px; line-height: 1.3; margin: 0 0 16px; color: #1a1410;">
        Warm greetings from Kerala, ${escapeHtml(enquiry.name)}.
      </h1>
      <p style="color: #6b5d4f; margin: 0 0 20px; font-size: 15px; line-height: 1.6;">
        We wanted to gently follow up on your recent inquiry regarding a journey through Kerala.
      </p>
      <p style="color: #6b5d4f; margin: 0 0 20px; font-size: 15px; line-height: 1.6;">
        Crafting a meaningful travel experience often requires taking time to choose the right season, rhythm, and sanctuaries. Whether you are finalizing travel dates, exploring boutique heritage estates versus private backwater houseboats, or have questions about weather across regions, our journey curators are here to assist.
      </p>
      <p style="color: #6b5d4f; margin: 0 0 28px; font-size: 15px; line-height: 1.6;">
        If you would like to continue the conversation, simply reply to this email or call us directly at <strong>+91 8157 003 344</strong>.
      </p>

      <div style="background: #ffffff; border: 1px solid #e8dcc4; border-radius: 6px; padding: 20px; margin-bottom: 32px; font-size: 13px; color: #6b5d4f; line-height: 1.6;">
        <strong style="color: #1a1410; display: block; margin-bottom: 4px;">Our Slow Travel Promise:</strong>
        Handcrafted routes, private transfers, verified boutique heritage stays, and round-the-clock on-ground concierge support throughout Kerala.
      </div>

      <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e8dcc4; font-family: monospace; font-size: 11px; color: #9c8c7c; letter-spacing: 0.1em; line-height: 1.6;">
        <p style="margin: 0 0 8px;">Escora Holidays · Heritage House, 1/284 River Road, Fort Kochi, Kerala 682001 · +91 8157 003 344</p>
        <p style="margin: 0;">
          Prefer not to receive follow-up notes? <a href="${unsubscribeUrl}" style="color: #6b5d4f; text-decoration: underline;">Opt out here</a>.
        </p>
      </div>
    </div>
  `;

  return { subject, html };
}

/**
 * Generates a Post-Trip Feedback request email.
 * Triggered after an order reaches the completed state with a configurable delay.
 */
export function renderPostTripFeedbackEmail(
  order: { guestName: string; destinations?: string | null; id: number },
  reviewUrl: string,
  unsubscribeUrl: string
): RenderedEmail {
  const subject = `Welcome home from Kerala — How was your journey with Escora?`;
  const destinationText = order.destinations ? ` across ${escapeHtml(order.destinations)}` : " in Kerala";

  const html = `
    <div style="font-family: Georgia, serif; max-width: 620px; margin: 0 auto; color: #1a1410; background: #faf9f7; padding: 44px 36px; border-radius: 8px;">
      ${BRAND_HEADER}
      <h1 style="font-weight: 300; font-size: 26px; line-height: 1.3; margin: 0 0 16px; color: #1a1410;">
        Welcome home, ${escapeHtml(order.guestName)}.
      </h1>
      <p style="color: #6b5d4f; margin: 0 0 20px; font-size: 15px; line-height: 1.6;">
        We hope your journey${destinationText} was peaceful, restorative, and filled with memories of serene backwaters, cardamom hills, and warm Kerala hospitality.
      </p>
      <p style="color: #6b5d4f; margin: 0 0 28px; font-size: 15px; line-height: 1.6;">
        At Escora, we pour deep care into every stay, transfer, and quiet moment we curate. Your impressions and feedback are invaluable in helping us maintain the highest standard of personalized slow travel.
      </p>

      <div style="text-align: center; margin: 36px 0;">
        <a href="${reviewUrl}" style="background: #1a1410; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 4px; font-size: 14px; font-weight: 500; display: inline-block; letter-spacing: 0.05em;">
          Share Your Journey Feedback →
        </a>
      </div>

      <p style="color: #6b5d4f; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
        Thank you for trusting Escora with your travels. We look forward to welcoming you back to Kerala whenever you are ready for your next chapter.
      </p>

      <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e8dcc4; font-family: monospace; font-size: 11px; color: #9c8c7c; letter-spacing: 0.1em; line-height: 1.6;">
        <p style="margin: 0 0 8px;">Escora Holidays · Fort Kochi, Kerala 682001 · +91 8157 003 344</p>
        <p style="margin: 0;">
          <a href="${unsubscribeUrl}" style="color: #6b5d4f; text-decoration: underline;">Manage communication preferences</a>
        </p>
      </div>
    </div>
  `;

  return { subject, html };
}

/**
 * Generates official Payment Receipt email upon invoice payment confirmation.
 */
export function renderPaymentReceiptEmail(
  invoice: IInvoice,
  amountPaidNow?: number
): RenderedEmail {
  const subject = `Payment Received — Invoice #${invoice.invoiceNumber} — Escora`;
  const paidNowFormatted =
    amountPaidNow !== undefined && amountPaidNow !== null
      ? `₹${amountPaidNow.toLocaleString("en-IN")}`
      : `₹${invoice.paidAmount.toLocaleString("en-IN")}`;
  const totalFormatted = `₹${invoice.totalAmount.toLocaleString("en-IN")}`;
  const balanceFormatted = `₹${invoice.balanceDue.toLocaleString("en-IN")}`;

  const html = `
    <div style="font-family: Georgia, serif; max-width: 620px; margin: 0 auto; color: #1a1410; background: #faf9f7; padding: 44px 36px; border-radius: 8px;">
      ${BRAND_HEADER}
      <h1 style="font-weight: 300; font-size: 26px; line-height: 1.25; margin: 0 0 12px; color: #1a1410;">
        Payment Receipt
      </h1>
      <p style="color: #6b5d4f; margin: 0 0 28px; font-size: 15px; line-height: 1.6;">
        Dear ${escapeHtml(invoice.customerName)}, thank you for your payment. We have successfully recorded your transaction for <strong>${escapeHtml(invoice.title)}</strong>.
      </p>

      <div style="background: #ffffff; border: 1px solid #e8dcc4; border-radius: 6px; padding: 24px; margin-bottom: 28px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #f0ece4; color: #8c7e6c; width: 140px;">Invoice Number</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f0ece4; font-family: monospace; font-weight: 600;">${escapeHtml(invoice.invoiceNumber)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #f0ece4; color: #8c7e6c;">Payment Received</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f0ece4; font-weight: 600; color: #2e7d32;">${paidNowFormatted}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #f0ece4; color: #8c7e6c;">Total Invoice Amount</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f0ece4; color: #1a1410;">${totalFormatted}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #f0ece4; color: #8c7e6c;">Total Paid to Date</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f0ece4; color: #1a1410;">₹${invoice.paidAmount.toLocaleString("en-IN")}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #8c7e6c;">Remaining Balance</td>
            <td style="padding: 8px 0; font-weight: 600; color: ${invoice.balanceDue > 0 ? "#b78103" : "#2e7d32"};">
              ${invoice.balanceDue === 0 ? "Fully Settled" : balanceFormatted}
            </td>
          </tr>
        </table>
      </div>

      <p style="color: #6b5d4f; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
        This receipt serves as official confirmation of funds received. If you have any questions regarding your invoice or travel itinerary, your dedicated curator is available at any time.
      </p>

      ${BRAND_FOOTER}
    </div>
  `;
  return { subject, html };
}

/**
 * Generates Payment Deadline Reminder email before invoice due date.
 */
export function renderPaymentDeadlineReminderEmail(invoice: IInvoice): RenderedEmail {
  const subject = `Upcoming Payment Due: Invoice #${invoice.invoiceNumber} — Escora`;
  const balanceFormatted = `₹${invoice.balanceDue.toLocaleString("en-IN")}`;
  const dueDateDisplay = invoice.dueDate || "upcoming";

  const html = `
    <div style="font-family: Georgia, serif; max-width: 620px; margin: 0 auto; color: #1a1410; background: #faf9f7; padding: 44px 36px; border-radius: 8px;">
      ${BRAND_HEADER}
      <h1 style="font-weight: 300; font-size: 26px; line-height: 1.25; margin: 0 0 12px; color: #1a1410;">
        Upcoming Payment Reminder
      </h1>
      <p style="color: #6b5d4f; margin: 0 0 28px; font-size: 15px; line-height: 1.6;">
        Dear ${escapeHtml(invoice.customerName)}, this is a courteous reminder regarding your upcoming balance payment for <strong>${escapeHtml(invoice.title)}</strong>.
      </p>

      <div style="background: #ffffff; border: 1px solid #e8dcc4; border-radius: 6px; padding: 24px; margin-bottom: 28px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #f0ece4; color: #8c7e6c; width: 140px;">Invoice Number</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f0ece4; font-family: monospace; font-weight: 600;">${escapeHtml(invoice.invoiceNumber)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #f0ece4; color: #8c7e6c;">Due Date</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f0ece4; font-weight: 600; color: #d32f2f;">${escapeHtml(dueDateDisplay)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #8c7e6c;">Balance Due</td>
            <td style="padding: 8px 0; font-weight: 600; color: #1a1410; font-size: 16px;">${balanceFormatted}</td>
          </tr>
        </table>
      </div>

      <p style="color: #6b5d4f; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
        Settling your balance on time ensures seamless confirmations across all boutique heritage stays, private boat charters, and specialized curators.
      </p>
      ${BRAND_FOOTER}
    </div>
  `;
  return { subject, html };
}

/**
 * Generates Final Itinerary Delivery email with live link.
 */
export function renderFinalItineraryDeliveryEmail(
  itinerary: IItinerary,
  shareUrl: string
): RenderedEmail {
  const subject = `Your Final Kerala Itinerary: ${itinerary.title} — Escora`;
  const dates = [itinerary.startDate, itinerary.endDate].filter(Boolean).join(" to ");

  const html = `
    <div style="font-family: Georgia, serif; max-width: 620px; margin: 0 auto; color: #1a1410; background: #faf9f7; padding: 44px 36px; border-radius: 8px;">
      ${BRAND_HEADER}
      <h1 style="font-weight: 300; font-size: 28px; line-height: 1.25; margin: 0 0 12px; color: #1a1410;">
        Your journey is ready, ${escapeHtml(itinerary.customerName)}.
      </h1>
      <p style="color: #6b5d4f; margin: 0 0 28px; font-size: 15px; line-height: 1.6;">
        We are thrilled to present your finalized private Kerala slow-travel itinerary. Every sanctuary, transfer, and quiet moment has been handcrafted specifically for you.
      </p>

      <div style="background: #ffffff; border: 1px solid #e8dcc4; border-radius: 6px; padding: 24px; margin-bottom: 32px;">
        <h2 style="margin: 0 0 8px; font-size: 18px; font-weight: 400; color: #1a1410;">${escapeHtml(itinerary.title)}</h2>
        ${itinerary.destination ? `<p style="margin: 0 0 12px; color: #8c7e6c; font-size: 14px;">${escapeHtml(itinerary.destination)}</p>` : ""}
        ${dates ? `<p style="margin: 0 0 16px; font-size: 14px; color: #6b5d4f;"><strong>Dates:</strong> ${escapeHtml(dates)}</p>` : ""}
        ${itinerary.summary ? `<p style="margin: 0 0 20px; font-size: 14px; color: #4a3d30; font-style: italic; line-height: 1.6;">"${escapeHtml(itinerary.summary)}"</p>` : ""}

        <div style="text-align: center; margin-top: 24px;">
          <a href="${shareUrl}" style="background: #1a1410; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 4px; font-size: 14px; font-weight: 500; display: inline-block; letter-spacing: 0.05em;">
            Open Your Interactive Itinerary →
          </a>
        </div>
      </div>

      ${itinerary.curatorName ? `
      <div style="background: #f0ece4; border-left: 3px solid #cbab6e; padding: 16px 20px; margin-bottom: 28px; font-size: 13px; color: #4a3d30;">
        <strong>Your Dedicated Journey Curator:</strong> ${escapeHtml(itinerary.curatorName)} ${itinerary.curatorPhone ? `(${escapeHtml(itinerary.curatorPhone)})` : ""}
      </div>` : ""}

      ${BRAND_FOOTER}
    </div>
  `;
  return { subject, html };
}

/**
 * Generates Booking Cancellation confirmation email.
 */
export function renderBookingCancellationEmail(
  order: IOrder,
  reason?: string
): RenderedEmail {
  const subject = `Booking Cancellation Confirmation — Ref #${order.id} — Escora`;

  const html = `
    <div style="font-family: Georgia, serif; max-width: 620px; margin: 0 auto; color: #1a1410; background: #faf9f7; padding: 44px 36px; border-radius: 8px;">
      ${BRAND_HEADER}
      <h1 style="font-weight: 300; font-size: 26px; line-height: 1.25; margin: 0 0 12px; color: #1a1410;">
        Booking Cancellation
      </h1>
      <p style="color: #6b5d4f; margin: 0 0 24px; font-size: 15px; line-height: 1.6;">
        Dear ${escapeHtml(order.guestName)}, this confirms that your booking (Ref: <strong>#${order.id}</strong>) has been cancelled in our system.
      </p>

      ${reason ? `
      <div style="background: #ffffff; border: 1px solid #e8dcc4; border-radius: 6px; padding: 20px; margin-bottom: 28px; font-size: 14px; color: #4a3d30;">
        <strong style="display: block; margin-bottom: 6px; font-size: 12px; font-family: monospace; text-transform: uppercase; letter-spacing: 0.1em; color: #8c7e6c;">Cancellation Details:</strong>
        ${escapeHtml(reason)}
      </div>` : ""}

      <p style="color: #6b5d4f; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
        Any applicable refunds or credits will be processed in accordance with your booking terms. If this cancellation was made in error or you wish to reschedule your Kerala journey for a future season, our curators remain at your service.
      </p>
      ${BRAND_FOOTER}
    </div>
  `;
  return { subject, html };
}

/**
 * Generates Travel Document Delivery email.
 */
export function renderTravelDocumentDeliveryEmail(
  order: IOrder,
  details: { title: string; documentType?: string; notes?: string; downloadUrl?: string }
): RenderedEmail {
  const subject = `Your Travel Documents: ${details.title} — Booking #${order.id}`;

  const html = `
    <div style="font-family: Georgia, serif; max-width: 620px; margin: 0 auto; color: #1a1410; background: #faf9f7; padding: 44px 36px; border-radius: 8px;">
      ${BRAND_HEADER}
      <h1 style="font-weight: 300; font-size: 26px; line-height: 1.25; margin: 0 0 12px; color: #1a1410;">
        Your Travel Documents
      </h1>
      <p style="color: #6b5d4f; margin: 0 0 24px; font-size: 15px; line-height: 1.6;">
        Dear ${escapeHtml(order.guestName)}, your travel vouchers and essential journey documents for your upcoming Kerala trip are now ready.
      </p>

      <div style="background: #ffffff; border: 1px solid #e8dcc4; border-radius: 6px; padding: 24px; margin-bottom: 28px;">
        <div style="font-family: monospace; font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: #cbab6e; margin-bottom: 12px;">
          ${escapeHtml(details.documentType || "Confirmed Travel Vouchers")}
        </div>
        <h2 style="font-size: 18px; font-weight: 400; margin: 0 0 12px;">${escapeHtml(details.title)}</h2>
        ${details.notes ? `<p style="font-size: 14px; color: #6b5d4f; line-height: 1.6; margin: 0 0 16px;">${escapeHtml(details.notes)}</p>` : ""}

        ${details.downloadUrl ? `
        <div style="text-align: center; margin-top: 20px;">
          <a href="${details.downloadUrl}" style="background: #1a1410; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-size: 14px; font-weight: 500; display: inline-block;">
            Download / View Documents →
          </a>
        </div>` : ""}
      </div>

      <p style="color: #6b5d4f; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
        Please save these documents to your mobile device or print a copy for your flight and private check-ins.
      </p>
      ${BRAND_FOOTER}
    </div>
  `;
  return { subject, html };
}

/**
 * Generates Pre-Trip Reminder email before arrival.
 */
export function renderPreTripReminderEmail(
  order: IOrder,
  details?: { curatorName?: string; curatorPhone?: string }
): RenderedEmail {
  const subject = `Your Kerala Journey Begins Soon — Essential Pre-Trip Details (Ref #${order.id})`;

  const html = `
    <div style="font-family: Georgia, serif; max-width: 620px; margin: 0 auto; color: #1a1410; background: #faf9f7; padding: 44px 36px; border-radius: 8px;">
      ${BRAND_HEADER}
      <h1 style="font-weight: 300; font-size: 26px; line-height: 1.25; margin: 0 0 12px; color: #1a1410;">
        Your journey begins soon, ${escapeHtml(order.guestName)}.
      </h1>
      <p style="color: #6b5d4f; margin: 0 0 24px; font-size: 15px; line-height: 1.6;">
        We are counting down the days to your arrival in Kerala. Our team and local sanctuaries are ready to welcome you.
      </p>

      <div style="background: #ffffff; border: 1px solid #e8dcc4; border-radius: 6px; padding: 24px; margin-bottom: 28px;">
        <div style="font-family: monospace; font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: #cbab6e; margin-bottom: 12px;">
          Travel Preparation Guide
        </div>
        <ul style="padding-left: 20px; margin: 0; font-size: 14px; color: #4a3d30; line-height: 1.8;">
          <li><strong>Light, breathable attire:</strong> Kerala's tropical coastal climate pairs best with natural linens and cottons.</li>
          <li><strong>Hill sanctuaries:</strong> If visiting Munnar or Wayanad, evenings can be crisp — a light sweater or wrap is recommended.</li>
          <li><strong>Private airport transfer:</strong> Your chauffeur will meet you at the arrival terminal with a personalized Escora placard.</li>
        </ul>
      </div>

      ${details?.curatorName ? `
      <div style="background: #f0ece4; border-left: 3px solid #cbab6e; padding: 16px 20px; margin-bottom: 28px; font-size: 13px; color: #4a3d30;">
        <strong>Your On-Ground Concierge & Curator:</strong> ${escapeHtml(details.curatorName)} ${details.curatorPhone ? `· Call/WhatsApp: ${escapeHtml(details.curatorPhone)}` : ""}
      </div>` : ""}

      ${BRAND_FOOTER}
    </div>
  `;
  return { subject, html };
}

/**
 * Generates Overdue Payment Follow-Up email.
 */
export function renderOverduePaymentFollowupEmail(invoice: IInvoice): RenderedEmail {
  const subject = `Overdue Notice: Invoice #${invoice.invoiceNumber} — Escora`;
  const balanceFormatted = `₹${invoice.balanceDue.toLocaleString("en-IN")}`;

  const html = `
    <div style="font-family: Georgia, serif; max-width: 620px; margin: 0 auto; color: #1a1410; background: #faf9f7; padding: 44px 36px; border-radius: 8px;">
      ${BRAND_HEADER}
      <h1 style="font-weight: 300; font-size: 26px; line-height: 1.25; margin: 0 0 12px; color: #d32f2f;">
        Overdue Payment Notice
      </h1>
      <p style="color: #6b5d4f; margin: 0 0 24px; font-size: 15px; line-height: 1.6;">
        Dear ${escapeHtml(invoice.customerName)}, we note that your invoice <strong>#${escapeHtml(invoice.invoiceNumber)}</strong> has passed its scheduled payment deadline.
      </p>

      <div style="background: #ffffff; border: 1px solid #e8dcc4; border-radius: 6px; padding: 24px; margin-bottom: 28px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #f0ece4; color: #8c7e6c; width: 140px;">Invoice Number</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f0ece4; font-family: monospace; font-weight: 600;">${escapeHtml(invoice.invoiceNumber)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #f0ece4; color: #8c7e6c;">Original Due Date</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f0ece4; color: #d32f2f;">${escapeHtml(invoice.dueDate || "Past Due")}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #8c7e6c;">Outstanding Balance</td>
            <td style="padding: 8px 0; font-weight: 600; color: #d32f2f; font-size: 16px;">${balanceFormatted}</td>
          </tr>
        </table>
      </div>

      <p style="color: #6b5d4f; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
        To ensure your boutique hotel reservations and private charters remain secured without interruption, please settle this balance at your earliest convenience or contact our accounts team.
      </p>
      ${BRAND_FOOTER}
    </div>
  `;
  return { subject, html };
}

/**
 * Generates Birthday or Anniversary Greeting email.
 */
export function renderBirthdayAnniversaryGreetingEmail(
  recipient: { name: string; email: string },
  occasion: "birthday" | "anniversary",
  unsubscribeUrl: string
): RenderedEmail {
  const isBirthday = occasion === "birthday";
  const subject = isBirthday
    ? `Warmest Birthday Wishes from Escora Kerala`
    : `Happy Anniversary from Escora Holidays`;

  const html = `
    <div style="font-family: Georgia, serif; max-width: 620px; margin: 0 auto; color: #1a1410; background: #faf9f7; padding: 44px 36px; border-radius: 8px;">
      ${BRAND_HEADER}
      <h1 style="font-weight: 300; font-size: 26px; line-height: 1.25; margin: 0 0 12px; color: #1a1410;">
        Warmest ${isBirthday ? "Birthday" : "Anniversary"} Wishes, ${escapeHtml(recipient.name)}.
      </h1>
      <p style="color: #6b5d4f; margin: 0 0 24px; font-size: 15px; line-height: 1.6;">
        On this special celebration, the entire Escora family sends you warm greetings from the peaceful shores of Fort Kochi.
      </p>
      <p style="color: #6b5d4f; margin: 0 0 28px; font-size: 15px; line-height: 1.6;">
        May this coming year be filled with wonder, unhurried journeys, and quiet moments that linger in your memory. Whenever you are ready to wander through spice estates or cruise tranquil lagoons again, our doors are always open.
      </p>
      <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e8dcc4; font-family: monospace; font-size: 11px; color: #9c8c7c; letter-spacing: 0.1em; line-height: 1.6;">
        <p style="margin: 0 0 8px;">Escora Holidays · Fort Kochi, Kerala 682001 · +91 8157 003 344</p>
        <p style="margin: 0;">
          <a href="${unsubscribeUrl}" style="color: #6b5d4f; text-decoration: underline;">Manage celebration preferences</a>
        </p>
      </div>
    </div>
  `;
  return { subject, html };
}

/**
 * Generates Outstanding Document Reminder email.
 */
export function renderOutstandingDocumentReminderEmail(
  order: IOrder,
  missingDocs: string[]
): RenderedEmail {
  const subject = `Required Travel Documentation Pending — Booking #${order.id}`;

  const html = `
    <div style="font-family: Georgia, serif; max-width: 620px; margin: 0 auto; color: #1a1410; background: #faf9f7; padding: 44px 36px; border-radius: 8px;">
      ${BRAND_HEADER}
      <h1 style="font-weight: 300; font-size: 26px; line-height: 1.25; margin: 0 0 12px; color: #1a1410;">
        Travel Document Checklist
      </h1>
      <p style="color: #6b5d4f; margin: 0 0 24px; font-size: 15px; line-height: 1.6;">
        Dear ${escapeHtml(order.guestName)}, in preparation for your upcoming Kerala holiday, our compliance and hotel partners require the following documentation:
      </p>

      <div style="background: #ffffff; border: 1px solid #e8dcc4; border-radius: 6px; padding: 24px; margin-bottom: 28px;">
        <div style="font-family: monospace; font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: #cbab6e; margin-bottom: 12px;">
          Pending Documents
        </div>
        <ul style="padding-left: 20px; margin: 0; font-size: 14px; color: #4a3d30; line-height: 1.8;">
          ${missingDocs.map((doc) => `<li>${escapeHtml(doc)}</li>`).join("")}
        </ul>
      </div>

      <p style="color: #6b5d4f; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
        Please reply to this email with clear scans or photos of the requested documents so our concierge team can finalize your check-in registries.
      </p>
      ${BRAND_FOOTER}
    </div>
  `;
  return { subject, html };
}

/**
 * Generates a unified manual admin email for custom responses, quotes, proposals, complaints, refunds, or disruptions.
 */
export function renderManualAdminEmail(params: {
  title: string;
  greetingName: string;
  bodyHtml: string;
  callToAction?: { label: string; url: string };
  unsubscribeUrl?: string;
}): RenderedEmail {
  const subject = `${params.title} — Escora`;

  const html = `
    <div style="font-family: Georgia, serif; max-width: 620px; margin: 0 auto; color: #1a1410; background: #faf9f7; padding: 44px 36px; border-radius: 8px;">
      ${BRAND_HEADER}
      <h1 style="font-weight: 300; font-size: 26px; line-height: 1.25; margin: 0 0 12px; color: #1a1410;">
        ${escapeHtml(params.title)}
      </h1>
      <p style="color: #6b5d4f; margin: 0 0 24px; font-size: 15px; line-height: 1.6;">
        Dear ${escapeHtml(params.greetingName)},
      </p>

      <div style="background: #ffffff; border: 1px solid #e8dcc4; border-radius: 6px; padding: 24px; margin-bottom: 28px; font-size: 14px; color: #2e261f; line-height: 1.7;">
        ${params.bodyHtml}
      </div>

      ${params.callToAction ? `
      <div style="text-align: center; margin: 28px 0;">
        <a href="${params.callToAction.url}" style="background: #1a1410; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 4px; font-size: 14px; font-weight: 500; display: inline-block;">
          ${escapeHtml(params.callToAction.label)} →
        </a>
      </div>` : ""}

      ${params.unsubscribeUrl ? `
      <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e8dcc4; font-family: monospace; font-size: 11px; color: #9c8c7c; letter-spacing: 0.1em; line-height: 1.6;">
        <p style="margin: 0 0 8px;">Escora Holidays · Fort Kochi, Kerala 682001 · +91 8157 003 344</p>
        <p style="margin: 0;">
          <a href="${params.unsubscribeUrl}" style="color: #6b5d4f; text-decoration: underline;">Opt out of non-critical communications</a>
        </p>
      </div>` : BRAND_FOOTER}
    </div>
  `;
  return { subject, html };
}
