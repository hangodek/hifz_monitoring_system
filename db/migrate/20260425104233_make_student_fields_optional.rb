class MakeStudentFieldsOptional < ActiveRecord::Migration[8.0]
  def change
    change_column_null :students, :birth_place, true
    change_column_null :students, :birth_date, true
    change_column_null :students, :father_name, true
  end
end
