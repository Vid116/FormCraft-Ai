"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import type { FormField, FieldType, ConditionOperator, FieldCondition } from "@/lib/types/form";

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  short_text: "Short Text",
  long_text: "Long Text",
  email: "Email",
  number: "Number",
  phone: "Phone",
  url: "URL",
  multiple_choice: "Multiple Choice",
  checkbox: "Checkboxes",
  dropdown: "Dropdown",
  rating: "Rating",
  date: "Date",
  file_upload: "File Upload",
};

const OPERATOR_LABELS: Record<ConditionOperator, string> = {
  equals: "equals",
  not_equals: "does not equal",
  less_than: "is less than",
  greater_than: "is greater than",
  contains: "contains",
};

interface FormEditorProps {
  fields: FormField[];
  onChange: (fields: FormField[]) => void;
}

export function FormEditor({ fields, onChange }: FormEditorProps) {
  function updateField(id: string, updates: Partial<FormField>) {
    onChange(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  }

  function removeField(id: string) {
    // Also remove conditions that reference this field
    onChange(
      fields
        .filter((f) => f.id !== id)
        .map((f, i) => ({
          ...f,
          order: i,
          condition: f.condition?.field_id === id ? undefined : f.condition,
        }))
    );
  }

  function addField() {
    const newField: FormField = {
      id: `field_${uuidv4().slice(0, 8)}`,
      type: "short_text",
      label: "New field",
      required: false,
      order: fields.length,
    };
    onChange([...fields, newField]);
  }

  function moveField(index: number, direction: "up" | "down") {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === fields.length - 1)
    ) {
      return;
    }
    const newFields = [...fields];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    [newFields[index], newFields[swapIndex]] = [newFields[swapIndex], newFields[index]];
    onChange(newFields.map((f, i) => ({ ...f, order: i })));
  }

  // Fields that can be referenced in conditions (only earlier fields)
  function getConditionableFields(currentIndex: number) {
    return fields.slice(0, currentIndex);
  }

  return (
    <div className="space-y-3">
      {fields.map((field, index) => (
        <div
          key={field.id}
          className={`bg-white dark:bg-zinc-900 border rounded-xl p-4 ${
            field.condition
              ? "border-amber-300 dark:border-amber-700 border-l-4"
              : "border-zinc-200 dark:border-zinc-800"
          }`}
        >
          {/* Condition badge */}
          {field.condition && (
            <ConditionBadge
              condition={field.condition}
              allFields={fields}
              onRemove={() => updateField(field.id, { condition: undefined })}
            />
          )}

          <div className="flex items-start gap-3">
            {/* Reorder buttons */}
            <div className="flex flex-col gap-0.5 pt-1">
              <button
                onClick={() => moveField(index, "up")}
                disabled={index === 0}
                className="p-0.5 text-zinc-400 hover:text-zinc-600 disabled:opacity-30"
                aria-label="Move up"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <button
                onClick={() => moveField(index, "down")}
                disabled={index === fields.length - 1}
                className="p-0.5 text-zinc-400 hover:text-zinc-600 disabled:opacity-30"
                aria-label="Move down"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Field content */}
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <input
                  value={field.label}
                  onChange={(e) => updateField(field.id, { label: e.target.value })}
                  className="flex-1 text-sm font-medium text-zinc-900 dark:text-zinc-100 bg-transparent border-b border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-blue-500 outline-none pb-0.5"
                  placeholder="Field label"
                />
                <select
                  value={field.type}
                  onChange={(e) => updateField(field.id, { type: e.target.value as FieldType })}
                  className="text-xs bg-zinc-100 dark:bg-zinc-800 border-none rounded-md px-2 py-1 text-zinc-600 dark:text-zinc-400"
                >
                  {Object.entries(FIELD_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => updateField(field.id, { required: e.target.checked })}
                    className="rounded"
                  />
                  Required
                </label>
                <input
                  value={field.placeholder ?? ""}
                  onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                  className="flex-1 text-xs text-zinc-500 bg-transparent border-b border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-blue-500 outline-none"
                  placeholder="Placeholder text (optional)"
                />
              </div>

              {/* Rating slider config */}
              {field.type === "rating" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-zinc-500">Min:</label>
                    <input
                      type="number"
                      value={field.validation?.min ?? 1}
                      onChange={(e) => updateField(field.id, { validation: { ...field.validation, min: Number(e.target.value), max: field.validation?.max ?? 10 } })}
                      className="w-16 text-xs bg-zinc-50 dark:bg-zinc-800 rounded px-2 py-1 border border-zinc-200 dark:border-zinc-700"
                    />
                    <label className="text-xs text-zinc-500">Max:</label>
                    <input
                      type="number"
                      value={field.validation?.max ?? 10}
                      onChange={(e) => updateField(field.id, { validation: { min: field.validation?.min ?? 1, ...field.validation, max: Number(e.target.value) } })}
                      className="w-16 text-xs bg-zinc-50 dark:bg-zinc-800 rounded px-2 py-1 border border-zinc-200 dark:border-zinc-700"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400">{field.validation?.min ?? 1}</span>
                    <input
                      type="range"
                      min={field.validation?.min ?? 1}
                      max={field.validation?.max ?? 10}
                      disabled
                      className="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none accent-blue-600"
                    />
                    <span className="text-xs text-zinc-400">{field.validation?.max ?? 10}</span>
                  </div>
                </div>
              )}

              {/* Options for choice fields */}
              {(field.type === "multiple_choice" || field.type === "checkbox" || field.type === "dropdown") && (
                <div className="space-y-1.5">
                  {(field.options ?? []).map((opt, optIndex) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <span className="text-xs text-zinc-400 w-4">{optIndex + 1}.</span>
                      <input
                        value={opt.label}
                        onChange={(e) => {
                          const newOptions = [...(field.options ?? [])];
                          newOptions[optIndex] = { ...opt, label: e.target.value, value: e.target.value.toLowerCase().replace(/\s+/g, "_") };
                          updateField(field.id, { options: newOptions });
                        }}
                        className="flex-1 text-xs bg-zinc-50 dark:bg-zinc-800 rounded px-2 py-1 border border-zinc-200 dark:border-zinc-700"
                      />
                      <button
                        onClick={() => {
                          const newOptions = (field.options ?? []).filter((_, i) => i !== optIndex);
                          updateField(field.id, { options: newOptions });
                        }}
                        className="text-zinc-400 hover:text-red-500 text-xs"
                      >
                        x
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newOpt = { id: `opt_${uuidv4().slice(0, 6)}`, label: "New option", value: "new_option" };
                      updateField(field.id, { options: [...(field.options ?? []), newOpt] });
                    }}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    + Add option
                  </button>
                </div>
              )}

              {/* Condition builder */}
              {index > 0 && !field.condition && (
                <ConditionAdder
                  availableFields={getConditionableFields(index)}
                  onAdd={(condition) => updateField(field.id, { condition })}
                />
              )}
            </div>

            {/* Delete button */}
            <button
              onClick={() => removeField(field.id)}
              className="p-1 text-zinc-400 hover:text-red-500 transition-colors"
              aria-label="Delete field"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      ))}

      <button
        onClick={addField}
        className="w-full py-3 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
      >
        + Add field
      </button>
    </div>
  );
}

