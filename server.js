const express=require("express")
const cors=require("cors")
const mongoose=require("mongoose");
const nodemailer=require('nodemailer');
const { waitForDebugger } = require("inspector");
require("dotenv").config();



const server=express()
server.use(express.json()) 
server.use(express.urlencoded({ extended: true }))
server.use(cors())

mongoose
  .connect(process.env.MYURL)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.log(err);
  });

const userSchema=new mongoose.Schema({
    name:String,
    email:String,
    password:String,
    score:Number
})

const otpScheme=new mongoose.Schema({
    otp:String,
    email:String,
})

const User=new mongoose.model("users",userSchema);
const otpdata=new mongoose.model("otpdata",otpScheme);

server.post("/signup",(req,res)=>{
   const  {name , email, password,otp}=req.body;
   const score=0;
   otpdata.findOne({email:email}).then((user)=> {
    if(user.otp!==otp) {
       res.send("Invalid OTP");
    }
    else {
        const user=new User({
            name,
            email,
            password,
            score
        })
        user.save().then(res.send("SuccessFully Registered"));
    }})
 })
server.post("/makemail",async(req, res) => {
    const {email,name}=req.body;
    User.findOne({email:email}).then((user)=> {
        if(user) {
            res.send("Email Already Registered");
        }
        else {
        try{
        const otp=Math.floor(100000 + Math.random()*900000);
        const transport=nodemailer.createTransport({
            service:'gmail',
            host: 'smtp.gmail.com',
            port:'587',
            auth:{
                user: process.env.EMAIL,
                pass: process.env.PASSWORD
            },
            secureConnection: 'true',
            tls: {
                ciphers: 'SSLv3',
                rejectUnauthorized: false
            }
        });
        let matter= 'Hello ' + name + ' Here is your otp to Sign up  for NumberGame Website ' + otp + '  Please Dont Share with Anyone , Thank You';
        const mailOptions ={
         from:process.env.EMAIL,
         to :email,
         subject:"EMAIL FOR VERIFICATION",
         html:matter
        }
        otpdata.findOne({email:email}).then((user)=>{
           if(user) {
             user.otp=otp;
             user.save();
           }
           else {
            const newuser= new otpdata({
                email,
                otp
            })
            newuser.save();
           }
        })
        transport.sendMail(mailOptions,(err,info)=>{
         if(err) {
            res.send("Error in sending Mail");
         }
         else {
            res.send("OTP SENT Succesfully");
         }
        })
     }catch(err) {
       res.send(err);
     }
    }
})
})

server.post("/login",(req,res)=>{
    const  {email , password}=req.body;
    User.findOne({email:email}).then((user)=>{
        if(user) {
          if(password===user.password) {
            res.send({message : "Log in successFull",user:user});
          }
          else {
            res.send({message:"Incorrect Password"});
          }
        }
        else {
            res.send({message:"User not Found"})
        }
    }).catch((err) => console.log(err));
})

server.post("/forgotpassword",async(req, res) => {
  const {email}=req.body;
  User.findOne({email:email}).then((user)=> {
    if(user) {
      const name=user.name;
      try{
        const otp=Math.floor(100000 + Math.random()*900000);
        const transport=nodemailer.createTransport({
            service:'gmail',
            host: 'smtp.gmail.com',
            port:'587',
            auth:{
                user: process.env.EMAIL,
                pass: process.env.PASSWORD
            },
            secureConnection: 'true',
            tls: {
                ciphers: 'SSLv3',
                rejectUnauthorized: false
            }
        });
        let matter= 'Hello ' + name + ' Here is your otp to Reset Your Password for NumberGame Website ' + otp + '  Please Dont Share with Anyone , Thank You';
        const mailOptions ={
         from:process.env.EMAIL,
         to :email,
         subject:"EMAIL FOR VERIFICATION",
         html:matter
        }
        otpdata.findOne({email:email}).then((user)=>{
           if(user) {
             user.otp=otp;
             user.save();
           }
           else {
            const newuser= new otpdata({
                email,
                otp
            })
            newuser.save();
           }
        })
        transport.sendMail(mailOptions,(err,info)=>{
         if(err) {
            res.send("Error in sending Mail");
         }
         else {
            res.send("OTP SENT Succesfully");
         }
        })
     }catch(err) {
       res.send(err);
     }
    }
    else {
      res.send("No user Found");
    }
  })
})

server.post("/resetpassword",async(req,res)=>{
  const {email,password,otp}=req.body;
  otpdata.findOne({email:email}).then((user)=>{
    if(user) {
      if(user.otp===otp) {
        User.findOne({email:email}).then((user1)=>{
          if(user1){
            user1.password=password;
            user1.save().then(res.send("SuccessFull"));
          }
          else {
            res.send("Something went Wrong");
          }
        })
      }
      else {
        res.send("Incorrect OTP");
      }
    }
    else {
      res.send("Something went Wrong");
    }
  })
})

server.get("/getName/:email",(req,res)=>{
  const {email}=req.params;
  //console.log(email);
  User.find({email:email}).then((user)=>{
      if(user) {
          res.send(user);
      }
      else {
        res.send('Something Went Wrong');
      }
  });
})

server.post("/addscore",(req,res)=>{
  const {email,score}=req.body;
  User.findOne({email:email}).then((user)=>{
    if(user) {
      user.score+=score;
      user.save().then(res.send("Done"));
    }
    else {
      res.send("Something went wrong");
    }
  })
})

server.post("/getalldetails",async(req,res)=>{
  const records = await User.aggregate([
    { $sort: { score: -1 } },
    { $limit: 10 }
  ]);
  
  res.send({records});
})
server.listen((9009),()=>{
    console.log("server is running in 9009.");
})