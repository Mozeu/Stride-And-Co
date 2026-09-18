// El inventario normalmente no se "crea" ni se "borra" como tal,como ya estan establecidos los productos dentro del inventario solamente podemos modificar su cantidad y consultar

// READ
function list (req, res, next) {
  res.json({
    message: "Inventory List",
    data: []
  });
}

function find(req, res, next) {
    res.json({
        message: "Inventory by ID",
        data: {}
  });
};

// UPDATE
function update(req, res, next) {
    res.json({
        message: "Inventory Updated",
        data: {}
    });
};

module.exports =  {list, find, update};