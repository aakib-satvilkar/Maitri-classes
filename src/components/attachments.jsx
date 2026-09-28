import React, { useState } from "react";
import { Paperclip, FileText, Image as ImageIcon, X, Download } from "lucide-react";
import { C, body } from "../data/theme";
import { MAX_ATTACHMENT_MB, kindOf, formatBytes } from "../utils/file";
import { uploadFile } from "../utils/api";

/* Admin-side: pick a PDF or image to attach to a task/daily task */
export function AttachmentField({ value, onChange }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;
    setError("");
    const kind = kindOf(file);
    if (kind === "other") {
      setError("Only PDF or image files are supported.");
      return;
    }
    if (file.size > MAX_ATTACHMENT_MB * 1024 * 1024) {
      setError(`File is too large — keep attachments under ${MAX_ATTACHMENT_MB} MB.`);
      return;
    }
    try {
      setBusy(true);
      const { url } = await uploadFile(file);
      onChange({ name: file.name, kind, size: file.size, url });
    } catch (err) {
      setError(err.status === 401 ? "Session expired — log in again." : err.message || "Upload failed — try again.");
    } finally {
      setBusy(false);
    }
  }

  if (value) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: C.cream, border: `1px solid ${C.sand}` }}>
        {value.kind === "image" ? <ImageIcon size={15} color={C.leaf} /> : <FileText size={15} color={C.coral} />}
        <div className="flex-1 min-w-0">
          <p className="text-xs truncate" style={{ ...body, fontWeight: 600, color: C.ink }}>{value.name}</p>
          <p className="text-[11px]" style={{ ...body, color: C.inkSoft }}>{formatBytes(value.size)}</p>
        </div>
        <button onClick={() => onChange(null)} aria-label="Remove attachment">
          <X size={15} color={C.inkSoft} />
        </button>
      </div>
    );
  }

  return (
    <div>
      <label
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm cursor-pointer"
        style={{ ...body, fontWeight: 600, background: C.sand, color: C.ink }}
      >
        <Paperclip size={15} /> {busy ? "Uploading…" : "Attach PDF or image (optional)"}
        <input type="file" accept="application/pdf,image/png,image/jpeg,image/webp,image/gif" className="hidden" disabled={busy} onChange={handleFile} />
      </label>
      {error && <p className="text-xs mt-1" style={{ ...body, color: C.coral }}>{error}</p>}
    </div>
  );
}

/* Old records (saved before the server existed) may still carry a data: URL */
const srcOf = (a) => (a ? a.url || a.dataUrl : "");

function Viewer({ attachment, url, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(0,0,0,0.85)" }}>
      <div className="flex items-center gap-2 px-4 py-3" style={{ background: C.teal }}>
        <p className="flex-1 text-sm truncate text-white" style={{ ...body, fontWeight: 700 }}>{attachment.name}</p>
        <a
          href={url}
          download={attachment.name}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs"
          style={{ ...body, fontWeight: 700, background: C.marigold, color: C.teal }}
        >
          <Download size={13} /> Download
        </a>
        <button onClick={onClose} aria-label="Close viewer">
          <X size={20} color="#fff" />
        </button>
      </div>
      <div className="flex-1 overflow-auto flex items-center justify-center p-3">
        {attachment.kind === "image" ? (
          <img src={url} alt={attachment.name} className="max-w-full max-h-full rounded-lg" />
        ) : (
          <div className="w-full h-full flex flex-col gap-2">
            <iframe title={attachment.name} src={url} className="flex-1 w-full rounded-lg bg-white" />
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="text-center text-xs py-2 rounded-lg"
              style={{ ...body, fontWeight: 700, background: "#fff", color: C.teal }}
            >
              PDF not showing? Open in a new tab
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

/* Parent/public-side: inline image, tap to open viewer; PDFs open in viewer too */
export function AttachmentPreview({ attachment }) {
  const [open, setOpen] = useState(false);
  if (!attachment) return null;
  const url = srcOf(attachment);

  return (
    <>
      {attachment.kind === "image" && (
        <button onClick={() => setOpen(true)} className="block mt-2 w-full" aria-label={`Open ${attachment.name}`}>
          <img
            src={url}
            alt={attachment.name}
            className="w-full max-h-48 object-cover rounded-xl"
            style={{ border: `1px solid ${C.sand}` }}
          />
        </button>
      )}
      <button
        onClick={() => setOpen(true)}
        className="mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left"
        style={{ background: `${C.teal}0D`, border: `1px solid ${C.teal}22` }}
      >
        {attachment.kind === "image" ? <ImageIcon size={15} color={C.teal} /> : <FileText size={15} color={C.teal} />}
        <p className="text-xs flex-1 truncate" style={{ ...body, fontWeight: 600, color: C.teal }}>
          {attachment.kind === "pdf" ? "View PDF" : "View image"} · {attachment.name}
        </p>
        <Paperclip size={14} color={C.teal} />
      </button>
      {open && url && <Viewer attachment={attachment} url={url} onClose={() => setOpen(false)} />}
    </>
  );
}
