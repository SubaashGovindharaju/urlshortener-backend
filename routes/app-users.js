import express from 'express';
import { AppUserModel } from '../db-utils/module.js';
import { v4 } from 'uuid';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { mailOptions, transporter } from './mail.js';
const authRouter = express.Router();

authRouter.post('/register', async (req, res) => {

    try {
        const payload = req.body;
        const appUser = await AppUserModel.findOne({ email: payload.email }, { id: 1, Firstname: 1, Lastname:1,email: 1, _id: 0 });
        if (appUser) {
            res.status(409).send({ msg: 'user already exits' });
            return;
        }
        // hashing the password for storing in db
        bcrypt.hash(payload.password, 10, async function (err, hash) {
            if (err) {
                res.status(500).send({ msg: 'Error in registring' });
                return;
            }
            const authuser = new AppUserModel({ ...payload, password: hash, id: v4(), isVerified: false });
            await authuser.save();
        })
        res.send({ msg: 'user register successfully ' });
    } catch (err) {
        console.log(err);
        res.status(500).send({ msg: 'Error in creating' })
    }

});

authRouter.post('/regmail', async function (req, res) {
    try {
        const resetKey = crypto.randomBytes(32).toString('hex');
        const payload = req.body;
        const appUser = await AppUserModel.findOne({ email: payload.email }, { name: 1, email: 1, _id: 0 });
        const cloudUser = await AppUserModel.updateOne({ email: payload.email }, { '$set': { ResetKey: resetKey } });
        if (appUser) {
            const responceObj = appUser.toObject();
            const link = `${process.env.FRONTEND_twostep}/?reset=${resetKey}`
            console.log(link)
            await transporter.sendMail({ ...mailOptions, to: payload.email, text: `Click this link to activate the account ${link} ` });
            res.send({ responceObj, msg: 'user updated ' });
        }
        else {
            res.status(404).send({ msg: 'user not found' });
        }
    }
    catch (err) {
        console.log(err);
    }
});



authRouter.get('/dashboard/:email', async function (req, res) {
    try {
        const email = req.params.email;
        const appUser = await AppUserModel.findOne({ email });
        res.send(appUser);
    } catch (err) {
        console.log(err);
        res.status(500).send({ msg: 'Error occuerred while fetching users' });
    }
});

// authRouter.get('/dashboard', async function (req, res) {
//     console.log("132");
//     try {
//         const payload = req.body;
//         const appUser = await AppUserModel.findOne({ email: payload.email}, { Url:1,shortUrl: 1, _id: 0 });
//         res.send(appUser);
//     } catch (err) {
//         console.log(err);
//         res.status(500).send({ msg: 'Error occuerred while fetching users' });
//     }
// });


authRouter.post('/login', async function (req, res) {
    try {
        const payload = req.body;
        const appUser = await AppUserModel.findOne({ email: payload.email }, { id: 1, name: 1, email: 1, password: 1, isVerified:1,  _id: 0 });

        console.log(appUser.isVerified);
         const verify =appUser.isVerified;
        const hash = appUser.password
        const userpassword = payload.password
        // console.log(appUser);
        // console.log(appUser.password);
        // console.log(payload.password);


        if (verify==="true" && appUser!=="null" ) {
            
           const app=  bcrypt.compare(userpassword,hash, (err, result) => {
                console.log(result);
                if (result) {
                    const responceObj = appUser.toObject();
                    delete responceObj.password;
                    res.send(responceObj);
                   
                } else {
                    res.status(401).send({ msg: "invalid credentials" });
                }
            })
           
        }
        else {
            res.status(405 ).send({ msg: 'Not activated' });
        }
    }
    catch (err) {
        console.log(err);
        res.status(404).send({ msg: 'user not found' });
    }
});


authRouter.post('/password', async function (req, res) {
    try {
        const resetKey = crypto.randomBytes(32).toString('hex');
        const payload = req.body;
        const appUser = await AppUserModel.findOne({ email: payload.email }, { name: 1, email: 1, _id: 0 });
        const cloudUser = await AppUserModel.updateOne({ email: payload.email }, { '$set': { ResetKey: resetKey } });
        if (appUser) {
            const responceObj = appUser.toObject();
            const link = `${process.env.FRONTEND_URL}/?reset=${resetKey}`
            console.log(link)
            await transporter.sendMail({ ...mailOptions, to: payload.email, text: `Click this link to verify the EmailId  ${link} ` });
            res.send({ responceObj, msg: 'user updated ' });
        }
        else {
            res.status(404).send({ msg: 'user not found' });
        }
    }
    catch (err) {
        console.log(err);
    }
});

