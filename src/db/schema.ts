import { pgTable, serial, text, timestamp, varchar, integer } from "drizzle-orm/pg-core";

  export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  password: varchar("password", { length: 255 }).notNull(),
});

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  conversationId: integer("conversation_id").notNull(),
  role: varchar("role", { length: 20 }).notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  reasoning: text("reasoning"),
  duration: integer("duration"), // duration in milliseconds
  toolCalls: text("tool_calls"), // JSON string of tool calls array
  createdAt: timestamp("created_at").defaultNow().notNull(),
  });
