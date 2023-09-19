import mongoose from "mongoose";



const appUserSchema = new mongoose.Schema({
    id: {
        type: 'string',
        require: true,
    },
    Firstname: {
        type: 'string',
        require: true,
    },
    Lastname: {
        type: 'string',
        require: true,
    },

    email: {
        type: 'string',
        require: true,
    },
    password: {

        type: 'string',
        require: true,
    },
    isVerified:{

        type: 'string',
        require: true,
    },
    ResetKey: {
        type: 'string',
        require: true,
    },
    Url: {
        type: 'string',
        require: true,
    },
    shortUrl: {
        type: 'string',
        require: true,
    },
    Urls: [{
        shortUrl : 'string',
         Url: 'string',
        createdAt: 'string',
        count:"string",
        Urlkey:'string'
    }
    ],
    dailyCount: {
        type: 'string',
        require: true,
    },

    monthlyCount: {
        type: 'string',
        require: true,
    }


});

export const AppUserModel = mongoose.model('app-users ', appUserSchema);
