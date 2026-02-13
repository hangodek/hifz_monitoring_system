class SettingsController < ApplicationController
  before_action :require_admin
  before_action :set_setting

  def edit
    render inertia: "Settings/Edit", props: {
      setting: {
        id: @setting.id,
        app_name: @setting.app_name,
        app_subtitle: @setting.app_subtitle,
        institution_name: @setting.institution_name,
        logo_url: @setting.logo_url,
        has_logo: @setting.logo.attached?
      }
    }
  end

  def update
    if @setting.update(setting_params)
      redirect_to edit_settings_path, notice: "Pengaturan berhasil diperbarui"
    else
      render inertia: "Settings/Edit", props: {
        setting: {
          id: @setting.id,
          app_name: @setting.app_name,
          app_subtitle: @setting.app_subtitle,
          institution_name: @setting.institution_name,
          logo_url: @setting.logo_url,
          has_logo: @setting.logo.attached?
        },
        errors: @setting.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  private

  def set_setting
    @setting = AppSetting.instance
  end

  def setting_params
    params.require(:app_setting).permit(:app_name, :app_subtitle, :institution_name, :logo)
  end

  def require_admin
    unless Current.user&.admin?
      redirect_to root_path, alert: "Anda tidak memiliki akses ke halaman ini"
    end
  end
end
