let userAgent = "Unknown";
let internalUserAgent = "Unknown";

const userAgents = [
  
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:137.0) Gecko/20100101 Firefox/137.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:138.0) Gecko/20100101 Firefox/138.0",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 YaBrowser/25.2.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko)",

]


/*
window.api.invoke('getTemplates', [])
    .then(function(res) {
        console.log(res);
    })
    .catch(function(err) {
        console.error(err);
    });
*/

window.api.invoke('getUserAgent', []).then(function(res) { internalUserAgent = res; }).catch(function(err) { console.error(err); });

const ctx = document.getElementById('httpchart').getContext('2d');

function getLatestData( counter ) {
  const now = Date.now();
  let data = [];

  let http200Num = 0;
  let http403Num = 0;
  let http404Num = 0;
  let http4xxNum = 0;
  let http5xxNum = 0;

  switch (counter) {
    case "200":
        data = [
            { x: now, y: http200Num }, // HTTP 200
        ];
      break;
    case "403":
        data = [
            { x: now, y: http403Num }, // HTTP 403
        ];
      break;
    case "404":
        data = [
            { x: now, y: http404Num }, // HTTP 404
        ];
      break;
    case "4xx":
        data = [
            { x: now, y: http4xxNum }, // HTTP 4xx
        ];
      break;
    case "5xx":
        data = [
            { x: now, y: http5xxNum }, // HTTP 5xx  
        ];
      break;
    default:
        data = [
            { x: now, y: 0 }, // ??
        ];
      break;
  }

  return data;
}


const httpChart = new Chart(ctx, {
  type: 'line',             // 'line', 'bar', 'bubble' and 'scatter' types are supported
  data: {
    datasets: [{
            label: "HTTP 200",
            borderColor: "white",
            backgroundColor: "#ffffff20",
            fill: true
        },{
            label: "HTTP 403",
            borderColor: "red",
            backgroundColor: "#ffffff20",
            fill: true
        },{
            label: "HTTP 404",
            borderColor: "yellow",
            backgroundColor: "#ffffff20",
            fill: true
        },{
            label: "HTTP 4xx",
            borderColor: "#FFC300",
            backgroundColor: "#ffffff20",
            fill: true
        },{
            label: "HTTP 5xx",
            borderColor: "blue",
            backgroundColor: "#ffffff20",
            fill: true
        }]
  },
  options: {
    borderWidth: 2,
        tension: 0.3,
        responsive: true,
        maintainAspectRatio: false,
        elements: {
            point:{
                radius: 0
            }
        },
        plugins: {
           legend: {
                display: true,
                position: "right",
                labels: {
                    boxWidth: 6,
                    boxHeight: 6
                }
            }
        },
    scales: {
      y: {
        beginAtZero: true
      },
      x: {
        type: 'realtime',   // x axis will auto-scroll from right to left
        realtime: {         // per-axis options
          duration: 30000,  // data in the past 20000 ms will be displayed
          refresh: 1000,    // onRefresh callback will be called every 1000 ms
          delay: 1000,      // delay of 1000 ms, so upcoming values are known before plotting a line
          pause: false,     // chart is not paused
          ttl: undefined,   // data will be automatically deleted as it disappears off the chart
          frameRate: 30,    // data points are drawn 30 times every second

          onRefresh: chart => {
            var line1 = getLatestData("200"); // HTTP 200
            var line2 = getLatestData("403"); // HTTP 403
            var line3 = getLatestData("404"); // HTTP 404
            var line4 = getLatestData("4xx"); // HTTP 4xx
            var line5 = getLatestData("5xx"); // HTTP 5xx
            chart.data.datasets[0].data.push(...line1);
            chart.data.datasets[1].data.push(...line2);
            chart.data.datasets[2].data.push(...line3);
            chart.data.datasets[3].data.push(...line4);
            chart.data.datasets[4].data.push(...line5);
          }
        
        }
      }
    }
  }
});

$("#payload").on('change keyup paste', function() {
  var data = $(this).val();
  if ( data.length > 0 ) {
    $("#payload").addClass("isactive");
  } else {
    $("#payload").removeClass("isactive");
  }
});

