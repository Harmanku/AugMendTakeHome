import { createAuth0Client } from '@auth0/auth0-spa-js'

//Set up Auth0
let auth0Client = null;
//Can expose domain and clientId they aren't sensitive fields 
const domain = "dev-wqfko374upg0tprz.us.auth0.com"
const clientId = "HyXVNZdGh6hIf4xBSXqnMSjCxc6v4WVu"
const configureClient = async () => {
    auth0Client = await createAuth0Client({
        domain: domain,
        clientId:  clientId
    });
};

// Log-in and Log-out functions
const logout = () => {
    auth0Client.logout({
        logoutParams: {
            returnTo: window.location.origin
        }
    });
};

// Attach function to logout button
document.getElementById("btn-logout").addEventListener("click", logout)

const login = async () => {

    await auth0Client.loginWithRedirect({
        authorizationParams: {
            redirect_uri: window.location.origin
        }
    });
};

try {
    // On Window load check if user is logged in
    window.onload = async () => {
        await configureClient();
        const isAuthenticated = await auth0Client.isAuthenticated();

        //If user is not authenticated try to authenticate
        if (!isAuthenticated) {
            const query = window.location.search;

            //Check If the user just logged in
            if (query.includes("code=") && query.includes("state=")) {
                // Process the login state
                await auth0Client.handleRedirectCallback();

                // Use replaceState to redirect the user away and remove the querystring parameters
                window.history.replaceState({}, document.title, "/");
            } else {
                //the user is not logged in, push them to log in screen
                await login()
            }
        }

        // Now we know the user's state let's update UI
        updateUI()

    }
} catch (err) {
    alert("Something went wrong");
}


// Function that updates the UI after a change
const updateUI = async () => {
    // Let's get the user's authentication status
    const isAuthenticated = await auth0Client.isAuthenticated();

    document.getElementById("btn-logout").disabled = !isAuthenticated;


    if (isAuthenticated) {
        //If the user is authenticated then check if the user has already submitted a survey
        const user = await getUserByEmail((await auth0Client.getUser()).email)

        //If user has let's move him to display form
        if (user) {
            displayUserInfo();
            document.getElementById("surveySection").classList.add("hidden");
            document.getElementById("userInfoSection").classList.remove("hidden");
        } else { // If the user hasn't then let's keep him no the survey form
            document.getElementById("surveySection").classList.remove("hidden");
            document.getElementById("userInfoSection").classList.add("hidden");

        }

    } else {
        document.getElementById("userInfoSection").classList.add("hidden");
    }


};






const submitForm = async (event) => {
    event.preventDefault();


    if (validateForm()) {
        // Get the form data
        const formData = new FormData(document.getElementById("surveyForm"));

        // Convert the form data to an object
        const data = Object.fromEntries(formData);

        // Get all medication names and place them into an array
        const medicationInputs = document.querySelectorAll(
            '#medicationDetails input[name="medicationName[]"]'
        );
        const medicationNames = []
        for (let i = 0; i < medicationInputs.length; i++) {
            medicationNames.push(medicationInputs[i].value)
        }


        // Clean the data to match the schema from mongoose
        delete data["medicationName[]"]

        data["medicationNames"] = medicationNames;

        const loginEmail = (await auth0Client.getUser()).email

        data["loginEmail"] = loginEmail;
        if (!data.otherMaritalStatus) {
            data.otherMaritalStatus = ""
        }


        // Now let's try submitting
        try {
            //Use for production

            //const response = await fetch('http://localhost:3000/api/surveySubmit', {    
            const response = await fetch('https://augmendtakehome.onrender.com/api/surveySubmit', {

                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error('Failed to submit survey data');
            }

        } catch (error) {
            //Should add logic here that lets the user know why their form isn't being submitted
            alert("Something went wrong.");
        }
        updateUI()
    }
}
// Add submit logic to the form button
document.getElementById("surveyForm").addEventListener("submit", submitForm);

// Can add validation logic here
function validateForm() {
    return true;
}



// Logic to get the user's information based on the email they used for login. This will be unique.
const getUserByEmail = async (email) => {
    try {
        // Use for production
        // const response = await fetch(`http://localhost:3000/api/userByEmail?email=${email}`);


        const response = await fetch(`https://augmendtakehome.onrender.com/api/userByEmail?email=${email}`);
        if (!response.ok) {
            throw new Error('User not found');
        }
        const user = await response.json();

        return user
    } catch (error) {
        //Don't need to display errors because we can except there to not be a registered user yet
        return
    }
};



//Method to take the user data and display it
const displayUserInfo = async () => {

    const userEmail = (await auth0Client.getUser()).email;
    const userInfo = await getUserByEmail(userEmail);
    try {

        const name = userInfo.name;
        const email = userInfo.email;
        const age = userInfo.age
        const maritalStatus = userInfo.maritalStatus
        const otherMaritalStatus = userInfo.otherMaritalStatus
        const therapist = userInfo.therapist
        const medications = userInfo.medications
        const medicationNames = userInfo.medicationNames


        document.getElementById('nameInput').value = name;
        document.getElementById('emailInput').value = email;
        document.getElementById('ageInput').value = age;
        document.getElementById('maritalStatusInput').value = maritalStatus;
        if (otherMaritalStatus !== "") {
            document.getElementById('otherMaritalStatusInput').value = otherMaritalStatus;
        } else {
            document.getElementById('otherMaritalStatusField').classList.add("hidden")

        }

        document.getElementById('therapistInput').value = therapist;
        document.getElementById('medicationsReadOnly').value = medications;


        if (medications !== 'no') {
            const medicationsTagsContainer = document.getElementById('medicationsTags');

            medicationNames.forEach(medication => {
                const tag = document.createElement('span');
                tag.classList.add('tag', 'is-info', 'is-large');
                tag.textContent = medication;
                medicationsTagsContainer.appendChild(tag);
            });
        } else {
            document.getElementById("medicationsLabel").classList.add("hidden")
        }


    } catch (err) {
        //Can add more logic here for better error display
        alert("Something went wrong");
    }
}