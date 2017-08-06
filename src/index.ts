'use strict';

import TelegramBot = require("node-telegram-bot-api");
const firebase = require('firebase');

import { UtilsConstants } from './utils';
import { Constants as CoreConstants } from './core';

import { Student } from './students/student'

const token: string = process.env.TELEGRAM_TOKEN || UtilsConstants.TelegramToken;

const options = {
    polling: {
        polling: true
    },
    webHook: {
        port: process.env.PORT || 5000
    }
};

const messageOptions = {
    parse_mode: 'HTML'
};

firebase.initializeApp(UtilsConstants.FirebaseConfig);
let database = firebase.database();

const url: string = process.env.APP_URL || UtilsConstants.HerokuWebUrl;
const bot: TelegramBot = new TelegramBot(token, options.polling);

//bot.setWebHook(`${url}/bot${token}`);

let student: Student;

bot.onText(/^\/start$/, (msg, match) => {

    initializeApp();

    let chatId = msg.chat.id;

    bot.sendMessage(chatId, `Hello dear student, <b>${msg.from.first_name}</b>, please run the command '/signIn' to continue`, {
        parse_mode: 'HTML'
    });

    database.ref(CoreConstants.EntitiesDB.USERS + chatId).set({ state: CoreConstants.AppStates.START });
});

bot.onText(/^\/signIn$/, (msg, match) => {

    let chatId = msg.chat.id;

    getUserState(chatId).then(function (userState: any) {
        if (userState == CoreConstants.AppStates.START) {
            student.signInStudent(chatId);
        }
    }).catch(console.error);;

});

bot.on('message', (msg: any) => {

    let chatId = msg.chat.id;

    getUserState(chatId).then(function (userState: any) {
        student.studentOnMessageListener(chatId, msg, userState);
    }).catch(console.error);
});

bot.on('callback_query', (msg: any) => {
    let chatId = msg.message.chat.id;
    student.studentCallbackQueriesListener(chatId, msg);
});

function getUserState(userId: string) {
    return database.ref(CoreConstants.EntitiesDB.USERS + userId).once('value')
        .then(function (snapshot: any) {
            return snapshot.val().state;
        })
        .catch(console.error);;
}

function updateUserState(userId: string, appState: string) {
    database.ref(CoreConstants.EntitiesDB.USERS + userId).set({ state: appState });
}

function initializeApp() {
    student = new Student(bot, database);
}