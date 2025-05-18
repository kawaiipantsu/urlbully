const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const sleep = require('sleep-promise');

if (isMainThread) {
	throw new Error('This file is a worker thread and should not be run directly.')
}

const port = parentPort
if (!port) throw new Error('IllegalState')
const workerid = workerData.id
const work = workerData.args

let workerID = 'worker-'+workerid
let workerState = 'running'

port.on('message', data => {
	const { operation, worker, status, state } = data

	if (operation === 'internal') {

		if (status === 'ping') {
			port.postMessage({ operation: 'log', worker: workerID, status: 'pong', state: 'ok' })
		}

		if (status === 'exit') {
			workerState = 'exiting'
			port.postMessage({ operation: 'internal', worker: workerID, status: 'exit-forced', state: 'ok' })
			port.close()
		}

	}
})



const sleepTime = Math.floor(Math.random() * 10000) + 1000

port.postMessage({ operation: 'internal', worker: workerID, status: 'running', state: 'ok' })
port.postMessage({ operation: 'log', worker: workerID, status: 'Worker is now operational!', state: 'ok' })

sleep(sleepTime).then(() => {
	if (workerState === 'running') {
		//port.postMessage({ operation: 'log', worker: workerID, status: 'Idle...', state: 'ok' })
	}
}).catch(err => {
	port.postMessage({ operation: 'log', worker: workerID, status: err, state: 'error' })
	port.postMessage({ operation: 'internal', worker: workerID, status: 'error', state: 'ok' })
	port.close()
}).finally(() => {
	//port.postMessage({ operation: 'log', worker: workerID, status: 'Exiting!', state: 'ok' })
	port.postMessage({ operation: 'internal', worker: workerID, status: 'exit', state: 'ok' })
	port.close()
})
