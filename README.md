## What is minimail  

Minimail is an open source email client, backend-ed by [Emailbox](https://getemailbox.com), that is built using HTML, CSS, and Javascript. It has been tested on Android and iOS.  

Pull requests are welcome!  

## Current status 

[Download the Android APK on the Minimail site](http://minimail.getemailbox.com)  

Minimail is usable as a mobile email client at this point, but has many bugs and issues that need to be fixed. If you encounter an issue not already on GitHub Issues for this repository, please add it with as much info as possible!  

## Contents of this Repository  
Source for the minimail mobile email client. The app works in conjunction with a server-side component (receiving and sending emails, Push Notifications) and the Emailbox API (https://getemailbox.com/docs).  

## Requirements to run:  
- Android Phone running 2.2+ (not ready for Tablets) 

## Build Option 1: PhoneGap Build  
1. Fork this repo (optional)
1. Sign up for Adobe PhoneGap Build: http://build.phonegap.com/plans/free 
1. Create a new project in PhoneGap Build using your forked GitHub URL (or just the https url for this repo)  
1. Build the project, then download and install the created Android build (.ipk). Takes about 30 seconds. [Use a barcode scanner](https://play.google.com/store/apps/details?id=com.google.zxing.client.android&hl=en) for easy download! 

> **Note:** Push Notifications don't work when building locally. Working only on PhoneGap Build (actually, not even there yet)

## Design and Debugging  
Try out [debug.phonegap.com](http://debug.phonegap.com) (super buggy and slow, but a useful HTML view) or use minimail's CSS editor (under the developer/debug menu when using the server client). With minimail's CSS editor, you won't have to change any code to see your CSS updates live. 

## Server-side   
By default the basic server is used. If you want to run your own server:  

1. Register as an emailbox developer (https://getemailbox.com/login/first)
1. Follow instructions at repo: https://github.com/emailbox/minimail_nodeserver  

## App Todos
- Issues have been moved to GitHub's issue tracker: [https://github.com/emailbox/minimail_mobileapp/issues](https://github.com/emailbox/minimail_mobileapp/issues)


## FAQs  

### What is the plan for minimail?  
Minimail is a jumping off point for developers and designers to easily create their own personalized email clients. Minimail is a reference application, so you can see how it handles Contacts, Push Notifications, File Uploads, and more, do a Pull Request, and then improve upon the design or user experience. 

### Pricing and revenue-sharing thoughts? 
Minimail will eventually be a paid product/service, somewhere in the neighborhood of $10/mo per person. There are some plans for a free version, and an affiliate-like program will encourage developers to fork-build-host, then do marketing and collect revenue. 

### Lock-in, and Who Owns My Data?  
All your data is available, at any time, so you can easily export anything out of your Emailbox datastore.  
You may have the option of hosting your own data.  
Emailbox has no plans to do any data mining or selling of any kind of data and, if those plans change, existing users will not be switched over without them giving express permission to minimail/emailbox.  
Any changes to your original email or thread (read, starred, labels, etc.) are already synced back to Gmail, so switching back to (or between) another mail client has a minimal cost. 








