jest.mock('../middleware/authenticate', () => (req, res, next) => {
  req.user = {
    id: 1,
    active: true,
    role: { name: 'admin' }
  };
  next();
});

jest.mock('../middleware/authorize', () => ({
  authorize: () => (req, res, next) => next()
}));

jest.mock('../utils/password', () => ({
  hashPassword: jest.fn(async () => ({
    securePassword: 'test-password-hash',
    saltKey: 'test-salt'
  })),
  verifyPassword: jest.fn(async () => true)
}));

jest.mock('../models/relationals/User', () => ({
  hasMany: jest.fn(),
  belongsTo: jest.fn(),
  findOne: jest.fn(async () => null),
  create: jest.fn(async (attributes) => ({ id: 1, ...attributes })),
  findAll: jest.fn(async () => []),
  findByPk: jest.fn(async (id) => id === '999999' ? {} : ({
      id: Number(id),
      first_name: 'Test',
      last_name: 'User',
      email: 'test@example.com',
      role_id: 1,
      update: jest.fn(async function (changes) {
        Object.assign(this, changes);
        return this;
      }),
      destroy: jest.fn(async () => undefined)
    }))
}));

jest.mock('../models/relationals/Roles', () => ({
  hasMany: jest.fn(),
  belongsTo: jest.fn(),
  belongsToMany: jest.fn(),
  create: jest.fn(async (attributes) => ({
    id: 1,
    ...attributes,
    setPermissions: jest.fn(async () => undefined),
    update: jest.fn(async function (changes) {
      Object.assign(this, changes);
      return this;
    }),
    destroy: jest.fn(async () => undefined)
  })),
  findAll: jest.fn(async () => []),
  findByPk: jest.fn(async (id) => id === '999999' ? {} : ({
      id: Number(id),
      name: 'test-role',
      setPermissions: jest.fn(async () => undefined),
      update: jest.fn(async function (changes) {
        Object.assign(this, changes);
        return this;
      }),
      destroy: jest.fn(async () => undefined)
    }))
}));

jest.mock('../models/relationals/Permissions', () => ({
  belongsToMany: jest.fn(),
  create: jest.fn(async (attributes) => ({ id: 1, ...attributes })),
  findAll: jest.fn(async () => []),
  findByPk: jest.fn(async (id) => id === '999999' ? {} : ({
      id: Number(id),
      key: 'test:read:any',
      description: 'Test permission',
      update: jest.fn(async function (changes) {
        Object.assign(this, changes);
        return this;
      }),
      destroy: jest.fn(async () => undefined)
    }))
}));

jest.mock('../models/documents', () => ({
  Customer: {
    create: jest.fn(async (attributes) => ({ _id: 'customer-test-id', ...attributes })),
    find: jest.fn(async () => []),
    findById: jest.fn(async (id) => id === '999999' ? {} : ({ _id: id, userId: 1 })),
    findByIdAndUpdate: jest.fn(async (id, attributes) => ({ _id: id, ...attributes })),
    findByIdAndDelete: jest.fn(async (id) => ({ _id: id }))
  },
  Order: {
    create: jest.fn(async (attributes) => ({ _id: 'order-test-id', ...attributes })),
    find: jest.fn(() => ({ populate: jest.fn(async () => []) })),
    findById: jest.fn(() => ({ populate: jest.fn(async () => ({ _id: 'order-test-id' })) })),
    findByIdAndUpdate: jest.fn(() => ({
      populate: jest.fn(async () => ({ _id: 'order-test-id' }))
    }))
  }
}));
