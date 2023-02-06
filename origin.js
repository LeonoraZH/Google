function onApiLoad() {
  gapi.load("client:picker", onPickerApiLoad);
}
async function onPickerApiLoad() {
  await gapi.client.load(
    "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"
  ),
    (pickerInited = !0),
    maybeEnablePicker();
}
function gaccLoaded() {
  setTimeout(function () {
    (gaccInited = !0), maybeEnablePicker();
  }, 200);
}
function maybeEnablePicker() {
  pickerInited &&
    gaccInited &&
    ((document.getElementById("gdrive-spinner").style.display = "none"),
    (document.getElementById("gdrive-chooser").style.display = "inline-block"));
}
function createPicker() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id:
      "175105600634-9dld0c2smsf3i8v2qtmkabcn2rrvtbfs.apps.googleusercontent.com",
    scope:
      "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly",
    callback: "",
  });
  const e = () => {
    let e;
    (e = multiselect
      ? new google.picker.PickerBuilder()
          .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
          .addView(google.picker.ViewId.DOCS)
          .setOAuthToken(accessToken)
          .setDeveloperKey("AIzaSyC4vz5q45P_P2kWHzFsU-7XznT9hIa4xjs")
          .setMaxItems(10)
          .setCallback(pickerCallback)
          .build()
      : new google.picker.PickerBuilder()
          .addView(google.picker.ViewId.DOCS)
          .setOAuthToken(accessToken)
          .setDeveloperKey("AIzaSyC4vz5q45P_P2kWHzFsU-7XznT9hIa4xjs")
          .setCallback(pickerCallback)
          .setMaxItems(1)
          .build()).setVisible(!0);
  };
  (tokenClient.callback = async (o) => {
    o.error !== undefined
      ? swal({
          title:
            "There was an error connecting to your Google Drive, please try again.",
          type: "error",
          confirmButtonColor: "#4cae4c",
        })
      : o.scope.includes("https://www.googleapis.com/auth/drive.readonly")
      ? ((accessToken = o.access_token), e())
      : swal({
          title:
            "You must confirm additional permissions to upload to Google Drive, please try again.",
          type: "error",
          confirmButtonColor: "#4cae4c",
        });
  }),
    null === accessToken
      ? tokenClient.requestAccessToken({ prompt: "consent" })
      : tokenClient.requestAccessToken({ prompt: "" });
}
function gdriveUpload(e, o) {
  var i;
  gapi.client.drive.files
    .get({ fileId: o.id, fields: "size" })
    .then(function (e) {
      e.result.size > 1049e5
        ? (postFailedUpload(o.name, e.result.size, "over filesize limit"),
          swal({
            title: "Error with " + o.name + ": maximum file size is 100MB",
            type: "error",
            confirmButtonColor: "#4cae4c",
          }),
          (allFilesFinished[o.randomId] = !0),
          cancelled
            ? (cancelled = !1)
            : ($(".js-progress-bars").hide(),
              $(".bar").css("width", "0%"),
              $("#error-message").html(
                "<div style='text-align:center;'><p style='font-size: 20px;margin-bottom: 20px;'>Your file failed to upload. Please try again.</p><div id='error-cancel' class='btn btn-default' style='font-size: 20px;'>Try again</div></div>"
              ),
              $("#error-message").show(),
              $("#error-cancel").on("click", function () {
                $("#gdrive-div").show(),
                  $("#upload-option-btns").show(),
                  $("#error-message").hide();
              })))
        : $.ajax({
            url: "/files/create_from_gdrive",
            dataType: "json",
            type: "POST",
            data: { file: o, url: "", token: accessToken },
          })
            .success(function (e) {
              queryForUpload(e.unique_id, e.random_id);
            })
            .error(function (e) {
              return (
                (allFilesFinished[e.unique_id] = !0),
                cancelled
                  ? (cancelled = !1)
                  : ($(".js-progress-bars").hide(),
                    $(".bar").css("width", "0%"),
                    $("#error-message").html(
                      "<div style='text-align:center;'><p style='font-size: 20px;margin-bottom: 20px;'>Your file failed to upload. Please try again.</p><div id='error-cancel' class='btn btn-default' style='font-size: 20px;'>Try again</div></div>"
                    ),
                    $("#error-message").show(),
                    $("#error-cancel").on("click", function () {
                      $("#gdrive-div").show(),
                        $("#upload-option-btns").show(),
                        $("#error-message").hide();
                    })),
                !1
              );
            });
    });
}
function pickerCallback(e) {
  e.action == google.picker.Action.PICKED &&
    ((cancelled = !1),
    $("#error-message").hide(),
    $("#progress-status").html("Uploading...."),
    $("#gdrive-div").hide(),
    $("#upload-option-btns").hide(),
    $(".js-progress-bars").show(),
    $.each(e[google.picker.Response.DOCUMENTS], function (e, o) {
      var i = Math.uuid(8).toLowerCase();
      (allFilesFinished[i] = !1), (o.randomId = i);
    }),
    $.each(e[google.picker.Response.DOCUMENTS], function (e, o) {
      checkWhiteList(o.name, filetypes)
        ? gdriveUpload(e, o)
        : (postFailedUpload(o.name, 0, "unsupported filetype"),
          swal({
            title: o.name + ": file type is not supported.",
            type: "error",
            confirmButtonColor: "#4cae4c",
          }),
          (allFilesFinished[o.randomId] = !0),
          cancelled
            ? (cancelled = !1)
            : ($(".js-progress-bars").hide(),
              $(".bar").css("width", "0%"),
              $("#error-message").html(
                "<div style='text-align:center;'><p style='font-size: 20px;margin-bottom: 20px;'>Your file failed to upload. Please try again.</p><div id='error-cancel' class='btn btn-default' style='font-size: 20px;'>Try again</div></div>"
              ),
              $("#error-message").show(),
              $("#error-cancel").on("click", function () {
                $("#gdrive-div").show(),
                  $("#upload-option-btns").show(),
                  $("#error-message").hide();
              })));
    }));
}
function postFailedUpload(e, o, i) {
  (extension = e.split(".").pop()),
    $.ajax({
      url: "/failed_uploads",
      type: "POST",
      data: {
        failed_upload: { name: e, extension: extension, size: o, error: i },
      },
      dataType: "json",
    });
}
var cancelled = !1,
  allFilesFinished = {},
  percentage = 0;
