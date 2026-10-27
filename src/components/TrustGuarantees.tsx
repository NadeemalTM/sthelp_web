import { ShieldCheck, LockKeyhole, RefreshCw, Clock3, Sparkles } from "lucide-react";

const universities = [
  { name: "SLIIT", campus: "Malabe / Metro" },
  { name: "Univ. of Moratuwa", campus: "Engineering / IT" },
  { name: "NSBM Green Univ.", campus: "Computing / Business" },
  { name: "IIT Sri Lanka", campus: "Westminster Partner" },
  { name: "Curtin Colombo", campus: "Engineering / Science" },
  { name: "ICBT Campus", campus: "Cardiff Met / Partner" },
  { name: "NIBM", campus: "National Institute" },
  { name: "Univ. of Colombo", campus: "UCSC / Science" },
  { name: "KDU", campus: "Kotelawala Defence" }
];

const guarantees = [
  {
    icon: ShieldCheck,
    title: "Turnitin AI & Similarity Report Included",
    copy: "Every submission includes a clean Turnitin check. Zero copy-paste, 100% human-crafted academic work.",
    tag: "Free with every order"
  },
  {
    icon: LockKeyhole,
    title: "100% Student Confidentiality",
    copy: "Private workspace link only. Your name, contact number and university records are never leaked or shared.",
    tag: "Strict Privacy"
  },
  {
    icon: RefreshCw,
    title: "7 Days Free Revisions",
    copy: "Lecturer requested adjustments or additional sections? We revise promptly without charging extra fees.",
    tag: "Zero Revision Fee"
  },
  {
    icon: Clock3,
    title: "Guaranteed Ahead-of-Time Delivery",
    copy: "Deliverables are handed over with comfortable buffer time before your university LMS portal closes.",
    tag: "Deadline Guarantee"
  }
];

export function TrustGuarantees() {
  return (
    <section className="section trust-guarantees-section" data-public-reveal aria-label="Student trust guarantees">
      <div className="container">
        {/* University Social Proof Strip */}
        <div className="uni-proof-strip">
          <div className="uni-proof-header">
            <span className="uni-proof-badge">
              <Sparkles size={13} />
              <span>ACADEMIC INTEGRITY & QUALITY</span>
            </span>
            <p>Trusted by students across leading Sri Lankan universities & international campuses</p>
          </div>
          <div className="uni-pills-row">
            {universities.map((uni) => (
              <div className="uni-pill" key={uni.name}>
                <strong>{uni.name}</strong>
                <small>{uni.campus}</small>
              </div>
            ))}
          </div>
        </div>

        {/* 4 Core Guarantees Grid */}
        <div className="guarantees-grid">
          {guarantees.map(({ icon: Icon, title, copy, tag }) => (
            <article className="guarantee-card" key={title}>
              <div className="guarantee-header">
                <span className="guarantee-icon">
                  <Icon size={24} strokeWidth={2} />
                </span>
                <span className="guarantee-tag">{tag}</span>
              </div>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
