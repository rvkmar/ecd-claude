// src/pages/settings/BulkDownloadCard.jsx
// ------------------------------------------------------------
// Mirror image of BulkUploadCard: one self-contained card per entity
// type that fetches every record of that type and saves it as a JSON
// file shaped like the file the matching upload card accepts, so an
// export can be edited and re-imported without reshaping.
// ------------------------------------------------------------

import React, { useState } from "react";
import { DownloadCloud, CheckCircle2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useBulkDownload, downloadJson, exportFileName } from "@/api/queries/bulkDownload";
import { apiErrorMessage } from "@/api/apiClient";

export default function BulkDownloadCard({ title, description, kind, note }) {
  const [lastExport, setLastExport] = useState(null); // { count, fileName }
  const bulkDownload = useBulkDownload(kind);

  const handleDownload = async () => {
    try {
      const rows = await bulkDownload.mutateAsync();
      if (rows.length === 0) {
        setLastExport(null);
        toast(`${title}: nothing to export yet.`, { icon: "ℹ️" });
        return;
      }
      const fileName = exportFileName(kind);
      downloadJson(fileName, rows);
      setLastExport({ count: rows.length, fileName });
      toast.success(`✅ ${title}: ${rows.length} record(s) exported`);
    } catch (err) {
      toast.error(`❌ Export failed: ${apiErrorMessage(err, err.message)}`);
    }
  };

  return (
    <div className="rounded-xl border border-border p-4 space-y-3">
      <div>
        <div className="font-medium">{title}</div>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>

      {note && <p className="text-xs text-muted-foreground italic">{note}</p>}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleDownload}
          disabled={bulkDownload.isPending}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md disabled:opacity-50"
        >
          {bulkDownload.isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <DownloadCloud size={14} />
          )}
          {bulkDownload.isPending ? "Preparing..." : "Download JSON"}
        </button>
      </div>

      {lastExport && (
        <div className="flex items-center gap-1 text-sm text-green-600 pt-2 border-t border-border">
          <CheckCircle2 size={14} />
          <span className="truncate">
            {lastExport.count} record(s) saved as {lastExport.fileName}
          </span>
        </div>
      )}
    </div>
  );
}
