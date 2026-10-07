// In-process idempotency registry. Keys are never evicted (lifetime of the process, FR-017).
export function createRegistry() {
  const keys = new Set();
  return {
    // Synchronous: no await between check and add, so concurrent duplicates cannot both pass.
    claim(key) {
      if (keys.has(key)) return false;
      keys.add(key);
      return true;
    },
    has: (key) => keys.has(key),
    get size() {
      return keys.size;
    }
  };
}
