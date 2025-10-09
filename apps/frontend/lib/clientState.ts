'use client';

import { useState, useEffect } from 'react';
import type { WorkOrder, PurchaseOrder, TransferOrder, Product, GRN, LicensePlate, StockMove, User, Session, Settings, YieldReportDetail, Location, Machine, Allergen, OrderProgress } from './types';
import { 
  mockWorkOrders, 
  mockPurchaseOrders, 
  mockTransferOrders, 
  mockProducts,
  mockGRNs,
  mockLicensePlates,
  mockStockMoves,
  mockUsers,
  mockSessions,
  mockSettings,
  mockLocations,
  mockMachines,
  mockAllergens
} from './mockData';

type Listener = () => void;

class ClientState {
  private workOrders: WorkOrder[] = [...mockWorkOrders];
  private purchaseOrders: PurchaseOrder[] = [...mockPurchaseOrders];
  private transferOrders: TransferOrder[] = [...mockTransferOrders];
  private products: Product[] = [...mockProducts];
  private grns: GRN[] = [...mockGRNs];
  private licensePlates: LicensePlate[] = [...mockLicensePlates];
  private stockMoves: StockMove[] = [...mockStockMoves];
  private users: User[] = [...mockUsers];
  private sessions: Session[] = [...mockSessions];
  private settings: Settings = { ...mockSettings };
  private yieldReports: YieldReportDetail[] = [];
  private locations: Location[] = [...mockLocations];
  private machines: Machine[] = [...mockMachines];
  private allergens: Allergen[] = [...mockAllergens];
  private orderProgress: Map<number, OrderProgress> = new Map();
  
