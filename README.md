## What is minimail  

Minimail is an open source email client that is customizable using common web languages like HTML, CSS, and Javascript. It runs on Android, and it skips dealing with IMAP or managing the email sending/receiving/parsing hairyness.  

To try it out, just choose Option 1 (below) and you want to even write any code!. Or, you can just browse through the code on GitHub. If you want to run the server component as well, see "Server-side" below.  

Please fork and submit pull requests!  

## Current status 

Version: 0.1 aka extreme alpha  
It's alive! Minimail is usable as a mobile email client at this point (not just a prototype)! Sending and receiving both work, you can view Threads, create Leisure Filters, and search links/attachments/emails. Because Push Notifications are not yet functioning, I recommend continuing to use your existing mail app alongside minimail.    

Priorities include: 
- Refactor into correct Backbone patterns
- Build Web Client (framework has been started) 
- Full syncing with Gmail
- Instruction guide for web and mobile

If you encounter an issue not already on GitHub Issues for this repository, please add it with as much info as possible! 


## WHAT ABOUT SECURITY!?  
Don't use your main-email, work-email, or even affair-email with minimail. Not yet at least. Emailbox (the heavy-lifting backend behind minimail) isn't ready to safeguard your most important emails. Eventually you'll be able to do all kinds of own-my-data-and-encrypt-everything stuff, but for now, please only use a throw-away or junk account with minimail. 

## Contents of this Repository  
Source for the minimail mobile email client for Android. The app works in conjunction with a server-side component (receiving and sending emails, Push Notifications, leisure filters) and the Emailbox API (https://getemailbox.com/docs).  

## Requirements to run:  
- Android Phone running 2.2+ (CSS not optimized for Tablets) 

## Option 1: Build with PhoneGap Build (nothing to install)  
1. Fork this repo (optional)
1. Sign up for Adobe PhoneGap Build: http://build.phonegap.com/plans/free 
1. Create a new project in PhoneGap Build using your forked GitHub URL (or just the https url for this repo)  
1. Build the project, then download and install the created Android build (.ipk). Takes about 30 seconds. [Use a barcode scanner](https://play.google.com/store/apps/details?id=com.google.zxing.client.android&hl=en) for easy download! 

> **Note:** Push Notifications don't work when building locally. Working only on PhoneGap Build (actually, not even there yet)

## Design and Debugging  
Try out [debug.phonegap.com](http://debug.phonegap.com) (super buggy and slow, but a useful HTML view) or use minimail's CSS editor (under the developer/debug menu when using the server client). With minimail's CSS editor, you won't have to change any code to see your CSS updates live. 

## Server-side   
By default the basic minimail server is used. If you want to run your own server:  

1. Register as an emailbox developer (https://getemailbox.com/login/first)  
1. Follow instructions at repo: https://github.com/emailbox/minimail_nodeserver  
1. Change the value for `minimail_server` in `creds.json` in the mobile app to use your server (usually on heroku). 

## App Todos
- Issues have been moved to GitHub's issue tracker: [https://github.com/emailbox/minimail_mobileapp/issues](https://github.com/emailbox/minimail_mobileapp/issues)
- switch to Require.js, Component, Browserify, etc. (easier plugins)
- Push Notifications
- Camera and File Upload (emailbox file api)
- CSS scheme (color, positioning, dimensions) 
- Additional phones/platforms (per-dimensions/responsive css w/ defaults) 

## Build Todos:
- Tests  
- Build for iPhone  

## How to build (coming soon):  
1. Download the Android SDK tools (adt-bundle) 
1. Configure Eclipse IDE and ADT Plugin (download from one place)  
1. Run `./create <path> <com.name> <app_name>`  
1. Clone minimail app and overwrite files in created directory  
1. Create Android project  
1. Build and Run on your phone  
1. (add Support Library to project by right-click Android Tools -> Add...)
