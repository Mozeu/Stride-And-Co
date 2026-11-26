const variants = require('./variants.service');

async function getCart(items) {
  const storeVariants = await variants.forStore();
  const byId = new Map(storeVariants.map(variant => [variant.id, variant]));
  const choices = storeVariants.filter(variant => variants.available(variant) > 0);
  const lines = items.map(item => {
    const variant = byId.get(item.variantId);
    const available = variants.available(variant);
    const unitCents = variant ? Math.round(Number(variant.product.price) * 100) : 0;
    return {
      ...item,
      variant,
      available,
      unitCents,
      totalCents: item.quantity <= available ? unitCents * item.quantity : 0
    };
  });
  const subtotalCents = lines.reduce((sum, line) => sum + line.totalCents, 0);
  return { choices, lines, subtotalCents };
}

async function getAvailability(variantId) {
  const [variant] = await variants.forStore([variantId]);
  return variant ? variants.available(variant) : null;
}

module.exports = { getCart, getAvailability };
