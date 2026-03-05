import type { FormField } from "./types/form";
import { v4 as uuidv4 } from "uuid";

export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  title: string;
  welcomeTitle: string;
  welcomeDescription: string;
  submitMessage: string;
  fields: FormField[];
}

function opt(label: string) {
  return { id: uuidv4(), label, value: label };
}

function field(
  type: FormField["type"],
  label: string,
  overrides: Partial<FormField> = {}
): FormField {
  return {
    id: uuidv4(),
    type,
    label,
    required: true,
    order: 0,
    ...overrides,
  };
}

export const TEMPLATES: FormTemplate[] = [
  {
    id: "nps",
    name: "NPS Survey",
    description: "Net Promoter Score — measure customer loyalty",
    icon: "chart",
    category: "Feedback",
    title: "NPS Survey",
    welcomeTitle: "How likely are you to recommend us?",
    welcomeDescription: "This quick survey takes less than a minute.",
    submitMessage: "Thank you for your feedback!",
    fields: [
      field("rating", "How likely are you to recommend us to a friend or colleague?", {
        validation: { min: 0, max: 10 },
        description: "0 = Not at all likely, 10 = Extremely likely",
      }),
      field("long_text", "What's the primary reason for your score?", {
        required: false,
        placeholder: "Tell us more...",
      }),
      field("multiple_choice", "How long have you been a customer?", {
        required: false,
        options: [
          opt("Less than a month"),
          opt("1-6 months"),
          opt("6-12 months"),
          opt("1-2 years"),
          opt("More than 2 years"),
        ],
      }),
    ],
  },
  {
    id: "customer-feedback",
    name: "Customer Feedback",
    description: "General product or service feedback",
    icon: "message",
    category: "Feedback",
    title: "Customer Feedback",
    welcomeTitle: "We'd love your feedback!",
    welcomeDescription: "Help us improve by sharing your experience. This takes about 2 minutes.",
    submitMessage: "Thanks! Your feedback helps us improve.",
    fields: [
      field("rating", "How satisfied are you with our product/service?", {
        validation: { min: 1, max: 5 },
        description: "1 = Very dissatisfied, 5 = Very satisfied",
      }),
      field("multiple_choice", "Which aspect impressed you the most?", {
        options: [
          opt("Product quality"),
          opt("Customer service"),
          opt("Ease of use"),
          opt("Value for money"),
          opt("Speed/Performance"),
        ],
      }),
      field("long_text", "What could we do better?", {
        required: false,
        placeholder: "Your suggestions...",
      }),
      field("multiple_choice", "Would you use our product/service again?", {
        options: [opt("Definitely"), opt("Probably"), opt("Not sure"), opt("Probably not"), opt("Definitely not")],
      }),
      field("email", "Your email (for follow-up)", { required: false, placeholder: "you@example.com" }),
    ],
  },
  {
    id: "contact",
    name: "Contact Form",
    description: "Simple contact/inquiry form",
    icon: "mail",
    category: "General",
    title: "Contact Us",
    welcomeTitle: "Get in touch",
    welcomeDescription: "We'll get back to you as soon as possible.",
    submitMessage: "Message sent! We'll respond within 24 hours.",
    fields: [
      field("short_text", "Your name", { placeholder: "John Doe" }),
      field("email", "Email address", { placeholder: "you@example.com" }),
      field("dropdown", "What is this regarding?", {
        options: [
          opt("General inquiry"),
          opt("Sales question"),
          opt("Technical support"),
          opt("Partnership"),
          opt("Other"),
        ],
      }),
      field("long_text", "Your message", { placeholder: "How can we help?" }),
    ],
  },
  {
    id: "party-date-poll-may",
    name: "Party Date Poll (May)",
    description: "Pick every Friday/Saturday in May that works",
    icon: "calendar",
    category: "Events",
    title: "Party Date Poll - May",
    welcomeTitle: "Help me pick the party date",
    welcomeDescription: "Please select every date you can attend. The more dates you select, the easier it is to choose a day that works for everyone.",
    submitMessage: "Thanks! Your availability was saved.",
    fields: [
      field("short_text", "Your name", { placeholder: "e.g. Alex" }),
      field("checkbox", "Which May dates work for you? (Select all that apply)", {
        description: "Select every date you can make it.",
        options: [
          opt("Friday, April 17"),
          opt("Saturday, April 18"),
          opt("Friday, April 24"),
          opt("Saturday, April 25"),
          opt("Friday, May 1"),
          opt("Saturday, May 2"),
          opt("Friday, May 8"),
          opt("Saturday, May 9"),
          opt("Friday, May 15"),
          opt("Saturday, May 16"),
          opt("Friday, May 22"),
          opt("Saturday, May 23"),
          opt("Friday, May 29"),
          opt("Saturday, May 30"),
          opt("Friday, June 5"),
          opt("Saturday, June 6"),
        ],
      }),
    ],
  },
  {
    id: "event-registration",
    name: "Event Registration",
    description: "Collect signups and dietary preferences",
    icon: "calendar",
    category: "Events",
    title: "Event Registration",
    welcomeTitle: "You're invited!",
    welcomeDescription: "Please let us know if you can make it.",
    submitMessage: "You're registered! See you there.",
    fields: [
      field("short_text", "Full name", { placeholder: "Jane Smith" }),
      field("email", "Email address", { placeholder: "jane@example.com" }),
      field("multiple_choice", "Will you be attending?", {
        options: [opt("Yes, I'll be there!"), opt("Maybe"), opt("Sorry, I can't make it")],
      }),
      field("number", "Number of guests (including yourself)", {
        validation: { min: 1, max: 10 },
        placeholder: "1",
      }),
      field("checkbox", "Any dietary requirements?", {
        required: false,
        options: [
          opt("Vegetarian"),
          opt("Vegan"),
          opt("Gluten-free"),
          opt("Halal"),
          opt("Kosher"),
          opt("None"),
        ],
      }),
      field("long_text", "Anything else we should know?", {
        required: false,
        placeholder: "Special requests, accessibility needs, etc.",
      }),
    ],
  },
  {
    id: "job-application",
    name: "Job Application",
    description: "Collect applications for open positions",
    icon: "briefcase",
    category: "HR",
    title: "Job Application",
    welcomeTitle: "Apply to join our team",
    welcomeDescription: "Fill out this form and we'll review your application.",
    submitMessage: "Application received! We'll be in touch.",
    fields: [
      field("short_text", "Full name", { placeholder: "Jane Smith" }),
      field("email", "Email address", { placeholder: "jane@example.com" }),
      field("phone", "Phone number", { required: false, placeholder: "+1 (555) 000-0000" }),
      field("url", "LinkedIn profile or portfolio", { required: false, placeholder: "https://linkedin.com/in/..." }),
      field("dropdown", "Position applying for", {
        options: [
          opt("Software Engineer"),
          opt("Product Designer"),
          opt("Product Manager"),
          opt("Marketing"),
          opt("Other"),
        ],
      }),
      field("long_text", "Why are you interested in this role?", {
        placeholder: "Tell us about your motivation...",
      }),
      field("file_upload", "Upload your resume/CV", { description: "PDF or DOC format, max 10MB" }),
    ],
  },
  {
    id: "bug-report",
    name: "Bug Report",
    description: "Structured bug/issue reporting",
    icon: "bug",
    category: "Product",
    title: "Bug Report",
    welcomeTitle: "Report an issue",
    welcomeDescription: "Help us fix problems by providing detailed information.",
    submitMessage: "Bug reported! Our team will investigate.",
    fields: [
      field("short_text", "Bug title", { placeholder: "Brief description of the issue" }),
      field("multiple_choice", "Severity", {
        options: [opt("Critical — app is unusable"), opt("Major — feature broken"), opt("Minor — cosmetic/annoying"), opt("Trivial — nice to fix")],
      }),
      field("long_text", "Steps to reproduce", {
        placeholder: "1. Go to...\n2. Click on...\n3. See error...",
        description: "List the exact steps to trigger the bug",
      }),
      field("long_text", "Expected behavior", { placeholder: "What should have happened?" }),
      field("long_text", "Actual behavior", { placeholder: "What actually happened?" }),
      field("short_text", "Browser/Device", { required: false, placeholder: "e.g., Chrome 120 on macOS" }),
      field("file_upload", "Screenshot or recording", { required: false }),
    ],
  },
];

// Fix field ordering
TEMPLATES.forEach((t) => {
  t.fields.forEach((f, i) => {
    f.order = i;
  });
});
