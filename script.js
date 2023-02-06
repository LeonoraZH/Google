function onApiLoad() {
  gapi.load("client:picker", onPickerApiLoad);
}
async function onPickerApiLoad() {
  await gapi.client.load(
    "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"
  ),
    (pickerInited = !0);
}
function gaccLoaded() {
  setTimeout(function () {
    gaccInited = !0;
  }, 200);
}
function createPicker() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id:
      "903907170385-rim71tdktoi5ei260cr0pkcvde6eh7r0.apps.googleusercontent.com",
    scope:
      "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly",
    callback: "",
  });
  const e = () => {
    new google.picker.PickerBuilder()
      .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
      .addView(google.picker.ViewId.DOCS)
      .setOAuthToken(accessToken)
      //.setDeveloperKey("AIzaSyArjLBoYN0w9ExNSFfFBWcKX63WmLVSHAo")
      .setMaxItems(10)
      .setCallback(pickerCallback)
      .build()
      .setVisible(true);
  };
  (tokenClient.callback = async (o) => {
    o.error !== undefined
      ? console.log(
          "There was an error connecting to your Google Drive, please try again."
        )
      : o.scope.includes("https://www.googleapis.com/auth/drive.readonly")
      ? ((accessToken = o.access_token), e())
      : console.log(
          "You must confirm additional permissions to upload to Google Drive, please try again."
        );
  }),
    null === accessToken
      ? tokenClient.requestAccessToken({ prompt: "consent" })
      : tokenClient.requestAccessToken({ prompt: "" });
}
function pickerCallback(e) {
  console.log(e);
  e.action == google.picker.Action.PICKED &&
    ((cancelled = !1),
    $.each(e[google.picker.Response.DOCUMENTS], function (e, o) {
      var i = Math.random();
      (allFilesFinished[i] = !1), (o.randomId = i);
    }),
    $.each(e[google.picker.Response.DOCUMENTS], function (e, o) {
      // checkWhiteList(o.name, filetypes)
      //   ? gdriveUpload(e, o)
      //   : (postFailedUpload(o.name, 0, "unsupported filetype"),
      console.log("callback");
    }));
}
const filetypes = ".pdf";
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
let tokenClient,
  accessToken = null,
  pickerInited = !1,
  gaccInited = !1;

$("#authorize_button").on("click", function (e) {
  e.preventDefault(), createPicker();
});
checkWhiteList = function (e, o) {
  var i = e.toLowerCase();
  return new RegExp("(" + o.join("|").replace(/\./g, "\\.") + ")$").test(i);
};
window.onload = function () {
  var scriptTag1 = document.createElement("script");
  scriptTag1.src = "https://apis.google.com/js/api.js?onload=onApiLoad";
  scriptTag1.setAttribute("type", "text/javascript");
  scriptTag1.setAttribute("id", "googlepickjs");

  var scriptTag2 = document.createElement("script");
  scriptTag2.src = "https://accounts.google.com/gsi/client";
  scriptTag2.setAttribute("type", "text/javascript");
  scriptTag2.setAttribute("id", "googlepickjs");

  document.body.appendChild(scriptTag1);
  document.body.appendChild(scriptTag2);
};
