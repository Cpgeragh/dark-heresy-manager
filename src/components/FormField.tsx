// src/components/FormField.tsx

interface FormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  editable?: boolean;
  type?: "text" | "number" | "textarea";
  placeholder?: string;
  description?: string;
  rows?: number;
  className?: string;
}

export function FormField({
  label,
  value,
  onChange,
  editable = true,
  type = "text",
  placeholder,
  description,
  rows = 3,
  className = "",
}: FormFieldProps) {
  const baseInputClass = `
    px-2 py-1 rounded border text-sm
    ${editable 
      ? "bg-slate-800 border-slate-600 text-slate-100 focus:border-amber-400 focus:outline-none" 
      : "bg-slate-900 border-slate-700 text-slate-400 cursor-not-allowed"
    }
  `.trim();

  return (
    <label className={`flex flex-col gap-0.5 text-xs text-slate-400 ${className}`}>
      {label}
      
      {type === "textarea" ? (
        <textarea
          disabled={!editable}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={baseInputClass + " resize-y"}
        />
      ) : (
        <input
          disabled={!editable}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={baseInputClass}
        />
      )}

      {description && (
        <span className="text-[10px] text-slate-500 mt-0.5">
          {description}
        </span>
      )}
    </label>
  );
}