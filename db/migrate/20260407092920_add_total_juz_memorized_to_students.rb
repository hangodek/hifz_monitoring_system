class AddTotalJuzMemorizedToStudents < ActiveRecord::Migration[8.0]
  def change
    add_column :students, :total_juz_memorized, :integer, default: 0, null: false
  end
end
