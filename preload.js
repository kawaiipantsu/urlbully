const { electron, contextBridge, ipcRenderer, powerMonitor } = require('electron')
const testFolder = './templates/';
const fs = require('fs');

let templates = [];
fs.readdir(testFolder, (err, files) => {
  files.forEach(file => {
    // if txt file push into list
    if (file.endsWith('.txt')) {
      // remove .txt from filename
      const templateName = file.replace('.txt', '');
      const templateData = fs.readFileSync(testFolder + file, 'utf8');

      templates.push({
        name: templateName,
        data: templateData,
        dataEncoded: btoa(templateData)
      });
    }
  });
});



window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type])
  }

  const templateSelector = document.getElementById('templates');
  // add templates to select as options
  templates.forEach(template => {
    const option = document.createElement('option');
    option.value = template.name;
    option.text = template.name;
    option.setAttribute('data-template', template.dataEncoded);
    templateSelector.appendChild(option);
  });

})

contextBridge.exposeInMainWorld(
    "api", {
        invoke: (channel, data) => {
            let validChannels = ["myfunc","getTemplates","getUserAgent"];
            if (validChannels.includes(channel)) {
                return ipcRenderer.invoke(channel, data); 
            }
        },
    },
);

window.addEventListener('contextmenu', (e) => {
  e.preventDefault()
  ipcRenderer.send('show-context-menu')
})

ipcRenderer.on('context-menu-command', (e, command) => {

  if ( command == "recalculateContentLength") {
    const payload = document.getElementById('payload');
    const payloadText = payload.value;
    var splitArray = payloadText.split("\n\n");
    var headers = splitArray[0];
    var body = splitArray[1];
    if ( body.length > 0 ) {
      const contentLength = body.length;
      // Replace the content length in the payload
      const newPayload = payloadText.replace(/Content-Length: \d+/g, 'Content-Length: '+contentLength);
      payload.value = newPayload;
    }
  }
  
})

let sysInfo = null;

// Get the system information via IPC from Main
ipcRenderer.on('sysinfo', (event, sysinfo) => {
  const cpuText = document.getElementById('cpu-graph-bar-text');
  const cpuPct = document.getElementById('cpu-graph-bar-pct');
  const memText = document.getElementById('mem-graph-bar-text');
  const memPct = document.getElementById('mem-graph-bar-pct');

  const status = document.getElementById('status');

  cpuText.innerHTML = Math.round(sysinfo.cpu.utilization_human)+'%';
  cpuPct.style.width = Math.round(sysinfo.cpu.utilization_human)+'%';
  memText.innerHTML = Math.round(sysinfo.memory.pctUsed)+'%';
  memPct.style.width = Math.round(sysinfo.memory.pctUsed)+'%';

  // Show load avg
  status.innerHTML = 'Load Avg: '+sysinfo.cpu.loadavg[0].toFixed(2)+', '+sysinfo.cpu.loadavg[1].toFixed(2)+', '+sysinfo.cpu.loadavg[2].toFixed(2);
  
  // Update the system information object if null
  if (sysInfo === null) {
    sysInfo = sysinfo;
  }

});

function getSelectionText() {
    var text = "";
    if (window.getSelection) {
        text = window.getSelection().toString();
    } else if (document.selection && document.selection.type != "Control") {
        text = document.selection.createRange().text;
    }
    return text;
}

function clearLog() {
  const logWindow = document.getElementById('log');
  logWindow.innerHTML = '';
}

ipcRenderer.on('clearLog', (event) => {
  clearLog();
});
ipcRenderer.on('logMessage', (event, logObj) => {
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
  if (log.childElementCount > 5) {
    log.removeChild(log.firstChild);
  }
});