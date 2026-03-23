import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SectionHeading from "@/components/SectionHeading";
import { FaqContent } from "@/components/faq/FaqContent";

export default function Faq() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-28 section-padding">
        <div className="max-w-5xl mx-auto space-y-8">
          <SectionHeading
            badge="Help Center"
            title="FAQ & Documentation"
            subtitle="A simple guide to understand features, setup, and troubleshooting for your AI chatbot platform."
          />

          <FaqContent />
        </div>
      </section>

      <Footer />
    </div>
  );
}
