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
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-emerald-50/30 hover:shadow-xl transition-shadow duration-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-emerald-900">
          <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          </div>
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
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="memorization" 
              stroke="#f59e0b" 
              strokeWidth={3} 
              name="Aktiviti Hafalan"
              dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
