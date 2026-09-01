"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function FloatingAssignmentCta({ watchSelector }: { watchSelector?: string }) {
  const [primaryActionVisible, setPrimaryActionVisible] = useState(false);

  useEffect(() => {
    if (!watchSelector) return;

    const media = window.matchMedia("(max-width: 760px)");
    let observer: IntersectionObserver | null = null;

    const syncObserver = () => {
      observer?.disconnect();
      observer = null;
      setPrimaryActionVisible(false);

      if (!media.matches) return;
      const primaryAction = document.querySelector(watchSelector);
      if (!primaryAction) return;

      observer = new IntersectionObserver(
        ([entry]) => setPrimaryActionVisible(entry.isIntersecting),
        { rootMargin: "-64px 0px -12% 0px", threshold: 0.05 }
      );
      observer.observe(primaryAction);
    };

    syncObserver();
    media.addEventListener("change", syncObserver);
    return () => {
      observer?.disconnect();
      media.removeEventListener("change", syncObserver);
    };
  }, [watchSelector]);

  return <Link
    className={`floating-assignment-cta${primaryActionVisible ? " is-primary-action-visible" : ""}`}
    href="/place-assignment"
    aria-label="Start a new assignment request"
    aria-hidden={primaryActionVisible || undefined}
    tabIndex={primaryActionVisible ? -1 : undefined}
  ><span><small>Need support?</small><strong>Start your assignment</strong></span><i><ArrowUpRight size={20}/></i></Link>;
}
