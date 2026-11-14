// middleware que limita los campos del body cuando alguien edita un recurso con alcance "own".

function allowFields(allowedFields, getOwnerId) { // getOwnerId es de utils/checkOwnership que se pasa en routes
    return async function (req, res, next) {
        try {
            if (!req.user) return next(); // por seguridad, aunque authorize garantiza el usuario

            const ownerId = await getOwnerId(req);
            const editingOwn = ownerId !== null && ownerId !== undefined && Number(ownerId) === Number(req.user.id);
            if (!editingOwn) return next(); // Usuarios con alcance "any" puede mandar cualquier campo

            const forbidden = Object.keys(req.body || {}).filter((field) => !allowedFields.includes(field));

            if (forbidden.length > 0) {
                return res.status(403).json({ message: req.__('authorize.Forbidden') }); // Si se pasa un campo no permitido se detiene
            }
            next();
        } catch (error) {
            next(error);
        }
    };
}

module.exports = { allowFields };
