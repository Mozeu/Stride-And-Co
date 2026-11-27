const { allowFields } = require('../middleware/allowFields');

function run(mw, req) {
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  const next = jest.fn();
  return mw(req, res, next).then(() => ({ res, next }));
}

const base = { user: { id: 1 }, __: (key) => key };
const own = allowFields(['name', 'active'], async () => 1);

test('own scope with an allowed field passes', async () => {
  const { next } = await run(own, { ...base, body: { name: 'x' } });
  expect(next).toHaveBeenCalledWith();
});

test('own scope with role_id responds 403', async () => {
  const { res, next } = await run(own, { ...base, body: { role_id: 1 } });
  expect(res.status).toHaveBeenCalledWith(403);
  expect(next).not.toHaveBeenCalled();
});

test('own scope mixing allowed and forbidden fields responds 403', async () => {
  const { res } = await run(own, { ...base, body: { name: 'x', role_id: 1 } });
  expect(res.status).toHaveBeenCalledWith(403);
});

test('editing someone else (any scope) allows any field', async () => {
  const other = allowFields(['name'], async () => 2);
  const { next } = await run(other, { ...base, body: { role_id: 1 } });
  expect(next).toHaveBeenCalledWith();
});

test('unknown owner passes through, authorize decides', async () => {
  const unknown = allowFields(['name'], async () => null);
  const { next } = await run(unknown, { ...base, body: { role_id: 1 } });
  expect(next).toHaveBeenCalledWith();
});

test('if getOwnerId throws, it calls next(error)', async () => {
  const boom = new Error('boom');
  const bad = allowFields(['name'], async () => { throw boom; });
  const { next } = await run(bad, { ...base, body: {} });
  expect(next).toHaveBeenCalledWith(boom);
});
