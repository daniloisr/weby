//= require jquery  
//= require jquery_ujs  
//= require bootstrap
//= require_self  

/**
 * FIXME: POG-MASTER!!
 * Para corrigir o erro de console no IE8
 * O IE8 não cria o objeto console enquanto não abrir a 
 * janela do console, por isso algumas coisas com tratamento
 * de exceção usando o console para logar o erro
 * falham totalmente.
 */
if (!window.console) {
   window.console = new Object();
   window.console.warn = function () { };
   window.console.error = function () { }; 
}

/**
 * Eventos genéricos para qualquer documento do WEBY
 */
$(document).ready(function() {
   // Ajax indicator
   $('body').ajaxSend(function(){
      Loading.show();
   }).ajaxComplete(function(evt,xhr){
      Loading.hide();
      FlashMsg.notify(xhr.status);
   });

   $('form').submit(function(){
      Loading.show();
   })

   /////////////////////////////////////////////////////////////////////////////
   // ManageRoles limpa area do formulário
   $('.role_edit').each(function (link) {
      $(this).bind("ajax:success", function(data, status, xhr) {
         $('#user_'+$(this).attr('user_id')).hide();
      });
   });

   // ManageRoles muda o cursor do ponteiro
   $('.role_edit').each( function (link) {
      $(this).bind("ajax:success", function (data, status, xhr) {
         document.body.style.cursor = "default"
         $('#user_'+$(this).attr('user_id')).hide()
      })

      $(this).click( function () {
         document.body.style.cursor = "wait"
      })
   });

});

var WEBY = {};

function hide_enroled_option() {
   $('form[id^=\"form_user\"]').each(function (e){ $(this).hide(); })
}

function hide_form(id) {
   $('#user_' + id).show();
   $('#form_user_' + id).hide();

   return false;
}

function addToSelect(selectId, text){
   var new_cat = prompt(text), option = new Option(new_cat);
   if(!new_cat) return;
   $(selectId).append(option);
   $(option).attr('selected', true);
}

// Objeto para carregar gif
Loading = {
   place_holder: $(document.createElement('div')), 
   image: new Image(),
   show: function(isModal){
      if($('#ajax-indicator').length <= 0){
         this.image.src = '/assets/loading.gif';
         this.place_holder.html(this.image).append(' Loading...');
         this.place_holder.appendTo($('body'));
         this.place_holder.addClass("ajax-indicator ui-state-highlight");
      }
      this.place_holder.slideDown();
   },
   hide: function(){
      this.place_holder.slideUp();
   }
}

// Mostrar mensagem para erros, no retorno do ajax
FlashMsg = {
   notify: function(status){
      //TODO algumas requisições ajax, retornam 500, mesmo quando OK
      //if([403,500].indexOf(status)>-1){
      if(status == 403){

         flash = $(document.createElement('div'));
         $('#content').prepend(flash);
         flash.addClass('flash error notify');
         //flash.text(status==403 ?'Acesso Negado':status==500 ?'Erro no servidor':'');
         flash.text(status==403 ?'Acesso Negado':'');
         flash.append('<a href="#" style="float:right;">x</a>');
         flash.find('a').click(function(){$(this).parent('div').remove();return false;});
         flash.slideDown().delay(3000).slideUp(function(){
            $(this).remove();
         });
      }
   }
}

function toogle_select_multiple(select){
  if($(select).attr("multiple")){
     $(select).attr("multiple",null);
  }else{
     $(select).attr("multiple","multiple");
  }
}

/**
* Coloca um countainer para a lista de paginas
*/
function show_dialog(ele) {
  if(!$('#page_list').length)
     $('.page_select').append('<div id="page_list" style="display: none;" title="Selecione uma notícia"><img src="/assets/spinner.gif"></div>');

  $.get(ele.attr('data-link'),{'template' : 'list_popup'}, null, 'script');

  $('#page_list').dialog({
     width: '700',
     height: '400'
  });
}
