import TelegramBot = require("node-telegram-bot-api");

import {
    Constants as CoreConstants,
    IStudent
} from '../core'

export class Student implements IStudent {

    constructor(telegramBot: TelegramBot, database: any) {
        this.telegramBot = telegramBot;
        this.database = database;
    }

    private telegramBot: TelegramBot;
    private database: any;

    public code: string;
    public confirmationCode: string;
    public email: string;
    public username: string;

    /**
     * signInStudent
     */
    public signInStudent(chatId: string) {
        this.updateUserStateDB(chatId, CoreConstants.AppStates.STUDENT.SIGN_IN);

        let message = `You must provide some <b>required information</b>, \n please select one of the options below`;
        this.telegramBot.sendMessage(chatId, message, {
            reply_markup: {
                inline_keyboard: [
                    [{
                        text: 'Set student code',
                        callback_data: CoreConstants.InlineQueries.STUDENT_QUERIES.SET_STUDENTCODE
                    },
                    {
                        text: 'Set student email',
                        callback_data: CoreConstants.InlineQueries.STUDENT_QUERIES.SET_STUDENTEMAIL
                    }
                    ]
                ]
            },
            parse_mode: 'HTML'
        });
    }

    /**
     * studentOnMessageListener
     */
    public studentOnMessageListener(chatId: string, message: any, userState: string) {

        if (userState == CoreConstants.AppStates.STUDENT.SET_CODE) {
            this.code = message.text;
            this.telegramBot.sendMessage(chatId, "Please type your student code again");
            this.updateUserStateDB(chatId, CoreConstants.AppStates.STUDENT.SET_CODE_CONFIRMATION);
            return;
        }

        if (userState == CoreConstants.AppStates.STUDENT.SET_CODE_CONFIRMATION) {

            if (this.code != message.text) {
                this.telegramBot.sendMessage(chatId, "The code does not match, please type the code again");
                return;
            }

            this.confirmationCode = message.text;

            if (!this.email) {
                this.updateUserStateDB(chatId, CoreConstants.AppStates.STUDENT.SET_EMAIL);
                this.telegramBot.sendMessage(chatId, "Now, please type your email");
                return;
            }

            this.confirmStudentSignInData(chatId)
        }

        if (userState == CoreConstants.AppStates.STUDENT.SET_EMAIL) {

            this.email = message.text;

            if (!this.code) {
                this.updateUserStateDB(chatId, CoreConstants.AppStates.STUDENT.SET_CODE);
            } else {
                this.confirmStudentSignInData(chatId)
            }

            return;
        }
    }

    /**
     * studentCallbackQueriesListener
     */
    public studentCallbackQueriesListener(chatId: string, message: any) {

        if (message.data == CoreConstants.InlineQueries.STUDENT_QUERIES.SET_STUDENTCODE) {
            this.setStudentCode(chatId);
            return;
        }

        if (message.data == CoreConstants.InlineQueries.STUDENT_QUERIES.SET_STUDENTEMAIL) {
            this.setStudentEmail(chatId);
            return;            
        }

        if (message.data = CoreConstants.InlineQueries.STUDENT_QUERIES.SET_CONFIRMDATA) {
            this.setStudentData(chatId, message);
            return;            
        }
    }

    private setStudentCode(chatId: string) {
        this.updateUserStateDB(chatId, CoreConstants.AppStates.STUDENT.SET_CODE);
        let message = `<b>Please type your student code</b>, <i>eg. A1C2D41L</i>`;
        this.telegramBot.sendMessage(chatId, message, { parse_mode: 'HTML' });
    }

    private setStudentEmail(chatId: string) {
        this.updateUserStateDB(chatId, CoreConstants.AppStates.STUDENT.SET_EMAIL);
        let message = `<b>Please type your email</b>, <i>eg. email@domain.edu.co</i>`;
        this.telegramBot.sendMessage(chatId, message, { parse_mode: 'HTML' });
    }

    private setStudentData(chatId: string, msg: any) {

        this.validateStudentExistsDB(chatId).then((value: any) => {

            if (value) {
                this.telegramBot.sendMessage(chatId, "This user is already registered");
            } else {

                let _self = this;
                let username: string = msg.message.chat.username;

                this.addStudentDB(chatId, username)
                    .then(function (result: any) {
                        _self.telegramBot.sendMessage(chatId, "Your user has been created successfully")
                    })
                    .catch(console.error);
            }

        }).catch(console.error);

        this.updateUserStateDB(chatId, CoreConstants.AppStates.START);
    }

    private confirmStudentSignInData(chatId: string) {
        let message = `Please confirm the typed data:
        Code: ${this.code},
        E-mail: ${this.email}`;

        this.telegramBot.sendMessage(chatId, message, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [{
                        text: 'Confirm',
                        callback_data: CoreConstants.InlineQueries.STUDENT_QUERIES.SET_CONFIRMDATA
                    }
                    ]
                ]
            }
        });

        this.updateUserStateDB(chatId, CoreConstants.AppStates.STUDENT.SIGN_IN_CONFIRMATION);
    }

    //Firebase related methods
    private validateStudentExistsDB(chatId: string) {
        return this.database.ref(CoreConstants.EntitiesDB.STUDENTS + chatId).once('value')
            .then(function (snapshot: any) {
                return snapshot.val();
            })
            .catch(console.error);;
    }

    private addStudentDB(userId: string, username: string) {

        let code = this.code;
        let email = this.email;

        return this.database.ref(CoreConstants.EntitiesDB.STUDENTS + userId).set({
            code,
            email,
            username
        });
    }

    private updateUserStateDB(chatId: string, appState: string) {
        this.database.ref(CoreConstants.EntitiesDB.USERS + chatId).set({ state: appState });
    }
}
