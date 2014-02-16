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
  var HackUI = '<div style="text-align:center;clear:both;">'
      + '<div style="text-align:right;" id="Msg"></div>'
      + '<textarea id="AppIDs" rows="20" cols="60"></textarea><br/>'
      + '<input type="button" id="CmdListInst" value="Get Institutions"/>'
      + '<input type="button" id="CmdAllAppNos" value="Pending Applications"/>'
      + '<input type="button" id="CmdStatus" value="Show Status"/>'
      + '<input type="button" id="CmdSanction" value="Add To Sanction"/>'
      + '<input type="button" id="CmdClearStorage" value="Clear Status"/>'
      + '</div>';
  if (jQ("#intra_body_area").is(":visible")) {
    jQ("#intra_body_area").after(HackUI);
  }

  jQ("[id^=Cmd]").css({
    "margin": "10px",
    "padding": "5px"
  });

  jQ("#Msg").css({
    "text-align": "right",
    "display": "inline-block",
    "border": "2px dashed greenyellow",
    "padding": "10px",
    "margin": "10px",
    "float": "left"
  });

  /**
   * Records the No of Ajax Calls
   *
   * @param {type} AjaxState
   * @returns {undefined}
   */
  var AjaxPending = function(AjaxState) {
    var StartAjax = parseInt(localStorage.getItem('AjaxPending'));
    if (AjaxState === "Start") {
      localStorage.setItem('AjaxPending', StartAjax + 1);
    } else {
      localStorage.setItem('AjaxPending', StartAjax - 1);
    }
  };

  /**
   * admin_pages/kp_sanction_order_generation_insert.php?
   * applicant_id=19200301cl0130000001
   * sanction_order=19200700213003
   * type=add
   *
   * @param {string} AppID
   * @returns {void}
   */
  var AddToSanctionAppID = function(AppID) {
    localStorage.setItem('Status', 'AddToSanctionAppID: ' + AppID);
    var SanctionOrderNo = localStorage.getItem('SanctionOrderNo');
    AjaxPending("Start");
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
      try {
        var SanctionStatus = jQ(data).find("div.sanction_block").next().text();
        localStorage.setItem('AddToSanction:' + AppID, SanctionStatus);
      }
      catch (e) {
        localStorage.setItem('AddToSanction Error:' + AppID, e);
      }
    }).fail(function(FailMsg) {
      localStorage.setItem('AddToSanction Fail:' + AppID, FailMsg.statusText);
    }).always(function() {
      AjaxPending("Stop");
    });
  };

  /**
   * Approve Applications for Sanctioning
   *
   * @param {type} AppID
   * @returns {undefined}
   */
  var SanctionAppID = function(AppID) {
    localStorage.setItem('Status', 'SanctionAppID: ' + AppID);
    AjaxPending("Start");
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
    }).fail(function(FailMsg) {
      localStorage.setItem('SanctionAppID Fail:' + AppID, FailMsg.statusText);
    }).always(function() {
      AjaxPending("Stop");
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
  var GetSchAppList = function(SchCode, Scheme) {
    localStorage.setItem('Status', 'GetSchAppList: ' + SchCode);
    if (Scheme === "K2") {
      Scheme = "_list_one.php";
    } else {
      Scheme = "_list.php";
    }
    jQ.ajax({
      type: 'GET',
      url: BaseURL + 'admin_pages/kp_block_verify_applicant' + Scheme,
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
            AppIndex = parseInt(localStorage.getItem('SchAppCount')) + 1;
            localStorage.setItem('AppNo_' + AppIndex + '_No', AppNo);
            localStorage.setItem('AppNo_' + AppIndex + '_Name', AppName);
            localStorage.setItem('SchAppCount', AppIndex);
          }
        });
      }
      catch (e) {
        localStorage.setItem('GetSchAppList Error:', e);
      }
    }).fail(function(FailMsg) {
      localStorage.setItem('GetSchAppList Fail:', FailMsg.statusText);
    }).always(function() {
      AjaxPending("Stop");
    });
  };

  /**
   *
   * @param {type} BlockCode
   * @returns {undefined}
   */
  var GetSchList = function(BlockCode) {
    localStorage.setItem('Status', 'GetSchList: ' + BlockCode);
    AjaxPending("Start");
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
        var SchCode = '', SchName = '', SchIndex = 0;
        jQ(data).find("option").each(function(Index, Item) {
          SchCode = jQ(Item).val();
          SchName = jQ(Item).text();
          if (SchCode.length > 0) {
            SchIndex = parseInt(localStorage.getItem('SchCount')) + 1;
            localStorage.setItem('SchCode_' + SchCode, SchName);
            localStorage.setItem('SchCount', SchIndex);
          }
        });
      }
      catch (e) {
        localStorage.setItem('GetInstList Error:', e);
      }
    }).fail(function(FailMsg) {
      localStorage.setItem('GetInstList Fail:', FailMsg.statusText);
    }).always(function() {
      AjaxPending("Stop");
    });
  };

  /**
   * kp_verify_applicant_list_clg.php?status=10042&schcd=19200301cl
   *
   * @param {type} BlockCode
   * @returns {undefined}
   */
  var GetClgAppList = function(ClgCode) {
    localStorage.setItem('Status', 'GetClgAppList: ' + ClgCode);
    AjaxPending("Start");
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
        var AppNo = '', AppName = '', AppCount = 0;
        jQ(data).find("table.tftable tr td:nth-child(2)")
            .each(function(Index, Item) {
          AppNo = jQ(Item).text();
          AppName = jQ(Item).next().text();
          if (AppNo.length > 0) {
            AppCount = parseInt(localStorage.getItem('ClgAppCount')) + 1;
            localStorage.setItem('AppNo_' + AppCount + '_No', AppNo);
            localStorage.setItem('AppNo_' + AppCount + '_Name', AppName);
            localStorage.setItem('ClgAppCount', AppCount);
          }
        });
      }
      catch (e) {
        localStorage.setItem('GetClgAppList Error:', e);
      }
    }).fail(function(FailMsg) {
      localStorage.setItem('GetClgAppList Fail:', FailMsg.statusText);
    }).always(function() {
      AjaxPending("Stop");
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
    AjaxPending("Start");
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
        var ClgCode = '', Status = 0, ClgIndex = 0;
        jQ(data).find("table.tftable tr").each(function(Index, Item) {
          if (Index > 0) {
            ClgCode = jQ(Item).find("a").attr("onclick").substr(13, 10);
            Status = jQ(Item).find("a").attr("onclick").indexOf('10042');
            if ((ClgCode.length > 0) && (Status > 0)) {
              ClgIndex = parseInt(localStorage.getItem('ClgCount')) + 1;
              ClgName = jQ(Item).find("td:nth-child(2)").text();
              localStorage.setItem('ClgCode_' + ClgCode, ClgName);
              localStorage.setItem('ClgCount', ClgIndex);
              //GetClgAppList(ClgCode);
            }
          }
        });
      }
      catch (e) {
        localStorage.setItem('GetClgList Error:', e);
      }
    }).fail(function(FailMsg) {
      localStorage.setItem('GetClgList Fail:', FailMsg.statusText);
    }).always(function() {
      AjaxPending("Stop");
    });
  };

  /**
   * Get a List of All Institutions
   *
   * @returns {undefined}
   */
  var GetBlockList = function() {
    localStorage.setItem('Status', 'Request Blocks');
    AjaxPending("Start");
    jQ.ajax({
      type: 'GET',
      url: BaseURL + 'admin_pages/kp_dpmu_verify_block_list.php',
      dataType: 'html',
      xhrFields: {
        withCredentials: true
      }
    }).done(function(data) {
      try {
        var BlockCode = '', BlkIndex = 0;
        ;
        jQ(data).find("#block_select option").each(function(Index, Item) {
          BlockCode = jQ(Item).val();
          BlockName = jQ(Item).text();
          if (BlockCode.length > 0) {
            BlkIndex = parseInt(localStorage.getItem('BlkCount')) + 1;
            localStorage.setItem('BlkCode_' + BlockCode, BlockName);
            localStorage.setItem('BlkCount', BlkIndex);
            GetSchList(BlockCode);
            GetClgList(BlockCode);
          }
        });
        localStorage.setItem('Status', 'Success');
      }
      catch (e) {
        localStorage.setItem('GetBlockList Error:', e);
      }
    }).fail(function(FailMsg) {
      localStorage.setItem('GetBlockList Fail:', FailMsg.statusText);
    }).always(function() {
      AjaxPending("Stop");
    });
  };

  /**
   * Load all stored data from localStorage
   * Using the matching pair like Start_Key_End:Value
   * @param {type} Prefix
   * @returns {Array}
   */
  var LoadData = function(Prefix) {
    localStorage.setItem('Status', 'Load: ' + Prefix + '*');
    var Status = [], AppIDs = [];
    jQ.each(localStorage, function(Key, Value) {
      if (Key.search(Prefix) >= 0) {
        var StoredKey = Key.substr(Prefix.length, Key.length - Prefix.length);
        AppIDs.push(StoredKey);
        Status.push(StoredKey + " => " + Value);
      }
    });
    if (jQ("#AppIDs").val().length === 0) {
      jQ("#AppIDs").val(AppIDs.join(","));
    }
    return Status;
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

  /**
   * Clears all the contents of localStorage
   */
  jQ("#CmdClearStorage").click(function() {
    localStorage.clear();
    localStorage.setItem('AjaxPending', 0);
    localStorage.setItem('SchAppCount', 0);
    localStorage.setItem('SchK2AppCount', 0);
    localStorage.setItem('ClgAppCount', 0);
    localStorage.setItem('ClgCount', 0);
    localStorage.setItem('SchCount', 0);
    localStorage.setItem('BlkCount', 0);
    localStorage.setItem('KeyPrefix', 'ClgCode_');
  });

  /**
   * Adds all the applicants to Sanction Order
   */
  jQ("#CmdSanction").click(function() {
    localStorage.setItem('SanctionOrderNo', jQ("#AppIDs").val());
    var SanctionOrderNo = localStorage.getItem('SanctionOrderNo');
    if (SanctionOrderNo === null) {
      jQ("#Msg").text('Please provide Sanction Order No.');
    } else if (SanctionOrderNo.length > 0) {
      jQ("#Msg").text('Sanction Order No.: ' + SanctionOrderNo);
      jQ("#AppIDs").val('');
      LoadStoredAppIDs("Sanction");
      LoadStoredAppIDs("Add");
    }
  });

  /**
   * Gets the list of all Institutions and stores in localStorage
   */
  jQ("#CmdListInst").click(function() {
    localStorage.setItem('SchCount', 0);
    localStorage.setItem('ClgCount', 0);
    GetBlockList();
  });

  /**
   * Loads the contents of localStorage into the interface
   */
  jQ("#CmdStatus").click(function() {
    if (jQ("#CmdStatus").val() === "Show Status") {
      jQ("#CmdStatus").val("Hide Status");
      jQ("#AppIDs").hide();
      var vals = LoadData(localStorage.getItem('KeyPrefix'));
      var StatusDiv = document.createElement("div");
      StatusDiv.setAttribute("id", "AppStatus");
      jQ("#AppIDs").parent().append(StatusDiv);

      jQ("#AppStatus")
          .html("<ol><li>" + vals.join("</li><li>") + "</li></ol>")
          .css({"text-align": "left", "clear": "both"});

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
      var URL = BaseURL + "admin_pages/kp_homepage.php";
      jQ.get(URL);
    } else {
      jQ("#Msg").html('AjaxPending :<span>'
          + localStorage.getItem('AjaxPending')
          + '</span><br/>Blocks :<span>'
          + localStorage.getItem('BlkCount')
          + '</span><br/>Colleges :<span>'
          + localStorage.getItem('ClgCount')
          + '</span><br/>College Applications:<span>'
          + localStorage.getItem('ClgAppCount')
          + '</span><br/>Schools :<span>'
          + localStorage.getItem('SchCount')
          + '</span><br/>School Applications :<span>'
          + localStorage.getItem('SchAppCount')
          + '</span><br/>School K2 Applications :<span>'
          + localStorage.getItem('SchK2AppCount')
          + '</span><br/>Last API : ' + localStorage.getItem('Status'));

      jQ("#Msg span").css({
        "width": "80px",
        "display": "inline-block"
      });
    }
    setTimeout(RefreshOnWait, 5000);
    return true;
  };
  RefreshOnWait();
  var LastRespTime = new Date();
  localStorage.setItem("LastRespTime", LastRespTime.getTime());
  if (localStorage.getItem('KeyPrefix') === null) {
    localStorage.setItem('KeyPrefix', 'BlkCode_');
  }
});