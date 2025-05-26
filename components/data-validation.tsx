"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react"

interface ValidationResult {
  field: string
  status: "valid" | "warning" | "error"
  message: string
  count?: number
}

interface DataValidationProps {
  results: ValidationResult[]
  totalRows: number
}

export function DataValidation({ results, totalRows }: DataValidationProps) {
  const validCount = results.filter((r) => r.status === "valid").length
  const warningCount = results.filter((r) => r.status === "warning").length
  const errorCount = results.filter((r) => r.status === "error").length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Data Validation Results</h4>
        <div className="flex space-x-2">
          <Badge variant="outline" className="bg-green-50 text-green-700">
            <CheckCircle className="h-3 w-3 mr-1" />
            {validCount} Valid
          </Badge>
          {warningCount > 0 && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {warningCount} Warnings
            </Badge>
          )}
          {errorCount > 0 && (
            <Badge variant="outline" className="bg-red-50 text-red-700">
              <XCircle className="h-3 w-3 mr-1" />
              {errorCount} Errors
            </Badge>
          )}
        </div>
      </div>

      <div className="text-sm text-gray-600">Processed {totalRows} rows from Google Sheets</div>

      <div className="space-y-2">
        {results.map((result, index) => (
          <Alert
            key={index}
            className={
              result.status === "valid"
                ? "border-green-200 bg-green-50"
                : result.status === "warning"
                  ? "border-yellow-200 bg-yellow-50"
                  : "border-red-200 bg-red-50"
            }
          >
            {result.status === "valid" ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : result.status === "warning" ? (
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertTitle className="capitalize">{result.field}</AlertTitle>
            <AlertDescription>
              {result.message}
              {result.count && ` (${result.count} items)`}
            </AlertDescription>
          </Alert>
        ))}
      </div>
    </div>
  )
}
