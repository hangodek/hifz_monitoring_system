class MakeGenderOptional < ActiveRecord::Migration[8.0]
  def change
    change_column_null :students, :gender, true
  end
end
