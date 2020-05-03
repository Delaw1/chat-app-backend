const Room = require("../model/room")
const User = require("../model/user")
const users = []

const saveUser = async (username, room_id) => {
    const user = new User({ username, room_id})
    let newUser = await user.save()
    newUser = await newUser.populate('room_id').execPopulate()
    return {
        user: newUser
    }
}

const addUserDB = async ({username, room}) => {
    // Clean the data
    username = username.trim().toLowerCase()
    room = room.trim().toLowerCase()

    // Validate the data
    if(!username || !room) {
        return {
            error: "Username and room are required"
        }
    }

    const existingRoom = await Room.findOne({name: room}) 
    if(existingRoom) {
        const existingUser = await User.findOne({username})
        if(existingUser) {
            return {
                error: "Username already existing for this room"
            }
        }
        return await saveUser(username, existingRoom._id)
        // const user = new User({ username, room_id: existingRoom._id})
        // let newUser = await user.save()
        // newUser = await newUser.populate('room_id').execPopulate()
        // return {
        //     user: newUser
        // }
    }
    const roomToSave= new Room({name: room})
    const newRoom = await roomToSave.save()
    return await saveUser(username, newRoom._id)
    // const user = new User({ username, room_id: newRoom._id})
    // let newUser = await user.save()
    // newUser = await newUser.populate('room_id').execPopulate()
    // return {
    //     user: newUser
    // }
}
const addUser = ({ id, username, room }) => {
    // Clean the data
    username = username.trim().toLowerCase()
    room = room.trim().toLowerCase()

    // Validate the data
    if(!username || !room) {
        return { 
            error: "Username and room are required"
        }
    }

    // Check for uniqueness
    const existingUser = users.find((user) => {
        return user.room === room && user.username === username
    })

    // validate Username
    if(existingUser) {
        return {
            error: "Username already exist"
        }
    }

    // Store user
    const user = { id, username, room }
    users.push(user)
    return { user }
}

const removeUser = (id) => {
    const index = users.findIndex((user) => user.id === id)

    if(index != -1) {
        return users.splice(index, 1)[0]
    }
}

const getUser = (id) => {
    return users.find((user) => user.id === id)
}

const getUsersInRoom = (room) => {
    room = room.trim().toLowerCase()
    return users.filter(user => user.room === room)
}

module.exports = {
    addUser,
    addUserDB,
    removeUser,
    getUser,
    getUsersInRoom
}