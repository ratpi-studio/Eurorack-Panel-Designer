import { describe, expect, it } from "vite-plus/test";

import { getAnonymousUserId, getErrorFingerprint } from "@lib/monitoring";

describe("getErrorFingerprint", () => {
  it("groups the DOM-mutation crash across browser engines", () => {
    const messages = [
      "Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.",
      "Node.removeChild: The node to be removed is not a child of this node",
      "The object can not be found here.",
      "Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node.",
    ];
    for (const message of messages) {
      expect(getErrorFingerprint(new DOMException(message, "NotFoundError"))).toEqual([
        "dom-mutated-outside-react",
      ]);
    }
  });

  it("groups storage quota errors regardless of the call site", () => {
    const error = new DOMException(
      "Setting the value of 'x' exceeded the quota.",
      "QuotaExceededError",
    );
    expect(getErrorFingerprint(error)).toEqual(["storage-quota-exceeded"]);
  });

  it("keeps default grouping for other errors", () => {
    expect(getErrorFingerprint(new TypeError("x is undefined"))).toBeUndefined();
    expect(getErrorFingerprint(new DOMException("Unrelated", "NotFoundError"))).toBeUndefined();
    expect(getErrorFingerprint("boom")).toBeUndefined();
    expect(getErrorFingerprint(null)).toBeUndefined();
  });
});

describe("getAnonymousUserId", () => {
  const createStorage = (initial: Record<string, string> = {}) => {
    const values = new Map(Object.entries(initial));
    return {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => void values.set(key, value),
      values,
    };
  };

  it("creates an id once and reuses it", () => {
    const storage = createStorage();
    const first = getAnonymousUserId(() => storage);
    expect(first).toMatch(/.{8,}/);
    expect(getAnonymousUserId(() => storage)).toBe(first);
    expect(storage.values.size).toBe(1);
  });

  it("returns the stored id", () => {
    const storage = createStorage({ "sentry-anonymous-id": "existing-id" });
    expect(getAnonymousUserId(() => storage)).toBe("existing-id");
  });

  it("falls back to a session id when storage is unavailable or full", () => {
    const blocked = () => {
      throw new DOMException("Access denied", "SecurityError");
    };
    const full = {
      getItem: () => null,
      setItem: () => {
        throw new DOMException("Quota exceeded", "QuotaExceededError");
      },
    };
    expect(getAnonymousUserId(blocked)).toMatch(/.{8,}/);
    expect(getAnonymousUserId(() => full)).toMatch(/.{8,}/);
  });
});
