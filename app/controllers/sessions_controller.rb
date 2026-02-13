class SessionsController < ApplicationController
  allow_unauthenticated_access only: %i[ new create ]
  rate_limit to: 10, within: 3.minutes, only: :create, with: -> { redirect_to new_session_url, alert: "Try again later." }

  def new
    settings = AppSetting.instance
    render inertia: "Session/New", props: {
      app_settings: {
        app_name: settings.app_name,
        app_subtitle: settings.app_subtitle,
        logo_url: settings.logo_url
      }
    }
  end

  def create
    if user = User.authenticate_by(params.permit(:username, :password))
      start_new_session_for user
      redirect_to redirect_path_for_role(user)
    else
      flash.now[:alert] = "Invalid username or password. Please try again."
      settings = AppSetting.instance
      render inertia: "Session/New", props: {
        app_settings: {
          app_name: settings.app_name,
          app_subtitle: settings.app_subtitle,
          logo_url: settings.logo_url
        }
      }, status: :unprocessable_entity
    end
  end

  def destroy
    terminate_session
    redirect_to new_session_path
  end

  private

  def redirect_path_for_role(user)
    case user.role
    when "admin"
      dashboard_index_path  # Keep existing dashboard for pengurus
    when "teacher"
      teachers_path   # Redirect to teacher mode for guru
    when "parent"
      parent_path     # Redirect to parent dashboard
    else
      dashboard_path  # Default fallback
    end
  end
end
