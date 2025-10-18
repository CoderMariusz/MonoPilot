import { Page } from '@playwright/test';

export class CleanupHelpers {
  constructor(private page: Page) {}

  async cleanupTestProduct(partNumber: string) {
    try {
      // Navigate to BOM module
      await this.page.goto('/technical/bom');
      await this.page.waitForLoadState('networkidle');

      // Find and delete the product
      const productRow = this.page.locator(`tr:has-text("${partNumber}")`);
      if (await productRow.count() > 0) {
        await productRow.locator('button[aria-label="Delete"]').click();
        await this.page.click('button:has-text("Confirm")');
        await this.page.waitForLoadState('networkidle');
      }
    } catch (error) {
      console.log(`Failed to cleanup product ${partNumber}:`, error);
    }
  }

  async cleanupTestWorkOrder(workOrderNumber: string) {
    try {
      // Navigate to Planning module
      await this.page.goto('/planning');
      await this.page.waitForLoadState('networkidle');

      // Find and delete the work order
      const workOrderRow = this.page.locator(`tr:has-text("${workOrderNumber}")`);
      if (await workOrderRow.count() > 0) {
        await workOrderRow.locator('button[aria-label="Delete"]').click();
        await this.page.click('button:has-text("Confirm")');
        await this.page.waitForLoadState('networkidle');
      }
    } catch (error) {
      console.log(`Failed to cleanup work order ${workOrderNumber}:`, error);
    }
  }

  async cleanupTestPurchaseOrder(poNumber: string) {
    try {
      // Navigate to Planning module
      await this.page.goto('/planning');
      await this.page.waitForLoadState('networkidle');

      // Click Purchase Orders tab
      await this.page.click('[data-testid="tab-purchase-orders"]');

      // Find and delete the purchase order
      const poRow = this.page.locator(`tr:has-text("${poNumber}")`);
      if (await poRow.count() > 0) {
        await poRow.locator('button[aria-label="Delete"]').click();
        await this.page.click('button:has-text("Confirm")');
        await this.page.waitForLoadState('networkidle');
      }
    } catch (error) {
      console.log(`Failed to cleanup purchase order ${poNumber}:`, error);
    }
  }

  async cleanupTestTransferOrder(transferOrderNumber: string) {
    try {
      // Navigate to Planning module
      await this.page.goto('/planning');
      await this.page.waitForLoadState('networkidle');

      // Click Transfer Orders tab
      await this.page.click('[data-testid="tab-transfer-orders"]');

      // Find and delete the transfer order
      const transferRow = this.page.locator(`tr:has-text("${transferOrderNumber}")`);
      if (await transferRow.count() > 0) {
        await transferRow.locator('button[aria-label="Delete"]').click();
        await this.page.click('button:has-text("Confirm")');
        await this.page.waitForLoadState('networkidle');
      }
    } catch (error) {
      console.log(`Failed to cleanup transfer order ${transferOrderNumber}:`, error);
    }
  }

  async cleanupTestGRN(grnNumber: string) {
    try {
      // Navigate to Warehouse module
      await this.page.goto('/warehouse');
      await this.page.waitForLoadState('networkidle');

      // Click GRN tab
      await this.page.click('[data-testid="tab-grn"]');

      // Find and delete the GRN
      const grnRow = this.page.locator(`tr:has-text("${grnNumber}")`);
      if (await grnRow.count() > 0) {
        await grnRow.locator('button[aria-label="Delete"]').click();
        await this.page.click('button:has-text("Confirm")');
        await this.page.waitForLoadState('networkidle');
      }
    } catch (error) {
      console.log(`Failed to cleanup GRN ${grnNumber}:`, error);
    }
  }

