Preview Video: [https://www.youtube.com/watch?v=ffkQQiBacl8](https://www.youtube.com/watch?v=ffkQQiBacl8) 

![image](https://s3.amazonaws.com/emailboxv1/phone_table1.png)

If you're curious about minimail and want to get involved, send me an email: nick@getemailbox.com  

## What is minimail  

Minimail is an open source email client, made possible by [Emailbox](https://getemailbox.com), that is customizable using common web languages like HTML, CSS, and Javascript. It runs on Android and iOS (waiting on PhoneGap Windows Phone support), and it skips dealing with IMAP or managing the email sending/receiving/parsing hairyness.  

> **minimail is currently in an open developer preview. Some features are missing, and many things will change. The database is wiped frequently. Don't use this for production. If you do start using it, you'll probably want to email nick@getemailbox.com and say "hello"**

To try it out, just follow the instructions below and you don't even have to write any code!. Or, you can just browse through the code on GitHub. If you want to run the server component as well, see "Server-side" below.  

Please fork and submit pull requests!  

## Current status 

Version: 0.1 aka Extreme Alpha  
It's alive! Minimail is usable as a mobile email client at this point (not just a prototype)! Sending and receiving both work, you can view Threads, create Leisure Filters, and search links/attachments/emails. Push Notifications work only when using Phonegap Build.  

> Important Note: This is a pre-release, pre-stable version of Emailbox, and developers are encouraged to not use their primary email address! 

Priorities include: 
- Refactor into correct Backbone patterns
- Build Web Client (framework has been started) 
- Full syncing with Gmail
- Instruction guide for web and mobile

If you encounter an issue not already on GitHub Issues for this repository, please add it with as much info as possible! 

## Contents of this Repository  
Source for the minimail mobile email client for Android. The app works in conjunction with a server-side component (receiving and sending emails, Push Notifications, leisure filters) and the Emailbox API (https://getemailbox.com/docs).  

## Requirements to run:  
- Android Phone running 2.2+ (CSS not optimized for Tablets) 

## Build Option 1: Hello PhoneGap Build (nothing to install)  
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
- Camera and File Upload (emailbox file api)
- CSS scheme (color, positioning, dimensions) 
- Additional phones/platforms (per-dimensions/responsive css w/ defaults) 

## How to build on Android (incomplete):  
1. Download the Android SDK tools (adt-bundle) 
1. Configure Eclipse IDE and ADT Plugin (download from one place)  
1. Run `./create <path> <com.name> <app_name>`  
1. Clone minimail app and overwrite files in created directory  
1. Create Android project  
1. Build and Run on your phone  
1. (add Support Library to project by right-click Android Tools -> Add...)


## FAQs  

### Is this your first Backbone.js application?  
Yes, is it that obvious? I'm fully aware that I'm using Models/Collections about as well as a baby with scissors, and I'll be refactoring it before any stable release.  

### What is the plan for minimail?  
I want minimail to be a jumping off point for developers and designers to easily create their own personalized email clients. Minimail is a reference application, so you can see how it handles Contacts, Push Notifications, File Uploads, and more, do a Pull Request, and then improve upon the design or user experience. 

### Pricing and revenue-sharing thoughts? 
Minimail will eventually be a paid product/service, somewhere in the neighborhood of $10/mo per person. There are no plans for a free version, but some affiliate-like program will encourage developers to fork-build-host, then do marketing and collect revenue. 

### Lock-in, and Who Owns My Data?  
All your data is available, at any time, so you can easily export anything out of your Emailbox datastore.  
You will have the option of hosting your own data.  
Emailbox has no plans to do any data mining or selling of any kind of data and, if those plans change, existing users will not be switched over without them giving express permission to minimail/emailbox.  
Any changes to your original email or thread (read, starred, labels, etc.) are already synced back to Gmail, so switching back to (or between) another mail client requires no effort. 








