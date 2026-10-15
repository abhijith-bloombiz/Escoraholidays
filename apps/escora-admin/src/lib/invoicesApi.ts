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

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<InvoiceData>) => {
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
      } catch (err) {
        console.warn("API create failed, saving to local cache", err);
      }

      // Offline creation
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
        taxRate: payload.taxRate || 5,
        taxAmount: payload.taxAmount || 0,
        totalAmount: payload.totalAmount || 0,
        paidAmount: payload.paidAmount || 0,
        balanceDue: payload.balanceDue || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as InvoiceData;

      saveLocalInvoices([created, ...local]);
      return created;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

export function useUpdateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InvoiceData> }) => {
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
      } catch (err) {
        console.warn("API update failed, updating local cache", err);
      }

      const local = getLocalInvoices();
      const idx = local.findIndex((i) => i.id === id);
      if (idx !== -1) {
        const updated = { ...local[idx], ...data, updatedAt: new Date().toISOString() };
        local[idx] = updated;
        saveLocalInvoices(local);
        return updated;
      }
      throw new Error("Invoice not found");
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
