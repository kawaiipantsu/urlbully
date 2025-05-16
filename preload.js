const { electron, contextBridge, ipcRenderer, powerMonitor } = require('electron')

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type])
  }
})

contextBridge.exposeInMainWorld(
    "api", {
        invoke: (channel, data) => {
            let validChannels = ["myfunc"]; // list of ipcMain.handle channels you want access in frontend to
            if (validChannels.includes(channel)) {
                // ipcRenderer.invoke accesses ipcMain.handle channels like 'myfunc'
                // make sure to include this return statement or you won't get your Promise back
                return ipcRenderer.invoke(channel, data); 
            }
        },
    }
);

window.addEventListener('contextmenu', (e) => {
  e.preventDefault()
  ipcRenderer.send('show-context-menu')
})

ipcRenderer.on('context-menu-command', (e, command) => {
  // ...
})

ipcRenderer.on('cpu', (event, data) => {
  const text = document.getElementById('cpu-graph-bar-text');
  const pct = document.getElementById('cpu-graph-bar-pct');
  text.innerHTML = Math.round(data.toFixed(2))+'%';
  pct.style.width = Math.round(data.toFixed(2))+'%';
});
ipcRenderer.on('mem-used-pct', (event, data) => {
  const text = document.getElementById('mem-graph-bar-text');
  const pct = document.getElementById('mem-graph-bar-pct');
  text.innerHTML = Math.round(data.toFixed(2))+'%';
  pct.style.width = Math.round(data.toFixed(2))+'%';
});

ipcRenderer.on('mem', (event, data) => {
  //const test = document.getElementById('test');
  //test.innerHTML = 'Total: ' + data.total_human + ' GB<br>Used: ' + data.used_human + ' GB<br>Free: ' + data.free_human + ' GB<br>Pct Used: ' + data.pctUsed.toFixed(0) + '%<br>Pct Free: ' + data.pctFree.toFixed(0) + '%';
});

