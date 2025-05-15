const { app, BrowserWindow, nativeImage, Menu} = require('electron')
const os = require('os')
const osUtils = require('os-utils')
const path = require('path')

// modify your existing createWindow() function
const createWindow = () => {
  const mainWindow = new BrowserWindow({
    show: false,
    center: true,
    resizable: false,
    fullscreen: false,
    darkTheme: true,
    icon: './static/images/icon_v2.icns',
    width: 930,
    minWidth: 930,
    minHeight: 700,
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