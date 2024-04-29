const express=require("express");
const dotenv=require('dotenv')
const {chats}=require('./data/data');
const connectDB = require("./config/db");
const colors=require('colors')
const userRoutes=require('./routes/userRoutes')
const chatRoutes=require('./routes/chatRoutes')
const messageRoutes=require('./routes/messageRoutes')
const cors=require('cors');
const { errorHandler, notFound } = require("./middleware/errorMiddleware");
const path=require('path')

const app=express()
dotenv.config();
connectDB();

app.use(cors());
app.use(express.json());
 

// app.get('/',(req ,res)=>{
//     res.send("api is running")
// })
app.use('/api/user',userRoutes)
app.use('/api/chat',chatRoutes);
app.use('/api/message',messageRoutes);


// --------------------deployment----------------

const __dirname1 = path.resolve();

if (process.env.NODE_ENV === "production") {
    
  app.use(express.static(path.join(__dirname1, "/frontend/build")));

  app.get("*", (req, res) =>{
    res.sendFile(path.resolve(__dirname1, "frontend", "build", "index.html"))
  
});
  
} else {
    console.log("ghjhg")
  app.get("/", (req, res) => {
    res.send("API is running here..");
  });
}

// --------------------deployment--------------


app.use(notFound)
app.use(errorHandler)


const PORT=process.env.PORT || 7000;

const server=app.listen(PORT,console.log("server is running on port 7000".white.bgYellow));
const io=require('socket.io')(server,{
    pingTimeout:60000,
    cors:{
        origin:"http://localhost:3000"
    },
});

io.on("connection",(socket)=>{
    console.log("connected to socket.io")

    socket.on('setup',(userData)=>{
        socket.join(userData._id);
    
        socket.emit('connected')
    })

    socket.on('join chat', (room)=>{
        socket.join(room);
        console.log("User Joined Room: "+room);
    });


    socket.on("new message", (newMessageRecieved) => {
       var chat = newMessageRecieved.chat;

       if (!chat.users) return console.log("chat.users not defined");

       chat.users.forEach((user) => {
        if (user._id == newMessageRecieved.sender._id) return;

        socket.in(user._id).emit("message recieved", newMessageRecieved);
    });
  });

   socket.on("typing", (room) =>socket.in(room).emit("typing"));
  
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

   socket.off("setup", () => {
    console.log("USER DISCONNECTED");
    socket.leave(userData._id);
  });
})
