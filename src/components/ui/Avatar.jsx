export function Avatar({ initials, photo = false }) {
  return <span className={`avatar ${photo ? "has-photo" : ""}`}>{photo ? "" : initials}</span>;
}
