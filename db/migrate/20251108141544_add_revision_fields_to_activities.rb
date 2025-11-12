class AddRevisionFieldsToActivities < ActiveRecord::Migration[8.0]
  def change
    add_column :activities, :juz_from, :integer
    add_column :activities, :juz_to, :integer
    add_column :activities, :total_pages, :integer
  end
end
