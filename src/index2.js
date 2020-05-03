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
    
    socket.on('join', async (options, callback) => {
        // const {error, user} = await addUser({id: socket.id,...options})
        // if(error) {
        //     return callback(error)
        // }
        // const room = user.room
        // socket.join(room)
        socket.emit('message', generateMessage("Welcome to delaw's chat app", "Admin"))
        return
        socket.broadcast.to(room).emit('message', generateMessage(`${user.username} has joined!`, "Admin"))
        //socket.emit io.emit socket.broadcast.emit
        //io.to.emit socket.broadcast.to.emit
        io.to(room).emit('roomData', {
            room: room,
            users: getUsersInRoom(room)
        })

        callback()
    })

    socket.on('sendingMsg', ({message, room, username}, callback) => {
        const filter = new Filter()
        if(filter.isProfane(message)) {
            return callback('Profanity is not allowed')
        }
        console.log(message, room)
        io.to(room).emit('message', generateMessage(message, username))
        callback()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if(user) {
           io.to(user.room).emit('message', generateMessage(`${user.username} has left`, "Admin")) 
           io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
        
    })

    socket.on('sendLocation', (URL, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit("locationMessage", generateLocationMessage(URL, user.username))
        callback('Location shared')
    })
})

app.get("/api/socket", async (req, res) => {
    io.on('connection',  (socket) => {
        console.log("Websocket connection")
    
        socket.on('join', async (options, callback) => {
            const {error, user} = await addUser({id: socket.id,...options})
            if(error) {
                return callback(error)
            }
            const room = options.room
            socket.join(room)
            socket.emit('message', generateMessage("Welcome to delaw's chat app", "Admin"))
            socket.broadcast.to(room).emit('message', generateMessage(`${user.username} has joined!`, "Admin"))
            //socket.emit io.emit socket.broadcast.emit
            //io.to.emit socket.broadcast.to.emit
            io.to(room).emit('roomData', {
                room: room,
                users: getUsersInRoom(room)
            })
    
            callback()
        })
    
        
        socket.on('sendingMsg', (msg, callback) => {
            const filter = new Filter()
            const user = getUser(socket.id)
            console.log(user)
            if(filter.isProfane(msg)) {
                return callback('Profanity is not allowed')
            }
            
            io.to(user.room).emit('message', generateMessage(msg, user.username))
            callback()
        })
    
        socket.on('disconnect', () => {
            const user = removeUser(socket.id)
    
            if(user) {
               io.to(user.room).emit('message', generateMessage(`${user.username} has left`, "Admin")) 
               io.to(user.room).emit('roomData', {
                    room: user.room,
                    users: getUsersInRoom(user.room)
                })
            }
            
        })
    
        socket.on('sendLocation', (URL, callback) => {
            const user = getUser(socket.id)
            io.to(user.room).emit("locationMessage", generateLocationMessage(URL, user.username))
            callback('Location shared')
        })
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

server.listen(port, () => {
    console.log(`Application startred on port ${port}`)
})