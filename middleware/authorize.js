const { AccessControl } = require('accesscontrol');
const { Role, Permission } = require('../models/relationals');

let ac = null; // variable para la config. RBAC

// Lee Role, Role_Permission y Permission directo desde la Base de Datos
async function loadAccessControl() {
    const roles = await Role.findAll({
        include: [{ model: Permission, as: 'permissions', attributes: ['key'] }]
    });

    const grants = [];
    for (const role of roles) {
        for (const permission of role.permissions) {
            // 'orders:read:own' => resource ='orders', action ='read', possession='own'
            const [resource, action, possession] = permission.key.split(':');
            grants.push({
                role: role.name,
                resource: resource,
                action: action + ':' + possession,
                attributes: '*'
            });
        }
    }
    ac = new AccessControl(grants); // aqui cargamos la configuracion RBAC
}

// authorize('orders', 'read', 'own', getOwnerId)
function authorize(resource, action, possession, getOwnerId) {
    return async function (req, res, next) {
        try {
            if (!ac) await loadAccessControl();

            const roleName = req.user && req.user.role ? req.user.role.name : null;
            if (!roleName || !ac.hasRole(roleName)) {
                return res.status(403).json({ message: 'Forbidden' });
            }

            // can.readAny(resource), can.readOwn(resource), can.createAny(resource), etc.
            const can = ac.can(roleName);
            const hasAny = can[action + 'Any'](resource).granted;
            const hasOwn = can[action + 'Own'](resource).granted;

            // Si el rol tiene el permiso any, pasa
            if (hasAny) return next();

            // Si tiene own, el recurso debe ser del usuario
            if (possession === 'own' && hasOwn && getOwnerId) {
                const ownerId = await getOwnerId(req);
                if (ownerId !== null && ownerId !== undefined && Number(ownerId) === Number(req.user.id)) {
                    return next();
                }
            }
            return res.status(403).json({ message: 'Forbidden' });

        } catch (error) {
            return next(error);
        }
    };
}

module.exports = { authorize, loadAccessControl };