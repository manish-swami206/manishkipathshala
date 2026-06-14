"use client";

import { StaticPageLayout } from "@/components/shared/StaticPageLayout";

import { Mail, MessageCircle, MapPin } from "lucide-react";
import {
  contact_gmail,
  contact_number,
  contact_address,
  whatsapp_link,
} from "@/lib/data";

export default function Contact() {
  const contactNumberFormatted = contact_number
    ? `+91 ${contact_number.slice(0, 5)} ${contact_number.slice(5)}`
    : "";

  return (
    <StaticPageLayout title="Contact Us" heading="Contact Us">
      {/* Contact Info Cards */}
      <div className="space-y-3">
        {[
          {
            icon: Mail,
            iconBg: "bg-primary/10",
            iconColor: "text-primary",
            title: "Email Support",
            sub: "Usually replies within 2 hours",
            value: contact_gmail,
            href: `mailto:${contact_gmail}`,
            valueColor: "text-primary",
          },
          {
            icon: MessageCircle,
            iconBg: "bg-green-100",
            iconColor: "text-green-600",
            title: "WhatsApp & Telegram",
            sub: "Join our official channels or chat with us",
            value: contactNumberFormatted || "Chat with us",
            href: whatsapp_link || `https://wa.me/91${contact_number}`,
            valueColor: "text-green-600",
          },
          {
            icon: MapPin,
            iconBg: "bg-blue-100",
            iconColor: "text-blue-600",
            title: "Location",
            sub: "Manish ki Pathshala",
            value: "Sri Ganganagar , Rajasthan (India) - 335001",
            href: null,
            valueColor: "text-foreground",
          },
        ].map(
          ({
            icon: Icon,
            iconBg,
            iconColor,
            title,
            sub,
            value,
            href,
            valueColor,
          }) => (
            <div
              key={title}
              className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-border/50"
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${iconBg}`}
              >
                <Icon className={`w-4 h-4 ${iconColor}`} />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground">{sub}</p>
                {href ? (
                  <a
                    href={href}
                    target={href.startsWith("http") ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className={`text-xs font-semibold mt-0.5 hover:underline block ${valueColor}`}
                  >
                    {value}
                  </a>
                ) : (
                  <p className={`text-xs font-semibold mt-0.5 ${valueColor}`}>
                    {value}
                  </p>
                )}
              </div>
            </div>
          ),
        )}
      </div>
    </StaticPageLayout>
  );
}
