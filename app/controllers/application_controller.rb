class ApplicationController < ActionController::Base
  include Authentication
  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
  # allow_browser versions: :modern

  inertia_share do
    # Get app settings for dynamic branding
    app_setting = AppSetting.instance
    
    if Current.user
      {
        flash: {
          alert: flash[:alert],
          notice: flash[:notice]
        },
        auth: {
          user: {
            id: Current.user.id,
            name: Current.user.name,
            username: Current.user.username,
            role: Current.user.role
          }
        },
        app_settings: {
          app_name: app_setting.app_name,
          app_subtitle: app_setting.app_subtitle,
          institution_name: app_setting.institution_name,
          logo_url: app_setting.logo_url
        }
      }
    else
      {
        flash: {
          alert: flash[:alert],
          notice: flash[:notice]
        },
        app_settings: {
          app_name: app_setting.app_name,
          app_subtitle: app_setting.app_subtitle,
          institution_name: app_setting.institution_name,
          logo_url: app_setting.logo_url
        }
      }
    end
  end
end
