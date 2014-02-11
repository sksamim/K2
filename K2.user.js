// ==UserScript==
// @name          KanyashreeHelper
// @namespace     https://github.com/abusalam/KanyashreeHelper
// @description   Helper Script For Kanyashree Approval and Sanction Generation
// @include       http://wbkanyashree.gov.in/*
// @grant         none
// @downloadURL   https://github.com/abusalam/KanyashreeHelper/raw/master/K2.user.js
// @updateURL     https://github.com/abusalam/KanyashreeHelper/raw/master/K2.user.js
// @version       1.0
// @icon          http://www.gravatar.com/avatar/43f0ea57b814fbdcb3793ca3e76971cf
// ==/UserScript==

/**
 * How can I use jQuery in Greasemonkey scripts in Google Chrome?
 * All Credits to Original Author for this wonderfull function.
 *
 * @author  Erik Vergobbi Vold & Tyler G. Hicks-Wright
 * @link    http://stackoverflow.com/questions/2246901
 * @param   {reference} callback
 * @returns {undefined}
 */
function jQueryInclude(callback) {
  var script = document.createElement("script");
  var jQueryCDN = "//ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js";
  script.setAttribute("src", jQueryCDN);

  script.addEventListener('load', function() {
    var script = document.createElement("script");
    script.textContent = 'window.jQ=jQuery.noConflict(true);'
            + 'var BaseURL = "http://wbkanyashree.gov.in/";'
            + '(' + callback.toString() + ')();';
    document.body.appendChild(script);
  }, false);
  document.body.appendChild(script);
}

/**
 * Main Body of Helper Script For Kanyashree Approval and Sanction Generation
 *
 * @returns {undefined}
 */
jQueryInclude(function() {

  jQ("#top").hide();
  jQ("#header").hide();
  jQ("#footerMain").hide();
  jQ("option").html(function() {
    return jQ(this).val() + " - " + jQ(this).html();
  });

  jQ("#content_spc").css("height", "auto");

  var HackUI = '<div style="text-align:center;">'
          + '<br/><textarea id="AppIDs" rows="20" cols="60"></textarea><br/>'
          + '<input type="button" id="CmdSanction" value="Start Sanctioning"/>'
          + '<input type="button" id="CmdStatus" value="Show Status"/>'
          + '<input type="button" id="CmdClearStorage" value="Clear Status"/>'
          + '</div>';

  if (jQ("#tfhover").is(":visible")) {
    jQ("#tfhover").after(HackUI);
  }

  jQ("[id^=Cmd]").css({
    "margin": "10px",
    "padding": "5px"
  });

  /**
   *
   */
  var SanctionAppID = function(AppID) {
    jQ.ajax({
      type: 'POST',
      url: BaseURL + 'admin_pages/kp_fwd_post.php',
      dataType: 'html',
      xhrFields: {
        withCredentials: true
      },
      data: {
        'rej_reason': '',
        'phy_veri': 'undefined',
        'fwd_to': '10047',
        'applicant_id': AppID
      }
    }).done(function(data) {
      try {
        localStorage.setItem('Status', data);
      }
      catch (e) {
        localStorage.setItem('Server Error:', e);
      }
    }).fail(function(msg) {
      localStorage.setItem('AjaxFail', msg);
    });
  };

  jQ("#CmdClearStorage").click(function() {
    localStorage.clear();
  });

  jQ("#CmdSanction").click(function() {
    SanctionAppID(jQ("#AppIDs").val());
  });

  /**
   * Continious Polling for Server Response
   *
   * @returns {Boolean}
   */
  var RefreshOnWait = function() {
    var RespDate = new Date(), TimeOut;
    var CurrentTime = RespDate.getTime();
    CurrentTime = CurrentTime - localStorage.getItem("LastRespTime");
    TimeOut = localStorage.getItem("RefreshTimeOut");
    if (TimeOut === null) {
      TimeOut = 300000;
    } else {
      TimeOut = 5000 + 60000 * TimeOut; // 5sec is minimum
      localStorage.removeItem("RefreshTimeOut");
    }

    if (CurrentTime > TimeOut) {

      var LastRespTime = new Date();
      localStorage.setItem("LastRespTime", LastRespTime.getTime());
      localStorage.setItem("TryLogin", "Yes");
      var URL = BaseURL + "admin_pages/kp_homepage.php";
      parent.window.open(URL, "_self");
    }
    setTimeout(RefreshOnWait, TimeOut);
    return true;
  };

  RefreshOnWait();

  var LastRespTime = new Date();
  localStorage.setItem("LastRespTime", LastRespTime.getTime());
});