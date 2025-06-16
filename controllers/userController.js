import { EntityId } from 'redis-om'
import { userRepository } from '../om/user.js'
import { verificationRepository }from "../om/verification.js"
// import Music from "../models/musicModel"
import bcrypt from "bcrypt"
import { sendMail } from "../models/emailModel.js"
import jwt from "jsonwebtoken"
// import unirest from "unirest"
import { validationResult } from "express-validator"
import { v2 as cloudinary } from 'cloudinary'
// import { response } from "express"
// import fs from "fs"
// import path from "path"

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

export const createUser = async (req, res) => {
  const errors = validationResult(req);
  if(!errors.isEmpty()) {
     let notification = errors
      .array()
      .map((err) => ({ title: err.msg, type: "error" }));
    res.json(notification);
  } else {
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(req.body.password, salt);
    const userData = {...req.body, password: hashedPassword}
    const user = await userRepository.save(userData)
    let random = Math.random().toString(36).slice(-8);
    const userWithId = {...user, _id: user[EntityId] }
    try {
      await userRepository.save(userWithId)
      await verificationRepository.save({
        authId: userWithId[EntityId],
        secretKey: random
      })
    } catch (err) { throw err }
    // verification email
    if (userWithId.verified !== true) {
      sendMail(
        userWithId.email,
        "verify email",
        `<pre>Hello and welcome to nöix!\n
Let's get inspired! \n
To verify your account please follow <a href="${process.env.CLIENT}/user/verify/${userWithId[EntityId]}.${random}">this link</a> \n
Enjoy the music, \n
Your nöix Team.</pre>`
      );
    }
    res.status(200).json({
      notification: {
        title: "Please, check your emails to verify your account.",
        type: "info",
        status: "ok"
      },
      
    })
  }
}

export const emailVerify = async (req, res) => {
  const id = req.params.authId
  const user = await userRepository.search().where('_id').equals(id).return.first();

  // const verification = await verificationRepository.search().return.all();
  // console.log(verification)

  const verification = await verificationRepository.search()
  .where('authId').equals(user._id).return.first();

  if (verification && verification?.authId) {
    user.verified = true
    await userRepository.save(user)
    try {
    verificationRepository.remove(verification[EntityId])
      res.writeHead(302, {
        location: process.env.CLIENT,
      });
      res.end();
    } catch (error) {
      throw error;
    }
  } else {
    res.json({
      notification: {
        title: "The verification was not successful.",
        type: "error",
      },
    });
  }
};

export const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.send(errors.array().map((err) => err.msg));
    console.log(errors.array());
  } else {
    const email = req.body.email
    const user = await userRepository.search()
    .where('email').equals(email).return.first();
    if(!user) {
      return res.json({
        notification: {
          title: "Please, enter a valid email address.",
          type: "error",
        },
      });
    } 
    if (user.verified !== true) {
      res.json({
        notification: {
          title: "Please, verify your account.",
          type: "info",
        },
      });
    }
    const passValid = bcrypt.compareSync(req.body.password, user.password);
    if(!passValid) {
      res.json({
        notification: {
          title: "Password and email do not match.",
          type: "error",
        },
      });
    } else {
      console.log('location', req.body.location.location)
      user.location = req.body.location.location;
      userRepository.save(user);
      const token = jwt.sign({ user: user }, process.env.ACCESS_TOKEN, {
        expiresIn: "1h",
      });
      res.cookie("token", token, {
        expires: new Date(Date.now() + 172800000),
        httpOnly: true
      })
      .status(200)
      .json({
        info: user,
        notification: {
          title: "You successfully logged in.",
          type: "success",
        }
      });
    }
  }
};

// const getNearByUsers = (req, res) => {
//   User.findById(req.user.result._id).then(result => {
//     User.find({
//       $and: [
//         { "location.city.name": result.location.city.name },
//         { genre: { $elemMatch: { $in: result.genre } } },
//       ],
//     })
//       .populate("music")
//       .then((result) => {
//         if(result && result.length > 0) {
//           res.status(200).json({result});
//         }
//         else {
//           res.json({result, notification: {title: "Select your favorite genres to see like-minded users nearby!", type: "info"}})
//         }
//       })
//       .catch((err) => console.log(err));
//   })
  
// };

export const googleAuthController = (req, res) => {
  let userData = req.body;
  userRepository.findOne({ email: userData.email }).populate('music').populate('liked_songs')
    .then((result) => {
      if (result) {
        const token = jwt.sign({ result }, process.env.ACCESS_TOKEN, {
          expiresIn: "1h",
        });

          User.findOneAndUpdate(
            { email: userData.email },
            { location: userData.location }
          ).populate('music').populate('liked_songs').then(() => {
            res
              .cookie("token", token, {
                expires: new Date(Date.now() + 172800000),
                httpOnly: true
              })
              .status(200)
              .json({
                notification: {
                  title: "You successfully logged in.",
                  type: "success",
                },
                result,
              });
          });
      } else {   
          User.create(userData)
            .then((result) => {
              const token = jwt.sign({ result }, process.env.ACCESS_TOKEN, {
                expiresIn: "1h",
              });
              res
                .cookie("token", token, {
                  expires: new Date(Date.now() + 172800000),
                  httpOnly: true
                })
                .json({
                  notification: {
                    title: "You successfully logged in.",
                    type: "success",
                  },
                  result
                });
            })
            .catch((err) => console.log(err));
      }
    })
    .catch((err) => console.log(err));
};

