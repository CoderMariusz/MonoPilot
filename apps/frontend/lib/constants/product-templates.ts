/**
 * Wizard Product Templates
 * Story: 01.14 - Wizard Steps Complete
 * Purpose: Industry-specific product templates for wizard step 4
 *
 * Industries:
 * - Bakery (4 templates)
 * - Dairy (4 templates)
 * - Meat Processing (4 templates)
 * - Beverages (4 templates)
 * - Snacks (4 templates)
 * - Other (4 templates)
 */

export interface ProductTemplate {
  id: string
  name: string
  prefill: {
    product_type: 'finished_good' | 'raw_material' | 'wip'
    uom: string
    shelf_life_days: number
    storage_temp: 'ambient' | 'chilled' | 'frozen'
  }
}

export interface IndustryConfig {
  id: string
  name: string
  icon: string
  templates: ProductTemplate[]
}

export const INDUSTRY_TEMPLATES: IndustryConfig[] = [
  {
    id: 'bakery',
    name: 'Bakery',
    icon: 'bread',
    templates: [
      {
        id: 'bread',
        name: 'Bread Loaf',
        prefill: {
          product_type: 'finished_good',
          uom: 'EA',
          shelf_life_days: 7,
          storage_temp: 'ambient',
        },
      },
      {
        id: 'pastry',
        name: 'Pastry',
        prefill: {
          product_type: 'finished_good',
          uom: 'EA',
          shelf_life_days: 3,
          storage_temp: 'chilled',
        },
      },
      {
        id: 'cookie',
        name: 'Cookie',
        prefill: {
          product_type: 'finished_good',
          uom: 'EA',
          shelf_life_days: 14,
          storage_temp: 'ambient',
        },
      },
      {
        id: 'cake',
        name: 'Cake',
        prefill: {
          product_type: 'finished_good',
          uom: 'EA',
          shelf_life_days: 5,
          storage_temp: 'chilled',
        },
      },
    ],
  },
  {
    id: 'dairy',
    name: 'Dairy',
    icon: 'milk',
    templates: [
      {
        id: 'milk',
        name: 'Milk',
        prefill: {
          product_type: 'finished_good',
          uom: 'L',
          shelf_life_days: 14,
          storage_temp: 'chilled',
        },
      },
      {
        id: 'cheese',
        name: 'Cheese',
        prefill: {
          product_type: 'finished_good',
          uom: 'KG',
          shelf_life_days: 90,
          storage_temp: 'chilled',
        },
      },
      {
        id: 'yogurt',
        name: 'Yogurt',
        prefill: {
          product_type: 'finished_good',
          uom: 'EA',
          shelf_life_days: 21,
          storage_temp: 'chilled',
        },
      },
      {
        id: 'butter',
        name: 'Butter',
        prefill: {
          product_type: 'finished_good',
          uom: 'KG',
          shelf_life_days: 60,
          storage_temp: 'chilled',
        },
      },
    ],
  },
  {
    id: 'meat',
    name: 'Meat Processing',
    icon: 'meat',
    templates: [
      {
        id: 'sausage',
        name: 'Sausage',
        prefill: {
          product_type: 'finished_good',
          uom: 'KG',
          shelf_life_days: 14,
          storage_temp: 'chilled',
        },
      },
      {
        id: 'ham',
        name: 'Ham',
        prefill: {
          product_type: 'finished_good',
          uom: 'KG',
          shelf_life_days: 21,
          storage_temp: 'chilled',
        },
      },
      {
        id: 'bacon',
        name: 'Bacon',
        prefill: {
          product_type: 'finished_good',
          uom: 'KG',
          shelf_life_days: 28,
          storage_temp: 'chilled',
        },
      },
      {
        id: 'deli',
        name: 'Deli Meat',
        prefill: {
          product_type: 'finished_good',
          uom: 'KG',
          shelf_life_days: 7,
          storage_temp: 'chilled',
        },
      },
    ],
  },
  {
    id: 'beverages',
    name: 'Beverages',
    icon: 'drink',
    templates: [
      {
        id: 'juice',
        name: 'Juice',
        prefill: {
          product_type: 'finished_good',
          uom: 'L',
          shelf_life_days: 30,
          storage_temp: 'chilled',
        },
      },
      {
        id: 'softdrink',
        name: 'Soft Drink',
        prefill: {
          product_type: 'finished_good',
          uom: 'L',
          shelf_life_days: 180,
          storage_temp: 'ambient',
        },
      },
      {
        id: 'water',
        name: 'Water',
        prefill: {
          product_type: 'finished_good',
          uom: 'L',
          shelf_life_days: 365,
          storage_temp: 'ambient',
        },
      },
      {
        id: 'energy',
        name: 'Energy Drink',
        prefill: {
          product_type: 'finished_good',
          uom: 'L',
          shelf_life_days: 365,
          storage_temp: 'ambient',
        },
      },
    ],
  },
  {
    id: 'snacks',
    name: 'Snacks',
    icon: 'cookie',
    templates: [
      {
        id: 'chips',
        name: 'Chips',
        prefill: {
          product_type: 'finished_good',
          uom: 'EA',
          shelf_life_days: 90,
          storage_temp: 'ambient',
        },
      },
      {
        id: 'crackers',
        name: 'Crackers',
        prefill: {
          product_type: 'finished_good',
          uom: 'EA',
          shelf_life_days: 180,
          storage_temp: 'ambient',
        },
      },
      {
        id: 'nuts',
        name: 'Nuts',
        prefill: {
          product_type: 'finished_good',
          uom: 'KG',
          shelf_life_days: 365,
          storage_temp: 'ambient',
        },
      },
      {
        id: 'candy',
        name: 'Candy',
        prefill: {
          product_type: 'finished_good',
          uom: 'EA',
          shelf_life_days: 365,
          storage_temp: 'ambient',
        },
      },
    ],
  },
  {
    id: 'other',
    name: 'Other',
    icon: 'package',
    templates: [
      {
        id: 'readymeal',
        name: 'Ready Meal',
        prefill: {
          product_type: 'finished_good',
          uom: 'EA',
          shelf_life_days: 5,
          storage_temp: 'chilled',
        },
      },
      {
        id: 'sauce',
        name: 'Sauce',
        prefill: {
          product_type: 'finished_good',
          uom: 'L',
          shelf_life_days: 180,
          storage_temp: 'ambient',
        },
      },
      {
        id: 'soup',
        name: 'Soup',
        prefill: {
          product_type: 'finished_good',
          uom: 'L',
          shelf_life_days: 14,
          storage_temp: 'chilled',
        },
      },
      {
        id: 'salad',
        name: 'Salad',
        prefill: {
          product_type: 'finished_good',
          uom: 'EA',
          shelf_life_days: 3,
          storage_temp: 'chilled',
        },
      },
    ],
  },
]
