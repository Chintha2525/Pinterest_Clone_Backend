require('dotenv').config()
const express = require("express")
const mongoose = require("mongoose")
const { CommentModel, PinModel, UserModel } = require("./schemas/schema")
const { validateRegisterInputs, validateLoginInputs } = require("./validator/validator")
const bcrypt = require('bcryptjs')
const cors = require("cors")

mongoose.connect(process.env.DB_URL)

const app = express()

app.use(cors())
app.use(express.json());

app.get("/", function (req, res) {
    res.send("<h1> Pinterest clone project.....</h1>");
});

// *******************************************USER ROUTES********************************************


//******** REGISTER USER *********

app.post("/register", async function (req, res) {
    try {
        const { fname, email, password, dob } = req.body;

        const { valid, errors } = validateRegisterInputs(
            fname,
            email,
            password,
            dob
        );

        if (!valid) {
            return res.status(400).send({ errors });
        }

        const foundUser = await UserModel.findOne({ email });

        if (foundUser) {
            return res.status(400).send({
                errors: {
                    email: 'Email address already exists!!! Proceed to Login.',
                },
            });
        }

        const hashedPassword = await bcrypt.hash(password, 13);

        const newUser = new UserModel({
            fname: fname,
            email: email,
            password: hashedPassword,
            dob: dob,
            savedPins: [],
        });

        await newUser.save();

        return res.status(200).send({
            message: 'User registered successfully! Proceed to Login.',
        });
    } catch (error) {
        console.log(error)
        if (error.code === 11000) {
            // Handle duplicate key error for fname
            return res.status(400).send({
                errors: {
                    name: 'This username is already taken. Please choose a different one.',
                },
                
            });
        } else {
            // Handle other errors
            return res.status(500).send({
                message: 'Internal Server Error',
                error: error.message,
            });
        }
    }
});


//******** LOGIN USER *********

app.post("/login", async function (req, res) {
    try {
        const { email, password } = req.body;
        const { valid, errors } = validateLoginInputs(email, password);

        if (!valid) {
            return res.status(400).send({ errors });
        }

        const foundUser = await UserModel.findOne({ email });

        if (!foundUser) {
            return res.status(400).send({
                errors: {
                    email: 'The email you entered does not belong to any account.',
                },
            });
        }

        const matchPassword = await bcrypt.compare(password, foundUser.password);

        if (!matchPassword) {
            return res.status(400).send({
                errors: {
                    password: 'The entered password is incorrect',
                },
            });
        }

        return res.status(200).send({
            ID: foundUser._id,
            email,
            Name: foundUser.fname,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).send({
            message: 'Internal Server Error',
            error: error.message,
        });
    }
});

//******** GET ALL USERS *********

app.get("/user", async function (req, res, next) {
    try {
        const users = await UserModel.find();
        res.status(200).json(users);
    } catch (err) {
        res.status(500).send(err)
    }
});

//******** GET SINGLE USER *********

app.get("/user/:id", async function (req, res, next) {
    try {
        const user = await UserModel.findById(req.params.id).populate('savedPins')
        res.status(200).json(user);
    } catch (err) {
        res.status(500).send(error)
    }
});





//******** UPDATE USERS *********

app.put("/update/user/:id", async function (req, res, next) {
    try {
        const updatedUser = await UserModel.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        ).populate('savedPins')
        res.status(200).json(updatedUser);
    } catch (error) {
        if (error.code === 11000 && error.keyPattern && error.keyPattern.fname === 1) {
            // Handle duplicate key error for fname
            return res.status(400).send({
                errors: {
                    username: 'This username is already taken. Please choose a different one.',
                },
            });
        } else {
            // Handle other errors
            return res.status(500).send({
                message: 'Internal Server Error',
                error: error.message,
            });
        }
    }

})


app.delete("/user/:id", async function (req, res, next) {
    try {
        await UserModel.findByIdAndDelete(req.params.id);
        res.status(200).send({
            message: "User has been deleted."
        });
    } catch (err) {
        return res.send({
            message: 'User does not exist'
        });
    }
});




// *******************************************PIN ROUTES********************************************

// ***************CREATE PINS*****************

app.post("/create", async function (req, res) {
    const { title, description, link, tags, extras, allow_comment, img_source } = req.body
    try {
        const newPin = new PinModel({
            title: title,
            description: description,
            link: link,
            img_source: img_source,
            tags: [...new Set(tags)],   
            extras: extras,
            allow_comment: allow_comment,
            comments: []
        })

        await newPin.save()
        return res.status(200).send({
            message: 'Pin Created successfully!',
        })
    } catch (error) {
        res.status(500).send(error)
    }

})

// ***************GET PINS*****************

app.get("/pin", async function (req, res) {
    try {
        const pins = await PinModel.find().populate(['comments', 'likes']);
        res.status(200).json(pins);
    } catch (err) {
        res.status(500).send(err)
    }
})

// ***************GET SINGLE PIN*****************

