import { type Row, initialColumns } from "@/components/columns"
import { DataTable } from "@/components/data-table"

async function getData(): Promise<Row[]> {
  // Fetch data from your API here.
  return [
    {
      id: "728ed52f",
      amount: 100,
      status: "pending",
      email: "m@example.com",
    },
  ]
}

export default async function DemoPage() {
  const data = await getData()

  return (
    <div className="container mx-auto py-10">
      <DataTable initialColumns={initialColumns} data={data} />
    </div>
  )
}
