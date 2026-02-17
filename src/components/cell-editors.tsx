"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { formatCellValue } from "@/lib/column-types"

const cellInputClassName =
    "h-auto border-0 shadow-none rounded-none bg-transparent px-0 py-0 focus-visible:ring-0 focus-visible:border-0 text-sm"

interface CellEditorProps {
    value: unknown
    onChange: (value: unknown) => void
}

export const TextCellEditor = ({ value, onChange }: CellEditorProps) => (
    <Input
        className={cellInputClassName}
        value={value != null ? String(value) : ""}
        onChange={(e) => onChange(e.target.value)}
    />
)

export const LongTextCellEditor = ({ value, onChange }: CellEditorProps) => (
    <Textarea
        className={`${cellInputClassName} min-h-0 resize-none field-sizing-content`}
        value={value != null ? String(value) : ""}
        onChange={(e) => onChange(e.target.value)}
        rows={1}
    />
)

export const CheckboxCellEditor = ({ value, onChange }: CellEditorProps) => (
    <Checkbox
        checked={Boolean(value)}
        onCheckedChange={(checked) => onChange(Boolean(checked))}
    />
)

interface SelectCellEditorProps extends CellEditorProps {
    options: string[]
}

export const SelectCellEditor = ({ value, onChange, options }: SelectCellEditorProps) => {
    const stringValue = value != null && value !== "" ? String(value) : undefined

    if (options.length === 0) {
        return <span className="text-sm text-muted-foreground">No options configured</span>
    }

    return (
        <Select
            value={stringValue}
            onValueChange={(v) => onChange(v)}
        >
            <SelectTrigger className={`${cellInputClassName} w-full`}>
                <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent position="popper">
                {options.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                        {opt}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}

export const DateCellEditor = ({ value, onChange }: CellEditorProps) => {
    const [open, setOpen] = useState(false)
    const dateValue = value ? new Date(String(value)) : undefined
    const isValid = dateValue && !isNaN(dateValue.getTime())

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className="w-full text-left text-sm outline-none"
                >
                    {isValid
                        ? formatCellValue(value, "date")
                        : <span className="text-muted-foreground">Pick a date</span>}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={isValid ? dateValue : undefined}
                    onSelect={(date) => {
                        onChange(date ? date.toISOString() : "")
                        setOpen(false)
                    }}
                />
            </PopoverContent>
        </Popover>
    )
}

export const NumberCellEditor = ({ value, onChange }: CellEditorProps) => (
    <Input
        className={cellInputClassName}
        type="number"
        value={value != null ? String(value) : ""}
        onChange={(e) => onChange(e.target.value)}
    />
)

export const PhoneCellEditor = ({ value, onChange }: CellEditorProps) => {
    const formatPhone = (raw: string): string => {
        const digits = raw.replace(/\D/g, "").slice(0, 10)
        if (digits.length <= 3) return digits
        if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
    }

    const handleChange = (raw: string) => {
        const digits = raw.replace(/\D/g, "").slice(0, 10)
        onChange(digits)
    }

    const digits = value != null ? String(value).replace(/\D/g, "") : ""

    return (
        <Input
            className={cellInputClassName}
            type="tel"
            value={formatPhone(digits)}
            onChange={(e) => handleChange(e.target.value)}
        />
    )
}

export const EmailCellEditor = ({ value, onChange }: CellEditorProps) => (
    <Input
        className={cellInputClassName}
        type="email"
        value={value != null ? String(value) : ""}
        onChange={(e) => onChange(e.target.value)}
    />
)

export const CurrencyCellEditor = ({ value, onChange }: CellEditorProps) => (
    <div className="flex items-center gap-0.5">
        <span className="text-sm text-muted-foreground">$</span>
        <Input
            className={cellInputClassName}
            type="number"
            step="0.01"
            value={value != null ? String(value) : ""}
            onChange={(e) => onChange(e.target.value)}
        />
    </div>
)

export const PercentCellEditor = ({ value, onChange }: CellEditorProps) => (
    <div className="flex items-center gap-0.5">
        <Input
            className={cellInputClassName}
            type="number"
            value={value != null ? String(value) : ""}
            onChange={(e) => onChange(e.target.value)}
        />
        <span className="text-sm text-muted-foreground">%</span>
    </div>
)
