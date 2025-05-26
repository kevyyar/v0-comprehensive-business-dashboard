"use client"

import { DialogTrigger } from "@/components/ui/dialog"

import { useState, useEffect, useRef } from "react"
import {
  Building2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Plus,
  Search,
  Filter,
  Download,
  Bell,
  Settings,
  BarChart3,
  PieChart,
  Home,
  Sheet,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Upload,
  Link,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  Pie,
  Area,
  AreaChart,
} from "recharts"

import { GoogleSheetsService, GOOGLE_SHEETS_CONFIG } from "../components/google-sheets-service"

// Google Sheets integration types
interface GoogleSheet {
  id: string
  name: string
  url: string
}

interface ColumnMapping {
  sheetColumn: string
  dashboardField: string
}

interface ImportStatus {
  isConnected: boolean
  isLoading: boolean
  lastSync: Date | null
  error: string | null
  success: string | null
}

// Sample data (will be replaced by Google Sheets data)
const initialRevenueData = [
  { month: "Jan", revenue: 45000, expenses: 32000, profit: 13000 },
  { month: "Feb", revenue: 52000, expenses: 35000, profit: 17000 },
  { month: "Mar", revenue: 48000, expenses: 33000, profit: 15000 },
  { month: "Apr", revenue: 61000, expenses: 38000, profit: 23000 },
  { month: "May", revenue: 55000, expenses: 36000, profit: 19000 },
  { month: "Jun", revenue: 67000, expenses: 41000, profit: 26000 },
]

const initialCashFlowData = [
  { month: "Jan", inflow: 45000, outflow: 32000 },
  { month: "Feb", inflow: 52000, outflow: 35000 },
  { month: "Mar", inflow: 48000, outflow: 33000 },
  { month: "Apr", inflow: 61000, outflow: 38000 },
  { month: "May", inflow: 55000, outflow: 36000 },
  { month: "Jun", inflow: 67000, outflow: 41000 },
]

const portfolioData = [
  { name: "TechCorp Solutions", value: 450000, color: "#8884d8" },
  { name: "Digital Innovations", value: 320000, color: "#82ca9d" },
  { name: "CloudFirst Ltd", value: 280000, color: "#ffc658" },
  { name: "DataDrive Inc", value: 180000, color: "#ff7300" },
  { name: "Others", value: 120000, color: "#00ff88" },
]

const initialCompanies = [
  {
    id: 1,
    name: "TechCorp Solutions",
    contractStart: "2024-01-15",
    contractEnd: "2025-01-14",
    workers: 45,
    contractValue: 450000,
    status: "Active",
    industry: "Technology",
  },
  {
    id: 2,
    name: "Digital Innovations",
    contractStart: "2024-03-01",
    contractEnd: "2024-12-31",
    workers: 32,
    contractValue: 320000,
    status: "Active",
    industry: "Digital Marketing",
  },
  {
    id: 3,
    name: "CloudFirst Ltd",
    contractStart: "2024-02-10",
    contractEnd: "2025-02-09",
    workers: 28,
    contractValue: 280000,
    status: "Active",
    industry: "Cloud Services",
  },
  {
    id: 4,
    name: "DataDrive Inc",
    contractStart: "2024-04-01",
    contractEnd: "2024-10-31",
    workers: 18,
    contractValue: 180000,
    status: "Ending Soon",
    industry: "Data Analytics",
  },
]

