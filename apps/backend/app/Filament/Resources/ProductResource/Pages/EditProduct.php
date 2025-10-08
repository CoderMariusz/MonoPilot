<?php

namespace App\Filament\Resources\ProductResource\Pages;

use App\Filament\Resources\ProductResource;
use Filament\Actions;
use Filament\Forms;
use Filament\Resources\Pages\EditRecord;
use Filament\Schemas\Schema;

class EditProduct extends EditRecord
{
    protected static string $resource = ProductResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }

    protected function getRedirectUrl(): string
    {
        return $this->getResource()::getUrl('index');
    }

    public function hasCombinedRelationManagerTabsWithContent(): bool
    {
        return true;
    }

    public function getContentTabLabel(): ?string
    {
        return 'Details';
    }

    public function getContentTabIcon(): ?string
    {
        return 'heroicon-o-information-circle';
    }

    protected function afterFormSchemaExtended(Schema $schema): Schema
    {
        return $schema
            ->components(array_merge(
                $schema->getComponents(),
                [
                    Forms\Components\Section::make('Audit Information')
                        ->schema([
                            Forms\Components\Placeholder::make('created_at')
                                ->label('Created At')
                                ->content(fn ($record): string => $record?->created_at?->format('F j, Y, g:i a') ?? 'N/A'),
                            
                            Forms\Components\Placeholder::make('updated_at')
                                ->label('Updated At')
                                ->content(fn ($record): string => $record?->updated_at?->format('F j, Y, g:i a') ?? 'N/A'),
                        ])
                        ->columns(2)
                        ->collapsible(),
                ]
            ));
    }
}