/* ─── Condition badge (shown when a field has a condition) ─── */
function ConditionBadge({
  condition,
  allFields,
  onRemove,
}: {
  condition: FieldCondition;
  allFields: FormField[];
  onRemove: () => void;
}) {
  const sourceField = allFields.find((f) => f.id === condition.field_id);
  const label = sourceField?.label ?? "Unknown field";

  return (
    <div className="flex items-center gap-2 mb-3 px-2 py-1.5 bg-amber-50 dark:bg-amber-950/50 rounded-lg">
      <svg className="w-3.5 h-3.5 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
      <span className="text-xs text-amber-700 dark:text-amber-300">
        Show if &ldquo;<span className="font-medium">{label}</span>&rdquo; {OPERATOR_LABELS[condition.operator]} <span className="font-medium">{String(condition.value)}</span>
      </span>
      <button onClick={onRemove} className="ml-auto text-amber-400 hover:text-red-500 text-xs">
        x
      </button>
    </div>
  );
}

/* ─── Inline condition adder (collapsed by default) ─── */
function ConditionAdder({
  availableFields,
  onAdd,
}: {
  availableFields: FormField[];
  onAdd: (condition: FieldCondition) => void;
}) {
  const [open, setOpen] = useState(false);
  const [fieldId, setFieldId] = useState("");
  const [operator, setOperator] = useState<ConditionOperator>("equals");
  const [value, setValue] = useState("");

  if (availableFields.length === 0) return null;

  if (!open) {
    return (
      <button
        onClick={() => {
          setFieldId(availableFields[0].id);
          setOpen(true);
        }}
        className="text-xs text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-1 transition-colors"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Add condition
      </button>
    );
  }

  const selectedField = availableFields.find((f) => f.id === fieldId);
  // Smart operator defaults based on field type
  const operators: ConditionOperator[] =
    selectedField?.type === "rating" || selectedField?.type === "number"
      ? ["less_than", "greater_than", "equals", "not_equals"]
      : selectedField?.type === "multiple_choice" || selectedField?.type === "dropdown"
        ? ["equals", "not_equals"]
        : ["equals", "not_equals", "contains"];

  return (
    <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800 space-y-2">
      <p className="text-xs font-medium text-amber-700 dark:text-amber-300">Show this field only if:</p>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={fieldId}
          onChange={(e) => setFieldId(e.target.value)}
          className="text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 max-w-[140px]"
        >
          {availableFields.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>
        <select
          value={operator}
          onChange={(e) => setOperator(e.target.value as ConditionOperator)}
          className="text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1"
        >
          {operators.map((op) => (
            <option key={op} value={op}>
              {OPERATOR_LABELS[op]}
            </option>
          ))}
        </select>
        {/* Show options dropdown for choice fields, text input otherwise */}
        {selectedField && (selectedField.type === "multiple_choice" || selectedField.type === "dropdown") && selectedField.options?.length ? (
          <select
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1"
          >
            <option value="">Select...</option>
            {selectedField.options.map((opt) => (
              <option key={opt.id} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        ) : (
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="value"
            className="text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 w-20"
          />
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            if (fieldId && value !== "") {
              const numVal = Number(value);
              onAdd({ field_id: fieldId, operator, value: isNaN(numVal) ? value : numVal });
              setOpen(false);
              setValue("");
            }
          }}
          disabled={!fieldId || value === ""}
          className="text-xs px-3 py-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white rounded font-medium transition-colors"
        >
          Apply
        </button>
        <button
          onClick={() => { setOpen(false); setValue(""); }}
          className="text-xs text-zinc-400 hover:text-zinc-600"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
