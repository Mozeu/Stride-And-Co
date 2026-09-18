// CREATE
function create(req, res, next) {
    res.status(201).json({
        message: "Role Created", 
        data: {}
    });
}

// READ
function list (req, res, next) {
  res.json({
    message: "Roles List",
    data: []
  });
}

function find(req, res, next) {
    res.json({
        message: "Role by ID",
        data: {}
  });
};

// UPDATE
function update(req, res, next) {
    res.json({
        message: "Role Updated",
        data: {}
    });
};

// DELETE
function destroy(req, res, next){
    res.json({
        message: "Role Deleted",
        data: {}
    });
};

module.exports =  {create, list, find, update, destroy};