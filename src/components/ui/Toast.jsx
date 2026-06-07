import { Icon } from "./Icon";

export function Toast({ message, visible }) {
  return (
    <div className={`toast ${visible ? "is-visible" : ""}`} role="status" aria-live="polite">
      <span>
        <Icon name="check" />
      </span>
      {message}
    </div>
  );
}
