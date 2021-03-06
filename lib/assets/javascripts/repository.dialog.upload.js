//= require fileupload/vendor/jquery.ui.widget
//= require fileupload/jquery.fileupload
//= require fileupload/jquery.iframe-transport
//= require_self

function ajaxUpload(){
   $('#fileupload').fileupload({
      url: $("#ajax-upload-form").attr('action'),
   dataType: "json",
   formData: [
   {name: "repository[description]", value: $("#description").val()},
   {name: "repository[site_id]", value: $("#site_id").val()},
   ],
   // FIXME: fix this (light)pog!!
   // O erro está sendo tratado dentro do evento done
   // pois o IE8 não recupera o HTTPstatus de erro do IFrame
   // Para resolver isso quando da erro o HTTP passa 200
   // porem no content da mensagem o JSON possui o campo
   // error que carrega a mensagem de erro.
   done: function (e, data) {
      if(data.result.error){
         handleFail(data.result.error);
      }else{
         resetFields();
         var repository = data.result.repositories.repository;
         var message = data.result.message;
         text_msg = [repository.description,
               " (", repository.archive_file_name, ")",
               " - ", message].join('');

         $("#results").prepend('<li><span class="label label-success">'+text_msg+'</span></li>');
      }
   },
   fail: function(e, data) {
       console.log(data)
      var error = JSON.parse(data.jqXHR.responseText).errors;
      handleFail(error);
   },
   progress: function (e, data) {
      var progress = parseInt(data.loaded / data.total * 100, 10);
      $("#upload-file-progress").show().val(progress);
   },
   always: function (e, data) {
      c = data;
      $("#upload-file-progress").hide();
   }
   });
}

function handleFail(respondError) {
   for (var key in respondError){
       $("#results").prepend('<li><span class="label label-important">'+key+' '+respondError[key]+'</span></li>');
   }
}

function resetFields () {
   $("#fileupload").val("");
   $("#description").val("");
}
