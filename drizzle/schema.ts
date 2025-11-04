import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Projetos de audiodescrição criados pelos usuários
 */
export const adProjects = mysqlTable("ad_projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  videoSource: varchar("video_source", { length: 50 }).notNull(), // 'upload' ou 'youtube'
  videoUrl: text("video_url"), // URL do YouTube ou URL do vídeo no S3
  videoKey: varchar("video_key", { length: 500 }), // Chave do vídeo no S3
  videoDuration: int("video_duration"), // Duração em segundos
  status: mysqlEnum("status", ["processing", "completed", "failed"]).default("processing").notNull(),
  scriptData: text("script_data"), // JSON do roteiro de audiodescrição
  audioUrl: text("audio_url"), // URL do áudio final no S3
  audioKey: varchar("audio_key", { length: 500 }), // Chave do áudio no S3
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export type AdProject = typeof adProjects.$inferSelect;
export type InsertAdProject = typeof adProjects.$inferInsert;

/**
 * Unidades descritivas individuais do roteiro de audiodescrição
 */
export const adUnits = mysqlTable("ad_units", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("project_id").notNull().references(() => adProjects.id, { onDelete: 'cascade' }),
  timestamp: int("timestamp").notNull(), // Timestamp em segundos
  type: mysqlEnum("type", ["nota_introdutoria", "descricao"]).notNull(),
  text: text("text").notNull(),
  audioUrl: text("audio_url"), // URL do áudio desta unidade no S3
  audioKey: varchar("audio_key", { length: 500 }), // Chave do áudio no S3
  order: int("order").notNull(), // Ordem de exibição
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type AdUnit = typeof adUnits.$inferSelect;
export type InsertAdUnit = typeof adUnits.$inferInsert;