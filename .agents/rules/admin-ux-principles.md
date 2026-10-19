# Escora Admin UX Principle — Non-Technical Staff First

The Escora Admin Panel is designed for receptionists, managers, and operational staff who manage everyday travel operations. It is an operational business portal, not a developer dashboard or an analytics platform.

Design every page for staff who need to complete everyday business tasks quickly, with minimal training.

## Core Rules

1. **Preserve Original Content and Terminology:**
   - **Never rename or remove existing original labels, metrics, or content** unless explicitly authorized by the user.
   - Keep the original Dashboard metric labels and meanings unchanged:
     - **Destinations**
     - **Journeys**
     - **Enquiries**
     - **Journal Posts**
     - **Open Enquiries**
     - **Confirmed Bookings**
     - **Total Revenue**
     - **Contact Inbox**
   - Preserve the original Quick Actions:
     - **Add Journey** (`/packages`)
     - **Add Destination** (`/destinations`)
     - **Write Article** (`/journal`)
     - **View Enquiries** (`/orders`)
   - Do not rename "Enquiries" to "Total Bookings", "Total Revenue" to "Money Received", or any other original label.

2. **Simplify Only Newly Introduced Content:**
   - Simpler, familiar language applies to **newly introduced** labels, subtitles, helper text, and sections.
   - Replace corporate buzzwords or technical jargon with clear everyday terms:
     - “Executive Operations Overview” → “Dashboard”
     - “Booking Pipeline Distribution” → “Booking Status”
     - “Curated Journeys” → “Journeys”
     - “Journal Chronicles” → “Blog Posts” / “Journal Posts”

3. **Avoid Redundant Sections:**
   - The Dashboard provides a concise, high-level overview. Detailed management belongs in dedicated pages (e.g. Bookings in `/orders`).
   - Do not add complex tables or pipeline charts simply because the data exists in the backend API.

4. **Preserve Card-Based Clarity and Quick Actions:**
   - Maintain the simplicity of the card-based layout and quick actions for common workflows.

5. **Maintain Premium Escora Visual Identity:**
   - Restrained deep forest green, warm ivory foundation, champagne gold accents, Playfair Display serif headings, clean Manrope sans-serif body text, consistent spacing, and subtle borders.

6. **Preserve All Business Capabilities:**
   - Keep all features, routes, queries, notifications, permissions, and security controls intact.

7. **Clear States in Plain Language:**
   - Provide clear loading, empty, success, and error states without technical jargon.
