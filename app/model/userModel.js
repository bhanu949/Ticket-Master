const mongoose = require('mongoose')
const bcryptjs = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Schema = mongoose.Schema

const usersSchema = new Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        minlength:4,
        maxlength:12
    },
    email:{
        type:String,
        unique:true,
        required:true
    },
    password:{
        type:String,
        required:true,
        minlength:6,
        maxlength:128
    },
    tokens:[
        {
            token:{
            type:String,
        },
        createdAt:{
            type:Date,
            default:Date.now()
        }
     }
    ]
})

usersSchema.pre('save', function(next){
    const user = this
    if(this.isNew){
        bcryptjs.genSalt(15)
        .then((salt)=>{
        bcryptjs.hash(user.password, salt)
            .then((encryptedPassword)=>{
                user.password = encryptedPassword
                next()
            })
    })
 }
 else{
     next()
 }
    
})

usersSchema.statics.findByCredentials=function(email,password){
    const User = this
    return User.findOne({email})
        .then((user)=>{
            if(!user){
                return Promise.reject({error:'Invalid Email / Password'})
            }
            return bcryptjs.compare(password, user.password)
                .then((result)=>{
                    if(result){
                        return Promise.resolve(user)
                    }
                    else{
                        return Promise.reject({error:'Invalid Email / Password '})
                    }
                })
        })
        .catch((err)=>{
           return Promise.reject(err)
        })
}

usersSchema.statics.findByToken=function(token){
    const User = this 
    let tokenData
    try{
        tokenData = jwt.verify(token, 'bhanu@123')
    }catch(err){
        return Promise.reject(err)
    }
   return User.findOne({
       _id:tokenData._id,
       'tokens.token':token
   })
}

usersSchema.methods.generateToken=function(){
    const user = this 
    const tokenData = {
        _id: user._id,
        username:user.username,
        createdAt:Number(new Date())
    }
    const token = jwt.sign(tokenData, 'bhanu@123')
    user.tokens.push({token})
    return user.save()
        .then((user)=>{
            return Promise.resolve(token)
        })
        .catch((err)=>{
            return Promise.reject(err)
        })
}

const User = mongoose.model('User', usersSchema)

module.exports = User