export default function Dashboard() {
  // Existing state
  const [companies, setCompanies] = useState(initialCompanies)
  const [revenueData, setRevenueData] = useState(initialRevenueData)
  const [cashFlowData, setCashFlowData] = useState(initialCashFlowData)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [newCompany, setNewCompany] = useState({
    name: "",
    contractStart: "",
    contractEnd: "",
    workers: "",
    contractValue: "",
    industry: "",
  })

  // Google Sheets integration state
  const [isGoogleConnected, setIsGoogleConnected] = useState(false)
  const [availableSheets, setAvailableSheets] = useState<GoogleSheet[]>([])
  const [selectedFinancialSheet, setSelectedFinancialSheet] = useState<string>("")
  const [selectedPortfolioSheet, setSelectedPortfolioSheet] = useState<string>("")
  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false)
  const [isMappingDialogOpen, setIsMappingDialogOpen] = useState(false)
  const [importStatus, setImportStatus] = useState<ImportStatus>({
    isConnected: false,
    isLoading: false,
    lastSync: null,
    error: null,
    success: null,
  })
  const [autoSync, setAutoSync] = useState(false)

  // Column mapping state
  const [financialMapping, setFinancialMapping] = useState<ColumnMapping[]>([
    { sheetColumn: "", dashboardField: "month" },
    { sheetColumn: "", dashboardField: "revenue" },
    { sheetColumn: "", dashboardField: "expenses" },
    { sheetColumn: "", dashboardField: "profit" },
  ])

  const [portfolioMapping, setPortfolioMapping] = useState<ColumnMapping[]>([
    { sheetColumn: "", dashboardField: "name" },
    { sheetColumn: "", dashboardField: "contractStart" },
    { sheetColumn: "", dashboardField: "contractEnd" },
    { sheetColumn: "", dashboardField: "workers" },
    { sheetColumn: "", dashboardField: "contractValue" },
    { sheetColumn: "", dashboardField: "industry" },
  ])

  // Sample sheet columns (in real implementation, these would come from Google Sheets API)
  const sampleColumns = ["A", "B", "C", "D", "E", "F", "G", "H"]

  const [availableColumns, setAvailableColumns] = useState<string[]>([])

  // Simulate Google authentication
  const handleGoogleAuth = async () => {
    setImportStatus({ ...importStatus, isLoading: true, error: null })

    try {
      const sheetsService = new GoogleSheetsService(GOOGLE_SHEETS_CONFIG)
      await sheetsService.initialize()
      await sheetsService.signIn()

      // Get available spreadsheets
      const sheets = await sheetsService.listSpreadsheets()
      const formattedSheets = sheets.map((sheet) => ({
        id: sheet.id,
        name: sheet.name,
        url: sheet.webViewLink,
      }))

      setAvailableSheets(formattedSheets)
      setIsGoogleConnected(true)
      setImportStatus({
        isConnected: true,
        isLoading: false,
        lastSync: null,
        error: null,
        success: `Successfully connected! Found ${sheets.length} spreadsheets.`,
      })
    } catch (error) {
      console.error("Google Sheets connection error:", error)
      setImportStatus({
        ...importStatus,
        isLoading: false,
        error: "Failed to connect to Google Sheets. Please check your permissions and try again.",
      })
    }
  }

  // Simulate data import from Google Sheets
  const handleDataImport = async () => {
    if (!selectedFinancialSheet && !selectedPortfolioSheet) {
      setImportStatus({
        ...importStatus,
        error: "Please select at least one sheet to import data from.",
      })
      return
    }

    setImportStatus({ ...importStatus, isLoading: true, error: null, success: null })

    try {
      const sheetsService = new GoogleSheetsService(GOOGLE_SHEETS_CONFIG)
      await sheetsService.initialize()

      if (!sheetsService.isUserSignedIn()) {
        throw new Error("User not signed in")
      }

      // Import financial data
      if (selectedFinancialSheet) {
        const financialData = await sheetsService.getSheetData(selectedFinancialSheet)
        const mappingObj = financialMapping.reduce(
          (acc, mapping) => {
            if (mapping.sheetColumn) {
              acc[mapping.dashboardField] = mapping.sheetColumn
            }
            return acc
          },
          {} as Record<string, string>,
        )

        const transformedFinancialData = sheetsService.transformFinancialData(financialData, mappingObj)

        if (transformedFinancialData.length > 0) {
          setRevenueData(transformedFinancialData)
          setCashFlowData(
            transformedFinancialData.map((item) => ({
              month: item.month,
              inflow: item.revenue || 0,
              outflow: item.expenses || 0,
            })),
          )
        }
      }

      // Import portfolio data
      if (selectedPortfolioSheet) {
        const portfolioData = await sheetsService.getSheetData(selectedPortfolioSheet)
        const mappingObj = portfolioMapping.reduce(
          (acc, mapping) => {
            if (mapping.sheetColumn) {
              acc[mapping.dashboardField] = mapping.sheetColumn
            }
            return acc
          },
          {} as Record<string, string>,
        )

        const transformedPortfolioData = sheetsService.transformPortfolioData(portfolioData, mappingObj)

        if (transformedPortfolioData.length > 0) {
          setCompanies(transformedPortfolioData)
        }
      }

      setImportStatus({
        isConnected: true,
        isLoading: false,
        lastSync: new Date(),
        error: null,
        success: "Data imported successfully from Google Sheets!",
      })
      setIsConnectDialogOpen(false)
      setIsMappingDialogOpen(false)
    } catch (error) {
      console.error("Data import error:", error)
      setImportStatus({
        ...importStatus,
        isLoading: false,
        error: `Failed to import data: ${error.message}. Please check your sheet permissions and column mappings.`,
      })
    }
  }

  const handleSheetSelection = async (sheetId: string, type: "financial" | "portfolio") => {
    if (type === "financial") {
      setSelectedFinancialSheet(sheetId)
    } else {
      setSelectedPortfolioSheet(sheetId)
    }

    // Fetch columns for mapping
    try {
      const sheetsService = new GoogleSheetsService(GOOGLE_SHEETS_CONFIG)
      await sheetsService.initialize()
      const columns = await sheetsService.getSheetColumns(sheetId)
      setAvailableColumns(columns)
    } catch (error) {
      console.error("Error fetching columns:", error)
    }
  }

  // Auto-sync functionality
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (autoSync && importStatus.isConnected) {
      intervalRef.current = setInterval(() => {
        handleDataImport()
      }, 300000) // Sync every 5 minutes

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSync, importStatus.isConnected])

  // Clear status messages after 5 seconds
  useEffect(() => {
    if (importStatus.success || importStatus.error) {
      const timer = setTimeout(() => {
        setImportStatus({ ...importStatus, success: null, error: null })
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [importStatus.success, importStatus.error])

  const handleAddCompany = () => {
    if (newCompany.name && newCompany.contractStart && newCompany.contractEnd) {
      const company = {
        id: companies.length + 1,
        name: newCompany.name,
        contractStart: newCompany.contractStart,
        contractEnd: newCompany.contractEnd,
        workers: Number.parseInt(newCompany.workers) || 0,
        contractValue: Number.parseInt(newCompany.contractValue) || 0,
        status: "Active",
        industry: newCompany.industry || "Other",
      }
      setCompanies([...companies, company])
      setNewCompany({
        name: "",
        contractStart: "",
        contractEnd: "",
        workers: "",
        contractValue: "",
        industry: "",
      })
      setIsAddDialogOpen(false)
    }
  }

  const filteredCompanies = companies.filter(
    (company) =>
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.industry.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalRevenue = revenueData.reduce((sum, item) => sum + item.revenue, 0)
  const totalExpenses = revenueData.reduce((sum, item) => sum + item.expenses, 0)
  const totalProfit = totalRevenue - totalExpenses
  const profitMargin = ((totalProfit / totalRevenue) * 100).toFixed(1)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Status Messages */}
      {importStatus.success && (
        <Alert className="mx-6 mt-4 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Success!</AlertTitle>
          <AlertDescription className="text-green-700">{importStatus.success}</AlertDescription>
        </Alert>
      )}

      {importStatus.error && (
        <Alert className="mx-6 mt-4 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Error</AlertTitle>
          <AlertDescription className="text-red-700">{importStatus.error}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Building2 className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Business Dashboard</h1>
            {importStatus.isConnected && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Sheet className="h-3 w-3 mr-1" />
                Google Sheets Connected
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <Dialog open={isConnectDialogOpen} onOpenChange={setIsConnectDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  <Sheet className="h-4 w-4 mr-2" />
                  {isGoogleConnected ? "Manage Sheets" : "Connect Google Sheets"}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Google Sheets Integration</DialogTitle>
                  <DialogDescription>
                    Connect your Google Sheets to automatically import financial data and portfolio information.
                  </DialogDescription>
                </DialogHeader>

                {!isGoogleConnected ? (
                  <div className="space-y-4">
                    <div className="text-center py-8">
                      <Sheet className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium mb-2">Connect to Google Sheets</h3>
                      <p className="text-sm text-gray-600 mb-6">
                        Authenticate with your Google account to access your spreadsheets
                      </p>
                      <Button
                        onClick={handleGoogleAuth}
                        disabled={importStatus.isLoading}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {importStatus.isLoading ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <Link className="h-4 w-4 mr-2" />
                            Connect Google Account
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="financial-sheet">Financial Data Sheet</Label>
                        <Select
                          value={selectedFinancialSheet}
                          onValueChange={(value) => handleSheetSelection(value, "financial")}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select financial data sheet" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableSheets.map((sheet) => (
                              <SelectItem key={sheet.id} value={sheet.id}>
                                {sheet.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="portfolio-sheet">Portfolio Companies Sheet</Label>
                        <Select
                          value={selectedPortfolioSheet}
                          onValueChange={(value) => handleSheetSelection(value, "portfolio")}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select portfolio sheet" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableSheets.map((sheet) => (
                              <SelectItem key={sheet.id} value={sheet.id}>
                                {sheet.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {(selectedFinancialSheet || selectedPortfolioSheet) && (
                      <div className="space-y-4">
                        <Separator />
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Column Mapping</h4>
                            <p className="text-sm text-gray-600">Map your sheet columns to dashboard fields</p>
                          </div>
                          <Button variant="outline" onClick={() => setIsMappingDialogOpen(true)}>
                            Configure Mapping
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Switch id="auto-sync" checked={autoSync} onCheckedChange={setAutoSync} />
                        <Label htmlFor="auto-sync" className="text-sm">
                          Auto-sync every 5 minutes
                        </Label>
                      </div>
                      {importStatus.lastSync && (
                        <p className="text-xs text-gray-500">Last sync: {importStatus.lastSync.toLocaleString()}</p>
                      )}
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsConnectDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={handleDataImport}
                        disabled={importStatus.isLoading || (!selectedFinancialSheet && !selectedPortfolioSheet)}
                      >
                        {importStatus.isLoading ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Importing...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Import Data
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="icon">
              <Bell className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">John Doe</p>
                    <p className="text-xs leading-none text-muted-foreground">john@company.com</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem>Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Column Mapping Dialog */}
      <Dialog open={isMappingDialogOpen} onOpenChange={setIsMappingDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Column Mapping Configuration</DialogTitle>
            <DialogDescription>Map your Google Sheets columns to the corresponding dashboard fields.</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {selectedFinancialSheet && (
              <div>
                <h4 className="font-medium mb-3">Financial Data Mapping</h4>
                <div className="space-y-3">
                  {financialMapping.map((mapping, index) => (
                    <div key={mapping.dashboardField} className="grid grid-cols-2 gap-4 items-center">
                      <Label className="text-sm font-medium capitalize">{mapping.dashboardField}</Label>
                      <Select
                        value={mapping.sheetColumn}
                        onValueChange={(value) => {
                          const newMapping = [...financialMapping]
                          newMapping[index].sheetColumn = value
                          setFinancialMapping(newMapping)
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableColumns.map((col) => (
                            <SelectItem key={col} value={col}>
                              {col}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedPortfolioSheet && (
              <div>
                <h4 className="font-medium mb-3">Portfolio Companies Mapping</h4>
                <div className="space-y-3">
                  {portfolioMapping.map((mapping, index) => (
                    <div key={mapping.dashboardField} className="grid grid-cols-2 gap-4 items-center">
                      <Label className="text-sm font-medium capitalize">
                        {mapping.dashboardField.replace(/([A-Z])/g, " $1").trim()}
                      </Label>
                      <Select
                        value={mapping.sheetColumn}
                        onValueChange={(value) => {
                          const newMapping = [...portfolioMapping]
                          newMapping[index].sheetColumn = value
                          setPortfolioMapping(newMapping)
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableColumns.map((col) => (
                            <SelectItem key={col} value={col}>
                              {col}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsMappingDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsMappingDialogOpen(false)}>Save Mapping</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
          <nav className="p-4 space-y-2">
            <Button variant="ghost" className="w-full justify-start bg-blue-50 text-blue-700">
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <Building2 className="mr-2 h-4 w-4" />
              Portfolio
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <Users className="mr-2 h-4 w-4" />
              Companies
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <PieChart className="mr-2 h-4 w-4" />
              Reports
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <Sheet className="mr-2 h-4 w-4" />
              Google Sheets
            </Button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      <TrendingUp className="inline h-3 w-3 mr-1" />
                      +12.5% from last period
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${totalExpenses.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      <TrendingUp className="inline h-3 w-3 mr-1" />
                      +8.2% from last period
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${totalProfit.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      <TrendingUp className="inline h-3 w-3 mr-1" />
                      +18.7% from last period
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{profitMargin}%</div>
                    <p className="text-xs text-muted-foreground">
                      <TrendingUp className="inline h-3 w-3 mr-1" />
                      +2.1% from last period
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue vs Expenses</CardTitle>
                    <CardDescription>Monthly comparison of revenue and expenses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsLineChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, ""]} />
                        <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
                        <Line type="monotone" dataKey="expenses" stroke="#82ca9d" strokeWidth={2} />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Cash Flow</CardTitle>
                    <CardDescription>Monthly cash inflow and outflow</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsBarChart data={cashFlowData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, ""]} />
                        <Bar dataKey="inflow" fill="#8884d8" />
                        <Bar dataKey="outflow" fill="#82ca9d" />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Profit Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Profit Trend</CardTitle>
                  <CardDescription>Monthly profit analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, ""]} />
                      <Area type="monotone" dataKey="profit" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="portfolio" className="space-y-6">
              {/* Portfolio Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Portfolio Companies</CardTitle>
                      <CardDescription>Manage your portfolio companies and contracts</CardDescription>
                    </div>
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Company
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Add New Portfolio Company</DialogTitle>
                          <DialogDescription>Enter the details of the new portfolio company.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                              Company Name
                            </Label>
                            <Input
                              id="name"
                              value={newCompany.name}
                              onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="industry" className="text-right">
                              Industry
                            </Label>
                            <Select onValueChange={(value) => setNewCompany({ ...newCompany, industry: value })}>
                              <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select industry" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Technology">Technology</SelectItem>
                                <SelectItem value="Healthcare">Healthcare</SelectItem>
                                <SelectItem value="Finance">Finance</SelectItem>
                                <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                                <SelectItem value="Retail">Retail</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="start" className="text-right">
                              Contract Start
                            </Label>
                            <Input
                              id="start"
                              type="date"
                              value={newCompany.contractStart}
                              onChange={(e) => setNewCompany({ ...newCompany, contractStart: e.target.value })}
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="end" className="text-right">
                              Contract End
                            </Label>
                            <Input
                              id="end"
                              type="date"
                              value={newCompany.contractEnd}
                              onChange={(e) => setNewCompany({ ...newCompany, contractEnd: e.target.value })}
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="workers" className="text-right">
                              Workers
                            </Label>
                            <Input
                              id="workers"
                              type="number"
                              value={newCompany.workers}
                              onChange={(e) => setNewCompany({ ...newCompany, workers: e.target.value })}
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="value" className="text-right">
                              Contract Value
                            </Label>
                            <Input
                              id="value"
                              type="number"
                              value={newCompany.contractValue}
                              onChange={(e) => setNewCompany({ ...newCompany, contractValue: e.target.value })}
                              className="col-span-3"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleAddCompany}>Add Company</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search companies..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-8"
                        />
                      </div>
                      <Button variant="outline" size="icon">
                        <Filter className="h-4 w-4" />
                      </Button>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Company</TableHead>
                          <TableHead>Industry</TableHead>
                          <TableHead>Contract Period</TableHead>
                          <TableHead>Workers</TableHead>
                          <TableHead>Value</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCompanies.map((company) => (
                          <TableRow key={company.id}>
                            <TableCell className="font-medium">{company.name}</TableCell>
                            <TableCell>{company.industry}</TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div>{new Date(company.contractStart).toLocaleDateString()}</div>
                                <div className="text-muted-foreground">
                                  to {new Date(company.contractEnd).toLocaleDateString()}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{company.workers}</TableCell>
                            <TableCell>${company.contractValue.toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge variant={company.status === "Active" ? "default" : "secondary"}>
                                {company.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Portfolio Distribution</CardTitle>
                    <CardDescription>Contract value by company</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie
                          data={portfolioData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {portfolioData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, "Value"]} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="insights" className="space-y-6">
              {/* Key Insights */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                      Revenue Growth
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600 mb-2">+18.7%</div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Revenue has increased significantly over the last 6 months, with April showing the highest growth.
                    </p>
                    <Progress value={75} className="w-full" />
                    <p className="text-xs text-muted-foreground mt-2">Target: 20% growth</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="h-5 w-5 mr-2 text-blue-600" />
                      Workforce Efficiency
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600 mb-2">123 Workers</div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Average revenue per worker: ${(totalRevenue / 123).toLocaleString()}
                    </p>
                    <Progress value={85} className="w-full" />
                    <p className="text-xs text-muted-foreground mt-2">Above industry average</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2 text-orange-600" />
                      Contract Renewals
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600 mb-2">1 Ending Soon</div>
                    <p className="text-sm text-muted-foreground mb-4">
                      DataDrive Inc contract ends in October. Consider renewal negotiations.
                    </p>
                    <Progress value={25} className="w-full" />
                    <p className="text-xs text-muted-foreground mt-2">Action required</p>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Insights */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Financial Health Score</CardTitle>
                    <CardDescription>Overall business performance indicators</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Profit Margin</span>
                      <span className="text-sm text-muted-foreground">{profitMargin}%</span>
                    </div>
                    <Progress value={Number.parseFloat(profitMargin) * 3} className="w-full" />

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Cash Flow Stability</span>
                      <span className="text-sm text-muted-foreground">92%</span>
                    </div>
                    <Progress value={92} className="w-full" />

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Portfolio Diversification</span>
                      <span className="text-sm text-muted-foreground">78%</span>
                    </div>
                    <Progress value={78} className="w-full" />

                    <div className="pt-4 border-t">
                      <div className="text-2xl font-bold text-green-600">Excellent</div>
                      <p className="text-sm text-muted-foreground">
                        Overall financial health is strong with room for growth
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recommendations</CardTitle>
                    <CardDescription>AI-powered insights for business optimization</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Expand Technology Sector</h4>
                      <p className="text-sm text-blue-700">
                        Technology companies show highest profit margins. Consider targeting more tech clients.
                      </p>
                    </div>

                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">Optimize Operational Costs</h4>
                      <p className="text-sm text-green-700">
                        Expenses increased 8.2% while revenue grew 12.5%. Focus on cost efficiency.
                      </p>
                    </div>

                    <div className="p-4 bg-orange-50 rounded-lg">
                      <h4 className="font-medium text-orange-900 mb-2">Contract Renewal Strategy</h4>
                      <p className="text-sm text-orange-700">
                        Proactively engage with DataDrive Inc for contract renewal discussions.
                      </p>
                    </div>

                    {importStatus.isConnected && (
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <h4 className="font-medium text-purple-900 mb-2">Google Sheets Integration</h4>
                        <p className="text-sm text-purple-700">
                          Data is now syncing from Google Sheets. Enable auto-sync for real-time updates.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
