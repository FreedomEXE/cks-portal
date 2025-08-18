import React, { useEffect, useRef, useState } from "react";

type Props = {
  id: string; // unique key, e.g., `${kind}:${code}`
  name?: string; // used for initials
  size?: number; // px
  editable?: boolean;
  className?: string;
};

export default function ProfilePhoto({ id, name = "", size = 88, editable = true, className }: Props) {
  const storageKey = `profilePhoto:${id}`;
  const [src, setSrc] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setSrc(saved);
    } catch {}
  }, [storageKey]);

  const onPick = () => inputRef.current?.click();
  const onChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      setSrc(dataUrl);
      try { localStorage.setItem(storageKey, dataUrl); } catch {}
    };
    reader.readAsDataURL(file);
  };

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  const S = size;
  return (
    <div className={className} style={{ position: "relative", width: S, height: S }}>
      {src ? (
        <img
          src={src}
          alt={name || "Profile"}
          style={{ width: S, height: S, borderRadius: 999, objectFit: "cover", border: "1px solid #e5e7eb" }}
        />
      ) : (
        <div
          style={{
            width: S,
            height: S,
            borderRadius: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f3f4f6",
            color: "#374151",
            fontWeight: 700,
            border: "1px solid #e5e7eb",
            userSelect: "none",
          }}
          aria-label="No profile photo"
        >
          {initials || "?"}
        </div>
      )}
      {editable ? (
        <>
          <button
            type="button"
            onClick={onPick}
            className="ui-button"
            style={{ position: "absolute", right: -6, bottom: -6, padding: "4px 8px", fontSize: 12 }}
          >
            Change
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={onChange}
            style={{ display: "none" }}
          />
        </>
      ) : null}
    </div>
  );
}
