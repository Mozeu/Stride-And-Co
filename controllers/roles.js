const Roles = require('../models/sql/Roles');
const Permission = require('../models/sql/Permissions');

// CREATE
async function create(req, res, next) {
    try {
        const role = await Roles.create(req.body);
        if (req.body.permissionIds) await role.setPermissions(req.body.permissionIds);
        return res.status(201).json({ message: req.__("RolesList.RoleCreated"), data: role });
    } catch (error) {
        return next(error);
    }
}

// READ
async function list(req, res, next) {
    try {
        const roles = await Roles.findAll({ include: { model: Permission, as: 'permissions' } });
        return res.json({
            message: req.__("RolesList.List"),
            data: roles
        });
    } catch (error) {
        return next(error);
    }
}

async function find(req, res, next) {
    try {
        const role = await Roles.findByPk(req.params.id, { include: { model: Permission, as: 'permissions' } });
        if (!role) return res.status(404).json({ message: req.__("RolesList.RoleNotFound") });
        return res.json({
            message: req.__("RolesList.RoleById"),
            data: role
        });
    } catch (error) {
        return next(error);
    }
}

// UPDATE
async function update(req, res, next) {
    try {
        const role = await Roles.findByPk(req.params.id);
        if (!role) return res.status(404).json({ message: req.__("RolesList.RoleNotFound") });
        await role.update(req.body);
        if (req.body.permissionIds) await role.setPermissions(req.body.permissionIds);
        return res.json({ message: req.__("RolesList.RoleUpdated"), data: role });
    } catch (error) {
        return next(error);
    }
}

// DELETE
async function destroy(req, res, next) {
    try {
        const role = await Roles.findByPk(req.params.id);
        if (!role) return res.status(404).json({ message: req.__("RolesList.RoleNotFound") });
        await role.destroy();
        return res.json({
            message: req.__("RolesList.RoleDeleted"),
            data: role
        });
    } catch (error) {
        return next(error);
    }
}

module.exports = { create, list, find, update, destroy };