  async cleanupTestStockMove(stockMoveNumber: string) {
    try {
      // Navigate to Warehouse module
      await this.page.goto('/warehouse');
      await this.page.waitForLoadState('networkidle');

      // Click Stock Move tab
      await this.page.click('[data-testid="tab-stock-move"]');

      // Find and delete the stock move
      const stockMoveRow = this.page.locator(`tr:has-text("${stockMoveNumber}")`);
      if (await stockMoveRow.count() > 0) {
        await stockMoveRow.locator('button[aria-label="Delete"]').click();
        await this.page.click('button:has-text("Confirm")');
        await this.page.waitForLoadState('networkidle');
      }
    } catch (error) {
      console.log(`Failed to cleanup stock move ${stockMoveNumber}:`, error);
    }
  }

  async cleanupTestLicensePlate(lpCode: string) {
    try {
      // Navigate to Warehouse module
      await this.page.goto('/warehouse');
      await this.page.waitForLoadState('networkidle');

      // Click LP Operations tab
      await this.page.click('[data-testid="tab-lp-operations"]');

      // Find and delete the license plate
      const lpRow = this.page.locator(`tr:has-text("${lpCode}")`);
      if (await lpRow.count() > 0) {
        await lpRow.locator('button[aria-label="Delete"]').click();
        await this.page.click('button:has-text("Confirm")');
        await this.page.waitForLoadState('networkidle');
      }
    } catch (error) {
      console.log(`Failed to cleanup license plate ${lpCode}:`, error);
    }
  }

  async cleanupTestUser(email: string) {
    try {
      // Navigate to Admin module
      await this.page.goto('/admin');
      await this.page.waitForLoadState('networkidle');

      // Click User Management tab
      await this.page.click('[data-testid="tab-users"]');

      // Find and delete the user
      const userRow = this.page.locator(`tr:has-text("${email}")`);
      if (await userRow.count() > 0) {
        await userRow.locator('button[aria-label="Delete"]').click();
        await this.page.click('button:has-text("Confirm")');
        await this.page.waitForLoadState('networkidle');
      }
    } catch (error) {
      console.log(`Failed to cleanup user ${email}:`, error);
    }
  }

  async cleanupTestSupplier(supplierName: string) {
    try {
      // Navigate to Settings module
      await this.page.goto('/settings');
      await this.page.waitForLoadState('networkidle');

      // Click Suppliers tab
      await this.page.click('[data-testid="tab-suppliers"]');

      // Find and delete the supplier
      const supplierRow = this.page.locator(`tr:has-text("${supplierName}")`);
      if (await supplierRow.count() > 0) {
        await supplierRow.locator('button[aria-label="Delete"]').click();
        await this.page.click('button:has-text("Confirm")');
        await this.page.waitForLoadState('networkidle');
      }
    } catch (error) {
      console.log(`Failed to cleanup supplier ${supplierName}:`, error);
    }
  }

  async cleanupTestWarehouse(warehouseName: string) {
    try {
      // Navigate to Settings module
      await this.page.goto('/settings');
      await this.page.waitForLoadState('networkidle');

      // Click Warehouses tab
      await this.page.click('[data-testid="tab-warehouses"]');

      // Find and delete the warehouse
      const warehouseRow = this.page.locator(`tr:has-text("${warehouseName}")`);
      if (await warehouseRow.count() > 0) {
        await warehouseRow.locator('button[aria-label="Delete"]').click();
        await this.page.click('button:has-text("Confirm")');
        await this.page.waitForLoadState('networkidle');
      }
    } catch (error) {
      console.log(`Failed to cleanup warehouse ${warehouseName}:`, error);
    }
  }

  async cleanupTestLocation(locationName: string) {
    try {
      // Navigate to Settings module
      await this.page.goto('/settings');
      await this.page.waitForLoadState('networkidle');

      // Click Locations tab
      await this.page.click('[data-testid="tab-locations"]');

      // Find and delete the location
      const locationRow = this.page.locator(`tr:has-text("${locationName}")`);
      if (await locationRow.count() > 0) {
        await locationRow.locator('button[aria-label="Delete"]').click();
        await this.page.click('button:has-text("Confirm")');
        await this.page.waitForLoadState('networkidle');
      }
    } catch (error) {
      console.log(`Failed to cleanup location ${locationName}:`, error);
    }
  }

