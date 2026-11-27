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
    Product.findAll({
      attributes: ['id', 'name'],
      include: [
        {
          model: Variant,
          as: 'variants',
          attributes: ['id'],
          include: [{
            model: Inventory,
            as: 'inventory',
            attributes: ['stock', 'reserved']
          }]
        }
      ],
      order: [['name', 'ASC'], ['id', 'ASC']]
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

  const productStock = stockRows.map(product => {
    const stock = (product.variants || []).reduce((total, variant) => ({
      stock: total.stock + Number(variant.inventory?.stock || 0),
      reserved: total.reserved + Number(variant.inventory?.reserved || 0)
    }), { stock: 0, reserved: 0 });

    return {
      id: product.id,
      name: product.name,
      stock: stock.stock,
      reserved: stock.reserved,
      available: Math.max(0, stock.stock - stock.reserved)
    };
  });

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
