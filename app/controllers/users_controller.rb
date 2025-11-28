class UsersController < ApplicationController
  include RoleAuthorization
  
  skip_before_action :authorize_role
  before_action :require_admin!
  before_action :set_user, only: [ :update_role ]

  def index
    @users = User.includes(:student).order(created_at: :desc)
    
    # Filter by role if provided
    if params[:role].present? && User.roles.keys.include?(params[:role])
      @users = @users.where(role: params[:role])
    end
    
    users_data = @users.map do |user|
      {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email_address,
        role: user.role,
        student_name: user.student&.name,
        student_id: user.student_id,
        created_at: user.created_at.strftime("%d/%m/%Y")
      }
    end

    respond_to do |format|
      format.html do
        render inertia: "Users/Index", props: {
          users: users_data,
          available_roles: User.roles.keys,
          current_filter: params[:role]
        }
      end
    end
  end

  def update_role
    if @user.update(role: params[:role])
      render json: { 
        success: true, 
        message: "Role berjaya dikemas kini",
        user: {
          id: @user.id,
          email: @user.email_address,
          role: @user.role,
          student_name: @user.student&.name,
          student_id: @user.student_id,
          created_at: @user.created_at.strftime("%d/%m/%Y")
        }
      }
    else
      render json: { 
        success: false, 
        errors: @user.errors.full_messages 
      }, status: :unprocessable_entity
    end
  end

  private

  def set_user
    @user = User.find(params[:id])
  end
end
