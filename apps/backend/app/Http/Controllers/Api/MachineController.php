<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Machine;
use Illuminate\Http\Request;

class MachineController extends Controller
{
    public function index()
    {
        $machines = Machine::where('is_active', true)
            ->orderBy('name', 'asc')
            ->get();

        return response()->json($machines);
    }

    public function show(Machine $machine)
    {
        return response()->json($machine);
    }
}