  private workOrderListeners: Listener[] = [];
  private purchaseOrderListeners: Listener[] = [];
  private transferOrderListeners: Listener[] = [];
  private productListeners: Listener[] = [];
  private grnListeners: Listener[] = [];
  private licensePlateListeners: Listener[] = [];
  private stockMoveListeners: Listener[] = [];
  private userListeners: Listener[] = [];
  private sessionListeners: Listener[] = [];
  private settingsListeners: Listener[] = [];
  private yieldReportListeners: Listener[] = [];
  private locationListeners: Listener[] = [];
  private machineListeners: Listener[] = [];
  private allergenListeners: Listener[] = [];

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
    return this.products.map(product => ({
      ...product,
      allergens: product.allergen_ids 
        ? product.allergen_ids.map(id => this.allergens.find(a => a.id === id)).filter(Boolean) as Allergen[]
        : undefined,
    }));
  }

  getGRNs(): GRN[] {
    return this.grns.map(grn => {
      const po = this.purchaseOrders.find(p => p.id === grn.po_id);
      return {
        ...grn,
        po: po
      };
    });
  }

  getLicensePlates(): LicensePlate[] {
    return this.licensePlates.map(lp => ({
      ...lp,
      product: lp.product_id ? this.products.find(p => p.id === lp.product_id) : undefined,
      location: lp.location_id ? this.locations.find(loc => loc.id === lp.location_id) : undefined,
    }));
  }

  getLocations(): Location[] {
    return [...this.locations];
  }

  getMachines(): Machine[] {
    return [...this.machines];
  }

  getAllergens(): Allergen[] {
    return [...this.allergens];
  }

  getStockMoves(): StockMove[] {
    return this.stockMoves.map(move => {
      const lp = this.licensePlates.find(l => l.id === move.lp_id);
      const from_location = this.locations.find(loc => loc.id === move.from_location_id);
      const to_location = this.locations.find(loc => loc.id === move.to_location_id);
      
      let enrichedLP = lp;
      if (lp) {
        const product = this.products.find(p => p.id === lp.product_id);
        enrichedLP = { ...lp, product };
      }
      
      return {
        ...move,
        lp: enrichedLP,
        from_location,
        to_location
      };
    });
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

  subscribeToGRNs(listener: Listener): () => void {
    this.grnListeners.push(listener);
    return () => {
      this.grnListeners = this.grnListeners.filter(l => l !== listener);
    };
  }

  subscribeToLicensePlates(listener: Listener): () => void {
    this.licensePlateListeners.push(listener);
    return () => {
      this.licensePlateListeners = this.licensePlateListeners.filter(l => l !== listener);
    };
  }

  subscribeToStockMoves(listener: Listener): () => void {
    this.stockMoveListeners.push(listener);
    return () => {
      this.stockMoveListeners = this.stockMoveListeners.filter(l => l !== listener);
    };
  }

  subscribeToLocations(listener: Listener): () => void {
    this.locationListeners.push(listener);
    return () => {
      this.locationListeners = this.locationListeners.filter(l => l !== listener);
    };
  }

  subscribeToMachines(listener: Listener): () => void {
    this.machineListeners.push(listener);
    return () => {
      this.machineListeners = this.machineListeners.filter(l => l !== listener);
    };
  }

  subscribeToAllergens(listener: Listener): () => void {
    this.allergenListeners.push(listener);
    return () => {
      this.allergenListeners = this.allergenListeners.filter(l => l !== listener);
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

  private notifyGRNListeners() {
    this.grnListeners.forEach(listener => listener());
  }

  private notifyLicensePlateListeners() {
    this.licensePlateListeners.forEach(listener => listener());
  }

  private notifyStockMoveListeners() {
    this.stockMoveListeners.forEach(listener => listener());
  }

  private notifyLocationListeners() {
    this.locationListeners.forEach(listener => listener());
  }

  private notifyMachineListeners() {
    this.machineListeners.forEach(listener => listener());
  }

  private notifyAllergenListeners() {
    this.allergenListeners.forEach(listener => listener());
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

  addProduct(product: any): Product {
    const { bom_items, ...productData } = product;
    const newProductId = Math.max(...this.products.map(p => p.id), 0) + 1;
    
    let activeBom = null;
    if (bom_items && bom_items.length > 0) {
      const bomId = Date.now();
      const bomItems = bom_items.map((item: any, index: number) => ({
        id: bomId + index + 1,
        bom_id: bomId,
        material_id: item.material_id,
        quantity: item.quantity.toString(),
        uom: item.uom,
        sequence: item.sequence || index + 1,
        priority: item.priority,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
      
      activeBom = {
        id: bomId,
        product_id: newProductId,
        version: '1.0',
        is_active: true,
        bomItems,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
    
    const newProduct: Product = {
      ...productData,
      id: newProductId,
      production_lines: product.production_lines || [],
      activeBom,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.products = [...this.products, newProduct];
    this.notifyProductListeners();
    return newProduct;
  }

  updateProduct(id: number, updates: any): Product | null {
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) return null;

    const { bom_items, ...productUpdates } = updates;
    
    let activeBom = this.products[index].activeBom;
    if (bom_items !== undefined) {
      if (bom_items && bom_items.length > 0) {
        const bomId = activeBom?.id || Date.now();
        const bomItems = bom_items.map((item: any, index: number) => ({
          id: bomId + index + 1,
          bom_id: bomId,
          material_id: item.material_id,
          quantity: item.quantity.toString(),
          uom: item.uom,
          sequence: item.sequence || index + 1,
          priority: item.priority,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));
        
        activeBom = {
          id: bomId,
          product_id: id,
          version: activeBom?.version || '1.0',
          is_active: true,
          bomItems,
          created_at: activeBom?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      } else {
        activeBom = null;
      }
    }

    const updatedProduct: Product = {
      ...this.products[index],
      ...productUpdates,
      production_lines: updates.production_lines !== undefined ? updates.production_lines : this.products[index].production_lines,
      activeBom,
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

  addGRN(grn: Omit<GRN, 'id' | 'created_at' | 'updated_at'>): GRN {
    const newGRN: GRN = {
      ...grn,
      id: Math.max(...this.grns.map(g => g.id), 0) + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.grns = [...this.grns, newGRN];
    this.notifyGRNListeners();
    return newGRN;
  }

  updateGRN(id: number, updates: Partial<GRN>): GRN | null {
    const index = this.grns.findIndex(g => g.id === id);
    if (index === -1) return null;

    const updatedGRN: GRN = {
      ...this.grns[index],
      ...updates,
      id: this.grns[index].id,
      updated_at: new Date().toISOString(),
    };
    
    this.grns = [
      ...this.grns.slice(0, index),
      updatedGRN,
      ...this.grns.slice(index + 1),
    ];
    
    this.notifyGRNListeners();
    return updatedGRN;
  }

  deleteGRN(id: number): boolean {
    const initialLength = this.grns.length;
    this.grns = this.grns.filter(g => g.id !== id);
    if (this.grns.length < initialLength) {
      this.notifyGRNListeners();
      return true;
    }
    return false;
  }

  addLicensePlate(lp: Omit<LicensePlate, 'id' | 'created_at' | 'updated_at'>): LicensePlate {
    const newLP: LicensePlate = {
      ...lp,
      id: Math.max(...this.licensePlates.map(lp => lp.id), 0) + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.licensePlates = [...this.licensePlates, newLP];
    this.notifyLicensePlateListeners();
    return newLP;
  }

  updateLicensePlate(id: number, updates: Partial<LicensePlate>): LicensePlate | null {
    const index = this.licensePlates.findIndex(lp => lp.id === id);
    if (index === -1) return null;

    const updatedLP: LicensePlate = {
      ...this.licensePlates[index],
      ...updates,
      id: this.licensePlates[index].id,
      updated_at: new Date().toISOString(),
    };
    
    this.licensePlates = [
      ...this.licensePlates.slice(0, index),
      updatedLP,
      ...this.licensePlates.slice(index + 1),
    ];
    
    this.notifyLicensePlateListeners();
    return updatedLP;
  }

  deleteLicensePlate(id: number): boolean {
    const initialLength = this.licensePlates.length;
    this.licensePlates = this.licensePlates.filter(lp => lp.id !== id);
    if (this.licensePlates.length < initialLength) {
      this.notifyLicensePlateListeners();
      return true;
    }
    return false;
  }

  addStockMove(move: Omit<StockMove, 'id' | 'created_at' | 'updated_at'>): StockMove {
    const newMove: StockMove = {
      ...move,
      id: Math.max(...this.stockMoves.map(m => m.id), 0) + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.stockMoves = [...this.stockMoves, newMove];
    this.notifyStockMoveListeners();
    return newMove;
  }

  updateStockMove(id: number, updates: Partial<StockMove>): StockMove | null {
    const index = this.stockMoves.findIndex(m => m.id === id);
    if (index === -1) return null;

    const updatedMove: StockMove = {
      ...this.stockMoves[index],
      ...updates,
      id: this.stockMoves[index].id,
      updated_at: new Date().toISOString(),
    };
    
    this.stockMoves = [
      ...this.stockMoves.slice(0, index),
      updatedMove,
      ...this.stockMoves.slice(index + 1),
    ];
    
    this.notifyStockMoveListeners();
    return updatedMove;
  }

  deleteStockMove(id: number): boolean {
    const initialLength = this.stockMoves.length;
    this.stockMoves = this.stockMoves.filter(m => m.id !== id);
    if (this.stockMoves.length < initialLength) {
      this.notifyStockMoveListeners();
      return true;
    }
    return false;
  }

  addLocation(location: Omit<Location, 'id' | 'created_at' | 'updated_at'>): Location {
    const newLocation: Location = {
      ...location,
      id: Math.max(...this.locations.map(l => l.id), 0) + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.locations = [...this.locations, newLocation];
    this.notifyLocationListeners();
    return newLocation;
  }

  updateLocation(id: number, updates: Partial<Location>): Location | null {
    const index = this.locations.findIndex(l => l.id === id);
    if (index === -1) return null;

    const updatedLocation: Location = {
      ...this.locations[index],
      ...updates,
      id: this.locations[index].id,
      updated_at: new Date().toISOString(),
    };
    
    this.locations = [
      ...this.locations.slice(0, index),
      updatedLocation,
      ...this.locations.slice(index + 1),
    ];
    
    this.notifyLocationListeners();
    return updatedLocation;
  }

  deleteLocation(id: number): boolean {
    const initialLength = this.locations.length;
    this.locations = this.locations.filter(l => l.id !== id);
    if (this.locations.length < initialLength) {
      this.notifyLocationListeners();
      return true;
    }
    return false;
  }

  addMachine(machine: Omit<Machine, 'id' | 'created_at' | 'updated_at'>): Machine {
    const newMachine: Machine = {
      ...machine,
      id: Math.max(...this.machines.map(m => m.id), 0) + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.machines = [...this.machines, newMachine];
    this.notifyMachineListeners();
    return newMachine;
  }

  updateMachine(id: number, updates: Partial<Machine>): Machine | null {
    const index = this.machines.findIndex(m => m.id === id);
    if (index === -1) return null;

    const updatedMachine: Machine = {
      ...this.machines[index],
      ...updates,
      id: this.machines[index].id,
      updated_at: new Date().toISOString(),
    };
    
    this.machines = [
      ...this.machines.slice(0, index),
      updatedMachine,
      ...this.machines.slice(index + 1),
    ];
    
    this.notifyMachineListeners();
    return updatedMachine;
  }

  deleteMachine(id: number): boolean {
    const initialLength = this.machines.length;
    this.machines = this.machines.filter(m => m.id !== id);
    if (this.machines.length < initialLength) {
      this.notifyMachineListeners();
      return true;
    }
    return false;
  }

  addAllergen(allergen: Omit<Allergen, 'id' | 'created_at' | 'updated_at'>): Allergen {
    const newAllergen: Allergen = {
      ...allergen,
      id: Math.max(...this.allergens.map(a => a.id), 0) + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.allergens = [...this.allergens, newAllergen];
    this.notifyAllergenListeners();
    return newAllergen;
  }

  updateAllergen(id: number, updates: Partial<Allergen>): Allergen | null {
    const index = this.allergens.findIndex(a => a.id === id);
    if (index === -1) return null;

    const updatedAllergen: Allergen = {
      ...this.allergens[index],
      ...updates,
      id: this.allergens[index].id,
      updated_at: new Date().toISOString(),
    };
    
    this.allergens = [
      ...this.allergens.slice(0, index),
      updatedAllergen,
      ...this.allergens.slice(index + 1),
    ];
    
    this.notifyAllergenListeners();
    return updatedAllergen;
  }

  deleteAllergen(id: number): boolean {
    const initialLength = this.allergens.length;
    this.allergens = this.allergens.filter(a => a.id !== id);
    if (this.allergens.length < initialLength) {
      this.notifyAllergenListeners();
      return true;
    }
    return false;
  }

  saveOrderProgress(woId: number, progress: OrderProgress): void {
    this.orderProgress.set(woId, progress);
  }

  getOrderProgress(woId: number): OrderProgress | undefined {
    return this.orderProgress.get(woId);
  }

  clearOrderProgress(woId: number): void {
    this.orderProgress.delete(woId);
  }

  getUsers(): User[] {
    return [...this.users];
  }

  getSessions(): Session[] {
    return [...this.sessions];
  }

  getSettings(): Settings {
    return { ...this.settings };
  }

  subscribeToUsers(listener: Listener): () => void {
    this.userListeners.push(listener);
    return () => {
      this.userListeners = this.userListeners.filter(l => l !== listener);
    };
  }

  subscribeToSessions(listener: Listener): () => void {
    this.sessionListeners.push(listener);
    return () => {
      this.sessionListeners = this.sessionListeners.filter(l => l !== listener);
    };
  }

  subscribeToSettings(listener: Listener): () => void {
    this.settingsListeners.push(listener);
    return () => {
      this.settingsListeners = this.settingsListeners.filter(l => l !== listener);
    };
  }

  private notifyUserListeners() {
    this.userListeners.forEach(listener => listener());
  }

  private notifySessionListeners() {
    this.sessionListeners.forEach(listener => listener());
  }

  private notifySettingsListeners() {
    this.settingsListeners.forEach(listener => listener());
  }

  addUser(user: Omit<User, 'id' | 'created_at'>): User {
    const newUser: User = {
      ...user,
      id: Math.max(...this.users.map(u => u.id), 0) + 1,
      created_at: new Date().toISOString(),
    };
    this.users = [...this.users, newUser];
    this.notifyUserListeners();
    return newUser;
  }

  updateUser(id: number, updates: Partial<User>): User | null {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) return null;

    const updatedUser: User = {
      ...this.users[index],
      ...updates,
      id: this.users[index].id,
    };
    
    this.users = [
      ...this.users.slice(0, index),
      updatedUser,
      ...this.users.slice(index + 1),
    ];
    
    this.notifyUserListeners();
    return updatedUser;
  }

  deleteUser(id: number): boolean {
    const initialLength = this.users.length;
    this.users = this.users.filter(u => u.id !== id);
    if (this.users.length < initialLength) {
      this.notifyUserListeners();
      return true;
    }
    return false;
  }

  revokeSession(id: number): boolean {
    const index = this.sessions.findIndex(s => s.id === id);
    if (index === -1) return false;

    const updatedSession: Session = {
      ...this.sessions[index],
      status: 'Expired',
    };
    
    this.sessions = [
      ...this.sessions.slice(0, index),
      updatedSession,
      ...this.sessions.slice(index + 1),
    ];
    
    this.notifySessionListeners();
    return true;
  }

  updateSettings(updates: Partial<Settings>): Settings {
    this.settings = {
      ...this.settings,
      ...updates,
      general: {
        ...this.settings.general,
        ...(updates.general || {}),
      },
      production: {
        ...this.settings.production,
        ...(updates.production || {}),
      },
      warehouse: {
        ...this.settings.warehouse,
        ...(updates.warehouse || {}),
      },
      notifications: {
        ...this.settings.notifications,
        ...(updates.notifications || {}),
      },
    };
    this.notifySettingsListeners();
    return { ...this.settings };
  }

  getYieldReports(): YieldReportDetail[] {
    return [...this.yieldReports];
  }

  subscribeToYieldReports(listener: Listener): () => void {
    this.yieldReportListeners.push(listener);
    return () => {
      this.yieldReportListeners = this.yieldReportListeners.filter(l => l !== listener);
    };
  }

  private notifyYieldReportListeners() {
    this.yieldReportListeners.forEach(listener => listener());
  }

  addYieldReport(report: YieldReportDetail): YieldReportDetail {
    this.yieldReports = [...this.yieldReports, report];
    this.notifyYieldReportListeners();
    return report;
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

export function useGRNs() {
  const [grns, setGRNs] = useState<GRN[]>(clientState.getGRNs());

  useEffect(() => {
    const unsubscribe = clientState.subscribeToGRNs(() => {
      setGRNs(clientState.getGRNs());
    });
    return unsubscribe;
  }, []);

  return grns;
}

export function useLicensePlates() {
  const [licensePlates, setLicensePlates] = useState<LicensePlate[]>(clientState.getLicensePlates());

  useEffect(() => {
    const unsubscribe = clientState.subscribeToLicensePlates(() => {
      setLicensePlates(clientState.getLicensePlates());
    });
    return unsubscribe;
  }, []);

  return licensePlates;
}

export function useStockMoves() {
  const [stockMoves, setStockMoves] = useState<StockMove[]>(clientState.getStockMoves());

  useEffect(() => {
    const unsubscribe = clientState.subscribeToStockMoves(() => {
      setStockMoves(clientState.getStockMoves());
    });
    return unsubscribe;
  }, []);

  return stockMoves;
}

export function addGRN(grn: Omit<GRN, 'id' | 'created_at' | 'updated_at'>): GRN {
  return clientState.addGRN(grn);
}

export function updateGRN(id: number, updates: Partial<GRN>): GRN | null {
  return clientState.updateGRN(id, updates);
}

export function deleteGRN(id: number): boolean {
  return clientState.deleteGRN(id);
}

export function addLicensePlate(lp: Omit<LicensePlate, 'id' | 'created_at' | 'updated_at'>): LicensePlate {
  return clientState.addLicensePlate(lp);
}

export function updateLicensePlate(id: number, updates: Partial<LicensePlate>): LicensePlate | null {
  return clientState.updateLicensePlate(id, updates);
}

export function deleteLicensePlate(id: number): boolean {
  return clientState.deleteLicensePlate(id);
}

export function addStockMove(move: Omit<StockMove, 'id' | 'created_at' | 'updated_at'>): StockMove {
  return clientState.addStockMove(move);
}

export function updateStockMove(id: number, updates: Partial<StockMove>): StockMove | null {
  return clientState.updateStockMove(id, updates);
}

export function deleteStockMove(id: number): boolean {
  return clientState.deleteStockMove(id);
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>(clientState.getUsers());

  useEffect(() => {
    const unsubscribe = clientState.subscribeToUsers(() => {
      setUsers(clientState.getUsers());
    });
    return unsubscribe;
  }, []);

  return users;
}

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>(clientState.getSessions());

  useEffect(() => {
    const unsubscribe = clientState.subscribeToSessions(() => {
      setSessions(clientState.getSessions());
    });
    return unsubscribe;
  }, []);

  return sessions;
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(clientState.getSettings());

  useEffect(() => {
    const unsubscribe = clientState.subscribeToSettings(() => {
      setSettings(clientState.getSettings());
    });
    return unsubscribe;
  }, []);

  return settings;
}

export function addUser(user: Omit<User, 'id' | 'created_at'>): User {
  return clientState.addUser(user);
}

export function updateUser(id: number, updates: Partial<User>): User | null {
  return clientState.updateUser(id, updates);
}

export function deleteUser(id: number): boolean {
  return clientState.deleteUser(id);
}

export function revokeSession(id: number): boolean {
  return clientState.revokeSession(id);
}

export function updateSettings(updates: Partial<Settings>): Settings {
  return clientState.updateSettings(updates);
}

export function useYieldReports() {
  const [yieldReports, setYieldReports] = useState<YieldReportDetail[]>(clientState.getYieldReports());

  useEffect(() => {
    const unsubscribe = clientState.subscribeToYieldReports(() => {
      setYieldReports(clientState.getYieldReports());
    });
    return unsubscribe;
  }, []);

  return yieldReports;
}

export function addYieldReport(report: YieldReportDetail): YieldReportDetail {
  return clientState.addYieldReport(report);
}

export function useLocations() {
  const [locations, setLocations] = useState<Location[]>(clientState.getLocations());

  useEffect(() => {
    const unsubscribe = clientState.subscribeToLocations(() => {
      setLocations(clientState.getLocations());
    });
    return unsubscribe;
  }, []);

  return locations;
}

export function useMachines() {
  const [machines, setMachines] = useState<Machine[]>(clientState.getMachines());

  useEffect(() => {
    const unsubscribe = clientState.subscribeToMachines(() => {
      setMachines(clientState.getMachines());
    });
    return unsubscribe;
  }, []);

  return machines;
}

export function useAllergens() {
  const [allergens, setAllergens] = useState<Allergen[]>(clientState.getAllergens());

  useEffect(() => {
    const unsubscribe = clientState.subscribeToAllergens(() => {
      setAllergens(clientState.getAllergens());
    });
    return unsubscribe;
  }, []);

  return allergens;
}

export function addLocation(location: Omit<Location, 'id' | 'created_at' | 'updated_at'>): Location {
  return clientState.addLocation(location);
}

export function updateLocation(id: number, updates: Partial<Location>): Location | null {
  return clientState.updateLocation(id, updates);
}

export function deleteLocation(id: number): boolean {
  return clientState.deleteLocation(id);
}

export function addMachine(machine: Omit<Machine, 'id' | 'created_at' | 'updated_at'>): Machine {
  return clientState.addMachine(machine);
}

export function updateMachine(id: number, updates: Partial<Machine>): Machine | null {
  return clientState.updateMachine(id, updates);
}

export function deleteMachine(id: number): boolean {
  return clientState.deleteMachine(id);
}

export function addAllergen(allergen: Omit<Allergen, 'id' | 'created_at' | 'updated_at'>): Allergen {
  return clientState.addAllergen(allergen);
}

export function updateAllergen(id: number, updates: Partial<Allergen>): Allergen | null {
  return clientState.updateAllergen(id, updates);
}

export function deleteAllergen(id: number): boolean {
  return clientState.deleteAllergen(id);
}

export function saveOrderProgress(woId: number, progress: OrderProgress): void {
  return clientState.saveOrderProgress(woId, progress);
}

export function getOrderProgress(woId: number): OrderProgress | undefined {
  return clientState.getOrderProgress(woId);
}

export function clearOrderProgress(woId: number): void {
  return clientState.clearOrderProgress(woId);
}
