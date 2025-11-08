import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import { BookOpen } from "lucide-react"

interface JuzDistribution {
  juz: string
  students: number
}

interface JuzDistributionChartProps {
  data: JuzDistribution[]
}

// Colors for the pie chart
const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#84cc16", "#ec4899", "#6366f1"]

// Custom Legend Component
const CustomLegend = ({ chartData }: { chartData: Array<{ name: string; value: number; color: string }> }) => {
  return (
    <div className="flex flex-wrap justify-center gap-4 pt-4">
      {chartData.map((entry, index) => (
        <div key={`legend-${index}`} className="flex items-center gap-1.5">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-gray-700">{entry.name}</span>
        </div>
      ))}
    </div>
  )
}

export function JuzDistributionChart({ data }: JuzDistributionChartProps) {
  // Sort data by juz number (lowest to highest)
  const sortedData = [...data].sort((a, b) => {
    const juzA = parseInt(a.juz.replace('Juz ', ''))
    const juzB = parseInt(b.juz.replace('Juz ', ''))
    return juzA - juzB
  })

  // Transform data for the chart
  const chartData = sortedData.map((item, index) => ({
    name: item.juz,
    value: item.students,
    color: colors[index % colors.length]
  }))

  return (
    <Card className="border-gray-200/60 shadow-lg ">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Taburan Juz Pelajar
        </CardTitle>
        <CardDescription>Taburan pelajar berdasarkan juz hafalan semasa</CardDescription>
      </CardHeader>
      <CardContent className="mt-2">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={90}
              paddingAngle={5}
              dataKey="value"
              nameKey="name"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              labelStyle={{ fontSize: '13px' }}
              contentStyle={{ fontSize: '13px' }}
            />
          </PieChart>
        </ResponsiveContainer>
        <CustomLegend chartData={chartData} />
      </CardContent>
    </Card>
  )
}
