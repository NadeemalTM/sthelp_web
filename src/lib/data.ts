import { getServiceSupabase, isSupabaseConfigured } from "@/lib/supabase-server";
import { defaultStudentResources, mergeStudentResources } from "@/lib/student-resources";

export const demoPortfolio = [
  {
    id: "demo-1",
    title: "Responsive Web Application",
    category: "Computing",
    description: "Mobile-ready web systems with dashboards, authentication and reporting support.",
    image_url: null
  },
  {
    id: "demo-2",
    title: "Business Research Support",
    category: "Business",
    description: "Structured analysis, clear report organisation, referencing and presentation guidance.",
    image_url: null
  },
  {
    id: "demo-3",
    title: "Excel & Data Analysis",
    category: "Data",
    description: "Spreadsheet formulas, charts, dashboards and interpretation support.",
    image_url: null
  }
];

export const demoTestimonials = [
  {
    id: "demo-t1",
    customer_name: "Verified Student",
    university: "Sri Lankan University",
    rating: 5,
    feedback: "Communication was easy and the progress updates were very clear."
  },
  {
    id: "demo-t2",
    customer_name: "Verified Student",
    university: "Higher Education Institute",
    rating: 5,
    feedback: "Fast support and requested revisions were handled properly."
  }
];

export const demoSettings = {
  business_name: "StHelp Assignment Service",
  whatsapp_number: "94782067550",
  business_phone: "94782067550",
  business_email: "",
  business_address: "",
  bank_name: "Your Bank",
  account_name: "StHelp",
  account_number: "0000000000",
  bank_branch: "Your Branch",
  bank_name_2: "",
  account_name_2: "",
  account_number_2: "",
  bank_branch_2: "",
  payment_note: "Use your client ID as the payment reference.",
  currency: "LKR",
  support_notice:
    "We provide tutoring, editing, research guidance, software development support and learning assistance. Clients are responsible for following their university rules."
};

export async function getPublicContent() {
  if (!isSupabaseConfigured()) {
    return { settings: demoSettings, portfolio: demoPortfolio, testimonials: demoTestimonials };
  }

  const db = getServiceSupabase();
  const [{ data: settings }, { data: portfolio }, { data: testimonials }] = await Promise.all([
    db.from("settings").select("*").eq("id", 1).maybeSingle(),
    db.from("portfolio_items").select("*").eq("is_published", true).order("sort_order"),
    db.from("testimonials").select("*").eq("is_published", true).order("created_at", { ascending: false }).limit(12)
  ]);

  return {
    settings: settings || demoSettings,
    portfolio: portfolio?.length ? portfolio : demoPortfolio,
    testimonials: testimonials?.length ? testimonials : demoTestimonials
  };
}

export async function getStudentResources() {
  if (!isSupabaseConfigured()) return defaultStudentResources;

  const db = getServiceSupabase();
  const { data, error } = await db.from("student_resources").select("*").order("sort_order");
  if (error) {
    console.error("Unable to load student resource overrides:", error.message);
    return defaultStudentResources;
  }

  return mergeStudentResources(data || []).filter((resource) => resource.is_published);
}
