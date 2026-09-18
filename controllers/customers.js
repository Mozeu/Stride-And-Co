// CREATE
function create(req, res, next) {
    res.status(201).json({
        message: "Customer Created", 
        data: {}
    });
}

// READ
function list (req, res, next) {
  res.json({
    message: "Customers List",
    data: []
  });
}

function find(req, res, next) {
    res.json({
        message: "Customer by ID",
        data: {}
  });
};

// UPDATE
function update(req, res, next) {
    res.json({
        message: "Customer Updated",
        data: {}
    });
};

// DELETE
function destroy(req, res, next){
    res.json({
        message: "Customer Deleted",
        data: {}
    });
};

module.exports =  {create, list, find, update, destroy};