class CreateAppSettings < ActiveRecord::Migration[8.0]
  def change
    create_table :app_settings do |t|
      t.string :app_name, default: "Sistem Manajemen Hifz"
      t.string :app_subtitle, default: "Sistem Monitoring Hafalan"
      t.string :institution_name
      t.string :primary_color, default: "#3B82F6"
      t.string :secondary_color, default: "#8B5CF6"

      t.timestamps
    end
    
    # Ensure only one settings record exists
    add_index :app_settings, :id, unique: true
  end
end
