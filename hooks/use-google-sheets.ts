"use client"

import { useState, useEffect, useCallback } from "react"
import { GoogleSheetsService, GOOGLE_SHEETS_CONFIG } from "../components/google-sheets-service"

interface UseGoogleSheetsReturn {
  isConnected: boolean
  isLoading: boolean
  error: string | null
  sheetsService: GoogleSheetsService | null
  connect: () => Promise<void>
  disconnect: () => Promise<void>
}

export function useGoogleSheets(): UseGoogleSheetsReturn {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sheetsService, setSheetsService] = useState<GoogleSheetsService | null>(null)

  useEffect(() => {
    // Initialize the service
    const service = new GoogleSheetsService(GOOGLE_SHEETS_CONFIG)
    setSheetsService(service)
  }, [])

  const connect = useCallback(async () => {
    if (!sheetsService) return

    setIsLoading(true)
    setError(null)

    try {
      await sheetsService.initialize()
      await sheetsService.signIn()
      setIsConnected(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect to Google Sheets")
      setIsConnected(false)
    } finally {
      setIsLoading(false)
    }
  }, [sheetsService])

  const disconnect = useCallback(async () => {
    if (!sheetsService) return

    try {
      await sheetsService.signOut()
      setIsConnected(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disconnect from Google Sheets")
    }
  }, [sheetsService])

  return {
    isConnected,
    isLoading,
    error,
    sheetsService,
    connect,
    disconnect,
  }
}
