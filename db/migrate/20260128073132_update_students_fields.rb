class UpdateStudentsFields < ActiveRecord::Migration[8.0]
  def change
    # Tambah kolom NISN dan No Induk
    add_column :students, :nisn, :string
    add_column :students, :student_number, :string
    
    # Rename father_phone jadi parent_phone
    rename_column :students, :father_phone, :parent_phone
    
    # Hapus mother_phone dan date_joined
    remove_column :students, :mother_phone, :string
    remove_column :students, :date_joined, :date
  end
end
