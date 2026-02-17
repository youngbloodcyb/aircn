"use client"

import { useState, useMemo, useCallback } from "react"
import {
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    useReactTable,
    type SortingState,
    type VisibilityState,
    type RowSelectionState,
} from "@tanstack/react-table"
import { ChevronDown, Plus, Trash2, X } from "lucide-react"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { type Row, type ColumnActions, buildColumns, typeIcons } from "@/components/columns"
import {
    type ColumnConfig,
    type ColumnType,
    COLUMN_TYPES,
    COLUMN_TYPE_LABELS,
    getDefaultValue,
    formatCellValue,
} from "@/lib/column-types"

interface DataTableProps {
    initialColumns: ColumnConfig[]
    data: Row[]
}

type PendingAction =
    | { type: "edit"; key: string }
    | { type: "insert"; key: string; side: "left" | "right" }

type AggregateMode = "sum" | "average" | "median"

const AGGREGATE_LABELS: Record<AggregateMode, string> = {
    sum: "Sum",
    average: "Average",
    median: "Median",
}

const computeAggregate = (values: number[], mode: AggregateMode): number => {
    if (values.length === 0) return 0
    switch (mode) {
        case "sum":
            return values.reduce((a, b) => a + b, 0)
        case "average":
            return values.reduce((a, b) => a + b, 0) / values.length
        case "median": {
            const sorted = [...values].sort((a, b) => a - b)
            const mid = Math.floor(sorted.length / 2)
            return sorted.length % 2 !== 0
                ? sorted[mid]
                : (sorted[mid - 1] + sorted[mid]) / 2
        }
    }
}

