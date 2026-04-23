class UsersController < ApplicationController
  include RoleAuthorization
  
  skip_before_action :authorize_role
  before_action :require_admin!
  before_action :set_user, only: [ :update_role, :update ]

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

    # Active students for parent account creation
    students_data = Student.active.order(:name).map do |s|
      { id: s.id, name: s.name, class_level: s.class_level }
    end

    respond_to do |format|
      format.html do
        render inertia: "Users/Index", props: {
          users: users_data,
          available_roles: User.roles.keys,
          current_filter: params[:role],
          students: students_data
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

  def create
    @user = User.new(user_params)

    if @user.save
      render json: {
        success: true,
        message: "Pengguna berhasil dibuat.",
        user: {
          id: @user.id,
          username: @user.username,
          name: @user.name,
          email: @user.email_address,
          role: @user.role,
          student_name: @user.student&.name,
          student_id: @user.student_id,
          created_at: @user.created_at.strftime("%d/%m/%Y")
        }
      }, status: :created
    else
      render json: {
        success: false,
        errors: @user.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  def update
    update_attrs = {}
    update_attrs[:name]       = params.dig(:user, :name).presence       || @user.name
    update_attrs[:username]   = params.dig(:user, :username).presence   || @user.username
    update_attrs[:student_id] = params.dig(:user, :student_id)          if params.dig(:user, :student_id).present?

    new_pw = params.dig(:user, :password)
    if new_pw.present?
      update_attrs[:password]              = new_pw
      update_attrs[:password_confirmation] = params.dig(:user, :password_confirmation)
    end

    if @user.update(update_attrs)
      render json: {
        success: true,
        message: "Pengguna berhasil diperbarui.",
        user: {
          id: @user.id,
          username: @user.username,
          name: @user.name,
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


  def set_user
    @user = User.find(params[:id])
  end

  def user_params
    params.require(:user).permit(:name, :username, :password, :password_confirmation, :role, :student_id)
  end
end
