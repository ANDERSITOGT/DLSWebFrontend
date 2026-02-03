import { useState, useEffect } from "react";

interface EditableCellProps {
  value: string | null;
  onSave: (newValue: string) => void;
  placeholder?: string;
  type?: "text" | "textarea";
}

export function EditableCell({ value, onSave, placeholder = "-", type = "text" }: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value || "");

  // Sincronizar si el valor cambia externamente
  useEffect(() => {
    setTempValue(value || "");
  }, [value]);

  const handleBlur = () => {
    setIsEditing(false);
    // Solo guardamos si el valor es diferente al original
    if (tempValue !== (value || "")) {
      onSave(tempValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && type === "text") {
      handleBlur();
    }
  };

  if (isEditing) {
    if (type === "textarea") {
        return (
            <textarea
              autoFocus
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              onBlur={handleBlur}
              className="w-full bg-white border border-blue-400 rounded px-2 py-1 text-sm outline-none shadow-sm min-h-[60px]"
            />
        );
    }
    return (
      <input
        autoFocus
        type="text"
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-full bg-white border border-blue-400 rounded px-2 py-1 text-sm outline-none shadow-sm"
      />
    );
  }

  return (
    <div 
      onClick={() => setIsEditing(true)}
      className="w-full h-full min-h-[30px] px-2 py-1 cursor-text hover:bg-slate-100 rounded border border-transparent hover:border-slate-200 transition-colors flex items-center text-sm text-slate-700 truncate"
      title="Clic para editar"
    >
      {value || <span className="text-slate-300 italic">{placeholder}</span>}
    </div>
  );
}