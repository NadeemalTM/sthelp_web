import { Zap, ArrowRight } from "lucide-react";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";

export function UrgentDeadlineBanner({ whatsapp }: { whatsapp: string }) {
  const wa = whatsapp.replace(/\D/g, "");
  const urgentText = encodeURIComponent(
    "Hi StHelp! I have an URGENT assignment due in 24-48 hours. Can you review my brief and let me know if you can take this on immediately?"
  );
  const urgentHref = wa ? `https://wa.me/${wa}?text=${urgentText}` : "#";

  return (
    <section className="urgent-sales-strip" aria-label="Urgent assignment support">
      <div className="container urgent-sales-inner">
        <div className="urgent-sales-badge">
          <Zap size={16} className="urgent-pulse-icon" />
          <span>24H EXPRESS DESK</span>
        </div>
        <div className="urgent-sales-copy">
          <strong>Deadline in 24–48 hours? Don’t panic.</strong>
          <span>Express tutors are active now for urgent university submissions.</span>
        </div>
        <div className="urgent-sales-actions">
          <a
            className="btn btn-urgent-wa"
            href={urgentHref}
            target="_blank"
            rel="noreferrer"
            aria-label="Contact urgent assignment desk on WhatsApp"
          >
            <WhatsAppIcon size={19} />
            <span>Message Urgent Desk</span>
          </a>
          <a className="urgent-request-link" href="/place-assignment">
            <span>Or submit brief online</span>
            <ArrowRight size={14} />
          </a>
        </div>
      </div>
    </section>
  );
}