export const DataTable = ({ initialColumns, data }: DataTableProps) => {
    const [columnConfigs, setColumnConfigs] = useState<ColumnConfig[]>(initialColumns)
    const [rows, setRows] = useState<Row[]>(data)
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
    const [aggregateModes, setAggregateModes] = useState<Record<string, AggregateMode>>({})



    const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
    const [dialogInput, setDialogInput] = useState("")
    const [dialogType, setDialogType] = useState<ColumnType>("text")
    const [dialogOptions, setDialogOptions] = useState<string[]>([])
    const [newOptionValue, setNewOptionValue] = useState("")

    const columnKeys = useMemo(() => columnConfigs.map((c) => c.key), [columnConfigs])

    const openDialog = useCallback((action: PendingAction, overrideType?: ColumnType) => {
        setPendingAction(action)
        if (action.type === "edit") {
            const config = columnConfigs.find((c) => c.key === action.key)
            setDialogInput(action.key)
            setDialogType(config?.type ?? "text")
            setDialogOptions(config?.options ?? [])
        } else {
            const type = overrideType ?? "text"
            setDialogInput(COLUMN_TYPE_LABELS[type])
            setDialogType(type)
            setDialogOptions([])
        }
        setNewOptionValue("")
    }, [columnConfigs])

    const closeDialog = useCallback(() => {
        setPendingAction(null)
        setDialogInput("")
        setDialogType("text")
        setDialogOptions([])
        setNewOptionValue("")
    }, [])

    const handleDialogSubmit = useCallback(() => {
        const name = dialogInput.trim()
        if (!pendingAction || !name) return

        if (pendingAction.type === "edit") {
            const oldKey = pendingAction.key
            const nameChanged = name !== oldKey
            if (nameChanged && columnKeys.includes(name)) return

            setColumnConfigs((prev) =>
                prev.map((c) => {
                    if (c.key !== oldKey) return c
                    return {
                        ...c,
                        key: nameChanged ? name : c.key,
                        type: dialogType,
                        options: dialogType === "select" ? dialogOptions : undefined,
                    }
                })
            )

            if (nameChanged) {
                setRows((prev) =>
                    prev.map((row) => {
                        const { [oldKey]: value, ...rest } = row
                        return { ...rest, [name]: value }
                    })
                )
            }
        }

        if (pendingAction.type === "insert") {
            if (columnKeys.includes(name)) return

            const idx = pendingAction.key ? columnKeys.indexOf(pendingAction.key) : -1
            const insertIdx = idx === -1 ? columnKeys.length : (pendingAction.side === "left" ? idx : idx + 1)
            const newConfig: ColumnConfig = {
                key: name,
                type: dialogType,
                options: dialogType === "select" ? dialogOptions : undefined,
            }

            setColumnConfigs((prev) => [
                ...prev.slice(0, insertIdx),
                newConfig,
                ...prev.slice(insertIdx),
            ])
            setRows((prev) =>
                prev.map((row) => ({ ...row, [name]: getDefaultValue(dialogType) }))
            )
        }

        closeDialog()
    }, [dialogInput, dialogType, dialogOptions, pendingAction, columnKeys, closeDialog])

    const handleQuickAdd = useCallback((type: ColumnType) => {
        if (type === "select") {
            const lastKey = columnKeys[columnKeys.length - 1]
            openDialog(
                lastKey
                    ? { type: "insert", key: lastKey, side: "right" }
                    : { type: "insert", key: "", side: "right" },
                "select"
            )
            return
        }

        let name = COLUMN_TYPE_LABELS[type]
        let i = 2
        while (columnKeys.includes(name)) {
            name = `${COLUMN_TYPE_LABELS[type]} ${i}`
            i++
        }

        const newConfig: ColumnConfig = { key: name, type }
        setColumnConfigs((prev) => [...prev, newConfig])
        setRows((prev) =>
            prev.map((row) => ({ ...row, [name]: getDefaultValue(type) }))
        )
    }, [columnKeys, openDialog])

    const columnActions: ColumnActions = useMemo(
        () => ({
            onEdit: (key) => openDialog({ type: "edit", key }),
            onDuplicate: (key) => {
                const config = columnConfigs.find((c) => c.key === key)
                if (!config) return

                let copyName = `${key} (copy)`
                let i = 2
                while (columnKeys.includes(copyName)) {
                    copyName = `${key} (copy ${i})`
                    i++
                }

                const idx = columnKeys.indexOf(key)
                const newConfig: ColumnConfig = { ...config, key: copyName }

                setColumnConfigs((prev) => [
                    ...prev.slice(0, idx + 1),
                    newConfig,
                    ...prev.slice(idx + 1),
                ])
                setRows((prev) =>
                    prev.map((row) => ({ ...row, [copyName]: row[key] ?? getDefaultValue(config.type) }))
                )
            },
            onInsertLeft: (key) => openDialog({ type: "insert", key, side: "left" }),
            onInsertRight: (key) => openDialog({ type: "insert", key, side: "right" }),
            onSort: (key) => {
                setSorting((prev) => {
                    const existing = prev.find((s) => s.id === key)
                    if (!existing) return [{ id: key, desc: false }]
                    if (!existing.desc) return [{ id: key, desc: true }]
                    return []
                })
            },
            onHide: (key) => {
                setColumnVisibility((prev) => ({ ...prev, [key]: false }))
            },
            onDelete: (key) => {
                setColumnConfigs((prev) => prev.filter((c) => c.key !== key))
            },
            onCellChange: (rowIndex, key, value) => {
                setRows((prev) =>
                    prev.map((row, i) => (i === rowIndex ? { ...row, [key]: value } : row))
                )
            },
        }),
        [columnConfigs, columnKeys, openDialog]
    )

    const columns = useMemo(
        () => buildColumns(columnConfigs, columnActions),
        [columnConfigs, columnActions]
    )

    const table = useReactTable({
        data: rows,
        columns,
        state: { sorting, columnVisibility, rowSelection },
        getRowId: (row) => String(row.id ?? ""),
        onSortingChange: setSorting,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        columnResizeMode: "onChange",
        enableColumnResizing: true,
    })

    const handleAddRow = useCallback(() => {
        const emptyRow: Row = { id: crypto.randomUUID() }
        for (const config of columnConfigs) {
            emptyRow[config.key] = getDefaultValue(config.type)
        }
        setRows((prev) => [...prev, emptyRow])
    }, [columnConfigs])

    const handleDeleteSelectedRows = useCallback(() => {
        const selectedIds = new Set(
            table.getFilteredSelectedRowModel().rows.map((r) => r.id)
        )
        setRows((prev) => prev.filter((row) => !selectedIds.has(String(row.id ?? ""))))
        setRowSelection({})
    }, [table])

    const selectedCount = table.getFilteredSelectedRowModel().rows.length
    const totalCount = table.getFilteredRowModel().rows.length

    const dialogTitle = pendingAction?.type === "edit" ? "Edit column" : "New column"

    return (
        <>
            <div className="overflow-hidden rounded-sm border">
                <Table style={{ width: table.getCenterTotalSize(), tableLayout: "fixed" }}>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead
                                        key={header.id}
                                        className="relative group border-r last:border-r-0"
                                        style={{ width: header.getSize() }}
                                    >
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                        {header.column.getCanResize() && (
                                            <div
                                                onDoubleClick={() => header.column.resetSize()}
                                                onMouseDown={header.getResizeHandler()}
                                                onTouchStart={header.getResizeHandler()}
                                                className={`absolute top-0 right-0 h-full w-1 cursor-col-resize select-none touch-none opacity-0 group-hover:opacity-100 bg-border ${header.column.getIsResizing() ? "opacity-100 bg-primary" : ""
                                                    }`}
                                            />
                                        )}
                                    </TableHead>
                                ))}
                                <TableHead className="w-10">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon-xs">
                                                <Plus />
                                                <span className="sr-only">Add column</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            {COLUMN_TYPES.map((t) => {
                                                const Icon = typeIcons[t]
                                                return (
                                                    <DropdownMenuItem
                                                        key={t}
                                                        onClick={() => handleQuickAdd(t)}
                                                    >
                                                        <Icon />
                                                        {COLUMN_TYPE_LABELS[t]}
                                                    </DropdownMenuItem>
                                                )
                                            })}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableHead>
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell
                                            key={cell.id}
                                            className="border-r last:border-r-0 hover:bg-muted/50 transition-colors p-1"
                                            style={{ width: cell.column.getSize() }}
                                        >
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                    <TableCell className="w-10" />
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length + 1} className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                    <tfoot>
                        <TableRow className="border-t">
                            <TableCell className="p-1">
                                <button
                                    type="button"
                                    onClick={handleAddRow}
                                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer px-1"
                                >
                                    <Plus className="size-3.5" />
                                </button>
                            </TableCell>
                            {columnConfigs.map((config) => {
                                const isVisible = columnVisibility[config.key] !== false
                                if (!isVisible) return null

                                if (config.type === "number" || config.type === "currency") {
                                    const mode = aggregateModes[config.key] ?? "sum"
                                    const values = rows
                                        .map((r) => Number(r[config.key]))
                                        .filter((v) => !isNaN(v))
                                    const result = computeAggregate(values, mode)

                                    return (
                                        <TableCell
                                            key={config.key}
                                            className="border-r last:border-r-0 p-1"
                                        >
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button
                                                        type="button"
                                                        className="flex items-center gap-1 w-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                                    >
                                                        <span className="truncate">
                                                            {AGGREGATE_LABELS[mode]}: {formatCellValue(result, config.type)}
                                                        </span>
                                                        <ChevronDown className="size-3 shrink-0" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start">
                                                    {(Object.keys(AGGREGATE_LABELS) as AggregateMode[]).map((m) => (
                                                        <DropdownMenuItem
                                                            key={m}
                                                            onClick={() =>
                                                                setAggregateModes((prev) => ({
                                                                    ...prev,
                                                                    [config.key]: m,
                                                                }))
                                                            }
                                                        >
                                                            {AGGREGATE_LABELS[m]}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    )
                                }

                                return (
                                    <TableCell
                                        key={config.key}
                                        className="border-r last:border-r-0 p-1"
                                    />
                                )
                            })}
                            <TableCell className="w-10" />
                        </TableRow>
                    </tfoot>
                </Table>
                {selectedCount > 0 && (
                    <div className="flex items-center justify-between border-t px-3 py-1.5">
                        <span className="text-sm text-muted-foreground">
                            {selectedCount} of {totalCount} row(s) selected
                        </span>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDeleteSelectedRows}
                        >
                            <Trash2 />
                            Delete {selectedCount > 1 ? `${selectedCount} rows` : "row"}
                        </Button>
                    </div>
                )}

            </div>

            <Dialog open={pendingAction !== null} onOpenChange={(open) => { if (!open) closeDialog() }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{dialogTitle}</DialogTitle>
                        <DialogDescription>
                            {pendingAction?.type === "edit"
                                ? "Update the name or type for this column."
                                : "Enter a name and type for the new column."}
                        </DialogDescription>
                    </DialogHeader>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                            handleDialogSubmit()
                        }}
                        className="flex flex-col gap-4"
                    >
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="dialog-col-name">Name</Label>
                            <Input
                                id="dialog-col-name"
                                placeholder="Column name"
                                value={dialogInput}
                                onChange={(e) => setDialogInput(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label>Type</Label>
                            <Select
                                value={dialogType}
                                onValueChange={(v) => {
                                    const t = v as ColumnType
                                    setDialogType(t)
                                    const isDefault = Object.values(COLUMN_TYPE_LABELS).includes(dialogInput) || !dialogInput.trim()
                                    if (isDefault && pendingAction?.type !== "edit") setDialogInput(COLUMN_TYPE_LABELS[t])
                                }}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {COLUMN_TYPES.map((t) => (
                                        <SelectItem key={t} value={t}>
                                            {COLUMN_TYPE_LABELS[t]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {dialogType === "select" && (
                            <div className="flex flex-col gap-1.5">
                                <Label>Options</Label>
                                {dialogOptions.length > 0 && (
                                    <div className="flex flex-col gap-1">
                                        {dialogOptions.map((opt, i) => (
                                            <div key={i} className="flex items-center gap-1.5">
                                                <span className="text-sm flex-1 truncate">{opt}</span>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon-xs"
                                                    onClick={() =>
                                                        setDialogOptions((prev) => prev.filter((_, j) => j !== i))
                                                    }
                                                >
                                                    <X />
                                                    <span className="sr-only">Remove {opt}</span>
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="flex items-center gap-1.5">
                                    <Input
                                        placeholder="New option"
                                        value={newOptionValue}
                                        onChange={(e) => setNewOptionValue(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault()
                                                const v = newOptionValue.trim()
                                                if (v && !dialogOptions.includes(v)) {
                                                    setDialogOptions((prev) => [...prev, v])
                                                    setNewOptionValue("")
                                                }
                                            }
                                        }}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const v = newOptionValue.trim()
                                            if (v && !dialogOptions.includes(v)) {
                                                setDialogOptions((prev) => [...prev, v])
                                                setNewOptionValue("")
                                            }
                                        }}
                                    >
                                        Add
                                    </Button>
                                </div>
                            </div>
                        )}
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={closeDialog}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={!dialogInput.trim()}>
                                {pendingAction?.type === "edit" ? "Save" : "Add"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}
