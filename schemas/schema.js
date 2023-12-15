const mongoose = require('mongoose')

const commentSchema = new mongoose.Schema(
  {
    pinId: {
      type: mongoose.Types.ObjectId,
      ref: "pins",
    },
    username: {
      type: String,
      required: true,
    },
    commentText: {
      type: String,
      required: true,
    }
  },
  { 
    collection: "comments",
    timestamps: true
  }
);




const pinSchema = new mongoose.Schema(
    {
        title : {
            type: String,
            required:true
        },
        link: String,
        img_source: {
            type: String,
            required:true
        },
        description : String,
        extras: String,
        tags: {
          type:  [String] ,
          default: []
        },
        allow_comment: {
            type:Boolean,
            default: false
        },
        comments:[{
            type: mongoose.Types.ObjectId,
            ref: "comments",
          }],
          likes:[{
            type:mongoose.Types.ObjectId,
            ref:"users"
          }]
    },
    {
        collections: "pins",
        timestamps: true,
    }
);



const userSchema = new mongoose.Schema(
    {
        fname:{ 
            type: String,
            unique: true
        },
        email: String,
        password: String,
        dob: String,
        savedPins: [{ type: mongoose.Types.ObjectId, ref: 'pins' }]
    },
    {
        collections:"users",
        timestamps: true,
    }
);

let CommentModel = mongoose.model("comments", commentSchema)

let PinModel = mongoose.model("pins", pinSchema)

let UserModel = mongoose.model("users", userSchema)


module.exports = { CommentModel, PinModel, UserModel }