app.get("/pin/:id", async function (req, res) {
    try {
        const pin = await PinModel.findById(req.params.id).populate(['comments', 'likes'])

        res.status(200).json(pin);
    } catch (err) {
        res.status(500).send(err)
    }

})

// ***************EXPLORE PIN*****************

app.get("/v/explore", async function (req, res) {
    try {
        const pins = await PinModel.find({ tags: { $in: ['Explorepage'] } }).populate(['comments', 'likes']);
        // const pins=await Pin.find()
        res.status(200).json(pins)
    } catch (err) {
        res.status(500).json(err)
    }
})

// ***************CATEGORY PIN*****************

app.get("/category/:id", async function (req, res) {
    const pinId = req.params.id
    try {
        const ref = await PinModel.findById(pinId)
        const tags = ref.tags.filter((tag) => tag !== 'Explorepage');

        const pins = await PinModel.find(
            { tags: { $in: tags } }
        ).populate(['comments', 'likes']);
        const indexToRemove = pins.findIndex((pin) => pin._id.toString() === pinId);

        // If the index is found, remove the pin from the 'pins' array
        if (indexToRemove !== -1) {
            pins.splice(indexToRemove, 1);
        }

        res.status(200).json(pins)
    } catch (err) {
        res.status(500).json(err)
    }
})

// ***************SLIDE SHOW*****************

app.get("/unauth/slideshow", async function (req, res) {
    const pincat = {
        Traval: [],
        Anime: [],
        Car: [],
        Act: []
    }
    const category = ["Traval", "Anime", "Car", "Act"]
    try {
        for (var i of category) {
            const pin = await PinModel.find({ tags: { $in: [i] } }).populate(['comments', 'likes'])
            pincat[i] = pin
        }
        res.status(200).json(pincat)
    } catch (err) {
        res.status(500).json({ error: err })
    }
})

// ***************SEARCH PINS*****************

app.post("/search/:searchword", async function (req, res) {
    const searchkw = req.params.searchword
    try {

        const pin = await PinModel.find({
            $or: [
                { title: { $regex: new RegExp(searchkw, "i") } },
                { description: { $regex: new RegExp(searchkw, "i") } },
                { tags: { $in: [searchkw] } }
            ]
        }).populate(['comments', 'likes'])

        res.status(200).json(pin)
    } catch (err) {
        res.status(500).json({ error: err })
    }
})

// ***************SAVED PINS*****************

app.post("/savepin/:userId/:pinID", async function (req, res) {
    const userId = req.params.userId;
    const pinId = req.params.pinID;

    try {
        // Find the user and pin by their IDs
        const user = await UserModel.findById(userId);
        const pin = await PinModel.findById(pinId);
        console.log(user)
        console.log(pin)
        if (!user || !pin) {
            return res.status(404).send('User or pin not found');
        }

        // Add the pin to the user's savedPins array
        if (!user.savedPins.includes(pin._id)) {

            user.savedPins.push(pin);
            await user.save();
            res.status(200).send('Pin saved successfully');
        }
        else {

            res.status(200).send("Pin already saved")
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error saving pin');
    }
});


// *******************************************COMMENT ROUTES********************************************

//**************CREATE COMMENT*************** 

app.post("/comment/:pinId", async function (req, res) {
        const pinId  = req.params.pinId
        const newReview = new CommentModel({...req.body}) 
        
        try {
           const savedComment = await newReview.save()
     
           // after creating a new review now update the comment array of the tour 
           await PinModel.findByIdAndUpdate(pinId, {
              $push: {comments: savedComment._id}
           })
     
           res.status(200).json({success:true, message:"Comment submitted", data:savedComment})
        } catch (error) {
           res.status(500).json({success:false, message:"Failed to submit",data:error})
        }
});


// *******************************************LIKES ROUTES********************************************

//**************ADD LIKE*************** 

app.post("/like/:id", async function (req, res) {
    const pinId = req.params.id;
    const userId = req.body.userId; // Assuming you have user authentication in place
    try {
        const pin = await PinModel.findById(pinId);
        if (!pin) {
            return res.status(404).json({ error: 'Pin not found' });
        }

        if (!pin.likes.includes(userId)) {
            // Add the user's ID to the likes array if not already liked
            pin.likes.push(userId);
            await pin.save();
            res.status(200).json({ success: true, message: "Liked successfully", data: pin });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
})


//**************REMOVE LIKE*************** 

app.post("/like/delete/:id", async function (req, res) {
    const pinId = req.params.id
    const userId = req.body.userId
    try {
        const pin = await PinModel.findById(pinId);

        if (!pin) {
            return res.status(404).json({ error: 'Pin not found' });
        }
        if (pin.likes.includes(userId)) {
            pin.likes.pop(userId);
            await pin.save();
        }

        res.status(200).json({ success: true, message: "unLiked successfully", data: pin });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
})


app.listen(process.env.PORT, () => console.log(`servar started in localhost:${process.env.PORT}`));