authRouter.put('/validate', async function (req, res) {
    const payload = req.body;
    try {
        const cloudUser = await AppUserModel.updateOne({ ResetKey: payload.resetKey }, {  isVerified: payload.isVerified } );
        const appUser = await AppUserModel.findOne({ ResetKey: payload.resetKey }, {isVerified:1,ResetKey: 1, _id: 0 });
        

        if (!appUser) {
            res.status(404).send({ msg: 'key not found' });
            console.log("payload");
        } else {
            if (payload.resetKey === appUser.ResetKey && payload.code==="1") {
                console.log("true");
                res.send("true");
            } else
            if(payload.resetKey === appUser.ResetKey) {
                console.log("true");
                res.send("true");
            }
            else{
                console.log("false");
                res.send("false");
        }
        }
    } catch {
        res.status(404).send({ msg: 'user not found 123' });
    }
})


authRouter.put('/reset', async function (req, res) {
    const payload = req.body;
    try {
        // hashing the password for storing in db
        bcrypt.hash(payload.password, 10, async function (err, hash) {
            if (err) {
                res.status(400).send({ msg: 'Error in reseting' });
                return;
            }
            await AppUserModel.updateOne({ email: payload.email }, { '$set': { password: hash } });
            res.send({ msg: 'user updated ' });
        })
    } catch (err) {
        console.log(err);
        res.status(500).send({ msg: 'Error in updating' })
    }
});

authRouter.put('/sendurl', async function (req, res) {
    const payload = req.body;
    console.log(payload)

    const resetKey = crypto.randomBytes(4).toString('hex');
    try {
        const url = await AppUserModel.updateOne({ email: payload.email },
            { '$set': { Url: payload.Url } });
        // console.log(url)
        if (!url) {
            res.status(404).send({ msg: 'user not found' });
        } else {
            const link = `${process.env.FRONTEND_CheckURL}/?reset=${resetKey}`
                  await AppUserModel.updateOne({ email: payload.email }, {
                "$set": { shortUrl: link }, $push: {
                    Urls: [{
                        Url: payload.Url,
                        shortUrl: link,
                        createdAt: payload.createdAt,
                        Urlkey: resetKey,
                        count:"0"
                    }
                ]
                }
            });
            // const responceObj = await transporter.sendMail({ ...mailOptions, to: payload.email, text: link });
            //             console.log(responceObj);

            res.send({ responceObj, msg: 'user updated ' });
            // res.send({  msg: 'user updated ' });

        }
    } catch (err) {
        console.log(err);
        res.status(500).send({ msg: 'Error in updating' })
    }
});





authRouter.put('/checkurl', async function (req, res) {
    const payload = req.body;
    const desiredUrlkey = payload.resetKey;
    const payloadcount = +payload.count;

    console.log(desiredUrlkey)
    try {
        const appUser = await AppUserModel.aggregate([
            {
                $match: {
                    "Urls.Urlkey": desiredUrlkey // Replace with your desired Urlkey value
                }
            },
            {
                $project: {
                    _id: 0,
                    matchingUrl: {
                        $filter: {
                            input: "$Urls",
                            as: "url",
                            cond: { $eq: ["$$url.Urlkey", desiredUrlkey] } // Replace with your desired Urlkey value
                        }
                    }
                }
            },
            {
                $unwind: "$matchingUrl"
            },
            {
                $project: {
                    "Urlkey": "$matchingUrl.Urlkey",
                    "Url": "$matchingUrl.Url",
                    "count":"$matchingUrl.count"
                }
            }
        ]);
        const appcount=+appUser[0].count;
const count = appcount+payloadcount;
        await AppUserModel.updateOne({ "Urls.Urlkey": desiredUrlkey }, {
            
                $set: {
                  "Urls.$.count": count // Replace 1 with the value you want to set as the new count
                }
              
        
    
});

        const Urlkey=appUser[0].Urlkey;
    //    console.log(Urlkey);
       const Url = appUser[0].Url;
    //    console.log(Url);
    //    const count=appUser[0].count;
       console.log(count);

        if (!appUser) {
            res.status(404).send({ msg: 'key not found' });
            console.log(payload);
        } else {
            if (desiredUrlkey === Urlkey) {
                res.status(200).send(appUser);
                console.log("True");

            } else {
                console.log("false");
                res.status(404).send("false");
            }
        }
    } catch {
        res.status(404).send({ msg: 'user not found 123' });
    }
})


export default authRouter;