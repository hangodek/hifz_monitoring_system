class AddStudentIdToUsers < ActiveRecord::Migration[8.0]
  def change
    add_column :users, :student_id, :integer
    add_index :users, :student_id
    add_foreign_key :users, :students, column: :student_id
  end
end
