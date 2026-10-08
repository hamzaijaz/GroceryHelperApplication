// Mirrors the GroceryCategory enum in the API's swagger.json.
export const CATEGORIES = [
  'Dairy',
  'Fruit',
  'Vegetables',
  'Meat',
  'FrozenFood',
  'Snacks',
  'Drinks',
  'Baby',
  'PersonalCare',
  'Household',
  'CleaningSupplies',
  'PetCare',
  'Oils',
  'DryFruit',
];

// "FrozenFood" -> "Frozen Food"
export function categoryLabel(category) {
  return category.replace(/([a-z])([A-Z])/g, '$1 $2');
}
