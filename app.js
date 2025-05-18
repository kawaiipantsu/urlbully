const { app, BrowserWindow, globalShortcut, nativeImage, Menu, ipcMain, contextBridge, dialog} = require('electron')
const os = require('os')
const osUtils = require('os-utils')
const path = require('node:path')
const { get } = require('jquery')
const https = require('https')
const fs = require('node:fs');
const Config = require('./storagesettings.js');
const UserTemplates = require('./storagetemplates.js');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

const appFolder = path.dirname(process.execPath)
const ourExeName = path.basename(process.execPath)
const stubLauncher = path.resolve(appFolder, '..', ourExeName)
const isMac = process.platform === 'darwin'
const version_node = process.versions.node;
const version_electron = process.versions.electron;
const version_chrome = process.versions.chrome;
const software_version = "Node/"+version_node+" Electron/"+version_electron+" Chrome/"+version_chrome;
const ua_version = "Node/"+version_node+" Electron/"+version_electron+" Chrome/"+version_chrome;
const version_app = app.getVersion()+" ("+app.getName()+")\n";
const appIcon = nativeImage.createFromPath(path.join(__dirname, 'static/images/icon.png'))

// Create a url bully user-agent string
const userAgent = 'URLBully/'+app.getVersion() + ' (THUGSred) ' + ua_version;

let buildBranch = "dev-build "-app.getVersion();
let workers = [];

const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'dev';
if (isDev) {
  buildBranch = "dev-build "+app.getVersion();
} else {
  buildBranch = "prod-build "+app.getVersion();
}

// Playing around with default config
// After this you can use set / get methods
const config = new Config({
  'filename': 'urlbully-preferences',
  'content': {
    'connection': {
      'timeout': { 
        'conn': 60,
        'resolv': 60,
        'idle': 60
      }
    },
    'http': {
      'method': 'GET',
      'useragent': 'Internal',
      'protocol': 'http / 1.1',
    },
  }
});

let mainWindow;

const template = [
  // { role: 'appMenu' }
  ...(isMac
    ? [{
        label: app.name,
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          { role: 'services' },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideOthers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit' }
        ]
      }]
    : []),
  // { role: 'fileMenu' }
  {
    label: 'File',
    submenu: [
      isMac ? { role: 'close' } : { role: 'quit' }
    ]
  },
  // { role: 'editMenu' }
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      ...(isMac
        ? [
            { role: 'pasteAndMatchStyle' },
            { role: 'delete' },
            { role: 'selectAll' },
            { type: 'separator' },
            {
              label: 'Speech',
              submenu: [
                { role: 'startSpeaking' },
                { role: 'stopSpeaking' }
              ]
            }
          ]
        : [
            { role: 'delete' },
            { type: 'separator' },
            { role: 'selectAll' }
          ])
    ]
  },
  // { role: 'viewMenu' }
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  },
  // { role: 'windowMenu' }
  {
    label: 'Window',
    submenu: [
      { role: 'minimize' },
      { role: 'zoom' },
      ...(isMac
        ? [
            { type: 'separator' },
            { role: 'front' },
            { type: 'separator' },
            { role: 'window' }
          ]
        : [
            { role: 'close' }
          ])
    ]
  },
  {
    role: 'help',
    submenu: [
      {
        label: 'THUGSred',
        click: async () => {
          const { shell } = require('electron')
          await shell.openExternal('https://thugs.red')
        }
      }
    ]
  }
]

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)


// modify your existing createWindow() function
const createWindow = () => {
  mainWindow = new BrowserWindow({
    show: false,
    center: true,
    resizable: false,
    fullscreen: false,
    darkTheme: true,
    icon: './static/images/icon_v2.icns',
    width: 930,
    minWidth: 930,
    height: 1000,
    minHeight: 1000,
    webPreferences: {
        defaultEncoding: 'UTF-8',
        devTools: true,
        webSecurity: true,
        nodeIntegration : true,
        nodeIntegrationInWorker: true,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
    }
  })

  mainWindow.once('ready-to-show', () => {
        mainWindow.show()
  })

  setInterval(() => {
        osUtils.cpuUsage(function (v) {
            const now = new Date().toISOString();
            let tmem = osUtils.totalmem()
            let fmem = osUtils.freemem()
            let sysInfo = {
                time: now,
                platform: os.platform(),
                arch: os.arch(),
                release: os.release(),
                uptime: os.uptime(),
                hostname: os.hostname(),
                cpus: os.cpus(),
                networkInterfaces: os.networkInterfaces(),
                loadavg: os.loadavg(),
                cpu: {
                    utilization: v,
                    utilization_human: (v * 100).toFixed(2),
                    cores: os.cpus().length,
                    speed: os.cpus()[0].speed,
                    model: os.cpus()[0].model,
                    loadavg: os.loadavg(),
                    fullloadavg: {
                        one: os.loadavg(1),
                        five: os.loadavg(5),
                        fifteen: os.loadavg(15)
                    }
                },
                memory: {
                  total: tmem,
                  free: tmem - fmem,
                  used: fmem,
                  total_human: (tmem / 1024).toFixed(2),
                  free_human: ((tmem - fmem) / 1024).toFixed(2),
                  used_human: (fmem / 1024).toFixed(2),
                  pctUsed: fmem / tmem * 100,
                  pctFree: (tmem - fmem) / tmem * 100
                }
            }
            
            if ( !mainWindow.isDestroyed() ) mainWindow.webContents.send("sysinfo", sysInfo);
        });
  }, 4000);

  setInterval(() => {
    const now = new Date().toISOString();
    let workerInfo = {
        time: now,
        workers: {
          count: workers.length
        }
    }
    if ( !mainWindow.isDestroyed() ) mainWindow.webContents.send("workerinfo", workerInfo);
  }, 1000);

  mainWindow.loadFile('./static/main.html')
}

