const { electron, contextBridge, ipcRenderer, powerMonitor } = require('electron')
let TemplateFolder = process.resourcesPath+'/templates/';
let ConfigFolder = process.resourcesPath+'/configs/';
const fs = require('fs');

// Detect if running in dev mode
const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'dev';
console.log('Running in development mode: ', isDev);
if (isDev) {
  // If running in dev mode, set the test folder to the current directory
  TemplateFolder = __dirname + '/templates/';
  ConfigFolder = __dirname + '/configs/';
  buildBranch = "dev-build";
} else {
  buildBranch = "prod-build";
}

let templates = [];

// First get baked in templates
fs.readdir(TemplateFolder, (err, files) => {
  files.forEach(file => {
    // if txt file push into list
    if (file.endsWith('.txt')) {
      // remove .txt from filename
      const templateName = file.replace('.txt', '');
      const templateData = fs.readFileSync(TemplateFolder + file, 'utf8');

      templates.push({
        name: templateName,
        data: templateData,
        dataEncoded: btoa(templateData)
      });
    }
  });
});
// Then get user templates


window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type])
  }

  const menuStatus = document.getElementById('menustatus');
  menuStatus.innerHTML = buildBranch;

  const templateSelector = document.getElementById('templates');
  // add templates to select as options
  templates.forEach(template => {
    const option = document.createElement('option');
    option.value = template.name;
    option.text = template.name;
    option.setAttribute('data-template', template.dataEncoded);
    templateSelector.appendChild(option);
  });

  ipcRenderer.on('workerinfo', (event, workerinfo) => {
    const workerText = document.getElementById('thread-graph-bar-text');
    const workerPct = document.getElementById('thread-graph-bar-pct');
    workerText.innerHTML = workerinfo.workers.count;
    const pct = Math.round(workerinfo.workers.count / 200 * 100).toFixed(0);
    workerPct.style.width = pct+'%';
  });

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

})

contextBridge.exposeInMainWorld(
    "api", {
        invoke: (channel, data) => {
            let validChannels = ["killAllWorkers","pingAllWorkers","startWorker","removeWorker","getTemplates","getUserAgent","getPublicIp","getUserTemplates","addUserTemplate","openUserTemplates"];
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

  console.log(logObj)

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
  const now = new Date();
  const optionsTime = { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' };
  const optionsDate = { day: "numeric",month: "long", year: "numeric" };
  const timeString = now.toLocaleTimeString([], optionsTime);
  const dateString = now.toLocaleDateString([], optionsDate);
  const logTimeStamp = dateString + " " + timeString;
  newLine.innerHTML = '<span class="timestamp">['+logTimeStamp+']</span> <span class="worker">('+worker.padStart(10, ' ')+')</span> <span class="severity '+severity.toLowerCase()+'">'+severity.toUpperCase().padStart(6, ' ')+'</span> &VerticalSeparator; <span class="message">'+msg+'</span>';
  log.appendChild(newLine);
  if (log.childElementCount > 5) {
    log.removeChild(log.firstChild);
  }
});