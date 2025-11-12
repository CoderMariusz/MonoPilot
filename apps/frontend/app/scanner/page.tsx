'use client';

import Link from 'next/link';
import { Workflow, Package, ClipboardCheck } from 'lucide-react';

export default function ScannerPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6 sm:mb-8">Scanner Terminals</h1>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Link href="/scanner/receive">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 sm:p-8 hover:shadow-md transition-shadow cursor-pointer min-h-[200px] flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                <ClipboardCheck className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600" />
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-2">Receive Terminal</h2>
              <p className="text-sm sm:text-base text-slate-600">Receive ASN and create license plates</p>
            </div>
          </Link>

          <Link href="/scanner/process">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 sm:p-8 hover:shadow-md transition-shadow cursor-pointer min-h-[200px] flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <Workflow className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-2">Process Terminal</h2>
              <p className="text-sm sm:text-base text-slate-600">Scan WO and consume materials from inventory</p>
            </div>
          </Link>

          <Link href="/scanner/pack">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 sm:p-8 hover:shadow-md transition-shadow cursor-pointer min-h-[200px] flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <Package className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-2">Pack Terminal</h2>
              <p className="text-sm sm:text-base text-slate-600">Create finish goods from work orders</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
