import { z } from 'zod';

export const baseProductSchema = z.object({
  part_number: z.string().min(1, 'Item number is required'),
  description: z.string().min(1, 'Name is required'),
  uom: z.string().min(1, 'UoM is required'),
  std_price: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0;
  }, 'Price must be a number >= 0'),
  notes: z.string().optional(),
});

export const bomComponentSchema = z.object({
  product_id: z.number().min(1, 'Material is required'),
  quantity: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, 'Quantity must be a number > 0'),
  uom: z.string().min(1, 'UoM is required'),
});

export const meatProductSchema = baseProductSchema.extend({
  category: z.literal('MEAT'),
  type: z.literal('RM'),
  expiry_policy: z.enum(['DAYS_STATIC', 'FROM_MFG_DATE', 'FROM_DELIVERY_DATE']),
  shelf_life_days: z.string().optional().superRefine((val, ctx) => {
    if (!val) return;
    const num = parseFloat(val);
    if (isNaN(num) || num <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Shelf life must be a number > 0',
      });
    }
  }),
});

export const dryGoodsProductSchema = baseProductSchema.extend({
  category: z.literal('DRYGOODS'),
  type: z.literal('RM'),
  subtype: z.enum(['Lab', 'Flm', 'Ing', 'C'], { required_error: 'Subtype is required' }),
  expiry_policy: z.enum(['DAYS_STATIC', 'FROM_MFG_DATE', 'FROM_DELIVERY_DATE']),
  shelf_life_days: z.string().optional().superRefine((val, ctx) => {
    if (!val) return;
    const num = parseFloat(val);
    if (isNaN(num) || num <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Shelf life must be a number > 0',
      });
    }
  }),
});

export const finishedGoodsProductSchema = baseProductSchema.extend({
  category: z.literal('FINISHED_GOODS'),
  type: z.literal('FG'),
  bom_components: z.array(bomComponentSchema).min(1, 'At least one component is required'),
});

export const processProductSchema = baseProductSchema.extend({
  category: z.literal('PROCESS'),
  type: z.literal('WIP'),
  expiry_policy: z.literal('FROM_CREATION_DATE'),
  shelf_life_days: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, 'Shelf life must be a number > 0'),
  bom_components: z.array(bomComponentSchema).min(1, 'At least one component is required'),
});

export const productSchema = z.discriminatedUnion('category', [
  meatProductSchema,
  dryGoodsProductSchema,
  finishedGoodsProductSchema,
  processProductSchema,
]);

export type ProductFormData = z.infer<typeof productSchema>;
export type BomComponent = z.infer<typeof bomComponentSchema>;
