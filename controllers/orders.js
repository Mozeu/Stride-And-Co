const { Order } = require('../models/documents');

// Una orden se crea (POST) y se consulta, pero normalmente no se borra (por trazabilidad/auditoría, ni un negocio real elimina órdenes).

// CREATE
async function create(req, res, next) {
    const order = await Order.create(req.body);

    res.status(201).json({
        message: "Order Created", 
        data: order
    });
}

// READ
async function list (req, res, next) {
  const orders = await Order.find().populate('customerId');
  
  res.json({
    message: "Orders List",
    data: orders
  });
}

function find(req, res, next) {
    res.json({
        message: "Order by ID",
        data: {}
  });
};

// UPDATE
function update(req, res, next) {
    res.json({
        message: "Order Updated",
        data: {}
    });
};

module.exports =  {create, list, find, update};