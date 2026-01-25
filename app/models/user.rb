class User < ApplicationRecord
  has_secure_password
  has_many :sessions, dependent: :destroy
  belongs_to :student, optional: true

  # Define role enum: admin, teacher, parent
  enum :role, { admin: "admin", teacher: "teacher", parent: "parent" }, validate: true

  normalizes :email_address, with: ->(e) { e.strip.downcase }

  # Validations
  validates :student_id, presence: true, if: :parent?

  # Role check helpers
  def admin?
    role == "admin"
  end

  def teacher?
    role == "teacher"
  end

  def parent?
    role == "parent"
  end
end
