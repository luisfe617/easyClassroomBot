"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("../core");
var Student = (function () {
    function Student(telegramBot, database) {
        this.telegramBot = telegramBot;
        this.database = database;
    }
    /**
     * signInStudent
     */
    Student.prototype.signInStudent = function (chatId) {
        this.updateUserStateDB(chatId, core_1.Constants.AppStates.STUDENT.SIGN_IN);
        var message = "You must provide some <b>required information</b>, \n please select one of the options below";
        this.telegramBot.sendMessage(chatId, message, {
            reply_markup: {
                inline_keyboard: [
                    [{
                            text: 'Set student code',
                            callback_data: core_1.Constants.InlineQueries.STUDENT_QUERIES.SET_STUDENTCODE
                        },
                        {
                            text: 'Set student email',
                            callback_data: core_1.Constants.InlineQueries.STUDENT_QUERIES.SET_STUDENTEMAIL
                        }
                    ]
                ]
            },
            parse_mode: 'HTML'
        });
    };
    /**
     * studentOnMessageListener
     */
    Student.prototype.studentOnMessageListener = function (chatId, message, userState) {
        if (userState == core_1.Constants.AppStates.STUDENT.SET_CODE) {
            this.code = message.text;
            this.telegramBot.sendMessage(chatId, "Please type your student code again");
            this.updateUserStateDB(chatId, core_1.Constants.AppStates.STUDENT.SET_CODE_CONFIRMATION);
            return;
        }
        if (userState == core_1.Constants.AppStates.STUDENT.SET_CODE_CONFIRMATION) {
            if (this.code != message.text) {
                this.telegramBot.sendMessage(chatId, "The code does not match, please type the code again");
                return;
            }
            this.confirmationCode = message.text;
            if (!this.email) {
                this.updateUserStateDB(chatId, core_1.Constants.AppStates.STUDENT.SET_EMAIL);
                this.telegramBot.sendMessage(chatId, "Now, please type your email");
                return;
            }
            this.confirmStudentSignInData(chatId);
        }
        if (userState == core_1.Constants.AppStates.STUDENT.SET_EMAIL) {
            this.email = message.text;
            if (!this.code) {
                this.updateUserStateDB(chatId, core_1.Constants.AppStates.STUDENT.SET_CODE);
            }
            else {
                this.confirmStudentSignInData(chatId);
            }
            return;
        }
    };
    /**
     * studentCallbackQueriesListener
     */
    Student.prototype.studentCallbackQueriesListener = function (chatId, message) {
        console.log(message);
        if (message.data == core_1.Constants.InlineQueries.STUDENT_QUERIES.SET_STUDENTCODE) {
            this.setStudentCode(chatId);
            return;
        }
        if (message.data == core_1.Constants.InlineQueries.STUDENT_QUERIES.SET_STUDENTEMAIL) {
            this.setStudentEmail(chatId);
            return;
        }
        if (message.data = core_1.Constants.InlineQueries.STUDENT_QUERIES.SET_CONFIRMDATA) {
            this.setStudentData(chatId, message);
            return;
        }
    };
    Student.prototype.setStudentCode = function (chatId) {
        this.updateUserStateDB(chatId, core_1.Constants.AppStates.STUDENT.SET_CODE);
        var message = "<b>Please type your student code</b>, <i>eg. A1C2D41L</i>";
        this.telegramBot.sendMessage(chatId, message, { parse_mode: 'HTML' });
    };
    Student.prototype.setStudentEmail = function (chatId) {
        this.updateUserStateDB(chatId, core_1.Constants.AppStates.STUDENT.SET_EMAIL);
        var message = "<b>Please type your email</b>, <i>eg. email@domain.edu.co</i>";
        this.telegramBot.sendMessage(chatId, message, { parse_mode: 'HTML' });
    };
    Student.prototype.setStudentData = function (chatId, msg) {
        var _this = this;
        this.validateStudentExistsDB(chatId).then(function (value) {
            if (value) {
                _this.telegramBot.sendMessage(chatId, "This user is already registered");
            }
            else {
                var _self_1 = _this;
                var username = msg.message.chat.username;
                _this.addStudentDB(chatId, username)
                    .then(function (result) {
                    _self_1.telegramBot.sendMessage(chatId, "Your user has been created successfully");
                })
                    .catch(console.error);
            }
        }).catch(console.error);
        this.updateUserStateDB(chatId, core_1.Constants.AppStates.START);
    };
    Student.prototype.confirmStudentSignInData = function (chatId) {
        var message = "Please confirm the typed data:\n        Code: " + this.code + ",\n        E-mail: " + this.email;
        this.telegramBot.sendMessage(chatId, message, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [{
                            text: 'Confirm',
                            callback_data: core_1.Constants.InlineQueries.STUDENT_QUERIES.SET_CONFIRMDATA
                        }
                    ]
                ]
            }
        });
        this.updateUserStateDB(chatId, core_1.Constants.AppStates.STUDENT.SIGN_IN_CONFIRMATION);
    };
    //Firebase related methods
    Student.prototype.validateStudentExistsDB = function (chatId) {
        return this.database.ref(core_1.Constants.EntitiesDB.STUDENTS + chatId).once('value')
            .then(function (snapshot) {
            return snapshot.val();
        })
            .catch(console.error);
        ;
    };
    Student.prototype.addStudentDB = function (userId, username) {
        var code = this.code;
        var email = this.email;
        return this.database.ref(core_1.Constants.EntitiesDB.STUDENTS + userId).set({
            code: code,
            email: email,
            username: username
        });
    };
    Student.prototype.updateUserStateDB = function (chatId, appState) {
        this.database.ref(core_1.Constants.EntitiesDB.USERS + chatId).set({ state: appState });
    };
    return Student;
}());
exports.Student = Student;
//# sourceMappingURL=student.js.map