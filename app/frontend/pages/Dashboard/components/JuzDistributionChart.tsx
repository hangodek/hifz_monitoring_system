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

// Colors for the pie chart - using gradient-friendly colors
const colors = [
  "#3b82f6", // blue-500
  "#10b981", // green-500  
  "#f59e0b", // amber-500
  "#ef4444", // red-500
  "#8b5cf6", // violet-500
  "#06b6d4", // cyan-500
  "#f97316", // orange-500
  "#84cc16", // lime-500
  "#ec4899", // pink-500
  "#6366f1"  // indigo-500
]

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
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-purple-50/30 hover:shadow-xl transition-shadow duration-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-900">
          <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-purple-600" />
          </div>
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
