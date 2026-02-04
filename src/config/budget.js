export const budgetByCategory = {
  Eat: { low: 10000, mid: 15000, high: 30000 },
  Drink: { low: 7000, mid: 16000, high: 24000 },
  Golf: { low: 10000, mid: 15000, high: 20000 },
  Transport: { low: 3000, mid: 6000, high: 10000 },
  Shopping: { low: 5000, mid: 8000, high: 10000 },
  Billing: { low: 4000, mid: 4000, high: 4000 },
  Others: { low: 3000, mid: 5000, high: 7000 },
  Etc: { low: 5000, mid: 12000, high: 20000 },
};

export const categoryOrder = Object.keys(budgetByCategory);
