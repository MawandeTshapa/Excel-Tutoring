import React, { useEffect, useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import api from "@/lib/api";

export default function FAQ() {
  const [items, setItems] = useState([]);
  useEffect(() => { api.get("/faq").then((r) => setItems(r.data)); }, []);

  return (
    <div data-testid="faq-page">
      <section className="relative overflow-hidden bg-[#050A15] text-white">
        <div className="absolute inset-0 hero-grid-bg opacity-40" />
        <div className="container-x relative py-24 md:py-28">
          <div className="eyebrow eyebrow-inverse">Help</div>
          <h1 className="mt-4 font-display text-5xl font-semibold tracking-tighter md:text-7xl">Frequently asked.</h1>
        </div>
      </section>
      <section className="section bg-white">
        <div className="container-x max-w-3xl">
          <Accordion type="single" collapsible className="w-full">
            {items.map((it, i) => (
              <AccordionItem value={`item-${i}`} key={i} className="border-b border-slate-200" data-testid={`faq-item-${i}`}>
                <AccordionTrigger className="py-6 text-left text-lg font-semibold hover:no-underline">{it.q}</AccordionTrigger>
                <AccordionContent className="pb-6 text-slate-600">{it.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </div>
  );
}
