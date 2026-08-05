import Link from "next/link";
import { AccessBox } from "@/components/AccessBox";

export const metadata = { title: "Client access" };

export default function AccessPage() {
  return <main className="access-page"><div className="access-wrap"><div className="access-logo"><Link href="/"><img src="/logo.svg" alt="StHelp"/></Link></div><AccessBox/><p className="muted small" style={{textAlign:"center", marginTop:16}}>No client ID yet? Contact StHelp through WhatsApp to receive a private submission link.</p></div></main>;
}
