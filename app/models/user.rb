class User < ApplicationRecord
  has_secure_password
  has_many :sessions, dependent: :destroy

  # Define role enum: pengurus (admin), guru (teacher), orang_tua (parent)
  enum :role, { pengurus: "pengurus", guru: "guru", orang_tua: "orang_tua" }, validate: true

  normalizes :email_address, with: ->(e) { e.strip.downcase }

  # Role check helpers
  def pengurus?
    role == "pengurus"
  end

  def guru?
    role == "guru"
  end

  def orang_tua?
    role == "orang_tua"
  end
end