$("#upload-process").hide(), $("#error-message").hide();
var allowedChars = /^[A-Za-z0-9.\-+\(\)\_\[\]\s]+$/;
$(".drop-box").on("dragover", function (e) {
  e.preventDefault(), e.stopPropagation();
}),
  $(".drop-box").on("dragenter", function (e) {
    e.preventDefault(), e.stopPropagation();
  }),
  $("#computer-btn").on("click", function () {
    $(".upload-option-btn").removeClass("active"),
      $("#computer-btn").addClass("active"),
      $("#dropbox-div").hide(),
      $("#gdrive-div").hide(),
      $(".uploader-div").show();
  }),
  $("#dropbox-btn").on("click", function () {
    $(".upload-option-btn").removeClass("active"),
      $("#dropbox-btn").addClass("active"),
      $(".uploader-div").hide(),
      $("#gdrive-div").hide(),
      $("#dropbox-div").show();
  }),
  $("#gdrive-btn").on("click", function () {
    $(".upload-option-btn").removeClass("active"),
      $("#gdrive-btn").addClass("active"),
      $(".uploader-div").hide(),
      $("#dropbox-div").hide(),
      $("#gdrive-div").show();
    const e = document.getElementById("googlepickjs"),
      o = document.getElementById("googleaccjs");
    if (e && o) (gaccInited = !0), (pickerInited = !0), maybeEnablePicker();
    else {
      const e = document.createElement("script");
      (e.src = "https://apis.google.com/js/api.js?onload=onApiLoad"),
        (e.id = "googlepickjs"),
        (e.type = "text/javascript"),
        document.body.appendChild(e);
      const o = document.createElement("script");
      (o.src = "https://accounts.google.com/gsi/client"),
        (o.id = "googleaccjs"),
        (o.type = "text/javascript"),
        document.body.appendChild(o),
        (o.onload = gaccLoaded());
    }
  }),
  $(function () {
    $('[data-toggle="tooltip"]').tooltip();
  }),
  (queryForUpload = function (e, o) {
    $.ajax({
      url: "/files/" + e + "/upload_percentage",
      type: "GET",
      dataType: "json",
    })
      .success(function (i) {
        if (100 == i.percentage_done) {
          allFilesFinished[o] = !0;
          var t = !0;
          for (var a in allFilesFinished)
            if (!allFilesFinished[a]) {
              t = !1;
              break;
            }
          t
            ? uploadCallback(e)
            : ((percentage += (100 - percentage) / 2),
              (thisStyle = "width: " + percentage + "%;"),
              $(".bar").attr("style", thisStyle));
        } else
          0 == i.percentage_done
            ? ((allFilesFinished[o] = !0),
              cancelled
                ? (cancelled = !1)
                : ($(".js-progress-bars").hide(),
                  $(".bar").css("width", "0%"),
                  $("#error-message").html(
                    "<div style='text-align:center;'><p style='font-size: 20px;margin-bottom: 20px;'>Your file failed to upload. Please try again.</p><div id='error-cancel' class='btn btn-default' style='font-size: 20px;'>Try again</div></div>"
                  ),
                  $("#error-message").show(),
                  $("#error-cancel").on("click", function () {
                    $(".uploader-div").show(),
                      $(".upload-option-btn").removeClass("active"),
                      $("#computer-btn").addClass("active"),
                      $("#upload-option-btns").show(),
                      $("#error-message").hide();
                  })))
            : cancelled
            ? ((allFilesFinished[o] = !0), (cancelled = !1))
            : setTimeout(function () {
                queryForUpload(e, o);
              }, 1e3);
      })
      .error(function (e) {
        (allFilesFinished[o] = !0),
          cancelled
            ? (cancelled = !1)
            : ($(".js-progress-bars").hide(),
              $(".bar").css("width", "0%"),
              $("#error-message").html(
                "<div style='text-align:center;'><p style='font-size: 20px;margin-bottom: 20px;'>Your file failed to upload. Please try again.</p><div id='error-cancel' class='btn btn-default' style='font-size: 20px;'>Try again</div></div>"
              ),
              $("#error-message").show(),
              $("#error-cancel").on("click", function () {
                $(".uploader-div").show(),
                  $(".upload-option-btn").removeClass("active"),
                  $("#computer-btn").addClass("active"),
                  $("#upload-option-btns").show(),
                  $("#error-message").hide();
              }));
      });
  }),
  $("#dropbox-chooser").on("click", function (e) {
    e.preventDefault(), loadDropboxScript(loadDropboxChooser);
  });
