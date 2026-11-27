const { log } = require('node:console');
const { sequelize, Product, Variant, Inventory } = require('../models/sql');
const categoryIds = require('../config/product-categories');

const color = 'Black';
const stockPerVariant = 10;

const shoes = [
  {
    category_id: categoryIds.shoes,
    sizes: ['38', '39', '40', '41', '42'],
    name: 'Stride V9 Runners',
    brand: 'Stride',
    price: 1899,
    description: 'Lightweight road running shoe with a breathable mesh upper and responsive foam cushioning.'
  },
  {
    category_id: categoryIds.shoes,
    sizes: ['38', '39', '40', '41', '42'],
    name: 'Apex Aerolift v1',
    brand: 'Apex Athletics',
    price: 3799,
    description: 'High-top basketball shoe with a carbon-fiber shank and a full-length air cushion for explosive jumps.'
  },
  {
    category_id: categoryIds.shoes,
    sizes: ['38', '39', '40', '41', '42'],
    name: 'Dynamo Blitz Court Pro',
    brand: 'Dynamo',
    price: 2999,
    description: 'Low-cut court shoe built for fast cuts, with a grippy herringbone outsole and ankle lockdown.'
  },
  {
    category_id: categoryIds.shoes,
    sizes: ['38', '39', '40', '41', '42'],
    name: 'Nova Kickstart FG',
    brand: 'Nova Sports',
    price: 2499,
    description: 'Firm-ground soccer cleat with a textured striking zone and a snug sock-style collar.'
  },
  {
    category_id: categoryIds.shoes,
    sizes: ['38', '39', '40', '41', '42'],
    name: 'Stride Trailblazer GTX 00',
    brand: 'Stride',
    price: 2799,
    description: 'Waterproof trail running shoe with aggressive lugs and a rock plate for rough terrain.'
  },
  {
    category_id: categoryIds.shoes,
    sizes: ['38', '39', '40', '41', '42'],
    name: 'Apex Gridlock Trainer',
    brand: 'Apex Athletics',
    price: 2199,
    description: 'Stable cross-training shoe for lifting, HIIT and gym sessions, with a flat, durable sole.'
  },
  {
    category_id: categoryIds.clothing,
    sizes: ['S', 'M', 'L', 'XL'],
    name: 'Stride Performance Tee',
    brand: 'Stride',
    price: 499,
    description: 'Lightweight training shirt with breathable fabric for everyday workouts.'
  },
  {
    category_id: categoryIds.clothing,
    sizes: ['S', 'M', 'L', 'XL'],
    name: 'Apex Training Shorts',
    brand: 'Apex Athletics',
    price: 699,
    description: 'Flexible training shorts with a comfortable fit for gym and outdoor sessions.'
  },
  {
    category_id: categoryIds.backpacks,
    sizes: ['OS'],
    name: 'Stride Explorer Backpack',
    brand: 'Stride',
    price: 1199,
    description: 'Everyday sports backpack with a roomy main compartment and practical pockets.'
  }
];

async function seedShoes() {
  try {
    let productsCreated = 0;
    let variantsCreated = 0;
    let inventoryCreated = 0;

    for (const shoe of shoes) {
      const { sizes, ...productData } = shoe;
      const [product, wasCreated] = await Product.findOrCreate({
        where: { name: productData.name },
        defaults: { ...productData, active: true }
      });
      if (wasCreated) productsCreated += 1;
      else if (product.category_id !== productData.category_id) {
        await product.update({ category_id: productData.category_id });
      }

      for (const size of sizes) {
        const sku = `STRIDE-SEED-${product.id}-${size}-BLACK`;
        const [variant, variantWasCreated] = await Variant.findOrCreate({
          where: { sku },
          defaults: {
            product_id: product.id,
            size,
            color,
            sku,
            active: true
          }
        });
        if (variantWasCreated) variantsCreated += 1;

        const [, stockWasCreated] = await Inventory.findOrCreate({
          where: { variant_id: variant.id },
          defaults: { stock: stockPerVariant, reserved: 0 }
        });
        if (stockWasCreated) inventoryCreated += 1;
      }
    }

    log(
      `Productos: ${productsCreated} creados, ${shoes.length - productsCreated} ya existían; ` +
      `variantes: ${variantsCreated} creadas; inventarios: ${inventoryCreated} creados ` +
      `(${stockPerVariant} unidades por variante nueva)`
    );
  } finally {
    await sequelize.close();
  }
}

seedShoes().catch((error) => {
  process.stderr.write(`${error}\n`);
  process.exitCode = 1;
});
