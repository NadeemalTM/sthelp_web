import Link from "next/link";
import Image from "next/image";
import { AccessBox } from "@/components/AccessBox";

export const metadata = { title: "Client access" };

export default function AccessPage() {
  return <main className="access-page"><div className="access-wrap"><div className="access-logo"><Link href="/"><Image src="/sthelp-logo.png" alt="StHelp Assignment Support" width={1254} height={1254}/></Link></div><AccessBox/><p className="muted small" style={{textAlign:"center", marginTop:16}}>No client ID yet? Contact StHelp through WhatsApp to receive a private submission link.</p></div></main>;
}