const usertemplates = new UserTemplates();

ipcMain.handle('getUserTemplates', async (event, arg) => {
  return new Promise(function(resolve, reject) {
    const templates = usertemplates.list();
    if (true) {
        resolve(templates);
    } else {
        reject([]);
    }
  });  
});

ipcMain.handle('openUserTemplates', async (event, arg) => {
  return new Promise(function(resolve, reject) {
    let path = usertemplates.path;
    var cmd = '';
    switch (os.platform().toLowerCase().replace(/[0-9]/g, '').replace('darwin', 'macos')) {
        case 'win':
            path = path || '=';
            cmd = 'explorer';
            break;
        case 'linux':
            path = path || '/';
            cmd = 'xdg-open';
            break;
        case 'macos':
            path = path || '/';
            cmd = 'open';
            break;
    }
    let p = require('child_process').spawn(cmd, [path]);
    p.on('error', (err) => {
        p.kill();
        return callback(err);
    });

    if (true) {
        resolve();
    } else {
        reject();
    }
  });  
});

ipcMain.handle('pingAllWorkers', async (event, arg) => {
  // Ping all workers
  if (isMainThread) {
    for (let i = 0; i < workers.length; i++) {
      let workerid = workers[i].id;
      let worker = workers[i].worker;
      worker.postMessage({ operation: 'internal', worker: workerid, status: 'ping', state: 'ok' });
    }
  }
});

ipcMain.handle('killAllWorkers', async (event, arg) => {
  // Kill (tell them to exit) all workers
  if (isMainThread) {
    for (let i = 0; i < workers.length; i++) {
      let workerid = workers[i].id;
      let worker = workers[i].worker;
      worker.postMessage({ operation: 'internal', worker: workerid, status: 'exit', state: 'ok' });
    }
  }
});

ipcMain.handle('startWorker', async (event, arg) => {
    // Start a worker
    if (isMainThread) {

      const currentWorkers = workers.length+1;

      //console.log("Current workers: "+currentWorkers);

      // Main thread: Create a worker thread
      const worker = new Worker('./worker.js',{ workerData: { id: currentWorkers, args: arg } });

      worker.on('message', (data) => {
        //console.log(data);

        const operation = data.operation;
        const message = data.status;
        const workerid = data.worker;
        const state = data.state;

        let severity = "INFO";
        if ( state == "ok" ) { severity = "INFO"; }
        if ( state == "error" ) { severity = "ERROR"; } 

        if ( operation == "internal" ) {
          if ( message == "running" ) {
            // workerid = "worker-id" split and get pid
            let workerID = workerid.split("-")[1];
            workers.push({
              threadId: worker.threadId,
              id: workerID,
              worker: worker
            });
            //console.log("Workers: "+workers.length);
          }
          if ( message == "pong" ) {
            //console.log(workerid+": Pong!");
            if ( !mainWindow.isDestroyed() ) mainWindow.webContents.send("logMessage", {
              worker: workerid,
              message: "Pong!",
              severity: "DEBUG"
            });
          }
          if ( message == "exit" ) {
           let workerID = workerid.split("-")[1];
            // Remove the worker from the list
            for (let i = 0; i < workers.length; i++) {
              if (workers[i].id == workerID) {
                workers.splice(i, 1);
                break;
              }
            }
            if ( !mainWindow.isDestroyed() ) mainWindow.webContents.send("logMessage", {
              worker: "main",
              message: "Worker finished: "+workerid,
              severity: "INFO"
            });
          }
          if ( message == "exit-forced" ) {
           let workerID = workerid.split("-")[1];
            // Remove the worker from the list
            for (let i = 0; i < workers.length; i++) {
              if (workers[i].id == workerID) {
                workers.splice(i, 1);
                break;
              }
            }
            if ( !mainWindow.isDestroyed() ) mainWindow.webContents.send("logMessage", {
              worker: "main",
              message: "Worker killed: "+workerid,
              severity: "WARN"
            });
          }
        } else if ( operation == "log" ) {
          if ( !mainWindow.isDestroyed() ) mainWindow.webContents.send("logMessage", {
            worker: workerid,
            message: message,
            severity: severity
          });
        }

      });
    } 
});

