import { useState } from "react";
import { errorMessage } from "../api/errors.ts";
import { SpinnerIcon } from "./ActionIcons.tsx";
import {
  EXPORT_FORMATS,
  resultToExportDocument,
  sanitizeFileName,
  type ExportFormat,
} from "../lib/documentExport.ts";
import type { AssistantResult } from "../lib/generatedDocuments.ts";
import { useI18n } from "../i18n/I18nContext.tsx";

type ExportMenuProps = {
  result: AssistantResult;
  fallbackTitle: string;
  compact?: boolean;
};

async function downloadFormat(
  format: ExportFormat,
  result: AssistantResult,
  fallbackTitle: string,
  t: ReturnType<typeof useI18n>["t"],
): Promise<void> {
  const document = resultToExportDocument(result, t, fallbackTitle);
  const filename = `${sanitizeFileName(document.title)}.${format}`;
  switch (format) {
    case "pdf": {
      const { downloadPdf } = await import("../lib/exportPdf.ts");
      await downloadPdf(document, filename);
      return;
    }
    case "docx": {
      const { downloadDocx } = await import("../lib/exportDocx.ts");
      await downloadDocx(document, filename);
      return;
    }
    case "odt": {
      const { downloadOdt } = await import("../lib/exportOdt.ts");
      await downloadOdt(document, filename);
      return;
    }
    case "xlsx": {
      const { downloadXlsx } = await import("../lib/exportXlsx.ts");
      await downloadXlsx(document, filename);
    }
  }
}

function isExportFormat(value: string): value is ExportFormat {
  return (EXPORT_FORMATS as string[]).includes(value);
}

export function ExportMenu({
  result,
  fallbackTitle,
  compact = false,
}: ExportMenuProps) {
  const { t } = useI18n();
  const [busy, setBusy] = useState<ExportFormat | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onDownload(format: ExportFormat) {
    setBusy(format);
    setError(null);
    try {
      await downloadFormat(format, result, fallbackTitle, t);
    } catch (err) {
      setError(errorMessage(err) || t.assistant.downloadFailed);
    } finally {
      setBusy(null);
    }
  }

  const formatButtons = EXPORT_FORMATS.map((format) => (
    <button
      key={format}
      type="button"
      className="btn btn--sm btn--ghost"
      disabled={busy !== null}
      onClick={() => void onDownload(format)}
    >
      {busy === format ? <SpinnerIcon /> : format.toUpperCase()}
    </button>
  ));

  return (
    <div className="export-menu">
      {compact ? (
        <label className="export-menu__compact">
          <span className="visually-hidden">{t.assistant.download}</span>
          <select
            className="export-menu__select"
            disabled={busy !== null}
            value=""
            aria-label={t.assistant.download}
            onChange={(event) => {
              const value = event.target.value;
              if (isExportFormat(value)) void onDownload(value);
            }}
          >
            <option value="">
              {busy ? t.assistant.downloading : t.assistant.download}
            </option>
            {EXPORT_FORMATS.map((format) => (
              <option key={format} value={format}>
                {format.toUpperCase()}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <div className="export-formats" aria-label={t.assistant.download}>
          <span className="export-formats__label">{t.assistant.download}</span>
          {formatButtons}
        </div>
      )}
      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}
