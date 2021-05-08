import React from 'react'
import { Button, TextField } from '@material-ui/core'
import { SocketContext } from '../SocketContext'
import { useContext } from 'react'


function Chat() {
    const { message,setMessage,sendMessage,callAccepted,callEnded } = useContext(SocketContext)
   
    return (
       <>
        { callAccepted && !callEnded && (
            <form>
            <TextField 
            label="Send a Message"
            value={message}
            onChange = {(e) => setMessage(e.target.value)}
            fullWidth />
            <Button
            style={{ marginTop: 20}}
            variant="contained"
            color="primary"
            onClick = {sendMessage}
            fullWidth
            >Send</Button>
            </form>
           
        )}
        </>
    )
}

export default Chat
