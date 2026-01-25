import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter } from "lucide-react"

interface FiltersAndSearchProps {
  searchTerm: string
  setSearchTerm: (value: string) => void
  classFilter: string
  setClassFilter: (value: string) => void
  statusFilter: string
  setStatusFilter: (value: string) => void
  juzFilter: string
  setJuzFilter: (value: string) => void
  viewMode: "grid" | "list"
  setViewMode: (value: "grid" | "list") => void
}

export function FiltersAndSearch({
  searchTerm,
  setSearchTerm,
  classFilter,
  setClassFilter,
  statusFilter,
  setStatusFilter,
  juzFilter,
  setJuzFilter,
  viewMode,
  setViewMode
}: FiltersAndSearchProps) {
  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-cyan-50/30 hover:shadow-xl transition-shadow duration-200">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-600" />
          </div>
          <h2 className="text-base sm:text-lg font-semibold bg-gradient-to-r from-cyan-700 to-blue-700 bg-clip-text text-transparent">Penapis & Carian</h2>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center flex-1">
            <div className="relative flex-1 max-w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-cyan-600" />
              <Input
                placeholder="Cari nama pelajar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-cyan-200 focus:border-cyan-400 focus:ring-cyan-400"
              />
            </div>
            <div className="flex flex-wrap justify-center items-center gap-2 sm:flex sm:gap-4">
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger className="border-cyan-200 hover:border-cyan-300 cursor-pointer">
                  <SelectValue placeholder="Semua Kelas" />
                </SelectTrigger>
                <SelectContent className="border-gray-200/60">
                  <SelectItem className="cursor-pointer" value="all">Semua Kelas</SelectItem>
                  {/* Kelas 7 */}
                  <SelectItem className="cursor-pointer" value="7A">7A</SelectItem>
                  <SelectItem className="cursor-pointer" value="7B">7B</SelectItem>
                  <SelectItem className="cursor-pointer" value="7C">7C</SelectItem>
                  <SelectItem className="cursor-pointer" value="7D">7D</SelectItem>
                  {/* Kelas 8 */}
                  <SelectItem className="cursor-pointer" value="8A">8A</SelectItem>
                  <SelectItem className="cursor-pointer" value="8B">8B</SelectItem>
                  <SelectItem className="cursor-pointer" value="8C">8C</SelectItem>
                  <SelectItem className="cursor-pointer" value="8D">8D</SelectItem>
                  {/* Kelas 9 */}
                  <SelectItem className="cursor-pointer" value="9A">9A</SelectItem>
                  <SelectItem className="cursor-pointer" value="9B">9B</SelectItem>
                  <SelectItem className="cursor-pointer" value="9C">9C</SelectItem>
                  <SelectItem className="cursor-pointer" value="9D">9D</SelectItem>
                  {/* Kelas 10 */}
                  <SelectItem className="cursor-pointer" value="10A">10A</SelectItem>
                  <SelectItem className="cursor-pointer" value="10B">10B</SelectItem>
                  <SelectItem className="cursor-pointer" value="10C">10C</SelectItem>
                  <SelectItem className="cursor-pointer" value="10D">10D</SelectItem>
                  {/* Kelas 11 */}
                  <SelectItem className="cursor-pointer" value="11A">11A</SelectItem>
                  <SelectItem className="cursor-pointer" value="11B">11B</SelectItem>
                  <SelectItem className="cursor-pointer" value="11C">11C</SelectItem>
                  <SelectItem className="cursor-pointer" value="11D">11D</SelectItem>
                  {/* Kelas 12 */}
                  <SelectItem className="cursor-pointer" value="12A">12A</SelectItem>
                  <SelectItem className="cursor-pointer" value="12B">12B</SelectItem>
                  <SelectItem className="cursor-pointer" value="12C">12C</SelectItem>
                  <SelectItem className="cursor-pointer" value="12D">12D</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-cyan-200 hover:border-cyan-300 cursor-pointer">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent className="border-gray-200/60">
                  <SelectItem className="cursor-pointer" value="all">Semua Status</SelectItem>
                  <SelectItem className="cursor-pointer" value="active">Aktif</SelectItem>
                  <SelectItem className="cursor-pointer" value="inactive">Tidak Aktif</SelectItem>
                  <SelectItem className="cursor-pointer" value="graduated">Lulus</SelectItem>
                </SelectContent>
              </Select>
              <Select value={juzFilter} onValueChange={setJuzFilter}>
                <SelectTrigger className="border-cyan-200 hover:border-cyan-300 cursor-pointer">
                  <SelectValue placeholder="Semua Juz" />
                </SelectTrigger>
                <SelectContent className="border-gray-200/60">
                  <SelectItem className="cursor-pointer" value="all">Semua Juz</SelectItem>
                  <SelectItem className="cursor-pointer" value="Juz 1-5">Juz 1-5</SelectItem>
                  <SelectItem className="cursor-pointer" value="Juz 6-10">Juz 6-10</SelectItem>
                  <SelectItem className="cursor-pointer" value="Juz 11-15">Juz 11-15</SelectItem>
                  <SelectItem className="cursor-pointer" value="Juz 16-20">Juz 16-20</SelectItem>
                  <SelectItem className="cursor-pointer" value="Juz 21-25">Juz 21-25</SelectItem>
                  <SelectItem className="cursor-pointer" value="Juz 26-30">Juz 26-30</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-center sm:justify-end gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                className={`cursor-pointer flex-1 sm:flex-none ${viewMode === "grid"
                    ? "bg-black text-white hover:bg-gray-800"
                    : "border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
                  }`}
                onClick={() => setViewMode("grid")}
              >
                Grid
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                className={`cursor-pointer flex-1 sm:flex-none ${viewMode === "list"
                    ? "bg-black text-white hover:bg-gray-800"
                    : "border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
                  }`}
                onClick={() => setViewMode("list")}
              >
                Senarai
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
