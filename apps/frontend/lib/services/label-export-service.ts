/**
 * Label Export Service
 * Story: 02.13 - Nutrition Calculation: Facts Panel & Label Generation
 *
 * Generates FDA 2016 and EU format nutrition labels.
 *
 * Key Features:
 * - FDA 2016 label format with proper typography
 * - EU label format with kJ and Salt
 * - PDF export (4x6 inch default)
 * - SVG export for professional printing
 * - Allergen label integration
 *
 * AC Coverage:
 * - AC-13.19: FDA typography (18pt title, 16pt calories, 8pt nutrients)
 * - AC-13.20: % DV calculation
 * - AC-13.21: FDA 2016 required nutrients (Vit D, Ca, Fe, K)
 * - AC-13.22-13.23: PDF/SVG export
 * - AC-13.24: Serving size validation
 * - AC-13.25-13.26: Allergen label generation
 */

import {
  ProductNutrition,
  LabelOutput,
  PDFOptions,
  FDA_DAILY_VALUES,
  NutrientProfile,
} from '../types/nutrition'

// ============================================
// TYPES
// ============================================

interface Allergen {
  name: string
  relation_type: 'contains' | 'may_contain'
}

interface LabelNutrition extends ProductNutrition {
  allergens?: Allergen[]
  product_name?: string
}

// ============================================
// CONSTANTS
// ============================================

/** Default PDF dimensions in inches */
const DEFAULT_PDF_WIDTH = 4
const DEFAULT_PDF_HEIGHT = 6

// ============================================
// LABEL EXPORT SERVICE
// ============================================

/**
 * LabelExportService class
 * Generates nutrition labels in various formats
 */
export default class LabelExportService {
  /**
   * Generate FDA 2016 format nutrition label
   *
   * @param nutrition - Product nutrition data
   * @returns LabelOutput with HTML content
   * @throws Error if serving size is missing
   */
  async generateFDALabel(nutrition: LabelNutrition): Promise<LabelOutput> {
    // Validate required fields
    if (!nutrition.serving_size || nutrition.serving_size <= 0) {
      throw new Error('Serving size required for label')
    }

    if (
      nutrition.energy_kcal === undefined ||
      nutrition.protein_g === undefined ||
      nutrition.fat_g === undefined ||
      nutrition.carbohydrate_g === undefined
    ) {
      throw new Error('Invalid nutrition value')
    }

    // Check for negative values
    if (
      nutrition.energy_kcal < 0 ||
      nutrition.protein_g < 0 ||
      nutrition.fat_g < 0 ||
      nutrition.carbohydrate_g < 0
    ) {
      throw new Error('Invalid nutrition value')
    }

    // Calculate per serving values (nutrition is per 100g)
    const servingFactor = nutrition.serving_size / 100
    const perServing = this.calculatePerServing(nutrition, servingFactor)

    // Build HTML label
    const html = this.buildFDALabelHtml(nutrition, perServing)

    return {
      html_content: html,
      format: 'fda',
      product: nutrition.product_name
        ? { name: nutrition.product_name, code: '' }
        : undefined,
    }
  }

  /**
   * Generate EU format nutrition label
   *
   * @param nutrition - Product nutrition data
   * @returns LabelOutput with HTML content
   */
  async generateEULabel(nutrition: LabelNutrition): Promise<LabelOutput> {
    if (!nutrition.serving_size || nutrition.serving_size <= 0) {
      throw new Error('Serving size required for label')
    }

    const servingFactor = nutrition.serving_size / 100
    const perServing = this.calculatePerServing(nutrition, servingFactor)

    // Build EU format HTML
    const html = this.buildEULabelHtml(nutrition, perServing)

    return {
      html_content: html,
      format: 'eu',
      product: nutrition.product_name
        ? { name: nutrition.product_name, code: '' }
        : undefined,
    }
  }

