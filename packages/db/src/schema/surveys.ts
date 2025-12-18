import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { clients } from "./clients";
import {
  samplingMethodEnum,
  sourcePlatformEnum,
  statusEnum,
  surveyTypeEnum,
} from "./enums";

export const surveys = pgTable(
  "surveys_surveys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id),
    title: text("title").notNull(),
    description: text("description"),
    status: statusEnum("status").notNull(),
    sourcePlatform: sourcePlatformEnum("source_platform").notNull(),
    sourcePlatformSurveyId: text("source_platform_survey_id"),
    surveyType: surveyTypeEnum("survey_type"),
    samplingMethod: samplingMethodEnum("sampling_method"),
    tags: text("tags").array(),
    createdAt: timestamp("created_at", { withTimezone: false })
      .notNull()
      .defaultNow(),
    launchedAt: timestamp("launched_at", { withTimezone: false }),
    completedAt: timestamp("completed_at", { withTimezone: false }),
  },
  (table) => [
    index("idx_surveys_client_id").on(table.clientId),
    index("idx_surveys_status").on(table.status),
  ]
);
