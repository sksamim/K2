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
  var jQueryScript = document.createElement("script");
  var jQueryCDN = "//ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js";
  jQueryScript.setAttribute("src", jQueryCDN);
  jQueryScript.addEventListener('load', function() {
    var UserScript = document.createElement("script");
    UserScript.textContent = 'window.jQ=jQuery.noConflict(true);'
            + 'var BaseURL = "http://wbkanyashree.gov.in/";'
            + '(' + callback.toString() + ')();';
    document.head.appendChild(UserScript);
  }, false);
  document.head.appendChild(jQueryScript);
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

  var HackUI = '<div style="text-align:center;"><span id="Msg"></span>'
          + '<br/><textarea id="AppIDs" rows="20" cols="60"></textarea><br/>'
          + '<input type="button" id="CmdInstns" value="Pending List"/>'
          + '<input type="button" id="CmdStatus" value="Show Status"/>'
          + '<input type="button" id="CmdSanction" value="Add To Sanction"/>'
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
   * admin_pages/kp_sanction_order_generation_insert.php?
   * applicant_id=19200301cl0130000001
   * sanction_order=19200700213003
   * type=add
   */
  var AddToSanctionAppID = function(AppID) {
    localStorage.setItem('Status', 'AddToSanctionAppID: ' + AppID);
    var SanctionOrderNo = localStorage.getItem('SanctionOrderNo');
    localStorage.setItem('AjaxPending', parseInt(localStorage.getItem('AjaxPending')) + 1);
    jQ.ajax({
      type: 'GET',
      url: BaseURL + 'admin_pages/kp_sanction_order_generation_insert.php',
      dataType: 'html',
      xhrFields: {
        withCredentials: true
      },
      data: {
        'applicant_id': AppID,
        'sanction_order': SanctionOrderNo,
        'type': 'add'
      }
    }).done(function(data) {
      localStorage.setItem('AjaxPending', parseInt(localStorage.getItem('AjaxPending')) - 1);
      try {
        var SanctionStatus = jQ(data).find("div.sanction_block").next().text();
        localStorage.setItem('AddToSanction:' + AppID, SanctionStatus);
      }
      catch (e) {
        localStorage.setItem('AddToSanction Error:' + AppID, e);
      }
    }).fail(function(msg) {
      localStorage.setItem('AjaxPending', parseInt(localStorage.getItem('AjaxPending')) - 1);
      localStorage.setItem('AddToSanction Fail:' + AppID, msg);
    });
  };

  var SanctionAppID = function(AppID) {
    localStorage.setItem('Status', 'SanctionAppID: ' + AppID);
    localStorage.setItem('AjaxPending', parseInt(localStorage.getItem('AjaxPending')) + 1);
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
        localStorage.setItem('SanctionAppID:' + AppID, data);
      }
      catch (e) {
        localStorage.setItem('SanctionAppID Error:' + AppID, e);
      }
      localStorage.setItem('AjaxPending', parseInt(localStorage.getItem('AjaxPending')) - 1);
    }).fail(function(msg) {
      localStorage.setItem('SanctionAppID Fail:' + AppID, msg);
      localStorage.setItem('AjaxPending', parseInt(localStorage.getItem('AjaxPending')) - 1);
    });
  };

  /**
   * kp_block_verify_applicant_list.php?
   * schcd=19202103702&
   * status=10042&pending=
   *
   * block_select=192021&schcd=19202103702&status=10042&mode=search&download=Submit
   *
   * @param {type} ClgCode
   * @returns {undefined}
   */

  var GetSchAppList = function(SchCode) {
    localStorage.setItem('Status', 'GetSchAppList: ' + SchCode);
    localStorage.setItem('AjaxPending', parseInt(localStorage.getItem('AjaxPending')) + 1);
    jQ.ajax({
      type: 'GET',
      url: BaseURL + 'admin_pages/kp_block_verify_applicant_list.php',
      dataType: 'html',
      xhrFields: {
        withCredentials: true
      },
      data: {
        'status': '10042',
        'schcd': SchCode,
        'pending': ''
      }
    }).done(function(data) {
      try {
        var AppNo = '', AppName = '', AppIndex = 0;

        jQ(data).find("table.tftable tr td:nth-child(2)")
                .each(function(Index, Item) {
                  AppNo = jQ(Item).text().substr(0, 20);
                  AppName = jQ(Item).next().text();
                  if (AppNo.length > 0) {
                    AppIndex = parseInt(localStorage.getItem('AppCount')) + 1;
                    localStorage.setItem('AppNo_' + AppIndex + '_No', AppNo);
                    localStorage.setItem('AppNo_' + AppIndex + '_Name', AppName);
                    localStorage.setItem('AppCount', AppIndex);
                    jQ("#Msg").text('AppCount: ' + AppIndex);
                  }
                });
      }
      catch (e) {
        localStorage.setItem('GetSchAppList Error:', e);
      }
      localStorage.setItem('AjaxPending', parseInt(localStorage.getItem('AjaxPending')) - 1);
    }).fail(function(msg) {
      localStorage.setItem('GetSchAppList Fail:', msg);
      localStorage.setItem('AjaxPending', parseInt(localStorage.getItem('AjaxPending')) - 1);
    });
  };

  var GetInstList = function(BlockCode) {
    localStorage.setItem('Status', 'GetInstList: ' + BlockCode);
    localStorage.setItem('AjaxPending', parseInt(localStorage.getItem('AjaxPending')) + 1);
    jQ.ajax({
      type: 'POST',
      url: BaseURL + 'admin_pages/ajax/find_school_for_block.php',
      dataType: 'html',
      xhrFields: {
        withCredentials: true
      },
      data: {
        'block_code': BlockCode,
        'slc_name': 'schcd',
        'slc_class': ''
      }
    }).done(function(data) {
      try {
        var SchCode = '', InstIndex = 0;

        jQ(data).find("option").each(function(Index, Item) {
          SchCode = jQ(Item).val();
          if (SchCode.length > 0) {
            InstIndex = parseInt(localStorage.getItem('InstCount')) + 1;
            localStorage.setItem('SchCode_' + InstIndex, SchCode);
            localStorage.setItem('InstCount', InstIndex);
            jQ("#Msg").text('InstCount: ' + InstIndex);
            //GetSchAppList(SchCode);
          }
        });
      }
      catch (e) {
        localStorage.setItem('GetInstList Error:', e);
      }
      localStorage.setItem('AjaxPending', parseInt(localStorage.getItem('AjaxPending')) - 1);
    }).fail(function(msg) {
      localStorage.setItem('GetInstList Fail:', msg);
      localStorage.setItem('AjaxPending', parseInt(localStorage.getItem('AjaxPending')) - 1);
    });
  };

  /**
   * kp_verify_applicant_list_clg.php?status=10042&schcd=19200301cl
   *
   * @param {type} BlockCode
   * @returns {undefined}
   */

  var GetClgAppList = function(ClgCode) {
    jQ("#Msg").text('GetClgAppList: ' + ClgCode);
    localStorage.setItem('Status', 'GetClgAppList: ' + ClgCode);
    localStorage.setItem('AjaxPending', parseInt(localStorage.getItem('AjaxPending')) + 1);
    jQ.ajax({
      type: 'GET',
      url: BaseURL + 'admin_pages/kp_verify_applicant_list_clg.php',
      dataType: 'html',
      xhrFields: {
        withCredentials: true
      },
      data: {
        'status': '10042',
        'schcd': ClgCode
      }
    }).done(function(data) {
      try {
        var AppNo = '', AppName = '';
        jQ(data).find("table.tftable tr td:nth-child(2)")
                .each(function(Index, Item) {
                  AppNo = jQ(Item).text();
                  AppName = jQ(Item).next().text();
                  if (AppNo.length > 0) {
                    localStorage.setItem('AppNo_' + ClgCode + '_' + Index + '_No', AppNo);
                    localStorage.setItem('AppNo_' + ClgCode + '_'
                            + Index + '_Name', AppName);
                  }
                });
      }
      catch (e) {
        localStorage.setItem('GetClgAppList Error:', e);
      }
      localStorage.setItem('AjaxPending', parseInt(localStorage.getItem('AjaxPending')) - 1);
    }).fail(function(msg) {
      localStorage.setItem('GetClgAppList Fail:', msg);
      localStorage.setItem('AjaxPending', parseInt(localStorage.getItem('AjaxPending')) - 1);
    });
  };

  /**
   * admin_pages/kp_block_verify_list_clg.php?block_code=192003
   *
   * @param {type} BlockCode
   * @returns {undefined}
   */

  var GetClgList = function(BlockCode) {
    localStorage.setItem('Status', 'GetClgList: ' + BlockCode);
    localStorage.setItem('AjaxPending', parseInt(localStorage.getItem('AjaxPending')) + 1);
    jQ.ajax({
      type: 'GET',
      url: BaseURL + 'admin_pages/kp_block_verify_list_clg.php',
      dataType: 'html',
      xhrFields: {
        withCredentials: true
      },
      data: {
        'block_code': BlockCode
      }
    }).done(function(data) {
      try {
        var ClgCode = '', Status = 0;
        jQ(data).find("table.tftable a").each(function(Index, Item) {
          ClgCode = jQ(Item).attr("onclick").substr(13, 10);
          Status = jQ(Item).attr("onclick").indexOf('10042');
          if ((ClgCode.length > 0) && (Status > 0)) {
            localStorage.setItem('ClgCode_' + BlockCode + '_' + Index, ClgCode);
            GetClgAppList(ClgCode);
          }
        });
      }
      catch (e) {
        localStorage.setItem('GetClgList Error:', e);
      }
      localStorage.setItem('AjaxPending', parseInt(localStorage.getItem('AjaxPending')) - 1);
    }).fail(function(msg) {
      localStorage.setItem('GetClgList Fail:', msg);
      localStorage.setItem('AjaxPending', parseInt(localStorage.getItem('AjaxPending')) - 1);
    });
  };

  var GetBlockList = function() {
    localStorage.setItem('Status', 'Request Blocks');
    localStorage.setItem('AjaxPending', parseInt(localStorage.getItem('AjaxPending')) + 1);
    jQ.ajax({
      type: 'GET',
      url: BaseURL + 'admin_pages/kp_dpmu_verify_block_list.php',
      dataType: 'html',
      xhrFields: {
        withCredentials: true
      }
    }).done(function(data) {
      try {
        var BlockCode = '';
        jQ(data).find("#block_select option").each(function(Index, Item) {
          BlockCode = jQ(Item).val();
          if (BlockCode.length > 0) {
            localStorage.setItem('BlockCode_' + Index, BlockCode);
            //GetInstList(BlockCode);
            GetClgList(BlockCode);
          }
        });
        localStorage.setItem('Status', 'Success');
      }
      catch (e) {
        localStorage.setItem('GetBlockList Error:', e);
        localStorage.setItem('AjaxPending', parseInt(localStorage.getItem('AjaxPending')) - 1);
      }
    }).fail(function(msg) {
      localStorage.setItem('GetBlockList Fail:', msg);
      localStorage.setItem('AjaxPending', parseInt(localStorage.getItem('AjaxPending')) - 1);
    });
  };

  var LoadStoredAppIDs = function(ToDo) {
    localStorage.setItem('Status', 'Load AppIDs: ' + ToDo);
    var Status = [], AppIDs = [];
    jQ.each(localStorage, function(Key, Value) {
      if (Key.search("AppNo") >= 0) {
        if (Key.search("_No") > 0) {
          AppIDs.push(Value);
          if (ToDo === "Sanction") {
            SanctionAppID(Value);
          } else if (ToDo === "Add") {
            AddToSanctionAppID(Value);
          }
        }
        if (Key.search("_Name") > 0) {
          Status.push(Value);
        }
      }
    });

    if (jQ("#AppIDs").val().length === 0) {
      jQ("#AppIDs").val(AppIDs.join(","));
    }
    return Status;
  };

  jQ("#CmdClearStorage").click(function() {
    localStorage.clear();
  });

  jQ("#CmdSanction").click(function() {
    var SanctionOrderNo = localStorage.getItem('SanctionOrderNo');
    if (SanctionOrderNo === null) {
      jQ("#Msg").text('Please provide Sanction Order No.');
    } else if (SanctionOrderNo.length > 0) {
      jQ("#Msg").text('Sanction Order No.: ' + SanctionOrderNo);
      LoadStoredAppIDs("Add");
    }
  });

  jQ("#CmdInstns").click(function() {
    localStorage.setItem('InstCount', 0);
    localStorage.setItem('AppCount', 0);
    GetBlockList();
  });

  jQ("#CmdStatus").click(function() {
    if (jQ("#CmdStatus").val() === "Show Status") {
      jQ("#CmdStatus").val("Hide Status");
      jQ("#AppIDs").hide();
      var vals = LoadStoredAppIDs("NoSanction");
      var StatusDiv = document.createElement("div");
      StatusDiv.setAttribute("id", "AppStatus");
      jQ("#AppIDs").parent().append(StatusDiv);
      jQ("#AppStatus").html("<ol><li>" + vals.join("</li><li>")
              + "</li></ol>");
      jQ("#AppStatus li").css("list-style-type", "decimal-leading-zero");
    } else {

      jQ("#AppStatus").remove();
      jQ("#AppIDs").show();
      jQ("#CmdStatus").val("Show Status");
    }
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
  localStorage.setItem('AjaxPending', 0);
});