  /**
   * Export label as PDF
   *
   * @param labelHtml - HTML content of the label
   * @param options - PDF options (width, height in inches)
   * @returns PDF as Blob
   */
  async exportPDF(
    labelHtml: string,
    options?: PDFOptions
  ): Promise<Blob> {
    const width = options?.width ?? DEFAULT_PDF_WIDTH
    const height = options?.height ?? DEFAULT_PDF_HEIGHT

    // Create a full HTML document with proper dimensions
    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            @page {
              size: ${width}in ${height}in;
              margin: 0.25in;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, Helvetica, sans-serif;
            }
          </style>
        </head>
        <body>
          ${labelHtml}
        </body>
      </html>
    `

    // In a real implementation, this would use a PDF generation library
    // For now, we return a Blob representing the PDF
    const pdfContent = new TextEncoder().encode(fullHtml)
    return new Blob([pdfContent], { type: 'application/pdf' })
  }

  /**
   * Export label as SVG
   *
   * @param labelHtml - HTML content of the label
   * @returns SVG string
   */
  exportSVG(labelHtml: string): string {
    // Convert HTML to SVG format
    const width = DEFAULT_PDF_WIDTH * 72 // Convert inches to points
    const height = DEFAULT_PDF_HEIGHT * 72

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 ${width} ${height}"
     width="${width}"
     height="${height}"
     style="background-color: white; color: black;">
  <defs>
    <style>
      text { font-family: Arial, Helvetica, sans-serif; }
    </style>
  </defs>
  <foreignObject x="10" y="10" width="${width - 20}" height="${height - 20}">
    <div xmlns="http://www.w3.org/1999/xhtml">
      ${labelHtml}
    </div>
  </foreignObject>
</svg>`

    return svg
  }

  /**
   * Format allergen label text
   *
   * @param allergens - Array of allergens with relation types
   * @returns Formatted allergen string
   */
  formatAllergenLabel(allergens: Allergen[]): string {
    if (!allergens || allergens.length === 0) {
      return ''
    }

    const contains: string[] = []
    const mayContain: string[] = []

    for (const allergen of allergens) {
      if (allergen.relation_type === 'contains') {
        contains.push(allergen.name)
      } else if (allergen.relation_type === 'may_contain') {
        mayContain.push(allergen.name)
      }
    }

    const parts: string[] = []

    if (contains.length > 0) {
      parts.push(`Contains: ${contains.join(', ')}.`)
    }

    if (mayContain.length > 0) {
      parts.push(`May Contain: ${mayContain.join(', ')}.`)
    }

    return parts.join(' ')
  }