$("#urladdress").on('change keyup paste', function() {
  var data = $(this).val();
  if ( data.length > 0 ) {
    $("#urladdress").addClass("isactive");
  } else {
    $("#urladdress").removeClass("isactive");
  }
});

let previousValue = "";
$("#templates").on('change keyup', function() {
  var templateName = $(this).val();
  var open = $(this).data("isopen");
  previousValue = templateName;

  if ( templateName.toLowerCase() == "clear" ) {
    $("#payload").removeClass("isactive");
    $("#payload").val("");
    return;
  }

  if ( templateName.length > 0 ) {
    $("#templates").addClass("isactive");
    var templateData = $(this).find(':selected').data('template');
    var decodedData = atob(templateData);

    // Template naming: TYPE_METHOD_NAME
    if ( templateName.indexOf("_") > -1 ) {
      const parts = templateName.split("_");
      const type = parts[0];
      const method = parts[1];
      const name = parts[2];

      // Remove checkmarks and choose the right one
      if ( type.toUpperCase() == "RAW" ) {
        $(".typeSelector").prop("checked", false);
        $("#type"+type.toUpperCase()).prop("checked", true);
      }

      if ( method ) {
        $("#method").val(method.toUpperCase());
      }

    }

    // Get chosen useragent
    const myUA = $("#useragent").val();
    if ( myUA.length > 0 ) {
      switch( myUA.toLowerCase() ) {
        case "internal":
          // Update userAgent
          userAgent = internalUserAgent;
          break;
        case "random10":
          // Get random useragent from array
          const randomIndex = Math.floor(Math.random() * userAgents.length);
          userAgent = userAgents[randomIndex];
          break;
        default:
          userAgent = "Unknown/"+myUA+" (THUGSred; Error)";
          break;
      }
    }

    if ( $("#bullyvars").is(':checked') ) {
      bulliedData = bullyVarsPre(decodedData);
      bulliedData = bullyVarsPost(bulliedData);
      $("#payload").val(bulliedData);
    } else {
      $("#payload").val(decodedData);
    }
    $("#payload").addClass("isactive");

    // Log loading of template
    logMessage({
      worker: "ui",
      severity: "info",
      message: "Loaded template: "+templateName + " ("+decodedData.length+" bytes)",
    });


  } else {
    $("#payload").removeClass("isactive");
    $("#payload").val("");
    return;
  }

});

