const User = require('../models/relationals/User');

// CREATE
async function create(req, res, next) {
    const name = req.body.name;
    const lastName = req.body.lastName;
    const email = req.body.email;
    // aun faltan mas campos, se agregaran después

    const user = await User.create({
        first_name: name, 
        last_name: lastName, 
        email: email
    });

    res.status(201).json({
        message: "User Created", 
        data: user
    });
}

// READ
async function list (req, res, next) {
  const users = await User.findAll(); 

  res.json({
    message: "Users List",
    data: users
  });
}

async function find(req, res, next) {
    const id = req.params.id;
    const user = await User.findByPk(id);

    res.json({
        message: "User by ID",
        data: user
  });
};

// UPDATE
async function update(req, res, next) {
    const id = req.params.id;
    const user = await User.findByPk(id);
    if (!user) res.status(404).json({ message: 'User not found' });

    const name = req.body.name;
    const lastName = req.body.lastName;
    const email = req.body.email;
    
    let changes = {};
    changes.first_name = name ? name : user.first_name;
    changes.last_name = lastName ? lastName : user.last_name;
    changes.email = email ? email : user.email;

    await user.update(changes);

    res.json({
        message: "User Updated",
        data: user
    });
};

// DELETE
async function destroy(req, res, next){
    const id = req.params.id;
    const user = await User.findByPk(id);
    if (!user) res.status(404).json({ message: 'User not found' });

    await user.destroy();

    res.json({
        message: "User Deleted",
        data: user
    });
};

module.exports =  {create, list, find, update, destroy};