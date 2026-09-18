// CREATE
function create(req, res, next) {
    res.status(201).json({
        message: "Variant Created", 
        data: {}
    });
}

// READ
function list (req, res, next) {
  res.json({
    message: "Variant List",
    data: []
  });
}

function find(req, res, next) {
    res.json({
        message: "Variant by ID",
        data: {}
  });
};

// UPDATE
function update(req, res, next) {
    res.json({
        message: "Variant Updated",
        data: {}
    });
};

// DELETE
function destroy(req, res, next){
    res.json({
        message: "Variant Deleted",
        data: {}
    });
};

module.exports =  {create, list, find, update, destroy};