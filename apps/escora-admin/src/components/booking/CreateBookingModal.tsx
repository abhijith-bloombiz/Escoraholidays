import { useState } from "react";
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
  Calendar,
  Users,
  MapPin,
  CreditCard,
  AlertTriangle,
  Phone,
  Mail,
  Compass,
} from "lucide-react";
import {
  useCreateOrder,
  useListPackages,
  getListOrdersQueryKey,
  type Order,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface CreateBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (booking: Order) => void;
}

export default function CreateBookingModal({
  isOpen,
  onClose,
  onCreated,
}: CreateBookingModalProps) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const createMutation = useCreateOrder();

  const { data: packages = [] } = useListPackages();

  // Form Fields
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [selectedPackageId, setSelectedPackageId] = useState<string>("custom");
  const [destinations, setDestinations] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [guestCount, setGuestCount] = useState<number>(2);
  const [travelStyle, setTravelStyle] = useState("Bespoke Slow-Luxury");
  const [budgetRange, setBudgetRange] = useState("");
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [currency, setCurrency] = useState("INR");
  const [paymentTerms, setPaymentTerms] = useState(
    "50% advance deposit upon confirmation, balance 15 days prior to arrival"
  );
  const [bookingStatus, setBookingStatus] = useState<"enquiry" | "confirmed">("confirmed");
  const [paymentStatus, setPaymentStatus] = useState<"unpaid" | "partially_paid" | "paid">("unpaid");
  const [specialRequests, setSpecialRequests] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  const [serverError, setServerError] = useState<string | null>(null);

  function resetForm() {
    setGuestName("");
    setGuestEmail("");
    setGuestPhone("");
    setSelectedPackageId("custom");
    setDestinations("");
    setTravelDate("");
    setDepartureDate("");
    setGuestCount(2);
    setTravelStyle("Bespoke Slow-Luxury");
    setBudgetRange("");
    setTotalAmount(0);
    setCurrency("INR");
    setPaymentTerms("50% advance deposit upon confirmation, balance 15 days prior to arrival");
    setBookingStatus("confirmed");
    setPaymentStatus("unpaid");
    setSpecialRequests("");
    setInternalNotes("");
    setServerError(null);
  }

  function handlePackageChange(pkgIdStr: string) {
    setSelectedPackageId(pkgIdStr);
    if (pkgIdStr !== "custom") {
      const selectedPkg = packages.find((p) => String(p.id) === pkgIdStr);
      if (selectedPkg) {
        setDestinations(selectedPkg.route || selectedPkg.name);
        setTravelStyle(selectedPkg.category || "Curated Journey");
        if (selectedPkg.priceFrom) {
          setTotalAmount(Number(selectedPkg.priceFrom) * guestCount);
        }
      }
    }
  }

  const isFormValid =
    guestName.trim().length > 0 &&
    guestEmail.trim().length > 0 &&
    guestPhone.trim().length > 0 &&
    destinations.trim().length > 0 &&
    travelDate.trim().length > 0 &&
    guestCount >= 1 &&
    totalAmount >= 0;

  function handleCreateBooking(e: React.FormEvent) {
    e.preventDefault();
    if (!isFormValid || createMutation.isPending) return;

    setServerError(null);

    const selectedPkg =
      selectedPackageId !== "custom"
        ? packages.find((p) => String(p.id) === selectedPackageId)
        : null;

    createMutation.mutate(
      {
        data: {
          guestName: guestName.trim(),
          guestEmail: guestEmail.trim(),
          guestPhone: guestPhone.trim(),
          packageId: selectedPkg ? selectedPkg.id : undefined,
          packageName: selectedPkg ? selectedPkg.name : undefined,
          destinations: destinations.trim(),
          travelDate: travelDate.trim(),
          departureDate: departureDate.trim() || undefined,
          guestCount: Number(guestCount),
          travelStyle: travelStyle.trim() || "Bespoke Journey",
          budgetRange: budgetRange.trim() || undefined,
          totalAmount: Number(totalAmount),
          currency: currency.trim() || "INR",
          status: bookingStatus,
          paymentStatus,
          paymentTerms: paymentTerms.trim() || undefined,
          specialRequests: specialRequests.trim() || undefined,
          notes: internalNotes.trim() || undefined,
        } as any,
      },
      {
        onSuccess: (data: any) => {
          qc.invalidateQueries({ queryKey: getListOrdersQueryKey() });
          toast({
            title: "Booking Created Successfully ✨",
            description: `Official Booking #${data.id} (${data.bookingReference || "Generated"}) was recorded.`,
          });
          if (onCreated) {
            onCreated(data);
          }
          resetForm();
          onClose();
        },
        onError: (err: any) => {
          const errMsg = err?.message || err?.error || "Failed to create booking.";
          setServerError(errMsg);
          toast({
            title: "Booking Creation Failed",
            description: errMsg,
            variant: "destructive",
          });
        },
      }
    );
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !createMutation.isPending) {
          resetForm();
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-2xl sm:max-w-3xl max-h-[92vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-4 border-b bg-muted/20">
          <div className="flex items-center justify-between gap-4">
            <div>
              <DialogTitle className="font-serif text-xl flex items-center gap-2 text-foreground">
                <ShoppingBag className="h-5 w-5 text-[#24543D]" />
                Create Booking Manually
              </DialogTitle>
              <DialogDescription className="text-xs mt-1">
                Record a verified customer booking received via telephone, WhatsApp, or concierge consultation.
              </DialogDescription>
            </div>
            <Badge
              variant="outline"
              className="bg-emerald-600/10 text-emerald-700 border-emerald-300 dark:border-emerald-800 text-xs font-medium px-2.5 py-0.5"
            >
              Direct Booking
            </Badge>
          </div>
        </DialogHeader>

        <form onSubmit={handleCreateBooking}>
          <div className="p-6 space-y-6 text-xs sm:text-sm">
            {/* Server Error Alert */}
            {serverError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Creation Error</AlertTitle>
                <AlertDescription className="text-xs">{serverError}</AlertDescription>
              </Alert>
            )}

            {/* SECTION 1: CUSTOMER CONTACT DETAILS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-[#24543D]" /> Customer &amp; Party Details
                </span>
                <span className="text-[11px] text-muted-foreground">Required contact details</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="m-guestName" className="text-xs font-medium">
                    Primary Guest Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="m-guestName"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="e.g. Eleanor Vance"
                    className="h-8 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="m-guestEmail" className="text-xs font-medium">
                    Guest Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="m-guestEmail"
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="guest@example.com"
                    className="h-8 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="m-guestPhone" className="text-xs font-medium">
                    Phone / WhatsApp <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="m-guestPhone"
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="h-8 text-xs"
                    required
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: JOURNEY & PACKAGE ASSOCIATION */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Compass className="h-3.5 w-3.5 text-[#24543D]" /> Package &amp; Routing
                </span>
                <span className="text-[11px] text-muted-foreground">Curated package or custom itinerary</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="m-package" className="text-xs font-medium">
                    Curated Package Association
                  </Label>
                  <Select value={selectedPackageId} onValueChange={handlePackageChange}>
                    <SelectTrigger id="m-package" className="h-8 text-xs">
                      <SelectValue placeholder="Select curated package..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Custom Itinerary (No Package)</SelectItem>
                      {packages.map((pkg) => (
                        <SelectItem key={pkg.id} value={String(pkg.id)}>
                          {pkg.name} ({pkg.durationNights}N — {pkg.category || "Journey"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="m-destinations" className="text-xs font-medium">
                    Destinations / Route <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="m-destinations"
                    value={destinations}
                    onChange={(e) => setDestinations(e.target.value)}
                    placeholder="e.g. Kochi · Munnar · Alleppey"
                    className="h-8 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="m-travelDate" className="text-xs font-medium">
                    Arrival Travel Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="m-travelDate"
                    type="date"
                    value={travelDate}
                    onChange={(e) => setTravelDate(e.target.value)}
                    className="h-8 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="m-departureDate" className="text-xs font-medium">
                    Departure Date
                  </Label>
                  <Input
                    id="m-departureDate"
                    type="date"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="m-guestCount" className="text-xs font-medium">
                    Total Travellers <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="m-guestCount"
                    type="number"
                    min={1}
                    value={guestCount}
                    onChange={(e) => setGuestCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="h-8 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="m-travelStyle" className="text-xs font-medium">
                    Travel Style
                  </Label>
                  <Input
                    id="m-travelStyle"
                    value={travelStyle}
                    onChange={(e) => setTravelStyle(e.target.value)}
                    placeholder="e.g. Honeymoon, Slow-Luxury"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: COMMERCIAL & STATUS PARAMETERS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-[#24543D]" /> Pricing &amp; Status
                </span>
                <span className="text-[11px] text-muted-foreground">Track booking and payment independently</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="m-totalAmount" className="text-xs font-medium">
                    Agreed Total (INR) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="m-totalAmount"
                    type="number"
                    min={0}
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="h-8 text-xs font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="m-currency" className="text-xs font-medium">
                    Currency
                  </Label>
                  <Input
                    id="m-currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    placeholder="INR"
                    className="h-8 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="m-bookingStatus" className="text-xs font-medium">
                    Booking Status
                  </Label>
                  <Select
                    value={bookingStatus}
                    onValueChange={(val: any) => setBookingStatus(val)}
                  >
                    <SelectTrigger id="m-bookingStatus" className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="confirmed">Confirmed (Dates &amp; deposit locked)</SelectItem>
                      <SelectItem value="enquiry">Enquiry (Pending consultation)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="m-paymentStatus" className="text-xs font-medium">
                    Payment Status
                  </Label>
                  <Select
                    value={paymentStatus}
                    onValueChange={(val: any) => setPaymentStatus(val)}
                  >
                    <SelectTrigger id="m-paymentStatus" className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                      <SelectItem value="partially_paid">Partially Paid (Deposit received)</SelectItem>
                      <SelectItem value="paid">Fully Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="m-paymentTerms" className="text-xs font-medium">
                  Payment Terms
                </Label>
                <Input
                  id="m-paymentTerms"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  placeholder="e.g. 50% advance deposit upon confirmation, balance 15 days prior to arrival"
                  className="h-8 text-xs"
                />
              </div>
            </div>

            {/* SECTION 4: SPECIAL REQUESTS & INTERNAL NOTES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="m-specialRequests" className="text-xs font-medium">
                  Special Requests / Dietary Wishes
                </Label>
                <Textarea
                  id="m-specialRequests"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="e.g. Vegetarian cuisine, anniversary flower setup in houseboat..."
                  className="text-xs min-h-[64px]"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="m-notes" className="text-xs font-medium">
                  Internal Staff Notes
                </Label>
                <Textarea
                  id="m-notes"
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="e.g. Direct booking confirmed via WhatsApp with guest on 22 Oct."
                  className="text-xs min-h-[64px]"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="p-4 border-t bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-[11px] text-muted-foreground">
              A unique booking reference (<code className="font-mono text-foreground font-semibold">ESC-BKG-YYYY-XXXX</code>) will be generated automatically.
            </span>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                disabled={createMutation.isPending}
                className="text-xs"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                size="sm"
                disabled={!isFormValid || createMutation.isPending}
                className="bg-[#24543D] hover:bg-[#1b402e] text-[#FAF7F1] text-xs gap-1.5 font-medium shadow-xs cursor-pointer"
              >
                {createMutation.isPending ? (
                  <>Recording Booking...</>
                ) : (
                  <>
                    <ShoppingBag className="h-3.5 w-3.5" /> Create Booking
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
