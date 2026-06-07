import { Icon } from "./Icon";

export function Button({ children, icon, onClick, type = "button" }) {
  return (
    <button className="primary-button" onClick={onClick} type={type}>
      {icon && <Icon name={icon} size={21} />}
      {children}
    </button>
  );
}
