"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Filter, ShieldCheck, Sparkles, Star } from "lucide-react";
import { FeedbackForm } from "@/components/FeedbackForm";
import type { TestimonialItem } from "@/components/FeedbackSection";

type FeedbackPageClientProps = {
  testimonials: TestimonialItem[];
};

export function FeedbackPageClient({ testimonials }: FeedbackPageClientProps) {
  const [activeFilter, setActiveFilter] = useState<number | "all">("all");
  const [submittedNotice, setSubmittedNotice] = useState(false);

  // Stats calculation
  const stats = useMemo(() => {
    const total = testimonials.length;
    if (!total) {
      return {
        average: 5.0,
        total: 0,
        breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        percent5: 100
      };
    }

    const breakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;

    for (const t of testimonials) {
      const r = t.rating || 5;
      if (breakdown[r] !== undefined) breakdown[r]++;
      sum += r;
    }

    const average = Number((sum / total).toFixed(1));
    const percent5 = Math.round((breakdown[5] / total) * 100);

    return { average, total, breakdown, percent5 };
  }, [testimonials]);

  const filtered = useMemo(() => {
    if (activeFilter === "all") return testimonials;
    return testimonials.filter((t) => (t.rating || 5) === activeFilter);
  }, [testimonials, activeFilter]);

  return (
    <div className="feedback-hub-grid">
      {/* Left Column: Direct Submission Form Card */}
      <aside className="feedback-submit-aside">
        <div className="feedback-submit-card">
          <div className="card-header">
            <span className="eyebrow">Direct Website Option</span>
            <h2>Share your feedback</h2>
            <p className="muted tiny">
              Anyone who has used StHelp can submit a review. We appreciate your honest thoughts to help us keep improving.
            </p>
          </div>

          <FeedbackForm
            onSuccess={() => {
              setSubmittedNotice(true);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </div>

        {/* Verification Guarantee */}
        <div className="feedback-trust-box">
          <div className="trust-icon-row">
            <ShieldCheck size={22} color="#15805d" />
            <strong>How feedback works</strong>
          </div>
          <p className="tiny muted">
            Every submission is checked by our team for authentic service details. We never publish fake or paid reviews. Your privacy is respected and names can remain anonymous.
          </p>
        </div>
      </aside>

      {/* Right Column: Reviews Directory & Ratings Breakdown */}
      <section className="feedback-list-section" aria-label="Student reviews archive">
        {submittedNotice ? (
          <div className="notice notice-success" style={{ marginBottom: 24 }}>
            <CheckCircle2 size={20} color="#15805d" style={{ marginRight: 8, verticalAlign: "middle" }} />
            <span>Thank you! Your feedback has been received and will be listed here after team verification.</span>
          </div>
        ) : null}

        {/* Rating Overview Card */}
        <div className="feedback-stats-banner">
          <div className="stats-score-box">
            <div className="score-number">{stats.average}</div>
            <div className="score-stars">{"★".repeat(Math.round(stats.average))}</div>
            <div className="score-total">Based on {stats.total} verified reviews</div>
          </div>

          <div className="stats-breakdown-bars">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = stats.breakdown[stars] || 0;
              const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
              return (
                <button
                  type="button"
                  key={stars}
                  className={`bar-row ${activeFilter === stars ? "bar-active" : ""}`}
                  onClick={() => setActiveFilter(activeFilter === stars ? "all" : stars)}
                  title={`Filter by ${stars} stars (${count} reviews)`}
                >
                  <span className="bar-label">{stars} ★</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="bar-count">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter Navigation */}
        <div className="feedback-filter-nav">
          <div className="filter-title">
            <Filter size={15} />
            <span>Showing:</span>
          </div>
          <div className="filter-buttons">
            <button
              type="button"
              className={`filter-btn ${activeFilter === "all" ? "active" : ""}`}
              onClick={() => setActiveFilter("all")}
            >
              All ({testimonials.length})
            </button>
            <button
              type="button"
              className={`filter-btn ${activeFilter === 5 ? "active" : ""}`}
              onClick={() => setActiveFilter(5)}
            >
              5 Stars ({stats.breakdown[5] || 0})
            </button>
            {stats.breakdown[4] > 0 ? (
              <button
                type="button"
                className={`filter-btn ${activeFilter === 4 ? "active" : ""}`}
                onClick={() => setActiveFilter(4)}
              >
                4 Stars ({stats.breakdown[4] || 0})
              </button>
            ) : null}
          </div>
        </div>

        {/* Testimonials List */}
        <div className="feedback-cards-stream">
          {filtered.map((item, index) => {
            const ratingNum = item.rating || 5;
            return (
              <article className="feedback-hub-card" key={item.id || index}>
                <div className="card-top">
                  <div className="stars-and-date">
                    <span className="stars">{"★".repeat(ratingNum)}</span>
                    <span className="rating-num">{ratingNum}.0</span>
                  </div>
                  <span className="verified-pill">
                    <Sparkles size={12} /> Verified review
                  </span>
                </div>

                <blockquote className="feedback-quote">
                  “{item.feedback}”
                </blockquote>

                <div className="card-bottom">
                  <div className="reviewer-info">
                    <strong className="reviewer-name">{item.customer_name}</strong>
                    {item.university ? (
                      <span className="reviewer-uni">{item.university}</span>
                    ) : (
                      <span className="reviewer-uni">Sri Lankan University Student</span>
                    )}
                  </div>
                  {item.created_at ? (
                    <time className="review-date" dateTime={item.created_at}>
                      {new Date(item.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short"
                      })}
                    </time>
                  ) : null}
                </div>
              </article>
            );
          })}

          {filtered.length === 0 ? (
            <div className="feedback-empty-state">
              <Star size={36} color="#e7bd63" />
              <h3>No reviews in this filter</h3>
              <p className="muted">Try selecting &ldquo;All&rdquo; or be the first to leave a review in this rating.</p>
              <button
                type="button"
                className="btn btn-soft"
                onClick={() => setActiveFilter("all")}
              >
                View all reviews
              </button>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