  async cleanupTestMachine(machineName: string) {
    try {
      // Navigate to Settings module
      await this.page.goto('/settings');
      await this.page.waitForLoadState('networkidle');

      // Click Machines tab
      await this.page.click('[data-testid="tab-machines"]');

      // Find and delete the machine
      const machineRow = this.page.locator(`tr:has-text("${machineName}")`);
      if (await machineRow.count() > 0) {
        await machineRow.locator('button[aria-label="Delete"]').click();
        await this.page.click('button:has-text("Confirm")');
        await this.page.waitForLoadState('networkidle');
      }
    } catch (error) {
      console.log(`Failed to cleanup machine ${machineName}:`, error);
    }
  }

  async cleanupTestRouting(routingName: string) {
    try {
      // Navigate to Settings module
      await this.page.goto('/settings');
      await this.page.waitForLoadState('networkidle');

      // Click Routings tab
      await this.page.click('[data-testid="tab-routings"]');

      // Find and delete the routing
      const routingRow = this.page.locator(`tr:has-text("${routingName}")`);
      if (await routingRow.count() > 0) {
        await routingRow.locator('button[aria-label="Delete"]').click();
        await this.page.click('button:has-text("Confirm")');
        await this.page.waitForLoadState('networkidle');
      }
    } catch (error) {
      console.log(`Failed to cleanup routing ${routingName}:`, error);
    }
  }

  async cleanupTestDataByPrefix(prefix: string) {
    try {
      // This method would clean up all test data with a specific prefix
      // Implementation would depend on the specific cleanup requirements
      console.log(`Cleaning up test data with prefix: ${prefix}`);
      
      // Navigate to different modules and clean up data
      await this.cleanupTestProductsByPrefix(prefix);
      await this.cleanupTestWorkOrdersByPrefix(prefix);
      await this.cleanupTestPurchaseOrdersByPrefix(prefix);
      await this.cleanupTestTransferOrdersByPrefix(prefix);
      await this.cleanupTestGRNsByPrefix(prefix);
      await this.cleanupTestStockMovesByPrefix(prefix);
      await this.cleanupTestLicensePlatesByPrefix(prefix);
      await this.cleanupTestUsersByPrefix(prefix);
      await this.cleanupTestSuppliersByPrefix(prefix);
      await this.cleanupTestWarehousesByPrefix(prefix);
      await this.cleanupTestLocationsByPrefix(prefix);
      await this.cleanupTestMachinesByPrefix(prefix);
      await this.cleanupTestRoutingsByPrefix(prefix);
    } catch (error) {
      console.log(`Failed to cleanup test data with prefix ${prefix}:`, error);
    }
  }

  private async cleanupTestProductsByPrefix(prefix: string) {
    try {
      await this.page.goto('/technical/bom');
      await this.page.waitForLoadState('networkidle');

      const productRows = this.page.locator(`tr:has-text("${prefix}")`);
      const count = await productRows.count();
      
      for (let i = count - 1; i >= 0; i--) {
        await productRows.nth(i).locator('button[aria-label="Delete"]').click();
        await this.page.click('button:has-text("Confirm")');
        await this.page.waitForLoadState('networkidle');
      }
    } catch (error) {
      console.log(`Failed to cleanup products with prefix ${prefix}:`, error);
    }
  }

  private async cleanupTestWorkOrdersByPrefix(prefix: string) {
    try {
      await this.page.goto('/planning');
      await this.page.waitForLoadState('networkidle');

      const workOrderRows = this.page.locator(`tr:has-text("${prefix}")`);
      const count = await workOrderRows.count();
      
      for (let i = count - 1; i >= 0; i--) {
        await workOrderRows.nth(i).locator('button[aria-label="Delete"]').click();
        await this.page.click('button:has-text("Confirm")');
        await this.page.waitForLoadState('networkidle');
      }
    } catch (error) {
      console.log(`Failed to cleanup work orders with prefix ${prefix}:`, error);
    }
  }

