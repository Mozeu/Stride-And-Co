// CREATE
function create(req, res, next) {
    res.status(201).json({
        message: "Permission Created", 
        data: {}
    });
}

// READ
function list (req, res, next) {
  res.json({
    message: "Permission List",
    data: []
  });
}

function find(req, res, next) {
    res.json({
        message: "Permission by ID",
        data: {}
  });
};

// UPDATE
function update(req, res, next) {
    res.json({
        message: "Permission Updated",
        data: {}
    });
};

// DELETE
function destroy(req, res, next){
    res.json({
        message: "Permission Deleted",
        data: {}
    });
};

module.exports =  {create, list, find, update, destroy};