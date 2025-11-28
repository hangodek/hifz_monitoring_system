module RoleAuthorization
  extend ActiveSupport::Concern

  included do
    before_action :authorize_role
  end

  private

  def authorize_role
    return unless Current.user

    case Current.user.role
    when "admin"
      # Admin can access everything - no restrictions
      return
    when "teacher"
      # Teacher can only access teacher mode and activities
      unless allowed_for_teacher?
        redirect_to teachers_path, alert: "Anda tidak memiliki akses ke halaman ini"
      end
    when "parent"
      # Parent can only access parent dashboard
      unless allowed_for_parent?
        redirect_to parent_path, alert: "Anda hanya dapat melihat progress anak Anda"
      end
    end
  end

  def allowed_for_teacher?
    # Allow teacher to access:
    # - teachers path (teacher mode)
    # - activities (CRUD)
    # - logout
    controller_name = params[:controller]
    action_name = params[:action]

    allowed_controllers = %w[teachers activities sessions]
    
    allowed_controllers.include?(controller_name)
  end

  def allowed_for_parent?
    # Allow parent to access:
    # - parents controller (view only)
    # - sessions (logout)
    controller_name = params[:controller]
    
    allowed_controllers = %w[parents sessions]
    
    allowed_controllers.include?(controller_name)
  end

  def require_admin!
    unless Current.user&.admin?
      redirect_to root_path, alert: "Akses ditolak. Hanya pengurus yang dapat mengakses halaman ini."
    end
  end

  def require_teacher_or_admin!
    unless Current.user&.teacher? || Current.user&.admin?
      redirect_to root_path, alert: "Akses ditolak."
    end
  end

  def require_parent!
    unless Current.user&.parent?
      redirect_to root_path, alert: "Akses ditolak. Hanya orang tua yang dapat mengakses halaman ini."
    end
  end
end
