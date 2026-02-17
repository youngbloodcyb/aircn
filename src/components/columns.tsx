"use client"

import { ColumnDef } from "@tanstack/react-table"
import {
    Pencil,
    Copy,
    ArrowLeft,
    ArrowRight,
    ArrowUpDown,
    EyeOff,
    Trash2,
    ChevronDown,
    Type,
    AlignLeft,
    CheckSquare,
    List,
    Calendar,
    Hash,
    Phone,
    Mail,
    DollarSign,
    Percent,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { type ColumnConfig, type ColumnType, formatCellValue, COLUMN_TYPE_LABELS } from "@/lib/column-types"

export type Row = Record<string, unknown>

export interface ColumnActions {
    onEdit: (key: string) => void
    onDuplicate: (key: string) => void
    onInsertLeft: (key: string) => void
    onInsertRight: (key: string) => void
    onSort: (key: string) => void
    onHide: (key: string) => void
    onDelete: (key: string) => void
    onCellChange: (rowIndex: number, key: string, value: unknown) => void
}

export const typeIcons: Record<ColumnType, React.ComponentType<{ className?: string }>> = {
    text: Type,
    long_text: AlignLeft,
    checkbox: CheckSquare,
    select: List,
    date: Calendar,
    number: Hash,
    phone: Phone,
    email: Mail,
    currency: DollarSign,
    percent: Percent,
}

export const buildColumns = (
    columnConfigs: ColumnConfig[],
    actions: ColumnActions
): ColumnDef<Row>[] => {
    return columnConfigs.map((config) => {
        const Icon = typeIcons[config.type]

        return {
            accessorKey: config.key,
            header: () => (
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                        <Icon className="size-3.5" />
                        <span>{config.key}</span>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-xs">
                                <ChevronDown />
                                <span className="sr-only">Column options for {config.key}</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                            <DropdownMenuItem onClick={() => actions.onEdit(config.key)}>
                                <Pencil />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => actions.onDuplicate(config.key)}>
                                <Copy />
                                Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => actions.onInsertLeft(config.key)}>
                                <ArrowLeft />
                                Insert left
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => actions.onInsertRight(config.key)}>
                                <ArrowRight />
                                Insert right
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => actions.onSort(config.key)}>
                                <ArrowUpDown />
                                Sort
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => actions.onHide(config.key)}>
                                <EyeOff />
                                Hide
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                variant="destructive"
                                onClick={() => actions.onDelete(config.key)}
                            >
                                <Trash2 />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ),
            meta: { type: config.type, options: config.options },
            cell: ({ getValue, row: tableRow, table }) => {
                const value = getValue()
                const rowIndex = tableRow.index

                if (config.type === "checkbox") {
                    return (
                        <Checkbox
                            checked={Boolean(value)}
                            onCheckedChange={(checked) =>
                                actions.onCellChange(rowIndex, config.key, Boolean(checked))
                            }
                        />
                    )
                }

                if (config.type === "select" && config.options) {
                    return (
                        <span className="text-sm">
                            {value != null ? String(value) : ""}
                        </span>
                    )
                }

                if (config.type === "long_text") {
                    return (
                        <span className="text-sm line-clamp-2">
                            {value != null ? String(value) : ""}
                        </span>
                    )
                }

                return (
                    <span className="text-sm">
                        {formatCellValue(value, config.type)}
                    </span>
                )
            },
        }
    })
}

export const initialColumns: ColumnConfig[] = [
    { key: "status", type: "text" },
    { key: "email", type: "email" },
    { key: "amount", type: "currency" },
]
