// Una orden se crea (POST) y se consulta, pero normalmente no se borra (por trazabilidad/auditoría, ni un negocio real elimina órdenes).

// CREATE
function create(req, res, next) {
    res.status(201).json({
        message: "Order Created", 
        data: {}
    });
}

// READ
function list (req, res, next) {
  res.json({
    message: "Orders List",
    data: []
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