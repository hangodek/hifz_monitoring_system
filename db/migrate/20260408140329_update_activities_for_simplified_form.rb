class UpdateActivitiesForSimplifiedForm < ActiveRecord::Migration[7.1]
  def change
    # add new columns for the simplified form
    add_column :activities, :surah, :string
    add_column :activities, :ayat_from, :integer
    add_column :activities, :ayat_to, :integer
    add_column :activities, :kelancaran, :integer
    add_column :activities, :fashohah, :integer
    add_column :activities, :tajwid, :integer

    # remove old columns that are no longer needed
    remove_column :activities, :activity_grade, :string
    remove_column :activities, :surah_from, :string
    remove_column :activities, :surah_to, :string
    remove_column :activities, :page_from, :integer
    remove_column :activities, :page_to, :integer
    remove_column :activities, :juz, :integer
    remove_column :activities, :juz_from, :integer
    remove_column :activities, :juz_to, :integer
  end
end
