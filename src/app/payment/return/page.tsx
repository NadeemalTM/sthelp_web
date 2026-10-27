"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";

export default function PayHereReturnPage() {
  const [hasSavedPortal, setHasSavedPortal] = useState(true);

  useEffect(() => {
    const state = new URL(window.location.href).searchParams.get("state") === "cancelled"
      ? "cancelled"
      : "returned";
    let savedPath = "";
    try {
      savedPath = window.sessionStorage.getItem("sthelp-payhere-return-path") || "";
      window.sessionStorage.removeItem("sthelp-payhere-return-path");
    } catch {
      savedPath = "";
    }
    if (/^\/portal\/[A-Za-z0-9-]+$/.test(savedPath)) {
      window.location.replace(`${savedPath}?payment=${state}`);
      return;
    }
    setHasSavedPortal(false);
  }, []);

  return <main className="portal-loading-page"><div className="portal-loading-card">{hasSavedPortal?<><Loader2 className="spinner" size={28}/><div><strong>Returning to your workspace</strong><p>Your payment is confirmed only after PayHere sends its signed server notification.</p></div></>:<><CheckCircle2 size={28}/><div><strong>Return to your private portal</strong><p>Open your StHelp portal link again to see the latest verified payment status.</p><Link className="btn btn-dark" href="/access">Open portal access</Link></div></>}</div></main>;
}
