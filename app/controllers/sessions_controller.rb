class SessionsController < ApplicationController
  allow_unauthenticated_access only: %i[ new create ]
  rate_limit to: 10, within: 3.minutes, only: :create, with: -> { redirect_to new_session_url, alert: "Try again later." }

  def new
    render inertia: "Session/New"
  end

  def create
    if user = User.authenticate_by(params.permit(:username, :password))
      start_new_session_for user
      redirect_to redirect_path_for_role(user)
    else
      flash.now[:alert] = "Invalid username or password. Please try again."
      render inertia: "Session/New", status: :unprocessable_entity
    end
  end

  def destroy
    terminate_session
    redirect_to new_session_path
  end

  private

  def redirect_path_for_role(user)
    case user.role
    when "pengurus"
      dashboard_index_path  # Keep existing dashboard for pengurus
    when "guru"
      teachers_path   # Redirect to teacher mode for guru
    when "orang_tua"
      parent_path     # Redirect to parent dashboard
    else
      dashboard_path  # Default fallback
    end
  end
end
