/*
File: file-server.js
Description: HyperReload file server.
Author: Mikael Kindborg

License:

Copyright (c) 2015 Evothings AB

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

	http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

/*********************************/
/***	 Imported modules	   ***/
/*********************************/

var MAIN = require('electron').remote.getGlobal('main');

var OS = require('os')
var FS = require('fs')
var PATH = require('path')
var SOCKETIO_CLIENT = require('socket.io-client')
var FILEUTIL = require('./file-util.js')
var LOADER = require('./file-loader.js')
var LOGGER = require('./log.js')
var SETTINGS = require('../settings/settings.js')
var UUID = require('./uuid.js')
var EVENTS = require('./system-events.js')

/*********************************/
/***	 Module variables	   ***/
/*********************************/

// Workbench version.
// TODO: Get this from somewhere.
var mWorkbenchVersion = '2.3.0'

var mIsConnected = false
var mSessionID = null
var mRemoteServerURL = ''
var mSocket = null
var mAppFile = null
var mAppID = null
var mMessageCallback = null
var mClientInfoCallback = null
var mReloadCallback = null
var mRequestConnectKeyCallback = null
var mCheckIfModifiedSince = false
var mHeartbeatTimer = undefined
var mDeviceInfo = {}
var mHeartbeatInterval = 20000
exports.mClientInfo = undefined

mFoo = UUID.generateUUID()
// The current base directory. Must NOT end with a slash.
var mBasePath = ''

/*********************************/
/***	 Server functions	   ***/
/*********************************/

/**
 * External.
 */
exports.connectToRemoteServer = function()
{
	console.log('[file-server.js] Connecting to remote server')

	// Message handler table.
	var messageHandlers =
	{
		// Messages from the server to the Workbench.
		'workbench.client-info': onMessageWorkbenchClientInfo,
		'workbench.instrumentation': onMessageWorkbenchClientInstrumentation,
		'workbench.get-resource': onMessageWorkbenchGetResource,
		'workbench.log': onMessageWorkbenchLog,
		'workbench.javascript-result': onMessageWorkbenchJavaScriptResult,
		'workbench.user-message': onMessageWorkbenchUserMessage,
	}

	console.log('[file-server.js] connecting to server: ' + mRemoteServerURL)

	// Create socket.io instance.
	var socket = SOCKETIO_CLIENT(
		mRemoteServerURL,
		{ 'force new connection': true })

	// Save global reference to socket.io object.
	console.log('---------------- setting socket')
	mSocket = socket

	// Connect function.
	socket.on('connect', function()
	{
		console.log('[file-server.js] Connected to server')
		mIsConnected = true
		EVENTS.publish(EVENTS.CONNECT, { event: 'connected' })
		//exports.requestConnectKey()
		mSessionID = SETTINGS.getSessionID()

		console.log('[file-server.js] workbench.connected session: ' + mSessionID)

		sendConnectMessage()
	})

	socket.on('error', function(error)
	{
		console.log('[file-server.js] socket error: ' + error)
	})

	socket.on('disconnect', function()
	{
		mIsConnected = false
		EVENTS.publish(EVENTS.DISCONNECT, {event: 'disconnected' })
		clearInterval(mHeartbeatTimer)
	})

	socket.on('hyper-workbench-message', function(message)
	{
		console.log('hyper-workbench-message: message = '+message.name)

		var handler = messageHandlers[message.name]
		if (handler)
		{

			handler(socket, message)
		}
		else
		{
			console.log('HANDLER NOT FOUND for message '+message.name+' !!!')
		}
	})
}

function sendConnectMessage()
{
	var info =
	{
		arch: OS.arch(),
		platform: OS.platform(),
		osrelease: OS.release(),
		ostype: OS.type()
	}
	var workbenchID = SETTINGS.getEvoGUID()
	console.log('[file-server.js] sendConnectMessage called. ------ workbenchID = '+workbenchID)
	mDeviceInfo = info
	sendMessageToServer(mSocket, 'workbench.connected', { workbenchID: mSessionID, info: info })
	mHeartbeatTimer = setInterval(heartbeat, mHeartbeatInterval)
	heartbeat()
}

