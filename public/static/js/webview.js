"use strict";

Telegram.WebApp.ready();
const mainButton = Telegram.WebApp.MainButton;
const loginRegEx = /^20[2-9]\d\w*.\w{2}$/;

mainButton
    .setParams({
        is_active: true,
        is_visible: true,
        text: "Proceed",
        color: Telegram.WebApp.colorScheme === "dark" ? "#1A73E8" : "#008fee",
    })
    .onClick(toggleMainButton)
    .show();

function displayErr(text) {
    const status = document.getElementById("status");
    status.classList.add("shown");
    status.innerHTML = text;
    setTimeout(() => {
        status.classList.remove("shown");
    }, 2500);
}

function toggleMainButton() {
    mainButton.showProgress();
    let login = document.getElementById("login").value;
    let password = document.getElementById("password").value;

    if (login === "") {
        Telegram.WebApp.notificationOccurred("error");
        displayErr("Login not specified");
        mainButton.hideProgress();
    } else if (password === "") {
        displayErr("Password not specified");
        mainButton.hideProgress();
    } else if (!loginRegEx.test(login)) {
        displayErr("Please enter a valid login");
        mainButton.hideProgress();
    } else {
        updateData(login, password);
    }
}

function updateData(login, password) {
    Telegram.WebApp.enableClosingConfirmation();
    let token
    let studentID

    try {
        token = obtainToken(login, password);
    } catch (err) {
        console.log(err.message);
        displayErr(err.message);
        popupErr(err.message);
        mainButton.hideProgress();
        Telegram.WebApp.disableClosingConfirmation();
        return
    }

    try {
        studentID = obtainStudentID(token);
    } catch (err) {
        console.log(err.message);
        displayErr(err.message);
        popupErr(err.message);
        mainButton.hideProgress();
        Telegram.WebApp.disableClosingConfirmation();
        return
    }

    Telegram.WebApp.sendData(JSON.stringify({
        "login": login,
        "password": password,
        "studentID": studentID,
        "token": token,
    }));
    mainButton.hideProgress();
    Telegram.WebApp.disableClosingConfirmation();
}

function obtainToken(login, password) {
    let xhr = new XMLHttpRequest();
    xhr.open("POST", "https://s-api.letovo.ru/api/login", false);
    xhr.setRequestHeader("Content-Type", "application/json;charset=utf-8");
    xhr.send(JSON.stringify({
        "login": login,
        "password": password,
    }));

    if (xhr.status === 200) {
        let resp = JSON.parse(xhr.responseText);
        return `${resp["data"]["token_type"]} ${resp["data"]["token"]}`
    } else if (xhr.status === 401) {
        throw new Error("Wrong credentials or account blocked");
    } else {
        throw new Error("s.letovo.ru says: Error " + xhr.status);
    }
}

function obtainStudentID(token) {
    let xhr = new XMLHttpRequest();
    xhr.open("POST", "https://s-api.letovo.ru/api/me", false);
    xhr.setRequestHeader("Authorization", token);
    xhr.send();

    if (xhr.status === 200) {
        return JSON.parse(xhr.responseText)["data"]["user"]["student_id"]
    } else {
        throw new Error("s.letovo.ru says: Error " + xhr.status);
    }
}

function popupErr(message) {
    try {
        Telegram.WebApp.showPopup({
            "title": "Error occurred",
            "message": message,
            "buttons": [{"type": "ok"},],
        });
    } catch (err) {
        console.log(err.message);
    }
}