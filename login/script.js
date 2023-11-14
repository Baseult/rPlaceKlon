function switchForm(formId) {
    const forms = document.querySelectorAll('.form-container form');
    const tabs = document.querySelectorAll('.tab');

    forms.forEach(form => form.classList.remove('active-form'));
    tabs.forEach(tab => tab.classList.remove('active'));

    document.getElementById(formId).classList.add('active-form');
    const activeTab = Array.from(tabs).find(tab => tab.getAttribute('onclick').includes(formId));
    activeTab.classList.add('active');
}

document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("loginForm");
    const formcontainer = document.querySelector(".form-container");
    const message = document.getElementById("message");
    const messagecontainer = document.querySelector(".message-container");

    loginForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const formData = new FormData(loginForm);
        const urlSearchParams = new URLSearchParams(formData);

        // Append the login parameter
        urlSearchParams.append("login", "");

        const urlEncodedData = urlSearchParams.toString();

        fetch("login.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: urlEncodedData,
        })
            .then(response => response.text())
            .then(data => {
                console.log(data);
                message.textContent = data;
                message.style.whiteSpace = "pre-line";

                formcontainer.classList.remove("success-glow", "failure-glow");

                if (data.includes("Login erfolgreich!")) {
                    messagecontainer.style.display = 'none';
                    formcontainer.classList.add("success-glow");
                    success();
                } else {
                    messagecontainer.style.display = 'block';
                    formcontainer.classList.add("failure-glow");
                }
            })
            .catch(error => {
                console.error("Error:", error);
            });
    });
});



document.addEventListener("DOMContentLoaded", function () {
    const registerForm = document.getElementById("registerForm");
    const formcontainer = document.querySelector(".form-container");
    const message = document.getElementById("message");
    const messagecontainer = document.querySelector(".message-container");

    registerForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const formData = new FormData(registerForm);
        const urlSearchParams = new URLSearchParams(formData);

        urlSearchParams.append("register", "");

        const urlEncodedData = urlSearchParams.toString();

        fetch("register.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: urlEncodedData,
        })
            .then(response => response.text())
            .then(data => {
                console.log(data);
                message.textContent = data;
                message.style.whiteSpace = "pre-line";

                formcontainer.classList.remove("success-glow", "failure-glow");

                if (data.includes("Registrierung erfolgreich!")) {
                    messagecontainer.style.display = 'none';
                    formcontainer.classList.add("success-glow");
                    success();
                } else {
                    messagecontainer.style.display = 'block';
                    formcontainer.classList.add("failure-glow");
                }
            })
            .catch(error => {
                console.error("Error:", error);
            });
    });
});


function success () {
    openBox();
    hideMain();
    showGame();
    hide_video();
    hide_particle();

    setTimeout(() => {
        document.getElementById('loadingOverlay').style.display = 'block';
        document.getElementById('loadingOverlay').style.opacity = '0';
    }, 1600);

    setTimeout(() => {
        document.getElementById('loadingOverlay').style.opacity = '1';
    }, 1700);

    setTimeout(() => {
        window.location.href = "http://127.0.0.1:3000";
    }, 3100);
}

function openBox() {
    const boxObject = document.querySelector('.box-object');
    const boxObjectInnerBorder = boxObject.querySelector('.box-object-inner-border');
    boxObject.classList.remove('box-to-romb');
    boxObject.classList.remove('box-to-romb-final');
    boxObject.classList.add('box-to-romb-success');
    boxObjectInnerBorder.classList.remove('border-animation-4');
    boxObjectInnerBorder.classList.add('border-animation-2');
}

function hideMain() {
    const boxObject = document.querySelector('.box-object');
    const mainSectionElements = document.querySelector('.form-container');
    mainSectionElements.classList.remove('show-effect');
    mainSectionElements.classList.add('hide-effect');
}

function showGame() {
    const gameSectionElements = document.getElementById('game-area');
    gameSectionElements.classList.remove('hide-effect');
    gameSectionElements.classList.add('show-effect');
    setTimeout(function () {
    }, 100);
}

function hide_video() {
    setTimeout(() => {
        let embed1 = document.querySelector(".bgvideo");
        let embed2 = document.querySelector(".background");
        embed1.remove();
        embed2.remove();
    }, 3000);
}

function hide_particle() {
    setTimeout(() => {
        // Get the parent element of the element to be replaced
        const parentElement = document.getElementById('particles-js');

        if (parentElement) {
            parentElement.remove();
        }

    }, 3000);
}
