import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts"
import { TrendingUp } from "lucide-react"

interface MonthlyProgress {
  month: string
  revision: number
  memorization: number
}

interface ProgressChartProps {
  data: MonthlyProgress[]
}

export function ProgressChart({ data }: ProgressChartProps) {
  return (
    <Card className="border-gray-200/60 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Kemajuan Murajaah & Hafalan Bulanan
        </CardTitle>
        <CardDescription>Aktiviti bulanan semua pelajar</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="month" 
              fontSize={12}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              fontSize={12}
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              labelStyle={{ fontSize: '12px' }}
              contentStyle={{ fontSize: '12px' }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '12px' }}
            />
            <Line 
              type="monotone" 
              dataKey="revision" 
              stroke="#10b981" 
              strokeWidth={3} 
              name="Aktiviti Murajaah" 
            />
            <Line 
              type="monotone" 
              dataKey="memorization" 
              stroke="#3b82f6" 
              strokeWidth={3} 
              name="Aktiviti Hafalan" 
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
