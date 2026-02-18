class AddIndexesForTeacherPerformance < ActiveRecord::Migration[8.0]
  def change
    # Composite index for active students sorted by name
    add_index :students, [:status, :name], name: 'index_students_on_status_and_name'
    
    # Index for searching students by name (used in LIKE queries)
    add_index :students, :name, name: 'index_students_on_name'
    
    # Index for filtering by class
    add_index :students, :class_level, name: 'index_students_on_class_level'
    
    # Composite index for activities by student and date
    add_index :activities, [:student_id, :created_at], name: 'index_activities_on_student_and_created_at'
    
    # Index for recent activities queries with status join
    add_index :activities, :created_at, name: 'index_activities_on_created_at'
  end
end