function bullyVarsPre( data ) {
  // Replace all variables in the data with random values
  data = data.replace(/{{\s*([a-zA-Z0-9_'():\s]+)\s*}}/g, function(match, p1) {
    
    const fullFunction = p1.trim();
    let functionName = fullFunction;
    let functionArgs = false;

    // Check if the match is a function
    if ( fullFunction.indexOf("(") > -1 ) {
      const regexFunctionname = /([a-zA-Z0-9_]+)\((.*)\)/;
      parts = fullFunction.match(regexFunctionname);
      if ( parts ) {
        functionName = parts[1];
        if ( parts[2] ) {
          // Split the arguments by comma
          const args = parts[2].split(",");
          for ( var i = 0; i < args.length; i++ ) {
            if ( args[i].indexOf("'") > -1 ) {
              args[i] = args[i].trim().slice(1,-1);
            } else {
              args[i] = args[i].trim();
            }
          }
          functionArgs = args;
        } else {
          console.log("No arguments found");
        }
      } else {
        console.log("No match found for function name");
      }
    }

    //console.log("Var Name: "+functionName);
    //if ( functionArgs ) console.log("Var Args: "+functionArgs);

    switch(functionName) {
      case "useragent":
        return userAgent;
      case "random_ipv4":
        var ip = (Math.floor(Math.random() * 255) + 1)+"."+(Math.floor(Math.random() * 255))+"."+(Math.floor(Math.random() * 255))+"."+(Math.floor(Math.random() * 255));
        return ip;
      case "host":
        // Get value from #urladdress if empty, use example.com
        var url = $("#urladdress").val();
        if ( url.length > 0 ) {
          return url;
        }
        return "example.com";
      case "password_8rnd":
        // Generate random 8 character password
        var password = Math.random().toString(36).slice(-8);
        return password;

      case "base64":
        // Check if the function has arguments
        if ( functionArgs ) {
          // Check if the first argument is a string
          if ( functionArgs[0].length > 0 ) {
            // Encode the first argument to base64
            var b64 = btoa(functionArgs[0]);
            return b64;
          } else {
            console.log("No argument found for base64");
          }
        } else {
          console.log("No arguments found for base64");
        }
        break;
      default:
        console.log("Bully Vars (PRE) - Not handling: "+match);
        return match;
    }

  });
  return data;
}

function bullyVarsPost( data ) {
  // Replace all variables in the data with random values
  data = data.replace(/{{\s*([a-zA-Z0-9_'():\s]+)\s*}}/g, function(match, p1) {
    
    const fullFunction = p1.trim();
    let functionName = fullFunction;
    let functionArgs = false;

    // Check if the match is a function
    if ( fullFunction.indexOf("(") > -1 ) {
      const regexFunctionname = /([a-zA-Z0-9_]+)\((.*)\)/;
      parts = fullFunction.match(regexFunctionname);
      if ( parts ) {
        functionName = parts[1];
        if ( parts[2] ) {
          // Split the arguments by comma
          const args = parts[2].split(",");
          for ( var i = 0; i < args.length; i++ ) {
            if ( args[i].indexOf("'") > -1 ) {
              args[i] = args[i].trim().slice(1,-1);
            } else {
              args[i] = args[i].trim();
            }
          }
          functionArgs = args;
        } else {
          console.log("No arguments found");
        }
      } else {
        console.log("No match found for function name");
      }
    }

    //console.log("Var Name: "+functionName);
    //if ( functionArgs ) console.log("Var Args: "+functionArgs);

    switch(functionName) {
      case "contentlength":
        // Get the length of the payload
        var splitArray = data.split("\n\n");
        var headers = splitArray[0];
        var body = splitArray[1];
        if ( body.length > 0 ) {
          return body.length;
        }
        return 0;
      default:
        console.log("Bully Vars (POST) - Not handling: "+match);
        return match;
    }

  });
  return data;
}

function logMessage( logObj ) {
  const log = document.getElementById('log');
  
  /* This is how each logline looks line
  <div class="logline"><span class="timestamp">[00-00-0000 00:00:00]</span> <span class="worker">(worker-001)</span> <span class="severity">INFO</span> &VerticalSeparator; <span class="message">This is some log message ....</span></div>
  */
  const worker = logObj.worker;
  const msg = logObj.message;
  const severity = logObj.severity;
  const newLine = document.createElement('div');
  newLine.className = 'logline';
  // Get the current timestamp
  const now = new Date().toISOString();
  newLine.innerHTML = '<span class="timestamp">['+now+']</span> <span class="worker">('+worker.padStart(10, ' ')+')</span> <span class="severity '+severity.toLowerCase()+'">'+severity.toUpperCase().padStart(6, ' ')+'</span> &VerticalSeparator; <span class="message">'+msg+'</span>';
  log.appendChild(newLine);

  const count = document.getElementById("log").children.length;
  console.log("Log count: " + count);
  if (count > 5) {
    log.removeChild(log.firstChild);
  }
}

// Add function to clear log
function clearLog() {

  $('#log').html('');
  logMessage({
    worker: "ui",
    severity: "info",
    message: "Log cleared",
  });
}

$(function() {
  //clearLog(); // This is called in the main process

  $( "#template" ).on( "click", function() {
    clearLog();
  });
  $( "#kill" ).on( "click", function() {
    // Add random log message with random severity and message
    const workers = ["worker-001", "worker-002", "worker-003", "worker-004", "worker-005", "main", "ui"];
    const severities = ["info", "warn", "error", "debug", "trace", "fatal"];
    const messages = [
      "This is a test message",
      "This is another test message",
      "This is a third test message",
      "This is a fourth test message",
      "This is a fifth test message",
    ];
    const rndSeverity = severities[Math.floor(Math.random() * severities.length)];
    const rndMessage = messages[Math.floor(Math.random() * messages.length)];
    const rndWorker = workers[Math.floor(Math.random() * workers.length)];
    logMessage({
      worker: rndWorker,
      severity: rndSeverity,
      message: rndMessage,
    });
  });
});

