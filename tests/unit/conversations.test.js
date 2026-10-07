import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { createConversationStore } from '../../src/state/conversations.js';

test('state transitions and indexes stay consistent', () => {
  const s = createConversationStore({});
  const c = s.begin('room1', 'a@example.com');
  assert.equal(c.state, 'creating');
  s.setPending('room1', 'task1');
  assert.equal(s.get('room1').state, 'pending');
  assert.equal(s.byTask('task1').roomId, 'room1');
  s.activate('room1');
  assert.equal(s.get('room1').state, 'active');
  s.remove('room1');
  assert.equal(s.get('room1'), undefined);
  assert.equal(s.byTask('task1'), undefined);
  assert.equal(s.size, 0);
});

test('queue preserves arrival order and drains once', () => {
  const s = createConversationStore({});
  s.begin('r', 'a@example.com'); s.setPending('r', 't');
  s.enqueue('r', { n: 1 }); s.enqueue('r', { n: 2 }); s.enqueue('r', { n: 3 });
  assert.deepEqual(s.drain('r').map((m) => m.n), [1, 2, 3]);
  assert.deepEqual(s.drain('r'), []);
});

test('pending timer fires onTimeout; activate cancels it', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const fired = [];
  const s = createConversationStore({ pendingTimeoutMs: 100, onTimeout: (c) => fired.push(c.roomId) });
  s.begin('r1', 'x'); s.setPending('r1', 't1');
  s.begin('r2', 'y'); s.setPending('r2', 't2'); s.activate('r2');
  t.mock.timers.tick(150);
  assert.deepEqual(fired, ['r1']);
});

test('remove clears the pending timer', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let fired = 0;
  const s = createConversationStore({ pendingTimeoutMs: 100, onTimeout: () => { fired += 1; } });
  s.begin('r', 'x'); s.setPending('r', 't'); s.remove('r');
  t.mock.timers.tick(500);
  assert.equal(fired, 0);
});
