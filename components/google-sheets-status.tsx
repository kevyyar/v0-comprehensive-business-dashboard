"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, CheckCircle, AlertCircle, RefreshCw } from "lucide-react"

interface GoogleSheetsStatusProps {
  isConnected: boolean
  isLoading: boolean
  error: string | null
  lastSync: Date | null
  onRefresh: () => void
}

export function GoogleSheetsStatus({ isConnected, isLoading, error, lastSync, onRefresh }: GoogleSheetsStatusProps) {
  return (
    <div className="flex items-center space-x-2">
      {isConnected ? (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Google Sheets Connected
        </Badge>
      ) : error ? (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <AlertCircle className="h-3 w-3 mr-1" />
          Connection Error
        </Badge>
      ) : (
        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
          <Sheet className="h-3 w-3 mr-1" />
          Not Connected
        </Badge>
      )}

      {isConnected && (
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading} className="h-7">
          {isLoading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
        </Button>
      )}

      {lastSync && <span className="text-xs text-gray-500">Last sync: {lastSync.toLocaleTimeString()}</span>}
    </div>
  )
}