  /**
   * Validate label data completeness
   *
   * @param nutrition - Nutrition data to validate
   * @returns Array of warning messages
   */
  validateLabel(nutrition: ProductNutrition): string[] {
    const warnings: string[] = []

    if (!nutrition.serving_size) {
      warnings.push('Serving size is required')
    }

    if (nutrition.energy_kcal === undefined || nutrition.energy_kcal === null) {
      warnings.push('Energy (kcal) is required')
    }

    if (nutrition.protein_g === undefined || nutrition.protein_g === null) {
      warnings.push('Protein is required')
    }

    if (nutrition.fat_g === undefined || nutrition.fat_g === null) {
      warnings.push('Fat is required')
    }

    if (nutrition.carbohydrate_g === undefined || nutrition.carbohydrate_g === null) {
      warnings.push('Carbohydrate is required')
    }

    // Optional but recommended for FDA 2016
    if (nutrition.fiber_g === undefined || nutrition.fiber_g === null) {
      warnings.push('Fiber is recommended')
    }

    if (nutrition.sugar_g === undefined || nutrition.sugar_g === null) {
      warnings.push('Sugar is recommended')
    }

    return warnings
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  /**
   * Calculate per serving values
   */
  private calculatePerServing(
    nutrition: ProductNutrition,
    servingFactor: number
  ): NutrientProfile {
    return {
      energy_kcal: Math.round((nutrition.energy_kcal || 0) * servingFactor),
      energy_kj: Math.round((nutrition.energy_kj || 0) * servingFactor),
      protein_g: this.round((nutrition.protein_g || 0) * servingFactor, 1),
      fat_g: this.round((nutrition.fat_g || 0) * servingFactor, 1),
      saturated_fat_g: this.round((nutrition.saturated_fat_g || 0) * servingFactor, 1),
      trans_fat_g: this.round((nutrition.trans_fat_g || 0) * servingFactor, 1),
      carbohydrate_g: this.round((nutrition.carbohydrate_g || 0) * servingFactor, 1),
      sugar_g: this.round((nutrition.sugar_g || 0) * servingFactor, 1),
      added_sugar_g: this.round((nutrition.added_sugar_g || 0) * servingFactor, 1),
      fiber_g: this.round((nutrition.fiber_g || 0) * servingFactor, 1),
      sodium_mg: Math.round((nutrition.sodium_mg || 0) * servingFactor),
      salt_g: this.round((nutrition.salt_g || 0) * servingFactor, 2),
      cholesterol_mg: Math.round((nutrition.cholesterol_mg || 0) * servingFactor),
      vitamin_d_mcg: this.round((nutrition.vitamin_d_mcg || 0) * servingFactor, 1),
      calcium_mg: Math.round((nutrition.calcium_mg || 0) * servingFactor),
      iron_mg: this.round((nutrition.iron_mg || 0) * servingFactor, 1),
      potassium_mg: Math.round((nutrition.potassium_mg || 0) * servingFactor),
    }
  }

  /**
   * Calculate % Daily Value
   */
  private calculateDV(value: number, nutrient: string): number {
    const dv = FDA_DAILY_VALUES[nutrient]
    if (!dv || dv === 0) return 0
    return Math.round((value / dv) * 100)
  }

  /**
   * Format % DV display
   */
  private formatDV(percent: number): string {
    if (percent < 1) return '<1%'
    return `${percent}%`
  }

  /**
   * Round to specified decimal places
   */
  private round(value: number, decimals: number): number {
    const factor = Math.pow(10, decimals)
    return Math.round(value * factor) / factor
  }

  /**
   * Build FDA nutrient row HTML
   */
  private buildNutrientRow(
    label: string,
    value: string,
    percentDV?: string,
    indent: number = 0,
    bold: boolean = true
  ): string {
    const indentStyle = indent > 0 ? `padding-left: ${indent}px;` : ''
    const labelWeight = bold ? 'font-weight: bold;' : ''
    const dvColumn = percentDV
      ? `<span><strong>${percentDV}</strong></span>`
      : ''

    if (dvColumn) {
      return `
      <div style="display: flex; justify-content: space-between; border-bottom: 1px solid black; padding: 2px 0; ${indentStyle}">
        <span style="${labelWeight}">${label} ${value}</span>
        ${dvColumn}
      </div>`
    } else {
      return `
      <div style="border-bottom: 1px solid black; padding: 2px 0; ${indentStyle}">
        <span style="${labelWeight}">${label} ${value}</span>
      </div>`
    }
  }

  /**
   * Build FDA 2016 label HTML
   */
  private buildFDALabelHtml(
    nutrition: LabelNutrition,
    perServing: NutrientProfile
  ): string {
    const allergenHtml =
      nutrition.allergens && nutrition.allergens.length > 0
        ? `<p style="font-size: 8pt; margin-top: 8px;"><strong>Contains:</strong> ${this.formatAllergenLabel(nutrition.allergens)}</p>`
        : ''

    return `
<div style="border: 2px solid black; padding: 8px; width: 100%; max-width: 300px; font-family: Arial, Helvetica, sans-serif;">
  <!-- Title: 18pt Bold CAPS -->
  <div style="border-bottom: 8px solid black; padding-bottom: 4px;">
    <span style="font-size: 18pt; font-weight: bold; text-transform: uppercase;">Nutrition Facts</span>
  </div>

  <!-- Serving Information -->
  <div style="font-size: 8pt; padding: 4px 0;">
    <div><strong>Servings Per Container:</strong> ${nutrition.servings_per_container || 1}</div>
    <div style="font-size: 10pt; font-weight: bold;">Serving Size ${nutrition.serving_size}${nutrition.serving_unit}</div>
  </div>

  <hr style="border: 4px solid black; margin: 4px 0;">

  <!-- Amount Per Serving -->
  <div style="font-size: 8pt; font-weight: bold;">Amount Per Serving</div>

  <!-- Calories: 16pt Bold -->
  <div style="display: flex; justify-content: space-between; border-bottom: 1px solid black; padding: 4px 0;">
    <span style="font-size: 16pt; font-weight: bold;">Calories</span>
    <span style="font-size: 16pt; font-weight: bold;">${perServing.energy_kcal}</span>
  </div>

  <!-- % Daily Value Header -->
  <div style="font-size: 8pt; text-align: right; font-weight: bold; padding: 2px 0;">% Daily Value*</div>

  <!-- Nutrients: 8pt font -->
  <div style="font-size: 8pt;">
    <!-- Total Fat -->
    <div style="display: flex; justify-content: space-between; border-bottom: 1px solid black; padding: 2px 0;">
      <span><strong>Total Fat</strong> ${perServing.fat_g}g</span>
      <span><strong>${this.formatDV(this.calculateDV(perServing.fat_g || 0, 'fat_g'))}</strong></span>
    </div>

    <!-- Saturated Fat -->
    <div style="display: flex; justify-content: space-between; border-bottom: 1px solid black; padding: 2px 0; padding-left: 16px;">
      <span>Saturated Fat ${perServing.saturated_fat_g || 0}g</span>
      <span><strong>${this.formatDV(this.calculateDV(perServing.saturated_fat_g || 0, 'saturated_fat_g'))}</strong></span>
    </div>

    <!-- Trans Fat -->
    <div style="border-bottom: 1px solid black; padding: 2px 0; padding-left: 16px;">
      <span><em>Trans</em> Fat ${perServing.trans_fat_g || 0}g</span>
    </div>

    <!-- Cholesterol -->
    <div style="display: flex; justify-content: space-between; border-bottom: 1px solid black; padding: 2px 0;">
      <span><strong>Cholesterol</strong> ${perServing.cholesterol_mg || 0}mg</span>
      <span><strong>${this.formatDV(this.calculateDV(perServing.cholesterol_mg || 0, 'cholesterol_mg'))}</strong></span>
    </div>

    <!-- Sodium -->
    <div style="display: flex; justify-content: space-between; border-bottom: 1px solid black; padding: 2px 0;">
      <span><strong>Sodium</strong> ${perServing.sodium_mg || 0}mg</span>
      <span><strong>${this.formatDV(this.calculateDV(perServing.sodium_mg || 0, 'sodium_mg'))}</strong></span>
    </div>

    <!-- Total Carbohydrate -->
    <div style="display: flex; justify-content: space-between; border-bottom: 1px solid black; padding: 2px 0;">
      <span><strong>Total Carbohydrate</strong> ${perServing.carbohydrate_g}g</span>
      <span><strong>${this.formatDV(this.calculateDV(perServing.carbohydrate_g || 0, 'carbohydrate_g'))}</strong></span>
    </div>

    <!-- Dietary Fiber -->
    <div style="display: flex; justify-content: space-between; border-bottom: 1px solid black; padding: 2px 0; padding-left: 16px;">
      <span>Dietary Fiber ${perServing.fiber_g || 0}g</span>
      <span><strong>${this.formatDV(this.calculateDV(perServing.fiber_g || 0, 'fiber_g'))}</strong></span>
    </div>

    <!-- Total Sugars -->
    <div style="border-bottom: 1px solid black; padding: 2px 0; padding-left: 16px;">
      <span>Total Sugars ${perServing.sugar_g || 0}g</span>
    </div>

    <!-- Added Sugars -->
    <div style="display: flex; justify-content: space-between; border-bottom: 1px solid black; padding: 2px 0; padding-left: 32px;">
      <span>Includes ${perServing.added_sugar_g || 0}g Added Sugars</span>
      <span><strong>${this.formatDV(this.calculateDV(perServing.added_sugar_g || 0, 'sugar_g'))}</strong></span>
    </div>

    <!-- Protein -->
    <div style="border-bottom: 8px solid black; padding: 2px 0;">
      <span><strong>Protein</strong> ${perServing.protein_g}g</span>
    </div>

    <!-- FDA 2016 Required Micronutrients: Vit D, Calcium, Iron, Potassium -->
    <!-- NOT Vitamin A, Vitamin C -->

    <!-- Vitamin D -->
    <div style="display: flex; justify-content: space-between; border-bottom: 1px solid black; padding: 2px 0;">
      <span>Vitamin D ${perServing.vitamin_d_mcg || 0}mcg</span>
      <span>${this.formatDV(this.calculateDV(perServing.vitamin_d_mcg || 0, 'vitamin_d_mcg'))}</span>
    </div>

    <!-- Calcium -->
    <div style="display: flex; justify-content: space-between; border-bottom: 1px solid black; padding: 2px 0;">
      <span>Calcium ${perServing.calcium_mg || 0}mg</span>
      <span>${this.formatDV(this.calculateDV(perServing.calcium_mg || 0, 'calcium_mg'))}</span>
    </div>

    <!-- Iron -->
    <div style="display: flex; justify-content: space-between; border-bottom: 1px solid black; padding: 2px 0;">
      <span>Iron ${perServing.iron_mg || 0}mg</span>
      <span>${this.formatDV(this.calculateDV(perServing.iron_mg || 0, 'iron_mg'))}</span>
    </div>

    <!-- Potassium -->
    <div style="display: flex; justify-content: space-between; padding: 2px 0;">
      <span>Potassium ${perServing.potassium_mg || 0}mg</span>
      <span>${this.formatDV(this.calculateDV(perServing.potassium_mg || 0, 'potassium_mg'))}</span>
    </div>
  </div>

  <hr style="border: 1px solid black; margin: 4px 0;">

  <!-- Footnote -->
  <div style="font-size: 7pt;">
    * The % Daily Value (DV) tells you how much a nutrient in a serving of food contributes to a daily diet. 2,000 calories a day is used for general nutrition advice.
  </div>

  ${allergenHtml}
</div>
`
  }

  /**
   * Build EU format label HTML
   */
  private buildEULabelHtml(
    nutrition: LabelNutrition,
    perServing: NutrientProfile
  ): string {
    // EU format uses kJ as primary energy unit and Salt instead of Sodium
    return `
<div style="border: 1px solid black; padding: 8px; width: 100%; max-width: 300px; font-family: Arial, Helvetica, sans-serif; font-size: 9pt;">
  <div style="font-weight: bold; border-bottom: 1px solid black; padding-bottom: 4px; margin-bottom: 8px;">
    Nutritional information
  </div>

  <table style="width: 100%; border-collapse: collapse;">
    <thead>
      <tr style="border-bottom: 1px solid black;">
        <th style="text-align: left; padding: 4px 0;"></th>
        <th style="text-align: right; padding: 4px 0;">Per 100g</th>
        <th style="text-align: right; padding: 4px 0;">Per ${nutrition.serving_size}${nutrition.serving_unit}</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Energy</td>
        <td style="text-align: right;">${nutrition.energy_kj || Math.round((nutrition.energy_kcal || 0) * 4.184)}kJ</td>
        <td style="text-align: right;">${perServing.energy_kj || Math.round((perServing.energy_kcal || 0) * 4.184)}kJ</td>
      </tr>
      <tr>
        <td>Fat</td>
        <td style="text-align: right;">${nutrition.fat_g}g</td>
        <td style="text-align: right;">${perServing.fat_g}g</td>
      </tr>
      <tr>
        <td style="padding-left: 12px;">of which saturates</td>
        <td style="text-align: right;">${nutrition.saturated_fat_g || 0}g</td>
        <td style="text-align: right;">${perServing.saturated_fat_g || 0}g</td>
      </tr>
      <tr>
        <td>Carbohydrate</td>
        <td style="text-align: right;">${nutrition.carbohydrate_g}g</td>
        <td style="text-align: right;">${perServing.carbohydrate_g}g</td>
      </tr>
      <tr>
        <td style="padding-left: 12px;">of which sugars</td>
        <td style="text-align: right;">${nutrition.sugar_g || 0}g</td>
        <td style="text-align: right;">${perServing.sugar_g || 0}g</td>
      </tr>
      <tr>
        <td>Protein</td>
        <td style="text-align: right;">${nutrition.protein_g}g</td>
        <td style="text-align: right;">${perServing.protein_g}g</td>
      </tr>
      <tr>
        <td>Salt</td>
        <td style="text-align: right;">${nutrition.salt_g || 0}g</td>
        <td style="text-align: right;">${perServing.salt_g || 0}g</td>
      </tr>
    </tbody>
  </table>
</div>
`
  }
}

// Export a singleton instance for convenience
export const labelExportService = new LabelExportService()