exports.sendConnectMessage = sendConnectMessage

function heartbeat()
{
	var uuid = SETTINGS.getEvoGUID()
	sendMessageToServer(mSocket, 'workbench.heartbeat', {sessionID: mSessionID, uuid: uuid, info: mDeviceInfo})
}

function onMessageWorkbenchUserLogin(socket, message)
{
	if(message.data && message.data.user)
	{
		EVENTS.publish(EVENTS.LOGIN, message.data.user)
	}
}

function onMessageWorkbenchUserLogout(socket, message)
{
	EVENTS.publish(EVENTS.LOGOUT, {event: 'logout'})
}

function sendMessageToServer(name, data)
{
	var workbenchID = SETTINGS.getEvoGUID()
	mSocket.emit('hyper-workbench-message', {
		workbenchVersion: mWorkbenchVersion,
		workbenchID: workbenchID,
		name: name,
		data: data })	
}

exports.sendMessageToServer = sendMessageToServer

function onMessageWorkbenchClientInfo(socket, message)
{
	//console.log('[file-server.js] got client info')
	console.dir(message)

	// Notify UI about clients.
	EVENTS.publish(EVENTS.VIEWERSUPDATED, message.data)
	exports.mClientInfo = message.data
	console.log('=======================================  '+mFoo+'  ================SERVER clientinfo')
	console.dir(exports.mClientInfo)
	MAIN.setCurrentViewers(message.data)
	mClientInfoCallback && mClientInfoCallback(message)
}

function onMessageWorkbenchClientInstrumentation(socket, message)
{
	// Notify UI about clients.
	//console.log('[file-server.js] ******** got client instrumentation')
	//console.dir(message)

	EVENTS.publish(EVENTS.VIEWERSINSTRUMENTATION, message.data)
}

function onMessageWorkbenchGetResource(socket, message)
{
	var ifModifiedSince =
		mCheckIfModifiedSince
			? message.data.ifModifiedSince
			: null

	var response = serveResource(
		message.data.platform,
		message.data.path,
		ifModifiedSince)

	sendMessageToServer(
		'workbench.resource-response',
		{
			id: message.data.id,
			appID: mAppID,
			response: response
		})
}

function onMessageWorkbenchLog(socket, message)
{
	// Pass message to Tools window.
	mMessageCallback && mMessageCallback(
		{ message: 'hyper.log', logMessage: message.data.message })
}

function onMessageWorkbenchJavaScriptResult(socket, message)
{
	var data = message.data.result
	// For common eval ops like OOB file sync and instrumentation availability polling, we don't want results logging
	if(data != '_DONOT_')
	{
		// Functions cause a cloning error, as a fix just show the type.
		if (typeof data == 'function')
		{
			data = typeof data
		}

		// Pass message to Tools window.
		console.log('js log result callback = '+mMessageCallback)
		mMessageCallback && mMessageCallback(
			{ message: 'hyper.result', result: data })
		EVENTS.publish(EVENTS.HYPER_RESULT, data)
	}
}

function onMessageWorkbenchUserMessage(socket, message)
{
	// Display message if we got one.
	if (message.data)
	{
		// Pass the message to the callback function,
		// this displays the message in the UI.
		EVENTS.publish(EVENTS.USERMESSAGE, message.data)
	}
}

/**
 * External.
 */
exports.isConnected = function()
{
	return mIsConnected
}

/**
 * External.
 */
exports.sendDisconnectAllViewersToServer = function()
{
	sendMessageToServer('workbench.disconnect-viewers', { })
}

/**
 * External.
 */
exports.disconnectFromRemoteServer = function()
{
	console.log('[file-server.js] Disconnecting from remote server')
	clearTimeout(mHeartbeatTimer)
	if (mSocket)
	{
		mSocket.close()
	}
}

/**
 * Internal.
 */
function serveUsingResponse200()
{
	mCheckIfModifiedSince = false
}

/**
 * Internal.
 */
function serveUsingResponse304()
{
	mCheckIfModifiedSince = true
}

/**
 * Internal.
 */
