Rails.application.routes.draw do
  resource :session
  resources :dashboard, only: [ :index ] do
    collection do
      get :activities
    end
  end
  resources :students, only: [ :index, :new, :create, :show, :edit, :update ] do
    resources :activities, only: [ :create, :destroy ]
    collection do
      get :promote
      post :bulk_promote
      get :bulk_import
      post :preview_import
      post :bulk_create
      get 'download_template', defaults: { format: 'xlsx' }
      get :load_more
    end
    member do
      get :activities_list
    end
  end
  resources :teachers, only: [ :index ] do
    collection do
      get :search_students
      get :load_more_activities
    end
  end
  
  # Users management (pengurus only)
  resources :users, only: [ :index ] do
    member do
      patch :update_role
    end
  end
  
  # App Settings (admin only)
  resource :settings, only: [ :edit, :update ]
  
  # Parent dashboard - orang tua can only view their child's progress
  resource :parent, only: [ :show ], controller: 'parents' do
    get :activities_list, on: :member
  end
  
  resources :passwords, param: :token
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Render dynamic PWA files from app/views/pwa/* (remember to link manifest in application.html.erb)
  # get "manifest" => "rails/pwa#manifest", as: :pwa_manifest
  # get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker

  # Defines the root path route ("/")
  root "dashboard#index"
end
