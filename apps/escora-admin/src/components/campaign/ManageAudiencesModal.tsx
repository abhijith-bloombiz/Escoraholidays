import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Plus,
  Trash2,
  RefreshCw,
  Sparkles,
  UserPlus,
  Compass,
  CheckCircle2,
  XCircle,
  FolderOpen,
} from "lucide-react";

interface AudienceMember {
  email: string;
  name?: string;
  addedAt?: string;
}

interface DynamicRules {
  destinations?: string[];
  travelStyle?: string;
  customerStatus?: "lead_only" | "confirmed_bookers" | "repeat_customers" | "all";
  minBookings?: number;
  inactiveDays?: number;
}

interface AudienceGroup {
  id: string;
  name: string;
  description?: string;
  type: "manual" | "dynamic";
  members?: AudienceMember[];
  memberCount: number;
  rules?: DynamicRules;
  createdAt: string;
  updatedAt: string;
}

interface ManageAudiencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const KERALA_DESTINATIONS = [
  "Munnar",
  "Alleppey",
  "Wayanad",
  "Kovalam",
  "Thekkady",
  "Kochi",
  "Kumarakom",
  "Varkala",
  "Bekal",
  "Athirappilly",
];

export default function ManageAudiencesModal({ isOpen, onClose }: ManageAudiencesModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedGroup, setSelectedGroup] = useState<AudienceGroup | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Creation form state
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    type: "manual" | "dynamic";
    destinations: string[];
    travelStyle: string;
    customerStatus: "all" | "lead_only" | "confirmed_bookers" | "repeat_customers";
    minBookings: number;
    inactiveDays: number;
  }>({
    name: "",
    description: "",
    type: "manual",
    destinations: [],
    travelStyle: "",
    customerStatus: "all",
    minBookings: 1,
    inactiveDays: 0,
  });

  // Manual member addition state
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberName, setNewMemberName] = useState("");

  // Query all audience groups
  const { data: groups = [], isLoading, refetch } = useQuery<AudienceGroup[]>({
    queryKey: ["campaigns", "audiences"],
    queryFn: async () => {
      const res = await fetch("/api/campaigns/audiences", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load audience groups");
      return res.json();
    },
    enabled: isOpen,
  });

  // Query live preview for currently selected group
  const {
    data: groupPreview,
    isLoading: isPreviewLoading,
    refetch: refetchPreview,
  } = useQuery<{
    groupId: string;
    name: string;
    type: string;
    eligibleCount: number;
    unsubscribedExcluded: number;
    sampleRecipients: Array<{ email: string; name?: string; source?: string }>;
  }>({
    queryKey: ["campaigns", "audiences", selectedGroup?.id, "preview"],
    queryFn: async () => {
      if (!selectedGroup) return null;
      const res = await fetch(`/api/campaigns/audiences/${selectedGroup.id}/preview`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to preview group");
      return res.json();
    },
    enabled: Boolean(selectedGroup),
  });

  // Mutation to create group
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/campaigns/audiences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create audience group");
      }
      return res.json();
    },
    onSuccess: (newGroup) => {
      toast({
        title: "Audience Group Created",
        description: `Group "${newGroup.name}" is ready for campaign targeting.`,
      });
      queryClient.invalidateQueries({ queryKey: ["campaigns", "audiences"] });
      setIsCreating(false);
      setSelectedGroup(newGroup);
    },
    onError: (err: any) => {
      toast({
        title: "Creation Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Mutation to delete group
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/campaigns/audiences/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete audience group");
    },
    onSuccess: () => {
      toast({
        title: "Group Removed",
        description: "The audience group has been deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["campaigns", "audiences"] });
      setSelectedGroup(null);
    },
  });

  // Mutation to add member to manual group
  const addMemberMutation = useMutation({
    mutationFn: async ({ groupId, email, name }: { groupId: string; email: string; name?: string }) => {
      const res = await fetch(`/api/campaigns/audiences/${groupId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, name }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add member");
      }
      return res.json();
    },
    onSuccess: (updatedGroup) => {
      toast({
        title: "Member Added",
        description: `${newMemberEmail} added to group.`,
      });
      setNewMemberEmail("");
      setNewMemberName("");
      setSelectedGroup(updatedGroup);
      queryClient.invalidateQueries({ queryKey: ["campaigns", "audiences"] });
    },
    onError: (err: any) => {
      toast({
        title: "Cannot Add Member",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Mutation to remove member
  const removeMemberMutation = useMutation({
    mutationFn: async ({ groupId, email }: { groupId: string; email: string }) => {
      const res = await fetch(`/api/campaigns/audiences/${groupId}/members/${encodeURIComponent(email)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to remove member");
      return res.json();
    },
    onSuccess: (updatedGroup) => {
      toast({
        title: "Member Removed",
        description: "Contact was removed from this group.",
      });
      setSelectedGroup(updatedGroup);
      queryClient.invalidateQueries({ queryKey: ["campaigns", "audiences"] });
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: "Name Required",
        description: "Please specify a name for this audience group.",
        variant: "destructive",
      });
      return;
    }

    const payload: any = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      type: formData.type,
    };

    if (formData.type === "dynamic") {
      payload.rules = {
        destinations: formData.destinations.length > 0 ? formData.destinations : undefined,
        travelStyle: formData.travelStyle || undefined,
        customerStatus: formData.customerStatus !== "all" ? formData.customerStatus : undefined,
        minBookings: formData.customerStatus === "repeat_customers" ? 2 : undefined,
        inactiveDays: formData.inactiveDays > 0 ? formData.inactiveDays : undefined,
      };
    }

    createMutation.mutate(payload);
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup || !newMemberEmail.trim()) return;
    addMemberMutation.mutate({
      groupId: selectedGroup.id,
      email: newMemberEmail.trim(),
      name: newMemberName.trim() || undefined,
    });
  };

  const toggleDestination = (dest: string) => {
    setFormData((prev) => ({
      ...prev,
      destinations: prev.destinations.includes(dest)
        ? prev.destinations.filter((d) => d !== dest)
        : [...prev.destinations, dest],
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl w-[95vw] h-[88vh] max-h-[88vh] p-0 flex flex-col bg-[#FAF7F1] dark:bg-card border-[#E5DDD0] shadow-2xl rounded-xl overflow-hidden">
        {/* Header */}
        <div className="shrink-0 px-6 py-4 border-b border-[#E5DDD0] bg-[#FFFDF9] dark:bg-card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-[#24543D]/10 text-[#24543D] flex items-center justify-center font-serif text-lg font-semibold border border-[#24543D]/20">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="font-serif text-xl font-normal text-foreground tracking-wide">
                Audience Group Management
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Segment contacts into reusable manual lists or rule-based dynamic marketing groups.
              </DialogDescription>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setIsCreating(true);
              setSelectedGroup(null);
            }}
            className="bg-[#24543D] hover:bg-[#1b3f2e] text-white text-xs h-8 px-3"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            New Audience Group
          </Button>
        </div>

        {/* Content Layout: Master-Detail */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: Group List */}
          <div className="w-80 shrink-0 border-r border-[#E5DDD0] bg-[#FFFDF9]/60 dark:bg-muted/10 flex flex-col">
            <div className="p-3 border-b border-[#E5DDD0] flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Audience Groups ({groups.length})
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => refetch()}
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                title="Refresh Groups"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {isLoading ? (
                <div className="p-6 text-center text-xs text-muted-foreground">Loading audience groups...</div>
              ) : groups.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  <FolderOpen className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                  No audience groups created yet. Click "New Audience Group" to create one.
                </div>
              ) : (
                groups.map((group) => {
                  const isSelected = selectedGroup?.id === group.id && !isCreating;
                  return (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => {
                        setSelectedGroup(group);
                        setIsCreating(false);
                      }}
                      className={`w-full text-left p-3 rounded-lg border transition-all text-xs ${
                        isSelected
                          ? "border-[#24543D] bg-[#24543D]/5 shadow-sm"
                          : "border-transparent hover:border-[#E5DDD0] hover:bg-white dark:hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5 mb-1">
                        <span className="font-semibold text-foreground truncate">{group.name}</span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 capitalize ${
                            group.type === "dynamic"
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}
                        >
                          {group.type}
                        </Badge>
                      </div>
                      {group.description && (
                        <p className="text-[11px] text-muted-foreground line-clamp-1 mb-1.5">{group.description}</p>
                      )}
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" /> {group.memberCount} members
                        </span>
                        <span>{new Date(group.createdAt).toLocaleDateString()}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Group Details or Creation Form */}
          <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-card">
            {isCreating ? (
              /* Create New Audience Group Form */
              <form onSubmit={handleCreateSubmit} className="max-w-2xl space-y-6">
                <div>
                  <h3 className="font-serif text-lg font-medium text-foreground">Create New Audience Group</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Define group parameters and membership rules.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider block">
                      Group Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="e.g. VIP Backwaters Honeymooners"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="text-sm h-9 border-[#E5DDD0]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider block">Description</label>
                    <Textarea
                      placeholder="Optional notes regarding the purpose or target segment for this group"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="text-xs border-[#E5DDD0] resize-none h-18"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider block">Group Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: "manual" })}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          formData.type === "manual"
                            ? "border-[#24543D] bg-[#24543D]/5"
                            : "border-[#E5DDD0] hover:bg-muted/30"
                        }`}
                      >
                        <div className="font-semibold text-xs text-foreground mb-0.5">Manual Group</div>
                        <div className="text-[11px] text-muted-foreground">
                          Staff explicitly add and remove contact email addresses.
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: "dynamic" })}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          formData.type === "dynamic"
                            ? "border-[#24543D] bg-[#24543D]/5"
                            : "border-[#E5DDD0] hover:bg-muted/30"
                        }`}
                      >
                        <div className="font-semibold text-xs text-foreground mb-0.5">Dynamic Group</div>
                        <div className="text-[11px] text-muted-foreground">
                          Automatically calculated from destination interests, customer status, and activity rules.
                        </div>
                      </button>
                    </div>
                  </div>

                  {formData.type === "dynamic" && (
                    <div className="p-4 rounded-lg border border-[#24543D]/20 bg-[#24543D]/5 space-y-4 text-xs">
                      <div className="font-semibold text-foreground flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-[#24543D]" /> Dynamic Segmentation Rules
                      </div>

                      {/* Destination Filters */}
                      <div className="space-y-1.5">
                        <label className="font-semibold text-[11px] text-muted-foreground uppercase tracking-wider block">
                          Destination Interests (Optional)
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {KERALA_DESTINATIONS.map((dest) => {
                            const isSelected = formData.destinations.includes(dest);
                            return (
                              <button
                                key={dest}
                                type="button"
                                onClick={() => toggleDestination(dest)}
                                className={`px-2 py-1 rounded text-xs border transition-colors ${
                                  isSelected
                                    ? "bg-[#24543D] text-white border-[#24543D]"
                                    : "bg-white border-[#E5DDD0] text-muted-foreground hover:text-foreground"
                                }`}
                              >
                                {dest}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Customer Status */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="font-semibold text-[11px] text-muted-foreground uppercase tracking-wider block">
                            Customer Status
                          </label>
                          <select
                            value={formData.customerStatus}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                customerStatus: e.target.value as any,
                              })
                            }
                            className="w-full h-8 px-2 rounded border border-[#E5DDD0] text-xs bg-white"
                          >
                            <option value="all">All Contacts (Leads & Guests)</option>
                            <option value="lead_only">Enquiries Only (No Bookings Yet)</option>
                            <option value="confirmed_bookers">Confirmed Past Guests (1+ bookings)</option>
                            <option value="repeat_customers">Repeat Connoisseurs (2+ bookings)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="font-semibold text-[11px] text-muted-foreground uppercase tracking-wider block">
                            Re-engagement (Inactive Days)
                          </label>
                          <select
                            value={formData.inactiveDays}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                inactiveDays: Number(e.target.value),
                              })
                            }
                            className="w-full h-8 px-2 rounded border border-[#E5DDD0] text-xs bg-white"
                          >
                            <option value={0}>Any time (No inactivity filter)</option>
                            <option value={30}>No activity for 30+ days</option>
                            <option value={60}>No activity for 60+ days</option>
                            <option value={90}>No activity for 90+ days</option>
                            <option value={180}>No activity for 180+ days</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-[#E5DDD0]">
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="bg-[#24543D] hover:bg-[#1b3f2e] text-white text-xs h-9 px-4"
                  >
                    {createMutation.isPending ? "Creating..." : "Save Audience Group"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCreating(false)}
                    className="text-xs h-9"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : selectedGroup ? (
              /* Selected Group Details & Management */
              <div className="max-w-3xl space-y-6">
                {/* Header & Meta */}
                <div className="flex items-start justify-between border-b border-[#E5DDD0] pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-serif text-xl font-normal text-foreground">{selectedGroup.name}</h3>
                      <Badge
                        variant="outline"
                        className={`text-xs capitalize ${
                          selectedGroup.type === "dynamic"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}
                      >
                        {selectedGroup.type}
                      </Badge>
                    </div>
                    {selectedGroup.description && (
                      <p className="text-xs text-muted-foreground">{selectedGroup.description}</p>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Delete audience group "${selectedGroup.name}"?`)) {
                        deleteMutation.mutate(selectedGroup.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs h-8"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete Group
                  </Button>
                </div>

                {/* Audience Reach & Consent Status Card */}
                <div className="p-4 rounded-xl border border-[#24543D]/25 bg-[#24543D]/5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-[#24543D]/10 text-[#24543D] flex items-center justify-center">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-[#24543D]">
                        {isPreviewLoading ? (
                          "Calculating reach..."
                        ) : groupPreview ? (
                          `${groupPreview.eligibleCount} Eligible Recipients`
                        ) : (
                          `${selectedGroup.memberCount} Members`
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {groupPreview ? (
                          <span>
                            {groupPreview.unsubscribedExcluded} opted-out contacts automatically excluded to protect
                            marketing consent.
                          </span>
                        ) : (
                          "Recipients with active marketing consent will receive campaigns targeted to this group."
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetchPreview()}
                    className="h-8 text-xs border-[#24543D]/30 text-[#24543D]"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" /> Re-calculate
                  </Button>
                </div>

                {/* Dynamic Group Rules Inspector */}
                {selectedGroup.type === "dynamic" && selectedGroup.rules && (
                  <div className="p-4 rounded-lg border border-[#E5DDD0] bg-[#FFFDF9] space-y-3 text-xs">
                    <div className="font-semibold uppercase tracking-wider text-muted-foreground text-[11px]">
                      Configured Dynamic Rules
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-muted-foreground">Destinations: </span>
                        <span className="font-medium text-foreground">
                          {selectedGroup.rules.destinations?.length
                            ? selectedGroup.rules.destinations.join(", ")
                            : "All Destinations"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Customer Status: </span>
                        <span className="font-medium text-foreground capitalize">
                          {selectedGroup.rules.customerStatus?.replace("_", " ") || "All"}
                        </span>
                      </div>
                      {selectedGroup.rules.inactiveDays && (
                        <div>
                          <span className="text-muted-foreground">Inactivity Period: </span>
                          <span className="font-medium text-foreground">
                            {selectedGroup.rules.inactiveDays}+ days since last inquiry/order
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Manual Group Contact Management */}
                {selectedGroup.type === "manual" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-xs text-foreground uppercase tracking-wider">
                        Group Members ({selectedGroup.members?.length || 0})
                      </div>
                    </div>

                    {/* Add Member Form */}
                    <form onSubmit={handleAddMember} className="flex gap-2">
                      <Input
                        type="email"
                        placeholder="Guest email address (required)"
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                        className="text-xs h-8 border-[#E5DDD0] flex-1"
                        required
                      />
                      <Input
                        type="text"
                        placeholder="Guest name (optional)"
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        className="text-xs h-8 border-[#E5DDD0] w-48"
                      />
                      <Button
                        type="submit"
                        disabled={addMemberMutation.isPending || !newMemberEmail.trim()}
                        className="bg-[#24543D] hover:bg-[#1b3f2e] text-white text-xs h-8 px-3"
                      >
                        <UserPlus className="h-3.5 w-3.5 mr-1" />
                        Add Member
                      </Button>
                    </form>

                    {/* Member Table */}
                    <div className="border border-[#E5DDD0] rounded-lg overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-[#FAF7F1] border-b border-[#E5DDD0] text-muted-foreground">
                          <tr>
                            <th className="py-2 px-3 text-left font-semibold">Email</th>
                            <th className="py-2 px-3 text-left font-semibold">Name</th>
                            <th className="py-2 px-3 text-left font-semibold">Added On</th>
                            <th className="py-2 px-3 text-right font-semibold">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5DDD0]">
                          {(!selectedGroup.members || selectedGroup.members.length === 0) ? (
                            <tr>
                              <td colSpan={4} className="py-6 text-center text-muted-foreground">
                                No members added to this manual group yet.
                              </td>
                            </tr>
                          ) : (
                            selectedGroup.members.map((member) => (
                              <tr key={member.email} className="hover:bg-muted/10">
                                <td className="py-2 px-3 font-mono text-[11px] text-foreground">{member.email}</td>
                                <td className="py-2 px-3 text-muted-foreground">{member.name || "—"}</td>
                                <td className="py-2 px-3 text-muted-foreground text-[11px]">
                                  {member.addedAt ? new Date(member.addedAt).toLocaleDateString() : "—"}
                                </td>
                                <td className="py-2 px-3 text-right">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      removeMemberMutation.mutate({
                                        groupId: selectedGroup.id,
                                        email: member.email,
                                      })
                                    }
                                    className="h-6 w-6 text-muted-foreground hover:text-red-600"
                                    title="Remove from group"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                <Compass className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <h4 className="font-serif text-base text-foreground font-medium mb-1">Select an Audience Group</h4>
                <p className="text-xs max-w-sm">
                  Choose a group from the left panel to inspect membership, configure dynamic rules, or create a new
                  group.
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
