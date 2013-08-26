How to build Wine Box
========================

Wine Box is built using `Trigger.io <https://trigger.io>`_ and `Firebase <https://firebase.com>`_. You can `read more about the integration on our blog <http://trigger.io/cross-platform-application-development-blog/2012/06/19/easily-sync-data-between-your-mobile-and-web-apps-using-firebase-and-trigger-io/>`_.

Here are the steps to build and test this app on a Mac in the iOS emulator.

The steps to test on a Windows development machine, and with the app as a mobile web are similar and you can find more information here on `Getting started with Trigger.io <https://trigger.io/docs/current/getting_started/getting_started.html>`_.

Install the Trigger.io Toolkit
-------------------------------

1. Install the toolkit from https://trigger.io/forge/toolkit
2. Start the Toolkit and create an account
3. Create a new app and note the app directory

Getting the code
----------------

1. Open a terminal and navigate to your app directory.
2. Copy your identity.json file away and remove the template contents in the src directory:

   * cd src
   * mv identity.json ..
   * rm -rf *
   * rm .forgeignore

3. Checkout this repository and copy the identity.json file back:

   * git clone https://github.com/amirnathoo/Wine-Box .
   * cd ..
   * mv identity.json src/

Running the app
---------------

1. In the Toolkit, click on the app name, navigate to the 'Forge' option in the left-hand menu and click the 'iOS' button to run it. The first time this will take a minute or so, subsequent incremental builds will be very fast.

2. You'll see the full console output while Trigger.io performs the compile and then iPhone emulator will start up in a few seconds.

3. You can navigate back to the 'Forge' page and click the 'Web' button to also run the app as a mobile web app. In this way you can take photos and rate wine with the native iOS app, and see that reflected in the web app version demonstrating the synch capability of Firebase used inside the Trigger.io mobile app.

Testing the app
---------------

The app includes photo-taking functionality so to test that in the emulator, you need to have photos pre-loaded. Instructions on how to set that up are here:
http://stackoverflow.com/questions/468879/adding-images-to-iphone-simulator