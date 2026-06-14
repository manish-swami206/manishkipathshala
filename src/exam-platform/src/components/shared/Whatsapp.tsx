import React from "react";
import { contact_number } from "@/lib/data";

export default function Whatsapp() {
  const number = contact_number || "7023464080";
  const whatsappUrl = `https://wa.me/91${number}?text=Namaste!%20Mujhe%20Manish%20Ki%20Pathshala%20ke%20baare%20mein%20jaankari%20chahiye.`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-20 right-4 md:bottom-6 z-50 group"
      aria-label="Chat on WhatsApp"
    >
      <div className="w-[52px] h-[52px] rounded-full bg-[#25D366] flex items-center justify-center shadow-xl shadow-[#25D366]/40 hover:scale-110 active:scale-95 transition-transform duration-200">
        <svg
          viewBox="0 0 24 24"
          className="w-7 h-7 fill-white"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
          <path d="M12.004 2C6.478 2 2 6.478 2 12.004c0 1.76.463 3.41 1.27 4.847L2 22l5.272-1.381A9.956 9.956 0 0012.004 22C17.526 22 22 17.526 22 12.004 22 6.478 17.526 2 12.004 2zm0 18.214a8.21 8.21 0 01-4.174-1.136l-.3-.177-3.13.82.835-3.05-.195-.314A8.204 8.204 0 013.786 12c0-4.536 3.692-8.228 8.224-8.228 4.536 0 8.224 3.692 8.224 8.228-.004 4.536-3.692 8.214-8.23 8.214z" />
        </svg>
      </div>
      <span className="absolute right-14 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs font-semibold px-2.5 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        Chat with us
      </span>
    </a>
  );
}