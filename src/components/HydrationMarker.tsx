"use client";

import { useEffect } from "react";

export default function HydrationMarker() {
  useEffect(() => {
    try {
      document.documentElement.setAttribute("data-hydrated", "1");
    } catch (e) {
      // silently ignore
    }
  }, []);
  return null;
}