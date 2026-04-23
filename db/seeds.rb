# frozen_string_literal: true

# Production-safe seed: only creates the default admin account.
# Dummy data has been moved to db/seeds/development.rb for local use only.
#
# IMPORTANT: This file is idempotent — safe to run multiple times.
# On subsequent deploys, just run: rails db:migrate
# Never run db:seed again on production unless you want to recreate the admin.

admin_username = ENV.fetch("ADMIN_USERNAME", "admin")
admin_password = ENV.fetch("ADMIN_PASSWORD", "admin123")
admin_name     = ENV.fetch("ADMIN_NAME", "Administrator")

if User.exists?(username: admin_username)
  puts "Admin '#{admin_username}' already exists — skipping."
else
  User.create!(
    username: admin_username,
    name:     admin_name,
    role:     "admin",
    password: admin_password,
    password_confirmation: admin_password
  )
  puts "Admin '#{admin_username}' created."
end

puts "Seed complete. Users: #{User.count}"
