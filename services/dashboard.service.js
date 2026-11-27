const { Product, Variant, Inventory } = require('../models/sql');
const { Order } = require('../models/mongo');

async function getDashboard() {
  const [productCount, variantCount, inventoryRows, orderCount, recentOrders, stockRows, orderStatusCounts] = await Promise.all([
    Product.count(),
    Variant.count(),
    Inventory.findAll({ attributes: ['stock', 'reserved'], raw: true }),
    Order.countDocuments(),
    Order.find()
      .select('_id items totals statusHistory createdAt')
      .sort({ createdAt: -1, _id: -1 })
      .limit(5)
      .lean(),
    Variant.findAll({
      attributes: ['id', 'product_id', 'size', 'color'],
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name', 'brand'] },
        { model: Inventory, as: 'inventory', attributes: ['stock', 'reserved'] }
      ],
      order: [['id', 'ASC']]
    }),
    Order.aggregate([
      {
        $set: {
          currentStatus: {
            $cond: [
              { $gt: [{ $size: { $ifNull: ['$statusHistory', []] } }, 0] },
              { $arrayElemAt: ['$statusHistory.status', -1] },
              'pending'
            ]
          }
        }
      },
      { $group: { _id: '$currentStatus', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])
  ]);

  const availableUnits = inventoryRows.reduce((sum, row) => {
    return sum + Math.max(0, Number(row.stock || 0) - Number(row.reserved || 0));
  }, 0);

  const productsById = new Map();
  for (const row of stockRows) {
    const product = row.product;
    const productId = row.product_id;
    if (!productId) continue;
    const entry = productsById.get(productId) || {
      id: productId,
      name: product?.name || `Product #${productId}`,
      stock: 0,
      reserved: 0
    };
    entry.stock += Number(row.inventory?.stock || 0);
    entry.reserved += Number(row.inventory?.reserved || 0);
    productsById.set(productId, entry);
  }

  const productStock = [...productsById.values()].map(entry => ({
    ...entry,
    available: Math.max(0, entry.stock - entry.reserved)
  }));

  return {
    productCount,
    variantCount,
    availableUnits,
    orderCount,
    recentOrders,
    productStock,
    orderStatusCounts: orderStatusCounts.map(row => ({
      status: row._id || 'pending',
      count: Number(row.count || 0)
    }))
  };
}

module.exports = { getDashboard };
