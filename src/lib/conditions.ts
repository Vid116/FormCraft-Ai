import type { FormField, FieldCondition } from "./types/form";

/**
 * Evaluate whether a single condition is met given the current answers.
 */
export function evaluateCondition(
  condition: FieldCondition,
  answers: Record<string, unknown>
): boolean {
  const rawVal = answers[condition.field_id];
  if (rawVal === undefined || rawVal === null) return false;

  // Handle rating objects { score, comment }
  const val =
    typeof rawVal === "object" && rawVal !== null && "score" in (rawVal as Record<string, unknown>)
      ? (rawVal as { score: number }).score
      : rawVal;

  const target = condition.value;

  switch (condition.operator) {
    case "equals":
      return String(val) === String(target);

    case "not_equals":
      return String(val) !== String(target);

    case "less_than":
      return Number(val) < Number(target);

    case "greater_than":
      return Number(val) > Number(target);

    case "contains":
      return String(val).toLowerCase().includes(String(target).toLowerCase());

    default:
      return true;
  }
}

/**
 * Given all fields and current answers, return only the visible fields
 * (in order). A field is visible if it has no condition, or its condition is met.
 */
export function getVisibleFields(
  fields: FormField[],
  answers: Record<string, unknown>
): FormField[] {
  const sorted = [...fields].sort((a, b) => a.order - b.order);

  return sorted.filter((field) => {
    if (!field.condition) return true;
    return evaluateCondition(field.condition, answers);
  });
}
