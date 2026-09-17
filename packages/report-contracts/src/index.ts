import { z } from 'zod';

const reportSectionSchema = z.object({
  key: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  confidence: z.number().min(0).max(1),
  evidenceCodes: z.array(z.string()),
});

export const personalityReportSchema = z.object({
  schemaVersion: z.string().min(1),
  overview: z.string().min(1),
  sections: z.array(reportSectionSchema),
  verificationQuestions: z.array(z.string()),
  actions: z.array(z.string()),
  disclaimer: z.string().min(1),
});

export type PersonalityReport = z.infer<typeof personalityReportSchema>;
