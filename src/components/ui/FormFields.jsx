export function Field({ label, name, type = "text", defaultValue = "" }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input name={name} type={type} defaultValue={defaultValue} />
    </label>
  );
}

export function TextAreaField({ label, name, defaultValue = "" }) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea name={name} rows={4} defaultValue={defaultValue} />
    </label>
  );
}

export function SelectField({ label, name, options }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select name={name}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
