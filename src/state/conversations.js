// Conversation <-> task association store (data-model.md). In memory only.
export function createConversationStore({ pendingTimeoutMs, onTimeout = () => {} } = {}) {
  const byRoom = new Map();
  const byTaskId = new Map();

  function clearTimer(conv) {
    if (conv.timer) {
      clearTimeout(conv.timer);
      conv.timer = null;
    }
  }

  return {
    get: (roomId) => byRoom.get(roomId),
    byTask(taskId) {
      const roomId = byTaskId.get(taskId);
      return roomId ? byRoom.get(roomId) : undefined;
    },
    begin(roomId, personEmail) {
      const conv = { roomId, personEmail, taskId: null, state: 'creating', queue: [], timer: null };
      byRoom.set(roomId, conv);
      return conv;
    },
    setPending(roomId, taskId) {
      const conv = byRoom.get(roomId);
      if (!conv) return undefined;
      conv.taskId = taskId;
      conv.state = 'pending';
      byTaskId.set(taskId, roomId);
      if (pendingTimeoutMs) {
        conv.timer = setTimeout(() => {
          conv.timer = null;
          onTimeout(conv);
        }, pendingTimeoutMs);
        conv.timer.unref?.();
      }
      return conv;
    },
    activate(roomId) {
      const conv = byRoom.get(roomId);
      if (!conv) return undefined;
      clearTimer(conv);
      conv.state = 'active';
      return conv;
    },
    enqueue(roomId, message) {
      byRoom.get(roomId)?.queue.push(message);
    },
    drain(roomId) {
      const conv = byRoom.get(roomId);
      if (!conv) return [];
      const items = conv.queue;
      conv.queue = [];
      return items;
    },
    remove(roomId) {
      const conv = byRoom.get(roomId);
      if (!conv) return undefined;
      clearTimer(conv);
      byRoom.delete(roomId);
      if (conv.taskId) byTaskId.delete(conv.taskId);
      return conv;
    },
    get size() {
      return byRoom.size;
    }
  };
}
