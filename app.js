const { app, BrowserWindow, nativeImage, Menu, ipcMain, contextBridge} = require('electron')
const os = require('os')
const osUtils = require('os-utils')
const path = require('path')

const isMac = process.platform === 'darwin'
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
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
    }
  })

  mainWindow.once('ready-to-show', () => {
        mainWindow.show()
  })

  setInterval(() => {
        osUtils.cpuUsage(function (v) {
            mainWindow.webContents.send("cpu", v * 100 );
            let tmem = osUtils.totalmem()
            let fmem = osUtils.freemem()

            // MAke a memory object with total, used, free, pct
            // Both include pct free and pct used
            // total, free, used also show in GB
            let mem = {
                total: tmem,
                free: tmem - fmem,
                used: fmem,
                total_human: (tmem / 1024).toFixed(2),
                free_human: ((tmem - fmem) / 1024).toFixed(2),
                used_human: (fmem / 1024).toFixed(2),
                pctUsed: fmem / tmem * 100,
                pctFree: (tmem - fmem) / tmem * 100
            }

            mainWindow.webContents.send("mem-used-pct", fmem / tmem * 100);
            mainWindow.webContents.send("mem", mem);
        });
  }, 2000);

  setInterval(() => {
    
    mainWindow.webContents.send("updateHTTP200", {
      timestamp: new Date().getTime(),
      value: Math.floor(Math.random() * 600)
    });


  }, 2000);




  

  mainWindow.loadFile('./static/main.html')
}

// main
ipcMain.handle('myfunc', async (event, arg) => {
  return new Promise(function(resolve, reject) {
    // do stuff
    if (true) {
        resolve("this worked!");
    } else {
        reject("this didn't work!");
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
        label: 'Encode / Decode',
        enabled: true,
        submenu: [
          {
            label: 'URL Encode selected',
            accelerator: 'CmdOrCtrl+Q',
            click: () => { event.sender.send('context-menu-command', 'urlEncodeSelected') }
          },
          {
            label: 'URL Decode selected',
            accelerator: 'CmdOrCtrl+E',
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

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit the application when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})