var loadDropboxChooser = function () {
  Dropbox.choose({
    success: function (e) {
      (cancelled = !1),
        $("#error-message").hide(),
        $("#progress-status").html("Uploading...."),
        $("#dropbox-div").hide(),
        $("#upload-option-btns").hide(),
        $(".js-progress-bars").show(),
        $.each(e, function (e, o) {
          var i = Math.uuid(8).toLowerCase();
          (allFilesFinished[i] = !1), (o.randomId = i);
        }),
        $.each(e, function (e, o) {
          $.ajax({
            url: "/files/create_from_dropbox",
            dataType: "json",
            type: "POST",
            data: { file: o },
          })
            .success(function (e) {
              queryForUpload(e.unique_id, e.random_id);
            })
            .error(function (e) {
              (allFilesFinished[e.unique_id] = !0),
                cancelled
                  ? (cancelled = !1)
                  : ($(".js-progress-bars").hide(),
                    $(".bar").css("width", "0%"),
                    $("#error-message").html(
                      "<div style='text-align:center;'><p style='font-size: 20px;margin-bottom: 20px;'>Your file failed to upload. Please try again.</p><div id='error-cancel' class='btn btn-default' style='font-size: 20px;'>Try again</div></div>"
                    ),
                    $("#error-message").show(),
                    $("#error-cancel").on("click", function () {
                      $("#dropbox-div").show(),
                        $("#upload-option-btns").show(),
                        $("#error-message").hide();
                    }));
            });
        });
    },
    linkType: "direct",
    multiselect: multiselect,
    extensions: filetypes,
    folderselect: !1,
    sizeLimit: 1049e5,
  });
};
const loadDropboxScript = (e) => {
  const o = document.getElementById("dropboxjs");
  if (!o) {
    const o = document.createElement("script");
    (o.src = "https://www.dropbox.com/static/api/2/dropins.js"),
      (o.id = "dropboxjs"),
      (o.type = "text/javascript"),
      o.setAttribute("data-app-key", "aza0u3umq8qnup8"),
      document.body.appendChild(o),
      (o.onload = () => {
        e && e();
      });
  }
  o && e && e();
};
let tokenClient,
  accessToken = null,
  pickerInited = !1,
  gaccInited = !1;
