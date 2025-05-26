// Google Sheets API service with real implementation
export interface GoogleSheetsConfig {
  apiKey: string
  clientId: string
  discoveryDoc: string
  scopes: string
}

export interface SheetData {
  range: string
  majorDimension: string
  values: string[][]
}

export class GoogleSheetsService {
  private gapi: any
  private isInitialized = false
  private isSignedIn = false

  constructor(private config: GoogleSheetsConfig) {}

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    // Load Google API
    await this.loadGoogleAPI()

    // Initialize the API
    await new Promise<void>((resolve) => {
      this.gapi.load("client:auth2", async () => {
        await this.gapi.client.init({
          apiKey: this.config.apiKey,
          clientId: this.config.clientId,
          discoveryDocs: [this.config.discoveryDoc],
          scope: this.config.scopes,
        })

        // Listen for sign-in state changes
        const authInstance = this.gapi.auth2.getAuthInstance()
        this.isSignedIn = authInstance.isSignedIn.get()

        resolve()
      })
    })

    this.isInitialized = true
  }

  private async loadGoogleAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window !== "undefined" && (window as any).gapi) {
        this.gapi = (window as any).gapi
        resolve()
        return
      }

      const script = document.createElement("script")
      script.src = "https://apis.google.com/js/api.js"
      script.onload = () => {
        this.gapi = (window as any).gapi
        resolve()
      }
      script.onerror = reject
      document.head.appendChild(script)
    })
  }

  async signIn(): Promise<any> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    const authInstance = this.gapi.auth2.getAuthInstance()
    const user = await authInstance.signIn()
    this.isSignedIn = true
    return user
  }

  async signOut(): Promise<void> {
    const authInstance = this.gapi.auth2.getAuthInstance()
    await authInstance.signOut()
    this.isSignedIn = false
  }

  isUserSignedIn(): boolean {
    return this.isSignedIn
  }

  async listSpreadsheets(): Promise<any[]> {
    if (!this.isSignedIn) {
      throw new Error("User not signed in")
    }

    try {
      const response = await this.gapi.client.request({
        path: "https://www.googleapis.com/drive/v3/files",
        params: {
          q: "mimeType='application/vnd.google-apps.spreadsheet'",
          fields: "files(id, name, webViewLink, modifiedTime)",
          orderBy: "modifiedTime desc",
          pageSize: 20,
        },
      })
      return response.result.files || []
    } catch (error) {
      console.error("Error listing spreadsheets:", error)
      throw new Error("Failed to fetch spreadsheets")
    }
  }

  async getSheetData(spreadsheetId: string, range = "A:Z"): Promise<SheetData> {
    if (!this.isSignedIn) {
      throw new Error("User not signed in")
    }

    try {
      const response = await this.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
        valueRenderOption: "UNFORMATTED_VALUE",
        dateTimeRenderOption: "FORMATTED_STRING",
      })
      return response.result
    } catch (error) {
      console.error("Error getting sheet data:", error)
      throw new Error("Failed to fetch sheet data")
    }
  }

  async getSheetMetadata(spreadsheetId: string): Promise<any> {
    if (!this.isSignedIn) {
      throw new Error("User not signed in")
    }

    try {
      const response = await this.gapi.client.sheets.spreadsheets.get({
        spreadsheetId,
        fields: "sheets.properties",
      })
      return response.result
    } catch (error) {
      console.error("Error getting sheet metadata:", error)
      throw new Error("Failed to fetch sheet metadata")
    }
  }

  async getSheetColumns(spreadsheetId: string, sheetName?: string): Promise<string[]> {
    try {
      const range = sheetName ? `${sheetName}!1:1` : "1:1"
      const data = await this.getSheetData(spreadsheetId, range)
      return data.values?.[0] || []
    } catch (error) {
      console.error("Error getting sheet columns:", error)
      return []
    }
  }

  transformFinancialData(sheetData: SheetData, mapping: Record<string, string>): any[] {
    if (!sheetData.values || sheetData.values.length < 2) {
      return []
    }

    const headers = sheetData.values[0]
    const rows = sheetData.values.slice(1)

    return rows
      .map((row) => {
        const item: any = {}
        Object.entries(mapping).forEach(([field, column]) => {
          const columnIndex = headers.findIndex((header) => header?.toString().toLowerCase() === column.toLowerCase())
          if (columnIndex !== -1 && row[columnIndex] !== undefined) {
            const value = row[columnIndex]
            // Convert numeric fields
            if (["revenue", "expenses", "profit", "inflow", "outflow"].includes(field)) {
              item[field] = Number.parseFloat(value?.toString().replace(/[,$]/g, "")) || 0
            } else {
              item[field] = value?.toString() || ""
            }
          }
        })
        return item
      })
      .filter((item) => Object.keys(item).length > 0)
  }

  transformPortfolioData(sheetData: SheetData, mapping: Record<string, string>): any[] {
    if (!sheetData.values || sheetData.values.length < 2) {
      return []
    }

    const headers = sheetData.values[0]
    const rows = sheetData.values.slice(1)

    return rows
      .map((row, index) => {
        const item: any = { id: index + 1 }
        Object.entries(mapping).forEach(([field, column]) => {
          const columnIndex = headers.findIndex((header) => header?.toString().toLowerCase() === column.toLowerCase())
          if (columnIndex !== -1 && row[columnIndex] !== undefined) {
            const value = row[columnIndex]
            // Convert numeric fields
            if (["workers", "contractValue"].includes(field)) {
              item[field] = Number.parseInt(value?.toString().replace(/[,$]/g, "")) || 0
            } else if (["contractStart", "contractEnd"].includes(field)) {
              // Handle date fields
              item[field] = this.parseDate(value?.toString()) || ""
            } else {
              item[field] = value?.toString() || ""
            }
          }
        })
        // Set default status if not provided
        if (!item.status) {
          item.status = "Active"
        }
        return item
      })
      .filter((item) => item.name) // Only include rows with a name
  }

  private parseDate(dateString: string): string {
    if (!dateString) return ""

    try {
      // Try to parse various date formats
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return dateString // Return original if can't parse
      }
      return date.toISOString().split("T")[0] // Return YYYY-MM-DD format
    } catch {
      return dateString
    }
  }
}

// Configuration for Google Sheets API
export const GOOGLE_SHEETS_CONFIG: GoogleSheetsConfig = {
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "",
  clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
  discoveryDoc: "https://sheets.googleapis.com/$discovery/rest?version=v4",
  scopes: "https://www.googleapis.com/auth/spreadsheets.readonly https://www.googleapis.com/auth/drive.readonly",
}
