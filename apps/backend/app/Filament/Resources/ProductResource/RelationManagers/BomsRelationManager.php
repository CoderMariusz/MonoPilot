<?php

namespace App\Filament\Resources\ProductResource\RelationManagers;

use BackedEnum;
use Filament\Forms;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Schemas\Schema;
use Filament\Tables;
use Filament\Tables\Table;

class BomsRelationManager extends RelationManager
{
    protected static string $relationship = 'boms';

    protected static ?string $title = 'Bill of Materials';

    protected static string | BackedEnum | null $icon = 'heroicon-o-clipboard-document-list';

    public function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Forms\Components\TextInput::make('version')
                    ->label('Version')
                    ->required()
                    ->maxLength(255),

                Forms\Components\Toggle::make('is_active')
                    ->label('Is Active')
                    ->default(false)
                    ->helperText('Only one BOM version should be active at a time'),

                Forms\Components\Repeater::make('bomItems')
                    ->relationship('bomItems')
                    ->label('BOM Items')
                    ->schema([
                        Forms\Components\Select::make('material_id')
                            ->label('Material')
                            ->relationship('material', 'description')
                            ->searchable()
                            ->required()
                            ->columnSpan(2),

                        Forms\Components\TextInput::make('quantity')
                            ->label('Quantity')
                            ->numeric()
                            ->required()
                            ->step(0.0001)
                            ->columnSpan(1),

                        Forms\Components\TextInput::make('uom')
                            ->label('UoM')
                            ->required()
                            ->maxLength(50)
                            ->columnSpan(1),

                        Forms\Components\TextInput::make('sequence')
                            ->label('Sequence')
                            ->numeric()
                            ->default(0)
                            ->columnSpan(1),
                    ])
                    ->columns(5)
                    ->defaultItems(0)
                    ->addActionLabel('Add Material')
                    ->collapsible()
                    ->itemLabel(fn (array $state): ?string => 
                        isset($state['material_id']) 
                            ? \App\Models\Product::find($state['material_id'])?->description 
                            : 'New Item'
                    ),
            ]);
    }

    public function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('version')
            ->columns([
                Tables\Columns\TextColumn::make('version')
                    ->label('Version')
                    ->sortable(),

                Tables\Columns\IconColumn::make('is_active')
                    ->label('Active')
                    ->boolean()
                    ->sortable(),

                Tables\Columns\TextColumn::make('bomItems_count')
                    ->label('Items Count')
                    ->counts('bomItems')
                    ->sortable(),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('Created')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(),

                Tables\Columns\TextColumn::make('updated_at')
                    ->label('Updated')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(),
            ])
            ->filters([
                Tables\Filters\TernaryFilter::make('is_active')
                    ->label('Active Status')
                    ->placeholder('All versions')
                    ->trueLabel('Active only')
                    ->falseLabel('Inactive only'),
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
            ])
            ->defaultSort('version', 'desc');
    }
}
