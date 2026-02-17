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
import { type ColumnConfig, type ColumnType, COLUMN_TYPE_LABELS } from "@/lib/column-types"
import {
    TextCellEditor,
    LongTextCellEditor,
    CheckboxCellEditor,
    SelectCellEditor,
    DateCellEditor,
    NumberCellEditor,
    PhoneCellEditor,
    EmailCellEditor,
    CurrencyCellEditor,
    PercentCellEditor,
} from "@/components/cell-editors"

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
    const selectColumn: ColumnDef<Row> = {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
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
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
        size: 40,
    }

    const dataColumns: ColumnDef<Row>[] = columnConfigs.map((config) => {
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
            cell: ({ getValue, row: tableRow }) => {
                const value = getValue()
                const rowIndex = tableRow.index
                const handleChange = (v: unknown) =>
                    actions.onCellChange(rowIndex, config.key, v)

                switch (config.type) {
                    case "text":
                        return <TextCellEditor value={value} onChange={handleChange} />
                    case "long_text":
                        return <LongTextCellEditor value={value} onChange={handleChange} />
                    case "checkbox":
                        return <CheckboxCellEditor value={value} onChange={handleChange} />
                    case "select":
                        return (
                            <SelectCellEditor
                                value={value}
                                onChange={handleChange}
                                options={config.options ?? []}
                            />
                        )
                    case "date":
                        return <DateCellEditor value={value} onChange={handleChange} />
                    case "number":
                        return <NumberCellEditor value={value} onChange={handleChange} />
                    case "phone":
                        return <PhoneCellEditor value={value} onChange={handleChange} />
                    case "email":
                        return <EmailCellEditor value={value} onChange={handleChange} />
                    case "currency":
                        return <CurrencyCellEditor value={value} onChange={handleChange} />
                    case "percent":
                        return <PercentCellEditor value={value} onChange={handleChange} />
                    default:
                        return <TextCellEditor value={value} onChange={handleChange} />
                }
            },
        }
    })

    return [selectColumn, ...dataColumns]
}

export const initialColumns: ColumnConfig[] = [
    { key: "status", type: "text" },
    { key: "email", type: "email" },
    { key: "amount", type: "currency" },
]
