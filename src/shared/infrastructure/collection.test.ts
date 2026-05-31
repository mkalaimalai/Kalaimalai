import { describe, it, expect } from "vitest";
import { InMemoryKeyValueStore } from "./key-value-store";
import { Collection } from "./collection";

interface Row {
  id: string;
  name: string;
}

function makeCollection() {
  const store = new InMemoryKeyValueStore();
  const collection = new Collection<Row>({
    store,
    namespace: "test:rows",
    schemaVersion: 1,
  });
  return { store, collection };
}

describe("Collection", () => {
  it("upserts and reads back records", () => {
    const { collection } = makeCollection();
    collection.upsert({ id: "a", name: "Ada" });
    expect(collection.get("a")).toEqual({ id: "a", name: "Ada" });
    expect(collection.all()).toHaveLength(1);
  });

  it("persists through the store across instances (write-through)", () => {
    const { store, collection } = makeCollection();
    collection.upsert({ id: "a", name: "Ada" });

    const reopened = new Collection<Row>({
      store,
      namespace: "test:rows",
      schemaVersion: 1,
    });
    expect(reopened.get("a")?.name).toBe("Ada");
  });

  it("deletes records", () => {
    const { collection } = makeCollection();
    collection.upsert({ id: "a", name: "Ada" });
    collection.delete("a");
    expect(collection.get("a")).toBeNull();
  });

  it("runs a migration when the schema version differs", () => {
    const store = new InMemoryKeyValueStore();
    store.write(
      "test:rows",
      JSON.stringify({
        schemaVersion: 0,
        records: { a: { id: "a", fullName: "Ada" } },
      }),
    );
    const collection = new Collection<Row>({
      store,
      namespace: "test:rows",
      schemaVersion: 1,
      migrate: (raw) => {
        const old = raw as Record<string, { id: string; fullName: string }>;
        const next: Record<string, Row> = {};
        for (const [id, r] of Object.entries(old)) {
          next[id] = { id: r.id, name: r.fullName };
        }
        return next;
      },
    });
    expect(collection.get("a")?.name).toBe("Ada");
  });
});
