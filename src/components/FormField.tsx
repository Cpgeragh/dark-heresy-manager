// src/components/FormField.tsx

import { useCallback } from "react";

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

    const inputId = `field-${label.toLowerCase().replace(/\s+/g, '-')}`;

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        onChange(e.target.value);
    }, [onChange]);

    return (
        <label
            htmlFor={inputId}
            className={`flex flex-col gap-0.5 text-xs text-slate-400 ${className}`}
        >
            {label}

            {type === "textarea" ? (
                <textarea
                    id={inputId}
                    disabled={!editable}
                    value={value}
                    onChange={handleChange}
                    placeholder={placeholder}
                    rows={rows}
                    aria-label={label}
                    aria-describedby={description ? `${inputId}-desc` : undefined}
                    aria-invalid={editable ? undefined : "false"}
                    className={baseInputClass + " resize-y"}
                />
            ) : (
                <input
                    id={inputId}
                    disabled={!editable}
                    type={type}
                    value={value}
                    onChange={handleChange}
                    placeholder={placeholder}
                    aria-label={label}
                    aria-describedby={description ? `${inputId}-desc` : undefined}
                    aria-invalid={editable ? undefined : "false"}
                    className={baseInputClass}
                />
            )}

            {description && (
                <span id={`${inputId}-desc`} className="text-[10px] text-slate-500 mt-0.5">
                    {description}
                </span>
            )}
        </label>
    );
}