export const logout = (req, res, next) => {
  res.clearCookie("token").json({
    notification: {
      title: "You successfully logged out.",
      type: "success",
    },
  });
};

export const profileUpdate = async (req, res) => {

    const user = await userRepository.fetch(req.params.id)
  
    user.email = req.body.email ?? null
    user.password = req.body.password ?? null
    user.verified = req.body.verified ?? null
    user.genre = req.body.genre ?? null
    user.instruments = req.body.instruments ?? null
    user.likedSongs = req.body.likedSongs ?? null
    user.introText = req.body.introText ?? null
    user.location = req.body.location ?? null
    user.music = req.body.music ?? null
    user.contacts = req.body.contacts ?? null
  
    await userRepository.save(user)
  
    res.send(user)
    const id = req.user.result._id;
    const update = {
    genre: req.body.genre,
    instrument: req.body.instrument,
  };
  res.status(200).json(result);
};
export const showUser = async (req, res) => {
  const user = await userRepository.fetch(req.body._id);
  res.send(user);
}
export const deleteUser = async (req, res) => {
  const user = await userRepository.fetch(req.params.id);
  if(user){
    await userRepository.remove(user[EntityId])
    res.send({ entityId: user[EntityId] })
  } else {
    res.json({
      notification: {
        title: "Please, enter a registered email address.",
        type: "error",
      },
    });
  }
}

// const profileUpdateName = (req, res) => {
//   const id = req.user.result._id;
//   const name = {
//     username: req.body.username
//   }
//   User.findByIdAndUpdate(id, name, {new: true}).populate('music').populate('liked_songs')
//   .then((result) => {
//     res.status(200).json(result)
//   }).catch(err => console.log(err))
// }


// const checkGenreByUser = (req, res) => {
//   User.findOne({ _id: req.user.result._id })
//     .then((result) => {
//       res.status(200).json(result);
//     })
//     .catch((err) => {
//       console.log(err);
//     });
// };

// const pictureUpdate = (req, res) => {
//   let fileName = req.file.originalname;
//   let uploadLocation = path.join(__dirname + "/../uploads/" + fileName);

//   fs.writeFileSync(
//     uploadLocation,
//     Buffer.from(new Uint8Array(req.file.buffer))
//   );

//   cloudinary.uploader.upload(
//     uploadLocation,
//     {
//       resource_type: "image",
//       folder: `images/`,
//       public_id: fileName,
//       overwrite: true,
//     },
//     (error, result) => {
//       if (error) res.status(500).json(error);
//       else {
//         fs.unlink(uploadLocation, (deleteError) => {
//           if (deleteError) res.status(500).send(deleteError);
//           let resultUrl = result.secure_url;
//           User.findOneAndUpdate(
//             { _id: req.user.result._id },
//             { image: resultUrl }, {new: true}
//           ).populate('music').populate('liked_songs')
//             .then((result) => {
//               res.status(200).json({
//                 result,
//                 notification: {
//                   title: "successfully updated profile picture",
//                   type: "success",
//                 },
//               });
//             })
//             .catch((err) => {
//               console.log(err);
//             });
//         });
//       }
//     }
//   );
// };

// const addToLikedSongs = (req, res) => {
//   const songToLike = req.body
//   User.findById(req.user.result._id).then(result => {
//     if(!result.liked_songs.includes(songToLike._id)) {
//       User.findByIdAndUpdate(req.user.result._id, {$push: {liked_songs: songToLike._id}}, {new: true}).populate('liked_songs').populate('music').then(data => {
//         res.json({data, notification: {title: 'You added a new favorite song.', type: 'success'}})
//       })
//     }
//     else {
//       User.findByIdAndUpdate(req.user.result._id, {$pull: {liked_songs: songToLike._id}}, {new: true}).populate('liked_songs').populate('music').then(data => {
//         res.json({data, notification: {title: 'You deleted a favorite song.', type: 'success'}})
//       })
//     }
//   })
// }

// const introTextUpdate = (req, res) => {
//   let newText = req.body;
//   User.findByIdAndUpdate(req.user.result._id, newText, {new: true})
//   .populate('music').populate('liked_songs')
//             .then((result) => {
//               res.json({
//                 result,
//                 notification: {
//                   title: "successfully updated your info text",
//                   type: "success",
//                 },
//               });
//             })
//             .catch((err) => {
//               console.log(err);
//             });
// }

// const removeFromLikedSongs = (req, res) => {
//   let song = req.body

//    User.findByIdAndUpdate(req.user.result._id, {$pull: {liked_songs: song._id}}, {new: true}).populate('liked_songs').populate('music').then(data => {
//    res.json({data, notification: {title: 'You deleted a favorite song.', type: 'success'}})
//   })
// }

// const getAllMyContacts = (req, res) => {
//   User.findById(req.user.result._id).populate('music').populate('liked_songs')
//   .then(result => {
//     res.json(result)
//   })
// }

// const addContact = (req, res) => {
//   const contact = req.body;
//   User.findById(req.user.result._id).then(result => {
//     if(!result.contacts.includes(contact.contactId)) {
//       User.findByIdAndUpdate(req.user.result._id, {$push: {contacts: contact.contactId}}, {new: true}).populate('liked_songs').populate('music').populate('contacts').then(data => {
//         res.json({data, notification: {title: 'You added a new contact.', type: 'success'}})
//       })
//     }
//   })
// }