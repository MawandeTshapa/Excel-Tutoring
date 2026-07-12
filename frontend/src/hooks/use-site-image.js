import { useEffect, useState } from "react";
import api from "@/lib/api";

// Simple in-memory cache so every page using this hook doesn't refetch on every mount.
let cache = null;
let inflight = null;

async function fetchSiteImages() {
  if (cache) return cache;
  if (!inflight) {
    inflight = api.get("/site-images").then((r) => {
      cache = r.data;
      return cache;
    }).catch(() => ({}));
  }
  return inflight;
}

/**
 * Returns the admin-uploaded photo URL for a given slot (see IMAGE_SLOTS in ContentAdmin.jsx),
 * or `fallback` until the admin has uploaded one.
 */
export function useSiteImage(slot, fallback) {
  const [url, setUrl] = useState(fallback);

  useEffect(() => {
    let active = true;
    fetchSiteImages().then((images) => {
      if (active && images?.[slot]) setUrl(images[slot]);
    });
    return () => { active = false; };
  }, [slot]);

  return url;
}