import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Real PostgreSQL execution in memory. Only Supabase's platform-owned tables,
// roles and JWT identity function are simulated; no GoTrue/Storage API is running.
let db: PGlite;
const alice = "10000000-0000-4000-8000-000000000001";
const bob = "10000000-0000-4000-8000-000000000002";
const projectA = "20000000-0000-4000-8000-000000000001";
const projectB = "20000000-0000-4000-8000-000000000002";
const versionA = "30000000-0000-4000-8000-000000000001";
const hash = "a".repeat(64);

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
    create schema auth; create schema storage;
    create table auth.users(id uuid primary key, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
    grant usage on schema public, auth, storage to anon, authenticated, service_role;
    grant execute on function auth.uid() to anon, authenticated, service_role;
    create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id), name text);
    alter table storage.objects enable row level security;
    grant all on storage.objects to anon, authenticated, service_role;
    create policy simulated_broad_allow on storage.objects for all to anon, authenticated using(true) with check(true);
  `);
  const migration = await readFile(
    new URL(
      "../../../supabase/migrations/202610200001_auth_ownership.sql",
      import.meta.url,
    ),
    "utf8",
  );
  await db.exec(migration);
  await db.query(
    "insert into auth.users(id, raw_user_meta_data) values ($1, '{\"approved\":true}'), ($2, '{}')",
    [alice, bob],
  );
  await db.query(
    "insert into public.projects(id, owner_id, title, brief) values ($1,$2,'Alice project','{}'),($3,$4,'Bob project','{}')",
    [projectA, alice, projectB, bob],
  );
  await db.query(
    "insert into public.project_versions(id,project_id,owner_id,version_number,schema_version,content,content_hash) values($1,$2,$3,1,1,'{}',$4)",
    [versionA, projectA, alice, hash],
  );
  await db.exec(
    "insert into storage.objects(bucket_id,name) values('creator-media','private-test.wav')",
  );
}, 30000);
afterAll(async () => {
  if (db) await db.close();
});

async function asRole(
  role: "anon" | "authenticated" | "service_role",
  user: string,
  run: () => Promise<void>,
) {
  await db.exec(`begin; set local role ${role}`);
  try {
    await db.query("select set_config('request.jwt.claim.sub',$1,true)", [
      user,
    ]);
    await run();
  } finally {
    await db.exec("rollback");
  }
}

describe("migration ownership and privilege boundaries in PostgreSQL", () => {
  it("creates unapproved profiles even with forged signup metadata", async () => {
    const result = await db.query<{ approved: boolean }>(
      "select approved from public.profiles where id=$1",
      [alice],
    );
    expect(result.rows[0].approved).toBe(false);
  });
  it("lets two ordinary identities read only their own profiles and projects", async () => {
    for (const user of [alice, bob])
      await asRole("authenticated", user, async () => {
        expect(
          (await db.query<{ id: string }>("select id from public.profiles"))
            .rows,
        ).toEqual([{ id: user }]);
        expect(
          (
            await db.query<{ owner_id: string }>(
              "select owner_id from public.projects",
            )
          ).rows,
        ).toEqual([{ owner_id: user }]);
      });
  });
  it("denies anonymous access", async () => {
    await asRole("anon", "", async () => {
      await expect(db.query("select * from public.profiles")).rejects.toThrow(
        /permission denied/,
      );
    });
  });
  it("prevents self-approval at the database column privilege boundary", async () => {
    await asRole("authenticated", alice, async () => {
      await expect(
        db.query("update public.profiles set approved=true where id=$1", [
          alice,
        ]),
      ).rejects.toThrow(/permission denied/);
    });
  });
  it("allows own timezone edits and prevents editing another profile", async () => {
    await asRole("authenticated", alice, async () => {
      expect(
        (
          await db.query(
            "update public.profiles set preferred_timezone='Asia/Kolkata' where id=$1 returning id",
            [alice],
          )
        ).rows,
      ).toHaveLength(1);
      expect(
        (
          await db.query(
            "update public.profiles set preferred_timezone='UTC' where id=$1 returning id",
            [bob],
          )
        ).rows,
      ).toHaveLength(0);
    });
  });
  it("rejects invalid time zones", async () => {
    await asRole("authenticated", alice, async () => {
      await expect(
        db.exec("update public.profiles set preferred_timezone='Not/AZone'"),
      ).rejects.toThrow(/Invalid time zone/);
    });
  });
  it("reserves approval changes for a privileged path", async () => {
    await asRole("service_role", alice, async () => {
      expect(
        (
          await db.query(
            "update public.profiles set approved=true where id=$1 returning approved",
            [alice],
          )
        ).rows,
      ).toEqual([{ approved: true }]);
    });
  });
  it("denies direct browser project writes and version reads belonging to another owner", async () => {
    await asRole("authenticated", bob, async () => {
      expect(
        (await db.query("select id from public.project_versions")).rows,
      ).toHaveLength(0);
    });
    await asRole("authenticated", alice, async () => {
      await expect(
        db.query(
          "insert into public.projects(owner_id,title,brief) values($1,'Forged','{}')",
          [bob],
        ),
      ).rejects.toThrow(/permission denied/);
    });
  });
  it("rejects mismatched child ownership even for privileged inserts", async () => {
    await asRole("service_role", alice, async () => {
      await expect(
        db.query(
          "insert into public.project_versions(project_id,owner_id,version_number,schema_version,content,content_hash) values($1,$2,2,1,'{}',$3)",
          [projectB, alice, hash],
        ),
      ).rejects.toThrow(/foreign key/);
    });
  });
  it("rejects a selected approved version from another project", async () => {
    await asRole("service_role", bob, async () => {
      await expect(
        db.query(
          "update public.projects set approved_version_id=$1 where id=$2",
          [versionA, projectB],
        ),
      ).rejects.toThrow(/foreign key/);
    });
  });
  it("keeps approved content immutable even for a privileged role", async () => {
    await asRole("service_role", alice, async () => {
      await expect(
        db.query(
          "update public.project_versions set content='{}' where id=$1",
          [versionA],
        ),
      ).rejects.toThrow(/immutable/);
    });
  });
  it("hides soft-deleted projects and their versions", async () => {
    await db.exec("begin");
    try {
      await db.query(
        "update public.projects set deletion_requested_at=now() where id=$1",
        [projectA],
      );
      await db.exec("set local role authenticated");
      await db.query("select set_config('request.jwt.claim.sub',$1,true)", [
        alice,
      ]);
      expect(
        (await db.query("select id from public.projects")).rows,
      ).toHaveLength(0);
      expect(
        (await db.query("select id from public.project_versions")).rows,
      ).toHaveLength(0);
    } finally {
      await db.exec("rollback");
    }
  });
  it("creates a private bucket and blocks direct browser media access despite a permissive policy", async () => {
    expect(
      (
        await db.query(
          "select public from storage.buckets where id='creator-media'",
        )
      ).rows,
    ).toEqual([{ public: false }]);
    await asRole("authenticated", alice, async () => {
      expect(
        (await db.query("select * from storage.objects")).rows,
      ).toHaveLength(0);
    });
    await asRole("authenticated", alice, async () => {
      await expect(
        db.exec(
          "insert into storage.objects(bucket_id,name) values('creator-media','attack.wav')",
        ),
      ).rejects.toThrow(/row-level security/);
    });
  });
});
