export namespace Constants {

    export const InlineQueries = {

        STUDENT_QUERIES: {
            SET_STUDENTCODE: 'SET_STUDENTCODE',
            SET_STUDENTEMAIL: 'SET_STUDENTEMAIL',
            SET_STUDENTDB: 'SET_STUDENTDB',
            SET_CONFIRMDATA: 'SET_CONFIRMDATA'
        },

        FIREBASE_QUERIES: {
            CM_GETDATAFROMFIREBASE: 'CM_GETDATAFROMFIREBASE'
        }

    }

    export const EntitiesDB = {
        ASSISTANCE: 'assistance/',
        CONFIGURATION: 'configuration/',
        COURSES: 'courses/',
        HOMEWORK: 'homework/',
        STUDENTS: 'students/',
        STUDENTCOURSES: 'studentCourses/',
        STUDENTHOMEWORK: 'studentHomeWork/',
        UNIVERSITIES: 'universities/',
        UNIVERSITYCOURSES: 'universityCourses/',
        USERS: 'users/'
    }

    export const AppStates = {
        START: '/start',
        CANCEL: '/cancel',

        STUDENT: {
            SIGN_IN: '/signIn',
            SIGN_IN_CONFIRMATION: '/signInConfirm',
            SET_CODE: '/setCode',
            SET_CODE_CONFIRMATION: '/setCodeConfirm',
            SET_EMAIL: '/setEmail'
        }
    }

}