import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Admin login" };

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) redirect("/admin");
  return <main className="admin-login"><section className="login-art"><span className="eyebrow" style={{color:"#ffc95d"}}>StHelp administration</span><h1 style={{fontSize:"clamp(2.4rem,6vw,4.6rem)", maxWidth:700}}>Manage every client assignment from one dashboard.</h1><p className="lead">Create private links, accept requests, update progress, manage payments, upload previews and unlock final files.</p></section><section className="login-form-wrap"><div className="login-card"><a className="brand" href="/" style={{color:"#0b1f3a", marginBottom:26}}><span className="brand-mark">St</span><span className="brand-copy">StHelp<small style={{color:"#637087"}}>Admin panel</small></span></a><div className="form-card"><h2 style={{fontSize:"1.8rem"}}>Admin sign in</h2><p className="muted">Use the administrator username and password configured in Vercel.</p><LoginForm/></div></div></section></main>;
}
