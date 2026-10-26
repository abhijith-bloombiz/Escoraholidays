import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { InvoiceData } from "./invoices";

const LOCAL_STORAGE_KEY = "escora_admin_invoices_cache";

function getLocalInvoices(): InvoiceData[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocalInvoices(invoices: InvoiceData[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(invoices));
  } catch {
    // ignore
  }
}

export const getListInvoicesQueryKey = (filter?: { status?: string; search?: string }) => [
  "invoices",
  "list",
  filter?.status ?? "all",
  filter?.search ?? "",
];

export const getGetInvoiceQueryKey = (id: number) => ["invoices", "detail", id];

export function useListInvoices(filter?: { status?: string; search?: string }) {
  return useQuery<InvoiceData[]>({
    queryKey: getListInvoicesQueryKey(filter),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter?.status && filter.status !== "all") params.set("status", filter.status);
      if (filter?.search) params.set("search", filter.search);

      try {
        const res = await fetch(`/api/invoices?${params.toString()}`, {
          credentials: "include",
          headers: { Accept: "application/json" },
        });

        if (res.ok) {
          const data: InvoiceData[] = await res.json();
          // Update local cache
          if (data && data.length >= 0) {
            saveLocalInvoices(data);
          }
          return data;
        }
      } catch (err) {
        console.warn("API request failed, checking local cache", err);
      }

      // Fallback to local storage if API is temporarily unavailable
      let local = getLocalInvoices();
      if (filter?.status && filter.status !== "all") {
        local = local.filter((i) => i.status === filter.status);
      }
      if (filter?.search) {
        const q = filter.search.toLowerCase();
        local = local.filter(
          (i) =>
            i.invoiceNumber.toLowerCase().includes(q) ||
            i.customerName.toLowerCase().includes(q) ||
            (i.customerEmail && i.customerEmail.toLowerCase().includes(q)) ||
            i.title.toLowerCase().includes(q)
        );
      }
      return local;
    },
  });
}

export function useGetInvoice(id: number, options?: { enabled?: boolean }) {
  return useQuery<InvoiceData>({
    queryKey: getGetInvoiceQueryKey(id),
    enabled: options?.enabled ?? (id !== undefined && !Number.isNaN(id)),
    queryFn: async () => {
      try {
        const res = await fetch(`/api/invoices/${id}`, {
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        console.warn("API fetch error, falling back to local cache", err);
      }

      const local = getLocalInvoices().find((i) => i.id === id);
      if (local) return local;
      throw new Error("Invoice not found");
    },
  });
}

export function useGetNextInvoiceNumber() {
  return useQuery<{ invoiceNumber: string }>({
    queryKey: ["invoices", "next-number"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/invoices/next-number");
        if (res.ok) {
          return await res.json();
        }
      } catch {
        // fallback
      }
      const year = new Date().getFullYear();
      const local = getLocalInvoices();
      return { invoiceNumber: `ESC-INV-${year}-${String(local.length + 1).padStart(4, "0")}` };
    },
    staleTime: 0,
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<InvoiceData>) => {
      let isNetworkError = false;
      try {
        const res = await fetch("/api/invoices", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const created: InvoiceData = await res.json();
          const local = getLocalInvoices();
          saveLocalInvoices([created, ...local.filter((i) => i.id !== created.id)]);
          return created;
        }
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || `Failed to create invoice (Status ${res.status})`);
      } catch (err: any) {
        if (err.message && !err.message.includes("Failed to fetch") && !err.message.includes("NetworkError")) {
          // Explicit server error
          throw err;
        }
        isNetworkError = true;
      }

      if (isNetworkError) {
        // Offline creation fallback only on true network failure
        const local = getLocalInvoices();
        const nextId = (local.reduce((max, i) => Math.max(max, i.id), 0) || 100) + 1;
        const created: InvoiceData = {
          ...payload,
          id: nextId,
          invoiceNumber: payload.invoiceNumber || `ESC-INV-${new Date().getFullYear()}-${String(nextId).padStart(4, "0")}`,
          customerName: payload.customerName || "Valued Client",
          title: payload.title || "Custom Luxury Journey",
          issueDate: payload.issueDate || new Date().toISOString().slice(0, 10),
          status: payload.status || "issued",
          currency: payload.currency || "INR",
          items: payload.items || "[]",
          subtotal: payload.subtotal || 0,
          discount: payload.discount || 0,
          discountType: payload.discountType || "fixed",
          taxType: payload.taxType || "cgst_sgst",
          taxRate: payload.taxRate || 5,
          taxableAmount: payload.taxableAmount || 0,
          taxAmount: payload.taxAmount || 0,
          cgstAmount: payload.cgstAmount || 0,
          sgstAmount: payload.sgstAmount || 0,
          igstAmount: payload.igstAmount || 0,
          totalAmount: payload.totalAmount || 0,
          paidAmount: payload.paidAmount || 0,
          balanceDue: payload.balanceDue || 0,
          payments: payload.payments || "[]",
          auditTrail: payload.auditTrail || "[]",
          revision: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as InvoiceData;

        saveLocalInvoices([created, ...local]);
        return created;
      }
      throw new Error("Failed to create invoice");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

export function useUpdateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InvoiceData> & { revisionReason?: string | null; cancellationReason?: string | null } }) => {
      let isNetworkError = false;
      try {
        const res = await fetch(`/api/invoices/${id}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          const updated: InvoiceData = await res.json();
          const local = getLocalInvoices();
          saveLocalInvoices(local.map((i) => (i.id === id ? updated : i)));
          return updated;
        }
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || `Failed to update invoice (Status ${res.status})`);
      } catch (err: any) {
        if (err.message && !err.message.includes("Failed to fetch") && !err.message.includes("NetworkError")) {
          throw err;
        }
        isNetworkError = true;
      }

      if (isNetworkError) {
        const local = getLocalInvoices();
        const idx = local.findIndex((i) => i.id === id);
        if (idx !== -1) {
          const updated = { ...local[idx], ...data, updatedAt: new Date().toISOString() };
          local[idx] = updated;
          saveLocalInvoices(local);
          return updated;
        }
      }
      throw new Error("Invoice not found or network unavailable");
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: getGetInvoiceQueryKey(variables.id) });
    },
  });
}

export function useDeleteInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      try {
        const res = await fetch(`/api/invoices/${id}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (res.ok) {
          const local = getLocalInvoices();
          saveLocalInvoices(local.filter((i) => i.id !== id));
          return { success: true, id };
        }
      } catch (err) {
        console.warn("API delete failed, removing from local cache", err);
      }

      const local = getLocalInvoices();
      saveLocalInvoices(local.filter((i) => i.id !== id));
      return { success: true, id };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

