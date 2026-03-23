import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { FaqSection } from "@/content/faq-content";

interface FaqSectionAccordionProps {
  section: FaqSection;
  searchTerm: string;
}

function includesSearch(value: string, searchTerm: string): boolean {
  if (!searchTerm.trim()) {
    return true;
  }

  return value.toLowerCase().includes(searchTerm.trim().toLowerCase());
}

export function FaqSectionAccordion({ section, searchTerm }: FaqSectionAccordionProps) {
  const filteredItems = section.items.filter(
    (item) => includesSearch(item.question, searchTerm) || includesSearch(item.answer, searchTerm),
  );

  if (filteredItems.length === 0) {
    return null;
  }

  const Icon = section.icon;

  return (
    <section aria-labelledby={`faq-section-${section.id}`} className="glass rounded-xl p-5 sm:p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" aria-hidden="true" />
        </div>
        <h2 id={`faq-section-${section.id}`} className="text-lg font-heading font-semibold text-foreground">
          {section.title}
        </h2>
      </div>

      <Accordion type="multiple" className="w-full">
        {filteredItems.map((item) => (
          <AccordionItem value={item.id} key={item.id}>
            <AccordionTrigger className="text-left">{item.question}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">{item.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
