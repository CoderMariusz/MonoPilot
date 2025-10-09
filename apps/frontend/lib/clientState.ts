'use client';

import { useState, useEffect } from 'react';
import type { WorkOrder, PurchaseOrder, TransferOrder, Product } from './types';
import { 
  mockWorkOrders, 
  mockPurchaseOrders, 
  mockTransferOrders, 
  mockProducts 
} from './mockData';

type Listener = () => void;

class ClientState {
  private workOrders: WorkOrder[] = [...mockWorkOrders];
  private purchaseOrders: PurchaseOrder[] = [...mockPurchaseOrders];
  private transferOrders: TransferOrder[] = [...mockTransferOrders];
  private products: Product[] = [...mockProducts];
  
  private workOrderListeners: Listener[] = [];
  private purchaseOrderListeners: Listener[] = [];
  private transferOrderListeners: Listener[] = [];
  private productListeners: Listener[] = [];

  getWorkOrders(): WorkOrder[] {
    return [...this.workOrders];
  }

  getPurchaseOrders(): PurchaseOrder[] {
    return [...this.purchaseOrders];
  }

  getTransferOrders(): TransferOrder[] {
    return [...this.transferOrders];
  }

  getProducts(): Product[] {
    return [...this.products];
  }

  subscribeToWorkOrders(listener: Listener): () => void {
    this.workOrderListeners.push(listener);
    return () => {
      this.workOrderListeners = this.workOrderListeners.filter(l => l !== listener);
    };
  }

  subscribeToPurchaseOrders(listener: Listener): () => void {
    this.purchaseOrderListeners.push(listener);
    return () => {
      this.purchaseOrderListeners = this.purchaseOrderListeners.filter(l => l !== listener);
    };
  }

  subscribeToTransferOrders(listener: Listener): () => void {
    this.transferOrderListeners.push(listener);
    return () => {
      this.transferOrderListeners = this.transferOrderListeners.filter(l => l !== listener);
    };
  }

  subscribeToProducts(listener: Listener): () => void {
    this.productListeners.push(listener);
    return () => {
      this.productListeners = this.productListeners.filter(l => l !== listener);
    };
  }

  private notifyWorkOrderListeners() {
    this.workOrderListeners.forEach(listener => listener());
  }

  private notifyPurchaseOrderListeners() {
    this.purchaseOrderListeners.forEach(listener => listener());
  }

  private notifyTransferOrderListeners() {
    this.transferOrderListeners.forEach(listener => listener());
  }

  private notifyProductListeners() {
    this.productListeners.forEach(listener => listener());
  }

