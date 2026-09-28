import React from "react";
import { Megaphone } from "lucide-react";
import { C, heading, body } from "../data/theme";
import { AttachmentPreview } from "./attachments";

/* Highlighted block for homework given to ALL students (public site + every parent) */
export default function CommonHomework({ items }) {
  if (!items || items.length === 0) return null;
  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: `linear-gradient(135deg, ${C.coral}, #C8442D)`, boxShadow: `0 6px 18px ${C.coral}40` }}
    >
      <div className="flex items-center gap-2">
        <Megaphone size={18} color="#fff" />
        <p className="text-base text-white" style={{ ...heading, fontWeight: 800 }}>Homework for all students</p>
        <span
          className="ml-auto px-2 py-0.5 rounded-full text-[10px]"
          style={{ ...body, fontWeight: 700, background: "#fff", color: C.coral }}
        >
          {items.length} new
        </span>
      </div>
      <div className="mt-3 space-y-2">
        {items.map((h) => (
          <div key={h.id} className="rounded-xl p-3" style={{ background: "#fff" }}>
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm" style={{ ...body, fontWeight: 700, color: C.ink }}>{h.title}</p>
              <span className="text-[11px] whitespace-nowrap" style={{ ...body, fontWeight: 700, color: C.coral }}>
                Due {h.due}
              </span>
            </div>
            <p className="text-xs" style={{ ...body, color: C.inkSoft }}>{h.subject}</p>
            {h.description && (
              <p className="text-xs mt-1" style={{ ...body, color: C.ink }}>{h.description}</p>
            )}
            <AttachmentPreview attachment={h.attachment} />
          </div>
        ))}
      </div>
    </div>
  );
}
