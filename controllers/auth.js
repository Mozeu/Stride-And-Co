const {User} = require('../models/relationals');
const { verifyPassword } = require('../utils/password');
const jwt = require('jsonwebtoken');

const INVALID_CREDENTIALS = { message: 'Invalid credentials' }; 

function signToken(user) {
    const jwtUser = {
        expiresIn: '15m',
        issuer: 'stride-co',
        audience: 'stride-co-api',
        algorithm: 'HS256'
    };

    const secret = "05a2c1c1791fcfcd8451a7c84ae140d44950b22f";
    return jwt.sign({ sub: String(user.id), secret, jwtUser});    
}



async function login(req, res) {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if(!user || !user.active) return res.status(401).json(INVALID_CREDENTIALS);

    const valid = await verifyPassword(password, user.password_hash);
    if(!valid) return res.status(401).json(INVALID_CREDENTIALS);

    res.json({
        message: 'Login successful',
        data: {
            token: signToken(user),
            tokenType: "Bearer",
            expiresIn: "15m"
        }
    });
}

module.exports = { login };