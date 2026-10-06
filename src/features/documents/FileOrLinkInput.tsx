export type SourceMode = "file" | "link";

interface Props {
  mode: SourceMode;
  onModeChange: (m: SourceMode) => void;
  url: string;
  onUrlChange: (url: string) => void;
  onFile: (file: File | null) => void;
}

export function FileOrLinkInput({ mode, onModeChange, url, onUrlChange, onFile }: Props) {
  return (
    <>
      <div className="seg" role="radiogroup">
        <button className={mode === "file" ? "on" : ""} onClick={() => onModeChange("file")}>Upload file</button>
        <button className={mode === "link" ? "on" : ""} onClick={() => onModeChange("link")}>Share a link</button>
      </div>
      {mode === "file" ? (
        <label className="field">
          <span>File</span>
          <input className="input" type="file" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
          <small>Max 50 MB. Stored privately — only people whose role allows it can open it.</small>
        </label>
      ) : (
        <label className="field">
          <span>Link</span>
          <input
            className="input"
            type="url"
            placeholder="https://drive.google.com/…"
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
          />
        </label>
      )}
    </>
  );
}
