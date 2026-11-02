import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface HomeExperienceCard {
  id: number;
  slot: number;
  title: string;
  tag: string;
  location: string;
  duration: string;
  desc: string;
  inclusion: string;
  videoUrl: string;
  posterUrl?: string | null;
  experienceSlug?: string | null;
  ctaText?: string | null;
  published: boolean;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type HomeExperienceCardInput = Partial<Omit<HomeExperienceCard, "id" | "createdAt" | "updatedAt">>;

export const HOME_EXPERIENCES_QUERY_KEY = ["/api/home-experiences"] as const;

export function useListHomeExperiences() {
  return useQuery<HomeExperienceCard[]>({
    queryKey: HOME_EXPERIENCES_QUERY_KEY,
    queryFn: async () => {
      const res = await fetch("/api/home-experiences");
      if (!res.ok) {
        throw new Error(`Failed to fetch home experiences (${res.status})`);
      }
      return res.json();
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useUpdateHomeExperienceCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ slot, data }: { slot: number; data: HomeExperienceCardInput }) => {
      const res = await fetch(`/api/home-experiences/${slot}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Failed to update card for slot ${slot}`);
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: HOME_EXPERIENCES_QUERY_KEY });
    },
  });
}
