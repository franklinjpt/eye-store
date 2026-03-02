const CHECKOUT_FEES_CENTS = Object.freeze({
  base: 200000,
  delivery: 500000,
});

const CHECKOUT_FEES_PESOS = Object.freeze({
  base: CHECKOUT_FEES_CENTS.base / 100,
  delivery: CHECKOUT_FEES_CENTS.delivery / 100,
});

module.exports = {
  CHECKOUT_FEES_CENTS,
  CHECKOUT_FEES_PESOS,
};
