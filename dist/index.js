'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var TelegramBot = require("node-telegram-bot-api");
var firebase = require('firebase');
var utils_1 = require("./utils");
var core_1 = require("./core");
var student_1 = require("./students/student");
var token = process.env.TELEGRAM_TOKEN || utils_1.UtilsConstants.TelegramToken;
var options = {
    polling: {
        polling: true
    },
    webHook: {
        port: process.env.PORT || 5000
    }
};
var messageOptions = {
    parse_mode: 'HTML'
};
firebase.initializeApp(utils_1.UtilsConstants.FirebaseConfig);
var database = firebase.database();
var url = process.env.APP_URL || utils_1.UtilsConstants.HerokuWebUrl;
var bot = new TelegramBot(token, options.polling);
//bot.setWebHook(`${url}/bot${token}`);
var student;
bot.onText(/^\/start$/, function (msg, match) {
    initializeApp();
    var chatId = msg.chat.id;
    bot.sendMessage(chatId, "Hello dear student, <b>" + msg.from.first_name + "</b>, please run the command '/signIn' to continue", {
        parse_mode: 'HTML'
    });
    database.ref(core_1.Constants.EntitiesDB.USERS + chatId).set({ state: core_1.Constants.AppStates.START });
});
bot.onText(/^\/signIn$/, function (msg, match) {
    var chatId = msg.chat.id;
    getUserState(chatId).then(function (userState) {
        if (userState == core_1.Constants.AppStates.START) {
            student.signInStudent(chatId);
        }
    }).catch(console.error);
    ;
});
bot.on('message', function (msg) {
    var chatId = msg.chat.id;
    getUserState(chatId).then(function (userState) {
        student.studentOnMessageListener(chatId, msg, userState);
    }).catch(console.error);
});
bot.on('callback_query', function (msg) {
    var chatId = msg.message.chat.id;
    student.studentCallbackQueriesListener(chatId, msg);
});
function getUserState(userId) {
    return database.ref(core_1.Constants.EntitiesDB.USERS + userId).once('value')
        .then(function (snapshot) {
        return snapshot.val().state;
    })
        .catch(console.error);
    ;
}
function updateUserState(userId, appState) {
    database.ref(core_1.Constants.EntitiesDB.USERS + userId).set({ state: appState });
}
function initializeApp() {
    student = new student_1.Student(bot, database);
}
//# sourceMappingURL=index.js.map