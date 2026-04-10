class BackfillCompletionStatusOnActivities < ActiveRecord::Migration[7.1]
  def up
    execute <<~SQL
      UPDATE activities
      SET completion_status = 1
    SQL
  end

  def down
    execute <<~SQL
      UPDATE activities
      SET completion_status = 0
    SQL
  end
end