ipcMain.handle('removeWorker', async (event, arg) => {
  // Remove a worker
  // Check we even have a worker
  if ( workers.length == 0 ) {
    //console.log("No workers to remove");
    if ( !mainWindow.isDestroyed() ) mainWindow.webContents.send("logMessage", {
      worker: "main",
      message: "No workers to remove",
      severity: "DEBUG"
    });
    return;
  }

  if (isMainThread) {
    // Remove latest worker
    let workerid = workers[workers.length-1].id;
    let worker = workers[workers.length-1].worker;
    let threadId = workers[workers.length-1].threadId;
    //console.log("Removing worker: "+workerid);
    // Remove the worker from the list
    for (let i = 0; i < workers.length; i++) {
      if (workers[i].id == workerid) {
        workers.splice(i, 1);
        break;
      }
    }
    // Send exit command to the worker
    worker.postMessage({ operation: 'internal', worker: workerid, status: 'exit', state: 'ok' });
  }
});

ipcMain.handle('getPublicIp', async (event, arg) => {
  return new Promise(function(resolve, reject) {
    getPublicIP();
    if (true) {
        resolve(true);
    } else {
        reject(false);
    }
  });  
});

ipcMain.on('show-context-menu', (event) => {
  const template = [
    {
      label: 'Select All',
      role: 'selectall'
    },
    { type: 'separator' },
    {
      label: 'Copy',
      role: 'cut',
    },
    {
      label: 'Cut',
      role: 'cut',
    },
    {
      label: 'Paste',
      role: 'cut',
    },
    { type: 'separator' },
    {
        label: 'Header manipulation',
        enabled: true,
        submenu: [
          {
            label: 'Recalculate Content-Length',
            accelerator: 'Control+R',
            click: () => { event.sender.send('context-menu-command', 'recalculateContentLength') }
          }
        ]
    },
    {
        label: 'Encode / Decode',
        enabled: true,
        submenu: [
          {
            label: 'URL Encode selected',
            accelerator: 'Control+Q',
            click: () => { event.sender.send('context-menu-command', 'urlEncodeSelected') }
          },
          {
            label: 'URL Decode selected',
            accelerator: 'Control+E',
            click: () => { event.sender.send('context-menu-command', 'urlDecodeSelected') }
          },
          {
            label: 'Base64 Encode selected',
            click: () => { event.sender.send('context-menu-command', 'base64EncodeSelected') }
          },
          {
            label: 'Base64 Decode selected',
            click: () => { event.sender.send('context-menu-command', 'base64DecodeSelected') }
          }
        ]
    },
    {
        label: 'Hashing',
        enabled: true,
        submenu: [
          {
            label: 'Hash (md5) selected',
            click: () => { event.sender.send('context-menu-command', 'md5Selected') }
          },
          {
            label: 'Hash (sha256) selected',
            click: () => { event.sender.send('context-menu-command', 'sha256Selected') }
          },
          {
            label: 'Hash (sha512) selected',
            click: () => { event.sender.send('context-menu-command', 'sha512Selected') }
          },
          {
            label: 'Hash (crc32) selected',
            click: () => { event.sender.send('context-menu-command', 'crc32Selected') }
          }
        ]
    },
    { type: 'separator' },
    {
      label: 'Toggle DevTools',
      accelerator: 'CmdOrCtrl+I',
      role: 'toggleDevTools'
    },
    { type: 'separator' },
    {
      label: 'Quit',
      role: 'quit'
    }
  ]
  const menu = Menu.buildFromTemplate(template)
  menu.popup({ window: BrowserWindow.fromWebContents(event.sender) })
})

