const express = require("express")
const path = require("path")
const http = require("http")
const socketio = require("socket.io")
const Filter = require("bad-words")
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, addUserDB, removeUser, getUser, getUsersInRoom } = require("./utils/users")
require("./db/mongoose")
const Room = require("./model/room")
const User = require("./model/user")
const Messsages = require("./model/messages")
const cors = require("cors")
const auth = require("./middleware/auth")

const app = express()

const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT
const publicDir = path.join(__dirname, "../public")

app.use(express.json())
app.use(cors());

app.use(express.static(publicDir))



io.on('connection',  (socket) => {
    console.log("Websocket connection")
    
    socket.on('join', async ({ username, room }, callback) => {
        // console.log(room)
        socket.join(room)
        // socket.emit('message', generateMessage("Welcome to delaw chat app", "Admin"))
        
        socket.broadcast.to(room).emit('message', generateMessage(`${username} has joined!`, "Admin"))
        
        // io.to(room).emit('roomData', {
        //     room: room,
        //     users: getUsersInRoom(room)
        // })

        callback()
    })

    socket.on('sendingMsg', async ({message, room, sender}, callback) => {
        const filter = new Filter()
        if(filter.isProfane(message)) {
            return callback('Profanity is not allowed')
        }
        const msg = new Messsages({message, room_id: room._id, sender_id: sender._id})
        await msg.save()
        io.to(room.name).emit('message', generateMessage(message, sender.username))
        callback()
    })

    

})


app.post("/api/register", async (req, res) => {
    const user = new User(req.body)
    try {
        await user.save()
        const token = await user.generateAuthToken()
        return res.status(201).send({user, token})
    } catch(e) {
        return res.status(400).send(e)
    }
    
}) 

app.post("/api/login", async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.username, req.body.password)
        const token = await user.generateAuthToken()
        return res.status(200).send({user, token})
    } catch(e) {
        return res.status(400).send(e)
    }
})

app.post("/api/logout", auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()
        res.send()
    } catch(e) {
        return res.status(500).send(e)
    }
})

app.get("/api/users", auth, async (req, res) => {
    try {
        const users = await User.find({ _id: { $nin: req.user._id } })
        // if(!users) {
        //     throw new Error("No user yet")
        // }
        res.send(users)
    } catch(e) {
        res.status(400).send(e)
    }
})

app.post("/api/createroom", auth, async (req, res) => {

    const { user, body: user2 } = req
    try {
        let room = await Room.findOne({user1: { $in: [user._id, user2._id]}, user2: { $in: [user._id, user2._id]}})
        if(!room) {
            const roomToSave = new Room({name: `${user.username}_${user2.username}`, user1: user._id, user2: user2._id})
            room = await roomToSave.save()
        }
        return res.send({user: user2, room})
    } catch(e) {
        res.status(500).send()
    }
})

app.post("/api/getchat", auth, async (req, res) => {
    
    try {
        // res.send(req.body.room_id)
        // return
        console.log(req.body)
        const chat = await Messsages.find({room_id: req.body.room_id}).populate('sender_id', 'username -_id')
        
        res.send(chat)
    } catch(e) {
        res.status(400).send
    }
})

server.listen(port, () => {
    console.log(`Application startred on port ${port}`)
})