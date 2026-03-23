import type {
  DatabaseConnection,
  Driver,
  QueryResult,
} from "https://esm.sh/kysely@0.27.2";
import {
  CompiledQuery,
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
  type Generated,
} from "https://esm.sh/kysely@0.27.2";

export { CompiledQuery };
import type { PoolClient } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import { Pool } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

// Database schema types
export interface ContactsTable {
  id: Generated<number>;
  first_name: string | null;
  last_name: string | null;
  avatar: unknown | null; // JSONB
  first_seen: Date | null;
  last_seen: Date | null;
  actor_id: number | null;
}

export interface GroupTypesTable {
  id: Generated<number>;
  name: string;
  schema: unknown; // JSONB
}

export interface GroupsTable {
  id: Generated<number>;
  name: string;
  group_type_id: number | null;
  avatar: unknown | null; // JSONB
  actor_id: number | null;
  created_at: Date;
}

export interface GroupPropertiesTable {
  id: Generated<number>;
  group_id: number;
  key: string;
  value: string | null;
  type: string;
}

export interface GroupMembersTable {
  id: Generated<number>;
  group_id: number;
  contact_id: number;
  role: string | null;
  joined_at: Date;
  left_at: Date | null;
}

export interface ChannelsTable {
  id: Generated<number>;
  contact_id: number;
  type: string;
  value: string;
  label: string | null;
}

export interface PropertiesTable {
  id: Generated<number>;
  contact_id: number;
  key: string;
  value: string | null;
  type: string | null;
}

export interface ContactTagsTable {
  id: Generated<number>;
  contact_id: number;
  tag_id: number;
}

interface TasksTable {
  id: Generated<number>;
  contact_id: number;
  type: string | null;
  text: string | null;
  due_date: Date;
  done_date: Date | null;
  actor_id: number | null;
}

interface IntentionsTable {
  id: Generated<number>;
  name: string;
  type: string | null;
  description: string | null;
  target_type: string | null;
  target_id: number | null;
  status: string;
  outcome: string | null;
  amount: number | null;
  expected_closing_date: Date | null;
  created_at: Date;
  updated_at: Date;
  archived_at: Date | null;
  index: number | null;
}

interface IntentionContactsTable {
  id: Generated<number>;
  intention_id: number;
  contact_id: number;
}

interface AssignmentsTable {
  id: Generated<number>;
  intention_id: number;
  actor_id: number | null;
  role: string | null;
}

interface NotesTable {
  id: Generated<number>;
  target_type: string;
  target_id: number;
  text: string | null;
  actor_id: number | null;
  status: string | null;
  created_at: Date;
  attachments: unknown[] | null;
}

interface Database {
  contacts: ContactsTable;
  channels: ChannelsTable;
  properties: PropertiesTable;
  contact_tags: ContactTagsTable;
  tasks: TasksTable;
  intentions: IntentionsTable;
  intention_contacts: IntentionContactsTable;
  assignments: AssignmentsTable;
  notes: NotesTable;
  group_types: GroupTypesTable;
  groups: GroupsTable;
  group_properties: GroupPropertiesTable;
  group_members: GroupMembersTable;
}

// Deno Postgres Driver for Kysely
class DenoPostgresDriver implements Driver {
  private pool: Pool;
  private connections = new WeakMap<PoolClient, DatabaseConnection>();

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async init(): Promise<void> {
    // Connection pool is already initialized
  }

  async acquireConnection(): Promise<DatabaseConnection> {
    const client = await this.pool.connect();
    let connection = this.connections.get(client);

    if (!connection) {
      connection = new DenoPostgresConnection(client);
      this.connections.set(client, connection);
    }

    return connection;
  }

  async beginTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw("begin"));
  }

  async commitTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw("commit"));
  }

  async rollbackTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw("rollback"));
  }

  async releaseConnection(connection: DatabaseConnection): Promise<void> {
    (connection as DenoPostgresConnection).release();
  }

  async destroy(): Promise<void> {
    await this.pool.end();
  }
}

class DenoPostgresConnection implements DatabaseConnection {
  private client: PoolClient;

  constructor(client: PoolClient) {
    this.client = client;
  }

  async executeQuery<O>(compiledQuery: CompiledQuery): Promise<QueryResult<O>> {
    const result = await this.client.queryObject<O>({
      text: compiledQuery.sql,
      args: compiledQuery.parameters as unknown[],
    });

    if (
      result.command === "INSERT" ||
      result.command === "UPDATE" ||
      result.command === "DELETE"
    ) {
      return {
        numAffectedRows: BigInt(result.rowCount ?? 0),
        rows: result.rows ?? [],
      };
    }

    return {
      rows: result.rows ?? [],
    };
  }

  streamQuery<O>(
    _compiledQuery: CompiledQuery,
    _chunkSize?: number,
  ): AsyncIterableIterator<QueryResult<O>> {
    throw new Error("Deno Postgres driver does not support streaming");
  }

  release() {
    this.client.release();
  }
}

// Create connection pool
// Use SUPABASE_DB_URL if available (production), otherwise fall back to local dev connection string
const connectionString =
  Deno.env.get("SUPABASE_DB_URL") ||
  "postgresql://postgres:postgres@db:5432/postgres";

const pool = new Pool(connectionString, 1); // Single connection for edge functions

// Create and export Kysely instance
export const db = new Kysely<Database>({
  dialect: {
    createAdapter: () => new PostgresAdapter(),
    createDriver: () => new DenoPostgresDriver(pool),
    createIntrospector: (db: Kysely<any>) => new PostgresIntrospector(db),
    createQueryCompiler: () => new PostgresQueryCompiler(),
  },
});
