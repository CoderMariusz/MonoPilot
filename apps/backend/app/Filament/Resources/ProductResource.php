<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ProductResource\Pages;
use App\Filament\Resources\ProductResource\RelationManagers;
use App\Models\Product;
use BackedEnum;
use Filament\Forms;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables;
use Filament\Tables\Table;

class ProductResource extends Resource
{
    protected static ?string $model = Product::class;

    protected static string | BackedEnum | null $navigationIcon = 'heroicon-o-cube';

    protected static ?int $navigationSort = 1;

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Forms\Components\Section::make('Product Information')
                    ->schema([
                        Forms\Components\TextInput::make('part_number')
                            ->label('Part Number')
                            ->required()
                            ->unique(ignoreRecord: true)
                            ->maxLength(255)
                            ->columnSpan(1),

                        Forms\Components\TextInput::make('description')
                            ->label('Description')
                            ->required()
                            ->maxLength(255)
                            ->columnSpan(2),

                        Forms\Components\Select::make('category')
                            ->label('Category')
                            ->required()
                            ->options([
                                'MEAT' => 'Meat',
                                'DRYGOODS' => 'Dry Goods',
                                'FINISHED_GOODS' => 'Finished Goods',
                                'PROCESS' => 'Process',
                            ])
                            ->live()
                            ->afterStateUpdated(function ($state, callable $set) {
                                $typeMapping = [
                                    'MEAT' => 'RM',
                                    'DRYGOODS' => 'RM',
                                    'PROCESS' => 'WIP',
                                    'FINISHED_GOODS' => 'FG',
                                ];
                                $set('type', $typeMapping[$state] ?? 'RM');
                            })
                            ->columnSpan(1),

                        Forms\Components\Select::make('subtype')
                            ->label('Subtype')
                            ->options([
                                'RAW' => 'Raw',
                                'PACKAGING' => 'Packaging',
                                'SUPPLIES' => 'Supplies',
                            ])
                            ->visible(fn (callable $get) => $get('category') === 'DRYGOODS')
                            ->columnSpan(1),

                        Forms\Components\TextInput::make('type')
                            ->label('Type')
                            ->disabled()
                            ->dehydrated()
                            ->columnSpan(1),

                        Forms\Components\TextInput::make('uom')
                            ->label('Unit of Measure')
                            ->required()
                            ->maxLength(50)
                            ->placeholder('e.g., kg, pcs, box')
                            ->columnSpan(1),

                        Forms\Components\TextInput::make('std_price')
                            ->label('Standard Price')
                            ->numeric()
                            ->minValue(0)
                            ->prefix('$')
                            ->step(0.01)
                            ->columnSpan(1),

                        Forms\Components\Toggle::make('is_active')
                            ->label('Is Active')
                            ->default(true)
                            ->columnSpan(1),
                    ])
                    ->columns(3),

                Forms\Components\Section::make('Expiry Information')
                    ->schema([
                        Forms\Components\Select::make('expiry_policy')
                            ->label('Expiry Policy')
                            ->options([
                                'DAYS_STATIC' => 'Days Static',
                                'FROM_MFG_DATE' => 'From Manufacturing Date',
                                'FROM_DELIVERY_DATE' => 'From Delivery Date',
                                'FROM_CREATION_DATE' => 'From Creation Date',
                            ])
                            ->live()
                            ->nullable()
                            ->columnSpan(1),

                        Forms\Components\TextInput::make('shelf_life_days')
                            ->label('Shelf Life (Days)')
                            ->numeric()
                            ->minValue(1)
                            ->required(fn (callable $get) => $get('expiry_policy') === 'DAYS_STATIC')
                            ->visible(fn (callable $get) => $get('expiry_policy') === 'DAYS_STATIC')
                            ->columnSpan(1),
                    ])
                    ->columns(2)
                    ->collapsible(),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('part_number')
                    ->label('Part Number')
                    ->searchable()
                    ->sortable(),

                Tables\Columns\TextColumn::make('description')
                    ->label('Name/Description')
                    ->searchable()
                    ->sortable()
                    ->wrap(),

                Tables\Columns\TextColumn::make('category')
                    ->label('Category')
                    ->badge()
                    ->colors([
                        'success' => 'MEAT',
                        'warning' => 'DRYGOODS',
                        'primary' => 'FINISHED_GOODS',
                        'gray' => 'PROCESS',
                    ])
                    ->formatStateUsing(fn (string $state): string => match($state) {
                        'MEAT' => 'Meat',
                        'DRYGOODS' => 'Dry Goods',
                        'FINISHED_GOODS' => 'Finished Goods',
                        'PROCESS' => 'Process',
                        default => $state,
                    })
                    ->sortable(),

                Tables\Columns\TextColumn::make('type')
                    ->label('Type')
                    ->badge()
                    ->colors([
                        'success' => 'RM',
                        'warning' => 'WIP',
                        'primary' => 'FG',
                    ])
                    ->formatStateUsing(fn (?string $state): string => match($state) {
                        'RM' => 'Raw Material',
                        'WIP' => 'Work in Progress',
                        'FG' => 'Finished Goods',
                        default => $state ?? 'N/A',
                    })
                    ->sortable(),

                Tables\Columns\TextColumn::make('uom')
                    ->label('UoM')
                    ->sortable(),

                Tables\Columns\TextColumn::make('std_price')
                    ->label('Std. Price')
                    ->money('USD')
                    ->sortable(),

                Tables\Columns\TextColumn::make('activeBom.version')
                    ->label('Active BOM Version')
                    ->default('N/A')
                    ->sortable(),

                Tables\Columns\ToggleColumn::make('is_active')
                    ->label('Is Active')
                    ->sortable(),

                Tables\Columns\TextColumn::make('updated_at')
                    ->label('Updated At')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('category')
                    ->label('Category')
                    ->options([
                        'MEAT' => 'Meat',
                        'DRYGOODS' => 'Dry Goods',
                        'FINISHED_GOODS' => 'Finished Goods',
                        'PROCESS' => 'Process',
                    ]),

                Tables\Filters\SelectFilter::make('type')
                    ->label('Type')
                    ->options([
                        'RM' => 'Raw Material',
                        'WIP' => 'Work in Progress',
                        'FG' => 'Finished Goods',
                    ]),

                Tables\Filters\SelectFilter::make('expiry_policy')
                    ->label('Expiry Policy')
                    ->options([
                        'DAYS_STATIC' => 'Days Static',
                        'FROM_MFG_DATE' => 'From Manufacturing Date',
                        'FROM_DELIVERY_DATE' => 'From Delivery Date',
                        'FROM_CREATION_DATE' => 'From Creation Date',
                    ]),

                Tables\Filters\TernaryFilter::make('is_active')
                    ->label('Is Active')
                    ->placeholder('All products')
                    ->trueLabel('Active only')
                    ->falseLabel('Inactive only'),
            ])
            ->actions([
                Tables\Actions\ViewAction::make(),
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('updated_at', 'desc');
    }

    public static function getRelations(): array
    {
        return [
            RelationManagers\BomsRelationManager::class,
            RelationManagers\LineSettingsRelationManager::class,
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListProducts::route('/'),
            'create' => Pages\CreateProduct::route('/create'),
            'edit' => Pages\EditProduct::route('/{record}/edit'),
        ];
    }
}
