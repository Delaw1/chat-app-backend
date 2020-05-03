const socket = io()

// Element
const $mesageForm = document.querySelector('#msgForm')
const $messageFormInput = document.querySelector('#msg')
const $messageFormButton = document.querySelector("#send-message")
const $locationButton = document.querySelector("#send-location")
const $messages = document.querySelector("#messages")

// Template
const messageTemplate = document.querySelector("#message-template").innerHTML
const locationTemplate = document.querySelector("#location-template").innerHTML
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML 

// Options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true })

const autoscroll = () => {
    // New  message element
    const $newMessage = $messages.lastElementChild

    // New message style
    const newMessageStyle = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyle.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of message container
    const containerHeight = $messages.scrollHeight

    // How far have i scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }

    // console.log(visibleHeight)
}

socket.on("message", (msg) => {
    const html = Mustache.render(messageTemplate, {
        message: msg.text,
        username: msg.username,
        createdAt: moment(msg.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on("locationMessage", (url) => {
    const html = Mustache.render(locationTemplate, {
        url: url.url,
        username: msg.username,
        createdAt: moment(url.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
})

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector("#sidebar").innerHTML = html
})

socket.on('sentMsg', (msg) => {
    console.log(msg)
})

$mesageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    // Disable send button
    $messageFormButton.setAttribute('disabled', 'disabled')

    const msg = e.target.elements.message.value
    socket.emit('sendingMsg', msg, (error) => {
        // Enable send button
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if(error) {
            return console.log(error)
        }
        console.log("Delivered")
    })
})

$locationButton.addEventListener('click', (e) => {
    // e.preventDefault()
    if(!navigator.geolocation) {
        return alert("Geolocation is not suppoted by this browser")
    }

    $locationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        const data = {
            latitude : position.coords.latitude,
            longitude: position.coords.longitude,
        }
        const URL = `https://google.com/maps?q=${position.coords.latitude},${position.coords.longitude}`
        socket.emit("sendLocation", URL, (message) => {
            $locationButton.removeAttribute('disabled')
            console.log(message)
        })
    })
})
 
socket.emit('join', { username, room }, (error) => {
    if(error) {
        alert(error)
        location.href = '/'
    }
    
})