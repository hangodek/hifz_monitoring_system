class ProfileController < ApplicationController
  def edit
    render inertia: "Profile/Edit", props: {
      current_user: {
        id: Current.user.id,
        name: Current.user.name,
        username: Current.user.username,
        role: Current.user.role
      }
    }
  end

  def update
    user = Current.user
    errors = []

    # Validate current password first if changing password
    if profile_params[:password].present?
      unless user.authenticate(profile_params[:current_password].to_s)
        errors << "Password saat ini tidak sesuai"
      end

      if profile_params[:password] != profile_params[:password_confirmation]
        errors << "Password baru dan konfirmasi tidak cocok"
      end

      if profile_params[:password].length < 6
        errors << "Password baru minimal 6 karakter"
      end
    end

    # Check username uniqueness if changed
    new_username = profile_params[:username].to_s.strip
    if new_username.present? && new_username.downcase != user.username.downcase
      if User.where.not(id: user.id).exists?(username: new_username)
        errors << "Username sudah digunakan"
      end
    end

    if errors.any?
      render json: { success: false, errors: errors }, status: :unprocessable_entity
      return
    end

    update_attrs = { name: profile_params[:name].presence || user.name }
    update_attrs[:username] = new_username if new_username.present?
    update_attrs[:password] = profile_params[:password] if profile_params[:password].present?

    if user.update(update_attrs)
      render json: { success: true, message: "Profil berhasil diperbarui" }
    else
      render json: { success: false, errors: user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def profile_params
    params.permit(:name, :username, :current_password, :password, :password_confirmation)
  end
end
