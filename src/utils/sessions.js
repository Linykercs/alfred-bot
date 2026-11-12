const TTL = 10 * 60 * 1000; // 10 minutos

const store = new Map();

function get(userId) {
  const session = store.get(userId);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    store.delete(userId);
    return null;
  }
  return session;
}

function set(userId, data) {
  store.set(userId, { ...data, expiresAt: Date.now() + TTL });
}

function clear(userId) {
  store.delete(userId);
}

module.exports = { get, set, clear };
