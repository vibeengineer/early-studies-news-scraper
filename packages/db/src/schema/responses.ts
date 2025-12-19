import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { surveys } from "./surveys";

export const responses = pgTable(
  "surveys_responses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    surveyId: uuid("survey_id")
      .notNull()
      .references(() => surveys.id),
    sourcePlatformResponseId: text("source_platform_response_id"),
    responseData: jsonb("response_data").notNull(),
    behaviouralData: jsonb("behavioural_data"),
    metadata: jsonb("metadata"),
    aiInsights: jsonb("ai_insights"),
    aiInsightsSchema: jsonb("ai_insights_schema"),
    aiInsightsPrompt: text("ai_insights_prompt"),
    createdAt: timestamp("created_at", { withTimezone: false })
      .notNull()
      .defaultNow(),

    // Demographics
    age: integer("age"),
    ageRange: text("age_range"),
    gender: text("gender"),
    country: text("country"),
    region: text("region"),
    city: text("city"),
    educationLevel: text("education_level"),
    incomeBracket: text("income_bracket"),
    employmentStatus: text("employment_status"),
    ethnicity: text("ethnicity"),
    maritalStatus: text("marital_status"),
    language: text("language"),
    nationality: text("nationality"),
    religion: text("religion"),
    politicalAffiliation: text("political_affiliation"),
    housingType: text("housing_type"),
    urbanRural: text("urban_rural"),
    disabilityStatus: text("disability_status"),
    householdSize: integer("household_size"),
    hasChildren: boolean("has_children"),
    numberOfChildren: integer("number_of_children"),
    veteranStatus: boolean("veteran_status"),
    generation: text("generation"),
    occupation: text("occupation"),
    companySize: text("company_size"),
    jobTitle: text("job_title"),
    yearsInCurrentRole: integer("years_in_current_role"),
  },
  (table) => [index("idx_responses_survey_id").on(table.surveyId)]
);
