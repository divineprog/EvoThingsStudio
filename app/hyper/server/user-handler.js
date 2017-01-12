/*
File: user-handler.js
Description: Handles login/logout of users.

License:

Copyright (c) 2013-2015 Evothings AB

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
/***	 Imported modules	  ***/
/*********************************/

var OS = require('os')
var FS = require('fs')
var PATH = require('path')
var IO = require('socket.io-client')
var SETTINGS = require('../settings/settings.js')
var SERVER = require('./file-server.js')
var EVENTS = require('./system-events.js')

/*********************************/
/***	 Module variables	  ***/
/*********************************/

var mUser = null
var mAuth0Lock = null

/*********************************/
/***		Functions		  ***/
/*********************************/

exports.doLogin = function()
{
	// Show auth0 UI
	if (!mAuth0Lock) 
	{ 
		mAuth0Lock = new hyper.UI.Auth0Lock(
			'ik5CtR3dBIIHPUvJ7pRK7lG6x2252FeB', 
			'mikael-evothings.eu.auth0.com',
			{ auth: { sso: false } })
	}
	
	mAuth0Lock.on('authenticated', function(authResult) 
	{
		console.log('authenticated')

		console.log('token: ' + authResult.accessToken)

		// sendLoginToServer(clientID, authResult.accessToken)

		lock.getProfile(authResult.idToken, function(error, profile)
		{
			if (error) 
			{
				// Handle error
				console.log('getProfile error: ' + error)
				return
			}
			//localStorage.setItem('id_token', authResult.idToken);
			// Display user information
			console.log('login ok')
			
			console.log('profile:')
			console.log(profile)
			console.log('authResult:')
			console.log(authResult)
			//getUserInfo(authResult.accessToken)

			});
		})

		mAuth0Lock.show()
}

/*
exports.setUser = function(uobj)
{
	console.log('[user-handler.js] LOGIN: setting user to "'+uobj.name+'"')
	console.log('[user-handler.js] LOGIN: Listing user object:')
	console.log(uobj)
	mUser = uobj
}

exports.clearUser = function()
{
	console.log('[user-handler.js] LOGIN:clearing user')
	mUser = undefined
}

// TODO: persist login?
// Get user info from server on startup?
exports.getUser = function()
{
	return mUser
}

exports.clearUser = function()
{
	mUser = undefined
}
*/

//EVENTS.publish(EVENTS.LOGOUT, {event: 'logout'})
//EVENTS.subscribe(EVENTS.LOGIN, exports.setUser)
//EVENTS.subscribe(EVENTS.LOGOUT, exports.clearUser)
