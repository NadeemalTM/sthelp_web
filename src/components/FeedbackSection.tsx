"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, MessageSquarePlus, Sparkles, Star, X } from "lucide-react";
import { FeedbackForm } from "@/components/FeedbackForm";

export type TestimonialItem = {
  id: string;
  customer_name: string;
  university?: string | null;
  rating: number;
  feedback: string;
  created_at?: string;
};

type FeedbackSectionProps = {
  testimonials: TestimonialItem[];
};

export function FeedbackSection({ testimonials }: FeedbackSectionProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<number | "all">("all");
  const [showAll, setShowAll] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Compute stats
  const stats = useMemo(() => {
    const total = testimonials.length;
    if (!total) return { average: 5.0, total: 0, count5: 0, count4: 0 };
    const sum = testimonials.reduce((acc, t) => acc + (t.rating || 5), 0);
    const count5 = testimonials.filter((t) => (t.rating || 5) === 5).length;
    const count4 = testimonials.filter((t) => (t.rating || 5) === 4).length;
    return {
      average: Number((sum / total).toFixed(1)),
      total,
      count5,
      count4
    };
  }, [testimonials]);

  // Filter items
  const filteredTestimonials = useMemo(() => {
    if (activeFilter === "all") return testimonials;
    return testimonials.filter((t) => (t.rating || 5) === activeFilter);
  }, [testimonials, activeFilter]);

  const displayedTestimonials = showAll
    ? filteredTestimonials
    : filteredTestimonials.slice(0, 6);

  function handleSuccess() {
    setModalOpen(false);
    setToastMessage("Thank you! Your feedback has been received and will appear after review.");
    setTimeout(() => setToastMessage(null), 6000);
  }

  return (
    <section className="section testimonial-section" id="feedback" data-public-reveal>
      <div className="container">
        {/* Toast notification */}
        {toastMessage ? (
          <div className="feedback-toast" role="status" aria-live="polite">
            <CheckCircle2 size={18} color="#15805d" />
            <span>{toastMessage}</span>
            <button
              type="button"
              className="toast-close-btn"
              onClick={() => setToastMessage(null)}
              aria-label="Close message"
            >
              <X size={14} />
            </button>
          </div>
        ) : null}

        {/* Section Header */}
        <div className="testimonial-header-row">
          <div className="testimonial-heading-block">
            <span className="eyebrow">A note from clients</span>
            <h2>
              Less uncertainty.<br />
              <em>More clarity.</em>
            </h2>
            <p className="testimonial-sublead">
              Real feedback from university students across Sri Lanka. Every review reflects authentic guidance, deadlines met, and individual support.
            </p>
          </div>

          <div className="testimonial-header-actions">
            {/* Social proof badges */}
            <div className="feedback-proof-pill">
              <span className="proof-star">★</span>
              <strong>{stats.average} / 5.0</strong>
              <span className="proof-divider">•</span>
              <span>{stats.total}+ student reviews</span>
            </div>

            <div className="feedback-cta-buttons">
              <button
                type="button"
                className="btn btn-coral feedback-add-cta"
                onClick={() => setModalOpen(true)}
              >
                <MessageSquarePlus size={18} />
                <span>Add your feedback</span>
              </button>
              <Link className="text-action feedback-all-link" href="/feedback">
                <span>View all reviews</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="feedback-filter-strip">
          <div className="filter-pills" role="tablist" aria-label="Filter reviews by star rating">
            <button
              type="button"
              className={`filter-pill ${activeFilter === "all" ? "active" : ""}`}
              onClick={() => setActiveFilter("all")}
              role="tab"
              aria-selected={activeFilter === "all"}
            >
              All reviews ({testimonials.length})
            </button>
            <button
              type="button"
              className={`filter-pill ${activeFilter === 5 ? "active" : ""}`}
              onClick={() => setActiveFilter(5)}
              role="tab"
              aria-selected={activeFilter === 5}
            >
              5 Stars ★★★★★ ({stats.count5})
            </button>
            {stats.count4 > 0 ? (
              <button
                type="button"
                className={`filter-pill ${activeFilter === 4 ? "active" : ""}`}
                onClick={() => setActiveFilter(4)}
                role="tab"
                aria-selected={activeFilter === 4}
              >
                4 Stars ★★★★☆ ({stats.count4})
              </button>
            ) : null}
          </div>

          <div className="filter-guarantee">
            <Sparkles size={14} className="sparkle-icon" />
            <span>Verified student submissions</span>
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="testimonial-stage">
          {displayedTestimonials.map((item, index) => {
            const ratingNum = item.rating || 5;
            return (
              <article
                className={`client-note note-${(index % 3) + 1}`}
                key={item.id || index}
              >
                <div className="note-meta">
                  <span className="stars" aria-label={`${ratingNum} out of 5 stars`}>
                    {"★".repeat(ratingNum)}
                  </span>
                  <span className="note-index">{String(index + 1).padStart(2, "0")}</span>
                </div>

                <p className="note-quote">“{item.feedback}”</p>

                <div className="note-footer">
                  <div className="note-author">
                    <strong className="note-name">{item.customer_name}</strong>
                    {item.university ? (
                      <span className="note-uni"> · {item.university}</span>
                    ) : null}
                  </div>
                  <span className="note-verified-badge" title="Verified review">
                    ✓ Verified
                  </span>
                </div>
              </article>
            );
          })}

          {filteredTestimonials.length === 0 ? (
            <div className="feedback-empty-state">
              <Star size={32} color="#e7bd63" />
              <h3>No reviews in this category yet</h3>
              <p className="muted">Be the first student to leave feedback for this rating.</p>
              <button
                type="button"
                className="btn btn-soft"
                onClick={() => setModalOpen(true)}
              >
                Add your feedback
              </button>
            </div>
          ) : null}
        </div>

        {/* Show more toggle or full page link */}
        {filteredTestimonials.length > 6 ? (
          <div className="feedback-bottom-actions">
            <button
              type="button"
              className="btn btn-soft"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? "Show fewer reviews" : `Show all ${filteredTestimonials.length} reviews`}
            </button>
            <Link className="text-action" href="/feedback">
              Open feedback page <span>↗</span>
            </Link>
          </div>
        ) : null}
      </div>

      {/* Modal Dialog for Feedback Submission */}
      {modalOpen ? (
        <div
          className="feedback-modal-backdrop"
          onClick={() => setModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="feedback-modal-title"
        >
          <div
            className="feedback-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="feedback-modal-header">
              <div>
                <span className="eyebrow">StHelp Community</span>
                <h3 id="feedback-modal-title">Share your experience</h3>
                <p className="muted tiny">
                  Your feedback helps fellow students and allows us to continually refine our assignment support.
                </p>
              </div>
              <button
                type="button"
                className="feedback-modal-close"
                onClick={() => setModalOpen(false)}
                aria-label="Close dialog"
              >
                <X size={20} />
              </button>
            </div>

            <div className="feedback-modal-body">
              <FeedbackForm onSuccess={handleSuccess} compact />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
