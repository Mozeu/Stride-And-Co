const { Customer } = require('../models/documents');

// CREATE
async function create(req, res, next) {
     const customer = await Customer.create(req.body);

    res.status(201).json({
        message: "Customer Created", 
        data: customer
    });
}

// READ
async function list (req, res, next) {
  const customers = await Customer.find();

  res.json({
    message: "Customers List",
    data: customers
  });
}

async function find(req, res, next) {
    const customer = await Customer.findById(req.params.id);
    if (!customer) res.status(404).json({ message: 'Customer not found' });

    res.json({
        message: "Customer by ID",
        data: customer
  });
};

// UPDATE
async function update(req, res, next) {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!customer) res.status(404).json({ message: 'Customer not found' });

    res.json({
        message: "Customer Updated",
        data: customer
    });
};

// DELETE
async function destroy(req, res, next){
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) res.status(404).json({ message: 'Customer not found' });

    res.json({
        message: "Customer Deleted",
        data: customer._id
    });
};

module.exports =  {create, list, find, update, destroy};