// CREATE
function create(req, res, next) {
    res.status(201).json({
        message: "Product Created", 
        data: {}
    });
}

// READ
function list (req, res, next) {
  res.json({
    message: "Products List",
    data: []
  });
}

function find(req, res, next) {
    res.json({
        message: "Product by ID",
        data: {}
  });
};

// UPDATE
function update(req, res, next) {
    res.json({
        message: "Product Updated",
        data: {}
    });
};

// DELETE
function destroy(req, res, next){
    res.json({
        message: "Product Deleted",
        data: {}
    });
};

module.exports =  {create, list, find, update, destroy};