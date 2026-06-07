import { classNameFor } from "../../utils/format";

export function Badge({ children, tone = "default" }) {
  return <span className={`badge tone-${classNameFor(tone)}`}>{children}</span>;
}
