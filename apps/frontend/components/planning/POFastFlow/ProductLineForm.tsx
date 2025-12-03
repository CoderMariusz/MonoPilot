/**
 * Product Line Form Component (Fast Flow)
 * Story 3.1: Purchase Order Creation - Fast Flow
 * AC-1.1: Progressive entry for PO lines
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Pencil, Trash2, ArrowRight } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export interface POLineInput {
  product_code: string
  quantity: number
  product_id?: string
  product_name?: string
  uom?: string
  unit_price?: number
  supplier_id?: string
  supplier_name?: string
  supplier_code?: string
}

interface Product {
  id: string
  code: string
  name: string
  uom: string
  unit_price?: number
  default_supplier_id?: string
  default_supplier_name?: string
  default_supplier_code?: string
}

interface ProductLineFormProps {
  lines: POLineInput[]
  onLinesChange: (lines: POLineInput[]) => void
  onNext: () => void
  warehouseId?: string
}

export function ProductLineForm({
  lines,
  onLinesChange,
  onNext,
  warehouseId
}: ProductLineFormProps) {
  const [productCode, setProductCode] = useState('')
  const [quantity, setQuantity] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [productInfo, setProductInfo] = useState<Product | null>(null)
  const [error, setError] = useState<string>('')
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const productCodeRef = useRef<HTMLInputElement>(null)
  const quantityRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Auto-focus product code input on mount
  useEffect(() => {
    productCodeRef.current?.focus()
  }, [])

  // Fetch product info on blur
  const handleProductCodeBlur = async () => {
    if (!productCode.trim()) {
      setProductInfo(null)
      setError('')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Fetch product by code
      const response = await fetch(
        `/api/technical/products?code=${encodeURIComponent(productCode.trim().toUpperCase())}&limit=1`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch product')
      }

      const data = await response.json()
      const products = data.data || data.products || []

      if (products.length === 0) {
        setError(`Product "${productCode}" not found`)
        setProductInfo(null)
        return
      }

      const product = products[0]

      // Fetch default supplier for this product
      const supplierResponse = await fetch(
        `/api/planning/suppliers/products?product_id=${product.id}&is_default=true`
      )

      let defaultSupplier = null
      if (supplierResponse.ok) {
        const supplierData = await supplierResponse.json()
        const assignments = supplierData.assignments || supplierData.supplier_products || []
        if (assignments.length > 0) {
          const sp = assignments[0]
          defaultSupplier = {
            id: sp.supplier_id,
            name: sp.suppliers?.name,
            code: sp.suppliers?.code,
            unit_price: sp.unit_price
          }
        }
      }

      setProductInfo({
        id: product.id,
        code: product.code,
        name: product.name,
        uom: product.uom,
        unit_price: defaultSupplier?.unit_price ?? product.cost_per_unit ?? 0,
        default_supplier_id: defaultSupplier?.id,
        default_supplier_name: defaultSupplier?.name,
        default_supplier_code: defaultSupplier?.code,
      })

      // Auto-focus quantity input after product is found
      quantityRef.current?.focus()
    } catch (err) {
      console.error('Error fetching product:', err)
      setError('Failed to fetch product information')
      setProductInfo(null)
    } finally {
      setLoading(false)
    }
  }

  // Handle add line
  const handleAddLine = () => {
    if (!productInfo) {
      setError('Please enter a valid product code')
      return
    }

    const qty = parseFloat(quantity)
    if (isNaN(qty) || qty <= 0) {
      setError('Quantity must be greater than 0')
      return
    }

    const newLine: POLineInput = {
      product_code: productInfo.code,
      quantity: qty,
      product_id: productInfo.id,
      product_name: productInfo.name,
      uom: productInfo.uom,
      unit_price: productInfo.unit_price,
      supplier_id: productInfo.default_supplier_id,
      supplier_name: productInfo.default_supplier_name,
      supplier_code: productInfo.default_supplier_code,
    }

    if (editingIndex !== null) {
      // Update existing line
      const updatedLines = [...lines]
      updatedLines[editingIndex] = newLine
      onLinesChange(updatedLines)
      setEditingIndex(null)
    } else {
      // Add new line
      onLinesChange([...lines, newLine])
    }

    // Reset form
    setProductCode('')
    setQuantity('')
    setProductInfo(null)
    setError('')
    productCodeRef.current?.focus()
  }

  // Handle edit line
  const handleEditLine = (index: number) => {
    const line = lines[index]
    setProductCode(line.product_code)
    setQuantity(line.quantity.toString())
    setProductInfo({
      id: line.product_id || '',
      code: line.product_code,
      name: line.product_name || '',
      uom: line.uom || '',
      unit_price: line.unit_price,
      default_supplier_id: line.supplier_id,
      default_supplier_name: line.supplier_name,
      default_supplier_code: line.supplier_code,
    })
    setEditingIndex(index)
    productCodeRef.current?.focus()
  }

  // Handle remove line
  const handleRemoveLine = (index: number) => {
    const updatedLines = lines.filter((_, i) => i !== index)
    onLinesChange(updatedLines)

    if (editingIndex === index) {
      setEditingIndex(null)
      setProductCode('')
      setQuantity('')
      setProductInfo(null)
    } else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex(editingIndex - 1)
    }
  }

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingIndex(null)
    setProductCode('')
    setQuantity('')
    setProductInfo(null)
    setError('')
    productCodeRef.current?.focus()
  }

  // Handle key press (Enter to add)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && productInfo && quantity) {
      e.preventDefault()
      handleAddLine()
    }
  }

  // Calculate totals
  const totalQuantity = lines.reduce((sum, line) => sum + line.quantity, 0)
  const totalLines = lines.length

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Product Code Input */}
          <div className="md:col-span-4 space-y-2">
            <Label htmlFor="product_code">Product Code</Label>
            <Input
              id="product_code"
              ref={productCodeRef}
              value={productCode}
              onChange={(e) => setProductCode(e.target.value.toUpperCase())}
              onBlur={handleProductCodeBlur}
              placeholder="e.g., PROD-001"
              disabled={loading}
              className="font-mono"
            />
            {productInfo && (
              <p className="text-sm text-green-600">
                {productInfo.name}
              </p>
            )}
          </div>

          {/* Quantity Input */}
          <div className="md:col-span-3 space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              ref={quantityRef}
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="0"
              min="0.01"
              step="0.01"
              disabled={!productInfo}
            />
            {productInfo?.uom && (
              <p className="text-sm text-gray-500">{productInfo.uom}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="md:col-span-5 flex gap-2">
            <Button
              onClick={handleAddLine}
              disabled={!productInfo || !quantity || loading}
              className="flex-1"
            >
              <Plus className="mr-2 h-4 w-4" />
              {editingIndex !== null ? 'Update' : 'Add'}
            </Button>
            {editingIndex !== null && (
              <Button variant="outline" onClick={handleCancelEdit}>
                Cancel
              </Button>
            )}
          </div>
        </div>

        {/* Supplier Info */}
        {productInfo?.default_supplier_name && (
          <p className="text-sm text-gray-500 mt-2">
            Default Supplier: {productInfo.default_supplier_code} - {productInfo.default_supplier_name}
          </p>
        )}

        {/* Error Message */}
        {error && (
          <p className="text-sm text-red-500 mt-2">{error}</p>
        )}
      </div>

      {/* Lines Table */}
      {lines.length > 0 && (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Product Code</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead>UoM</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-right w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((line, index) => (
                <TableRow
                  key={index}
                  className={editingIndex === index ? 'bg-yellow-50' : undefined}
                >
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell className="font-mono">{line.product_code}</TableCell>
                  <TableCell>{line.product_name}</TableCell>
                  <TableCell className="text-right">
                    {line.quantity.toLocaleString()}
                  </TableCell>
                  <TableCell>{line.uom}</TableCell>
                  <TableCell>
                    {line.supplier_code ? (
                      <span className="text-sm">
                        {line.supplier_code}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">No supplier</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditLine(index)}
                        disabled={editingIndex !== null && editingIndex !== index}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveLine(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Summary & Next Button */}
      <div className="flex items-center justify-between border-t pt-4">
        <div className="text-sm text-gray-600">
          {totalLines > 0 ? (
            <span>
              <strong>{totalQuantity.toLocaleString()}</strong> products in{' '}
              <strong>{totalLines}</strong> line{totalLines !== 1 ? 's' : ''}
            </span>
          ) : (
            <span>No lines added yet</span>
          )}
        </div>
        <Button
          onClick={onNext}
          disabled={lines.length === 0}
          size="lg"
        >
          Next
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