function serveResource(platform, path, ifModifiedSince)
{
	//console.log('[file-server.js] serveResource: ' + path)

	if (!path || path == '/')
	{
		// TODO: Serve something else? A default page?
		// Handle this case in the server?
		LOADER.createResponse404(path)
	}
	else if (mBasePath)
	{
		return LOADER.response(
			PATH.join(mBasePath, path),
			ifModifiedSince)
	}
	else
	{
		return LOADER.createResponse404(path)
	}
}

/**
 * Internal.
 *
 * Returns null if file is not found.
 */
function serveFileOrNull(path)
{
	var response = LOADER.response(path)
	if (200 == response.resultCode)
	{
		return response
	}
	else
	{
		return null
	}
}

/**
 * External.
 */
exports.setAppPath = function(appPath)
{
	mBasePath = PATH.normalize(appPath.replace(new RegExp('\\' + PATH.sep, 'g'), '/'))
}

/**
 * External.
 */
exports.setAppFileName = function(fileName)
{
	mAppFile = PATH.normalize(fileName.replace(new RegExp('\\' + PATH.sep, 'g'), '/'))
}

/**
 * External.
 */
exports.setAppID = function(id)
{
	mAppID = id
}

/**
 * External.
 *
 * Return the name of the main HTML file of the application.
 */
exports.getAppFileName = function()
{
	return mAppFile
}

/**
 * External.
 */
exports.getAppPath = function()
{
	return PATH.join(mBasePath, mAppFile)
}

/**
 * External.
 */
exports.getBasePath = function()
{
	return mBasePath
}

/**
 * External.
 */
exports.getAppServerURL = function()
{
	return mRemoteServerURL + '/hyper/' + mSessionID + getAppURL()
}

/**
 * Internal.
 */
function getAppURL()
{
	return '/' + mAppID + '/' + mAppFile
}

exports.getClientInfo = function()
{
	console.log('++++++++++++++++++++++++++ '+mFoo+' ++++++++++SERVER.getClientInfo returning')
	console.dir(exports.mClientInfo)
	return exports.mClientInfo
}

/**
 * External.
 *
 * Reloads the main HTML file of the current app.
 */
exports.runApp = function()
{
	// Useful for testing without client caching: serveUsingResponse200()
	serveUsingResponse304()
	console.log('[file-server.js] run app: ' + getAppURL())
	sendMessageToServer(
		'workbench.run',
		{
			appID: mAppID,
			appName: hyper.UI.getTitleFromFile(exports.getAppPath()),
			url: getAppURL(),
			protocol: SETTINGS.getRunProtocol()
		})
}

/**
 * External.
 *
 * Reloads the currently visible page of the browser.
 */
exports.reloadApp = function()
{
	serveUsingResponse304()
	sendMessageToServer(
		'workbench.reload',
		{
			appID: mAppID,
			appName: hyper.UI.getTitleFromFile(exports.getAppPath())
		})
	mReloadCallback && mReloadCallback()
}

/**
 * External. clientID is an optional param.
 */
exports.evalJS = function(code, clientID)
{
	if (!clientID) clientID = null
	sendMessageToServer(
		'workbench.eval',
		{
			code: code,
			clientID: clientID
		})
}

/**
 * External.
 *
 * Callback form: fun(object)
 */
exports.setMessageCallbackFun = function(fun)
{
	mMessageCallback = fun
}

/**
 * External.
 *
 * Callback form: fun(message)
 */
exports.setClientInfoCallbackFun = function(fun)
{
	mClientInfoCallback = fun
}

/**
 * External.
 *
 * Callback form: fun()
 */
exports.setReloadCallbackFun = function(fun)
{
	mReloadCallback = fun
}

/**
 * External.
 *
 * Callback form: fun(message)
 */
exports.setRequestConnectKeyCallbackFun = function(fun)
{
	mRequestConnectKeyCallback = fun
}

/**
 * External.
 */
exports.setRemoteServerURL = function(url)
{
	mRemoteServerURL = url
}

/**
 * External.
 */
exports.getSessionID = function()
{
	return mSessionID
}
