import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().optional(),
  brokerageName: z.string().optional(),
  phone: z.string().optional(),
});

export type ProfileFormData = z.infer<typeof profileSchema>;
