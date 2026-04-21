import React from "react";

export default function WhatsAppFloat() {
  const number = "27781246757"; // 0781246757 with SA country code
  const href = `https://wa.me/${number}?text=${encodeURIComponent("Hi Excel Tutoring, I'd like to learn more about your programs.")}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      data-testid="whatsapp-float"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-4 text-white shadow-2xl transition-transform hover:scale-[1.04] hover:bg-[#128C7E]"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden>
        <path d="M20.52 3.48A11.7 11.7 0 0 0 3.52 19.9L2 22l2.23-1.46A11.7 11.7 0 1 0 20.52 3.48Zm-8.48 18a9.7 9.7 0 0 1-4.94-1.36l-.35-.2-2.36.78.79-2.29-.23-.37a9.7 9.7 0 1 1 7.09 3.44Zm5.31-7.27c-.29-.15-1.71-.84-1.97-.94s-.46-.15-.65.15-.74.94-.9 1.13-.33.22-.62.07a7.94 7.94 0 0 1-2.33-1.43 8.73 8.73 0 0 1-1.62-2c-.17-.3 0-.45.13-.6s.29-.34.44-.51a2 2 0 0 0 .29-.49.55.55 0 0 0 0-.52c-.07-.15-.65-1.58-.9-2.16s-.48-.49-.65-.5h-.55a1.07 1.07 0 0 0-.78.37A3.27 3.27 0 0 0 5.5 10c0 1.44 1 2.83 1.18 3s2 3.1 4.88 4.35c.68.29 1.22.46 1.64.59a3.94 3.94 0 0 0 1.81.11 3 3 0 0 0 2-1.39 2.43 2.43 0 0 0 .17-1.39c-.07-.14-.26-.22-.55-.37Z" />
      </svg>
      <span className="hidden text-sm font-semibold md:inline">Chat on WhatsApp</span>
    </a>
  );
}
