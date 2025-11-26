module RoleAuthorization
  extend ActiveSupport::Concern

  included do
    before_action :authorize_role
  end

  private

  def authorize_role
    return unless Current.user

    case Current.user.role
    when "pengurus"
      # Pengurus can access everything - no restrictions
      return
    when "guru"
      # Guru can only access teacher mode and activities
      unless allowed_for_guru?
        redirect_to teachers_path, alert: "Anda tidak memiliki akses ke halaman ini"
      end
    when "orang_tua"
      # Orang tua can only access parent dashboard
      unless allowed_for_orang_tua?
        redirect_to parent_path, alert: "Anda hanya dapat melihat progress anak Anda"
      end
    end
  end

  def allowed_for_guru?
    # Allow guru to access:
    # - teachers path (teacher mode)
    # - activities (CRUD)
    # - logout
    controller_name = params[:controller]
    action_name = params[:action]

    allowed_controllers = %w[teachers activities sessions]
    
    allowed_controllers.include?(controller_name)
  end

  def allowed_for_orang_tua?
    # Allow orang_tua to access:
    # - parents controller (view only)
    # - sessions (logout)
    controller_name = params[:controller]
    
    allowed_controllers = %w[parents sessions]
    
    allowed_controllers.include?(controller_name)
  end

  def require_pengurus!
    unless Current.user&.pengurus?
      redirect_to root_path, alert: "Akses ditolak. Hanya pengurus yang dapat mengakses halaman ini."
    end
  end

  def require_guru_or_pengurus!
    unless Current.user&.guru? || Current.user&.pengurus?
      redirect_to root_path, alert: "Akses ditolak."
    end
  end
end
