import "./StatusBadge.scss";

export default function StatusBadge({ status }) {
  const cls =
    status === "Over Budget" ? "badge badge--over" :
    status === "Warning" ? "badge badge--warn" :
    "badge badge--ok";

  return <span className={cls}>{status}</span>;
}
