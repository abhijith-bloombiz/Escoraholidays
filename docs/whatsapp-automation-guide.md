# Escora Holidays — WhatsApp Automation Integration & Operations Guide

This guide details the operation, configuration, testing, and production deployment of the Escora WhatsApp Automation system across Stages 1–5.

---

## 1. Architecture & Safe Default: Mock Mode

By default, Escora Holidays operates in **Mock Mode**:
- **Zero External Dependencies:** No network requests are made to Meta Cloud API servers.
- **Zero Credentials Required:** The application boots cleanly without Meta API keys, tokens, or phone number IDs.
- **Full State Simulation:** Messages are saved to the persistent `whatsapp_messages` audit log with status `simulated`. When `WHATSAPP_SIMULATE_AUTO_DELIVER=true`, the mock provider automatically simulates message progression to `delivered` (after 2s) and `read` (after 5s).
- **Safe Development:** Local development, CI/CD pipelines, and unit/integration tests will never accidentally send real WhatsApp messages to customer phone numbers.

```env
# Default safe development settings
WHATSAPP_PROVIDER=mock
WHATSAPP_LIVE_SENDING_ENABLED=false
WHATSAPP_SIMULATE_AUTO_DELIVER=true
```

---

## 2. Meta Test-App & Test-Recipient Prerequisites

