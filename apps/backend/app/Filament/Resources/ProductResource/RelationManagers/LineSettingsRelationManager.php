<?php

namespace App\Filament\Resources\ProductResource\RelationManagers;

use BackedEnum;
use Filament\Forms;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Schemas\Schema;
use Filament\Tables;
use Filament\Tables\Table;

class LineSettingsRelationManager extends RelationManager
{
    protected static string $relationship = 'lineSettings';

    protected static ?string $title = 'Per-Line Settings';

    protected static string | BackedEnum | null $icon = 'heroicon-o-adjustments-horizontal';

    public static function canViewForRecord(\Illuminate\Database\Eloquent\Model $ownerRecord, string $pageClass): bool
    {
        return $ownerRecord->category === 'FINISHED_GOODS';
    }

    public function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Forms\Components\Select::make('machine_id')
                    ->label('Machine/Line')
                    ->relationship('machine', 'name')
                    ->required()
                    ->searchable()
                    ->columnSpan(2),

                Forms\Components\TextInput::make('std_cost')
                    ->label('Standard Cost')
                    ->numeric()
                    ->prefix('$')
                    ->step(0.01)
                    ->columnSpan(1),

                Forms\Components\TextInput::make('labor_rate')
                    ->label('Labor Rate')
                    ->numeric()
                    ->prefix('$')
                    ->step(0.01)
                    ->columnSpan(1),

                Forms\Components\TextInput::make('machine_rate')
                    ->label('Machine Rate')
                    ->numeric()
                    ->prefix('$')
                    ->step(0.01)
                    ->columnSpan(1),

                Forms\Components\TextInput::make('throughput_packs_per_min')
                    ->label('Throughput (packs/min)')
                    ->numeric()
                    ->step(0.001)
                    ->columnSpan(1),

                Forms\Components\TextInput::make('yield_cut_override')
                    ->label('Yield Cut Override (%)')
                    ->numeric()
                    ->step(0.01)
                    ->suffix('%')
                    ->columnSpan(1),
            ])
            ->columns(2);
    }

    public function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('machine.name')
            ->columns([
                Tables\Columns\TextColumn::make('machine.name')
                    ->label('Machine/Line')
                    ->sortable()
                    ->searchable(),

                Tables\Columns\TextColumn::make('std_cost')
                    ->label('Std. Cost')
                    ->money('USD')
                    ->sortable(),

                Tables\Columns\TextColumn::make('labor_rate')
                    ->label('Labor Rate')
                    ->money('USD')
                    ->sortable(),

                Tables\Columns\TextColumn::make('machine_rate')
                    ->label('Machine Rate')
                    ->money('USD')
                    ->sortable(),

                Tables\Columns\TextColumn::make('throughput_packs_per_min')
                    ->label('Throughput')
                    ->suffix(' packs/min')
                    ->sortable(),

                Tables\Columns\TextColumn::make('yield_cut_override')
                    ->label('Yield Override')
                    ->suffix('%')
                    ->sortable(),

                Tables\Columns\TextColumn::make('updated_at')
                    ->label('Updated')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(),
            ])
            ->filters([
                //
            ])
            ->headerActions([
                Tables\Actions\CreateAction::make(),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }
}
