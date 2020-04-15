const express = require("express")
const path = require("path")
const http = require("http")
const socketio = require("socket.io")
const Filter = require("bad-words")
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require("./utils/users")

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const PORT = process.env.PORT
const publicDir = path.join(__dirname, "../public")

app.use(express.static(publicDir))

io.on('connection', (socket) => {
    console.log("Websocket connection")

    socket.on('join', (options, callback) => {
        const {error, user} = addUser({id:socket.id, ...options})

        if(error) {
            return callback(error)
        }

        socket.join(user.room)
        socket.emit('message', generateMessage("Welcome to delaw's chat app", "Admin"))
        socket.broadcast.to(user.room).emit('message', generateMessage(`${user.username} has joined!`, "Admin"))
        //socket.emit io.emit socket.broadcast.emit
        //io.to.emit socket.broadcast.to.emit
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })

    socket.on('sendingMsg', (msg, callback) => {
        const filter = new Filter()

        if(filter.isProfane(msg)) {
            return callback('Profanity is not allowed')
        }
        const user = getUser(socket.id)
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

server.listen(3000, () => {
    console.log(`Application startred on port ${PORT}`)
})