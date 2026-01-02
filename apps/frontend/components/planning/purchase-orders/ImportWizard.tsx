/**
 * Import Wizard - Main Container
 * Story: 03.6 - PO Bulk Operations
 * 4-step import wizard modal per PLAN-007
 */

'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import {
  useValidateImport,
  useExecuteImport,
  useDownloadTemplate,
  useBulkSubmitPOs,
  downloadFile,
  generateExportFilename,
} from '@/lib/hooks/use-bulk-po-operations'
import { ImportWizardStepUpload } from './ImportWizardStepUpload'
import { ImportWizardStepPreview } from './ImportWizardStepPreview'
import { ImportWizardStepValidate } from './ImportWizardStepValidate'
import { ImportWizardStepResults } from './ImportWizardStepResults'
import type {
  ImportWizardStep,
  ImportWizardState,
  ValidationResult,
  BulkCreatePOResult,
  ImportGroup,
} from '@/lib/types/po-bulk'

interface ImportWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete?: (result: BulkCreatePOResult) => void
}

const STEP_LABELS = ['Upload', 'Preview', 'Validate', 'Create'] as const

function StepIndicator({
  currentStep,
  isProcessing,
}: {
  currentStep: ImportWizardStep
  isProcessing: boolean
}) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6" role="tablist" aria-label="Import wizard steps">
      {STEP_LABELS.map((label, index) => {
        const stepNum = (index + 1) as ImportWizardStep
        const isActive = stepNum === currentStep
        const isComplete = stepNum < currentStep
        const isCurrent = stepNum === currentStep && isProcessing

        return (
          <div key={label} className="flex items-center">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : isComplete
                  ? 'bg-green-500 text-white'
                  : 'bg-muted text-muted-foreground'
              }`}
              role="tab"
              aria-selected={isActive}
              aria-label={`Step ${stepNum}: ${label}${isComplete ? ' (completed)' : ''}`}
            >
              {isComplete ? (
                <Check className="h-4 w-4" />
              ) : isCurrent ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                stepNum
              )}
            </div>
            <span
              className={`ml-2 text-sm ${
                isActive ? 'font-medium' : 'text-muted-foreground'
              }`}
            >
              {label}
            </span>
            {index < STEP_LABELS.length - 1 && (
              <div
                className={`w-12 h-0.5 mx-3 ${
                  isComplete ? 'bg-green-500' : 'bg-muted'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export function ImportWizard({ open, onOpenChange, onComplete }: ImportWizardProps) {
  const router = useRouter()
  const { toast } = useToast()

  // State
  const [state, setState] = useState<ImportWizardState>({
    step: 1,
    file: null,
    fileName: '',
    parsedRows: [],
    groups: [],
    validationResult: null,
    createResult: null,
    isProcessing: false,
    processingMessage: '',
    processingProgress: 0,
    error: null,
  })

  // Mutations
  const validateImport = useValidateImport()
  const executeImport = useExecuteImport()
  const downloadTemplate = useDownloadTemplate()
  const bulkSubmit = useBulkSubmitPOs()

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setState({
        step: 1,
        file: null,
        fileName: '',
        parsedRows: [],
        groups: [],
        validationResult: null,
        createResult: null,
        isProcessing: false,
        processingMessage: '',
        processingProgress: 0,
        error: null,
      })
    }
  }, [open])

  // Handlers
  const handleFileSelect = useCallback(async (file: File) => {
    setState((prev) => ({
      ...prev,
      file,
      fileName: file.name,
      error: null,
    }))
  }, [])

  const handleDownloadTemplate = useCallback(async () => {
    try {
      const blob = await downloadTemplate.mutateAsync()
      downloadFile(blob, 'PO_Import_Template.xlsx')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download template',
        variant: 'destructive',
      })
    }
  }, [downloadTemplate, toast])

  const handleNext = useCallback(async () => {
    if (state.step === 1 && state.file) {
      // Step 1 -> 2: Validate file and show preview
      setState((prev) => ({
        ...prev,
        isProcessing: true,
        processingMessage: 'Parsing file...',
      }))

      try {
        const result = await validateImport.mutateAsync(state.file)
        setState((prev) => ({
          ...prev,
          step: 2,
          validationResult: result,
          groups: result.groups,
          parsedRows: [...result.valid_rows, ...result.error_rows, ...result.warning_rows],
          isProcessing: false,
        }))
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          error: error instanceof Error ? error.message : 'Failed to parse file',
        }))
        toast({
          title: 'Parse Error',
          description: error instanceof Error ? error.message : 'Failed to parse file',
          variant: 'destructive',
        })
      }
    } else if (state.step === 2) {
      // Step 2 -> 3: Move to validation
      setState((prev) => ({ ...prev, step: 3 }))
    } else if (state.step === 3 && state.validationResult) {
      // Step 3 -> 4: Execute import
      const hasErrors = state.validationResult.error_rows.length > 0
      if (hasErrors) {
        toast({
          title: 'Cannot Proceed',
          description: 'Please fix all errors before creating POs',
          variant: 'destructive',
        })
        return
      }

      setState((prev) => ({
        ...prev,
        step: 4,
        isProcessing: true,
        processingMessage: 'Creating Purchase Orders...',
        processingProgress: 0,
      }))

      try {
        // Simulate progress
        const progressInterval = setInterval(() => {
          setState((prev) => ({
            ...prev,
            processingProgress: Math.min(prev.processingProgress + 10, 90),
          }))
        }, 500)

        const result = await executeImport.mutateAsync(state.groups)

        clearInterval(progressInterval)

        setState((prev) => ({
          ...prev,
          createResult: result,
          isProcessing: false,
          processingProgress: 100,
        }))

        if (onComplete) {
          onComplete(result)
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          error: error instanceof Error ? error.message : 'Failed to create POs',
        }))
        toast({
          title: 'Import Error',
          description: error instanceof Error ? error.message : 'Failed to create POs',
          variant: 'destructive',
        })
      }
    }
  }, [state, validateImport, executeImport, toast, onComplete])

  const handleBack = useCallback(() => {
    setState((prev) => ({
      ...prev,
      step: Math.max(1, prev.step - 1) as ImportWizardStep,
    }))
  }, [])

  const handleEditGroup = useCallback((groupIndex: number) => {
    // TODO: Open edit group modal
    toast({
      title: 'Edit Group',
      description: `Editing group ${groupIndex + 1}`,
    })
  }, [toast])

  const handleChangeFile = useCallback(() => {
    setState((prev) => ({
      ...prev,
      step: 1,
      file: null,
      fileName: '',
      parsedRows: [],
      groups: [],
      validationResult: null,
    }))
  }, [])

  const handleViewPO = useCallback(
    (poId: string) => {
      router.push(`/planning/purchase-orders/${poId}`)
      onOpenChange(false)
    },
    [router, onOpenChange]
  )

  const handleSubmitPO = useCallback(
    async (poId: string) => {
      try {
        await bulkSubmit.mutateAsync([poId])
        toast({
          title: 'Success',
          description: 'PO submitted successfully',
        })
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to submit PO',
          variant: 'destructive',
        })
      }
    },
    [bulkSubmit, toast]
  )

  const handleSubmitAll = useCallback(async () => {
    if (!state.createResult) return

    const draftIds = state.createResult.pos_created
      .filter((po) => po.status === 'draft')
      .map((po) => po.po_id)

    if (draftIds.length === 0) {
      toast({
        title: 'No POs to Submit',
        description: 'All POs have already been submitted',
      })
      return
    }

    try {
      await bulkSubmit.mutateAsync(draftIds)
      toast({
        title: 'Success',
        description: `${draftIds.length} POs submitted successfully`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit POs',
        variant: 'destructive',
      })
    }
  }, [state.createResult, bulkSubmit, toast])

  const handleViewPOList = useCallback(() => {
    router.push('/planning/purchase-orders')
    onOpenChange(false)
  }, [router, onOpenChange])

  const handleImportMore = useCallback(() => {
    setState({
      step: 1,
      file: null,
      fileName: '',
      parsedRows: [],
      groups: [],
      validationResult: null,
      createResult: null,
      isProcessing: false,
      processingMessage: '',
      processingProgress: 0,
      error: null,
    })
  }, [])

  const handleClose = useCallback(() => {
    onOpenChange(false)
  }, [onOpenChange])

  // Determine if Next button should be enabled
  const canProceed = () => {
    switch (state.step) {
      case 1:
        return state.file !== null && !state.isProcessing
      case 2:
        return state.groups.length > 0 && !state.isProcessing
      case 3:
        return (
          state.validationResult !== null &&
          state.validationResult.error_rows.length === 0 &&
          !state.isProcessing
        )
      case 4:
        return !state.isProcessing
      default:
        return false
    }
  }

  // Get button labels
  const getNextLabel = () => {
    switch (state.step) {
      case 1:
        return state.isProcessing ? 'Parsing...' : 'Next: Preview'
      case 2:
        return 'Next: Validate'
      case 3:
        return state.isProcessing ? 'Creating...' : 'Next: Create POs'
      default:
        return 'Next'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        aria-describedby="import-wizard-description"
      >
        <DialogHeader>
          <DialogTitle>Import Purchase Orders</DialogTitle>
          <DialogDescription id="import-wizard-description">
            Step {state.step} of 4: {STEP_LABELS[state.step - 1]}
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <StepIndicator currentStep={state.step} isProcessing={state.isProcessing} />

        {/* Step Content */}
        <div className="min-h-[400px]">
          {state.step === 1 && (
            <ImportWizardStepUpload
              onFileSelect={handleFileSelect}
              onDownloadTemplate={handleDownloadTemplate}
              isDownloadingTemplate={downloadTemplate.isPending}
            />
          )}

          {state.step === 2 && state.validationResult && (
            <ImportWizardStepPreview
              fileName={state.fileName}
              groups={state.groups}
              totalRows={state.parsedRows.length}
              onEditGroup={handleEditGroup}
              onChangeFile={handleChangeFile}
            />
          )}

          {state.step === 3 && state.validationResult && (
            <ImportWizardStepValidate
              validationResult={state.validationResult}
            />
          )}

          {state.step === 4 && (
            <>
              {state.isProcessing ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                  <p className="text-lg font-medium mb-2">{state.processingMessage}</p>
                  <Progress
                    value={state.processingProgress}
                    className="w-64 mb-2"
                    aria-label="Import progress"
                  />
                  <p className="text-sm text-muted-foreground">
                    {state.processingProgress}% ({Math.round(state.groups.length * state.processingProgress / 100)} of {state.groups.length} POs)
                  </p>
                  <p className="text-xs text-muted-foreground mt-4">
                    Please wait, do not close this window.
                  </p>
                </div>
              ) : state.createResult ? (
                <ImportWizardStepResults
                  result={state.createResult}
                  onViewPO={handleViewPO}
                  onSubmitPO={handleSubmitPO}
                  onSubmitAll={handleSubmitAll}
                  onViewPOList={handleViewPOList}
                  onImportMore={handleImportMore}
                  onClose={handleClose}
                />
              ) : null}
            </>
          )}
        </div>

        {/* Footer Buttons */}
        {state.step < 4 && (
          <DialogFooter className="gap-2">
            {state.step > 1 && !state.isProcessing && (
              <Button variant="outline" onClick={handleBack}>
                Back: {STEP_LABELS[state.step - 2]}
              </Button>
            )}
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleNext} disabled={!canProceed()}>
              {state.isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {getNextLabel()}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default ImportWizard
