/**
 * PO Import Page
 * Story: 03.6 - PO Bulk Operations
 * Full-page import wizard as alternative to modal
 */

'use client'

import { useCallback, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { PlanningHeader } from '@/components/planning/PlanningHeader'
import {
  useValidateImport,
  useExecuteImport,
  useDownloadTemplate,
  useBulkSubmitPOs,
  downloadFile,
} from '@/lib/hooks/use-bulk-po-operations'
import { ImportWizardStepUpload } from '@/components/planning/purchase-orders/ImportWizardStepUpload'
import { ImportWizardStepPreview } from '@/components/planning/purchase-orders/ImportWizardStepPreview'
import { ImportWizardStepValidate } from '@/components/planning/purchase-orders/ImportWizardStepValidate'
import { ImportWizardStepResults } from '@/components/planning/purchase-orders/ImportWizardStepResults'
import type {
  ImportWizardStep,
  ValidationResult,
  BulkCreatePOResult,
  ImportGroup,
  ImportRowWithValidation,
} from '@/lib/types/po-bulk'

const STEP_LABELS = ['Upload', 'Preview', 'Validate', 'Create'] as const

function StepIndicator({
  currentStep,
  isProcessing,
}: {
  currentStep: ImportWizardStep
  isProcessing: boolean
}) {
  return (
    <nav className="flex items-center justify-center gap-2" aria-label="Import wizard progress">
      {STEP_LABELS.map((label, index) => {
        const stepNum = (index + 1) as ImportWizardStep
        const isActive = stepNum === currentStep
        const isComplete = stepNum < currentStep
        const isCurrent = stepNum === currentStep && isProcessing

        return (
          <div key={label} className="flex items-center">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : isComplete
                  ? 'bg-green-500 text-white'
                  : 'bg-muted text-muted-foreground'
              }`}
              aria-current={isActive ? 'step' : undefined}
            >
              {isComplete ? (
                <Check className="h-5 w-5" />
              ) : isCurrent ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                stepNum
              )}
            </div>
            <span
              className={`ml-2 text-sm hidden sm:inline ${
                isActive ? 'font-medium' : 'text-muted-foreground'
              }`}
            >
              {label}
            </span>
            {index < STEP_LABELS.length - 1 && (
              <div
                className={`w-8 sm:w-16 h-0.5 mx-2 sm:mx-4 ${
                  isComplete ? 'bg-green-500' : 'bg-muted'
                }`}
                aria-hidden="true"
              />
            )}
          </div>
        )
      })}
    </nav>
  )
}

export default function POImportPage() {
  const router = useRouter()
  const { toast } = useToast()

  // State
  const [step, setStep] = useState<ImportWizardStep>(1)
  const [file, setFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState('')
  const [parsedRows, setParsedRows] = useState<ImportRowWithValidation[]>([])
  const [groups, setGroups] = useState<ImportGroup[]>([])
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [createResult, setCreateResult] = useState<BulkCreatePOResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingMessage, setProcessingMessage] = useState('')
  const [processingProgress, setProcessingProgress] = useState(0)

  // Mutations
  const validateImport = useValidateImport()
  const executeImport = useExecuteImport()
  const downloadTemplate = useDownloadTemplate()
  const bulkSubmit = useBulkSubmitPOs()

  // Handlers
  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setFile(selectedFile)
    setFileName(selectedFile.name)
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
    if (step === 1 && file) {
      setIsProcessing(true)
      setProcessingMessage('Parsing file...')

      try {
        const result = await validateImport.mutateAsync(file)
        setValidationResult(result)
        setGroups(result.groups)
        setParsedRows([...result.valid_rows, ...result.error_rows, ...result.warning_rows])
        setStep(2)
      } catch (error) {
        toast({
          title: 'Parse Error',
          description: error instanceof Error ? error.message : 'Failed to parse file',
          variant: 'destructive',
        })
      } finally {
        setIsProcessing(false)
      }
    } else if (step === 2) {
      setStep(3)
    } else if (step === 3 && validationResult) {
      const hasErrors = validationResult.error_rows.length > 0
      if (hasErrors) {
        toast({
          title: 'Cannot Proceed',
          description: 'Please fix all errors before creating POs',
          variant: 'destructive',
        })
        return
      }

      setStep(4)
      setIsProcessing(true)
      setProcessingMessage('Creating Purchase Orders...')
      setProcessingProgress(0)

      try {
        const progressInterval = setInterval(() => {
          setProcessingProgress((prev) => Math.min(prev + 10, 90))
        }, 500)

        const result = await executeImport.mutateAsync(groups)

        clearInterval(progressInterval)
        setProcessingProgress(100)
        setCreateResult(result)
      } catch (error) {
        toast({
          title: 'Import Error',
          description: error instanceof Error ? error.message : 'Failed to create POs',
          variant: 'destructive',
        })
      } finally {
        setIsProcessing(false)
      }
    }
  }, [step, file, validateImport, groups, validationResult, executeImport, toast])

  const handleBack = useCallback(() => {
    setStep((prev) => Math.max(1, prev - 1) as ImportWizardStep)
  }, [])

  const handleChangeFile = useCallback(() => {
    setStep(1)
    setFile(null)
    setFileName('')
    setParsedRows([])
    setGroups([])
    setValidationResult(null)
  }, [])

  const handleViewPO = useCallback(
    (poId: string) => {
      router.push(`/planning/purchase-orders/${poId}`)
    },
    [router]
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
    if (!createResult) return

    const draftIds = createResult.pos_created
      .filter((po) => po.status === 'draft')
      .map((po) => po.po_id)

    if (draftIds.length === 0) {
      toast({ title: 'No POs to Submit', description: 'All POs have already been submitted' })
      return
    }

    try {
      await bulkSubmit.mutateAsync(draftIds)
      toast({ title: 'Success', description: `${draftIds.length} POs submitted successfully` })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit POs',
        variant: 'destructive',
      })
    }
  }, [createResult, bulkSubmit, toast])

  const handleViewPOList = useCallback(() => {
    router.push('/planning/purchase-orders')
  }, [router])

  const handleImportMore = useCallback(() => {
    setStep(1)
    setFile(null)
    setFileName('')
    setParsedRows([])
    setGroups([])
    setValidationResult(null)
    setCreateResult(null)
    setProcessingProgress(0)
  }, [])

  // Determine if Next button should be enabled
  const canProceed = () => {
    switch (step) {
      case 1:
        return file !== null && !isProcessing
      case 2:
        return groups.length > 0 && !isProcessing
      case 3:
        return (
          validationResult !== null &&
          validationResult.error_rows.length === 0 &&
          !isProcessing
        )
      case 4:
        return !isProcessing
      default:
        return false
    }
  }

  const getNextLabel = () => {
    switch (step) {
      case 1:
        return isProcessing ? 'Parsing...' : 'Next: Preview'
      case 2:
        return 'Next: Validate'
      case 3:
        return isProcessing ? 'Creating...' : 'Next: Create POs'
      default:
        return 'Next'
    }
  }

  return (
    <div>
      <PlanningHeader currentPage="po" />

      <div className="px-6 py-6">
        {/* Page Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/planning/purchase-orders">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back to Purchase Orders</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Import Purchase Orders</h1>
            <p className="text-muted-foreground text-sm">
              Step {step} of 4: {STEP_LABELS[step - 1]}
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <StepIndicator currentStep={step} isProcessing={isProcessing} />
          </CardContent>
        </Card>

        {/* Step Content */}
        <Card className="min-h-[500px]">
          <CardContent className="p-6">
            {step === 1 && (
              <ImportWizardStepUpload
                onFileSelect={handleFileSelect}
                onDownloadTemplate={handleDownloadTemplate}
                isDownloadingTemplate={downloadTemplate.isPending}
              />
            )}

            {step === 2 && validationResult && (
              <ImportWizardStepPreview
                fileName={fileName}
                groups={groups}
                totalRows={parsedRows.length}
                onChangeFile={handleChangeFile}
              />
            )}

            {step === 3 && validationResult && (
              <ImportWizardStepValidate validationResult={validationResult} />
            )}

            {step === 4 && (
              <>
                {isProcessing ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Loader2 className="h-16 w-16 animate-spin text-primary mb-6" />
                    <p className="text-xl font-medium mb-4">{processingMessage}</p>
                    <Progress
                      value={processingProgress}
                      className="w-80 mb-3"
                      aria-label="Import progress"
                    />
                    <p className="text-muted-foreground">
                      {processingProgress}% ({Math.round(groups.length * processingProgress / 100)} of {groups.length} POs)
                    </p>
                    <p className="text-sm text-muted-foreground mt-6">
                      Please wait, do not close this page.
                    </p>
                  </div>
                ) : createResult ? (
                  <ImportWizardStepResults
                    result={createResult}
                    onViewPO={handleViewPO}
                    onSubmitPO={handleSubmitPO}
                    onSubmitAll={handleSubmitAll}
                    onViewPOList={handleViewPOList}
                    onImportMore={handleImportMore}
                  />
                ) : null}
              </>
            )}
          </CardContent>
        </Card>

        {/* Footer Navigation */}
        {step < 4 && (
          <div className="flex justify-between mt-6">
            <div>
              {step > 1 && !isProcessing && (
                <Button variant="outline" onClick={handleBack}>
                  Back: {STEP_LABELS[step - 2]}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Link href="/planning/purchase-orders">
                <Button variant="ghost">Cancel</Button>
              </Link>
              <Button onClick={handleNext} disabled={!canProceed()}>
                {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {getNextLabel()}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