  private async cleanupTestPurchaseOrdersByPrefix(prefix: string) {
    try {
      await this.page.goto('/planning');
      await this.page.waitForLoadState('networkidle');
      await this.page.click('[data-testid="tab-purchase-orders"]');

      const poRows = this.page.locator(`tr:has-text("${prefix}")`);
      const count = await poRows.count();
      
      for (let i = count - 1; i >= 0; i--) {
        await poRows.nth(i).locator('button[aria-label="Delete"]').click();
        await this.page.click('button:has-text("Confirm")');
        await this.page.waitForLoadState('networkidle');
      }
    } catch (error) {
      console.log(`Failed to cleanup purchase orders with prefix ${prefix}:`, error);
    }
  }

  private async cleanupTestTransferOrdersByPrefix(prefix: string) {
    try {
      await this.page.goto('/planning');
      await this.page.waitForLoadState('networkidle');
      await this.page.click('[data-testid="tab-transfer-orders"]');

      const transferRows = this.page.locator(`tr:has-text("${prefix}")`);
      const count = await transferRows.count();
      
      for (let i = count - 1; i >= 0; i--) {
        await transferRows.nth(i).locator('button[aria-label="Delete"]').click();
        await this.page.click('button:has-text("Confirm")');
        await this.page.waitForLoadState('networkidle');
      }
    } catch (error) {
      console.log(`Failed to cleanup transfer orders with prefix ${prefix}:`, error);
    }
  }

  private async cleanupTestGRNsByPrefix(prefix: string) {
    try {
      await this.page.goto('/warehouse');
      await this.page.waitForLoadState('networkidle');
      await this.page.click('[data-testid="tab-grn"]');

      const grnRows = this.page.locator(`tr:has-text("${prefix}")`);
      const count = await grnRows.count();
      
      for (let i = count - 1; i >= 0; i--) {
        await grnRows.nth(i).locator('button[aria-label="Delete"]').click();
        await this.page.click('button:has-text("Confirm")');
        await this.page.waitForLoadState('networkidle');
      }
    } catch (error) {
      console.log(`Failed to cleanup GRNs with prefix ${prefix}:`, error);
    }
  }

  private async cleanupTestStockMovesByPrefix(prefix: string) {
    try {
      await this.page.goto('/warehouse');
      await this.page.waitForLoadState('networkidle');
      await this.page.click('[data-testid="tab-stock-move"]');

      const stockMoveRows = this.page.locator(`tr:has-text("${prefix}")`);
      const count = await stockMoveRows.count();
      
      for (let i = count - 1; i >= 0; i--) {
        await stockMoveRows.nth(i).locator('button[aria-label="Delete"]').click();
        await this.page.click('button:has-text("Confirm")');
        await this.page.waitForLoadState('networkidle');
      }
    } catch (error) {
      console.log(`Failed to cleanup stock moves with prefix ${prefix}:`, error);
    }
  }

  private async cleanupTestLicensePlatesByPrefix(prefix: string) {
    try {
      await this.page.goto('/warehouse');
      await this.page.waitForLoadState('networkidle');
      await this.page.click('[data-testid="tab-lp-operations"]');

      const lpRows = this.page.locator(`tr:has-text("${prefix}")`);
      const count = await lpRows.count();
      
      for (let i = count - 1; i >= 0; i--) {
        await lpRows.nth(i).locator('button[aria-label="Delete"]').click();
        await this.page.click('button:has-text("Confirm")');
        await this.page.waitForLoadState('networkidle');
      }
    } catch (error) {
      console.log(`Failed to cleanup license plates with prefix ${prefix}:`, error);
    }
  }

  private async cleanupTestUsersByPrefix(prefix: string) {
    try {
      await this.page.goto('/admin');
      await this.page.waitForLoadState('networkidle');
      await this.page.click('[data-testid="tab-users"]');

      const userRows = this.page.locator(`tr:has-text("${prefix}")`);
      const count = await userRows.count();
      
      for (let i = count - 1; i >= 0; i--) {
        await userRows.nth(i).locator('button[aria-label="Delete"]').click();
        await this.page.click('button:has-text("Confirm")');
        await this.page.waitForLoadState('networkidle');
      }
    } catch (error) {
      console.log(`Failed to cleanup users with prefix ${prefix}:`, error);
    }
  }

