import { Icon } from "./Icon";

export function Toast({ message, visible }) {
  if (!message) return null;

  return (
    <div
      className={`toast ${visible ? "is-visible" : ""}`}
      role="status"
      aria-hidden={!visible}
      aria-live="polite"
    >
      <span>
        <Icon name="check" />
      </span>
      {message}
    </div>
  );
}
