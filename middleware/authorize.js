const createError = require('http-errors');
const { Role, Permission } = require('../models/sql');

let ac = null; // variable para la config. RBAC

// Lee Role, Role_Permission y Permission directo desde la Base de Datos
async function loadAccessControl() {
    const { AccessControl } = await import('accesscontrol');
    const roles = await Role.findAll({
        include: [{ model: Permission, as: 'permissions', attributes: ['key'] }]
    });

    const grants = [];
    for (const role of roles) {
        for (const permission of role.permissions) {
            // 'orders:read:own' => resource ='orders', action ='read', possession='own'
            const [resource, action, possession] = permission.key.split(':');
            if (!resource || !action || !possession) continue; // key mal formada se ignora

            grants.push({
                role: role.name,
                resource: resource,
                action: action + ':' + possession,
                attributes: '*'
            });
        }
    }

    // aqui cargamos la configuracion RBAC. Si no hay permisos, no se guarda y se reintenta en la siguiente peticion.
    ac = grants.length > 0 ? new AccessControl(grants) : null;
}

async function matchesOwner(req, getOwnerId) {
    const ownerId = await getOwnerId(req);
    return ownerId !== null && ownerId !== undefined && Number(ownerId) === Number(req.user.id);
}

// strictOwn uses the session's explicit grant. A route without getOwnerId must scope its queries.
function authorize(resource, action, possession, getOwnerId, { strictOwn = false } = {}) {
    return async function (req, res, next) {
        try {
            if (strictOwn) {
                const key = resource + ':' + action + ':own';
                const permissions = req.user?.role?.permissions;
                const granted = possession === 'own' && permissions?.some(permission => permission.key === key);
                if (granted && (!getOwnerId || await matchesOwner(req, getOwnerId))) return next();
                return next(createError(403));
            }

            if (!ac) await loadAccessControl();

            const roleName = req.user && req.user.role ? req.user.role.name : null;
            if (!roleName || !ac || !ac.hasRole(roleName)) {
                return res.status(403).json({ message: req.__("authorize.Forbidden") });
            }

            // can.readAny(resource), can.readOwn(resource), can.createAny(resource), etc.
            const can = ac.can(roleName);
            const hasAny = can[action + 'Any'](resource).granted;
            const hasOwn = can[action + 'Own'](resource).granted;

            // Si el rol tiene el permiso any, pasa
            if (hasAny) return next();

            // Si tiene own, el recurso debe ser del usuario
            if (possession === 'own' && hasOwn && getOwnerId) {
                if (await matchesOwner(req, getOwnerId)) return next();
            }
            return res.status(403).json({ message: req.__("authorize.Forbidden") });

        } catch (error) {
            return next(error);
        }
    };
}

module.exports = { authorize, loadAccessControl };
