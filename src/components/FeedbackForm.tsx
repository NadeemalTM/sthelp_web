"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, ShieldCheck, Sparkles, Star } from "lucide-react";

const quickUniversities = [
  "Moratuwa",
  "Colombo",
  "SLIIT",
  "NSBM",
  "IIT",
  "Kelaniya",
  "Open University",
  "KDU"
];

const serviceCategories = [
  "Software & Web",
  "Research & Reports",
  "Data & Excel",
  "Presentations",
  "General Support"
];

const ratingLabels: Record<number, string> = {
  5: "Outstanding — Clear progress & excellent quality",
  4: "Very Good — Reliable and responsive support",
  3: "Good — Completed requirements properly",
  2: "Fair — Needed some adjustments",
  1: "Needs improvement — Did not meet expectations"
};

type FeedbackFormProps = {
  onSuccess?: () => void;
  compact?: boolean;
};

export function FeedbackForm({ onSuccess, compact = false }: FeedbackFormProps) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [customerName, setCustomerName] = useState("");
  const [university, setUniversity] = useState("");
  const [serviceCategory, setServiceCategory] = useState("");
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [formStartTime, setFormStartTime] = useState<number>(0);

  useEffect(() => {
    setFormStartTime(Date.now());
  }, []);

  const activeRating = hoverRating || rating;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!feedback.trim() || feedback.trim().length < 10) {
      setError("Please write at least 10 characters describing your experience.");
      return;
    }

    setBusy(true);

    try {
      const formEl = e.currentTarget;
      const hpWebsite = (formEl.elements.namedItem("hpWebsite") as HTMLInputElement)?.value || "";

      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          customerName: customerName.trim(),
          university: university.trim(),
          serviceCategory: serviceCategory.trim(),
          feedback: feedback.trim(),
          hpWebsite,
          formStartTime
        })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Unable to submit feedback. Please try again.");
      }

      setSuccess(true);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to submit feedback.");
    } finally {
      setBusy(false);
    }
  }

  function handleReset() {
    setRating(5);
    setHoverRating(0);
    setCustomerName("");
    setUniversity("");
    setServiceCategory("");
    setFeedback("");
    setError("");
    setSuccess(false);
    setFormStartTime(Date.now());
  }

  if (success) {
    return (
      <div className="feedback-form-success" role="status" aria-live="polite">
        <div className="feedback-success-icon">
          <CheckCircle2 size={54} color="#15805d" />
        </div>
        <h3>Thank you for your feedback!</h3>
        <p className="muted">
          Your review has been received. To maintain genuine student feedback, our team reviews each submission before it appears publicly on the site.
        </p>
        <button
          type="button"
          className="btn btn-soft"
          onClick={handleReset}
          style={{ marginTop: 16 }}
        >
          Submit another response
        </button>
      </div>
    );
  }

  return (
    <form className={`feedback-form-wrap ${compact ? "compact" : ""}`} onSubmit={handleSubmit}>
      {error ? (
        <div className="notice notice-error" role="alert">
          {error}
        </div>
      ) : null}

      {/* Hidden honeypot field for bot protection */}
      <div style={{ display: "none" }} aria-hidden="true">
        <label htmlFor="hpWebsite">Leave this field blank</label>
        <input id="hpWebsite" name="hpWebsite" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {/* Star Rating Picker */}
      <div className="feedback-rating-group">
        <label className="feedback-group-label">
          Your Rating <span className="req">*</span>
        </label>
        <div
          className="feedback-stars-interactive"
          role="radiogroup"
          aria-label="Star rating from 1 to 5"
        >
          {[1, 2, 3, 4, 5].map((starValue) => {
            const isFilled = starValue <= activeRating;
            return (
              <button
                type="button"
                key={starValue}
                className={`star-pick-btn ${isFilled ? "filled" : ""}`}
                onClick={() => setRating(starValue)}
                onMouseEnter={() => setHoverRating(starValue)}
                onMouseLeave={() => setHoverRating(0)}
                aria-label={`${starValue} star${starValue > 1 ? "s" : ""}`}
                aria-checked={rating === starValue}
                role="radio"
              >
                <Star
                  size={compact ? 24 : 32}
                  fill={isFilled ? "#e7bd63" : "transparent"}
                  stroke={isFilled ? "#c29333" : "rgba(24, 35, 30, 0.35)"}
                  strokeWidth={1.8}
                />
              </button>
            );
          })}
        </div>
        <div className="feedback-rating-caption">
          {ratingLabels[activeRating] || `${activeRating} stars`}
        </div>
      </div>

      {/* Reviewer details grid */}
      <div className="feedback-inputs-grid">
        <div className="field">
          <label htmlFor="feedback-name">
            Your name or initials <span className="field-hint">(optional)</span>
          </label>
          <input
            id="feedback-name"
            className="input"
            type="text"
            placeholder="e.g. Kasun P."
            maxLength={100}
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
          <span className="tiny muted">Leave blank to display as &ldquo;Verified Student&rdquo;</span>
        </div>

        <div className="field">
          <label htmlFor="feedback-uni">
            University / Institute <span className="field-hint">(optional)</span>
          </label>
          <input
            id="feedback-uni"
            className="input"
            type="text"
            placeholder="e.g. Moratuwa, SLIIT"
            maxLength={150}
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
          />
        </div>
      </div>

      {/* University quick chips */}
      <div className="feedback-quick-chips">
        <span className="tiny-label">Quick select:</span>
        <div className="chips-list">
          {quickUniversities.map((uni) => (
            <button
              type="button"
              key={uni}
              className={`chip-btn ${university.toLowerCase().includes(uni.toLowerCase()) ? "active" : ""}`}
              onClick={() => setUniversity(uni)}
            >
              {uni}
            </button>
          ))}
        </div>
      </div>

      {/* Service category pills */}
      <div className="feedback-category-group">
        <label className="feedback-group-label">
          Service area supported <span className="field-hint">(optional)</span>
        </label>
        <div className="service-category-pills">
          {serviceCategories.map((cat) => (
            <button
              type="button"
              key={cat}
              className={`category-pill ${serviceCategory === cat ? "active" : ""}`}
              onClick={() => setServiceCategory(serviceCategory === cat ? "" : cat)}
            >
              {serviceCategory === cat ? "✓ " : ""}
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback Textarea */}
      <div className="field">
        <div className="feedback-textarea-header">
          <label htmlFor="feedback-text">
            Your feedback & experience <span className="req">*</span>
          </label>
          <span className={`char-counter ${feedback.length > 1400 ? "warn" : ""}`}>
            {feedback.length} / 1500
          </span>
        </div>
        <textarea
          id="feedback-text"
          className="textarea feedback-textarea"
          rows={compact ? 4 : 5}
          maxLength={1500}
          required
          placeholder="How was the communication, turnaround time, clarity of the final files, or overall support? Your honest review helps fellow students."
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
        />
      </div>

      {/* Moderation safety note */}
      <div className="feedback-safety-note">
        <ShieldCheck size={18} className="shield-icon" />
        <span>
          Every review is manually reviewed by StHelp staff to verify authenticity before public listing.
        </span>
      </div>

      <div className="feedback-actions">
        <button className="btn btn-coral feedback-submit-btn" type="submit" disabled={busy}>
          {busy ? (
            <>
              <Loader2 className="spinner" size={18} /> Submitting review…
            </>
          ) : (
            <>
              <Sparkles size={18} /> Submit review
            </>
          )}
        </button>
      </div>
    </form>
  );
}
