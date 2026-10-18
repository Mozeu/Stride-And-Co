const { User, Role, Permission } = require('../models/relationals');

async function authenticate(req, res, next) {
    try {
        const user = await User.findByPk(req.auth.sub, {
            attributes: { exclude: ['password_hash', 'salt_key'] },
            include: [{
                model: Role,
                as: 'role',
                include: [{
                    model: Permission,
                    as: 'permissions',
                    attributes: ['id', 'key']
                }]
            }]
        });

        if (!user || !user.active) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        req.user = user;
        next();
    } catch (error) {
        next(error);
    }
}

module.exports = authenticate;