  addWorkOrder(workOrder: Omit<WorkOrder, 'id' | 'created_at' | 'updated_at'>): WorkOrder {
    const newWorkOrder: WorkOrder = {
      ...workOrder,
      id: Math.max(...this.workOrders.map(wo => wo.id), 0) + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.workOrders = [...this.workOrders, newWorkOrder];
    this.notifyWorkOrderListeners();
    return newWorkOrder;
  }

  updateWorkOrder(id: number, updates: Partial<WorkOrder>): WorkOrder | null {
    const index = this.workOrders.findIndex(wo => wo.id === id);
    if (index === -1) return null;

    const updatedWorkOrder: WorkOrder = {
      ...this.workOrders[index],
      ...updates,
      id: this.workOrders[index].id,
      updated_at: new Date().toISOString(),
    };
    
    this.workOrders = [
      ...this.workOrders.slice(0, index),
      updatedWorkOrder,
      ...this.workOrders.slice(index + 1),
    ];
    
    this.notifyWorkOrderListeners();
    return updatedWorkOrder;
  }

  deleteWorkOrder(id: number): boolean {
    const initialLength = this.workOrders.length;
    this.workOrders = this.workOrders.filter(wo => wo.id !== id);
    if (this.workOrders.length < initialLength) {
      this.notifyWorkOrderListeners();
      return true;
    }
    return false;
  }

  addPurchaseOrder(purchaseOrder: Omit<PurchaseOrder, 'id' | 'created_at' | 'updated_at'>): PurchaseOrder {
    const newPurchaseOrder: PurchaseOrder = {
      ...purchaseOrder,
      id: Math.max(...this.purchaseOrders.map(po => po.id), 0) + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.purchaseOrders = [...this.purchaseOrders, newPurchaseOrder];
    this.notifyPurchaseOrderListeners();
    return newPurchaseOrder;
  }

  updatePurchaseOrder(id: number, updates: Partial<PurchaseOrder>): PurchaseOrder | null {
    const index = this.purchaseOrders.findIndex(po => po.id === id);
    if (index === -1) return null;

    const updatedPurchaseOrder: PurchaseOrder = {
      ...this.purchaseOrders[index],
      ...updates,
      id: this.purchaseOrders[index].id,
      updated_at: new Date().toISOString(),
    };
    
    this.purchaseOrders = [
      ...this.purchaseOrders.slice(0, index),
      updatedPurchaseOrder,
      ...this.purchaseOrders.slice(index + 1),
    ];
    
    this.notifyPurchaseOrderListeners();
    return updatedPurchaseOrder;
  }

  deletePurchaseOrder(id: number): boolean {
    const initialLength = this.purchaseOrders.length;
    this.purchaseOrders = this.purchaseOrders.filter(po => po.id !== id);
    if (this.purchaseOrders.length < initialLength) {
      this.notifyPurchaseOrderListeners();
      return true;
    }
    return false;
  }

  addTransferOrder(transferOrder: Omit<TransferOrder, 'id' | 'created_at' | 'updated_at'>): TransferOrder {
    const newTransferOrder: TransferOrder = {
      ...transferOrder,
      id: Math.max(...this.transferOrders.map(to => to.id), 0) + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.transferOrders = [...this.transferOrders, newTransferOrder];
    this.notifyTransferOrderListeners();
    return newTransferOrder;
  }

  updateTransferOrder(id: number, updates: Partial<TransferOrder>): TransferOrder | null {
    const index = this.transferOrders.findIndex(to => to.id === id);
    if (index === -1) return null;

    const updatedTransferOrder: TransferOrder = {
      ...this.transferOrders[index],
      ...updates,
      id: this.transferOrders[index].id,
      updated_at: new Date().toISOString(),
    };
    
    this.transferOrders = [
      ...this.transferOrders.slice(0, index),
      updatedTransferOrder,
      ...this.transferOrders.slice(index + 1),
    ];
    
    this.notifyTransferOrderListeners();
    return updatedTransferOrder;
  }

  deleteTransferOrder(id: number): boolean {
    const initialLength = this.transferOrders.length;
    this.transferOrders = this.transferOrders.filter(to => to.id !== id);
    if (this.transferOrders.length < initialLength) {
      this.notifyTransferOrderListeners();
      return true;
    }
    return false;
  }

  addProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Product {
    const newProduct: Product = {
      ...product,
      id: Math.max(...this.products.map(p => p.id), 0) + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.products = [...this.products, newProduct];
    this.notifyProductListeners();
    return newProduct;
  }

  updateProduct(id: number, updates: Partial<Product>): Product | null {
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) return null;

    const updatedProduct: Product = {
      ...this.products[index],
      ...updates,
      id: this.products[index].id,
      updated_at: new Date().toISOString(),
    };
    
    this.products = [
      ...this.products.slice(0, index),
      updatedProduct,
      ...this.products.slice(index + 1),
    ];
    
    this.notifyProductListeners();
    return updatedProduct;
  }

  deleteProduct(id: number): boolean {
    const initialLength = this.products.length;
    this.products = this.products.filter(p => p.id !== id);
    if (this.products.length < initialLength) {
      this.notifyProductListeners();
      return true;
    }
    return false;
  }
}

const clientState = new ClientState();

export function useWorkOrders() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(clientState.getWorkOrders());

  useEffect(() => {
    const unsubscribe = clientState.subscribeToWorkOrders(() => {
      setWorkOrders(clientState.getWorkOrders());
    });
    return unsubscribe;
  }, []);

  return workOrders;
}

export function usePurchaseOrders() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(clientState.getPurchaseOrders());

  useEffect(() => {
    const unsubscribe = clientState.subscribeToPurchaseOrders(() => {
      setPurchaseOrders(clientState.getPurchaseOrders());
    });
    return unsubscribe;
  }, []);

  return purchaseOrders;
}

export function useTransferOrders() {
  const [transferOrders, setTransferOrders] = useState<TransferOrder[]>(clientState.getTransferOrders());

  useEffect(() => {
    const unsubscribe = clientState.subscribeToTransferOrders(() => {
      setTransferOrders(clientState.getTransferOrders());
    });
    return unsubscribe;
  }, []);

  return transferOrders;
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>(clientState.getProducts());

  useEffect(() => {
    const unsubscribe = clientState.subscribeToProducts(() => {
      setProducts(clientState.getProducts());
    });
    return unsubscribe;
  }, []);

  return products;
}

export function addWorkOrder(workOrder: Omit<WorkOrder, 'id' | 'created_at' | 'updated_at'>): WorkOrder {
  return clientState.addWorkOrder(workOrder);
}

export function updateWorkOrder(id: number, updates: Partial<WorkOrder>): WorkOrder | null {
  return clientState.updateWorkOrder(id, updates);
}

export function deleteWorkOrder(id: number): boolean {
  return clientState.deleteWorkOrder(id);
}

export function addPurchaseOrder(purchaseOrder: Omit<PurchaseOrder, 'id' | 'created_at' | 'updated_at'>): PurchaseOrder {
  return clientState.addPurchaseOrder(purchaseOrder);
}

export function updatePurchaseOrder(id: number, updates: Partial<PurchaseOrder>): PurchaseOrder | null {
  return clientState.updatePurchaseOrder(id, updates);
}

export function deletePurchaseOrder(id: number): boolean {
  return clientState.deletePurchaseOrder(id);
}

export function addTransferOrder(transferOrder: Omit<TransferOrder, 'id' | 'created_at' | 'updated_at'>): TransferOrder {
  return clientState.addTransferOrder(transferOrder);
}

export function updateTransferOrder(id: number, updates: Partial<TransferOrder>): TransferOrder | null {
  return clientState.updateTransferOrder(id, updates);
}

export function deleteTransferOrder(id: number): boolean {
  return clientState.deleteTransferOrder(id);
}

export function addProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Product {
  return clientState.addProduct(product);
}

export function updateProduct(id: number, updates: Partial<Product>): Product | null {
  return clientState.updateProduct(id, updates);
}

export function deleteProduct(id: number): boolean {
  return clientState.deleteProduct(id);
}
