import type { ReactNode } from "react";

export interface AvatarProps {
  src: string;
  alt: string;
  badgeText?: ReactNode;
  size?: number;
}

export function Avatar({
  src,
  alt,
  badgeText = (
    <>
      <span aria-hidden="true">👋</span> Hi!
    </>
  ),
  size = 88,
}: AvatarProps) {
  return (
    <div
      className="avatar-wrapper"
      style={{
        position: "relative",
        flexShrink: 0,
        width: size,
        height: size,
      }}
    >
      <img
        src={src}
        alt={alt}
        className="avatar-img"
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "var(--radius-full)",
          objectFit: "cover",
          border: "3px solid var(--border-color)",
          boxShadow: "var(--shadow-pop-sm)",
          backgroundColor: "var(--bg-card)",
          display: "block",
          transition: "transform var(--duration-fast) var(--ease-emphasized)",
        }}
      />
      {badgeText && (
        <span
          className="avatar-doodle-badge"
          style={{
            position: "absolute",
            top: "-4px",
            right: "-4px",
            backgroundColor: "var(--badge-bg)",
            color: "var(--badge-text)",
            border: "1.5px solid var(--badge-border)",
            borderRadius: "var(--radius-full)",
            padding: "2px 7px",
            fontSize: "11px",
            fontWeight: 800,
            boxShadow: "1px 1px 0px rgba(0,0,0,0.2)",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            userSelect: "none",
          }}
        >
          {badgeText}
        </span>
      )}
    </div>
  );
}
