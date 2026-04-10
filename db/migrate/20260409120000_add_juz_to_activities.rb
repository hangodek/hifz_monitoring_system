class AddJuzToActivities < ActiveRecord::Migration[7.1]
  def change
    add_column :activities, :juz, :integer
    add_index :activities, :juz
  end
end
