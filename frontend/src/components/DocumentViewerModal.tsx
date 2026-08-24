import { useState } from 'react';
import { Copy, Check, FileText, Landmark, ShieldCheck } from 'lucide-react';
import Modal from './Modal';
import { Button, StatusMark } from './ui';
import type { LandDocument, Parcel } from '../lib/types';
import { shortDate } from '../lib/format';

interface Props {
  open: boolean;
  onClose: () => void;
  document: LandDocument | null;
  parcel: Parcel;
}

export default function DocumentViewerModal({ open, onClose, document, parcel }: Props) {
  const [copied, setCopied] = useState(false);

  if (!document) return null;

  const handleCopyOcr = () => {
    if (document.ocrText) {
      navigator.clipboard.writeText(document.ocrText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      label={parcel.id}
      title={document.docType}
      bn="Authoritative Document Vault"
      wide
    >
      <div className="space-y-5">
        {/* Certificate Display Card */}
        <div className="relative border border-line bg-sheet-raised p-6 shadow-sm">
          {/* Subtle Watermark */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-5">
            <Landmark className="h-64 w-64 text-ink" />
          </div>

          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
            <div>
              <span className="mono block text-2xs uppercase text-ink-3">Government of Bangladesh</span>
              <p className="bn text-xl font-bold text-ink">ভূমি রেকর্ড ও জরিপ অধিদপ্তর</p>
              <p className="text-xs text-ink-2">Department of Land Records & Surveys</p>
            </div>
            <div className="text-right">
              <StatusMark tone="state">
                <ShieldCheck className="h-3 w-3" /> Digitally Certified
              </StatusMark>
              <p className="mono mt-1 text-2xs text-ink-3">Vault Ref: {document.id}</p>
            </div>
          </div>

          <div className="grid gap-4 py-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-ink-3">Document Type (দলিলের প্রকার)</p>
              <p className="bn text-sm font-semibold text-ink">{document.docType}</p>
              <p className="mono mt-2 text-xs text-ink-3">File Name</p>
              <p className="mono text-sm text-ink">{document.fileName}</p>
            </div>
            <div>
              <p className="text-xs text-ink-3">Subject Parcel & Mouza</p>
              <p className="text-sm font-medium text-ink">
                দাগ {parcel.dagNo} · মৌজা {parcel.mouza}
              </p>
              <p className="mt-2 text-xs text-ink-3">Archived On</p>
              <p className="mono text-sm text-ink">{shortDate(document.uploadedAt)}</p>
            </div>
          </div>

          {/* OCR Extracted Text Section */}
          <div className="mt-4 border-t border-line-hair pt-4">
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo" />
                <span className="mono text-2xs font-semibold uppercase text-ink-2">
                  OCR Text Content (অক্ষর প্রতিলিপি)
                </span>
              </div>
              {document.ocrText && (
                <button
                  type="button"
                  onClick={handleCopyOcr}
                  className="flex items-center gap-1 text-xs text-indigo hover:underline"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-state" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copied' : 'Copy OCR'}
                </button>
              )}
            </div>
            <div className="border border-line bg-ground-sunk p-3 font-mono text-xs leading-relaxed text-ink-2">
              {document.ocrText || (
                <span className="text-ink-3 italic">No scanned OCR transcription available for this file.</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="primary" onClick={onClose}>
            Close Viewer
          </Button>
        </div>
      </div>
    </Modal>
  );
}
