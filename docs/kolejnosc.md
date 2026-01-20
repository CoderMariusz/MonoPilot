 Doskonale! Teraz mam pełny obraz. Tworzę raport:                                                    
                                                                                                      
● 📊 CHECKPOINT - Implementacja Scanner Workflows                                                     
                                                                                                      
  ✅ Stan Implementacji                                                                               
  Story: 04.6b                                                                                        
  Nazwa: Material Consumption Scanner                                                                 
  Status: ✅ DONE                                                                                     
  Ścieżka: /scanner/consume/                                                                          
  Notatki: Wszystkie komponenty + service                                                             
  ────────────────────────────────────────                                                            
  Story: 05.19                                                                                        
  Nazwa: Scanner Receive                                                                              
  Status: ✅ DONE (teraz naprawione)                                                                  
  Ścieżka: /scanner/receive/                                                                          
  Notatki: OPUS naprawił błąd w getPendingReceipts()                                                  
  ────────────────────────────────────────                                                            
  Story: 05.20                                                                                        
  Nazwa: Scanner Move                                                                                 
  Status: ❌ BRAKUJE                                                                                  
  Ścieżka: /scanner/move/                                                                             
  Notatki: Nie ma implementacji                                                                       
  ---                                                                                                 
  🔧 Co OPUS Naprawił                                                                                 
                                                                                                      
  Błąd w endpoint /api/warehouse/scanner/pending-receipts                                             
                                                                                                      
  // ❌ BYŁO:                                                                                         
  FROM po_lines      // WRONG: should be purchase_order_lines                                         
  ordered_qty        // WRONG: should be quantity                                                     
  expected_date      // WRONG: should be expected_delivery_date                                       
                                                                                                      
  // ✅ NOW FIXED by OPUS:                                                                            
  FROM purchase_order_lines                                                                           
  quantity                                                                                            
  expected_delivery_date                                                                              
                                                                                                      
  Rezultat: Endpoint teraz zwraca prawidłowo listę oczekujących PO! ✅                                
                                                                                                      
  ---                                                                                                 
  🎯 Menu Navigation - Integracja z Warehouse Toggle                                                  
                                                                                                      
  Obecna struktura (Sidebar.tsx linie 31-88):                                                         
                                                                                                      
  const allModules = [                                                                                
    { key: 'warehouse', name: 'Warehouse', ... },                                                     
    // Scanner BRAKUJE tutaj                                                                          
  ]                                                                                                   
                                                                                                      
  📍 Proponowane Rozwiązanie:                                                                         
                                                                                                      
  Opcja 1: Scanner jako sub-menu w Warehouse (REKOMENDOWNE)                                           
                                                                                                      
  // lib/config/modules.ts - dodać scanner                                                            
  {                                                                                                   
    code: 'scanner',                                                                                  
    name: 'Scanner',                                                                                  
    description: 'Mobile scanner workflows',                                                          
    defaultEnabled: true,                                                                             
    epic: null, // Part of Epic 4 & 5                                                                 
    group: 'core',                                                                                    
    pricing: 'Free',                                                                                  
    dependencies: ['warehouse', 'production'],  // ← scanner potrzebuje warehouse                     
    required_for: [],                                                                                 
  }                                                                                                   
                                                                                                      
  // components/navigation/Sidebar.tsx - dodaj scanner submenu                                        
  // Jeśli warehouse enabled → scanner też visible                                                    
  // Route: /scanner (główny hub) lub sub-routes: /scanner/receive, /scanner/move, /scanner/consume   
                                                                                                      
  Opcja 2: Scanner jako osobny top-level moduł (PROŚCIEJ)                                             
                                                                                                      
  const allModules: SidebarModule[] = [                                                               
    // ... istniejące moduły                                                                          
    {                                                                                                 
      key: 'scanner',                                                                                 
      name: 'Scanner',                                                                                
      icon: Smartphone, // lub BarcodeScan                                                            
      href: '/scanner',                                                                               
      color: 'text-teal-600',                                                                         
    },                                                                                                
  ]                                                                                                   
                                                                                                      
  ---                                                                                                 
  📍 Gdzie Dodać w Menu                                                                               
                                                                                                      
  File: /workspaces/MonoPilot/apps/frontend/components/navigation/Sidebar.tsx                         
                                                                                                      
  // Linia 31 - allModules array                                                                      
  const allModules: SidebarModule[] = [                                                               
    { key: 'settings', ... },                                                                         
    { key: 'technical', ... },                                                                        
    { key: 'planning', ... },                                                                         
    { key: 'production', ... },                                                                       
    { key: 'warehouse', ... },                                                                        
                                                                                                      
    // ➕ DODAJ TUTAJ:                                                                                
    {                                                                                                 
      key: 'scanner',          // ← musi być w modules_enabled                                        
      name: 'Scanner',                                                                                
      icon: Smartphone,        // import { Smartphone } from 'lucide-react'                           
      href: '/scanner',        // główny hub albo /scanner/receive?                                   
      color: 'text-teal-600',                                                                         
    },                                                                                                
                                                                                                      
    { key: 'quality', ... },                                                                          
    { key: 'shipping', ... },                                                                         
    { key: 'npd', ... },                                                                              
  ]                                                                                                   
                                                                                                      
  ---                                                                                                 
  🔗 Integracja z Warehouse Toggle                                                                    
                                                                                                      
  Kroki:                                                                                              
                                                                                                      
  1. Dodaj scanner do /lib/config/modules.ts                                                          
  dependencies: ['warehouse', 'production']                                                           
  2. Dodaj icon import w Sidebar.tsx:                                                                 
  import { Smartphone } from 'lucide-react'  // ← barcode scanner icon                                
  3. Routing:                                                                                         
    - Główna strona: /scanner (hub)                                                                   
    - Receive: /scanner/receive (już istnieje)                                                        
    - Consume: /scanner/consume (już istnieje)                                                        
    - Move: /scanner/move (BRAKUJE - do implementacji)                                                
  4. RLS w ustawieniach - warehouse_settings:                                                         
  enable_scanner: boolean  -- czy skanery enabled dla org?                                            
                                                                                                      
  ---                                                                                                 
  📋 Pozostałe Do Zrobienia                                                                           
  ┌─────┬─────────────────────────────────────────────────────┬───────────┬─────────┐                 
  │ Nr. │                        Task                         │ Priorytet │  Faza   │                 
  ├─────┼─────────────────────────────────────────────────────┼───────────┼─────────┤                 
  │ 1   │ ✅ Naprawić /api/warehouse/scanner/pending-receipts │ ✅ DONE   │ -       │                 
  ├─────┼─────────────────────────────────────────────────────┼───────────┼─────────┤                 
  │ 2   │ 🔧 Dodać scanner do /lib/config/modules.ts          │ HIGH      │ Phase 1 │                 
  ├─────┼─────────────────────────────────────────────────────┼───────────┼─────────┤                 
  │ 3   │ 🔧 Dodać scanner do Sidebar.tsx allModules          │ HIGH      │ Phase 1 │                 
  ├─────┼─────────────────────────────────────────────────────┼───────────┼─────────┤                 
  │ 4   │ 🚀 Implementować /scanner/move (05.20)              │ HIGH      │ Phase 2 │                 
  ├─────┼─────────────────────────────────────────────────────┼───────────┼─────────┤                 
  │ 5   │ 🚀 Implementować /scanner/putaway (05.21)           │ MEDIUM    │ Phase 2 │                 
  └─────┴─────────────────────────────────────────────────────┴───────────┴─────────┘                 
  ---                                                                                                 
  🎬 Next Steps                                                                                       
                                                                                                      
  # 1. Commit to naprawy OPUS                                                                         
  git add -A                                                                                          
  git commit -m "fix(scanner): Fix pending-receipts query with correct table/column names"            
                                                                                                      
  # 2. Add scanner to navigation                                                                      
  # - Modify lib/config/modules.ts                                                                    
  # - Modify components/navigation/Sidebar.tsx                                                        
                                                                                                      
  # 3. Create /scanner hub page                                                                       
  # - Dispatch to /scanner/receive, /scanner/consume, or create menu                                  
                                                                                                      
  # 4. Implement 05.20 (Scanner Move)                                                                 
                                                                                                      
  Czy chcesz że zaimplementuję dodawanie skanera do menu? 🔧                                          
                                                                  