Before testing real Meta WhatsApp delivery in development or staging, complete the following prerequisites in the [Meta for Developers Console](https://developers.facebook.com/):

1. **Meta Developer Account & App:**
   - Log in to [Meta for Developers](https://developers.facebook.com/).
   - Create a **Business** type application (e.g., `Escora Holidays Dev`).
   - Add the **WhatsApp** product to your application.
2. **Test Phone Number Setup:**
   - Navigate to **WhatsApp > API Setup**.
   - Note the **Phone number ID** and **WhatsApp Business Account ID** provided in the sandbox test phone number panel.
3. **Authorized Test Recipients:**
   - In Meta's sandbox mode, messages can **only** be sent to phone numbers that have been explicitly added and verified.
   - In **WhatsApp > API Setup > Step 1: Select phone numbers**, add the destination test phone number (e.g., your personal device).
   - Enter the SMS/WhatsApp verification code sent by Meta.
4. **Access Token:**
   - A temporary 24-hour access token is available on the API Setup page for immediate testing.
   - For continuous staging testing, create a **System User** under Meta Business Manager with `whatsapp_business_messaging` permissions to generate a permanent token.

---

## 3. Server-Side Environment Variables

All WhatsApp credentials must remain strictly **server-side** in your `.env` file and must **never** be checked into version control or exposed to the frontend browser application.

| Variable Name | Required For | Default | Description |
|---|---|---|---|
| `WHATSAPP_PROVIDER` | All modes | `mock` | Messaging engine: `mock` (simulated) or `cloud_api` (official Meta Graph API). |
| `WHATSAPP_LIVE_SENDING_ENABLED` | Real sending | `false` | **Safety Kill Switch:** Must be explicitly set to `true` to allow outbound HTTP dispatches to Meta. |
| `WHATSAPP_API_TOKEN` | Real sending | *unset* | Meta Graph API User or System User Bearer token (`EAAB...`). |
| `WHATSAPP_PHONE_NUMBER_ID` | Real sending | *unset* | Sender phone number identifier from Meta WhatsApp API Setup. |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | Real sending | *unset* | WhatsApp Business Account (WABA) identifier. |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | Webhooks | *unset* | Secret verification token chosen by you to verify the webhook handshake with Meta. |
| `WHATSAPP_APP_SECRET` | Webhooks | *unset* | Meta App Secret (from App Settings > Basic) used for HMAC-SHA256 signature verification. |
| `WHATSAPP_GRAPH_API_VERSION` | Real sending | `v20.0` | Meta Graph API version. |
| `WHATSAPP_SIMULATE_AUTO_DELIVER` | Mock mode | `true` | When in mock mode, automatically simulates delivered & read receipt transitions. |

### Lifecycle Trigger Toggles (Environment Defaults)
Each automation can be toggled on or off independently via `.env` or overridden live via the Admin Dashboard:
- `ENABLE_WHATSAPP_ENQUIRY_ACKNOWLEDGEMENT=true`
- `ENABLE_WHATSAPP_BOOKING_CONFIRMATION=true`
- `ENABLE_WHATSAPP_ITINERARY_UPDATES=true`
- `ENABLE_WHATSAPP_PAYMENT_RECEIPTS=true`
- `ENABLE_WHATSAPP_PAYMENT_REMINDERS=true`
- `ENABLE_WHATSAPP_PRE_TRIP_REMINDERS=true`
- `ENABLE_WHATSAPP_POST_TRIP_FEEDBACK=true`
- `ENABLE_WHATSAPP_DOCUMENT_DELIVERY=true`

---

## 4. Enabling Real Test Sending Deliberately

To activate real test sending, you must deliberately configure the **two-key safety gate**:

1. In `.env`, set:
   ```env
   WHATSAPP_PROVIDER=cloud_api
   WHATSAPP_LIVE_SENDING_ENABLED=true
   WHATSAPP_API_TOKEN=EAAB...your_token_here
   WHATSAPP_PHONE_NUMBER_ID=100000000000001
   WHATSAPP_BUSINESS_ACCOUNT_ID=200000000000002
   WHATSAPP_WEBHOOK_VERIFY_TOKEN=escora_staging_verify_secret_2026
   WHATSAPP_APP_SECRET=your_meta_app_secret_here
   ```
2. Restart the API server:
   ```bash
   pnpm start
   # or for development:
   pnpm run dev
   ```
3. **Startup Safety Validation:** The server will validate that both `WHATSAPP_API_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` are set. If either is missing or invalid, the server fails fast and logs an error to prevent silent failures.
4. **Admin UI Indicator:** When real mode is active, the Admin Header displays:
   - `META CLOUD API (TEST LIVE)` in sky blue with an active status pulse.
   - If `WHATSAPP_LIVE_SENDING_ENABLED=false`, it displays `META CLOUD API (SAFETY LOCKED)` in amber.

---

## 5. Webhook Configuration

Meta Cloud API sends delivery receipts (`sent`, `delivered`, `read`, `failed`) and inbound customer messages via webhooks.

### Endpoint
- **Callback URL:** `https://<your-domain-or-tunnel>/api/whatsapp/webhook`
- **Verify Token:** The exact value configured in `WHATSAPP_WEBHOOK_VERIFY_TOKEN`.

### Configuration in Meta Developer Console
1. Navigate to **WhatsApp > Configuration > Webhooks**.
2. Click **Edit**, enter your Callback URL and Verify Token, then click **Verify and Save**.
3. Under **Webhook fields**, click **Manage** and subscribe to:
   - `messages` (delivers status receipts and inbound customer messages).

### Security & Signature Verification
- Inbound webhooks from Meta include an `x-hub-signature-256` header containing an HMAC-SHA256 signature of the raw request payload, keyed by your `WHATSAPP_APP_SECRET`.
- The Escora API server validates this signature using timing-safe comparisons before processing events. Tampered or unsigned requests are rejected with HTTP 401.

### Inbound Keywords
- **`STOP` / `UNSUBSCRIBE`:** Automatically records a customer transactional opt-out (`transactionalOptOut: true`). Future messages to this phone number will be halted and saved with status `skipped_opted_out`.
- **`START` / `UNSTOP`:** Clears the opt-out and restores transactional messaging.
- **`HELP`:** Logs an assistance request in consent notes and creates an administrative enquiry ticket for staff follow-up without sending automated bot responses.

---

## 6. How to Trigger Test Messages

### Method A: Admin Quick Simulator (Interactive)
1. Navigate to the Admin Dashboard > **WhatsApp Automation** (`/admin/whatsapp`).
2. Click the **Quick Simulator** button in the top header.
3. Select a preset (e.g., *Enquiry Acknowledgement*, *Booking Confirmation*, or *Payment Receipt*).
4. Enter your verified recipient phone number (must be registered in Meta sandbox).
5. Click **Simulate Message Dispatch**.
6. The dispatched message appears immediately in the audit trail table. In Cloud API mode, you can inspect the Meta `wamid` and await webhook delivery receipts.

### Method B: Business Workflow Triggers
- **Enquiry Acknowledgement:** Submit a valid contact enquiry via the public website or `POST /api/enquiries` with a valid phone number.
- **Booking Confirmation:** Create an order or transition an existing order to `status: "confirmed"` via `PATCH /api/orders/:id`.
- **Payment Receipt:** Record a partial or full payment on an invoice via `PATCH /api/invoices/:id` with `paidAmount > 0`.
- **Itinerary Update:** Edit and save meaningful changes (dates, hotel stays, days, or pricing) on a confirmed itinerary via `PATCH /api/itineraries/:id`.
- **Document Delivery:** Issue travel vouchers or passes via `POST /api/orders/:id/documents` for a confirmed booking.
- **Scheduled Reminders:** Processed automatically on schedule by the background worker tick in `notification-service.ts` (`processDueEmailNotifications`).

---

## 7. Immediate Kill Switch: How to Disable Real Sending

If any operational anomaly or testing complete occurs, real sending can be disabled immediately using either of these two methods:

### Method 1: Environment Kill Switch (Recommended)
Set `WHATSAPP_LIVE_SENDING_ENABLED=false` or `WHATSAPP_PROVIDER=mock` in your environment and restart the server. Dispatches will instantly revert to simulation mode without calling Meta.

### Method 2: Live Admin Dashboard Kill Switch
In the Admin Dashboard > **WhatsApp Automation > Settings Tab**:
1. Switch the active provider toggle to **Mock Simulation Provider**.
2. Or toggle off individual automations (e.g. *Booking Confirmation* or *Payment Reminders*).
3. The changes take effect within 10 seconds (in-memory settings cache TTL) without requiring a server restart.

---

## 8. Client Production Prerequisites Checklist

When the client is ready to transition from Meta Sandbox to live customer production, obtain the following assets:

- [ ] **Meta Business Verification:** Complete business verification under Meta Business Manager (requires official business registration and tax documents).
- [ ] **Official WhatsApp Business Phone Number:** A clean phone number capable of receiving an SMS or voice OTP that is **not** currently registered to standard WhatsApp or WhatsApp Business mobile apps.
- [ ] **Display Name Approval:** Submit and obtain Meta approval for the brand display name (`Escora Holidays`).
- [ ] **Permanent System User Token:** Under Meta Business Manager > Users > System Users, create a system user with `whatsapp_business_messaging` and `whatsapp_business_management` permissions, and generate a permanent token.
- [ ] **Approved Message Templates:** Submit and obtain Meta approval for business-initiated notification templates:
  - `escora_enquiry_acknowledgement_v1`
  - `escora_booking_confirmation_v1`
  - `escora_payment_receipt_v1`
  - `escora_itinerary_update_v1`
  - `escora_document_delivery_v1`
  - `escora_payment_reminder_v1`
  - `escora_pre_trip_reminder_v1`
  - `escora_post_trip_feedback_v1`
- [ ] **Production Webhook Registration:** Register the production HTTPS endpoint in the Meta App Dashboard and configure production values for `WHATSAPP_WEBHOOK_VERIFY_TOKEN` and `WHATSAPP_APP_SECRET`.
