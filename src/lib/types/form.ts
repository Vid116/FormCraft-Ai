export type FieldType =
  | "short_text"
  | "long_text"
  | "email"
  | "number"
  | "phone"
  | "url"
  | "multiple_choice"
  | "checkbox"
  | "dropdown"
  | "rating"
  | "date"
  | "file_upload";

export interface FormFieldOption {
  id: string;
  label: string;
  value: string;
}

export type ConditionOperator =
  | "equals"
  | "not_equals"
  | "less_than"
  | "greater_than"
  | "contains";

export interface FieldCondition {
  field_id: string;
  operator: ConditionOperator;
  value: string | number;
}

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  description?: string;
  required: boolean;
  placeholder?: string;
  options?: FormFieldOption[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
  condition?: FieldCondition;
  order: number;
}

export interface Form {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  fields: FormField[];
  settings: FormSettings;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  response_count: number;
}

export interface FormSettings {
  theme_color: string;
  show_branding: boolean;
  submit_message: string;
  welcome_title: string;
  welcome_description: string;
  redirect_url?: string;
  notifications_email?: string;
  survey_mode?: "anonymous" | "tracked";
  tracking_fields?: string[];
  password_hash?: string;
}

export interface FormResponse {
  id: string;
  form_id: string;
  answers: Record<string, unknown>;
  submitted_at: string;
  metadata?: Record<string, string>;
}

export interface TrackedLink {
  id: string;
  short_code: string;
  form_id: string;
  params: Record<string, string>;
  created_by: string | null;
  created_at: string;
}

export interface AIFormGenerationRequest {
  description: string;
}

export interface AISummaryRequest {
  form_title: string;
  fields: FormField[];
  responses: FormResponse[];
}