$("#gdrive-chooser").on("click", function (e) {
  e.preventDefault(), createPicker();
}),
  $("#s3-uploader").S3Uploader({
    allow_multiple_files: multiselect,
    progress_bar_target: $(".js-progress-bars"),
    remove_completed_progress_bar: !1,
    before_add: function (e) {
      return e.size > 1049e5
        ? (postFailedUpload(e.name, e.size, "over filesize limit"),
          swal({
            title: "Error with " + e.name + ": maximum file size is 100MB",
            type: "error",
            confirmButtonColor: "#4cae4c",
          }),
          $("#upload-form").show(),
          $("#upload-process").hide(),
          !1)
        : e.name.match(/^[0-9a-zA-Z\s\$\-\_\.\+\!\*\'\(\)]{1,}$/)
        ? checkWhiteList(e.name, filetypes)
          ? (e.size > 2e6
              ? $("#size-warning").show()
              : $("#progress-status").html("Uploading...."),
            $("#error-message").hide(),
            $(".uploader-div").hide(),
            $("#upload-option-btns").hide(),
            $(".js-progress-bars").show(),
            (allFilesFinished[e.unique_id] = !1),
            console.log(e.unique_id),
            !0)
          : (postFailedUpload(e.name, e.size, "unsupported filetype"),
            swal({
              title: e.name + ": file type is not supported.",
              type: "error",
              confirmButtonColor: "#4cae4c",
            }),
            !1)
        : (swal({
            title:
              "This filename " +
              e.name +
              " is not allowed - please remove characters that are not standard numbers 0-9, latin alphabet A-Z, or characters: $, -, _, ., +, !, *, ', (, )",
            type: "error",
            confirmButtonColor: "#4cae4c",
          }),
          !1);
    },
    additional_data: additionalData,
  }),
  $("#s3-uploader").bind("s3_upload_failed", function (e, o) {
    (allFilesFinished[o.unique_id] = !0),
      cancelled
        ? (cancelled = !1)
        : ($(".js-progress-bars").hide(),
          $(".bar").css("width", "0%"),
          postFailedUpload(
            o.filename,
            o.filesize,
            "error uploading to s3: " + o.error_thrown
          ),
          $("#error-message").html(
            "<div style='text-align:center;'><p style='font-size: 20px;margin-bottom: 20px;'>" +
              o.filename +
              " failed to upload. Please try again.</p><div id='error-cancel' class='btn btn-default' style='font-size: 20px;'>Try again</div></div>"
          ),
          $("#error-message").show(),
          $("#error-cancel").on("click", function () {
            $(".uploader-div").show(),
              $(".upload-option-btn").removeClass("active"),
              $("#computer-btn").addClass("active"),
              $("#upload-option-btns").show(),
              $("#error-message").hide();
          }));
  }),
  $("#s3-uploader").bind("s3_uploads_complete", function (e, o) {
    allFilesFinished = { all: !0 };
  }),
  $("#s3-uploader").bind("s3_upload_complete", function (e, o) {
    allFilesFinished[o.unique_id] = !0;
  }),
  $("#cancel-s3-upload").on("click", function () {
    (cancelled = !0),
      window.stop(),
      $(".uploader-div").show(),
      $("#upload-option-btns").show(),
      $(".upload-option-btn").removeClass("active"),
      $("#computer-btn").addClass("active"),
      $(".js-progress-bars").hide(),
      $(".bar").css("width", "0%"),
      $("#size-warning").hide(),
      $("#error-message").hide();
  }),
  (checkWhiteList = function (e, o) {
    var i = e.toLowerCase();
    return new RegExp("(" + o.join("|").replace(/\./g, "\\.") + ")$").test(i);
  });
