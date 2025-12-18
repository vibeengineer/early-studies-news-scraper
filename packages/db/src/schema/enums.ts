import { pgEnum } from "drizzle-orm/pg-core";

export const sourcePlatformEnum = pgEnum("source_platform", [
  "pure_profile",
  "pollfish",
  "prolific",
]);

export const statusEnum = pgEnum("status", [
  "draft",
  "active",
  "paused",
  "completed",
  "archived",
]);

export const surveyTypeEnum = pgEnum("survey_type", [
  "market_research",
  "customer_satisfaction",
  "employee_feedback",
  "product_feedback",
  "brand_awareness",
]);

export const samplingMethodEnum = pgEnum("sampling_method", [
  "social_circle_survey",
]);