function getPublicIP(anon=false) {
  // Call https://api.buffer.dk/myip
  // Response JSON like {"ip":"10.10.10.10","dns":"some.hostname.com"}
  var options = {
    hostname: "api.buffer.dk",
    port: 443,
    path: "/myip",
    method: 'GET',
    headers: {
      'User-Agent': userAgent,
      'Accept': 'application/json'
    }
  };

  var req = https.request(options, function (res) {
    res.setEncoding('utf8');
    var data = '';
    res.on('data', function (chunk) {
      data = data + chunk;
    });
    res.on('end',function(){
      //console.log("Data:" + data);
      if (res.statusCode !== 200) {
        //publicIPCallback(false,res.statusCode);
      } else {
        publicIPCallback(data,anon);
      }
    });
   });

  req.on('error', function (e) {
    //console.log("Error : " + e.message);
    //publicIPCallback(e);
  });

  req.end();
  
}

// Eenable global shortcuts
app.commandLine.appendSwitch('enable-features', 'GlobalShortcutsPortal')

// Disable GPU acceleration
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('disable-gpu-compositing');
app.commandLine.appendSwitch('disable-gpu-rasterization');
app.commandLine.appendSwitch('disable-gpu-sandbox');

// Make a bit of customization to the app about panel
app.setAboutPanelOptions({
    applicationName: "URL Bully by THUGSred", 
    website: "https://thugs.red",
    authors: ["Kawaiipantsu"],
    applicationVersion: version_app,
    version: software_version,
    credits: "Thanks to Kawaiipantsu ❤️\nand the community!",
    copyright: "Copyright (c) 2025\nTHUGSred",
    iconPath: path.join(__dirname, 'static/images/urlbully-image.png'),
  });

function annonymizeIP(ip) {
  // Anonymize the IP address by replacing the last octet with 0
  return ip.replace(/(\d+)\.\d+\.\d+\.\d+/, '$1.0.0.0');
}

  // Get my public ip and log it
function publicIPCallback(jsonData, anon) {
    var data = JSON.parse(jsonData);
    if ( !mainWindow.isDestroyed() ) {
      let hostinfo = "";
      if ( anon ) {
        data.ip = annonymizeIP(data.ip);
      } else {
        hostinfo = " ("+data.dns+")";
      }

      mainWindow.webContents.send("logMessage", {
        worker: "main",
        message: "Public IP: "+data.ip+hostinfo,
        severity: "INFO"
      });
    }
}

function readTemplates() {
  // Read *.txt files from the templates directory
  const templatesDir = path.join(__dirname, 'templates');
  fs.readdir(templatesDir, (err, files) => {
    let templateList = [];
    if (err) {
      console.error('Error reading templates directory:', err);
      return;
    }
    files.forEach(file => {
      if (file.endsWith('.txt')) {
        const filePath = path.join(templatesDir, file);
        templateList.push({ template: file });
      }
    });
    return templateList;
  });
}

app.whenReady().then(() => {
  createWindow()

  if ( !mainWindow.isDestroyed() ) mainWindow.webContents.send("clearLog");

  if ( !mainWindow.isDestroyed() ) mainWindow.webContents.send("logMessage", {
    worker: "main",
    message: "URLBully v"+app.getVersion()+" started",
    severity: "INFO"
  });

  if ( !mainWindow.isDestroyed() ) mainWindow.webContents.send("logMessage", {
    worker: "main",
    message: os.platform()+" "+os.release()+" CPU Arch"+": "+os.arch()+", Cores: "+os.cpus().length+", Speed: "+os.cpus()[0].speed+" MHz",
    severity: "INFO"
  });

  if ( !mainWindow.isDestroyed() ) mainWindow.webContents.send("logMessage", {
    worker: "main",
    message: "MEM: "+(os.totalmem()/1024/1024/1024).toFixed(0)+"GB, "+(os.freemem()/1024/1024/1024).toFixed(1)+"GB free, "+((os.totalmem()-os.freemem())/1024/1024/1024).toFixed(1)+"GB used",
    severity: "INFO"
  });

  const networkInterfaces = os.networkInterfaces();
  const activeInterfaces = Object.keys(networkInterfaces).filter(iface => {
    return networkInterfaces[iface].some(details => {
      return details.family === 'IPv4' && !details.internal;
    });
  });
  // Get the first active interface
  const firstActiveInterface = activeInterfaces[0]; 
  
  if ( !mainWindow.isDestroyed() ) mainWindow.webContents.send("logMessage", {
    worker: "main",
    message: "Active network interfaces: "+activeInterfaces.join(", "),
    severity: "INFO"
  });

  getPublicIP(true);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

ipcMain.handle('getTemplates', async (event, arg) => {
  const templates = readTemplates();
  console.log(templates);
  return new Promise(function(resolve, reject) {
    if (true) {
        resolve(templates);
    } else {
        reject(false);
    }
  });  
});

ipcMain.handle('getUserAgent', async (event, arg) => {
  return new Promise(function(resolve, reject) {
    if (true) {
        resolve(userAgent);
    } else {
        reject("...");
    }
  });  
});