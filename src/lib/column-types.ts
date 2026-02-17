export const COLUMN_TYPES = [
    "text",
    "long_text",
    "checkbox",
    "select",
    "date",
    "number",
    "phone",
    "email",
    "currency",
    "percent",
] as const

export type ColumnType = (typeof COLUMN_TYPES)[number]

export interface SelectOption {
    label: string
    color: string
}

export const OPTION_COLORS = [
    { name: "Gray", value: "#6b7280" },
    { name: "Red", value: "#ef4444" },
    { name: "Orange", value: "#f97316" },
    { name: "Amber", value: "#f59e0b" },
    { name: "Green", value: "#22c55e" },
    { name: "Teal", value: "#14b8a6" },
    { name: "Blue", value: "#3b82f6" },
    { name: "Indigo", value: "#6366f1" },
    { name: "Purple", value: "#a855f7" },
    { name: "Pink", value: "#ec4899" },
] as const

export interface ColumnConfig {
    key: string
    type: ColumnType
    options?: SelectOption[]
}

export const COLUMN_TYPE_LABELS: Record<ColumnType, string> = {
    text: "Text",
    long_text: "Long text",
    checkbox: "Checkbox",
    select: "Select",
    date: "Date",
    number: "Number",
    phone: "Phone number",
    email: "Email",
    currency: "Currency",
    percent: "Percent",
}

export const getDefaultValue = (type: ColumnType): unknown => {
    switch (type) {
        case "checkbox":
            return false
        case "number":
        case "currency":
        case "percent":
            return ""
        default:
            return ""
    }
}

export const formatCellValue = (value: unknown, type: ColumnType): string => {
    if (value == null || value === "") return ""

    switch (type) {
        case "currency": {
            const num = Number(value)
            if (isNaN(num)) return String(value)
            return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        }
        case "percent": {
            const num = Number(value)
            if (isNaN(num)) return String(value)
            return `${num}%`
        }
        case "phone": {
            const digits = String(value).replace(/\D/g, "")
            if (digits.length === 10) {
                return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
            }
            if (digits.length === 11 && digits.startsWith("1")) {
                return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
            }
            return String(value)
        }
        case "date": {
            const d = new Date(String(value))
            if (isNaN(d.getTime())) return String(value)
            return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
        }
        case "number": {
            const num = Number(value)
            if (isNaN(num)) return String(value)
            return num.toLocaleString()
        }
        default:
            return String(value)
    }
}
