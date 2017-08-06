'use strict';

const TelegramBot = require('node-telegram-bot-api');
const firebase = require('firebase');

const token = '393816819:AAGkdhLXlAGZuiEdkS_Vu2Q9ksSIa1ZODO8';
const telegramUrl = 'https://api.telegram.org/bot' + token;

var config = {
    apiKey: "AIzaSyCcAB3EOoDogW32cRDeU9DU8T6SQWpxNyA",
    authDomain: "easyclassroombot.firebaseapp.com",
    databaseURL: "https://easyclassroombot.firebaseio.com",
    projectId: "easyclassroombot",
    storageBucket: "",
    messagingSenderId: "497477949051"
};

firebase.initializeApp(config);
let database = firebase.database();

const bot = new TelegramBot(token, { polling: true });

const dbEntities = {
    configuration: 'configuration/',
    users: 'users/',

    assistance: 'assistance/',
    courses: 'courses/',
    homework: 'homework/',
    students: 'students/',
    studentCourses: 'studentCourses/',
    studentHomeWork: 'studentHomeWork/',
    universities: 'universities/',
    universityCourses: 'universityCourses/',
};

const appStates = {
    START: '/start',

    STUDENT: {
        SIGN_IN: '/signIn',
        SIGN_IN_CONFIRMATION: '/signInConfirm',
        SET_CODE: '/setCode',
        SET_CODE_CONFIRMATION: '/setCodeConfirm',
        SET_EMAIL: '/setEmail',
    }
};

const inlineOptions = {
    inlineQueries: {
        SetStudentCode: 'STUDENT_CODE',
        SetStudentEmail: 'STUDENT_EMAIL',
        StudentConfirmSignIn: 'STUDENT_CONFIRM_SIGN_IN'
    }
};

let studentData;

bot.onText(/^\/start$/, (msg, match) => {

    let chatId = msg.chat.id;

    bot.sendMessage(chatId, `Hello dear student, <b>${msg.from.first_name}</b>, please run the command '/signIn' to continue`, {
        parse_mode: 'HTML'
    });

    database.ref(dbEntities.users + chatId).set({ state: appStates.START });

    populateUniversitiesData();
});

bot.onText(/^\/signIn$/, (msg, match) => {

    let chatId = msg.chat.id;

    studentData = {};

    getUserState(chatId).then(function(userState) {

            if (userState == appStates.START) {
                updateUserState(chatId, appStates.STUDENT.SIGN_IN);

                let message = `You must provide some <b>required information</b>, \n please select one of the options below`;
                bot.sendMessage(chatId, message, {
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [
                            [{
                                    text: 'Set student code',
                                    callback_data: inlineOptions.inlineQueries.SetStudentCode
                                },
                                {
                                    text: 'Set student email',
                                    callback_data: inlineOptions.inlineQueries.SetStudentEmail
                                }
                            ]
                        ]
                    }
                });
            }
        })
        .catch(console.error);;

});

bot.on('message', (msg) => {

    let chatId = msg.chat.id;

    getUserState(chatId).then(function(userState) {

        if (userState == appStates.STUDENT.SET_CODE) {
            studentData.code = msg.text;
            bot.sendMessage(chatId, "Please type your student code again");
            updateUserState(chatId, appStates.STUDENT.SET_CODE_CONFIRMATION);
            return;
        }
        if (userState == appStates.STUDENT.SET_CODE_CONFIRMATION) {

            if (studentData.code != msg.text) {
                bot.sendMessage(chatId, "The code does not match, please type the code again");
                return;
            }

            studentData.codeConfirmation = msg.text;

            if (!studentData.email) {
                updateUserState(chatId, appStates.STUDENT.SET_EMAIL);
                bot.sendMessage(chatId, "Now, please type your email");
                return;
            }

            confirmStudentSignInData(chatId);
        }

        if (userState == appStates.STUDENT.SET_EMAIL) {

            studentData.email = msg.text;

            if (!studentData.code) {
                updateUserState(chatId, appStates.STUDENT.SET_CODE);
            } else {
                confirmStudentSignInData(chatId);
            }

            return;
        }
    }).catch(console.error);
});

bot.on('callback_query', (msg) => {

    let chatId = msg.message.chat.id;
    let message = "";
    let messageOptions = {
        parse_mode: 'HTML'
    };

    if (msg.data == inlineOptions.inlineQueries.SetStudentCode) {
        updateUserState(chatId, appStates.STUDENT.SET_CODE);

        message = `<b>Please type your student code</b>, <i>eg. A1C2D41L</i>`;
        bot.sendMessage(chatId, message, messageOptions)
        return;
    }

    if (msg.data == inlineOptions.inlineQueries.SetStudentEmail) {

        updateUserState(chatId, appStates.STUDENT.SET_EMAIL);

        message = `<b>Please type your email</b>, <i>eg. email@domain.edu.co</i>`;
        bot.sendMessage(chatId, message, messageOptions)
        return;
    }

    if (msg.data = inlineOptions.inlineQueries.StudentConfirmSignIn) {

        signInStudent(chatId, studentData.code, studentData.email, "none")
            .then(function(result) {
                console.log(result);
                message = `Your user has been created successfully`;
                bot.sendMessage(chatId, message, messageOptions)
            })
            .catch(console.error);;

        updateUserState(chatId, appStates.START);

        return;
    }
});

function confirmStudentSignInData(chatId) {

    let message = `Please confirm the typed data: \n
    Code: ${studentData.code} \n,
    E-mail: ${studentData.email}`;

    const inlineKeyboardOptions = [{
            text: 'Confirm',
            callback_data: inlineOptions.inlineQueries.StudentConfirmSignIn
        },
        {
            text: 'Cancel',
            callback_data: appStates.STUDENT.SIGN_IN
        }
    ];

    bot.sendMessage(chatId, message, {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                inlineKeyboardOptions
            ]
        }
    });

    updateUserState(chatId, appStates.STUDENT.SIGN_IN_CONFIRMATION);
}

function signInStudent(userId, code, email, username) {
    return database.ref('students/' + userId).set({
        code,
        email,
        username
    });
}

function getUserState(userId) {
    return database.ref(dbEntities.users + userId).once('value')
        .then(function(snapshot) {
            return snapshot.val().state;
        })
        .catch(console.error);;
}

function validateStudentExists(userId) {
    return database.ref(dbEntities.students + userId).once('value')
        .then(function(snapshot) {
            console.log(snapshot.val());
            return snapshot.val();
        })
        .catch(console.error);;
}

function updateUserState(userId, appState) {
    database.ref(dbEntities.users + userId).set({ state: appState });
}

//DEVELOPMENT PURPOSES
function populateUniversitiesData() {

    let universities = [{
            name: "Universidad de Manizales"
        },
        {
            name: "Universidad Autónoma de Manizales"
        }
    ];

    universities.forEach(function(university, index) {
        database.ref('universities/' + index).set(university);
    }, this);
}