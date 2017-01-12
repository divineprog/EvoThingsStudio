/*
File: main-window-events.js
Description: HyperReload UI events.
Author: Mikael Kindborg

License:

Copyright (c) 2013-2014 Mikael Kindborg

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

/*** Imported modules ***/

var SETTINGS = require('../settings/settings.js')
var MAIN = require('electron').remote.getGlobal('main');
var EVENTS = require('../server/system-events.js')
// Awful, but I am not sure how to get hold of the BrowserWindow.id otherwise
EVENTS.myID = MAIN.workbenchWindow.id
var USER_HANDLER = require('../server/user-handler.js')
var SERVER = require('../server/file-server.js')
const CLIPBOARD = require('electron').clipboard;

/**
 * Setup UI events and button actions.
 */
exports.defineUIEvents = function(hyper)
{
	var DISCONNECT_DELAY = 30000
	var mDisconnectTimer = 0

	// ************** Login Button **************

	hyper.UI.$('.button-do-login').click(function()
	{
		USER_HANDLER.doLogin()
	})

	// ************** Logout Button **************

	hyper.UI.$('.button-do-logout').click(function()
	{
		USER_HANDLER.doLogout()
	})

	// ************** Getting Started Screen Button **************

	hyper.UI.$('.button-getting-started').click(function()
	{
		hyper.UI.showTab('getting-started')
	})

	// ************** Open Settings Button **************

	hyper.UI.$('#button-open-settings-dialog').click(function()
	{
		hyper.UI.openSettingsDialog()
	})

	// ************** Settings Dialog Save Button **************

	hyper.UI.$('#button-save-settings').click(function()
	{
		hyper.UI.saveSettings()
	})

	// ************** Disconnect all Viewers **************

	hyper.UI.$('#button-disconnect-all-viewers').click(function()
	{
		hyper.UI.disconnectAllViewers()
	})

	// ************** Links to App Stores **************

	hyper.UI.$('.button-evothings-viewer-on-google-play').click(function()
	{
		hyper.UI.openInBrowser(
			'https://play.google.com/store/apps/details?id=' +
			'com.evothings.evothingsviewer&hl=en')
	})

	hyper.UI.$('.button-vscode').click(function()
	{
		hyper.UI.openInBrowser('https://code.visualstudio.com/')
	})


	hyper.UI.$('.button-evothings-viewer-on-itunes').click(function()
	{
		hyper.UI.openInBrowser(
			'https://itunes.apple.com/nz/app/evothings-viewer/id1029452707?mt=8')
	})

	// ************** Documentation Button **************

	hyper.UI.$('.button-documentation').click(function()
	{
		hyper.UI.openInBrowser(MAIN.DOC)
	})
	
	// ************** FAQ Button **************

	hyper.UI.$('.button-faq').click(function()
	{
		hyper.UI.openInBrowser(MAIN.DOC + '/faq/faq.html')
	})

	// ************** Release Notes Button **************

	hyper.UI.$('.button-release-notes').click(function()
	{
		hyper.UI.openInBrowser(MAIN.DOC + '/studio/release-notes.html')
	})

	// ************** Examples Documentation Button **************

	hyper.UI.$('.button-examples-documentation').click(function()
	{
		hyper.UI.openInBrowser(MAIN.DOC + '/examples/examples.html')
	})

	// ************** ECMAScript 6 Documentation Button **************

	hyper.UI.$('.button-ecmascript6-documentation').click(function()
	{
		hyper.UI.openInBrowser(MAIN.DOC + '/tutorials/ecmascript6.html')
	})
	
	// ************** Instrumentation Documentation Button **************

	hyper.UI.$('.button-instrumentation-documentation').click(function()
	{
		hyper.UI.openInBrowser(MAIN.DOC + '/tutorials/instrumentation.html')
	})

	// ************** Login Screen Button **************

	hyper.UI.$('#button-login, .button-open-login-screen').click(function()
	{
		hyper.UI.showTab('login')
	})

	// ************** Login Screen Toggle Help Button **************

	hyper.UI.$('.button-toggle-help').click(function()
	{
		hyper.UI.toogleStartScreenHelp()
	})

	// ************** Feedback Button **************

	hyper.UI.$('#button-feedback').click(function()
	{
		hyper.UI.openInBrowser('https://evothings.com/feedback/')
	})

	// ************** Chat Button **************

	hyper.UI.$('#button-chat').click(function()
	{
		hyper.UI.openInBrowser('https://gitter.im/evothings/evothings')
	})

	// ************** Share in Social Media Button **************

	hyper.UI.$('#button-share-social').click(function()
	{
		// hyper.UI.openInBrowser('https://evothings.com/share-social/')
		hyper.UI.$('#dialog-share-social').modal('show')
	})

	hyper.UI.$('#button-share-facebook').click(function()
	{
		hyper.UI.openInBrowser("http://www.facebook.com/sharer.php?u=https%3A%2F%2Fevothings.com")
	})

	hyper.UI.$('#button-share-google').click(function()
	{
		hyper.UI.openInBrowser("https://plus.google.com/share?url=https%3A%2F%2Fevothings.com")
	})

	hyper.UI.$('#button-share-linkedin').click(function()
	{
		hyper.UI.openInBrowser("https://www.linkedin.com/shareArticle?mini=true&url=https%3A%2F%2Fevothings.com&title=Evothings")
	})

	hyper.UI.$('#button-share-digg').click(function()
	{
		hyper.UI.openInBrowser("http://www.digg.com/submit?url=https%3A%2F%2Fevothings.com")
	})

	hyper.UI.$('#button-share-twitter-1').click(function()
	{
		openTwitter('#share-social-1')
	})

	hyper.UI.$('#button-share-twitter-2').click(function()
	{
		openTwitter('#share-social-2')
	})

	hyper.UI.$('#button-share-twitter-3').click(function()
	{
		openTwitter('#share-social-3')
	})

	hyper.UI.$('#button-share-twitter-4').click(function()
	{
		openTwitter('#share-social-4')
	})

	// Not used anymore
	hyper.UI.$('#button-copy-share-social-1').click(function()
	{
		copyElementTextToClipboard('#share-social-1')
	})

	function openTwitter(elementID)
	{
		var url = 'https://twitter.com/share?url=https%3A%2F%2Fevothings.com&text='
			+ hyper.UI.$(elementID).text().replace(/#/g, '%23')
		hyper.UI.openInBrowser(url)
	}

	function copyElementTextToClipboard(elementID)
	{
		copyToClipboard(hyper.UI.$(elementID).text())
	}

	function copyToClipboard(text)
	{
		CLIPBOARD.writeText(text, 'text')
	}

	// ************** Test-system-message Button **************

	hyper.UI.$('#button-test-system-message').click(function()
	{
		hyper.UI.testSystemMessage()
	})

	// ************** Getting Started Tab Button **************

	hyper.UI.$('#button-getting-started').click(function()
	{
		hyper.UI.showTab('getting-started')
	})

	// ************** News Tab Button **************

	hyper.UI.$('#button-news').click(function()
	{
		hyper.UI.showTab('news')
	})


	// ************** Examples Tab Button **************

	hyper.UI.$('#button-examples').click(function()
	{
		hyper.UI.showTab('examples')
	})

	// ************** Libraries Tab Button **************

	hyper.UI.$('#button-libraries').click(function()
	{
		hyper.UI.showTab('libraries')
	})

	// ************** My Apps Tab Button **************

	hyper.UI.$('#button-projects').click(function()
	{
		hyper.UI.showTab('projects')
	})

	// ************** Build Tab Button **************

	hyper.UI.$('#button-build').click(function()
	{
		hyper.UI.showTab('build')
	})

	// ************** New App Button **************

	hyper.UI.$('#button-new-app').click(function()
	{
		hyper.UI.openNewAppDialog()
	})
	
	// ************** New App Dialog Change Button **************

	hyper.UI.$('#button-change-new-app').click(function()
	{
		hyper.UI.changeNewApp()
	})

	// ************** New App Dialog Save Button **************

	hyper.UI.$('#button-save-new-app').click(function()
	{
		hyper.UI.saveNewApp()
	})

	// ************** Edit App Button **************

	hyper.UI.$('#button-config-app').click(function()
	{
		hyper.UI.openConfigAppDialog()
	})
	
	// ************** Edit App Dialog Save Button **************

	hyper.UI.$('#button-save-config-app').click(function()
	{
		hyper.UI.saveConfigApp()
	})

	// ************** Copy App Dialog Save Button **************

	hyper.UI.$('#button-save-copy-app').click(function()
	{
		hyper.UI.saveCopyApp()
	})
	
	// ************** Copy App Dialog Change Button **************

	hyper.UI.$('#button-change-copy-app').click(function()
	{
		hyper.UI.changeCopyApp()
	})

	// ************** Build App Dialog Save Button **************

	hyper.UI.$('#button-save-build-app').click(function()
	{
		hyper.UI.saveBuildApp()
	})
	

	// ************** Console Button **************

	hyper.UI.$('#button-tools').click(function()
	{
		hyper.UI.openConsoleWindow()
	})

	// ************** Viewers Button **************

	hyper.UI.$('#button-viewers').click(function()
	{
		hyper.UI.openViewersWindow()
	})

	// ************** Login Events **************

	EVENTS.subscribe(EVENTS.CONNECT, function(obj)
	{
		enableLoginButton()
	})

	EVENTS.subscribe(EVENTS.DISCONNECT, function(obj)
	{
		displayLoginButton()
		disableLoginButton()
	})

	EVENTS.subscribe(EVENTS.LOGIN, function(user)
	{
		console.log('[main-window-events.js] *** User has logged in: ' + user)
		console.dir(user)

		hideLoginScreen()
		showUserInfo(user)
	})

	EVENTS.subscribe(EVENTS.LOGOUT, function()
	{
		// TODO: Pass user id to the Run/Reload messaging code (file-server.js).
		console.log('[main-window-events.js] *** User has logged out ***')

		displayLoginButton()
	})

	// ************** Connect Events **************

	EVENTS.subscribe(EVENTS.CONNECT, function(obj)
	{
		console.log('[main-window-events.js] socket.io connect')
		if(mDisconnectTimer)
		{
			clearTimeout(mDisconnectTimer)
			mDisconnectTimer = undefined
		}
	})

	EVENTS.subscribe(EVENTS.DISCONNECT, function(obj)
	{
		console.log('[main-window-events.js] socket.io disconnect')
		mDisconnectTimer = setTimeout(
			function() 
			{
				// EMPTY
			},
			DISCONNECT_DELAY)
	})

	function showUserInfo(user)
	{
		if (user && user.name)
		{
			// Display user data.
			var picture = user.picture
			if(picture)
			{
				if (picture.indexOf('http') == -1)
				{
					picture = user.EVO_SERVER + '/' + user.picture
				}
			}
			else
			{
				picture = 'images/head.png'
			}
			// Show user picture on login button and change text to "Logout".
			var imageHTML =
				'<img style="height:30px;with:auto;margin-right:5px;margin-top:-3px" '
				+	'class="pull-left" '
				+	'src="' + picture + '">'
			var infoText = ' '+user.name
			var infoHTML = imageHTML + infoText
			hyper.UI.$('#login-info').html(infoHTML)
		}
		else
		{
			hyper.UI.$('#login-info').html('Could not log in')
		}
	}

	// ************** Tab Button Handling **************

	hyper.UI.showTab = function(tabname)
	{
		// We manually show/hide screens for tabs.
		
		// Hide all screens.
		hyper.UI.$('#screen-getting-started').hide()
		hyper.UI.$('#screen-news').hide()
		hyper.UI.$('#screen-login').hide()
		hyper.UI.$('#screen-examples').hide()
		hyper.UI.$('#screen-libraries').hide()
		hyper.UI.$('#screen-projects').hide()
		hyper.UI.$('#screen-build').hide()

		// Show selected tab and screen.
		var screenId = '#screen-' + tabname
		var buttonId = '#button-' + tabname
		$(buttonId).tab('show')
		hyper.UI.$(screenId).show()
		
		// If we show Examples, News or Libraries and they are empty - we try to update them silently
		if (tabname == 'examples' && hyper.UI.mExampleList.length == 0) {
		  hyper.UI.updateExampleList(true)
		}
		if (tabname == 'news' && hyper.UI.mNewsList.length == 0) {
		  hyper.UI.updateNewsList(true)
		}
		if (tabname == 'libraries' && hyper.UI.mLibraryList.length == 0) {
		  hyper.UI.updateLibraryList(true)
		}
	}

	// ************** No Client Connected Event **************

	// Called when you press Run and no client is connected.
	hyper.UI.noClientConnectedHandler = function()
	{
		/*
		 <div class="modal fade" id="ModalDialog-NoClientConnected" tabindex="-1" role="dialog" aria-labelledby="ModalDialog-NoClientConnected-Label" aria-hidden="true">
		 <div class="modal-dialog">
		 <div class="modal-content">
		 <div class="modal-header">
		 <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
		 <h4 class="modal-title" id="ModalDialog-NoClientConnected-Label">No Evothings Viewer app connected</h4>
		 </div>
		 <div class="modal-body">
		 Please connect from the Evothings Viewer</a> app on your mobile device(s). Learn more on the <a href="javascript:void(0)" id="ModalDialog-NoClientConnected-HelpLink">Getting Started screen</a>.
		 </div>
		 <div class="modal-footer">
		 <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
		 </div>
		 </div>
		 </div>
		 </div>
		 */
		//hyper.UI.$('#ModalDialog-NoClientConnected').modal('show')
		MAIN.openDialog(
			'No Evothings Viewer app connected',
			'Please connect from the Evothings Viewer app on your mobile device(s). Learn more on the Getting Started screen.'
		)
	}

	// Click handler for link in the ModalDialog-NoClientConnected dialog.
	hyper.UI.$('#ModalDialog-NoClientConnected-HelpLink').click(function()
	{
		// Hide modal dialog.
		hyper.UI.$('#ModalDialog-NoClientConnected').modal('hide')

		// Show Getting Started screen.
		hyper.UI.showTab('getting-started')
	})

	// ************** Additional event handlers **************

	EVENTS.subscribe(EVENTS.CONNECT, function(obj)
	{
		hyper.UI.displayConnectStatus('Connected')
	})

	EVENTS.subscribe(EVENTS.DISCONNECT, function(obj)
	{
		hyper.UI.displayConnectStatus('Disconnected')
	})

	EVENTS.subscribe(EVENTS.USERMESSAGE, function(message)
	{
		// Display a message for the user.
		hyper.UI.displaySystemMessage(message)
	})
}

