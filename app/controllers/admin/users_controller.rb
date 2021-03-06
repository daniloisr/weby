# coding: utf-8
class Admin::UsersController < ApplicationController
  before_filter :require_user, :except => [:new, :create, :activate]
  before_filter :check_authorization, :except => [:new, :create, :show, :edit, :update, :activate]
  before_filter :get_theme
  respond_to :html, :xml
  helper_method :sort_column

  def change_theme
    if params[:id] && current_user
      @user = current_user
      @user.update_attribute(:theme, params[:id])
      flash[:success] = t("look_changed")
    end
    redirect_back_or_default root_path
  end

  def manage_roles
    # Se a ação for selecionada para um site:
    if @site
      # Seleciona os todos os usuários que não são administradores
      @users = User.no_admin
      # Usuários que possuem papel no site e não são administradores
      @site_users = User.by_site(@site) - User.admin
      # Usuários que NÃO possuem papel no site e não são administradores
      @users_unroled = User.by_no_site(@site) - User.admin
      # Busca os papéis do site e global
      @roles = @site.roles.order("id")
      # Quando a edição dos papeis é solicitada
      @user = User.find(params[:user_id]) if params[:user_id]
    else
      # Seleciona os todos os usuários que não são administradores
      @user = User.no_admin
      # Usuários que possuem papel global e não são administradores
      @site_users = User.global_role - User.admin
      # Todos os usuários menos os que não são administradores e possuem papeis globais
      @users_unroled = User.all - (User.admin + User.global_role)
      # Busca os papéis globais
      @roles = Role.globals
      # Quando a edição dos papeis é solicitada
      @user = User.find(params[:user_id]) if params[:user_id]
    end
  end

  def change_roles
    params[:role_ids] ||= []
    user_ids = []
    user_ids.push(params[:user][:id]).flatten!

    user_ids.each do |user_id|
      user = User.find(user_id)
      # Limpa os papeis do usuário no site
      user.role_ids.each do |role_id|
        if @site and @site.roles.map{|r| r.id }.index(role_id)
          user.role_ids -= [role_id]
        end
      end
      
      # Se for global, limpa os papeis globais
      unless @site
        user.roles.where(site_id: nil).each{|r| user.role_ids -= [r.id] }
      end
      # NOTE Talvez seja melhor usar (user.role_ids += params[:role_ids]).uniq
      # assim removemos o each logo a cima
      user.role_ids += params[:role_ids]
    end
    redirect_to :action => 'manage_roles'
  end

  def index
    @users = User.login_or_name_like(params[:search]).
      order(sort_column + " " + sort_direction).page(params[:page]).
      per(params[:per_page]) 

    if @site 
      @users = @users.by_site(@site.id)
    end

    @roles = Role.select('id, name, theme').
      group("id, name, theme").order("id")

    unless @users
      flash.now[:warning] = (t"none_param", :param => t("user.one"))
    end
  end

  def new
    @user = User.new
  end

  def create
    @user = User.new(user_params)
    if @user.save
      @user.send_activation_instructions!(request.env["SERVER_NAME"])
      flash[:success] = t("create_account_successful")
      redirect_to current_user ? admin_user_path(@user) : login_path
    else
      flash[:error] = t("problem_create_account")
      render :action => :new
    end
  end

  def activate
    @user = User.find_using_perishable_token(params[:activation_code], 1.week) || (raise Exception)
    raise Exception if @user.active?
    if @user.activate!
      UserSession.create(@user, false)
      @user.send_activation_confirmation!(request.env["SERVER_NAME"])
      redirect_to admin_user_path(@user)
    else
      render :action => :new
    end
  end

  def show
    @user = User.find(params[:id])
    respond_with(:admin, @user)
  end

  def edit
    @user = User.find(params[:id])
    respond_with(:admin, @user)
  end

  def update
    unless current_user.is_admin
      params[:id] = current_user.id
    end
    @user = User.find(params[:id])
    @user.update_attributes(user_params)
    flash[:success] = t"updated", :param => t("account")
    respond_with(:admin, @user)
  end

  def destroy
    @user = User.find(params[:id])
    @user.destroy
    flash[:success] = t('destroyed_param', :param => @user.first_name)
  rescue ActiveRecord::DeleteRestrictionError
    flash[:warning] = t("user_cant_be_deleted")
  ensure
    redirect_to admin_users_path
  end

  def toggle_field
    @user = User.find(params[:id])
    if params[:field] 
      if @user.update_attributes(params[:field] => (@user[params[:field]] == 0 or not @user[params[:field]] ? true : false))
        flash[:success] = t"successfully_updated"
      else
        flash[:error] = t"error_updating_object"
      end
    end
    redirect_to admin_users_path
  end
  
  def set_admin
    @user = User.find(params[:id])
    if params[:field] 
      if @user.update_attributes(params[:field] => (@user[params[:field]] == 0 or not @user[params[:field]] ? true : false))
        flash[:success] = t"successfully_updated"
      else
        flash[:error] = t"error_updating_object"
      end
    end
    redirect_to admin_users_path
  end

  private
  def sort_column
    User.column_names.include?(params[:sort]) ? params[:sort] : 'id'
  end
  # Cria uma variável themes com base nos temas disponíveis
  def get_theme
    files = []
    for file in Dir[File.join(Rails.root + "app/views/layouts/[a-zA-Z]*")]
      files << file.split("/")[-1].split(".")[0]
    end
    @themes = files
  end

  def user_params
    params[:user].slice(:login, :email, :password, :password_confirmation, :first_name, :last_name, :phone, :mobile, :theme)
  end
end
