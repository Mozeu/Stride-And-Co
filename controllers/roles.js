const Roles = require('../models/sql/Roles');
const Permission = require('../models/sql/Permissions');

// CREATE
async function create(req, res, next) {
    try {
        const role = await Roles.create(req.body);
        if(req.body.permissionIds) role.setPermissions(req.body.permissionIds);
        res.status(201).json({message: req.__("RolesList.RoleCreated"), data: role});
    } catch (error) {
        next(error);
    }
    /*
    const name = req.body.name;
    const description = req.body.description;

    const role = await Roles.create({
        name: name, 
        description: description
    });

    res.status(201).json({
        message: "Role Created", 
        data: role
    });
    */
}

// READ
async function list (req, res, next) {
  const roles = await Roles.findAll({include: {model: Permission, as:'permissions'}});
  res.json({
    message: req.__("RolesList.List"),
    data: roles
  });
}

async function find(req, res, next) {
    const role = await Roles.findByPk(req.params.id, {include: {model: Permission, as:'permissions'}});
    res.json({
        message: req.__("RolesList.RoleById"),
        data: role
    });
};

// UPDATE
async function update(req, res, next) {
    try{
        const role = await Roles.findByPk(req.params.id);
        if(req.body.permissionIds) role.setPermissions(req.body.permissionIds);
        if(!role) return res.status(404).json({ message: req.__("RolesList.RoleNotFound") });
        await role.update(req.body);
        if(req.body.permissionIds) role.setPermissions(req.body.permissionIds);
        res.json({message: req.__("RolesList.RoleUpdated"), data: role});
    }
    catch(error){
        next(error);
    }
    /*
    const id = req.params.id;
    const role = await Roles.findByPk(id);
    if(!role) res.status(404).json({ message: 'Role not found' });
    const name = req.body.name;
    const description = req.body.description;
    
    let changes = {};
    changes.name = name ? name : role.name;
    changes.description = description ? description : role.description;
    await role.update(changes);
    res.json({
        message: "Role Updated",
        data: role
    });
    */
};

// DELETE
async function destroy(req, res, next){
    const id = req.params.id;
    const role = await Roles.findByPk(id);
    if(!role) res.status(404).json({ message: req.__("RolesList.RoleNotFound") });
    await role.destroy();
    res.json({
        message: req.__("RolesList.RoleDeleted"),
        data: role
    });
};

module.exports =  {create, list, find, update, destroy};