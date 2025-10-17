import { pgTable, serial, text, timestamp, varchar, integer } from "drizzle-orm/pg-core";

  export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  image: text("image"),
});

export const conversations = pgTable("conversations", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: integer("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  conversationId: varchar("conversation_id", { length: 36 }).notNull(),
  role: varchar("role", { length: 20 }).notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  reasoning: text("reasoning"),
  duration: integer("duration"), // duration in milliseconds
  toolCalls: text("tool_calls"), // JSON string of tool calls array
  createdAt: timestamp("created_at").defaultNow().notNull(),
  });

export const slack_users = pgTable("slack_users", {
  id: serial("id").primaryKey(),
  userid: integer("userid").notNull().references(() => users.id, { onDelete: "cascade" }),
  slack_user_id: varchar("slack_user_id", { length: 255 }).notNull().unique(),
  access_token: text("access_token").notNull(),
  id_token: text("id_token"), // OpenID Connect ID token
  team_id: varchar("team_id", { length: 255 }),
  user_name: varchar("user_name", { length: 255 }),
  real_name: varchar("real_name", { length: 255 }),
  email: varchar("email", { length: 255 }),
  avatar: text("avatar"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});