  private async cleanupTestSuppliersByPrefix(prefix: string) {
    try {
      await this.page.goto('/settings');
      await this.page.waitForLoadState('networkidle');
      await this.page.click('[data-testid="tab-suppliers"]');

      const supplierRows = this.page.locator(`tr:has-text("${prefix}")`);
      const count = await supplierRows.count();
      
      for (let i = count - 1; i >= 0; i--) {
        await supplierRows.nth(i).locator('button[aria-label="Delete"]').click();
        await this.page.click('button:has-text("Confirm")');
        await this.page.waitForLoadState('networkidle');
      }
    } catch (error) {
      console.log(`Failed to cleanup suppliers with prefix ${prefix}:`, error);
    }
  }

  private async cleanupTestWarehousesByPrefix(prefix: string) {
    try {
      await this.page.goto('/settings');
      await this.page.waitForLoadState('networkidle');
      await this.page.click('[data-testid="tab-warehouses"]');

      const warehouseRows = this.page.locator(`tr:has-text("${prefix}")`);
      const count = await warehouseRows.count();
      
      for (let i = count - 1; i >= 0; i--) {
        await warehouseRows.nth(i).locator('button[aria-label="Delete"]').click();
        await this.page.click('button:has-text("Confirm")');
        await this.page.waitForLoadState('networkidle');
      }
    } catch (error) {
      console.log(`Failed to cleanup warehouses with prefix ${prefix}:`, error);
    }
  }

  private async cleanupTestLocationsByPrefix(prefix: string) {
    try {
      await this.page.goto('/settings');
      await this.page.waitForLoadState('networkidle');
      await this.page.click('[data-testid="tab-locations"]');

      const locationRows = this.page.locator(`tr:has-text("${prefix}")`);
      const count = await locationRows.count();
      
      for (let i = count - 1; i >= 0; i--) {
        await locationRows.nth(i).locator('button[aria-label="Delete"]').click();
        await this.page.click('button:has-text("Confirm")');
        await this.page.waitForLoadState('networkidle');
      }
    } catch (error) {
      console.log(`Failed to cleanup locations with prefix ${prefix}:`, error);
    }
  }

  private async cleanupTestMachinesByPrefix(prefix: string) {
    try {
      await this.page.goto('/settings');
      await this.page.waitForLoadState('networkidle');
      await this.page.click('[data-testid="tab-machines"]');

      const machineRows = this.page.locator(`tr:has-text("${prefix}")`);
      const count = await machineRows.count();
      
      for (let i = count - 1; i >= 0; i--) {
        await machineRows.nth(i).locator('button[aria-label="Delete"]').click();
        await this.page.click('button:has-text("Confirm")');
        await this.page.waitForLoadState('networkidle');
      }
    } catch (error) {
      console.log(`Failed to cleanup machines with prefix ${prefix}:`, error);
    }
  }

  private async cleanupTestRoutingsByPrefix(prefix: string) {
    try {
      await this.page.goto('/settings');
      await this.page.waitForLoadState('networkidle');
      await this.page.click('[data-testid="tab-routings"]');

      const routingRows = this.page.locator(`tr:has-text("${prefix}")`);
      const count = await routingRows.count();
      
      for (let i = count - 1; i >= 0; i--) {
        await routingRows.nth(i).locator('button[aria-label="Delete"]').click();
        await this.page.click('button:has-text("Confirm")');
        await this.page.waitForLoadState('networkidle');
      }
    } catch (error) {
      console.log(`Failed to cleanup routings with prefix ${prefix}:`, error);
    }
  }

  async cleanupAllTestData() {
    try {
      console.log('Starting cleanup of all test data...');
      
      // Clean up data in reverse order of dependencies
      await this.cleanupTestDataByPrefix('TEST-');
      await this.cleanupTestDataByPrefix('E2E-');
      await this.cleanupTestDataByPrefix('PLAYWRIGHT-');
      
      console.log('Cleanup of all test data completed.');
    } catch (error) {
      console.log('Failed to cleanup all test data:', error);
    }
  }
}
