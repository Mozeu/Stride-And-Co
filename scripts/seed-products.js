const { log } = require('node:console');
const { sequelize, Product } = require('../models/sql');

const shoes = [
  {
    name: 'Stride V9 Runners',
    brand: 'Stride',
    price: 1899,
    description: 'Lightweight road running shoe with a breathable mesh upper and responsive foam cushioning.'
  },
  {
    name: 'Apex Aerolift v1',
    brand: 'Apex Athletics',
    price: 3799,
    description: 'High-top basketball shoe with a carbon-fiber shank and a full-length air cushion for explosive jumps.'
  },
  {
    name: 'Dynamo Blitz Court Pro',
    brand: 'Dynamo',
    price: 2999,
    description: 'Low-cut court shoe built for fast cuts, with a grippy herringbone outsole and ankle lockdown.'
  },
  {
    name: 'Nova Kickstart FG',
    brand: 'Nova Sports',
    price: 2499,
    description: 'Firm-ground soccer cleat with a textured striking zone and a snug sock-style collar.'
  },
  {
    name: 'Stride Trailblazer GTX 00',
    brand: 'Stride',
    price: 2799,
    description: 'Waterproof trail running shoe with aggressive lugs and a rock plate for rough terrain.'
  },
  {
    name: 'Apex Gridlock Trainer',
    brand: 'Apex Athletics',
    price: 2199,
    description: 'Stable cross-training shoe for lifting, HIIT and gym sessions, with a flat, durable sole.'
  }
];

async function seedShoes() {
  try {
    let created = 0;

    for (const shoe of shoes) {
      const [, wasCreated] = await Product.findOrCreate({
        where: { name: shoe.name },
        defaults: { ...shoe, active: true }
      });
      if (wasCreated) created += 1;
    }

    log(`Zapatos: ${created} creados, ${shoes.length - created} ya existían`);
  } finally {
    await sequelize.close();
  }
}

seedShoes().catch((error) => {
  process.stderr.write(`${error}\n`);
  process.exitCode = 1;
});
