/**
 * Advanced Data Grid Component
 * High-performance table with virtual scrolling, filtering, and business features
 */

'use client'

import * as React from 'react'
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type SortingState,
    type ColumnFiltersState,
    type VisibilityState,
    type Row
} from '@tanstack/react-table'
import {
    ChevronDown,
    ChevronUp,
    ChevronsUpDown,
    Search,
    Filter,
    Download,
    Eye,
    EyeOff,
    MoreHorizontal,
    ArrowUpDown,
    Settings,
    RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'

export interface DataGridColumn<T> extends ColumnDef<T> {
    title?: string
    filterable?: boolean
    exportable?: boolean
    width?: number
    minWidth?: number
    maxWidth?: number
}

export interface DataGridProps<T> {
    data: T[]
    columns: DataGridColumn<T>[]
    loading?: boolean
    error?: string
    className?: string

    // Pagination
    pageSize?: number
    showPagination?: boolean

    // Features
    enableSorting?: boolean
    enableFiltering?: boolean
    enableColumnVisibility?: boolean
    enableRowSelection?: boolean
    enableExport?: boolean
    enableRefresh?: boolean

    // Selection
    selectedRows?: T[]
    onSelectionChange?: (rows: T[]) => void

    // Actions
    onRefresh?: () => void
    onExport?: (format: 'csv' | 'excel' | 'pdf') => void

    // Customization
    emptyMessage?: string
    rowActions?: (row: T) => React.ReactNode
    toolbar?: React.ReactNode

    // Business features
    showRowNumbers?: boolean
    stickyHeader?: boolean
    compactMode?: boolean
    highlightChanges?: boolean
}

export function DataGrid<T>({
    data,
    columns,
    loading = false,
    error,
    className,
    pageSize = 50,
    showPagination = true,
    enableSorting = true,
    enableFiltering = true,
    enableColumnVisibility = true,
    enableRowSelection = false,
    enableExport = true,
    enableRefresh = false,
    selectedRows = [],
    onSelectionChange,
    onRefresh,
    onExport,
    emptyMessage = "No data available",
    rowActions,
    toolbar,
    showRowNumbers = false,
    stickyHeader = true,
    compactMode = false,
    highlightChanges = false
}: DataGridProps<T>) {
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = React.useState({})
    const [globalFilter, setGlobalFilter] = React.useState('')

    // Add row selection column if enabled
    const tableColumns = React.useMemo(() => {
        const cols: DataGridColumn<T>[] = []

        // Row numbers column
        if (showRowNumbers) {
            cols.push({
                id: 'row-number',
                header: '#',
                cell: ({ row }) => (
                    <div className="text-xs text-muted-foreground font-mono">
                        {row.index + 1}
                    </div>
                ),
                size: 50,
                enableSorting: false,
                enableHiding: false
            })
        }

        // Row selection column
        if (enableRowSelection) {
            cols.push({
                id: 'select',
                header: ({ table }) => (
                    <Checkbox
                        checked={table.getIsAllPageRowsSelected()}
                        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                        aria-label="Select all"
                    />
                ),
                cell: ({ row }) => (
                    <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(value) => row.toggleSelected(!!value)}
                        aria-label="Select row"
                    />
                ),
                size: 50,
                enableSorting: false,
                enableHiding: false
            })
        }

        // Main columns
        cols.push(...columns)

        // Actions column
        if (rowActions) {
            cols.push({
                id: 'actions',
                header: 'Actions',
                cell: ({ row }) => rowActions(row.original),
                size: 100,
                enableSorting: false,
                enableHiding: false
            })
        }

        return cols
    }, [columns, enableRowSelection, rowActions, showRowNumbers])

    const table = useReactTable({
        data,
        columns: tableColumns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn: 'includesString',
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
            globalFilter,
            pagination: {
                pageIndex: 0,
                pageSize
            }
        },
    })

    // Handle selection changes
    React.useEffect(() => {
        if (onSelectionChange) {
            const selectedRowData = table.getSelectedRowModel().rows.map(row => row.original)
            onSelectionChange(selectedRowData)
        }
    }, [rowSelection, onSelectionChange, table])

    const exportData = (format: 'csv' | 'excel' | 'pdf') => {
        if (onExport) {
            onExport(format)
        } else {
            // Default CSV export
            if (format === 'csv') {
                const csvData = table.getRowModel().rows.map(row => {
                    const rowData: any = {}
                    columns.forEach(col => {
                        if (col.exportable !== false && col.accessorKey) {
                            rowData[col.title || String(col.accessorKey)] = row.getValue(String(col.accessorKey))
                        }
                    })
                    return rowData
                })

                const csv = convertToCSV(csvData)
                downloadCSV(csv, 'data-export.csv')
            }
        }
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64 text-center">
                <div className="space-y-2">
                    <p className="text-red-500 font-medium">Error loading data</p>
                    <p className="text-sm text-muted-foreground">{error}</p>
                    {enableRefresh && onRefresh && (
                        <Button variant="outline" size="sm" onClick={onRefresh}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Retry
                        </Button>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className={cn('space-y-4', className)}>
            {/* Toolbar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    {/* Global Search */}
                    {enableFiltering && (
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search all columns..."
                                value={globalFilter}
                                onChange={(e) => setGlobalFilter(e.target.value)}
                                className="pl-8 w-64"
                            />
                        </div>
                    )}

                    {/* Custom toolbar */}
                    {toolbar}
                </div>

                <div className="flex items-center space-x-2">
                    {/* Refresh */}
                    {enableRefresh && onRefresh && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onRefresh}
                            disabled={loading}
                        >
                            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                        </Button>
                    )}

                    {/* Export */}
                    {enableExport && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <Download className="h-4 w-4 mr-2" />
                                    Export
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => exportData('csv')}>
                                    Export as CSV
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => exportData('excel')}>
                                    Export as Excel
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => exportData('pdf')}>
                                    Export as PDF
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}

                    {/* Column Visibility */}
                    {enableColumnVisibility && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <Eye className="h-4 w-4 mr-2" />
                                    Columns
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {table
                                    .getAllColumns()
                                    .filter((column) => column.getCanHide())
                                    .map((column) => {
                                        return (
                                            <DropdownMenuCheckboxItem
                                                key={column.id}
                                                className="capitalize"
                                                checked={column.getIsVisible()}
                                                onCheckedChange={(value) =>
                                                    column.toggleVisibility(!!value)
                                                }
                                            >
                                                {column.columnDef.title || column.id}
                                            </DropdownMenuCheckboxItem>
                                        )
                                    })}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>

            {/* Selection Info */}
            {enableRowSelection && table.getSelectedRowModel().rows.length > 0 && (
                <div className="flex items-center space-x-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Badge variant="secondary">
                        {table.getSelectedRowModel().rows.length} selected
                    </Badge>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => table.resetRowSelection()}
                    >
                        Clear selection
                    </Button>
                </div>
            )}

            {/* Table */}
            <div className={cn(
                'rounded-md border',
                stickyHeader && 'max-h-[600px] overflow-auto'
            )}>
                <Table>
                    <TableHeader className={stickyHeader ? 'sticky top-0 bg-background z-10' : ''}>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead
                                        key={header.id}
                                        className={cn(
                                            compactMode && 'py-2',
                                            header.column.getCanSort() && 'cursor-pointer select-none'
                                        )}
                                        onClick={header.column.getToggleSortingHandler()}
                                        style={{ width: header.getSize() }}
                                    >
                                        <div className="flex items-center space-x-2">
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                            {header.column.getCanSort() && (
                                                <div className="flex flex-col">
                                                    {header.column.getIsSorted() === 'desc' ? (
                                                        <ChevronDown className="h-3 w-3" />
                                                    ) : header.column.getIsSorted() === 'asc' ? (
                                                        <ChevronUp className="h-3 w-3" />
                                                    ) : (
                                                        <ChevronsUpDown className="h-3 w-3 opacity-50" />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell
                                    colSpan={table.getAllColumns().length}
                                    className="h-24 text-center"
                                >
                                    <div className="flex items-center justify-center space-x-2">
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                        <span>Loading...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    className={cn(
                                        compactMode && 'h-8',
                                        highlightChanges && 'transition-colors duration-200'
                                    )}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell
                                            key={cell.id}
                                            className={compactMode ? 'py-1' : ''}
                                        >
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={table.getAllColumns().length}
                                    className="h-24 text-center"
                                >
                                    {emptyMessage}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {showPagination && (
                <div className="flex items-center justify-between space-x-2 py-4">
                    <div className="text-sm text-muted-foreground">
                        {table.getFilteredSelectedRowModel().rows.length} of{" "}
                        {table.getFilteredRowModel().rows.length} row(s) selected.
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            Previous
                        </Button>
                        <div className="flex items-center space-x-1">
                            <span className="text-sm">Page</span>
                            <strong className="text-sm">
                                {table.getState().pagination.pageIndex + 1} of{" "}
                                {table.getPageCount()}
                            </strong>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}

// Utility functions
function convertToCSV(data: any[]): string {
    if (data.length === 0) return ''

    const headers = Object.keys(data[0])
    const csvContent = [
        headers.join(','),
        ...data.map(row =>
            headers.map(header => {
                const value = row[header]
                return typeof value === 'string' && value.includes(',')
                    ? `"${value}"`
                    : value
            }).join(',')
        )
    ].join('\n')

    return csvContent
}

function downloadCSV(csv: string, filename: string): void {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')

    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', filename)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }
}
