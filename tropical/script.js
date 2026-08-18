// Listen for an event called 'ZoomZccCobrowseSDK:Ready'.
// This event tells us when the Zoom CoBrowse SDK is ready to use.
window.addEventListener('ZoomZccCobrowseSDK:Ready', function(event) {

    // Find a button on the web page with the ID 'startCobrowseButton'.
    // This is the button that the user will click to start CoBrowse.
    const button = document.getElementById('startCobrowseButton'); // Your custom button ID


    // Check if the button actually exists on the page.
    if (button) {
        // If the button exists, make sure it is enabled.
        // This allows users to click it. 
        // 'button.disabled = false;' means the button can be clicked.
        button.disabled = false; 
        
         // When the button is clicked, we want to start CoBrowse.
        // We add a 'click event' to the button, which is a listener that
        // waits for the user to click it.
        button.addEventListener('click', function() {
            try {
              // When the button is clicked, we call the 'init()' function from Zoom CoBrowse SDK.
                // This function starts the CoBrowse session.
                window.ZoomZccCobrowseSDK.init();
            } catch (e) {
              // If there's an error while starting CoBrowse, we'll catch it here.
                // This 'catch' block will run if the CoBrowse SDK is not ready yet.
                // It will print a message to the console saying to try again later.
                console.log("ZoomZccCobrowseSDK is not ready, please try again later")
            }
        });
    }
});