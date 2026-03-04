import { z } from "zod";

export const clientSchema = z.object({
  name: z.string().min(1, "Client name is required"),
  company: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  industry: z.string().optional(),
  companySize: z
    .enum(["SOLO", "SMALL", "MEDIUM", "LARGE", "ENTERPRISE"])
    .optional(),
});

export type ClientFormData = z.infer<typeof clientSchema>;

export const questionnaireSchema = z.object({
  currentHeadcount: z
    .number()
    .int()
    .positive("Must be at least 1")
    .max(100000),
  projectedHeadcount12mo: z
    .number()
    .int()
    .positive("Must be at least 1")
    .max(100000),
  revenuePerEmployee: z
    .number()
    .positive("Must be positive")
    .optional()
    .catch(undefined),
  currentAnnualRevenue: z
    .number()
    .positive("Must be positive")
    .optional()
    .catch(undefined),
  projectedRevenueGrowth: z
    .number()
    .min(-100)
    .max(1000)
    .optional()
    .catch(undefined),
  sfPerEmployee: z
    .number()
    .positive("Must be positive")
    .max(5000)
    .optional()
    .catch(undefined),
  criticalAmenities: z.array(z.string()).optional(),
  expansionTimeline: z
    .enum([
      "IMMEDIATE",
      "6_MONTHS",
      "12_MONTHS",
      "24_MONTHS",
      "36_PLUS_MONTHS",
    ])
    .optional(),
  budgetConstraint: z
    .number()
    .positive("Must be positive")
    .optional()
    .catch(undefined),
  primaryGoal: z
    .enum([
      "MINIMIZE_COST",
      "MAXIMIZE_GROWTH",
      "ATTRACT_TALENT",
      "IMPROVE_LOCATION",
      "EXPAND_CAPACITY",
    ])
    .optional(),
});

export type QuestionnaireFormData = z.infer<typeof questionnaireSchema>;
