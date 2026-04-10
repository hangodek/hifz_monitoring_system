class AddCompletionStatusToActivities < ActiveRecord::Migration[7.1]
  def change
    add_column :activities, :completion_status, :integer, null: false, default: 0
    add_index :activities, :completion_status
  end
end
