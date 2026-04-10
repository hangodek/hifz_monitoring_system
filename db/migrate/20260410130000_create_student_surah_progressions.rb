class CreateStudentSurahProgressions < ActiveRecord::Migration[8.0]
  def change
    create_table :student_surah_progressions do |t|
      t.references :student, null: false, foreign_key: true
      t.integer :juz, null: false
      t.string :surah, null: false
      t.integer :completion_status, null: false, default: 0
      t.datetime :last_activity_at

      t.timestamps
    end

    add_index :student_surah_progressions, [ :student_id, :juz, :surah ], unique: true, name: "idx_student_surah_progressions_unique"
    add_index :student_surah_progressions, :completion_status
  end
end