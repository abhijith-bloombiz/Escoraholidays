import { useQuery } from "@tanstack/react-query";

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
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}
