import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SupportChat } from "@/components/support/SupportChat";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
      <SupportChat />
    </>
  );
}
