import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShoppingBag,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Users,
  MapPin,
  CreditCard,
  Sparkles,
  ShieldCheck,
  DollarSign,
  FileText,
  RefreshCw,
  Info,
  Check,
  X,
} from "lucide-react";
import {
  useConvertEnquiry,
  getListEnquiriesQueryKey,
  getListOrdersQueryKey,
  type Enquiry,
  type Itinerary,
  type EnquiryAiAssistResponse,
  type Order,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { parsePricing, parseDays, parseStringList } from "@/lib/itinerary";

interface ConvertEnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  enquiry: Enquiry;
  linkedProposals?: Itinerary[];
  initialSelectedProposalId?: number;
  aiResult?: EnquiryAiAssistResponse;
  onConverted: (result: { booking: Order; enquiry: Enquiry }) => void;
}

export default function ConvertEnquiryModal({
  isOpen,
  onClose,
  enquiry,
  linkedProposals = [],
  initialSelectedProposalId,
  aiResult,
  onConverted,
}: ConvertEnquiryModalProps) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const convertMutation = useConvertEnquiry();

  // Selected Quotation / Proposal ID or "direct" for direct booking without proposal
  const [selectedProposalId, setSelectedProposalId] = useState<string>("direct");

  // Form Fields
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [destinations, setDestinations] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [guestCount, setGuestCount] = useState<number>(2);
  const [travelStyle, setTravelStyle] = useState("Bespoke Slow-Luxury");
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [currency, setCurrency] = useState("INR");
  const [paymentTerms, setPaymentTerms] = useState(
    "50% advance deposit upon confirmation, balance 15 days prior to arrival"
  );
  const [bookingStatus, setBookingStatus] = useState<"enquiry" | "confirmed">("enquiry");
  const [paymentStatus, setPaymentStatus] = useState<"unpaid" | "partially_paid">("unpaid");
  const [specialRequests, setSpecialRequests] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  // Operational & Commercial Acknowledgements
  const [customerAccepted, setCustomerAccepted] = useState(true);
  const [availabilityConfirmed, setAvailabilityConfirmed] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);

  // Initialize and populate form when modal opens or proposal changes
  useEffect(() => {
    if (!isOpen) return;

    setServerError(null);
    setGuestName(enquiry.name || "");
    setGuestEmail(enquiry.email || "");
    setGuestPhone(enquiry.phone || "");

    // Choose default proposal if available
    let initialProposalId = "direct";
    if (initialSelectedProposalId) {
      initialProposalId = String(initialSelectedProposalId);
    } else if (linkedProposals && linkedProposals.length > 0) {
      // Prefer confirmed or shared proposals
      const confirmedProp = linkedProposals.find((p) => p.status === "confirmed");
      const sharedProp = linkedProposals.find((p) => p.status === "shared");
      const defaultProp = confirmedProp || sharedProp || linkedProposals[0];
      initialProposalId = String(defaultProp.id);
    }
    setSelectedProposalId(initialProposalId);

    // Apply values based on proposal or enquiry/AI
    applyProposalOrDefaults(initialProposalId);
  }, [isOpen, enquiry.id, initialSelectedProposalId]);

  function applyProposalOrDefaults(propIdStr: string) {
    if (propIdStr !== "direct") {
      const prop = linkedProposals.find((p) => String(p.id) === propIdStr);
      if (prop) {
        setDestinations(prop.destination || "Kerala, India");
        setTravelDate(prop.startDate || "");
        setDepartureDate(prop.endDate || "");

        const totalGuests = (prop.adults || 0) + (prop.children || 0) + (prop.infants || 0);
        setGuestCount(totalGuests > 0 ? totalGuests : 2);

        const pricing = parsePricing(prop.pricing);
        setTotalAmount(pricing.total || 0);
        setCurrency(prop.currency || "INR");

        const terms = parseStringList(prop.paymentTerms).join("; ");
        setPaymentTerms(
          terms || "50% advance deposit upon confirmation, balance 15 days prior to arrival"
        );
        setCustomerAccepted(prop.status === "confirmed" || true);
        setAvailabilityConfirmed(true);
        setTravelStyle("Bespoke Private Journey");
        setInternalNotes(`Converted from Proposal #${prop.id}: "${prop.title}" linked to Enquiry #${enquiry.id}`);
        return;
      }
    }

    // Direct Booking (no proposal selected)
    // Attempt to extract from AI briefing if available
    let extractedDest = "";
    if (aiResult?.extractedPreferences?.destinations?.length) {
      extractedDest = aiResult.extractedPreferences.destinations.join(" & ");
    } else if (aiResult?.summary?.destinations?.length) {
      extractedDest = aiResult.summary.destinations.join(" & ");
    }
    setDestinations(extractedDest || "Munnar & Alleppey Backwaters");

    let extractedDate = "";
    const datesStr = aiResult?.extractedPreferences?.travelDates || aiResult?.summary?.travelDates || "";
    if (datesStr && !datesStr.toLowerCase().includes("unknown")) {
      const match = datesStr.match(/\d{4}-\d{2}-\d{2}/);
      if (match) extractedDate = match[0];
    }
    setTravelDate(extractedDate);
    setDepartureDate("");

    let count = 2;
    const groupStr = (aiResult?.extractedPreferences?.groupSize || "").toLowerCase();
    const countMatch = groupStr.match(/(\d+)/);
    if (countMatch) {
      count = parseInt(countMatch[1], 10) || 2;
    }
    setGuestCount(count >= 1 ? count : 2);

    setTotalAmount(0);
    setCurrency("INR");
    setPaymentTerms("50% advance deposit upon confirmation, balance 15 days prior to arrival");
    setTravelStyle(aiResult?.extractedPreferences?.travelStyle || "Bespoke Slow-Luxury");
    setSpecialRequests(aiResult?.extractedPreferences?.specialRequests?.join(", ") || "");
    setInternalNotes(`Direct booking conversion from Inbox Enquiry #${enquiry.id}`);
    setCustomerAccepted(true);
    setAvailabilityConfirmed(true);
  }

  // Handle changing quotation selection
  const handleProposalSelectionChange = (val: string) => {
    setSelectedProposalId(val);
    applyProposalOrDefaults(val);
  };

  // Active selected proposal object
  const activeProposal = useMemo(() => {
    if (selectedProposalId === "direct") return null;
    return linkedProposals.find((p) => String(p.id) === selectedProposalId) || null;
  }, [selectedProposalId, linkedProposals]);

  // Real-time eligibility evaluation
  const validation = useMemo(() => {
    const hasName = Boolean(guestName.trim());
    const hasEmail = Boolean(guestEmail.trim() && guestEmail.includes("@"));
    const hasPhone = Boolean(guestPhone.trim());
    const hasDestination = Boolean(destinations.trim());
    const hasDate = Boolean(travelDate.trim());
    const hasValidGuests = Number.isInteger(guestCount) && guestCount >= 1;
    const hasValidAmount = typeof totalAmount === "number" && !Number.isNaN(totalAmount) && totalAmount >= 0;
    const hasCustomerAcceptance = customerAccepted;
    const hasAvailability = availabilityConfirmed;

    const missingFields: string[] = [];
    if (!hasName) missingFields.push("Guest Name");
    if (!hasEmail) missingFields.push("Valid Email");
    if (!hasPhone) missingFields.push("Contact Phone");
    if (!hasDestination) missingFields.push("Destination / Route");
    if (!hasDate) missingFields.push("Arrival Travel Date");
    if (!hasValidGuests) missingFields.push("Guest Count (at least 1)");
    if (!hasValidAmount) missingFields.push("Valid Agreed Price");
    if (!hasCustomerAcceptance) missingFields.push("Customer Acceptance");
    if (!hasAvailability) missingFields.push("Operational Availability Check");

    const isEligible = missingFields.length === 0;

    return {
      isEligible,
      missingFields,
      hasName,
      hasEmail,
      hasPhone,
      hasDestination,
      hasDate,
      hasValidGuests,
      hasValidAmount,
      hasCustomerAcceptance,
      hasAvailability,
    };
  }, [
    guestName,
    guestEmail,
    guestPhone,
    destinations,
    travelDate,
    guestCount,
    totalAmount,
    customerAccepted,
    availabilityConfirmed,
  ]);

  // Handle conversion submission
  const handleConvert = () => {
    if (!validation.isEligible || convertMutation.isPending) return;

    setServerError(null);

    convertMutation.mutate(
      {
        id: enquiry.id,
        data: {
          itineraryId: activeProposal ? activeProposal.id : undefined,
          guestName: guestName.trim(),
          guestEmail: guestEmail.trim(),
          guestPhone: guestPhone.trim(),
          destinations: destinations.trim(),
          travelDate: travelDate.trim(),
          departureDate: departureDate.trim() || undefined,
          guestCount: Number(guestCount),
          travelStyle: travelStyle.trim(),
          totalAmount: Number(totalAmount),
          currency: currency.trim() || "INR",
          status: bookingStatus,
          paymentStatus,
          paymentTerms: paymentTerms.trim(),
          specialRequests: specialRequests.trim() || undefined,
          notes: internalNotes.trim() || undefined,
          customerAccepted,
          availabilityConfirmed,
        },
      },
      {
        onSuccess: (data: any) => {
          qc.invalidateQueries({ queryKey: getListEnquiriesQueryKey() });
          qc.invalidateQueries({ queryKey: getListOrdersQueryKey() });
          qc.invalidateQueries({ queryKey: ["admin", "enquiry-proposals", enquiry.id] });

          toast({
            title: "Enquiry Converted to Booking ✨",
            description: `Successfully created Booking #${data.booking.id} (${data.booking.bookingReference}).`,
          });

          onConverted(data);
          onClose();
        },
        onError: (err: any) => {
          const errMsg = err?.message || err?.error || "Failed to convert enquiry to booking.";
          setServerError(errMsg);
          toast({
            title: "Conversion Failed",
            description: errMsg,
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !convertMutation.isPending && onClose()}>
      <DialogContent className="max-w-2xl sm:max-w-3xl max-h-[92vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-4 border-b bg-muted/20">
          <div className="flex items-center justify-between gap-4">
            <div>
              <DialogTitle className="font-serif text-xl flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                Convert Enquiry to Official Booking
              </DialogTitle>
              <DialogDescription className="text-xs mt-1">
                Finalize trip parameters, commercial terms, and operational status for{" "}
                <strong className="text-foreground">{enquiry.name}</strong> (Enquiry #{enquiry.id}).
              </DialogDescription>
            </div>
            <Badge
              variant="outline"
              className="bg-primary/10 text-primary border-primary/20 text-xs font-medium px-2.5 py-0.5"
            >
              Manual Conversion
            </Badge>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6 text-xs sm:text-sm">
          {/* Server Error Alert */}
          {serverError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Conversion Error</AlertTitle>
              <AlertDescription className="text-xs">{serverError}</AlertDescription>
            </Alert>
          )}

          {/* SECTION 1: ITINERARY / QUOTATION SELECTION */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b pb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-primary" />
                1. Quotation &amp; Itinerary Workflow
              </span>
              {linkedProposals.length > 0 && (
                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                  {linkedProposals.length} Linked {linkedProposals.length === 1 ? "Proposal" : "Proposals"} Available
                </Badge>
              )}
            </div>

            <div className="bg-muted/10 p-3.5 rounded-lg border space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">
                  Choose Itinerary Proposal (Quotation) to Convert
                </Label>
                <Select
                  value={selectedProposalId}
                  onValueChange={handleProposalSelectionChange}
                  disabled={convertMutation.isPending}
                >
                  <SelectTrigger className="text-xs h-9 bg-background">
                    <SelectValue placeholder="Select a quotation or direct booking..." />
                  </SelectTrigger>
                  <SelectContent>
                    {linkedProposals.map((prop) => {
                      const pricing = parsePricing(prop.pricing);
                      const days = parseDays(prop.days);
                      return (
                        <SelectItem key={prop.id} value={String(prop.id)} className="text-xs">
                          Proposal #{prop.id}: &ldquo;{prop.title}&rdquo; — {prop.destination || "Kerala"} (
                          {days.length}D, {prop.currency || "INR"} {pricing.total.toLocaleString("en-IN")}) · [
                          {prop.status.toUpperCase()}]
                        </SelectItem>
                      );
                    })}
                    <SelectItem value="direct" className="text-xs">
                      Direct Conversion (No quotation — establish trip details directly)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {activeProposal ? (
                <div className="p-3 rounded-md bg-[#855A18]/5 border border-[#855A18]/20 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-semibold text-foreground flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5 text-[#855A18]" />
                      Preserving Accepted Quotation: &ldquo;{activeProposal.title}&rdquo;
                    </span>
                    <Badge variant="outline" className="text-[10px] uppercase font-mono">
                      Ref: {activeProposal.shareToken ? activeProposal.shareToken.slice(0, 8).toUpperCase() : `#${activeProposal.id}`}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    A permanent snapshot of this quotation's day plans, curated stays, inclusions, and commercial pricing will be locked into the booking record. Subsequent edits to the draft will not affect this booking.
                  </p>
                </div>
              ) : (
                <div className="p-2.5 rounded-md bg-muted/20 text-xs text-muted-foreground flex items-center gap-2">
                  <Info className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>
                    Direct Booking: No proposal will be attached. Trip details and agreed commercials will be captured directly in the new booking.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2: GUEST CONTACT DETAILS */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b pb-1.5 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-primary" />
              2. Guest Contact Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="conv-name" className="text-xs">
                  Guest Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="conv-name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="e.g. Eleanor Vance"
                  className="text-xs h-8"
                  disabled={convertMutation.isPending}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="conv-email" className="text-xs">
                  Email Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="conv-email"
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="e.g. guest@example.com"
                  className="text-xs h-8"
                  disabled={convertMutation.isPending}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="conv-phone" className="text-xs">
                  Phone / WhatsApp <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="conv-phone"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="text-xs h-8"
                  disabled={convertMutation.isPending}
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: TRIP PARAMETERS & DATES */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b pb-1.5 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              3. Itinerary &amp; Travel Parameters
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="conv-dest" className="text-xs">
                  Destination / Package Route <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="conv-dest"
                  value={destinations}
                  onChange={(e) => setDestinations(e.target.value)}
                  placeholder="e.g. Munnar, Thekkady & Alleppey Backwaters"
                  className="text-xs h-8"
                  disabled={convertMutation.isPending}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="conv-style" className="text-xs">
                  Travel Style / Journey Tier
                </Label>
                <Input
                  id="conv-style"
                  value={travelStyle}
                  onChange={(e) => setTravelStyle(e.target.value)}
                  placeholder="e.g. Signature Slow-Luxury, Heritage Sanctuary"
                  className="text-xs h-8"
                  disabled={convertMutation.isPending}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="conv-start-date" className="text-xs">
                  Arrival / Travel Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="conv-start-date"
                  type="date"
                  value={travelDate}
                  onChange={(e) => setTravelDate(e.target.value)}
                  className="text-xs h-8"
                  disabled={convertMutation.isPending}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="conv-end-date" className="text-xs">
                  Departure Date (Optional)
                </Label>
                <Input
                  id="conv-end-date"
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className="text-xs h-8"
                  disabled={convertMutation.isPending}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="conv-guests" className="text-xs">
                  Number of Travellers <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="conv-guests"
                  type="number"
                  min="1"
                  max="100"
                  value={guestCount}
                  onChange={(e) => setGuestCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="text-xs h-8"
                  disabled={convertMutation.isPending}
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: COMMERCIAL TERMS & PRICING */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b pb-1.5 flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-primary" />
              4. Commercial Terms &amp; Agreed Price
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="conv-amount" className="text-xs">
                  Agreed Total Amount ({currency}) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="conv-amount"
                  type="number"
                  min="0"
                  step="100"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="text-xs h-8 tabular-nums font-semibold"
                  disabled={convertMutation.isPending}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="conv-currency" className="text-xs">
                  Currency
                </Label>
                <Select
                  value={currency}
                  onValueChange={setCurrency}
                  disabled={convertMutation.isPending}
                >
                  <SelectTrigger className="text-xs h-8 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR — Indian Rupee (₹)</SelectItem>
                    <SelectItem value="USD">USD — US Dollar ($)</SelectItem>
                    <SelectItem value="EUR">EUR — Euro (€)</SelectItem>
                    <SelectItem value="GBP">GBP — British Pound (£)</SelectItem>
                    <SelectItem value="AED">AED — UAE Dirham</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="conv-payment-terms" className="text-xs">
                Payment Terms &amp; Deposit Schedule
              </Label>
              <Input
                id="conv-payment-terms"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="e.g. 50% advance deposit upon confirmation, balance 15 days prior to arrival"
                className="text-xs h-8"
                disabled={convertMutation.isPending}
              />
            </div>
          </div>

          {/* SECTION 5: BOOKING & PAYMENT STATUS INDEPENDENCE */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b pb-1.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                5. Booking Pipeline &amp; Payment Status
              </h4>
              <Badge variant="outline" className="text-[10px] text-muted-foreground">
                Statuses Tracked Independently
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-muted/10 p-3.5 rounded-lg border">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Initial Booking Status</Label>
                <Select
                  value={bookingStatus}
                  onValueChange={(val: any) => setBookingStatus(val)}
                  disabled={convertMutation.isPending}
                >
                  <SelectTrigger className="text-xs h-8 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="enquiry">
                      Enquiry (Pending Confirmation / Awaiting Payment)
                    </SelectItem>
                    <SelectItem value="confirmed">
                      Confirmed (Dates locked, guest committed)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  {bookingStatus === "confirmed"
                    ? "Trip is finalized and inventory locked."
                    : "Booking begins as pending confirmation in the pipeline."}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Initial Payment Status</Label>
                <Select
                  value={paymentStatus}
                  onValueChange={(val: any) => setPaymentStatus(val)}
                  disabled={convertMutation.isPending}
                >
                  <SelectTrigger className="text-xs h-8 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unpaid">Unpaid (Awaiting advance deposit)</SelectItem>
                    <SelectItem value="partially_paid">Partially Paid (Advance received)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  Payment is never marked paid merely from conversion. Paid status requires verified invoice records.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="conv-notes" className="text-xs">
                Internal Concierge Notes (Optional)
              </Label>
              <Textarea
                id="conv-notes"
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Internal notes regarding special VIP care, dietary preferences, or curator remarks..."
                className="text-xs min-h-[60px]"
                disabled={convertMutation.isPending}
              />
            </div>
          </div>

          {/* SECTION 6: OPERATIONAL & COMPLIANCE ACKNOWLEDGEMENT */}
          <div className="space-y-2.5 pt-1 border-t">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              6. Operational Readiness &amp; Approvals
            </h4>

            <div className="space-y-2 bg-muted/10 p-3 rounded-lg border text-xs">
              <div className="flex items-start gap-2.5">
                <Checkbox
                  id="chk-customer-accepted"
                  checked={customerAccepted}
                  onCheckedChange={(checked) => setCustomerAccepted(Boolean(checked))}
                  disabled={convertMutation.isPending}
                  className="mt-0.5"
                />
                <Label htmlFor="chk-customer-accepted" className="text-xs font-normal leading-snug cursor-pointer">
                  <strong>Customer Quotation Acceptance:</strong> The guest has verbally or in writing accepted the proposed itinerary and pricing terms.
                </Label>
              </div>

              <div className="flex items-start gap-2.5">
                <Checkbox
                  id="chk-availability"
                  checked={availabilityConfirmed}
                  onCheckedChange={(checked) => setAvailabilityConfirmed(Boolean(checked))}
                  disabled={convertMutation.isPending}
                  className="mt-0.5"
                />
                <Label htmlFor="chk-availability" className="text-xs font-normal leading-snug cursor-pointer">
                  <strong>Operational &amp; Resort Availability:</strong> Core sanctuary, houseboat, or resort accommodation availability has been checked for the requested travel dates.
                </Label>
              </div>
            </div>
          </div>

          {/* ELIGIBILITY VALIDATION SUMMARY */}
          {!validation.isEligible && (
            <Alert variant="destructive" className="py-2.5">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="text-xs font-semibold">Missing Required Information</AlertTitle>
              <AlertDescription className="text-xs">
                Please provide the following before initiating conversion:{" "}
                <strong className="underline">{validation.missingFields.join(", ")}</strong>.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="p-4 border-t bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5 self-start sm:self-auto">
            {validation.isEligible ? (
              <span className="text-emerald-600 flex items-center gap-1 font-medium">
                <Check className="h-3.5 w-3.5" /> All conversion criteria satisfied
              </span>
            ) : (
              <span className="text-amber-600 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" /> Action blocked until required fields are completed
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={convertMutation.isPending}
              className="text-xs h-8 cursor-pointer"
            >
              Cancel
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleConvert}
              disabled={!validation.isEligible || convertMutation.isPending}
              className="text-xs h-8 bg-[#183D2E] hover:bg-[#112c21] text-[#FAF8F3] gap-1.5 cursor-pointer shadow-xs min-w-[150px]"
            >
              {convertMutation.isPending ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Creating Booking...
                </>
              ) : (
                <>
                  <ShoppingBag className="h-3.5 w-3.5 text-[#cbab6e]" />
                  Confirm &amp; Convert to Booking
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
