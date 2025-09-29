import { sql } from "drizzle-orm";
import { pgTable, text, varchar, uuid, timestamp, jsonb, boolean, integer, decimal, pgEnum, date, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", [
  "super_admin",
  "admin_institucion", 
  "admin_sede",
  "entrenador",
  "secretario",
  "representante",
  "deportista"
]);

export const visibilityEnum = pgEnum("visibility", ["global", "sede", "grupo"]);
export const publicationStatusEnum = pgEnum("publication_status", ["borrador", "programada", "publicada", "oculta"]);
export const notificationTypeEnum = pgEnum("notification_type", ["push", "inapp", "ambas"]);
export const attendanceStatusEnum = pgEnum("attendance_status", ["presente", "ausente", "tardanza", "justificado"]);

// Core entities
export const institutions = pgTable("institutions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  logoUrl: text("logo_url"),
  primaryColor: varchar("primary_color", { length: 7 }).default("#3B82F6"),
  secondaryColor: varchar("secondary_color", { length: 7 }).default("#1E40AF"),
  accentColor: varchar("accent_color", { length: 7 }).default("#EFF6FF"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const venues = pgTable("venues", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  institutionId: uuid("institution_id").references(() => institutions.id),
  name: text("name").notNull(),
  address: text("address"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  logoUrl: text("logo_url"),
  bannerUrl: text("banner_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  authUserId: uuid("auth_user_id").unique(), // Conecta con auth.users de Supabase
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role").notNull(), // Changed from userRoleEnum to text to support custom roles
  institutionId: uuid("institution_id").references(() => institutions.id),
  venueIds: jsonb("venue_ids").default([]),
  groupIds: jsonb("group_ids").default([]),
  permissions: jsonb("permissions").default({}),
  avatarUrl: text("avatar_url"),
  phone: varchar("phone", { length: 20 }),
  cedula: varchar("cedula", { length: 20 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const groups = pgTable("groups", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  institutionId: uuid("institution_id").references(() => institutions.id),
  venueId: uuid("venue_id").references(() => venues.id),
  name: text("name").notNull(),
  description: text("description"),
  mainTrainerId: uuid("main_trainer_id").references(() => users.id),
  additionalTrainerIds: jsonb("additional_trainer_ids").default([]),
  schedule: jsonb("schedule").default({}),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const athletes = pgTable("athletes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  institutionId: uuid("institution_id").references(() => institutions.id),
  venueId: uuid("venue_id").references(() => venues.id),
  groupId: uuid("group_id").references(() => groups.id),
  representativeId: uuid("representative_id").references(() => users.id),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  birthDate: timestamp("birth_date"),
  documentNumber: varchar("document_number", { length: 20 }),
  avatarUrl: text("avatar_url"),
  medicalInfo: jsonb("medical_info").default({}),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const events = pgTable("events", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  institutionId: uuid("institution_id").references(() => institutions.id),
  venueId: uuid("venue_id").references(() => venues.id),
  groupId: uuid("group_id").references(() => groups.id),
  title: text("title").notNull(),
  description: text("description"),
  eventType: varchar("event_type", { length: 50 }).default("entrenamiento"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  location: text("location"),
  isMatch: boolean("is_match").default(false),
  matchId: uuid("match_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const attendance = pgTable("attendance", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: uuid("event_id").references(() => events.id),
  athleteId: uuid("athlete_id").references(() => athletes.id),
  status: attendanceStatusEnum("status").notNull(),
  notes: text("notes"),
  markedBy: uuid("marked_by").references(() => users.id),
  markedAt: timestamp("marked_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow()
});

export const publications = pgTable("publications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  institutionId: uuid("institution_id").references(() => institutions.id),
  venueId: uuid("venue_id").references(() => venues.id),
  groupId: uuid("group_id").references(() => groups.id),
  authorId: uuid("author_id").references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  mediaUrls: jsonb("media_urls").default([]),
  visibility: visibilityEnum("visibility").notNull(),
  status: publicationStatusEnum("status").default("borrador"),
  publishAt: timestamp("publish_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  institutionId: uuid("institution_id").references(() => institutions.id),
  venueId: uuid("venue_id").references(() => venues.id),
  groupId: uuid("group_id").references(() => groups.id),
  title: text("title").notNull(),
  body: text("body").notNull(),
  type: notificationTypeEnum("type").notNull(),
  audience: jsonb("audience").default({}),
  scheduledFor: timestamp("scheduled_for"),
  sentAt: timestamp("sent_at"),
  delivered: integer("delivered").default(0),
  read: integer("read").default(0),
  createdAt: timestamp("created_at").defaultNow()
});

// Insert schemas
export const insertInstitutionSchema = createInsertSchema(institutions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertVenueSchema = createInsertSchema(venues).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  authUserId: true, // Se maneja automáticamente por el trigger
  createdAt: true,
  updatedAt: true
});

export const insertGroupSchema = createInsertSchema(groups).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertAthleteSchema = createInsertSchema(athletes).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertPublicationSchema = createInsertSchema(publications).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true
});

// Types
export type Institution = typeof institutions.$inferSelect;
export type InsertInstitution = z.infer<typeof insertInstitutionSchema>;

export type Venue = typeof venues.$inferSelect;
export type InsertVenue = z.infer<typeof insertVenueSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Extended User type that includes colaborador info for staff roles
export interface UserWithColaborador extends User {
  colaborador?: {
    id?: string;
    cedula?: string;
    birthDate?: string;
    address?: string;
    startContract?: string;
    endContract?: string;
    observations?: string;
    cityId?: string;
    city?: {
      id: string;
      name: string;
      province?: {
        id: string;
        name: string;
      };
    };
  };
}

export type Group = typeof groups.$inferSelect;
export type InsertGroup = z.infer<typeof insertGroupSchema>;

export type Athlete = typeof athletes.$inferSelect;
export type InsertAthlete = z.infer<typeof insertAthleteSchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type Publication = typeof publications.$inferSelect;
export type InsertPublication = z.infer<typeof insertPublicationSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// System configuration table
export const systemConfig = pgTable("system_config", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: jsonb("value").notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).default("general"),
  isPublic: boolean("is_public").default(false), // Si es visible para usuarios no-admin
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const insertSystemConfigSchema = createInsertSchema(systemConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type SystemConfig = typeof systemConfig.$inferSelect;
export type InsertSystemConfig = z.infer<typeof insertSystemConfigSchema>;

// Provinces table (Provincias del Ecuador)
export const provinces = pgTable("provinces", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  country: text("country").default("Ecuador"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Cities table - Related to provinces
export const cities = pgTable("cities", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  provinceId: uuid("province_id").references(() => provinces.id, { onDelete: "restrict" }).notNull(),
  name: text("name").notNull(),
  isPrincipal: boolean("is_principal").default(false), // Ciudad principal de la provincia
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
}, (table) => ({
  // Unique constraint para evitar ciudades duplicadas en la misma provincia
  uniqueCityPerProvince: uniqueIndex("unique_city_per_province_idx").on(table.provinceId, table.name)
}));

// Collaborators table - Extension of users for staff roles
export const colaboradores = pgTable("colaboradores", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull().unique(), // FK to users.id, not auth.users
  institutionId: uuid("institution_id").references(() => institutions.id),
  customRoleId: uuid("custom_role_id"), // Link to custom roles if applicable - will add FK later
  cityId: uuid("city_id").references(() => cities.id),
  // Personal information
  cedula: varchar("cedula", { length: 20 }), // Unique constraint handled via partial index
  birthDate: date("birth_date"),
  address: text("address"),
  // Contract information
  startContract: date("start_contract"),
  endContract: date("end_contract"),
  observations: text("observations"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
}, (table) => ({
  // Partial unique index on cedula - only when cedula is not null
  uniqueCedula: uniqueIndex("unique_cedula_idx").on(table.cedula).where(sql`${table.cedula} IS NOT NULL`)
}));

// Insert schemas
export const insertProvinceSchema = createInsertSchema(provinces).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertCitySchema = createInsertSchema(cities).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertColaboradorSchema = createInsertSchema(colaboradores).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Types
export type Province = typeof provinces.$inferSelect;
export type InsertProvince = z.infer<typeof insertProvinceSchema>;

export type City = typeof cities.$inferSelect;
export type InsertCity = z.infer<typeof insertCitySchema>;

export type Colaborador = typeof colaboradores.$inferSelect;
export type InsertColaborador = z.infer<typeof insertColaboradorSchema>;
