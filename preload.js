const { contextBridge, ipcRenderer, powerMonitor } = require('electron')
const electron = require('electron');

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type])
  }
})

contextBridge.exposeInMainWorld('usage', {
  cpu: process.getCPUUsage().percentCPUUsage.toString().slice(0, 5)
});
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
  const test = document.getElementById('test');
  test.innerHTML = 'Total: ' + data.total_human + ' GB<br>Used: ' + data.used_human + ' GB<br>Free: ' + data.free_human + ' GB<br>Pct Used: ' + data.pctUsed.toFixed(0) + '%<br>Pct Free: ' + data.pctFree.toFixed(0) + '%';
});

