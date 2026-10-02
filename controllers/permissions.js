const Permissions = require('../models/relationals/Permissions');
// CREATE
async function create(req, res, next) {
    const key = req.body.key;
    const description = req.body.description;

    const permission = await Permissions.create({
        key: key, 
        description: description
    });

    res.status(201).json({
        message: "Permission Created", 
        data: permission
    });
}

// READ
async function list (req, res, next) {
  const permissions = await Permissions.findAll();
  res.json({
    message: "Permission List",
    data: permissions
  });
}

async function find(req, res, next) {
    const id = req.params.id;
    const permission = await Permissions.findByPk(id);
    res.json({
        message: "Permission by ID",
        data: permission
    });
};

// UPDATE
async function update(req, res, next) {
    const id = req.params.id;
    const permission = await Permissions.findByPk(id);
    if(!permission) res.status(404).json({ message: 'Permission not found' });
    const key = req.body.key;
    const description = req.body.description;
    
    let changes = {};
    changes.key = key ? key : permission.key;
    changes.description = description ? description : permission.description;
    await permission.update(changes);
    res.json({
        message: "Permission Updated",
        data: permission
    });
};

// DELETE
async function destroy(req, res, next){
    const id = req.params.id;
    const permission = await Permissions.findByPk(id);
    if(!permission) res.status(404).json({ message: 'Permission not found' });
    await permission.destroy();
    res.json({
        message: "Permission Deleted",
        data: permission
    });
};

module.exports =  {create, list, find, update, destroy};