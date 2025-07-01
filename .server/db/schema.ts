// ./server/db/schema.ts
import { pgTable, serial, text, varchar, timestamp, uuid } from 'drizzle-orm/pg-core';

// This table will store public profile data and link to the auth user
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  fullName: text('full_name'),
  // Add any other profile fields you need
});

// A "dummy" table to reference auth.users.
// Drizzle needs this to establish the foreign key relationship.
export const users = pgTable('users', {
    id: uuid('id').primaryKey(),
    fullName: text('full_name'),
    email: text('email').unique(),
  }, (table) => {
    return {
        // This is a special property that tells Drizzle this schema
        // is in a different PostgreSQL schema than the default 'public' one.
        schema: 'auth',
    }
});

// --- ADD THIS NEW TABLE ---
export const projects = pgTable('projects', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 256 }).notNull(),
    description: text('description'), // It can be null initially
    // This links the project to a user profile. It's required.
    userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
// server/db/schema.ts
import { pgTable, serial, text, varchar, timestamp, uuid, integer } from 'drizzle-orm/pg-core';

// ... your existing tables ...

// --- ADD THIS NEW TABLE ---
export const messages = pgTable('messages', {
    id: serial('id').primaryKey(),
    // Link the message to a specific project
    projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
    // Role of the message author: 'user' or 'assistant'
    role: varchar('role', { length: 15, enum: ['user', 'assistant'] }).notNull(),
    content: text('content').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});