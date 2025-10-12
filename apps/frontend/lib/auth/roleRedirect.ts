export function getRoleBasedRoute(role: string): string {
  const roleRoutes: Record<string, string> = {
    'Admin': '/admin',
    'Planner': '/planning',
    'Operator': '/production',
    'Warehouse': '/warehouse',
    'QC': '/warehouse',
    'Technical': '/technical',
    'Purchasing': '/planning',
  };
  
  return roleRoutes[role] || '/planning'; // Default to planning
}
